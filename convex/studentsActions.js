'use node'

import { v, ConvexError } from 'convex/values'
import { action, internalAction } from './_generated/server'
import { internal } from './_generated/api'
import { hashPassword, verifyPassword } from './lib/passwords'
import { encryptPassword, decryptPassword } from './lib/passwordVault'
import { generateStudentLogin } from '../src/shared/lib/credentials'

/** Returns the plaintext login/password once so the teacher can hand them to the student —
 * only the hash is ever persisted. Password always equals the login, so students only need
 * to remember one string. */
export const create = action({
  args: { token: v.string(), groupId: v.id('groups'), fullName: v.string() },
  handler: async (ctx, { token, groupId, fullName }) => {
    await ctx.runQuery(internal.groups.requireGroupOwnerToken, { token, groupId })

    const existingLogins = await ctx.runQuery(internal.students.listLogins, {})
    const login = generateStudentLogin(fullName, existingLogins)
    const passwordHash = hashPassword(login)

    const id = await ctx.runMutation(internal.students.insertStudent, { groupId, fullName, login, passwordHash })
    return { id, login, password: login }
  },
})

/** One-time admin fix — not reachable from the client. Repairs a student row whose
 * passwordHash was set directly (e.g. via the dashboard) instead of through `create`. Run via:
 * npx convex run studentsActions:resetStudentPassword '{"login":"afruz","password":"afruz"}' */
export const resetStudentPassword = internalAction({
  args: { login: v.string(), password: v.string() },
  handler: async (ctx, { login, password }) => {
    const student = await ctx.runQuery(internal.students.getByLogin, { login })
    if (!student) return { ok: false, error: 'Student not found' }
    // ends every session of this student, so whoever else was signed in is out
    await ctx.runMutation(internal.students.savePassword, {
      studentId: student._id,
      passwordHash: hashPassword(password),
      passwordEnc: encryptPassword(password),
    })
    return { ok: true }
  },
})

/** One-time admin fix — not reachable from the client. Resets every existing student's
 * password to match their login. Run via:
 * npx convex run studentsActions:syncAllPasswordsToLogin '{}' */
export const syncAllPasswordsToLogin = internalAction({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.runQuery(internal.students.listIdsAndLogins, {})
    for (const student of students) {
      const passwordHash = hashPassword(student.login)
      await ctx.runMutation(internal.students.updatePasswordHash, { id: student.id, passwordHash })
    }
    return { ok: true, count: students.length }
  },
})

function checkNewPassword(password, login) {
  if (password.length < 6) throw new ConvexError("Parol kamida 6 ta belgidan iborat bo'lsin")
  if (password.length > 64) throw new ConvexError('Parol juda uzun (64 belgigacha)')
  if (/\s/.test(password)) throw new ConvexError("Parolda bo'sh joy bo'lmasin")
  if (password.toLowerCase() === login.toLowerCase()) throw new ConvexError("Parol login bilan bir xil bo'lmasin")
}

/** The student changes their own password. Every other device signed in to this account is
 * signed out; the device that made the change stays signed in. */
export const changeMyPassword = action({
  args: { token: v.string(), currentPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, { token, currentPassword, newPassword }) => {
    const me = await ctx.runQuery(internal.students.getMyPasswordContext, { token })
    if (!verifyPassword(currentPassword, me.passwordHash)) throw new ConvexError("Joriy parol noto'g'ri")
    checkNewPassword(newPassword, me.login)
    if (newPassword === currentPassword) throw new ConvexError("Yangi parol eskisidan farq qilsin")

    return await ctx.runMutation(internal.students.savePassword, {
      studentId: me.studentId,
      passwordHash: hashPassword(newPassword),
      passwordEnc: encryptPassword(newPassword),
      keepToken: token,
    })
  },
})

/** Center admin (director / edu_admin) reads a student's current password. */
export const revealPassword = action({
  args: { token: v.string(), studentId: v.id('students') },
  handler: async (ctx, { token, studentId }) => {
    const row = await ctx.runQuery(internal.students.getPasswordForAdmin, { token, studentId })
    if (row.passwordEnc) {
      return { password: decryptPassword(row.passwordEnc), changedAt: row.passwordChangedAt, initial: false }
    }
    // never changed: the initial password is the login — confirm against the hash
    if (verifyPassword(row.login, row.passwordHash)) return { password: row.login, changedAt: null, initial: true }
    return { password: null, changedAt: null, initial: false }
  },
})

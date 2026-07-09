'use node'

import { v } from 'convex/values'
import { action, internalAction } from './_generated/server'
import { internal } from './_generated/api'
import { hashPassword } from './lib/passwords'
import { generateStudentLogin, generateStudentPassword } from '../src/shared/lib/credentials'

/** Returns the plaintext login/password once so the teacher can hand them to the student —
 * only the hash is ever persisted. */
export const create = action({
  args: { token: v.string(), groupId: v.id('groups'), fullName: v.string() },
  handler: async (ctx, { token, groupId, fullName }) => {
    await ctx.runQuery(internal.auth.requireTeacherToken, { token })

    const existingLogins = await ctx.runQuery(internal.students.listLogins, {})
    const login = generateStudentLogin(fullName, existingLogins)
    const password = generateStudentPassword()
    const passwordHash = hashPassword(password)

    const id = await ctx.runMutation(internal.students.insertStudent, { groupId, fullName, login, passwordHash })
    return { id, login, password }
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
    const passwordHash = hashPassword(password)
    await ctx.runMutation(internal.students.updatePasswordHash, { id: student._id, passwordHash })
    return { ok: true }
  },
})

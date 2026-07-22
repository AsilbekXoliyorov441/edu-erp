'use node'

import { v } from 'convex/values'
import { action } from './_generated/server'
import { internal } from './_generated/api'
import { hashPassword } from './lib/passwords'

/** Shared by `createTeacher`/`createEduAdmin`: authorizes the caller (via
 * `teachers.requireStaffCreator`, which enforces director-only for `edu_admin`), checks the
 * username is free, hashes the password, and inserts the new staff row into the caller's
 * center. Returns the plaintext password once so the creator can hand it to the new user —
 * only the hash is ever persisted. */
async function createStaff(ctx, { token, username, password, fullName, role }) {
  const { centerId } = await ctx.runQuery(internal.teachers.requireStaffCreator, { token, newRole: role })

  const trimmedUsername = username.trim()
  const existing = await ctx.runQuery(internal.auth.getTeacherByUsername, { username: trimmedUsername })
  if (existing) return { ok: false, error: 'Bu username band' }

  const passwordHash = hashPassword(password)
  const id = await ctx.runMutation(internal.auth.insertTeacher, {
    username: trimmedUsername,
    passwordHash,
    fullName,
    role,
    centerId,
  })
  return { ok: true, id, username: trimmedUsername, password }
}

/** Director or EduSuperAdmin: creates a new plain `teacher` account in their own center. */
export const createTeacher = action({
  args: { token: v.string(), username: v.string(), password: v.string(), fullName: v.string() },
  handler: async (ctx, args) => createStaff(ctx, { ...args, role: 'teacher' }),
})

/** Director-only: creates a new `edu_admin` (EduSuperAdmin) account in their own center. */
export const createEduAdmin = action({
  args: { token: v.string(), username: v.string(), password: v.string(), fullName: v.string() },
  handler: async (ctx, args) => createStaff(ctx, { ...args, role: 'edu_admin' }),
})

/** Platform SuperAdmin-only: creates the one `director` account for a given center. Refuses
 * if that center already has a director. */
export const createDirector = action({
  args: { token: v.string(), centerId: v.id('centers'), username: v.string(), password: v.string(), fullName: v.string() },
  handler: async (ctx, { token, centerId, username, password, fullName }) => {
    await ctx.runQuery(internal.auth.requirePlatformAdminToken, { token })

    const hasDirector = await ctx.runQuery(internal.teachers.centerHasDirector, { centerId })
    if (hasDirector) return { ok: false, error: 'Bu markazda direktor allaqachon mavjud' }

    const trimmedUsername = username.trim()
    const existing = await ctx.runQuery(internal.auth.getTeacherByUsername, { username: trimmedUsername })
    if (existing) return { ok: false, error: 'Bu username band' }

    const passwordHash = hashPassword(password)
    const id = await ctx.runMutation(internal.auth.insertTeacher, {
      username: trimmedUsername,
      passwordHash,
      fullName,
      role: 'director',
      centerId,
    })
    return { ok: true, id, username: trimmedUsername, password }
  },
})

/** Director/EduSuperAdmin: resets another staff member's password within their own center
 * (never a director's — that goes through the platform SuperAdmin). Returns the new
 * plaintext value once. */
export const resetTeacherPassword = action({
  args: { token: v.string(), teacherId: v.id('teachers'), newPassword: v.string() },
  handler: async (ctx, { token, teacherId, newPassword }) => {
    await ctx.runQuery(internal.teachers.requireManageableTeacher, { token, teacherId })
    const passwordHash = hashPassword(newPassword)
    await ctx.runMutation(internal.teachers.updatePasswordHash, { id: teacherId, passwordHash })
    return { ok: true, password: newPassword }
  },
})

/** Director-only: promotes a `teacher` to `edu_admin` or demotes an `edu_admin` back to
 * `teacher`, within the caller's own center. Never touches a `director` row. */
export const setSuperAdmin = action({
  args: { token: v.string(), teacherId: v.id('teachers'), isSuperAdmin: v.boolean() },
  handler: async (ctx, { token, teacherId, isSuperAdmin }) => {
    const { callerRole } = await ctx.runQuery(internal.teachers.requireManageableTeacher, { token, teacherId })
    if (callerRole !== 'director') return { ok: false, error: "Faqat direktor EduSuperAdmin tayinlay oladi" }

    await ctx.runMutation(internal.teachers.updateRole, { id: teacherId, role: isSuperAdmin ? 'edu_admin' : 'teacher' })
    return { ok: true }
  },
})

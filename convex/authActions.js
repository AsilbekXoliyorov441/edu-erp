'use node'

import { v } from 'convex/values'
import { action, internalAction } from './_generated/server'
import { internal } from './_generated/api'
import { hashPassword, verifyPassword, generateToken } from './lib/passwords'

export const loginTeacher = action({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, { username, password }) => {
    const teacher = await ctx.runQuery(internal.auth.getTeacherByUsername, { username: username.trim() })
    if (!teacher || !verifyPassword(password, teacher.passwordHash)) {
      return { ok: false, error: "Login yoki parol noto'g'ri" }
    }

    if (teacher.role === 'platform_admin') {
      const token = generateToken()
      await ctx.runMutation(internal.auth.createSession, { token, role: 'teacher', userId: teacher._id })
      return {
        ok: true,
        token,
        role: 'platform_admin',
        userId: teacher._id,
        fullName: teacher.fullName,
        username: teacher.username,
        isSuperAdmin: false,
        isDirector: false,
        centerId: null,
        centerName: null,
      }
    }

    const center = teacher.centerId ? await ctx.runQuery(internal.auth.getCenterById, { centerId: teacher.centerId }) : null
    if (!center || center.status === 'suspended' || center.subscriptionEndsAt < new Date().toISOString()) {
      return { ok: false, error: "Markazingiz faoliyati to'xtatilgan. Administratorga murojaat qiling." }
    }

    const tenantRole = teacher.role ?? (teacher.isSuperAdmin ? 'director' : 'teacher')
    const token = generateToken()
    await ctx.runMutation(internal.auth.createSession, { token, role: 'teacher', userId: teacher._id })
    return {
      ok: true,
      token,
      role: 'teacher',
      tenantRole,
      userId: teacher._id,
      fullName: teacher.fullName,
      username: teacher.username,
      isSuperAdmin: tenantRole === 'director' || tenantRole === 'edu_admin',
      isDirector: tenantRole === 'director',
      centerId: teacher.centerId,
      centerName: center.name,
      coinPriceSom: center.coinPriceSom ?? null,
    }
  },
})

export const loginStudent = action({
  args: { login: v.string(), password: v.string() },
  handler: async (ctx, { login, password }) => {
    const student = await ctx.runQuery(internal.students.getByLogin, { login: login.trim() })
    if (!student || student.status !== 'active' || !verifyPassword(password, student.passwordHash)) {
      return { ok: false, error: "Login yoki parol noto'g'ri" }
    }
    const token = generateToken()
    await ctx.runMutation(internal.auth.createSession, { token, role: 'student', userId: student._id })
    return { ok: true, token, role: 'student', userId: student._id, fullName: student.fullName }
  },
})

/** One-time bootstrap — not reachable from the client. Run via:
 * npx convex run authActions:seedTeacher '{"username":"ustoz","password":"ustoz2024","fullName":"Sardor Aliyev"}' */
export const seedTeacher = internalAction({
  args: { username: v.string(), password: v.string(), fullName: v.string() },
  handler: async (ctx, { username, password, fullName }) => {
    const existing = await ctx.runQuery(internal.auth.getTeacherByUsername, { username })
    if (existing) return { ok: false, error: 'Teacher already exists' }
    const passwordHash = hashPassword(password)
    await ctx.runMutation(internal.auth.insertTeacher, { username, passwordHash, fullName })
    return { ok: true }
  },
})

/** One-time bootstrap of the platform SuperAdmin account — the single top-level login that
 * manages education centers. Not reachable from the client; refuses to run if a
 * `platform_admin` already exists. Run once, right after `migrations:bootstrapMultiTenant`,
 * via: npx convex run authActions:bootstrapPlatformAdmin
 * '{"username":"...","password":"...","fullName":"..."}' */
export const bootstrapPlatformAdmin = internalAction({
  args: { username: v.string(), password: v.string(), fullName: v.string() },
  handler: async (ctx, { username, password, fullName }) => {
    const existingUsername = await ctx.runQuery(internal.auth.getTeacherByUsername, { username: username.trim() })
    if (existingUsername) return { ok: false, error: 'Bu username band' }

    const alreadyExists = await ctx.runQuery(internal.teachers.platformAdminExists, {})
    if (alreadyExists) return { ok: false, error: 'Platforma SuperAdmin allaqachon mavjud' }

    const passwordHash = hashPassword(password)
    await ctx.runMutation(internal.auth.insertTeacher, {
      username: username.trim(),
      passwordHash,
      fullName,
      role: 'platform_admin',
    })
    return { ok: true, username: username.trim() }
  },
})

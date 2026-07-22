import { query, mutation, internalQuery, internalMutation } from './_generated/server'
import { v } from 'convex/values'
import { resolveSession, requireTeacher } from './lib/authz'
import { requireSuperAdmin, requirePlatformAdmin } from './lib/scoping'

export const getTeacherByUsername = internalQuery({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    return await ctx.db
      .query('teachers')
      .withIndex('by_username', (q) => q.eq('username', username))
      .unique()
  },
})

export const insertTeacher = internalMutation({
  args: {
    username: v.string(),
    passwordHash: v.string(),
    fullName: v.string(),
    isSuperAdmin: v.optional(v.boolean()),
    role: v.optional(
      v.union(v.literal('platform_admin'), v.literal('director'), v.literal('edu_admin'), v.literal('teacher'))
    ),
    centerId: v.optional(v.id('centers')),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('teachers', args)
  },
})

export const createSession = internalMutation({
  args: {
    token: v.string(),
    role: v.union(v.literal('teacher'), v.literal('student')),
    userId: v.union(v.id('teachers'), v.id('students')),
  },
  handler: async (ctx, { token, role, userId }) => {
    await ctx.db.insert('sessions', { token, role, userId, createdAt: Date.now() })
  },
})

/** Used from the login action (a Node action, no `ctx.db`) to block sign-in for a
 * suspended/expired center before a session token is ever issued. */
export const getCenterById = internalQuery({
  args: { centerId: v.id('centers') },
  handler: async (ctx, { centerId }) => {
    return await ctx.db.get(centerId)
  },
})

/** Used from Node actions (which have no `ctx.db`) to enforce the teacher role before hashing/writing. */
export const requireTeacherToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireTeacher(ctx, token)
  },
})

/** Used from Node actions (which have no `ctx.db`) to enforce the center-admin role
 * (director/edu_admin). */
export const requireSuperAdminToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireSuperAdmin(ctx, token)
  },
})

/** Used from Node actions (which have no `ctx.db`) to enforce the platform SuperAdmin role. */
export const requirePlatformAdminToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requirePlatformAdmin(ctx, token)
  },
})

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await resolveSession(ctx, token)
    if (session) await ctx.db.delete(session._id)
  },
})

async function centerSummary(ctx, centerId) {
  const center = centerId ? await ctx.db.get(centerId) : null
  const centerActive = !!center && center.status === 'active' && center.subscriptionEndsAt >= new Date().toISOString()
  return {
    centerId: centerId ?? null,
    centerName: center?.name ?? null,
    centerActive,
    coinPriceSom: center?.coinPriceSom ?? null,
  }
}

export const whoAmI = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    const session = await resolveSession(ctx, token)
    if (!session) return null

    if (session.role === 'teacher') {
      const teacher = await ctx.db.get(session.userId)
      if (!teacher) return null

      if (teacher.role === 'platform_admin') {
        return {
          role: 'platform_admin',
          userId: session.userId,
          fullName: teacher.fullName,
          username: teacher.username,
          isSuperAdmin: false,
          isDirector: false,
          centerId: null,
          centerName: null,
          centerActive: true,
        }
      }

      const tenantRole = teacher.role ?? (teacher.isSuperAdmin ? 'director' : 'teacher')
      return {
        role: 'teacher',
        tenantRole,
        userId: session.userId,
        fullName: teacher.fullName,
        username: teacher.username,
        isSuperAdmin: tenantRole === 'director' || tenantRole === 'edu_admin',
        isDirector: tenantRole === 'director',
        ...(await centerSummary(ctx, teacher.centerId)),
      }
    }

    const student = await ctx.db.get(session.userId)
    if (!student || student.status !== 'active') return null
    const group = await ctx.db.get(student.groupId)
    const owner = group?.teacherId ? await ctx.db.get(group.teacherId) : null
    return {
      role: 'student',
      userId: session.userId,
      fullName: student.fullName,
      ...(await centerSummary(ctx, owner?.centerId)),
    }
  },
})

export const updateTeacherProfile = mutation({
  args: { token: v.string(), fullName: v.string() },
  handler: async (ctx, { token, fullName }) => {
    const session = await requireTeacher(ctx, token)
    await ctx.db.patch(session.userId, { fullName })
  },
})

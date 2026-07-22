import { query, internalQuery, internalMutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { getScope, requireSuperAdmin } from './lib/scoping'

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await requireSuperAdmin(ctx, token)
    const caller = await ctx.db.get(session.userId)
    const teachers = await ctx.db
      .query('teachers')
      .withIndex('by_center', (q) => q.eq('centerId', caller.centerId))
      .collect()
    const groups = await ctx.db.query('groups').collect()
    return teachers.map((t) => ({
      id: t._id,
      username: t.username,
      fullName: t.fullName,
      tenantRole: t.role ?? (t.isSuperAdmin ? 'director' : 'teacher'),
      isSuperAdmin: t.role === 'director' || t.role === 'edu_admin' || !!t.isSuperAdmin,
      groupCount: groups.filter((g) => g.teacherId === t._id).length,
    }))
  },
})

/** Used from Node actions (which have no `ctx.db`) to write the new password hash. */
export const updatePasswordHash = internalMutation({
  args: { id: v.id('teachers'), passwordHash: v.string() },
  handler: async (ctx, { id, passwordHash }) => {
    await ctx.db.patch(id, { passwordHash })
  },
})

export const platformAdminExists = internalQuery({
  args: {},
  handler: async (ctx) => {
    const teachers = await ctx.db.query('teachers').collect()
    return teachers.some((t) => t.role === 'platform_admin')
  },
})

export const centerHasDirector = internalQuery({
  args: { centerId: v.id('centers') },
  handler: async (ctx, { centerId }) => {
    const teachers = await ctx.db
      .query('teachers')
      .withIndex('by_center', (q) => q.eq('centerId', centerId))
      .collect()
    return teachers.some((t) => t.role === 'director')
  },
})

/** Authorizes creating a new center-scoped staff member (`teacher` or `edu_admin`) and
 * returns the caller's `centerId` to stamp onto the new row. `edu_admin` targets require a
 * `director` caller; `teacher` targets accept either `director` or `edu_admin`. */
export const requireStaffCreator = internalQuery({
  args: { token: v.string(), newRole: v.union(v.literal('teacher'), v.literal('edu_admin')) },
  handler: async (ctx, { token, newRole }) => {
    const scope = await getScope(ctx, token)
    if (scope.platformAdmin || scope.session.role !== 'teacher' || !scope.all) {
      throw new ConvexError('Faqat markaz administratori uchun ruxsat berilgan')
    }
    if (newRole === 'edu_admin' && scope.role !== 'director') {
      throw new ConvexError('Faqat direktor EduSuperAdmin qo‘sha oladi')
    }
    return { centerId: scope.centerId }
  },
})

/** Authorizes an action (password reset / role toggle) against another staff member in the
 * same center. Refuses to target a `director` row — that's platform-admin territory. */
export const requireManageableTeacher = internalQuery({
  args: { token: v.string(), teacherId: v.id('teachers') },
  handler: async (ctx, { token, teacherId }) => {
    const scope = await getScope(ctx, token)
    if (scope.platformAdmin || scope.session.role !== 'teacher' || !scope.all) {
      throw new ConvexError('Faqat markaz administratori uchun ruxsat berilgan')
    }
    const target = await ctx.db.get(teacherId)
    if (!target || target.centerId !== scope.centerId) throw new ConvexError("Bu ustozga ruxsatingiz yo'q")
    if (target.role === 'director') throw new ConvexError("Direktor hisobini bu yerdan boshqarib bo'lmaydi")
    return { callerRole: scope.role }
  },
})

export const updateRole = internalMutation({
  args: { id: v.id('teachers'), role: v.union(v.literal('edu_admin'), v.literal('teacher')) },
  handler: async (ctx, { id, role }) => {
    await ctx.db.patch(id, { role })
  },
})

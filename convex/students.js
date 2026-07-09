import { query, mutation, internalQuery, internalMutation } from './_generated/server'
import { v } from 'convex/values'
import { requireTeacher } from './lib/authz'

function stripCredentials(student) {
  const rest = { ...student }
  delete rest.login
  delete rest.passwordHash
  return rest
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query('students').collect()
    return students.map(stripCredentials)
  },
})

/** Same as `list` but for the teacher's own roster view: includes `login` (never the
 * password hash) so the teacher can see who a login belongs to. */
export const listForTeacher = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireTeacher(ctx, token)
    const students = await ctx.db.query('students').collect()
    return students.map((student) => {
      const rest = { ...student }
      delete rest.passwordHash
      return rest
    })
  },
})

export const getByLogin = internalQuery({
  args: { login: v.string() },
  handler: async (ctx, { login }) => {
    return await ctx.db
      .query('students')
      .withIndex('by_login', (q) => q.eq('login', login))
      .unique()
  },
})

export const listLogins = internalQuery({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query('students').collect()
    return students.map((s) => s.login)
  },
})

export const listIdsAndLogins = internalQuery({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query('students').collect()
    return students.map((s) => ({ id: s._id, login: s.login }))
  },
})

export const insertStudent = internalMutation({
  args: {
    groupId: v.id('groups'),
    fullName: v.string(),
    login: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, { groupId, fullName, login, passwordHash }) => {
    return await ctx.db.insert('students', {
      groupId,
      fullName,
      avatar: null,
      joinedAt: new Date().toISOString(),
      login,
      passwordHash,
      status: 'active',
    })
  },
})

export const updatePasswordHash = internalMutation({
  args: { id: v.id('students'), passwordHash: v.string() },
  handler: async (ctx, { id, passwordHash }) => {
    await ctx.db.patch(id, { passwordHash })
  },
})

export const updateStatus = mutation({
  args: { token: v.string(), id: v.id('students'), status: v.union(v.literal('active'), v.literal('removed')) },
  handler: async (ctx, { token, id, status }) => {
    await requireTeacher(ctx, token)
    await ctx.db.patch(id, { status })
  },
})

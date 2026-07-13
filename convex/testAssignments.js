import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { requireTestOwner, requireGroupOwner } from './lib/scoping'
import { requireSession } from './lib/authz'

async function findAssignment(ctx, testId, groupId) {
  return await ctx.db
    .query('testAssignments')
    .withIndex('by_test', (q) => q.eq('testId', testId))
    .filter((q) => q.eq(q.field('groupId'), groupId))
    .first()
}

/** Teacher-side: which of their own groups a topic is currently attached to — backs the
 * checkbox list on the topic's "Guruhlar" tab. */
export const listGroupIdsForTest = query({
  args: { token: v.string(), testId: v.id('tests') },
  handler: async (ctx, { token, testId }) => {
    await requireTestOwner(ctx, token, testId)
    const assignments = await ctx.db
      .query('testAssignments')
      .withIndex('by_test', (q) => q.eq('testId', testId))
      .collect()
    return assignments.map((a) => a.groupId)
  },
})

/** Every topic attached to one group, with its question count — used for the group detail
 * page's read-only "Testlar" tab. */
export const listForGroup = query({
  args: { token: v.string(), groupId: v.id('groups') },
  handler: async (ctx, { token, groupId }) => {
    await requireGroupOwner(ctx, token, groupId)
    const assignments = await ctx.db
      .query('testAssignments')
      .withIndex('by_group', (q) => q.eq('groupId', groupId))
      .collect()
    const questions = await ctx.db.query('testQuestions').collect()
    const tests = await Promise.all(assignments.map((a) => ctx.db.get(a.testId)))
    return tests
      .filter(Boolean)
      .map((t) => ({ ...t, questionCount: questions.filter((q) => q.testId === t._id).length }))
  },
})

/** Student-side: every topic attached to the caller's own group — the "Testlar" list. */
export const listForMyGroup = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await requireSession(ctx, token)
    if (session.role !== 'student') return []
    const student = await ctx.db.get(session.userId)
    if (!student) return []

    const assignments = await ctx.db
      .query('testAssignments')
      .withIndex('by_group', (q) => q.eq('groupId', student.groupId))
      .collect()
    const questions = await ctx.db.query('testQuestions').collect()
    const tests = await Promise.all(assignments.map((a) => ctx.db.get(a.testId)))
    return tests
      .filter(Boolean)
      .map((t) => ({ ...t, questionCount: questions.filter((q) => q.testId === t._id).length }))
  },
})

/** Attaches a topic to a group ("guruhga ulash") — idempotent. */
export const assign = mutation({
  args: { token: v.string(), testId: v.id('tests'), groupId: v.id('groups') },
  handler: async (ctx, { token, testId, groupId }) => {
    await requireTestOwner(ctx, token, testId)
    await requireGroupOwner(ctx, token, groupId)
    const existing = await findAssignment(ctx, testId, groupId)
    if (existing) return existing._id
    return await ctx.db.insert('testAssignments', { testId, groupId, createdAt: new Date().toISOString() })
  },
})

export const unassign = mutation({
  args: { token: v.string(), testId: v.id('tests'), groupId: v.id('groups') },
  handler: async (ctx, { token, testId, groupId }) => {
    await requireTestOwner(ctx, token, testId)
    const existing = await findAssignment(ctx, testId, groupId)
    if (existing) await ctx.db.delete(existing._id)
  },
})

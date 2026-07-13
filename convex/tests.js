import { query, mutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { getScope, requireTestOwner } from './lib/scoping'

function requireTeacherScope(scope) {
  if (scope.session.role !== 'teacher') throw new ConvexError("O'qituvchi huquqi talab qilinadi")
}

/** Every topic ("mavzu") the caller owns, with its question count and how many groups it's
 * currently attached to — the "Testlar" management list. */
export const listForTeacher = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const scope = await getScope(ctx, token)
    requireTeacherScope(scope)

    const allTests = await ctx.db.query('tests').collect()
    const tests = scope.all ? allTests : allTests.filter((t) => t.teacherId === scope.teacherId)

    const questions = await ctx.db.query('testQuestions').collect()
    const assignments = await ctx.db.query('testAssignments').collect()

    return tests
      .map((t) => ({
        ...t,
        questionCount: questions.filter((q) => q.testId === t._id).length,
        groupCount: assignments.filter((a) => a.testId === t._id).length,
      }))
      .sort((a, b) => b._creationTime - a._creationTime)
  },
})

export const create = mutation({
  args: { token: v.string(), title: v.string() },
  handler: async (ctx, { token, title }) => {
    const scope = await getScope(ctx, token)
    requireTeacherScope(scope)
    return await ctx.db.insert('tests', { title, createdAt: new Date().toISOString(), teacherId: scope.session.userId })
  },
})

export const update = mutation({
  args: { token: v.string(), id: v.id('tests'), title: v.string() },
  handler: async (ctx, { token, id, title }) => {
    await requireTestOwner(ctx, token, id)
    await ctx.db.patch(id, { title })
  },
})

/** Deletes the topic together with its questions (and any uploaded question images),
 * group assignments, and recorded attempts. */
export const remove = mutation({
  args: { token: v.string(), id: v.id('tests') },
  handler: async (ctx, { token, id }) => {
    await requireTestOwner(ctx, token, id)

    const questions = await ctx.db
      .query('testQuestions')
      .withIndex('by_test', (q) => q.eq('testId', id))
      .collect()
    for (const question of questions) {
      if (question.imageStorageId) await ctx.storage.delete(question.imageStorageId)
      await ctx.db.delete(question._id)
    }

    const assignments = await ctx.db
      .query('testAssignments')
      .withIndex('by_test', (q) => q.eq('testId', id))
      .collect()
    for (const assignment of assignments) await ctx.db.delete(assignment._id)

    const attempts = await ctx.db
      .query('testAttempts')
      .withIndex('by_test', (q) => q.eq('testId', id))
      .collect()
    for (const attempt of attempts) await ctx.db.delete(attempt._id)

    await ctx.db.delete(id)
  },
})

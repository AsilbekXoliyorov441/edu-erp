import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { requireTeacher } from './lib/authz'
import { COIN_CATEGORY_LIST, LESSONS_PER_MONTH } from '../src/shared/config/constants'

const CATEGORY_MAX = Object.fromEntries(COIN_CATEGORY_LIST.map((c) => [c.key, c.max]))

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('lessons').collect()
  },
})

/** Atomically creates the lesson + every non-zero coin entry/transaction for it.
 * `nextLessonNumber`/`monthIndex` are computed here (not trusted from the client) so two
 * concurrent sessions for the same group can't collide on the same lesson number. */
export const saveSession = mutation({
  args: {
    token: v.string(),
    groupId: v.id('groups'),
    scores: v.array(v.object({ studentId: v.id('students'), category: v.string(), value: v.number() })),
    date: v.string(),
  },
  handler: async (ctx, { token, groupId, scores, date }) => {
    await requireTeacher(ctx, token)

    const groupLessons = await ctx.db
      .query('lessons')
      .withIndex('by_group', (q) => q.eq('groupId', groupId))
      .collect()
    const lessonNumber = groupLessons.length ? Math.max(...groupLessons.map((l) => l.lessonNumber)) + 1 : 1
    const monthIndex = Math.ceil(lessonNumber / LESSONS_PER_MONTH)
    const lessonId = await ctx.db.insert('lessons', { groupId, date, lessonNumber, monthIndex })

    let entriesCount = 0
    let coinsGiven = 0

    for (const score of scores) {
      const maxValue = CATEGORY_MAX[score.category]
      if (maxValue === undefined) continue
      const value = Math.max(0, Math.min(score.value, maxValue))
      if (value <= 0) continue

      const entryId = await ctx.db.insert('coinEntries', {
        studentId: score.studentId,
        lessonId,
        category: score.category,
        value,
        maxValue,
        givenAt: date,
      })
      await ctx.db.insert('transactions', {
        studentId: score.studentId,
        type: 'coin_given',
        amount: value,
        relatedEntryId: entryId,
        timestamp: date,
      })
      entriesCount += 1
      coinsGiven += value
    }

    return { lessonId, lessonNumber, monthIndex, entriesCount, coinsGiven }
  },
})

/** Deletes one or many lessons together with their coin entries and transactions. */
export const removeCascade = mutation({
  args: { token: v.string(), ids: v.array(v.id('lessons')) },
  handler: async (ctx, { token, ids }) => {
    await requireTeacher(ctx, token)
    const lessonIdSet = new Set(ids)

    const allEntries = await ctx.db.query('coinEntries').collect()
    const entriesToDelete = allEntries.filter((e) => lessonIdSet.has(e.lessonId))
    const entryIdSet = new Set(entriesToDelete.map((e) => e._id))

    const allTransactions = await ctx.db.query('transactions').collect()
    const transactionsToDelete = allTransactions.filter((t) => t.relatedEntryId && entryIdSet.has(t.relatedEntryId))

    for (const txn of transactionsToDelete) await ctx.db.delete(txn._id)
    for (const entry of entriesToDelete) await ctx.db.delete(entry._id)
    for (const lessonId of ids) await ctx.db.delete(lessonId)
  },
})

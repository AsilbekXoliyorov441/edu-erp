/** Per-student totals kept next to the raw history, so screens that only need "who has how
 * many coins" (the leaderboard, ranks) read one small row per student instead of every
 * transaction and coin entry. Refresh after anything that changes a student's transactions,
 * coin entries or group. A nightly cron (`studentStats.recomputeAll`) repairs any drift. */

const sameRecord = (a = {}, b = {}) => {
  const ka = Object.keys(a)
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k])
}

export async function refreshStudentStats(ctx, studentIds) {
  const lessonCache = new Map()
  for (const studentId of new Set(studentIds)) {
    const student = await ctx.db.get(studentId)
    const row = await ctx.db
      .query('studentStats')
      .withIndex('by_student', (q) => q.eq('studentId', studentId))
      .unique()
    if (!student) {
      if (row) await ctx.db.delete(row._id)
      continue
    }

    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_student', (q) => q.eq('studentId', studentId))
      .collect()
    const balance = transactions.reduce((sum, t) => (t.type === 'coin_given' ? sum + t.amount : sum - t.amount), 0)

    const entries = await ctx.db
      .query('coinEntries')
      .withIndex('by_student', (q) => q.eq('studentId', studentId))
      .collect()
    const earnedByMonth = {}
    for (const e of entries) {
      if (!lessonCache.has(e.lessonId)) lessonCache.set(e.lessonId, await ctx.db.get(e.lessonId))
      const lesson = lessonCache.get(e.lessonId)
      if (!lesson) continue
      const key = String(lesson.monthIndex)
      earnedByMonth[key] = (earnedByMonth[key] ?? 0) + e.value
    }

    const fields = { groupId: student.groupId, balance, earnedByMonth }
    if (!row) {
      await ctx.db.insert('studentStats', { studentId, ...fields, updatedAt: Date.now() })
    } else if (row.groupId !== fields.groupId || row.balance !== balance || !sameRecord(row.earnedByMonth, earnedByMonth)) {
      await ctx.db.patch(row._id, { ...fields, updatedAt: Date.now() })
    }
  }
}

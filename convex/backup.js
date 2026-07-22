import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { requireTeacher } from './lib/authz'

/** Gathers everything owned by one teacher (via groupId -> group.teacherId), regardless
 * of whether the caller is a superadmin. Superadmin's global read access (groups/students/
 * lessons/coinEntries/transactions `list`) is intentionally NOT reused here — export/reset/
 * import are destructive personal-backup tools, and must never operate on another
 * teacher's data even when the caller can otherwise see it all. */
async function collectForTeacher(ctx, teacherId) {
  const groups = (await ctx.db.query('groups').collect()).filter((g) => g.teacherId === teacherId)
  const groupIdSet = new Set(groups.map((g) => g._id))
  const students = (await ctx.db.query('students').collect()).filter((s) => groupIdSet.has(s.groupId))
  const studentIdSet = new Set(students.map((s) => s._id))
  const lessons = (await ctx.db.query('lessons').collect()).filter((l) => groupIdSet.has(l.groupId))
  const coinEntries = (await ctx.db.query('coinEntries').collect()).filter((e) => studentIdSet.has(e.studentId))
  const transactions = (await ctx.db.query('transactions').collect()).filter((t) => studentIdSet.has(t.studentId))
  return { groups, students, lessons, coinEntries, transactions }
}

export const exportAll = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await requireTeacher(ctx, token)
    const teacher = await ctx.db.get(session.userId)
    const owned = await collectForTeacher(ctx, session.userId)
    const gifts = teacher?.centerId
      ? await ctx.db
          .query('gifts')
          .withIndex('by_center', (q) => q.eq('centerId', teacher.centerId))
          .collect()
      : []
    return {
      exportedAt: new Date().toISOString(),
      teacher: teacher ? { username: teacher.username, passwordHash: teacher.passwordHash, fullName: teacher.fullName } : null,
      ...owned,
      gifts,
    }
  },
})

/** Wipes the caller's own groups/students/lessons/coin records — used by Settings >
 * "Ma'lumotlarni tozalash". Teacher login and the (shared) gift catalog are left in place.
 * Scoped to the caller's own data even for a superadmin, so this can never wipe another
 * teacher's roster. */
export const resetOperationalData = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await requireTeacher(ctx, token)
    const owned = await collectForTeacher(ctx, session.userId)
    for (const table of ['coinEntries', 'transactions', 'lessons', 'students', 'groups']) {
      for (const row of owned[table]) await ctx.db.delete(row._id)
    }
  },
})

/** Wipes the caller's own groups/students/lessons/coin records and restores them from a
 * previous `exportAll` payload, remapping the old row ids to freshly-inserted ones and
 * re-attaching every new group to the caller. The teacher account backing the current
 * session is patched in place (never deleted) so the import can't lock the caller out.
 * The (shared) gift catalog is never touched by a personal import. */
export const importAll = mutation({
  args: {
    token: v.string(),
    data: v.object({
      teacher: v.optional(v.any()),
      groups: v.array(v.any()),
      students: v.array(v.any()),
      lessons: v.array(v.any()),
      coinEntries: v.array(v.any()),
      transactions: v.array(v.any()),
      gifts: v.optional(v.array(v.any())),
    }),
  },
  handler: async (ctx, { token, data }) => {
    const session = await requireTeacher(ctx, token)

    const owned = await collectForTeacher(ctx, session.userId)
    for (const table of ['coinEntries', 'transactions', 'lessons', 'students', 'groups']) {
      for (const row of owned[table]) await ctx.db.delete(row._id)
    }

    if (data.teacher) {
      await ctx.db.patch(session.userId, {
        username: data.teacher.username,
        passwordHash: data.teacher.passwordHash,
        fullName: data.teacher.fullName,
      })
    }

    const groupIdMap = new Map()
    for (const g of data.groups) {
      const newId = await ctx.db.insert('groups', { name: g.name, createdAt: g.createdAt, teacherId: session.userId })
      groupIdMap.set(g._id, newId)
    }

    const studentIdMap = new Map()
    for (const s of data.students) {
      const newId = await ctx.db.insert('students', {
        groupId: groupIdMap.get(s.groupId),
        fullName: s.fullName,
        avatar: s.avatar ?? null,
        joinedAt: s.joinedAt,
        login: s.login,
        passwordHash: s.passwordHash,
        status: s.status,
      })
      studentIdMap.set(s._id, newId)
    }

    const lessonIdMap = new Map()
    for (const l of data.lessons) {
      const newId = await ctx.db.insert('lessons', {
        groupId: groupIdMap.get(l.groupId),
        date: l.date,
        lessonNumber: l.lessonNumber,
        monthIndex: l.monthIndex,
      })
      lessonIdMap.set(l._id, newId)
    }

    const entryIdMap = new Map()
    for (const e of data.coinEntries) {
      const newId = await ctx.db.insert('coinEntries', {
        studentId: studentIdMap.get(e.studentId),
        lessonId: lessonIdMap.get(e.lessonId),
        category: e.category,
        value: e.value,
        maxValue: e.maxValue,
        givenAt: e.givenAt,
      })
      entryIdMap.set(e._id, newId)
    }

    for (const t of data.transactions) {
      await ctx.db.insert('transactions', {
        studentId: studentIdMap.get(t.studentId),
        type: t.type,
        amount: t.amount,
        relatedEntryId: t.relatedEntryId ? entryIdMap.get(t.relatedEntryId) : undefined,
        relatedGiftId: t.relatedGiftId ?? undefined,
        timestamp: t.timestamp,
      })
    }
  },
})

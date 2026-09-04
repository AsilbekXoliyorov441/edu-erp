import { query, mutation, internalQuery, internalMutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { getScopedGroupIdSet, requireGroupOwner, requireStudentOwner } from './lib/scoping'

function stripCredentials(student) {
  const rest = { ...student }
  delete rest.login
  delete rest.passwordHash
  return rest
}

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const groupIdSet = await getScopedGroupIdSet(ctx, token)
    const students = await ctx.db.query('students').collect()
    const scoped = students.filter((s) => groupIdSet.has(s.groupId))
    return scoped.map(stripCredentials)
  },
})

/** Same as `list` but for the teacher's own roster view: includes `login` (never the
 * password hash) so the teacher can see who a login belongs to. */
export const listForTeacher = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const groupIdSet = await getScopedGroupIdSet(ctx, token)
    const students = await ctx.db.query('students').collect()
    const scoped = students.filter((s) => groupIdSet.has(s.groupId))
    return scoped.map((student) => {
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
    await requireStudentOwner(ctx, token, id)
    await ctx.db.patch(id, { status })
  },
})

/** Re-points every history row of `fromId` at `toId` and returns the net coin balance carried
 * over (given minus redeemed). Every one of these tables is keyed by `studentId` and has a
 * `by_student` index, so only the two students' own rows are ever touched. Nothing is
 * deleted — rows are moved, not rewritten. */
async function absorbStudentHistory(ctx, fromId, toId) {
  let carriedCoins = 0

  const transactions = await ctx.db
    .query('transactions')
    .withIndex('by_student', (q) => q.eq('studentId', fromId))
    .collect()
  for (const row of transactions) {
    carriedCoins += row.type === 'coin_given' ? row.amount : -row.amount
    await ctx.db.patch(row._id, { studentId: toId })
  }

  const byStudent = (q) => q.eq('studentId', fromId)
  const rest = [
    ...(await ctx.db.query('coinEntries').withIndex('by_student', byStudent).collect()),
    ...(await ctx.db.query('attendance').withIndex('by_student', byStudent).collect()),
    ...(await ctx.db.query('testAttempts').withIndex('by_student', byStudent).collect()),
  ]
  for (const row of rest) await ctx.db.patch(row._id, { studentId: toId })

  return carriedCoins
}

/** Moves students into another group at the end of a season ("o'quv mavsumi"). Coins ride
 * along on their own: `transactions` (the sole source of truth for a balance), `coinEntries`,
 * `attendance` and `testAttempts` are all keyed by `studentId`, never by group, so the move
 * itself is a single `groupId` patch and cannot change anyone's balance.
 *
 * `merges` carries the "the target group already has someone with this name" answers the
 * teacher gave in the UI. For each confirmed pair the duplicate's history is re-pointed at
 * the student being transferred — who keeps their own login — and the now-empty duplicate row
 * is marked `removed` with `mergedIntoId` set. Unconfirmed duplicates are simply left alone,
 * so both students end up side by side in the group with separate balances.
 *
 * This mutation only ever patches rows; it never deletes one. Every ownership and consistency
 * check runs before the first write, so a rejected student can't leave the batch half-applied
 * (Convex mutations are transactional, so a late throw would roll back anyway). */
export const transfer = mutation({
  args: {
    token: v.string(),
    targetGroupId: v.id('groups'),
    studentIds: v.array(v.id('students')),
    merges: v.optional(v.array(v.object({ studentId: v.id('students'), duplicateId: v.id('students') }))),
  },
  handler: async (ctx, { token, targetGroupId, studentIds, merges = [] }) => {
    if (studentIds.length === 0) throw new ConvexError("Ko'chirish uchun o'quvchi tanlanmagan")
    if (new Set(studentIds).size !== studentIds.length) throw new ConvexError("O'quvchilar ro'yxatida takror bor")

    // The caller must own both ends of the move: the target group, and every student's
    // current group. A regular teacher can therefore only shuffle within their own groups,
    // while a director/edu_admin can move across teachers inside their own center.
    await requireGroupOwner(ctx, token, targetGroupId)
    for (const studentId of studentIds) await requireStudentOwner(ctx, token, studentId)

    const studentIdSet = new Set(studentIds)
    const seenDuplicates = new Set()
    const duplicateByStudent = new Map()

    for (const { studentId, duplicateId } of merges) {
      if (studentId === duplicateId) throw new ConvexError("O'quvchini o'zi bilan birlashtirib bo'lmaydi")
      if (!studentIdSet.has(studentId)) throw new ConvexError("Birlashtirilayotgan o'quvchi ro'yxatda yo'q")
      if (duplicateByStudent.has(studentId)) throw new ConvexError("Bitta o'quvchi uchun ikkita juftlik berilgan")
      if (seenDuplicates.has(duplicateId)) throw new ConvexError("Bitta o'quvchi ikki marta birlashtirilmoqda")
      // A row can't be both moved and absorbed in the same batch.
      if (studentIdSet.has(duplicateId)) throw new ConvexError("Birlashtirilayotgan o'quvchi ham ko'chirilmoqda")

      const duplicate = await ctx.db.get(duplicateId)
      if (!duplicate) throw new ConvexError("Takrorlanuvchi o'quvchi topilmadi")
      if (duplicate.groupId !== targetGroupId) throw new ConvexError("Takrorlanuvchi o'quvchi tanlangan guruhda emas")
      await requireStudentOwner(ctx, token, duplicateId)

      seenDuplicates.add(duplicateId)
      duplicateByStudent.set(studentId, duplicateId)
    }

    let mergedCoins = 0
    for (const studentId of studentIds) {
      const duplicateId = duplicateByStudent.get(studentId)
      if (duplicateId) {
        mergedCoins += await absorbStudentHistory(ctx, duplicateId, studentId)
        await ctx.db.patch(duplicateId, { status: 'removed', mergedIntoId: studentId })
      }
      await ctx.db.patch(studentId, { groupId: targetGroupId })
    }

    return { moved: studentIds.length, merged: duplicateByStudent.size, mergedCoins }
  },
})

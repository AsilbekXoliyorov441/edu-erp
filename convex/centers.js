import { query, mutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { requireSuperAdmin, requirePlatformAdmin } from './lib/scoping'

const DAY_MS = 24 * 60 * 60 * 1000

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS)
}

/** Platform SuperAdmin: every center plus its director, active-student count, and a 30-day
 * usage trend (used to flag centers that are growing/shrinking). "Usage" = a center's active
 * students who received at least one coin entry in the window — the same signal a teacher
 * running real lessons would produce. */
export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requirePlatformAdmin(ctx, token)

    const [centers, allTeachers, allGroups, allStudents, allCoinEntries] = await Promise.all([
      ctx.db.query('centers').collect(),
      ctx.db.query('teachers').collect(),
      ctx.db.query('groups').collect(),
      ctx.db.query('students').collect(),
      ctx.db.query('coinEntries').collect(),
    ])

    const now = new Date()
    const last30Start = addDays(now, -30).toISOString()
    const prev30Start = addDays(now, -60).toISOString()
    const nowIso = now.toISOString()

    return centers.map((center) => {
      const centerTeachers = allTeachers.filter((t) => t.centerId === center._id)
      const director = centerTeachers.find((t) => t.role === 'director')
      const teacherIds = new Set(centerTeachers.map((t) => t._id))
      const groupIds = new Set(allGroups.filter((g) => g.teacherId && teacherIds.has(g.teacherId)).map((g) => g._id))
      const students = allStudents.filter((s) => groupIds.has(s.groupId))
      const activeStudents = students.filter((s) => s.status === 'active')
      const activeStudentIds = new Set(activeStudents.map((s) => s._id))

      const activeLast30 = new Set()
      const activePrev30 = new Set()
      for (const entry of allCoinEntries) {
        if (!activeStudentIds.has(entry.studentId)) continue
        if (entry.givenAt >= last30Start) activeLast30.add(entry.studentId)
        else if (entry.givenAt >= prev30Start) activePrev30.add(entry.studentId)
      }

      const studentCount = activeStudents.length
      const usagePercent = studentCount === 0 ? 0 : (activeLast30.size / studentCount) * 100
      const trendPercent =
        activePrev30.size === 0
          ? activeLast30.size === 0
            ? 0
            : 100
          : ((activeLast30.size - activePrev30.size) / activePrev30.size) * 100

      return {
        id: center._id,
        name: center.name,
        status: center.status,
        subscriptionPrice: center.subscriptionPrice,
        subscriptionEndsAt: center.subscriptionEndsAt,
        isExpired: center.subscriptionEndsAt < nowIso,
        coinPriceSom: center.coinPriceSom ?? null,
        directorFullName: director?.fullName ?? null,
        directorUsername: director?.username ?? null,
        teacherCount: centerTeachers.filter((t) => t.role === 'teacher' || t.role === 'edu_admin').length,
        groupCount: groupIds.size,
        studentCount,
        activeLast30: activeLast30.size,
        usagePercent,
        trendPercent,
      }
    })
  },
})

/** Platform SuperAdmin: registers a new education center and its first subscription period
 * (also logs the opening payment so the pricing history starts complete). Director account
 * creation is a separate step (`teachersActions.createDirector`). */
export const create = mutation({
  args: { token: v.string(), name: v.string(), subscriptionPrice: v.number(), periodDays: v.number() },
  handler: async (ctx, { token, name, subscriptionPrice, periodDays }) => {
    await requirePlatformAdmin(ctx, token)
    if (periodDays <= 0) throw new ConvexError("Obuna muddati musbat bo'lishi kerak")

    const now = new Date()
    const subscriptionEndsAt = addDays(now, periodDays).toISOString()
    const centerId = await ctx.db.insert('centers', {
      name,
      status: 'active',
      createdAt: now.toISOString(),
      subscriptionPrice,
      subscriptionEndsAt,
    })
    await ctx.db.insert('centerPayments', {
      centerId,
      amount: subscriptionPrice,
      periodDays,
      paidAt: now.toISOString(),
      newEndsAt: subscriptionEndsAt,
      note: "Markaz ro'yxatga olindi",
    })
    return { ok: true, id: centerId }
  },
})

export const updateStatus = mutation({
  args: { token: v.string(), centerId: v.id('centers'), status: v.union(v.literal('active'), v.literal('suspended')) },
  handler: async (ctx, { token, centerId, status }) => {
    await requirePlatformAdmin(ctx, token)
    await ctx.db.patch(centerId, { status })
    return { ok: true }
  },
})

/** Platform SuperAdmin: extends a center's subscription and logs the payment. Extends from
 * the later of "now" or the current expiry, so early renewals stack instead of overlapping. */
export const renewSubscription = mutation({
  args: { token: v.string(), centerId: v.id('centers'), amount: v.number(), periodDays: v.number(), note: v.optional(v.string()) },
  handler: async (ctx, { token, centerId, amount, periodDays, note }) => {
    await requirePlatformAdmin(ctx, token)
    if (periodDays <= 0) throw new ConvexError("Obuna muddati musbat bo'lishi kerak")

    const center = await ctx.db.get(centerId)
    if (!center) throw new ConvexError('Markaz topilmadi')

    const now = new Date()
    const base = center.subscriptionEndsAt > now.toISOString() ? new Date(center.subscriptionEndsAt) : now
    const newEndsAt = addDays(base, periodDays).toISOString()

    await ctx.db.patch(centerId, { subscriptionPrice: amount, subscriptionEndsAt: newEndsAt, status: 'active' })
    await ctx.db.insert('centerPayments', { centerId, amount, periodDays, paidAt: now.toISOString(), newEndsAt, note })
    return { ok: true, newEndsAt }
  },
})

export const listPayments = query({
  args: { token: v.string(), centerId: v.id('centers') },
  handler: async (ctx, { token, centerId }) => {
    await requirePlatformAdmin(ctx, token)
    return await ctx.db
      .query('centerPayments')
      .withIndex('by_center', (q) => q.eq('centerId', centerId))
      .order('desc')
      .collect()
  },
})

/** Director/EduSuperAdmin: sets their own center's coin market conversion rate
 * (statistics-only — doesn't gate gift redemption). */
export const updateCoinPrice = mutation({
  args: { token: v.string(), coinPriceSom: v.number() },
  handler: async (ctx, { token, coinPriceSom }) => {
    const session = await requireSuperAdmin(ctx, token)
    const teacher = await ctx.db.get(session.userId)
    await ctx.db.patch(teacher.centerId, { coinPriceSom })
    return { ok: true }
  },
})

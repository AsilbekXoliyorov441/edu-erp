import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  /** Tenants ("o'quv markaz"). One `centers` row per education center; every
   * `director`/`edu_admin`/`teacher` and (transitively) their groups/students/gifts
   * belong to exactly one center. `status` is a manual SuperAdmin on/off switch;
   * `subscriptionEndsAt` is the automatic expiry — either one blocks access. */
  centers: defineTable({
    name: v.string(),
    status: v.union(v.literal('active'), v.literal('suspended')),
    createdAt: v.string(),
    subscriptionPrice: v.number(),
    subscriptionEndsAt: v.string(),
    coinPriceSom: v.optional(v.number()),
  }).index('by_status', ['status']),

  /** Renewal/payment history for a center's subscription — written whenever a SuperAdmin
   * extends `centers.subscriptionEndsAt`, so pricing history stays auditable. */
  centerPayments: defineTable({
    centerId: v.id('centers'),
    amount: v.number(),
    periodDays: v.number(),
    paidAt: v.string(),
    newEndsAt: v.string(),
    note: v.optional(v.string()),
  }).index('by_center', ['centerId']),

  teachers: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    fullName: v.string(),
    isSuperAdmin: v.optional(v.boolean()),
    /** Fine-grained role replacing `isSuperAdmin` (kept above, unused, for old-data
     * compatibility). Absent only pre-migration; `bootstrapMultiTenant` backfills it. */
    role: v.optional(
      v.union(v.literal('platform_admin'), v.literal('director'), v.literal('edu_admin'), v.literal('teacher'))
    ),
    /** Absent only for `platform_admin`, who isn't attached to any one center. */
    centerId: v.optional(v.id('centers')),
  })
    .index('by_username', ['username'])
    .index('by_center', ['centerId']),

  students: defineTable({
    groupId: v.id('groups'),
    fullName: v.string(),
    avatar: v.union(v.string(), v.null()),
    joinedAt: v.string(),
    login: v.string(),
    passwordHash: v.string(),
    status: v.union(v.literal('active'), v.literal('removed')),
    /** Set only on the losing row of a `students.transfer` merge, when a teacher confirmed
     * that a duplicate in the target group is the same person. The row itself is kept
     * (status `removed`) so the merge stays auditable and reversible; all of its history has
     * been re-pointed at the student named here. */
    mergedIntoId: v.optional(v.id('students')),
  })
    .index('by_login', ['login'])
    .index('by_group', ['groupId']),

  groups: defineTable({
    name: v.string(),
    createdAt: v.string(),
    teacherId: v.optional(v.id('teachers')),
  }).index('by_teacher', ['teacherId']),

  lessons: defineTable({
    groupId: v.id('groups'),
    date: v.string(),
    lessonNumber: v.number(),
    monthIndex: v.number(),
  }).index('by_group', ['groupId']),

  coinEntries: defineTable({
    studentId: v.id('students'),
    lessonId: v.id('lessons'),
    category: v.union(v.literal('uy_vazifasi'), v.literal('sinf_ishi'), v.literal('savol_javob')),
    value: v.number(),
    maxValue: v.number(),
    givenAt: v.string(),
  })
    .index('by_lesson', ['lessonId'])
    .index('by_student', ['studentId']),

  /** One row per (lesson, student) — written only alongside `lessons.saveSession`, same
   * atomic-per-session-write pattern as `coinEntries`. Lessons saved before this feature
   * existed have no rows here; stats treat that as "untracked", not "absent". */
  attendance: defineTable({
    lessonId: v.id('lessons'),
    studentId: v.id('students'),
    status: v.union(v.literal('present'), v.literal('late'), v.literal('absent')),
  })
    .index('by_lesson', ['lessonId'])
    .index('by_student', ['studentId']),

  transactions: defineTable({
    studentId: v.id('students'),
    type: v.union(v.literal('coin_given'), v.literal('gift_redeemed')),
    amount: v.number(),
    relatedEntryId: v.optional(v.id('coinEntries')),
    relatedGiftId: v.optional(v.id('gifts')),
    timestamp: v.string(),
  }).index('by_student', ['studentId']),

  gifts: defineTable({
    name: v.string(),
    icon: v.optional(v.string()),
    image: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    link: v.optional(v.string()),
    price: v.number(),
    /** Coin market is per-center; optional only until `bootstrapMultiTenant` backfills it. */
    centerId: v.optional(v.id('centers')),
  }).index('by_center', ['centerId']),

  sessions: defineTable({
    token: v.string(),
    role: v.union(v.literal('teacher'), v.literal('student')),
    userId: v.union(v.id('teachers'), v.id('students')),
    createdAt: v.number(),
  }).index('by_token', ['token']),

  /** A reusable quiz topic ("mavzu") — created once by a teacher and attached to any number
   * of groups via `testAssignments`, so the same 10-20 questions don't need to be recreated
   * per group. */
  tests: defineTable({
    title: v.string(),
    createdAt: v.string(),
    teacherId: v.id('teachers'),
  }).index('by_teacher', ['teacherId']),

  testQuestions: defineTable({
    testId: v.id('tests'),
    text: v.string(),
    isCode: v.optional(v.boolean()),
    imageStorageId: v.optional(v.id('_storage')),
    options: v.array(v.string()),
    correctIndex: v.number(),
    order: v.number(),
  }).index('by_test', ['testId']),

  /** Links a reusable test (topic) to a group whose students may take it — many-to-many,
   * so the same topic can be attached to several groups without duplicating questions. */
  testAssignments: defineTable({
    testId: v.id('tests'),
    groupId: v.id('groups'),
    createdAt: v.string(),
  })
    .index('by_test', ['testId'])
    .index('by_group', ['groupId']),

  testAttempts: defineTable({
    studentId: v.id('students'),
    testId: v.id('tests'),
    score: v.number(),
    totalQuestions: v.number(),
    answeredAt: v.string(),
  })
    .index('by_student', ['studentId'])
    .index('by_test', ['testId']),
})

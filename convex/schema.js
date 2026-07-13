import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  teachers: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    fullName: v.string(),
    isSuperAdmin: v.optional(v.boolean()),
  }).index('by_username', ['username']),

  students: defineTable({
    groupId: v.id('groups'),
    fullName: v.string(),
    avatar: v.union(v.string(), v.null()),
    joinedAt: v.string(),
    login: v.string(),
    passwordHash: v.string(),
    status: v.union(v.literal('active'), v.literal('removed')),
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
  }),

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

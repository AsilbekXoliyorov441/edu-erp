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
    /** Public URL of the student's own profile photo (also shown as their game avatar). */
    avatar: v.union(v.string(), v.null()),
    /** Storage file behind `avatar`, so a replaced photo can be deleted. */
    avatarStorageId: v.optional(v.id('_storage')),
    joinedAt: v.string(),
    login: v.string(),
    passwordHash: v.string(),
    status: v.union(v.literal('active'), v.literal('removed')),
    /** Set only on the losing row of a `students.transfer` merge, when a teacher confirmed
     * that a duplicate in the target group is the same person. The row itself is kept
     * (status `removed`) so the merge stays auditable and reversible; all of its history has
     * been re-pointed at the student named here. */
    mergedIntoId: v.optional(v.id('students')),
    /** Scrypt hash of the student's own 4–6 digit purchase PIN. Teachers hand out login
     * passwords, so a classmate may know one — the PIN is set by the student alone and is
     * required for every gift order. A teacher can only clear it, never read it. */
    purchasePinHash: v.optional(v.string()),
    pinFailedAttempts: v.optional(v.number()),
    /** ms timestamp; PIN entry is blocked until then after too many wrong attempts. */
    pinLockedUntil: v.optional(v.number()),
    /** The password the student chose, AES-GCM encrypted with `PASSWORD_VAULT_KEY` so only a
     * center admin (director / edu_admin) can reveal it. Absent = still the initial password. */
    passwordEnc: v.optional(v.string()),
    passwordChangedAt: v.optional(v.number()),
  })
    .index('by_login', ['login'])
    .index('by_group', ['groupId']),

  groups: defineTable({
    name: v.string(),
    createdAt: v.string(),
    teacherId: v.optional(v.id('teachers')),
    /** Weekly track: `odd` = Du/Chor/Juma ("toq kunlar"), `even` = Se/Pay/Shan ("juft kunlar").
     * Optional for groups created before it existed — those fall back to inferring it from
     * their lessons' weekdays. */
    schedule: v.optional(v.union(v.literal('odd'), v.literal('even'))),
    /** Lesson time as `HH:mm`, Tashkent time. */
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    /** Course direction, for the group's icon. */
    direction: v.optional(
      v.union(v.literal('frontend'), v.literal('python'), v.literal('ai'), v.literal('cyber'), v.literal('other')),
    ),
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
    .index('by_student', ['studentId'])
    .index('by_given_at', ['givenAt']),

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
    type: v.union(v.literal('coin_given'), v.literal('gift_redeemed'), v.literal('coin_burned')),
    amount: v.number(),
    /** `coin_burned` only: the `YYYY-MM` month whose coins burned. */
    month: v.optional(v.string()),
    relatedEntryId: v.optional(v.id('coinEntries')),
    relatedGiftId: v.optional(v.id('gifts')),
    timestamp: v.string(),
  }).index('by_student', ['studentId']),

  /** One row per (student, closed month) written by `monthlyGoal.closeMonth` — the frozen
   * result of the monthly 70% goal check. Its existence is also what makes the cron
   * idempotent: a student/month pair that already has a row is never evaluated twice. */
  monthlyGoalResults: defineTable({
    studentId: v.id('students'),
    month: v.string(),
    earned: v.number(),
    possible: v.number(),
    percent: v.number(),
    reached: v.boolean(),
    burned: v.number(),
    processedAt: v.string(),
  })
    .index('by_student', ['studentId'])
    .index('by_month', ['month']),

  /** Start-of-lesson Q&A ("darsdagi savol-javob"). The teacher opens one per lesson from
   * the topics they pick; every student of the group then answers their own `QUESTION_COUNT`
   * random questions from that pool, `SECONDS_PER_QUESTION` each. Each correct answer is one
   * Savol-javob coin — it lands live in the teacher's grading table and becomes real coins
   * when the lesson is saved. */
  lessonQuizzes: defineTable({
    groupId: v.id('groups'),
    hostId: v.id('teachers'),
    testIds: v.array(v.id('tests')),
    title: v.string(),
    /** Question pool from every chosen topic. */
    questionIds: v.array(v.id('testQuestions')),
    status: v.union(v.literal('active'), v.literal('closed')),
    createdAt: v.number(),
    closedAt: v.optional(v.number()),
    lessonId: v.optional(v.id('lessons')),
  }).index('by_group', ['groupId']),

  lessonQuizAttempts: defineTable({
    quizId: v.id('lessonQuizzes'),
    studentId: v.id('students'),
    questionIds: v.array(v.id('testQuestions')),
    /** Question currently open (equals `questionIds.length` once done). */
    index: v.number(),
    /** ms; when the open question's countdown started. */
    questionStartedAt: v.number(),
    /** Per answered question: picked option (-1 = time ran out) and whether it was right. */
    answers: v.array(v.object({ selectedIndex: v.number(), correct: v.boolean() })),
    correctCount: v.number(),
    status: v.union(v.literal('active'), v.literal('done')),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
  })
    .index('by_quiz', ['quizId'])
    .index('by_quiz_student', ['quizId', 'studentId']),

  /** A live, in-class quiz game ("jonli o'yin") a teacher hosts for one group from one of
   * their test topics. Everyone sees the same question at the same time: the host moves the
   * game `lobby → question → reveal → question … → finished`. `questionIds` freezes the
   * question order when the game is created. */
  games: defineTable({
    groupId: v.id('groups'),
    testId: v.id('tests'),
    hostId: v.id('teachers'),
    title: v.string(),
    mode: v.union(v.literal('solo'), v.literal('team')),
    teamCount: v.number(),
    questionIds: v.array(v.id('testQuestions')),
    durationSec: v.number(),
    status: v.union(v.literal('lobby'), v.literal('question'), v.literal('reveal'), v.literal('finished')),
    currentIndex: v.number(),
    questionStartedAt: v.number(),
    createdAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index('by_group', ['groupId'])
    .index('by_host', ['hostId']),

  gamePlayers: defineTable({
    gameId: v.id('games'),
    studentId: v.id('students'),
    team: v.number(),
    score: v.number(),
    streak: v.number(),
    correctCount: v.number(),
    /** `GAME_HEROES` id the student picked when joining, or `'photo'` for their own
     * profile photo. */
    hero: v.optional(v.string()),
    joinedAt: v.number(),
    /** Power-ups — each one usable once per game. Holds the question index it was used on. */
    fiftyAt: v.optional(v.number()),
    /** The two wrong options 50/50 hid on question `fiftyAt`. */
    fiftyHidden: v.optional(v.array(v.number())),
    doubleAt: v.optional(v.number()),
    shieldAt: v.optional(v.number()),
  })
    .index('by_game', ['gameId'])
    .index('by_game_student', ['gameId', 'studentId']),

  gameAnswers: defineTable({
    gameId: v.id('games'),
    playerId: v.id('gamePlayers'),
    questionIndex: v.number(),
    selectedIndex: v.number(),
    correct: v.boolean(),
    points: v.number(),
    elapsedMs: v.number(),
    /** Power-up armed with this answer. */
    boost: v.optional(v.union(v.literal('double'), v.literal('shield'))),
  })
    .index('by_game_question', ['gameId', 'questionIndex'])
    .index('by_player', ['playerId']),

  /** Emoji reactions players send during a game — float across every screen. */
  gameReactions: defineTable({
    gameId: v.id('games'),
    playerId: v.id('gamePlayers'),
    emoji: v.string(),
    createdAt: v.number(),
  }).index('by_game', ['gameId', 'createdAt']),

  /** "Shaharcha" town game. One town per center (`townKey` = center id). Town money is
   * separate from coins on purpose — coins buy real gifts and must not be spent on virtual
   * houses. */
  townPlayers: defineTable({
    townKey: v.string(),
    userId: v.union(v.id('students'), v.id('teachers')),
    nickname: v.string(),
    nicknameLower: v.string(),
    color: v.string(),
    money: v.number(),
    car: v.optional(v.object({ model: v.string(), color: v.string() })),
    joinedAt: v.number(),
    lastBonusAt: v.optional(v.number()),
    taxiTrips: v.optional(v.number()),
    taxiEarned: v.optional(v.number()),
    /** Learning stats: questions answered correctly in the library / exams. */
    learnCorrect: v.optional(v.number()),
    learnEarned: v.optional(v.number()),
    /** ms; a failed building exam can be retried after this. */
    buildCooldownUntil: v.optional(v.number()),
    /** Driving time ("fuel") left, in ms — earned by answering questions. */
    driveMsLeft: v.optional(v.number()),
    /** Set while driving: when fuel was last charged. */
    driveTickAt: v.optional(v.number()),
    /** Savings in the town bank and when interest was last settled. */
    bankBalance: v.optional(v.number()),
    bankAt: v.optional(v.number()),
    /** Temporary boosts bought in the choyxona / supermarket / restaurant. */
    scholarUntil: v.optional(v.number()),
    driverUntil: v.optional(v.number()),
    builderKits: v.optional(v.number()),
    /** The player's car is listed on the market at this price. */
    carSalePrice: v.optional(v.number()),
    /** Islamic bank: interest-free loan outstanding, zakat given, last help from the fund. */
    loan: v.optional(v.number()),
    zakatPaid: v.optional(v.number()),
    mudarabaProfit: v.optional(v.number()),
    helpAt: v.optional(v.number()),
    /** Car income is counted from here (cars earn per hour instead of being driven). */
    carCollectAt: v.optional(v.number()),
    /** Set while someone is buying this player's car (see `townDeals`). */
    carDealId: v.optional(v.id('townDeals')),
  })
    .index('by_town', ['townKey'])
    .index('by_user', ['userId'])
    .index('by_town_nickname', ['townKey', 'nicknameLower']),

  /** An owned plot. Plots nobody bought have no row; positions/prices live in `TOWN_PLOTS`. */
  /** Public copy of each town player — what other players see (name, colour, car, bank
   * stake, learning score). Shared queries read this instead of `townPlayers`, whose rows
   * change on every money move, so one player's activity doesn't re-run everyone's map.
   * Kept in sync by `syncRoster` in `town.js`. */
  /** Per-student totals derived from `transactions` / `coinEntries` — see
   * `convex/lib/studentStats.js`. The leaderboard reads these instead of the full history. */
  studentStats: defineTable({
    studentId: v.id('students'),
    groupId: v.id('groups'),
    balance: v.number(),
    /** Coins earned per course month (`lessons.monthIndex`, as a string key). */
    earnedByMonth: v.record(v.string(), v.number()),
    updatedAt: v.number(),
  })
    .index('by_student', ['studentId'])
    .index('by_group', ['groupId']),

  townRoster: defineTable({
    townKey: v.string(),
    playerId: v.id('townPlayers'),
    nickname: v.string(),
    color: v.string(),
    car: v.optional(v.object({ model: v.string(), color: v.string() })),
    carSalePrice: v.optional(v.number()),
    learnCorrect: v.number(),
    bankBalance: v.number(),
  })
    .index('by_town', ['townKey'])
    .index('by_player', ['playerId']),

  townPlots: defineTable({
    townKey: v.string(),
    plotId: v.string(),
    ownerId: v.id('townPlayers'),
    floors: v.number(),
    style: v.string(),
    /** `BUILDING_KINDS` key (absent = house, for plots built before kinds existed). */
    kind: v.optional(v.string()),
    design: v.optional(v.string()),
    /** Income is counted from here (shops / apartments / offices). */
    lastCollectAt: v.optional(v.number()),
    /** Listed on the market at this price (set by the owner). */
    salePrice: v.optional(v.number()),
    /** Set while a purchase of this plot is going through (see `townDeals`). */
    dealId: v.optional(v.id('townDeals')),
    /** Property insurance: the value covered, and when the policy was bought. */
    insuredValue: v.optional(v.number()),
    insuredAt: v.optional(v.number()),
    boughtAt: v.number(),
    builtAt: v.optional(v.number()),
  })
    .index('by_town', ['townKey'])
    .index('by_town_plot', ['townKey', 'plotId'])
    .index('by_owner', ['ownerId']),

  /** A question session in town: `library` pays for correct answers, `build` is the exam
   * a player must pass to add a floor. `refs` are question references: `q:<testQuestions id>`
   * for the teacher's own questions, `p:<preset>:<index>` for built-in fallback questions. */
  townQuizzes: defineTable({
    playerId: v.id('townPlayers'),
    kind: v.union(v.literal('library'), v.literal('build'), v.literal('fuel'), v.literal('passenger'), v.literal('collect')),
    plotId: v.optional(v.string()),
    tripId: v.optional(v.id('townTrips')),
    refs: v.array(v.string()),
    need: v.number(),
    index: v.number(),
    correct: v.number(),
    streak: v.number(),
    earned: v.number(),
    status: v.union(v.literal('active'), v.literal('passed'), v.literal('failed'), v.literal('done'), v.literal('cancelled')),
    createdAt: v.number(),
  }).index('by_player_status', ['playerId', 'status']),

  /** Which questions a player has already answered correctly — new ones pay more. */
  townLearned: defineTable({
    playerId: v.id('townPlayers'),
    ref: v.string(),
    /** `t:<testId>` or `p:<preset>` — for per-topic mastery. */
    topic: v.optional(v.string()),
    correctCount: v.number(),
    wrongCount: v.optional(v.number()),
    lastAt: v.number(),
  }).index('by_player', ['playerId', 'ref']),

  /** The town's charity fund (zakat + sadaqa), one row per town. */
  townFunds: defineTable({
    townKey: v.string(),
    balance: v.number(),
    given: v.number(),
    donors: v.number(),
    /** The insurance company: premiums collected, claims paid, and what the town had to
     * add when the pool ran short. */
    insurancePool: v.optional(v.number()),
    insurancePremiums: v.optional(v.number()),
    insurancePaid: v.optional(v.number()),
    insuranceSubsidy: v.optional(v.number()),
  }).index('by_town', ['townKey']),

  /** A purchase from another player that is still going through paperwork. The buyer's money
   * is held from the start; after `closesAt` the property changes hands, unless the seller
   * stopped it first. */
  townDeals: defineTable({
    townKey: v.string(),
    what: v.union(v.literal('plot'), v.literal('car')),
    plotId: v.optional(v.string()),
    sellerId: v.id('townPlayers'),
    buyerId: v.id('townPlayers'),
    price: v.number(),
    label: v.string(),
    status: v.union(v.literal('pending'), v.literal('done'), v.literal('cancelled')),
    createdAt: v.number(),
    closesAt: v.number(),
    closedAt: v.optional(v.number()),
    cancelReason: v.optional(v.string()),
  })
    .index('by_status', ['status'])
    .index('by_seller_status', ['sellerId', 'status'])
    .index('by_buyer_status', ['buyerId', 'status']),

  /** An insurance claim: an insured plot was sold below its insured value. A center admin
   * approves (the insurance company pays the difference) or rejects it. */
  townClaims: defineTable({
    townKey: v.string(),
    playerId: v.id('townPlayers'),
    dealId: v.id('townDeals'),
    plotId: v.string(),
    label: v.string(),
    insuredValue: v.number(),
    salePrice: v.number(),
    amount: v.number(),
    buyerName: v.string(),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    createdAt: v.number(),
    decidedAt: v.optional(v.number()),
    decidedBy: v.optional(v.id('teachers')),
    note: v.optional(v.string()),
  })
    .index('by_town_status', ['townKey', 'status'])
    .index('by_player', ['playerId']),

  /** Player-to-player sales on the town market. */
  townSales: defineTable({
    townKey: v.string(),
    sellerId: v.id('townPlayers'),
    buyerId: v.id('townPlayers'),
    what: v.union(v.literal('plot'), v.literal('car')),
    plotId: v.optional(v.string()),
    label: v.string(),
    price: v.number(),
    at: v.number(),
  }).index('by_seller', ['sellerId', 'at']),

  /** Taxi rides. `pickup` → driving to the passenger, `ride` → passenger on board. */
  townTrips: defineTable({
    playerId: v.id('townPlayers'),
    fromStop: v.string(),
    toStop: v.string(),
    status: v.union(v.literal('pickup'), v.literal('ride'), v.literal('done'), v.literal('cancelled')),
    createdAt: v.number(),
    pickedAt: v.optional(v.number()),
    doneAt: v.optional(v.number()),
    fare: v.optional(v.number()),
    /** The passenger's question was answered correctly → tip on arrival. */
    tip: v.optional(v.boolean()),
  }).index('by_player_status', ['playerId', 'status']),

  /** A student's request to buy a gift with their coins. Coins are only *reserved* while
   * `pending` (they count against the available balance); the `gift_redeemed` transaction is
   * written when a teacher/admin confirms with "Buyurtma berdim" (`ordered`). Gift fields are
   * snapshotted so the order still reads correctly if the gift is later edited or deleted. */
  giftOrders: defineTable({
    studentId: v.id('students'),
    groupId: v.id('groups'),
    centerId: v.id('centers'),
    giftId: v.id('gifts'),
    giftName: v.string(),
    giftPrice: v.number(),
    giftImage: v.optional(v.string()),
    giftIcon: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('ordered'),
      v.literal('delivered'),
      v.literal('rejected'),
      v.literal('cancelled'),
    ),
    createdAt: v.number(),
    orderedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    /** Teacher/admin who made the last decision (ordered/delivered/rejected). */
    handledBy: v.optional(v.id('teachers')),
    rejectReason: v.optional(v.string()),
    transactionId: v.optional(v.id('transactions')),
  })
    .index('by_student', ['studentId'])
    .index('by_center', ['centerId']),

  /** In-app notifications. `recipientId` is a `teachers` or `students` id, matching the
   * session's `userId`. */
  notifications: defineTable({
    recipientId: v.union(v.id('teachers'), v.id('students')),
    type: v.union(
      v.literal('order_new'),
      v.literal('order_cancelled'),
      v.literal('order_ordered'),
      v.literal('order_delivered'),
      v.literal('order_rejected'),
      v.literal('pin_reset'),
      v.literal('lesson_quiz'),
      v.literal('town_warning'),
      v.literal('town_restored'),
      v.literal('town_deal_started'),
      v.literal('town_deal_done'),
      v.literal('town_deal_cancelled'),
      v.literal('insurance_claim'),
      v.literal('insurance_paid'),
      v.literal('insurance_rejected'),
      v.literal('homework_new'),
      v.literal('homework_checked'),
      v.literal('homework_warning'),
    ),
    title: v.string(),
    body: v.string(),
    orderId: v.optional(v.id('giftOrders')),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_recipient', ['recipientId', 'createdAt'])
    .index('by_recipient_read', ['recipientId', 'read']),

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
  })
    .index('by_token', ['token'])
    .index('by_user', ['userId']),

  /** A reusable quiz topic ("mavzu") — created once by a teacher and attached to any number
   * of groups via `testAssignments`, so the same 10-20 questions don't need to be recreated
   * per group. */
  tests: defineTable({
    title: v.string(),
    /** Subject section on the "Testlar" page (`TEST_SUBJECTS` keys). Optional for older
     * topics — the app infers it from the title until the teacher picks one. */
    subject: v.optional(v.string()),
    /** Inner section inside the subject ("Asoslar", "Formalar", …) — free text, optional. */
    section: v.optional(v.string()),
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
    /** Asked only in class (lesson Q&A, live game) — never in the town or a self-test, so
     * answers learned by heart while practising can't carry over to the graded Q&A. */
    examOnly: v.optional(v.boolean()),
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

  /** Homework a teacher sets for one lesson (at most one per lesson). Students hand it in from
   * their own account and AI checks it; the coins become that lesson's "Uy vazifasi" entry.
   * `criteria` (answer key / what to look for) is shown to the AI and the teacher only. */
  homeworks: defineTable({
    groupId: v.id('groups'),
    lessonId: v.id('lessons'),
    teacherId: v.id('teachers'),
    title: v.string(),
    task: v.string(),
    criteria: v.optional(v.string()),
    /** `code`: numbered exercises answered in the built-in code editor; `files` (or absent, for
     * the first homework made): one answer as text and/or photos / PDFs. */
    mode: v.optional(v.union(v.literal('code'), v.literal('files'))),
    /** Editor language for `code` homework: python | javascript | html | css | text. */
    language: v.optional(v.string()),
    /** `solution`: the teacher's answer, shown to a student only after their work is checked. */
    exercises: v.optional(v.array(v.object({ text: v.string(), solution: v.optional(v.string()) }))),
    maxCoins: v.number(),
    /** ms; hand-ins close at this moment. */
    dueAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_group', ['groupId'])
    .index('by_lesson', ['lessonId']),

  /** One student's hand-in for a homework and the AI's verdict on it. `entryId` is the coin
   * entry it produced (absent while checking, or when it earned nothing). */
  homeworkSubmissions: defineTable({
    homeworkId: v.id('homeworks'),
    studentId: v.id('students'),
    groupId: v.id('groups'),
    text: v.optional(v.string()),
    files: v.array(
      v.object({ storageId: v.id('_storage'), name: v.string(), contentType: v.string(), sha256: v.string() }),
    ),
    /** `draft`: a code homework still being worked on (exercises saved one by one). */
    status: v.union(v.literal('draft'), v.literal('checking'), v.literal('checked'), v.literal('failed')),
    /** Code homework: one answer per exercise. `typed` / `pasted` are characters entered by
     * typing vs pasting in the editor, `activeMs` the time spent editing — signs of copied work. */
    answers: v.optional(
      v.array(v.object({ code: v.string(), done: v.boolean(), typed: v.number(), pasted: v.number(), activeMs: v.number() })),
    ),
    /** The AI's score (0–10) and feedback per exercise. */
    /** `solution`: the AI's model answer, for exercises the teacher gave no solution for. */
    exerciseResults: v.optional(v.array(v.object({ score: v.number(), feedback: v.string(), solution: v.optional(v.string()) }))),
    attempts: v.number(),
    /** 0–10 from the AI (or the teacher, after a correction). */
    score: v.optional(v.number()),
    /** How likely the AI thinks the work was written by an AI tool. */
    aiSuspicion: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
    aiReason: v.optional(v.string()),
    feedback: v.optional(v.string()),
    coins: v.optional(v.number()),
    /** Coins were cut because the work looked written by AI. */
    penalized: v.optional(v.boolean()),
    /** Coins were capped because the lesson already had homework coins from the teacher. */
    capped: v.optional(v.boolean()),
    error: v.optional(v.string()),
    entryId: v.optional(v.id('coinEntries')),
    teacherEdited: v.optional(v.boolean()),
    submittedAt: v.number(),
    checkedAt: v.optional(v.number()),
  })
    .index('by_homework', ['homeworkId'])
    .index('by_student', ['studentId'])
    .index('by_homework_student', ['homeworkId', 'studentId']),

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

export const ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
}

/** Fine-grained role within a center (only meaningful when `ROLES.role === ROLES.TEACHER`). */
export const TENANT_ROLES = {
  DIRECTOR: 'director',
  EDU_ADMIN: 'edu_admin',
  TEACHER: 'teacher',
}

/** Fixed coin categories and their per-lesson max value — enforced across every coin input. */
export const COIN_CATEGORIES = {
  uy_vazifasi: { key: 'uy_vazifasi', label: 'Uy vazifasi', max: 5 },
  sinf_ishi: { key: 'sinf_ishi', label: 'Sinf ishi', max: 2 },
  savol_javob: { key: 'savol_javob', label: "Savol-javob", max: 3 },
}

export const COIN_CATEGORY_LIST = Object.values(COIN_CATEGORIES)

export const LESSONS_PER_MONTH = 12

/** How many so'm one coin is worth — used to turn coin totals into money figures on the
 * teacher finance dashboard. */
export const COIN_TO_SOM_RATE = 130

/** Product policy cap: the maximum so'm value one student can accumulate over the
 * 12-month program. Used on the superadmin dashboard to flag teachers/groups whose
 * average per-student value is approaching or exceeding this ceiling. */
export const MAX_STUDENT_VALUE_SOM = 330000

export const TRANSACTION_TYPES = {
  COIN_GIVEN: 'coin_given',
  GIFT_REDEEMED: 'gift_redeemed',
  /** Written by the monthly-goal cron when a student closes a month below the goal — the
   * coins earned that month "burn" (are subtracted from the balance). */
  COIN_BURNED: 'coin_burned',
}

/** Monthly coin goal ("oylik maqsad"): a student who collects at least `PERCENT`% of the
 * coins possible in a calendar month keeps all of them; above `HALF_PERCENT`% they keep
 * half of that month's coins; at `HALF_PERCENT`% or below, that month's coins burn
 * when the month closes. Months before `START_MONTH` are never evaluated, so coins collected
 * earlier are never affected. Months are calendar months in Tashkent time (UTC+5). */
export const MONTHLY_GOAL = {
  PERCENT: 70,
  HALF_PERCENT: 50,
  START_MONTH: '2026-10',
  TZ_OFFSET_HOURS: 5,
  /** A month is closed only on day `CLOSE_GRACE_DAYS + 1` of the next month, so lessons
   * teachers enter late (backdated) still count toward the month they belong to. */
  CLOSE_GRACE_DAYS: 3,
}

export const STUDENT_STATUS = {
  ACTIVE: 'active',
  REMOVED: 'removed',
}

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  PLATFORM_ADMIN: '/platforma',
  GROUPS: '/guruhlar',
  GROUP_DETAIL: '/guruhlar/:groupId',
  groupDetail: (id) => `/guruhlar/${id}`,
  STUDENT_PROFILE: '/oquvchi/:studentId',
  studentProfile: (id) => `/oquvchi/${id}`,
  COIN_MARKET: '/coin-market',
  LEADERBOARD: '/reyting',
  SETTINGS: '/sozlamalar',
  TEACHERS_DASHBOARD: '/teachers-dashboard',
  TEACHERS_MANAGEMENT: '/ustozlar',
  GAMES: '/oyinlar',
  GAME: '/oyinlar/:gameId',
  game: (id) => `/oyinlar/${id}`,
  TESTS: '/testlar',
  TEST_DETAIL: '/testlar/:testId',
  testDetail: (id) => `/testlar/${id}`,
  TAKE_TEST: '/testlar/:testId/yechish',
  takeTest: (id) => `/testlar/${id}/yechish`,
}

/** Live quiz games ("jonli o'yinlar"). Points per correct answer fall from `MAX_POINTS` to
 * `MIN_POINTS` the longer the student takes; every correct answer in a row adds
 * `STREAK_BONUS` more (capped at `MAX_STREAK_BONUS`). The last question counts double. */
export const GAME_RULES = {
  MAX_POINTS: 1000,
  MIN_POINTS: 500,
  STREAK_BONUS: 100,
  MAX_STREAK_BONUS: 500,
  DURATIONS: [10, 20, 30, 45],
  DEFAULT_DURATION: 20,
  /** "3, 2, 1…" before every question. */
  LEAD_IN_SEC: 3,
  TEAM_COUNTS: [2, 3, 4],
}

export const GAME_TEAMS = [
  { name: "Ko'k jamoa", color: '#3b82f6' },
  { name: 'Qizil jamoa', color: '#ef4444' },
  { name: 'Yashil jamoa', color: '#22c55e' },
  { name: 'Sariq jamoa', color: '#f59e0b' },
]

/** Heroes a player picks when joining a live game — each one taken by at most one player per
 * game (while free ones remain). Emoji + gradient, so there are no image assets to ship. */
export const GAME_HEROES = [
  { id: 'lion', emoji: '🦁', name: 'Sher', from: '#f59e0b', to: '#ea580c' },
  { id: 'tiger', emoji: '🐯', name: "Yo'lbars", from: '#fb923c', to: '#dc2626' },
  { id: 'fox', emoji: '🦊', name: 'Tulki', from: '#f97316', to: '#b45309' },
  { id: 'wolf', emoji: '🐺', name: "Bo'ri", from: '#64748b', to: '#1e293b' },
  { id: 'panda', emoji: '🐼', name: 'Panda', from: '#a3a3a3', to: '#262626' },
  { id: 'unicorn', emoji: '🦄', name: 'Yagonashox', from: '#f0abfc', to: '#a855f7' },
  { id: 'dragon', emoji: '🐉', name: 'Ajdar', from: '#22c55e', to: '#047857' },
  { id: 'eagle', emoji: '🦅', name: 'Burgut', from: '#a16207', to: '#422006' },
  { id: 'owl', emoji: '🦉', name: "Boyo'g'li", from: '#a78bfa', to: '#5b21b6' },
  { id: 'shark', emoji: '🦈', name: 'Akula', from: '#38bdf8', to: '#1d4ed8' },
  { id: 'dino', emoji: '🦖', name: 'Dinozavr', from: '#84cc16', to: '#3f6212' },
  { id: 'octopus', emoji: '🐙', name: 'Sakkizoyoq', from: '#f472b6', to: '#be123c' },
  { id: 'robot', emoji: '🤖', name: 'Robot', from: '#94a3b8', to: '#3b82f6' },
  { id: 'ninja', emoji: '🥷', name: 'Ninja', from: '#475569', to: '#020617' },
  { id: 'wizard', emoji: '🧙', name: 'Sehrgar', from: '#818cf8', to: '#3730a3' },
  { id: 'rocket', emoji: '🚀', name: 'Raketa', from: '#60a5fa', to: '#7c3aed' },
]

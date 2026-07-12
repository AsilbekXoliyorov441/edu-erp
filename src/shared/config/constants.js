export const ROLES = {
  TEACHER: 'teacher',
  STUDENT: 'student',
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
}

export const STUDENT_STATUS = {
  ACTIVE: 'active',
  REMOVED: 'removed',
}

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
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
  LESSON_TESTS: '/darslar/:lessonId/testlar',
  lessonTests: (id) => `/darslar/${id}/testlar`,
  TESTS: '/testlar',
  TAKE_TEST: '/testlar/:lessonId',
  takeTest: (id) => `/testlar/${id}`,
}

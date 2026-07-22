import { ConvexError } from 'convex/values'
import { requireSession } from './authz'

/** Shared multi-tenant ownership helpers, called from within query/mutation handlers
 * (needs `ctx.db`). Every non-platform-admin caller belongs to exactly one center
 * (`centerId`), resolved from their `teachers` row (directly, or via student -> group ->
 * teacher). `director`/`edu_admin` see everything *within their center* (`{ all: true }`);
 * a regular teacher (or a student via their group) is scoped to one teacher's data inside
 * that center. `platform_admin` is a separate branch — they manage centers, not
 * groups/students/gifts, so `getScope` returns `{ platformAdmin: true }` for them and every
 * helper below explicitly refuses that shape. */

async function requireActiveCenter(ctx, centerId) {
  if (!centerId) return
  const center = await ctx.db.get(centerId)
  if (!center) throw new ConvexError('Markaz topilmadi')
  if (center.status === 'suspended') throw new ConvexError("Markaz faoliyati to'xtatilgan")
  if (center.subscriptionEndsAt < new Date().toISOString()) throw new ConvexError('Obuna muddati tugagan')
}

export async function getScope(ctx, token) {
  const session = await requireSession(ctx, token)

  if (session.role === 'teacher') {
    const teacher = await ctx.db.get(session.userId)
    if (!teacher) throw new ConvexError("O'qituvchi topilmadi")

    if (teacher.role === 'platform_admin') {
      return { platformAdmin: true, session }
    }

    await requireActiveCenter(ctx, teacher.centerId)

    const role = teacher.role ?? (teacher.isSuperAdmin ? 'director' : 'teacher')
    if (role === 'director' || role === 'edu_admin') {
      return { all: true, centerId: teacher.centerId, role, session }
    }
    return { all: false, teacherId: session.userId, centerId: teacher.centerId, role: 'teacher', session }
  }

  const student = await ctx.db.get(session.userId)
  if (!student) throw new ConvexError("O'quvchi topilmadi")
  const group = await ctx.db.get(student.groupId)
  if (!group) throw new ConvexError('Guruh topilmadi')
  const owner = group.teacherId ? await ctx.db.get(group.teacherId) : null
  await requireActiveCenter(ctx, owner?.centerId)
  return { all: false, teacherId: group.teacherId, centerId: owner?.centerId, role: 'student', session }
}

/** Every teacher belonging to a center — the building block for "all" scope
 * (director/edu_admin), since groups/gifts/tests don't carry `centerId` directly. Exported
 * for modules (like `tests.js`) that need the same center-wide reach outside of the
 * group/student helpers below. */
export async function getCenterTeacherIdSet(ctx, centerId) {
  const teachers = await ctx.db
    .query('teachers')
    .withIndex('by_center', (q) => q.eq('centerId', centerId))
    .collect()
  return new Set(teachers.map((t) => t._id))
}

export async function getScopedGroupIdSet(ctx, token) {
  const scope = await getScope(ctx, token)
  if (scope.platformAdmin) throw new ConvexError("Platforma SuperAdmin guruhlarga to'g'ridan-to'g'ri kira olmaydi")

  if (scope.all) {
    const teacherIds = await getCenterTeacherIdSet(ctx, scope.centerId)
    const groups = await ctx.db.query('groups').collect()
    return new Set(groups.filter((g) => g.teacherId && teacherIds.has(g.teacherId)).map((g) => g._id))
  }

  const groups = await ctx.db
    .query('groups')
    .withIndex('by_teacher', (q) => q.eq('teacherId', scope.teacherId))
    .collect()
  return new Set(groups.map((g) => g._id))
}

export async function getScopedStudentIdSet(ctx, token) {
  const groupIdSet = await getScopedGroupIdSet(ctx, token)
  const students = await ctx.db.query('students').collect()
  return new Set(students.filter((s) => groupIdSet.has(s.groupId)).map((s) => s._id))
}

export async function requireGroupOwner(ctx, token, groupId) {
  const scope = await getScope(ctx, token)
  if (scope.platformAdmin || scope.session.role !== 'teacher') throw new ConvexError("O'qituvchi huquqi talab qilinadi")
  const group = await ctx.db.get(groupId)
  if (!group) throw new ConvexError('Guruh topilmadi')

  if (scope.all) {
    const owner = group.teacherId ? await ctx.db.get(group.teacherId) : null
    if (!owner || owner.centerId !== scope.centerId) throw new ConvexError("Bu guruhga ruxsatingiz yo'q")
    return scope.session
  }
  if (group.teacherId !== scope.teacherId) throw new ConvexError("Bu guruhga ruxsatingiz yo'q")
  return scope.session
}

export async function requireStudentOwner(ctx, token, studentId) {
  const student = await ctx.db.get(studentId)
  if (!student) throw new ConvexError("O'quvchi topilmadi")
  return requireGroupOwner(ctx, token, student.groupId)
}

export async function requireLessonOwner(ctx, token, lessonId) {
  const lesson = await ctx.db.get(lessonId)
  if (!lesson) throw new ConvexError('Dars topilmadi')
  return requireGroupOwner(ctx, token, lesson.groupId)
}

/** Read access to a lesson's quiz content — broader than `requireLessonOwner` (which is
 * write-only, teacher-only): a teacher gets the usual ownership rule, but a student is
 * also let in as long as the lesson belongs to their OWN group (never a sibling group
 * under the same center, even though a director/edu_admin's own scope spans all of them). */
export async function requireLessonAccess(ctx, token, lessonId) {
  const scope = await getScope(ctx, token)
  const lesson = await ctx.db.get(lessonId)
  if (!lesson) throw new ConvexError('Dars topilmadi')

  if (scope.platformAdmin) throw new ConvexError("Bu darsga ruxsatingiz yo'q")

  if (scope.session.role === 'teacher') {
    const group = await ctx.db.get(lesson.groupId)
    if (!group) throw new ConvexError('Guruh topilmadi')
    if (scope.all) {
      const owner = group.teacherId ? await ctx.db.get(group.teacherId) : null
      if (!owner || owner.centerId !== scope.centerId) throw new ConvexError("Bu darsga ruxsatingiz yo'q")
    } else if (group.teacherId !== scope.teacherId) {
      throw new ConvexError("Bu darsga ruxsatingiz yo'q")
    }
    return { scope, lesson }
  }

  const student = await ctx.db.get(scope.session.userId)
  if (!student || student.groupId !== lesson.groupId) throw new ConvexError("Bu darsga ruxsatingiz yo'q")
  return { scope, lesson }
}

/** Requires a center-wide admin (`director` or `edu_admin`) — the caller sees/manages
 * everything within their own center. Does NOT admit `platform_admin` (they manage centers,
 * not a single center's groups/teachers/gifts). */
export async function requireSuperAdmin(ctx, token) {
  const scope = await getScope(ctx, token)
  if (scope.session.role !== 'teacher' || !scope.all) {
    throw new ConvexError('Faqat markaz administratori uchun ruxsat berilgan')
  }
  return scope.session
}

/** Director-only — used for actions restricted to the center's top role, like creating an
 * EduSuperAdmin account. */
export async function requireDirector(ctx, token) {
  const scope = await getScope(ctx, token)
  if (scope.platformAdmin || scope.role !== 'director') {
    throw new ConvexError('Faqat direktor uchun ruxsat berilgan')
  }
  return scope.session
}

export async function requirePlatformAdmin(ctx, token) {
  const scope = await getScope(ctx, token)
  if (!scope.platformAdmin) throw new ConvexError('Faqat platforma SuperAdmin uchun ruxsat berilgan')
  return scope.session
}

/** Ownership check for a test (quiz topic) — write access, teacher-only, scoped like
 * `requireGroupOwner`. Tests are owned directly by the teacher who created them (not via a
 * lesson/group), since one topic can be attached to several groups at once. */
export async function requireTestOwner(ctx, token, testId) {
  const test = await ctx.db.get(testId)
  if (!test) throw new ConvexError('Mavzu topilmadi')
  const scope = await getScope(ctx, token)
  if (scope.platformAdmin || scope.session.role !== 'teacher') throw new ConvexError("O'qituvchi huquqi talab qilinadi")

  if (scope.all) {
    const owner = await ctx.db.get(test.teacherId)
    if (!owner || owner.centerId !== scope.centerId) throw new ConvexError("Bu mavzuga ruxsatingiz yo'q")
  } else if (test.teacherId !== scope.teacherId) {
    throw new ConvexError("Bu mavzuga ruxsatingiz yo'q")
  }
  return { scope, test }
}

/** Read access to a test's quiz content: the owning teacher (or any center-wide admin), or
 * a student whose own group has the test attached via `testAssignments`. */
export async function requireTestAccess(ctx, token, testId) {
  const test = await ctx.db.get(testId)
  if (!test) throw new ConvexError('Mavzu topilmadi')
  const scope = await getScope(ctx, token)
  if (scope.platformAdmin) throw new ConvexError("Bu testga ruxsatingiz yo'q")

  if (scope.session.role === 'teacher') {
    if (scope.all) {
      const owner = await ctx.db.get(test.teacherId)
      if (!owner || owner.centerId !== scope.centerId) throw new ConvexError("Bu mavzuga ruxsatingiz yo'q")
    } else if (test.teacherId !== scope.teacherId) {
      throw new ConvexError("Bu mavzuga ruxsatingiz yo'q")
    }
    return { scope, test }
  }

  const student = await ctx.db.get(scope.session.userId)
  if (!student) throw new ConvexError("O'quvchi topilmadi")
  const assignment = await ctx.db
    .query('testAssignments')
    .withIndex('by_test', (q) => q.eq('testId', testId))
    .filter((q) => q.eq(q.field('groupId'), student.groupId))
    .first()
  if (!assignment) throw new ConvexError("Bu testga ruxsatingiz yo'q")
  return { scope, test }
}

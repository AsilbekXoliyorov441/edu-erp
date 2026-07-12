import { ConvexError } from 'convex/values'
import { requireSession } from './authz'

/** Shared multi-teacher ownership helpers, called from within query/mutation handlers
 * (needs `ctx.db`). Superadmin teachers see everything (`{ all: true }`); everyone else
 * (a regular teacher, or a student via their group) is scoped to one teacher's data. */

export async function getScope(ctx, token) {
  const session = await requireSession(ctx, token)

  if (session.role === 'teacher') {
    const teacher = await ctx.db.get(session.userId)
    if (!teacher) throw new ConvexError("O'qituvchi topilmadi")
    if (teacher.isSuperAdmin) return { all: true, session }
    return { all: false, teacherId: session.userId, session }
  }

  const student = await ctx.db.get(session.userId)
  if (!student) throw new ConvexError("O'quvchi topilmadi")
  const group = await ctx.db.get(student.groupId)
  if (!group) throw new ConvexError('Guruh topilmadi')
  return { all: false, teacherId: group.teacherId, session }
}

/** `null` means "no filter needed" (superadmin) — callers must handle that case explicitly. */
export async function getScopedGroupIdSet(ctx, token) {
  const scope = await getScope(ctx, token)
  if (scope.all) return null
  const groups = await ctx.db
    .query('groups')
    .withIndex('by_teacher', (q) => q.eq('teacherId', scope.teacherId))
    .collect()
  return new Set(groups.map((g) => g._id))
}

/** `null` means "no filter needed" (superadmin). */
export async function getScopedStudentIdSet(ctx, token) {
  const groupIdSet = await getScopedGroupIdSet(ctx, token)
  if (groupIdSet === null) return null
  const students = await ctx.db.query('students').collect()
  return new Set(students.filter((s) => groupIdSet.has(s.groupId)).map((s) => s._id))
}

export async function requireGroupOwner(ctx, token, groupId) {
  const scope = await getScope(ctx, token)
  if (scope.session.role !== 'teacher') throw new ConvexError("O'qituvchi huquqi talab qilinadi")
  if (scope.all) return scope.session
  const group = await ctx.db.get(groupId)
  if (!group || group.teacherId !== scope.teacherId) throw new ConvexError("Bu guruhga ruxsatingiz yo'q")
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
 * under the same teacher, even though the teacher's own scope spans all of them). */
export async function requireLessonAccess(ctx, token, lessonId) {
  const scope = await getScope(ctx, token)
  const lesson = await ctx.db.get(lessonId)
  if (!lesson) throw new ConvexError('Dars topilmadi')

  if (scope.session.role === 'teacher') {
    if (!scope.all) {
      const group = await ctx.db.get(lesson.groupId)
      if (!group || group.teacherId !== scope.teacherId) throw new ConvexError("Bu darsga ruxsatingiz yo'q")
    }
    return { scope, lesson }
  }

  const student = await ctx.db.get(scope.session.userId)
  if (!student || student.groupId !== lesson.groupId) throw new ConvexError("Bu darsga ruxsatingiz yo'q")
  return { scope, lesson }
}

export async function requireSuperAdmin(ctx, token) {
  const scope = await getScope(ctx, token)
  if (scope.session.role !== 'teacher' || !scope.all) {
    throw new ConvexError('Faqat superadmin uchun ruxsat berilgan')
  }
  return scope.session
}

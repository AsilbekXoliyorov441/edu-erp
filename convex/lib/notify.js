import { getCenterTeacherIdSet } from './scoping'

/** Writes one in-app notification per recipient (duplicates removed). */
export async function notify(ctx, recipientIds, { type, title, body, orderId }) {
  const createdAt = Date.now()
  for (const recipientId of new Set(recipientIds.filter(Boolean))) {
    await ctx.db.insert('notifications', { recipientId, type, title, body, orderId, read: false, createdAt })
  }
}

/** Everyone who handles a group's gift orders: the group's own teacher plus the center's
 * admins (director / edu_admin). */
export async function getOrderHandlerIds(ctx, group, centerId) {
  const ids = group?.teacherId ? [group.teacherId] : []
  const teacherIds = await getCenterTeacherIdSet(ctx, centerId)
  for (const id of teacherIds) {
    const teacher = await ctx.db.get(id)
    const role = teacher?.role ?? (teacher?.isSuperAdmin ? 'director' : 'teacher')
    if (role === 'director' || role === 'edu_admin') ids.push(id)
  }
  return ids
}

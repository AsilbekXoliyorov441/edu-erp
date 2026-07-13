import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'
import { mapId } from '@/shared/lib/convex/mapId'

/** Teacher-side: questions belonging to one topic, with CRUD (includes `correctIndex` —
 * editing view only, never exposed to students via this hook). */
export function useQuestionsForTest(testId) {
  const token = useAuthStore((s) => s.token)
  const items = (useQuery(api.testQuestions.listForTeacher, token && testId ? { token, testId } : 'skip') ?? []).map(mapId)
  const createMutation = useMutation(api.testQuestions.create)
  const updateMutation = useMutation(api.testQuestions.update)
  const removeMutation = useMutation(api.testQuestions.remove)

  return {
    items,
    create: (question) => createMutation({ token, testId, ...question }),
    update: (id, question) => updateMutation({ token, id, ...question }),
    remove: (id) => removeMutation({ token, id }),
  }
}

/** Uploads a question image straight to Convex file storage and resolves to the
 * `imageStorageId` to save on the question — the file itself never passes through our
 * own mutation payload. */
export function useUploadQuestionImage(testId) {
  const token = useAuthStore((s) => s.token)
  const generateUploadUrl = useMutation(api.testQuestions.generateUploadUrl)

  return async (file) => {
    const uploadUrl = await generateUploadUrl({ token, testId })
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!response.ok) throw new Error('Rasm yuklashda xatolik yuz berdi')
    const { storageId } = await response.json()
    return storageId
  }
}

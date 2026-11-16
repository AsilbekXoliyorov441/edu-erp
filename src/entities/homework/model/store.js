import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'

/** Teacher: a group's latest homework with hand-in counts (`undefined` while loading). */
export function useGroupHomeworks(groupId) {
  const token = useAuthStore((s) => s.token)
  return useQuery(api.homework.forGroup, token && groupId ? { token, groupId } : 'skip')
}

/** Teacher: every hand-in of one homework. */
export function useHomeworkSubmissions(homeworkId) {
  const token = useAuthStore((s) => s.token)
  return useQuery(api.homework.submissions, token && homeworkId ? { token, homeworkId } : 'skip')
}

/** Student: their group's lessons (latest first), each with its homework if any. */
export function useMyHomeworks() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)
  return useQuery(api.homework.mine, token && role === 'student' ? { token } : 'skip')
}

/** Student: open homework not handed in yet (menu badge). */
export function useMyOpenHomeworkCount() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)
  return useQuery(api.homework.myOpenCount, token && role === 'student' ? { token } : 'skip') ?? 0
}

export function useHomeworkActions() {
  const token = useAuthStore((s) => s.token)
  const create = useMutation(api.homework.create)
  const remove = useMutation(api.homework.remove)
  const setCoins = useMutation(api.homework.setCoins)
  const recheck = useMutation(api.homework.recheck)
  const uploadUrl = useMutation(api.homework.generateUploadUrl)
  const submit = useMutation(api.homework.submit)
  const saveAnswer = useMutation(api.homework.saveAnswer)
  const finish = useMutation(api.homework.finish)

  /** Uploads each file to storage, then hands the homework in. Returns `{ ok, error }`. */
  const handIn = async (homeworkId, text, files) => {
    const uploaded = []
    for (const file of files) {
      const url = await uploadUrl({ token })
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
      if (!res.ok) throw new Error('upload')
      const { storageId } = await res.json()
      uploaded.push({ storageId, name: file.name })
    }
    return await submit({ token, homeworkId, text, files: uploaded })
  }

  return {
    create: (fields) => create({ token, ...fields }),
    remove: (homeworkId) => remove({ token, homeworkId }),
    setCoins: (submissionId, coins, feedback) => setCoins({ token, submissionId, coins, ...(feedback ? { feedback } : {}) }),
    recheck: (submissionId) => recheck({ token, submissionId }),
    handIn,
    /** Code homework: save one exercise (`done` true = "Done", false = reopened for editing). */
    saveAnswer: (homeworkId, index, code, done, stats) =>
      saveAnswer({ token, homeworkId, index, code, done, typed: stats.typed, pasted: stats.pasted, activeMs: stats.activeMs }),
    finish: (homeworkId) => finish({ token, homeworkId }),
  }
}

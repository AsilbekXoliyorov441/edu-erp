import { useState } from 'react'
import { toast } from 'sonner'
import { COIN_CATEGORY_LIST } from '@/shared/config/constants'
import { useLessonStore } from '@/entities/lesson/model/store'

const ATTENDED = new Set(['present', 'late'])

const nullScores = () => Object.fromEntries(COIN_CATEGORY_LIST.map((c) => [c.key, null]))
const QA_CATEGORY = COIN_CATEGORY_LIST.find((c) => c.input === 'cells')
const PICKED_CATEGORIES = COIN_CATEGORY_LIST.filter((c) => c.input !== 'cells')
const maxScores = () => Object.fromEntries(COIN_CATEGORY_LIST.map((c) => [c.key, c.max]))

/** Nothing is pre-selected: `null` means "not graded yet", which is different from 0. */
function emptyDraft(students) {
  return {
    scores: Object.fromEntries(students.map((s) => [s.id, nullScores()])),
    attendance: Object.fromEntries(students.map((s) => [s.id, null])),
    // Q&A cells each student has lit, e.g. { [studentId]: [2, 4] } — every lit cell is 1 coin.
    qaSlots: {},
  }
}

/** Owns the in-progress lesson session draft; `save()` submits it as one atomic Convex
 * mutation that creates the Lesson + every non-zero CoinEntry + Transaction + Attendance
 * record together — the server computes the canonical lesson number/month, not this draft. */
export function useLessonSession({ group, students, date }) {
  const [draft, setDraft] = useState(() => emptyDraft(students))
  // Last successfully saved draft (or the initial empty one) — what "Bekor qilish" restores.
  const [baseline, setBaseline] = useState(draft)
  const [savedOnce, setSavedOnce] = useState(false)
  const [saving, setSaving] = useState(false)

  const saveSession = useLessonStore((s) => s.saveSession)
  const { scores, attendance } = draft

  const qaSlots = draft.qaSlots ?? {}

  const update = (fn) =>
    setDraft((prev) =>
      fn({ scores: { ...prev.scores }, attendance: { ...prev.attendance }, qaSlots: { ...(prev.qaSlots ?? {}) } }),
    )

  const fullSlots = () => Array.from({ length: QA_CATEGORY.max }, (_, i) => i + 1)

  /** Lit cells are the source of truth for Q&A; the score is just how many are lit. */
  const setQaSlots = (next, studentId, slots) => {
    next.qaSlots[studentId] = slots
    next.scores[studentId] = { ...next.scores[studentId], [QA_CATEGORY.key]: slots.length }
  }

  // Picking a score for a student with no attendance yet marks them present; absent students
  // can't receive scores at all.
  const setScore = (studentId, categoryKey, value) =>
    update((next) => {
      if (next.attendance[studentId] === 'absent') return next
      if (!next.attendance[studentId]) next.attendance[studentId] = 'present'
      next.scores[studentId] = { ...next.scores[studentId], [categoryKey]: value }
      return next
    })

  // Marking a student absent also clears their coin scores — a student who wasn't in class
  // can't have earned homework/classwork/Q&A coins for this session.
  const setAttendance = (studentId, status) =>
    update((next) => {
      next.attendance[studentId] = status
      if (status === 'absent') {
        next.scores[studentId] = nullScores()
        delete next.qaSlots[studentId]
      }
      return next
    })

  /** Q&A cell `n` on/off for a student — each lit cell is 1 coin, in any order. */
  const toggleQaSlot = (studentId, n) =>
    update((next) => {
      if (next.attendance[studentId] === 'absent') return next
      if (!next.attendance[studentId]) next.attendance[studentId] = 'present'
      const slots = next.qaSlots[studentId] ?? []
      setQaSlots(
        next,
        studentId,
        slots.includes(n) ? slots.filter((x) => x !== n) : [...slots, n].sort((x, y) => x - y),
      )
      return next
    })

  /** Row sparkles: max in every category; "late" is kept, anything else becomes "present". */
  const fillRowMax = (studentId) =>
    update((next) => {
      if (next.attendance[studentId] !== 'late') next.attendance[studentId] = 'present'
      next.scores[studentId] = maxScores()
      next.qaSlots[studentId] = fullSlots()
      return next
    })

  /** Column "Max": only students who attended get this category's max. */
  const fillColumnMax = (categoryKey) => {
    const max = COIN_CATEGORY_LIST.find((c) => c.key === categoryKey).max
    update((next) => {
      students.forEach((s) => {
        if (!ATTENDED.has(next.attendance[s.id])) return
        next.scores[s.id] = { ...next.scores[s.id], [categoryKey]: max }
        if (categoryKey === QA_CATEGORY.key) next.qaSlots[s.id] = fullSlots()
      })
      return next
    })
  }

  const markAllPresent = () =>
    update((next) => {
      students.forEach((s) => {
        next.attendance[s.id] = 'present'
      })
      return next
    })

  /** Everyone except absent students gets full marks (unmarked attendance becomes "present"). */
  const fillAllMax = () =>
    update((next) => {
      students.forEach((s) => {
        if (next.attendance[s.id] === 'absent') return
        if (!next.attendance[s.id]) next.attendance[s.id] = 'present'
        next.scores[s.id] = maxScores()
        next.qaSlots[s.id] = fullSlots()
      })
      return next
    })

  /** Clears every score; attendance is kept. */
  const clearScores = () =>
    update((next) => {
      students.forEach((s) => {
        next.scores[s.id] = nullScores()
      })
      next.qaSlots = {}
      return next
    })

  const reset = () => setDraft(baseline)

  const getRowTotal = (studentId) => {
    if (!ATTENDED.has(attendance[studentId])) return 0
    return Object.values(scores[studentId] ?? {}).reduce((sum, v) => sum + (v ?? 0), 0)
  }

  /** Not graded = attendance unmarked, or attended with a picked-score category still `null`.
   * Cell categories (Savol-javob) start at 0 — a student who answered nothing is graded. */
  const isUngraded = (studentId) => {
    const status = attendance[studentId]
    if (!status) return true
    if (status === 'absent') return false
    return PICKED_CATEGORIES.some((c) => (scores[studentId]?.[c.key] ?? null) === null)
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline)

  const save = async () => {
    setSaving(true)
    const snapshot = draft
    const scoreList = []
    students.forEach((student) => {
      COIN_CATEGORY_LIST.forEach((category) => {
        const value = snapshot.scores[student.id]?.[category.key] ?? 0
        if (value <= 0) return
        scoreList.push({ studentId: student.id, category: category.key, value })
      })
    })
    const attendanceList = students.map((student) => ({
      studentId: student.id,
      status: snapshot.attendance[student.id] ?? 'present',
    }))

    try {
      const result = await saveSession(group.id, scoreList, attendanceList, date)
      setBaseline(snapshot)
      setSavedOnce(true)
      toast.success(`✅ ${result.lessonNumber}-dars saqlandi — ${result.coinsGiven} coin, ${result.entriesCount} ta yozuv qo'shildi`)
      return result
    } finally {
      setSaving(false)
    }
  }

  return {
    scores,
    attendance,
    setScore,
    setAttendance,
    qaSlots,
    toggleQaSlot,
    fillRowMax,
    fillColumnMax,
    markAllPresent,
    fillAllMax,
    clearScores,
    reset,
    getRowTotal,
    isUngraded,
    dirty,
    savedOnce,
    save,
    saving,
  }
}

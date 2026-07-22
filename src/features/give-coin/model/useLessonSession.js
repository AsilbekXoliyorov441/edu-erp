import { useState } from 'react'
import { toast } from 'sonner'
import { COIN_CATEGORY_LIST } from '@/shared/config/constants'
import { useLessonStore } from '@/entities/lesson/model/store'

function emptyScores(students) {
  return Object.fromEntries(students.map((s) => [s.id, Object.fromEntries(COIN_CATEGORY_LIST.map((c) => [c.key, 0]))]))
}

function initialAttendance(students) {
  return Object.fromEntries(students.map((s) => [s.id, 'present']))
}

/** Owns the in-progress lesson session draft; `save()` submits it as one atomic Convex
 * mutation that creates the Lesson + every non-zero CoinEntry + Transaction + Attendance
 * record together — the server computes the canonical lesson number/month, not this draft. */
export function useLessonSession({ group, students, date }) {
  const [scores, setScores] = useState(() => emptyScores(students))
  const [attendance, setAttendanceState] = useState(() => initialAttendance(students))
  const [saving, setSaving] = useState(false)

  const saveSession = useLessonStore((s) => s.saveSession)

  const setScore = (studentId, categoryKey, value) => {
    setScores((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [categoryKey]: value } }))
  }

  // Marking a student absent also zeroes their coin scores — a student who wasn't in class
  // can't have earned homework/classwork/Q&A coins for this session.
  const setAttendance = (studentId, status) => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }))
    if (status === 'absent') {
      setScores((prev) => ({ ...prev, [studentId]: Object.fromEntries(COIN_CATEGORY_LIST.map((c) => [c.key, 0])) }))
    }
  }

  const getRowTotal = (studentId) => Object.values(scores[studentId] ?? {}).reduce((sum, v) => sum + v, 0)

  const save = async () => {
    setSaving(true)
    const scoreList = []
    students.forEach((student) => {
      COIN_CATEGORY_LIST.forEach((category) => {
        const value = scores[student.id]?.[category.key] ?? 0
        if (value <= 0) return
        scoreList.push({ studentId: student.id, category: category.key, value })
      })
    })
    const attendanceList = students.map((student) => ({
      studentId: student.id,
      status: attendance[student.id] ?? 'present',
    }))

    try {
      const result = await saveSession(group.id, scoreList, attendanceList, date)
      toast.success(`✅ ${result.lessonNumber}-dars saqlandi — ${result.coinsGiven} coin, ${result.entriesCount} ta yozuv qo'shildi`)
      return result
    } finally {
      setSaving(false)
    }
  }

  return { scores, setScore, attendance, setAttendance, getRowTotal, save, saving }
}

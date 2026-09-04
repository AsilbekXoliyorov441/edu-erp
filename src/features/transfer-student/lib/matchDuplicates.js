import { STUDENT_STATUS } from '@/shared/config/constants'

/** Names are typed by hand, so the same person is routinely spelled with a different case,
 * doubled spaces, or one of the four apostrophes Uzbek text mixes freely (o'/oʻ/o‘/o’).
 * Folding all of that away is what lets the duplicate prompt actually fire — it only ever
 * widens what gets *asked about*, never what gets merged, since the teacher confirms each
 * pair by hand. */
export function normalizeName(fullName) {
  return (fullName ?? '')
    .replace(/[ʻʼ‘’`´]/g, "'")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/** For each student being transferred, the active students already in the target group who
 * carry the same name. Returns one entry per student that has at least one such match — the
 * teacher is asked about exactly these, and answers "same person" or "two different people". */
export function findDuplicates(students, targetGroupId, allStudents) {
  const targetRoster = allStudents.filter(
    (s) => s.groupId === targetGroupId && s.status === STUDENT_STATUS.ACTIVE,
  )

  return students
    .map((student) => ({
      student,
      matches: targetRoster.filter(
        (candidate) => candidate.id !== student.id && normalizeName(candidate.fullName) === normalizeName(student.fullName),
      ),
    }))
    .filter((conflict) => conflict.matches.length > 0)
}

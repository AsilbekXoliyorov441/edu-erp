import { query, mutation, internalQuery, internalMutation } from './_generated/server'
import { internal } from './_generated/api'
import { v, ConvexError } from 'convex/values'
import { getScope, requireGroupOwner } from './lib/scoping'
import { notify } from './lib/notify'
import { refreshStudentStats } from './lib/studentStats'
import { COIN_CATEGORIES, HOMEWORK, STUDENT_STATUS } from '../src/shared/config/constants'

/** Homework handed in from the student's own account and checked by AI (see
 * `homeworkActions.check`). The coins land as the lesson's "Uy vazifasi" entry right away, so
 * in a group that uses this the teacher no longer grades that column by hand. */

const CATEGORY = 'uy_vazifasi'
const CATEGORY_MAX = COIN_CATEGORIES.uy_vazifasi.max
const LIST_LIMIT = 30

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']

/** The calling student (not a teacher, not an admin). */
async function requireStudent(ctx, token) {
  const scope = await getScope(ctx, token)
  if (scope.platformAdmin || scope.session.role !== 'student') throw new ConvexError("Faqat o'quvchi uchun")
  const student = await ctx.db.get(scope.session.userId)
  if (!student || student.status !== STUDENT_STATUS.ACTIVE) throw new ConvexError("O'quvchi topilmadi")
  return student
}

async function requireHomeworkOwner(ctx, token, homeworkId) {
  const homework = await ctx.db.get(homeworkId)
  if (!homework) throw new ConvexError('Uy vazifasi topilmadi')
  await requireGroupOwner(ctx, token, homework.groupId)
  return homework
}

function coinsFor(score, maxCoins) {
  return Math.max(0, Math.min(maxCoins, Math.round((score / 10) * maxCoins)))
}

/** Gives the submission `coins` as its lesson's "Uy vazifasi" entry — creating, changing or
 * removing that entry and its transaction. A lesson never gets more homework coins than the
 * category max, counting any the teacher already gave by hand. */
async function writeCoins(ctx, submission, homework, coins) {
  const lessonEntries = await ctx.db
    .query('coinEntries')
    .withIndex('by_lesson', (q) => q.eq('lessonId', homework.lessonId))
    .collect()
  const other = lessonEntries
    .filter((e) => e.studentId === submission.studentId && e.category === CATEGORY && e._id !== submission.entryId)
    .reduce((sum, e) => sum + e.value, 0)
  const value = Math.max(0, Math.min(coins, CATEGORY_MAX - other))
  const capped = value < coins

  const existing = submission.entryId ? await ctx.db.get(submission.entryId) : null
  const linked = existing
    ? (
        await ctx.db
          .query('transactions')
          .withIndex('by_student', (q) => q.eq('studentId', submission.studentId))
          .collect()
      ).filter((t) => t.relatedEntryId === existing._id)
    : []

  let entryId = existing?._id
  if (value <= 0) {
    for (const t of linked) await ctx.db.delete(t._id)
    if (existing) await ctx.db.delete(existing._id)
    entryId = undefined
  } else if (existing) {
    await ctx.db.patch(existing._id, { value })
    for (const t of linked) await ctx.db.patch(t._id, { amount: value })
  } else {
    const now = new Date().toISOString()
    entryId = await ctx.db.insert('coinEntries', {
      studentId: submission.studentId,
      lessonId: homework.lessonId,
      category: CATEGORY,
      value,
      maxValue: CATEGORY_MAX,
      givenAt: now,
    })
    await ctx.db.insert('transactions', {
      studentId: submission.studentId,
      type: 'coin_given',
      amount: value,
      relatedEntryId: entryId,
      timestamp: now,
    })
  }
  await refreshStudentStats(ctx, [submission.studentId])
  return { value, entryId, capped }
}

/** Removes a submission with its coins and files. */
async function deleteSubmission(ctx, submission, homework) {
  if (submission.entryId) await writeCoins(ctx, submission, homework, 0)
  for (const f of submission.files) await ctx.storage.delete(f.storageId).catch(() => {})
  await ctx.db.delete(submission._id)
}

/** Student view of a homework: never the teacher's answer key. */
function publicHomework(h) {
  return {
    id: h._id,
    title: h.title,
    task: h.task,
    mode: h.mode ?? 'files',
    language: h.language ?? 'text',
    exercises: (h.exercises ?? []).map((e) => e.text),
    maxCoins: h.maxCoins,
    dueAt: h.dueAt,
    createdAt: h.createdAt,
  }
}

function submissionView(s) {
  return {
    id: s._id,
    status: s.status,
    text: s.text ?? '',
    fileCount: s.files.length,
    score: s.score ?? null,
    coins: s.coins ?? null,
    feedback: s.feedback ?? null,
    penalized: !!s.penalized,
    capped: !!s.capped,
    aiSuspicion: s.aiSuspicion ?? null,
    aiReason: s.aiReason ?? null,
    teacherEdited: !!s.teacherEdited,
    answers: s.answers ?? [],
    exerciseResults: s.exerciseResults ?? [],
    error: s.error ?? null,
    submittedAt: s.submittedAt,
    checkedAt: s.checkedAt ?? null,
  }
}

// ── Teacher ───────────────────────────────────────────────────────────────────────────

/** Teacher: the group's latest homework with hand-in counts. A group with any homework has
 * its "Uy vazifasi" column graded by AI instead of by hand. */
export const forGroup = query({
  args: { token: v.string(), groupId: v.id('groups') },
  handler: async (ctx, { token, groupId }) => {
    await requireGroupOwner(ctx, token, groupId)
    const list = await ctx.db
      .query('homeworks')
      .withIndex('by_group', (q) => q.eq('groupId', groupId))
      .order('desc')
      .take(LIST_LIMIT)
    return await Promise.all(
      list.map(async (h) => {
        const subs = await ctx.db
          .query('homeworkSubmissions')
          .withIndex('by_homework', (q) => q.eq('homeworkId', h._id))
          .collect()
        const lesson = await ctx.db.get(h.lessonId)
        return {
          ...publicHomework(h),
          criteria: h.criteria ?? '',
          lessonNumber: lesson?.lessonNumber ?? null,
          submitted: subs.filter((s) => s.status !== 'draft').length,
          working: subs.filter((s) => s.status === 'draft').length,
          checking: subs.filter((s) => s.status === 'checking').length,
          failed: subs.filter((s) => s.status === 'failed').length,
          flagged: subs.filter((s) => s.aiSuspicion === 'high').length,
        }
      }),
    )
  },
})

/** Teacher: every hand-in of one homework, with links to the files. */
export const submissions = query({
  args: { token: v.string(), homeworkId: v.id('homeworks') },
  handler: async (ctx, { token, homeworkId }) => {
    await requireHomeworkOwner(ctx, token, homeworkId)
    const subs = await ctx.db
      .query('homeworkSubmissions')
      .withIndex('by_homework', (q) => q.eq('homeworkId', homeworkId))
      .collect()
    return await Promise.all(
      subs.map(async (s) => ({
        ...submissionView(s),
        studentId: s.studentId,
        files: await Promise.all(
          s.files.map(async (f) => ({ name: f.name, contentType: f.contentType, url: await ctx.storage.getUrl(f.storageId) })),
        ),
      })),
    )
  },
})

/** Teacher: sets homework for a lesson (the group's latest one unless `lessonId` is given)
 * and tells every student of the group. */
export const create = mutation({
  args: {
    token: v.string(),
    groupId: v.id('groups'),
    lessonId: v.optional(v.id('lessons')),
    title: v.string(),
    task: v.string(),
    criteria: v.optional(v.string()),
    mode: v.optional(v.union(v.literal('code'), v.literal('files'))),
    language: v.optional(v.string()),
    exercises: v.optional(v.array(v.string())),
    maxCoins: v.number(),
    dueAt: v.number(),
  },
  handler: async (ctx, { token, groupId, lessonId, title, task, criteria, mode = 'files', language, exercises = [], maxCoins, dueAt }) => {
    const session = await requireGroupOwner(ctx, token, groupId)
    const cleanTitle = title.trim()
    const cleanTask = task.trim()
    const cleanCriteria = criteria?.trim() || undefined
    const cleanExercises = exercises.map((e) => e.trim()).filter(Boolean)
    if (!cleanTitle) throw new ConvexError('Vazifa nomini yozing')
    if (mode === 'code') {
      if (cleanExercises.length === 0) throw new ConvexError("Kamida bitta masala qo'shing")
      if (cleanExercises.length > HOMEWORK.MAX_EXERCISES) throw new ConvexError(`Ko'pi bilan ${HOMEWORK.MAX_EXERCISES} ta masala`)
      if (cleanExercises.some((e) => e.length > HOMEWORK.MAX_TASK)) throw new ConvexError('Masala matni juda uzun')
      if (!HOMEWORK.LANGUAGES.some((l) => l.id === language)) throw new ConvexError('Dasturlash tilini tanlang')
    } else if (!cleanTask) {
      throw new ConvexError('Vazifa matnini yozing')
    }
    if (cleanTitle.length > 120) throw new ConvexError('Nom juda uzun')
    if (cleanTask.length > HOMEWORK.MAX_TASK || (cleanCriteria?.length ?? 0) > HOMEWORK.MAX_TASK) {
      throw new ConvexError(`Matn ${HOMEWORK.MAX_TASK} belgidan oshmasin`)
    }
    if (!Number.isInteger(maxCoins) || maxCoins < 1 || maxCoins > HOMEWORK.MAX_COINS) {
      throw new ConvexError(`Coin 1 dan ${HOMEWORK.MAX_COINS} gacha bo'lsin`)
    }
    if (!(dueAt > Date.now())) throw new ConvexError("Topshirish muddati kelajakda bo'lsin")

    let lesson
    if (lessonId) {
      lesson = await ctx.db.get(lessonId)
      if (!lesson || lesson.groupId !== groupId) throw new ConvexError('Dars topilmadi')
    } else {
      const lessons = await ctx.db
        .query('lessons')
        .withIndex('by_group', (q) => q.eq('groupId', groupId))
        .collect()
      lesson = lessons.sort((a, b) => b.lessonNumber - a.lessonNumber)[0]
      if (!lesson) throw new ConvexError("Avval darsni o'tkazib saqlang — uy vazifasi shu darsga beriladi")
    }
    const taken = await ctx.db
      .query('homeworks')
      .withIndex('by_lesson', (q) => q.eq('lessonId', lesson._id))
      .first()
    if (taken) throw new ConvexError(`${lesson.lessonNumber}-darsga uy vazifasi allaqachon berilgan`)

    const homeworkId = await ctx.db.insert('homeworks', {
      groupId,
      lessonId: lesson._id,
      teacherId: session.userId,
      title: cleanTitle,
      task: cleanTask,
      criteria: cleanCriteria,
      mode,
      ...(mode === 'code' ? { language, exercises: cleanExercises.map((text) => ({ text })) } : {}),
      maxCoins,
      dueAt,
      createdAt: Date.now(),
    })

    const students = await ctx.db
      .query('students')
      .withIndex('by_group', (q) => q.eq('groupId', groupId))
      .collect()
    await notify(
      ctx,
      students.filter((s) => s.status === STUDENT_STATUS.ACTIVE).map((s) => s._id),
      {
        type: 'homework_new',
        title: `Yangi uy vazifasi: ${cleanTitle}`,
        body:
          mode === 'code'
            ? `${cleanExercises.length} ta masala, ${maxCoins} coingacha. Muharrirda yozing — AI tekshiradi.`
            : `${maxCoins} coingacha. AI tekshiradi — o'zingiz bajaring!`,
      },
    )
    return homeworkId
  },
})

/** Teacher: deletes a homework with every hand-in, its coins and its files. */
export const remove = mutation({
  args: { token: v.string(), homeworkId: v.id('homeworks') },
  handler: async (ctx, { token, homeworkId }) => {
    const homework = await requireHomeworkOwner(ctx, token, homeworkId)
    const subs = await ctx.db
      .query('homeworkSubmissions')
      .withIndex('by_homework', (q) => q.eq('homeworkId', homeworkId))
      .collect()
    for (const s of subs) await deleteSubmission(ctx, s, homework)
    await ctx.db.delete(homeworkId)
  },
})

/** Teacher: corrects the AI's verdict — sets the coins (and optionally the feedback). */
export const setCoins = mutation({
  args: { token: v.string(), submissionId: v.id('homeworkSubmissions'), coins: v.number(), feedback: v.optional(v.string()) },
  handler: async (ctx, { token, submissionId, coins, feedback }) => {
    const submission = await ctx.db.get(submissionId)
    if (!submission) throw new ConvexError('Topshiriq topilmadi')
    const homework = await requireHomeworkOwner(ctx, token, submission.homeworkId)
    if (submission.status === 'draft') throw new ConvexError("O'quvchi hali yakunlamagan")
    if (!Number.isInteger(coins) || coins < 0 || coins > homework.maxCoins) {
      throw new ConvexError(`Coin 0 dan ${homework.maxCoins} gacha bo'lsin`)
    }
    const { value, entryId, capped } = await writeCoins(ctx, submission, homework, coins)
    const note = feedback?.trim()
    await ctx.db.patch(submissionId, {
      coins: value,
      entryId,
      capped,
      teacherEdited: true,
      status: 'checked',
      error: undefined,
      checkedAt: submission.checkedAt ?? Date.now(),
      ...(note ? { feedback: note.slice(0, 2000) } : {}),
    })
    await notify(ctx, [submission.studentId], {
      type: 'homework_checked',
      title: `Ustoz bahoni o'zgartirdi: ${homework.title}`,
      body: `${value} coin${note ? ` — ${note.slice(0, 120)}` : ''}`,
    })
  },
})

/** Teacher: runs the AI check again (after a failure, or to get a fresh verdict). */
export const recheck = mutation({
  args: { token: v.string(), submissionId: v.id('homeworkSubmissions') },
  handler: async (ctx, { token, submissionId }) => {
    const submission = await ctx.db.get(submissionId)
    if (!submission) throw new ConvexError('Topshiriq topilmadi')
    await requireHomeworkOwner(ctx, token, submission.homeworkId)
    if (submission.status === 'checking') throw new ConvexError('Hozir tekshirilmoqda')
    if (submission.status === 'draft') throw new ConvexError("O'quvchi hali yakunlamagan")
    await ctx.db.patch(submissionId, { status: 'checking', attempts: 0, error: undefined, teacherEdited: false })
    await ctx.scheduler.runAfter(0, internal.homeworkActions.check, { submissionId })
  },
})

// ── Student ───────────────────────────────────────────────────────────────────────────

/** Student: their group's lessons (latest first), each with its homework — if any — and the
 * student's own work and verdict on it. */
export const mine = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const student = await requireStudent(ctx, token)
    const lessons = await ctx.db
      .query('lessons')
      .withIndex('by_group', (q) => q.eq('groupId', student.groupId))
      .collect()
    const homeworks = await ctx.db
      .query('homeworks')
      .withIndex('by_group', (q) => q.eq('groupId', student.groupId))
      .order('desc')
      .take(LIST_LIMIT)
    const byLesson = new Map(homeworks.map((h) => [h.lessonId, h]))
    const latest = lessons.sort((x, y) => y.lessonNumber - x.lessonNumber).slice(0, 40)
    return await Promise.all(
      latest.map(async (l) => {
        const h = byLesson.get(l._id)
        if (!h) return { id: l._id, number: l.lessonNumber, date: l.date, homework: null }
        const sub = await ctx.db
          .query('homeworkSubmissions')
          .withIndex('by_homework_student', (q) => q.eq('homeworkId', h._id).eq('studentId', student._id))
          .unique()
        return { id: l._id, number: l.lessonNumber, date: l.date, homework: { ...publicHomework(h), submission: sub ? submissionView(sub) : null } }
      }),
    )
  },
})

/** Student: how many homeworks are still open and not handed in (the menu badge). Reads only
 * the few open homeworks of one group. */
export const myOpenCount = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const student = await requireStudent(ctx, token)
    const open = await ctx.db
      .query('homeworks')
      .withIndex('by_group', (q) => q.eq('groupId', student.groupId))
      .order('desc')
      .take(10)
    let count = 0
    for (const h of open) {
      if (h.dueAt <= Date.now()) continue
      const sub = await ctx.db
        .query('homeworkSubmissions')
        .withIndex('by_homework_student', (q) => q.eq('homeworkId', h._id).eq('studentId', student._id))
        .unique()
      if (!sub || sub.status === 'failed' || sub.status === 'draft') count += 1
    }
    return count
  },
})

/** Student: a short-lived URL to upload one homework file to. */
export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireStudent(ctx, token)
    return await ctx.storage.generateUploadUrl()
  },
})

/** Student: hands in a homework (text and/or up to `MAX_FILES` photos or PDFs) and starts the
 * AI check. One hand-in per homework — a new one is accepted only after a failed check.
 * Problems with the files come back as `{ ok: false, error }` (not thrown) so the uploaded
 * files can be deleted in the same step. */
export const submit = mutation({
  args: {
    token: v.string(),
    homeworkId: v.id('homeworks'),
    text: v.optional(v.string()),
    files: v.array(v.object({ storageId: v.id('_storage'), name: v.string() })),
  },
  handler: async (ctx, { token, homeworkId, text, files }) => {
    const student = await requireStudent(ctx, token)
    const fail = async (error) => {
      for (const f of files) await ctx.storage.delete(f.storageId).catch(() => {})
      return { ok: false, error }
    }

    const homework = await ctx.db.get(homeworkId)
    if (!homework || homework.groupId !== student.groupId) return await fail('Uy vazifasi topilmadi')
    if (homework.mode === 'code') return await fail('Bu vazifa kod muharririda bajariladi')
    if (Date.now() > homework.dueAt) return await fail('Topshirish muddati tugagan')
    const existing = await ctx.db
      .query('homeworkSubmissions')
      .withIndex('by_homework_student', (q) => q.eq('homeworkId', homeworkId).eq('studentId', student._id))
      .unique()
    if (existing && existing.status !== 'failed') return await fail('Bu vazifani allaqachon topshirgansiz')

    const cleanText = text?.trim() || undefined
    if (!cleanText && files.length === 0) return await fail('Javob yozing yoki rasm yuklang')
    if ((cleanText?.length ?? 0) > HOMEWORK.MAX_TEXT) return await fail(`Matn ${HOMEWORK.MAX_TEXT} belgidan oshmasin`)
    if (files.length > HOMEWORK.MAX_FILES) return await fail(`Ko'pi bilan ${HOMEWORK.MAX_FILES} ta fayl`)

    const stored = []
    let total = 0
    for (const f of files) {
      const meta = await ctx.db.system.get(f.storageId)
      if (!meta) return await fail('Fayl topilmadi, qaytadan yuklang')
      if (!ALLOWED_TYPES.includes(meta.contentType)) return await fail('Faqat rasm (JPG, PNG, WEBP) yoki PDF yuklang')
      if (meta.size > HOMEWORK.MAX_FILE_BYTES) return await fail("Har bir fayl 10 MB dan kichik bo'lsin")
      total += meta.size
      stored.push({ storageId: f.storageId, name: f.name.slice(0, 120), contentType: meta.contentType, sha256: meta.sha256 })
    }
    if (total > HOMEWORK.MAX_TOTAL_BYTES) return await fail("Fayllar jami 15 MB dan kichik bo'lsin")

    // the same file handed in by a classmate, or reused from an earlier homework
    const hashes = new Set(stored.map((f) => f.sha256))
    if (hashes.size) {
      const classmates = await ctx.db
        .query('homeworkSubmissions')
        .withIndex('by_homework', (q) => q.eq('homeworkId', homeworkId))
        .collect()
      if (classmates.some((s) => s.studentId !== student._id && s.files.some((f) => hashes.has(f.sha256)))) {
        return await fail("Bu fayl boshqa o'quvchining topshirig'ida bor. O'zingiz bajargan ishni yuklang")
      }
      const mine = await ctx.db
        .query('homeworkSubmissions')
        .withIndex('by_student', (q) => q.eq('studentId', student._id))
        .collect()
      if (mine.some((s) => s.homeworkId !== homeworkId && s.files.some((f) => hashes.has(f.sha256)))) {
        return await fail('Bu fayl avvalgi uy vazifangizda ishlatilgan. Yangi ishni yuklang')
      }
    }

    const fields = {
      text: cleanText,
      files: stored,
      status: 'checking',
      attempts: 0,
      score: undefined,
      aiSuspicion: undefined,
      aiReason: undefined,
      feedback: undefined,
      coins: undefined,
      penalized: undefined,
      capped: undefined,
      error: undefined,
      teacherEdited: undefined,
      submittedAt: Date.now(),
      checkedAt: undefined,
    }
    let submissionId
    if (existing) {
      // a failed check is replaced: its old files go, its coins (if any) were never given
      for (const f of existing.files) if (!stored.some((s) => s.storageId === f.storageId)) await ctx.storage.delete(f.storageId).catch(() => {})
      await ctx.db.patch(existing._id, fields)
      submissionId = existing._id
    } else {
      submissionId = await ctx.db.insert('homeworkSubmissions', { homeworkId, studentId: student._id, groupId: student.groupId, ...fields })
    }
    await ctx.scheduler.runAfter(0, internal.homeworkActions.check, { submissionId })
    return { ok: true }
  },
})

/** The student's own code homework, checked: theirs, still open, and not handed in yet. */
async function openCodeHomework(ctx, student, homeworkId) {
  const homework = await ctx.db.get(homeworkId)
  if (!homework || homework.groupId !== student.groupId || homework.mode !== 'code') throw new ConvexError('Uy vazifasi topilmadi')
  if (Date.now() > homework.dueAt) throw new ConvexError('Topshirish muddati tugagan')
  const submission = await ctx.db
    .query('homeworkSubmissions')
    .withIndex('by_homework_student', (q) => q.eq('homeworkId', homeworkId).eq('studentId', student._id))
    .unique()
  if (submission && (submission.status === 'checking' || submission.status === 'checked')) {
    throw new ConvexError('Bu vazifa allaqachon yuborilgan')
  }
  return { homework, submission }
}

/** Student: saves one exercise's code ("Done", or "Tahrirlash" to reopen it). The work stays a
 * draft until `finish`. */
export const saveAnswer = mutation({
  args: {
    token: v.string(),
    homeworkId: v.id('homeworks'),
    index: v.number(),
    code: v.string(),
    done: v.boolean(),
    typed: v.number(),
    pasted: v.number(),
    activeMs: v.number(),
  },
  handler: async (ctx, { token, homeworkId, index, code, done, typed, pasted, activeMs }) => {
    const student = await requireStudent(ctx, token)
    const { homework, submission } = await openCodeHomework(ctx, student, homeworkId)
    const count = homework.exercises?.length ?? 0
    if (!Number.isInteger(index) || index < 0 || index >= count) throw new ConvexError('Masala topilmadi')
    if (code.length > HOMEWORK.MAX_CODE) throw new ConvexError(`Kod ${HOMEWORK.MAX_CODE} belgidan oshmasin`)
    if (done && !code.trim()) throw new ConvexError('Avval kodni yozing')

    const blank = { code: '', done: false, typed: 0, pasted: 0, activeMs: 0 }
    const answers = Array.from({ length: count }, (_, i) => submission?.answers?.[i] ?? blank)
    const clamp = (n) => Math.max(0, Math.min(10_000_000, Math.round(n) || 0))
    answers[index] = { code, done, typed: clamp(typed), pasted: clamp(pasted), activeMs: clamp(activeMs) }

    if (submission) {
      await ctx.db.patch(submission._id, { answers, status: 'draft', error: undefined })
    } else {
      await ctx.db.insert('homeworkSubmissions', {
        homeworkId,
        studentId: student._id,
        groupId: student.groupId,
        files: [],
        answers,
        status: 'draft',
        attempts: 0,
        submittedAt: Date.now(),
      })
    }
  },
})

/** Student: hands in the code homework once every exercise is done, and starts the AI check. */
export const finish = mutation({
  args: { token: v.string(), homeworkId: v.id('homeworks') },
  handler: async (ctx, { token, homeworkId }) => {
    const student = await requireStudent(ctx, token)
    const { homework, submission } = await openCodeHomework(ctx, student, homeworkId)
    const count = homework.exercises?.length ?? 0
    const answers = submission?.answers ?? []
    if (!submission || answers.length < count || answers.some((a) => !a.done || !a.code.trim())) {
      throw new ConvexError("Avval hamma masalani bajarib, «Done» ni bosing")
    }
    await ctx.db.patch(submission._id, {
      status: 'checking',
      attempts: 0,
      error: undefined,
      exerciseResults: undefined,
      submittedAt: Date.now(),
    })
    await ctx.scheduler.runAfter(0, internal.homeworkActions.check, { submissionId: submission._id })
  },
})

// ── The AI check (called from homeworkActions) ────────────────────────────────────────

/** Everything the checker needs, or null if the hand-in is gone or no longer waiting. */
export const checkInput = internalQuery({
  args: { submissionId: v.id('homeworkSubmissions') },
  handler: async (ctx, { submissionId }) => {
    const submission = await ctx.db.get(submissionId)
    if (!submission || submission.status !== 'checking') return null
    const homework = await ctx.db.get(submission.homeworkId)
    if (!homework) return null
    const group = await ctx.db.get(homework.groupId)
    return {
      task: homework.task,
      title: homework.title,
      criteria: homework.criteria ?? '',
      direction: group?.direction ?? 'other',
      text: submission.text ?? '',
      files: submission.files.map((f) => ({ storageId: f.storageId, contentType: f.contentType })),
      mode: homework.mode ?? 'files',
      language: homework.language ?? 'text',
      exercises: (homework.exercises ?? []).map((e) => e.text),
      answers: (submission.answers ?? []).map((a) => ({ code: a.code, typed: a.typed, pasted: a.pasted, activeMs: a.activeMs })),
    }
  },
})

/** Stores the AI's verdict, gives the coins and tells the student. Work that clearly looks
 * written by AI keeps only part of its coins and gets a warning. */
export const saveResult = internalMutation({
  args: {
    submissionId: v.id('homeworkSubmissions'),
    result: v.object({
      relevant: v.boolean(),
      score: v.number(),
      feedback: v.string(),
      aiSuspicion: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
      aiReason: v.string(),
      exercises: v.optional(v.array(v.object({ score: v.number(), feedback: v.string() }))),
    }),
  },
  handler: async (ctx, { submissionId, result }) => {
    const submission = await ctx.db.get(submissionId)
    if (!submission || submission.status !== 'checking') return
    const homework = await ctx.db.get(submission.homeworkId)
    if (!homework) return

    const exerciseResults = result.exercises?.map((e) => ({
      score: Math.max(0, Math.min(10, Math.round(e.score))),
      feedback: e.feedback.slice(0, 1500),
    }))
    // code homework: the average of the exercises
    const raw = exerciseResults?.length ? exerciseResults.reduce((sum, e) => sum + e.score, 0) / exerciseResults.length : result.score
    const score = result.relevant ? Math.max(0, Math.min(10, Math.round(raw))) : 0
    const full = coinsFor(score, homework.maxCoins)
    const penalized = result.aiSuspicion === 'high' && full > 0
    const coins = penalized ? Math.floor(full * HOMEWORK.AI_PENALTY_KEEP) : full
    const { value, entryId, capped } = await writeCoins(ctx, submission, homework, coins)

    await ctx.db.patch(submissionId, {
      status: 'checked',
      score,
      feedback: result.feedback.slice(0, 2000),
      aiSuspicion: result.aiSuspicion,
      aiReason: result.aiReason.slice(0, 500) || undefined,
      exerciseResults,
      coins: value,
      penalized,
      capped,
      entryId,
      error: undefined,
      checkedAt: Date.now(),
    })

    await notify(ctx, [submission.studentId], {
      type: 'homework_checked',
      title: `${homework.title}: ${score}/10 — +${value} coin`,
      body: result.feedback.slice(0, 160),
    })
    if (penalized) {
      await notify(ctx, [submission.studentId], {
        type: 'homework_warning',
        title: "⚠️ Ish AI yordamida bajarilganga o'xshaydi",
        body: `Shuning uchun coin kamaytirildi (${full} o'rniga ${value}). Vazifani o'zingiz bajaring — ustozingiz ham ko'radi.`,
      })
    }
  },
})

/** A check that didn't go through: tried again a little later (busy / network), or marked
 * failed so the student can hand in again and the teacher can re-run it. */
export const checkFailed = internalMutation({
  args: { submissionId: v.id('homeworkSubmissions'), error: v.string(), retry: v.boolean() },
  handler: async (ctx, { submissionId, error, retry }) => {
    const submission = await ctx.db.get(submissionId)
    if (!submission || submission.status !== 'checking') return
    const attempts = submission.attempts + 1
    if (retry && attempts < HOMEWORK.MAX_CHECK_ATTEMPTS) {
      await ctx.db.patch(submissionId, { attempts })
      await ctx.scheduler.runAfter(30000 * 2 ** (attempts - 1), internal.homeworkActions.check, { submissionId })
      return
    }
    await ctx.db.patch(submissionId, { status: 'failed', attempts, error: error.slice(0, 300) })
  },
})

/** Deletes the homework of the given lessons with every hand-in and file (their coin entries
 * are removed by the caller together with the lessons). */
export async function removeHomeworkOfLessons(ctx, lessonIds) {
  for (const lessonId of lessonIds) {
    const list = await ctx.db
      .query('homeworks')
      .withIndex('by_lesson', (q) => q.eq('lessonId', lessonId))
      .collect()
    for (const h of list) {
      const subs = await ctx.db
        .query('homeworkSubmissions')
        .withIndex('by_homework', (q) => q.eq('homeworkId', h._id))
        .collect()
      for (const s of subs) {
        for (const f of s.files) await ctx.storage.delete(f.storageId).catch(() => {})
        await ctx.db.delete(s._id)
      }
      await ctx.db.delete(h._id)
    }
  }
}

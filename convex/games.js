import { query, mutation, internalMutation } from './_generated/server'
import { internal } from './_generated/api'
import { v, ConvexError } from 'convex/values'
import { getScope, getScopedGroupIdSet, requireGroupOwner, requireTestOwner } from './lib/scoping'
import { GAME_RULES } from '../src/shared/config/constants'

/** Extra time accepted after the countdown ends, for network latency. */
const ANSWER_GRACE_MS = 2000

/** Points for one answer: faster → more (MAX..MIN), plus a bonus for the streak of correct
 * answers the player already had going into this question. */
function scoreAnswer({ correct, elapsedMs, durationSec, streakBefore }) {
  if (!correct) return 0
  const ratio = Math.min(1, Math.max(0, elapsedMs / (durationSec * 1000)))
  const base = Math.round(GAME_RULES.MAX_POINTS - (GAME_RULES.MAX_POINTS - GAME_RULES.MIN_POINTS) * ratio)
  return base + Math.min(streakBefore * GAME_RULES.STREAK_BONUS, GAME_RULES.MAX_STREAK_BONUS)
}

async function getGameOrThrow(ctx, gameId) {
  const game = await ctx.db.get(gameId)
  if (!game) throw new ConvexError("O'yin topilmadi")
  return game
}

async function requireHost(ctx, token, gameId) {
  const game = await getGameOrThrow(ctx, gameId)
  await requireGroupOwner(ctx, token, game.groupId)
  return game
}

/** The calling student, who must belong to the game's group. */
async function requireGameStudent(ctx, token, game) {
  const scope = await getScope(ctx, token)
  if (scope.platformAdmin || scope.session.role !== 'student') throw new ConvexError("Faqat o'quvchi o'ynay oladi")
  const student = await ctx.db.get(scope.session.userId)
  if (!student || student.groupId !== game.groupId) throw new ConvexError("Bu o'yin sizning guruhingiz uchun emas")
  return student
}

/** Whoever is looking at the game: its host side (a teacher who owns the group) or a
 * student of that group. */
async function resolveViewer(ctx, token, game) {
  const scope = await getScope(ctx, token)
  if (scope.platformAdmin) throw new ConvexError("Bu o'yinga ruxsatingiz yo'q")
  if (scope.session.role === 'teacher') {
    await requireGroupOwner(ctx, token, game.groupId)
    return { role: 'host' }
  }
  const student = await ctx.db.get(scope.session.userId)
  if (!student || student.groupId !== game.groupId) throw new ConvexError("Bu o'yinga ruxsatingiz yo'q")
  return { role: 'player', studentId: student._id }
}

async function getPlayers(ctx, gameId) {
  return await ctx.db
    .query('gamePlayers')
    .withIndex('by_game', (q) => q.eq('gameId', gameId))
    .collect()
}

async function getAnswersFor(ctx, gameId, questionIndex) {
  return await ctx.db
    .query('gameAnswers')
    .withIndex('by_game_question', (q) => q.eq('gameId', gameId).eq('questionIndex', questionIndex))
    .collect()
}

async function openQuestion(ctx, game, index) {
  const startedAt = Date.now()
  await ctx.db.patch(game._id, { status: 'question', currentIndex: index, questionStartedAt: startedAt })
  await ctx.scheduler.runAfter(game.durationSec * 1000 + ANSWER_GRACE_MS, internal.games.autoReveal, {
    gameId: game._id,
    questionIndex: index,
  })
}

/** Teacher: create a game for one of their groups from one of their topics. Any other
 * unfinished game of that group is ended first — a group plays one game at a time. */
export const create = mutation({
  args: {
    token: v.string(),
    groupId: v.id('groups'),
    testId: v.id('tests'),
    mode: v.union(v.literal('solo'), v.literal('team')),
    teamCount: v.number(),
    durationSec: v.number(),
  },
  handler: async (ctx, { token, groupId, testId, mode, teamCount, durationSec }) => {
    const session = await requireGroupOwner(ctx, token, groupId)
    const { test } = await requireTestOwner(ctx, token, testId)
    if (!GAME_RULES.DURATIONS.includes(durationSec)) throw new ConvexError("Savol vaqti noto'g'ri")
    if (mode === 'team' && !GAME_RULES.TEAM_COUNTS.includes(teamCount)) throw new ConvexError("Jamoalar soni noto'g'ri")

    const questions = (
      await ctx.db
        .query('testQuestions')
        .withIndex('by_test', (q) => q.eq('testId', testId))
        .collect()
    ).sort((a, b) => a.order - b.order)
    if (questions.length === 0) throw new ConvexError("Bu mavzuda hali savol yo'q")

    const running = await ctx.db
      .query('games')
      .withIndex('by_group', (q) => q.eq('groupId', groupId))
      .collect()
    for (const g of running) {
      if (g.status !== 'finished') await ctx.db.patch(g._id, { status: 'finished', endedAt: Date.now() })
    }

    return await ctx.db.insert('games', {
      groupId,
      testId,
      hostId: session.userId,
      title: test.title,
      mode,
      teamCount: mode === 'team' ? teamCount : 1,
      questionIds: questions.map((q) => q._id),
      durationSec,
      status: 'lobby',
      currentIndex: 0,
      questionStartedAt: 0,
      createdAt: Date.now(),
    })
  },
})

export const start = mutation({
  args: { token: v.string(), gameId: v.id('games') },
  handler: async (ctx, { token, gameId }) => {
    const game = await requireHost(ctx, token, gameId)
    if (game.status !== 'lobby') throw new ConvexError("O'yin allaqachon boshlangan")
    const players = await getPlayers(ctx, gameId)
    if (players.length === 0) throw new ConvexError("Hali hech kim qo'shilmagan")
    await openQuestion(ctx, game, 0)
  },
})

/** Teacher: show the correct answer now, without waiting for the timer. */
export const reveal = mutation({
  args: { token: v.string(), gameId: v.id('games') },
  handler: async (ctx, { token, gameId }) => {
    const game = await requireHost(ctx, token, gameId)
    if (game.status === 'question') await ctx.db.patch(gameId, { status: 'reveal' })
  },
})

export const next = mutation({
  args: { token: v.string(), gameId: v.id('games') },
  handler: async (ctx, { token, gameId }) => {
    const game = await requireHost(ctx, token, gameId)
    if (game.status !== 'reveal') throw new ConvexError("Avval javobni ko'rsating")
    const nextIndex = game.currentIndex + 1
    if (nextIndex >= game.questionIds.length) {
      await ctx.db.patch(gameId, { status: 'finished', endedAt: Date.now() })
    } else {
      await openQuestion(ctx, game, nextIndex)
    }
  },
})

export const finish = mutation({
  args: { token: v.string(), gameId: v.id('games') },
  handler: async (ctx, { token, gameId }) => {
    const game = await requireHost(ctx, token, gameId)
    if (game.status !== 'finished') await ctx.db.patch(gameId, { status: 'finished', endedAt: Date.now() })
  },
})

/** Scheduled when a question opens: reveals it once time is up, unless the host (or
 * everyone answering) already moved the game on. */
export const autoReveal = internalMutation({
  args: { gameId: v.id('games'), questionIndex: v.number() },
  handler: async (ctx, { gameId, questionIndex }) => {
    const game = await ctx.db.get(gameId)
    if (game && game.status === 'question' && game.currentIndex === questionIndex) {
      await ctx.db.patch(gameId, { status: 'reveal' })
    }
  },
})

/** Student: join (or re-join) a game of their own group. In team mode the student goes to
 * the team with the fewest members so teams stay balanced. */
export const join = mutation({
  args: { token: v.string(), gameId: v.id('games') },
  handler: async (ctx, { token, gameId }) => {
    const game = await getGameOrThrow(ctx, gameId)
    const student = await requireGameStudent(ctx, token, game)
    if (game.status === 'finished') throw new ConvexError("O'yin tugagan")

    const existing = await ctx.db
      .query('gamePlayers')
      .withIndex('by_game_student', (q) => q.eq('gameId', gameId).eq('studentId', student._id))
      .unique()
    if (existing) return existing._id

    const players = await getPlayers(ctx, gameId)
    const sizes = Array.from({ length: game.teamCount }, (_, team) => players.filter((p) => p.team === team).length)
    const team = sizes.indexOf(Math.min(...sizes))

    return await ctx.db.insert('gamePlayers', {
      gameId,
      studentId: student._id,
      team,
      score: 0,
      streak: 0,
      correctCount: 0,
      joinedAt: Date.now(),
    })
  },
})

/** Student: answer the open question. Scored server-side from the real answer key and the
 * server's clock; one answer per question. When everyone has answered, the question is
 * revealed right away. */
export const answer = mutation({
  args: { token: v.string(), gameId: v.id('games'), questionIndex: v.number(), selectedIndex: v.number() },
  handler: async (ctx, { token, gameId, questionIndex, selectedIndex }) => {
    const game = await getGameOrThrow(ctx, gameId)
    const student = await requireGameStudent(ctx, token, game)
    if (game.status !== 'question' || game.currentIndex !== questionIndex) throw new ConvexError('Bu savol yopilgan')

    const elapsedMs = Date.now() - game.questionStartedAt
    if (elapsedMs > game.durationSec * 1000 + ANSWER_GRACE_MS) throw new ConvexError('Vaqt tugadi')

    const player = await ctx.db
      .query('gamePlayers')
      .withIndex('by_game_student', (q) => q.eq('gameId', gameId).eq('studentId', student._id))
      .unique()
    if (!player) throw new ConvexError("Avval o'yinga qo'shiling")

    const answers = await getAnswersFor(ctx, gameId, questionIndex)
    if (answers.some((a) => a.playerId === player._id)) throw new ConvexError('Siz allaqachon javob bergansiz')

    const question = await ctx.db.get(game.questionIds[questionIndex])
    if (!question) throw new ConvexError('Savol topilmadi')
    const correct = selectedIndex === question.correctIndex
    const points = scoreAnswer({ correct, elapsedMs, durationSec: game.durationSec, streakBefore: player.streak })

    await ctx.db.insert('gameAnswers', {
      gameId,
      playerId: player._id,
      questionIndex,
      selectedIndex,
      correct,
      points,
      elapsedMs,
    })
    await ctx.db.patch(player._id, {
      score: player.score + points,
      streak: correct ? player.streak + 1 : 0,
      correctCount: player.correctCount + (correct ? 1 : 0),
    })

    const players = await getPlayers(ctx, gameId)
    if (answers.length + 1 >= players.length) await ctx.db.patch(gameId, { status: 'reveal' })
  },
})

/** Everything a host or player screen needs, in one reactive query. The answer key of the
 * open question is only included once it's revealed. */
export const getState = query({
  args: { token: v.string(), gameId: v.id('games') },
  handler: async (ctx, { token, gameId }) => {
    const game = await getGameOrThrow(ctx, gameId)
    const viewer = await resolveViewer(ctx, token, game)
    const group = await ctx.db.get(game.groupId)

    const players = await getPlayers(ctx, gameId)
    const students = await Promise.all(players.map((p) => ctx.db.get(p.studentId)))
    const showsQuestion = game.status === 'question' || game.status === 'reveal'
    const revealed = game.status === 'reveal' || game.status === 'finished'
    const answers = showsQuestion ? await getAnswersFor(ctx, gameId, game.currentIndex) : []
    const answerByPlayer = new Map(answers.map((a) => [a.playerId, a]))

    const leaderboard = players
      .map((p, i) => ({
        playerId: p._id,
        studentId: p.studentId,
        fullName: students[i]?.fullName ?? "O'quvchi",
        team: p.team,
        score: p.score,
        streak: p.streak,
        correctCount: p.correctCount,
        answered: answerByPlayer.has(p._id),
        lastPoints: game.status === 'reveal' ? (answerByPlayer.get(p._id)?.points ?? 0) : null,
      }))
      .sort((a, b) => b.score - a.score || a.fullName.localeCompare(b.fullName))
      .map((p, i) => ({ ...p, rank: i + 1 }))

    const teams =
      game.mode === 'team'
        ? Array.from({ length: game.teamCount }, (_, team) => {
            const members = leaderboard.filter((p) => p.team === team)
            const total = members.reduce((sum, p) => sum + p.score, 0)
            // Average, not sum, so a team that got one extra member isn't ahead by default.
            return { team, members: members.length, score: members.length ? Math.round(total / members.length) : 0 }
          }).sort((a, b) => b.score - a.score)
        : []

    let question = null
    if (showsQuestion) {
      const q = await ctx.db.get(game.questionIds[game.currentIndex])
      if (q) {
        question = {
          text: q.text,
          isCode: !!q.isCode,
          imageUrl: q.imageStorageId ? await ctx.storage.getUrl(q.imageStorageId) : null,
          options: q.options,
          correctIndex: revealed ? q.correctIndex : null,
          distribution: revealed ? q.options.map((_, i) => answers.filter((a) => a.selectedIndex === i).length) : null,
        }
      }
    }

    let me = null
    if (viewer.role === 'player') {
      const mine = leaderboard.find((p) => p.studentId === viewer.studentId)
      if (mine) {
        const myAnswer = answerByPlayer.get(mine.playerId)
        me = {
          ...mine,
          answer: myAnswer
            ? {
                selectedIndex: myAnswer.selectedIndex,
                correct: revealed ? myAnswer.correct : null,
                points: revealed ? myAnswer.points : null,
              }
            : null,
        }
      }
    }

    return {
      id: game._id,
      title: game.title,
      groupName: group?.name ?? '',
      mode: game.mode,
      teamCount: game.teamCount,
      status: game.status,
      currentIndex: game.currentIndex,
      totalQuestions: game.questionIds.length,
      durationSec: game.durationSec,
      questionStartedAt: game.questionStartedAt,
      viewerRole: viewer.role,
      question,
      answeredCount: answers.length,
      leaderboard,
      teams,
      me,
    }
  },
})

/** Student: the unfinished game of their own group, if any — drives the "join" banner. */
export const activeForMe = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const scope = await getScope(ctx, token)
    if (scope.platformAdmin || scope.session.role !== 'student') return null
    const student = await ctx.db.get(scope.session.userId)
    if (!student) return null
    const games = await ctx.db
      .query('games')
      .withIndex('by_group', (q) => q.eq('groupId', student.groupId))
      .collect()
    const active = games.filter((g) => g.status !== 'finished').sort((a, b) => b.createdAt - a.createdAt)[0]
    return active ? { id: active._id, title: active.title, status: active.status, mode: active.mode } : null
  },
})

/** Teacher: recent games across the groups they can see, newest first. */
export const listForTeacher = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const groupIdSet = await getScopedGroupIdSet(ctx, token)
    const result = []
    for (const groupId of groupIdSet) {
      const group = await ctx.db.get(groupId)
      const games = await ctx.db
        .query('games')
        .withIndex('by_group', (q) => q.eq('groupId', groupId))
        .collect()
      for (const g of games) {
        const players = await getPlayers(ctx, g._id)
        const winner = players.sort((a, b) => b.score - a.score)[0]
        const winnerStudent = winner ? await ctx.db.get(winner.studentId) : null
        result.push({
          id: g._id,
          title: g.title,
          groupId,
          groupName: group?.name ?? '',
          mode: g.mode,
          status: g.status,
          totalQuestions: g.questionIds.length,
          playerCount: players.length,
          winnerName: winnerStudent?.fullName ?? null,
          createdAt: g.createdAt,
        })
      }
    }
    return result.sort((a, b) => b.createdAt - a.createdAt).slice(0, 30)
  },
})

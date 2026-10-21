import { useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'

/** Live state of one game — reactive, so every screen moves the moment the host does. */
export function useGameState(gameId) {
  const token = useAuthStore((s) => s.token)
  return useQuery(api.games.getState, token && gameId ? { token, gameId } : 'skip')
}

/** Student: the running game of their own group, if any. */
export function useActiveGameForMe() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)
  return useQuery(api.games.activeForMe, token && role === 'student' ? { token } : 'skip') ?? null
}

export function useTeacherGames() {
  const token = useAuthStore((s) => s.token)
  return useQuery(api.games.listForTeacher, token ? { token } : 'skip') ?? []
}

export function useGameActions() {
  const token = useAuthStore((s) => s.token)
  const create = useMutation(api.games.create)
  const start = useMutation(api.games.start)
  const reveal = useMutation(api.games.reveal)
  const next = useMutation(api.games.next)
  const finish = useMutation(api.games.finish)
  const join = useMutation(api.games.join)
  const answer = useMutation(api.games.answer)

  return {
    create: (args) => create({ token, ...args }),
    start: (gameId) => start({ token, gameId }),
    reveal: (gameId) => reveal({ token, gameId }),
    next: (gameId) => next({ token, gameId }),
    finish: (gameId) => finish({ token, gameId }),
    join: (gameId, hero) => join({ token, gameId, hero }),
    answer: (gameId, questionIndex, selectedIndex) => answer({ token, gameId, questionIndex, selectedIndex }),
  }
}

/** Milliseconds to add to `Date.now()` to get the server's clock — measured once per page
 * with a round trip, so every screen's countdown lines up even if a laptop clock is off. */
export function useServerClockOffset() {
  const serverTime = useMutation(api.games.serverTime)
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    let cancelled = false
    const sentAt = Date.now()
    serverTime({})
      .then((serverNow) => {
        const receivedAt = Date.now()
        if (!cancelled) setOffset(serverNow - (sentAt + receivedAt) / 2)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [serverTime])
  return offset
}

/** Where the open question is in time: `leadin` (the 3-2-1 before it), `running` (answers
 * accepted) or `over`. Ticks locally against the server-corrected clock. */
export function useQuestionClock(startedAt, durationSec, active, offset = 0) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return undefined
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [active, startedAt])

  if (!active) return { phase: 'over', secondsLeft: 0, fraction: 0, leadInLeft: 0 }
  const serverNow = now + offset
  if (serverNow < startedAt) {
    return { phase: 'leadin', secondsLeft: durationSec, fraction: 1, leadInLeft: Math.ceil((startedAt - serverNow) / 1000) }
  }
  const leftMs = Math.max(0, startedAt + durationSec * 1000 - serverNow)
  return {
    phase: leftMs > 0 ? 'running' : 'over',
    secondsLeft: Math.ceil(leftMs / 1000),
    fraction: leftMs / (durationSec * 1000),
    leadInLeft: 0,
  }
}

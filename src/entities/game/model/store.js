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
    join: (gameId) => join({ token, gameId }),
    answer: (gameId, questionIndex, selectedIndex) => answer({ token, gameId, questionIndex, selectedIndex }),
  }
}

/** Seconds left on the open question, ticking locally from the server's start time. */
export function useCountdown(startedAt, durationSec, active) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return undefined
    const id = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [active, startedAt])
  if (!active) return { secondsLeft: 0, fraction: 0 }
  const leftMs = Math.max(0, startedAt + durationSec * 1000 - now)
  return { secondsLeft: Math.ceil(leftMs / 1000), fraction: leftMs / (durationSec * 1000) }
}

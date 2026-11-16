import { useEffect, useState } from 'react'

/** The current time, refreshed every 30 s (deadlines and "… qoldi" labels). */
export function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function timeLeft(dueAt, now) {
  const ms = dueAt - now
  if (ms <= 0) return null
  const h = Math.floor(ms / 3600000)
  if (h >= 24) return `${Math.floor(h / 24)} kun qoldi`
  if (h >= 1) return `${h} soat qoldi`
  return `${Math.max(1, Math.floor(ms / 60000))} daqiqa qoldi`
}

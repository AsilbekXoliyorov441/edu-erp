import { useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'

/** Live town state — the shared map plus the caller's own player, as one object.
 * Two queries so that one player's money moving doesn't re-send the whole map to everyone. */
export function useTown() {
  const token = useAuthStore((s) => s.token)
  const map = useQuery(api.town.getTownMap, token ? { token } : 'skip')
  const mine = useQuery(api.town.getTownMe, token ? { token } : 'skip')
  return useMemo(() => (map && mine ? { ...map, viewer: mine.viewer, me: mine.me } : undefined), [map, mine])
}

export function useTownActions() {
  const token = useAuthStore((s) => s.token)
  const join = useMutation(api.town.join)
  const buyPlot = useMutation(api.town.buyPlot)
  const quizStart = useMutation(api.town.quizStart)
  const quizAnswer = useMutation(api.town.quizAnswer)
  const quizCancel = useMutation(api.town.quizCancel)
  const setPlan = useMutation(api.town.setPlan)
  const upgradeKind = useMutation(api.town.upgradeKind)
  const bankDeposit = useMutation(api.town.bankDeposit)
  const bankWithdraw = useMutation(api.town.bankWithdraw)
  const qardTake = useMutation(api.town.qardTake)
  const qardRepay = useMutation(api.town.qardRepay)
  const giveCharity = useMutation(api.town.giveCharity)
  const askHelp = useMutation(api.town.askHelp)
  const buyItem = useMutation(api.town.buyItem)
  const listPlot = useMutation(api.town.listPlot)
  const buyListedPlot = useMutation(api.town.buyListedPlot)
  const listCar = useMutation(api.town.listCar)
  const buyListedCar = useMutation(api.town.buyListedCar)
  const setStyle = useMutation(api.town.setStyle)
  const buyCar = useMutation(api.town.buyCar)
  const claimBonus = useMutation(api.town.claimBonus)
  const collectCarIncome = useMutation(api.town.collectCarIncome)
  const cancelDeal = useMutation(api.town.cancelDeal)
  const insurePlot = useMutation(api.town.insurePlot)
  return {
    join: (nickname, color) => join({ token, nickname, color }),
    buyPlot: (plotId) => buyPlot({ token, plotId }),
    quizStart: (kind, plotId, topicKey) =>
      quizStart({ token, kind, ...(plotId ? { plotId } : {}), ...(topicKey ? { topicKey } : {}) }),
    quizAnswer: (quizId, index, selectedIndex) => quizAnswer({ token, quizId, index, selectedIndex }),
    quizCancel: () => quizCancel({ token }),
    setPlan: (plotId, kind, design) => setPlan({ token, plotId, kind, design }),
    upgradeKind: (plotId) => upgradeKind({ token, plotId }),
    bankDeposit: (amount) => bankDeposit({ token, amount }),
    bankWithdraw: (amount) => bankWithdraw({ token, amount }),
    qardTake: (amount) => qardTake({ token, amount }),
    qardRepay: (amount) => qardRepay({ token, amount }),
    giveCharity: (kind, amount) => giveCharity({ token, kind, ...(amount ? { amount } : {}) }),
    askHelp: () => askHelp({ token }),
    buyItem: (item) => buyItem({ token, item }),
    listPlot: (plotId, price) => listPlot({ token, plotId, price }),
    buyListedPlot: (plotId, price) => buyListedPlot({ token, plotId, price }),
    listCar: (price) => listCar({ token, price }),
    buyListedCar: (sellerId, price) => buyListedCar({ token, sellerId, price }),
    setStyle: (plotId, style) => setStyle({ token, plotId, style }),
    buyCar: (model, color) => buyCar({ token, model, color }),
    claimBonus: () => claimBonus({ token }),
    collectCarIncome: () => collectCarIncome({ token }),
    cancelDeal: (dealId) => cancelDeal({ token, dealId }),
    insurePlot: (plotId) => insurePlot({ token, plotId }),
  }
}

/** The open library session / building exam, if any. */
export function useTownQuiz() {
  const token = useAuthStore((s) => s.token)
  return useQuery(api.town.quizState, token ? { token } : 'skip')
}

/** The student's level (direction, lesson) and topics with mastery — for the library screen. */
export function useLearningProfile(enabled = true) {
  const token = useAuthStore((s) => s.token)
  const profile = useQuery(api.town.learningProfile, token && enabled ? { token } : 'skip')
  const learned = useQuery(api.town.learnedRefs, token && enabled ? { token } : 'skip')
  return useMemo(() => {
    if (!profile || !learned) return undefined
    const known = new Set(learned)
    return {
      ...profile,
      topics: profile.topics.map(({ refs, ...t }) => {
        const mastered = refs.filter((r) => known.has(r)).length
        return { ...t, mastered, mastery: refs.length ? mastered / refs.length : 0 }
      }),
    }
  }, [profile, learned])
}

/** The caller's open town deals (selling or buying) — for the banner shown on every page. */
export function useMyTownDeals() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)
  return useQuery(api.town.myDeals, token && role !== 'platform_admin' ? { token } : 'skip') ?? []
}

/** Center admins: insurance claims and the insurance company's books. */
export function useTownClaims() {
  const token = useAuthStore((s) => s.token)
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin)
  return useQuery(api.town.listClaims, token && isSuperAdmin ? { token } : 'skip')
}

export function useDecideClaim() {
  const token = useAuthStore((s) => s.token)
  const decide = useMutation(api.town.decideClaim)
  return (claimId, approve, note) => decide({ token, claimId, approve, ...(note ? { note } : {}) })
}

export function usePendingClaimCount() {
  const token = useAuthStore((s) => s.token)
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin)
  return useQuery(api.town.pendingClaimCount, token && isSuperAdmin ? { token } : 'skip') ?? 0
}

import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'

/** Live town state — every purchase anyone makes shows up for everyone at once. */
export function useTown() {
  const token = useAuthStore((s) => s.token)
  return useQuery(api.town.getTown, token ? { token } : 'skip')
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
  const trafficFine = useMutation(api.town.trafficFine)
  const listPlot = useMutation(api.town.listPlot)
  const buyListedPlot = useMutation(api.town.buyListedPlot)
  const listCar = useMutation(api.town.listCar)
  const buyListedCar = useMutation(api.town.buyListedCar)
  const driveStart = useMutation(api.town.driveStart)
  const driveTick = useMutation(api.town.driveTick)
  const driveStop = useMutation(api.town.driveStop)
  const setStyle = useMutation(api.town.setStyle)
  const buyCar = useMutation(api.town.buyCar)
  const claimBonus = useMutation(api.town.claimBonus)
  const taxiRequest = useMutation(api.town.taxiRequest)
  const taxiPickup = useMutation(api.town.taxiPickup)
  const taxiDropoff = useMutation(api.town.taxiDropoff)
  const taxiCancel = useMutation(api.town.taxiCancel)
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
    trafficFine: () => trafficFine({ token }),
    listPlot: (plotId, price) => listPlot({ token, plotId, price }),
    buyListedPlot: (plotId, price) => buyListedPlot({ token, plotId, price }),
    listCar: (price) => listCar({ token, price }),
    buyListedCar: (sellerId, price) => buyListedCar({ token, sellerId, price }),
    driveStart: () => driveStart({ token }),
    driveTick: () => driveTick({ token }),
    driveStop: () => driveStop({ token }),
    setStyle: (plotId, style) => setStyle({ token, plotId, style }),
    buyCar: (model, color) => buyCar({ token, model, color }),
    claimBonus: () => claimBonus({ token }),
    taxiRequest: (near) => taxiRequest({ token, ...(near ? { nearX: near.x, nearZ: near.z } : {}) }),
    taxiPickup: (tripId) => taxiPickup({ token, tripId }),
    taxiDropoff: (tripId) => taxiDropoff({ token, tripId }),
    taxiCancel: () => taxiCancel({ token }),
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
  return useQuery(api.town.learningProfile, token && enabled ? { token } : 'skip')
}

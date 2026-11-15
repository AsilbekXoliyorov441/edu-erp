import { internalMutation } from './_generated/server'
import { v } from 'convex/values'
import { notify } from './lib/notify'
import { BUILDING_KINDS, PLOT_BY_ID, stageCost } from '../src/shared/config/town'

/** One-off repair after someone used Botirxon's account on 2026-11-11 … 2026-11-13 (Tashkent)
 * to sell his plots for the minimum price and buy plots back at inflated prices — he made
 * none of those deals himself. Not reachable from the client. Run with `dryRun: true` first
 * to see what would change:
 *   npx convex run incidents:restoreBotirxon '{"dryRun":true}'
 *
 * Botirxon:
 * - every plot sold out of his account in that window goes back to him as it was then (what
 *   the buyer built on it afterwards is removed — it was built with his money);
 * - the money that left his account through market deals in that window is added on top of
 *   what he has now, so nothing he earned since is lost.
 * Whoever re-sold his plots for more than they paid gives that profit back, in this order:
 * 1. buildings they put up with it on his plots (removed above) count towards it;
 * 2. their cash, then their bank savings;
 * 3. plots they bought / built on after making the profit are taken (plot and building —
 *    the plot goes back to the town, empty), newest first, counted at what they spent on
 *    them; whatever that exceeds the debt by is paid back to them as cash.
 * If even that is not enough, the rest leaves their cash negative (like an unpaid fine).
 * The buyers of his plots get a warning; he gets a note that his property is back. */
const LOGIN = 'botirxon'
const FROM = Date.UTC(2026, 10, 10, 19, 0, 0) // 2026-11-11 00:00 Tashkent (UTC+5)
const TO = Date.UTC(2026, 10, 13, 19, 0, 0) // 2026-11-14 00:00 Tashkent

const WARNING = {
  type: 'town_warning',
  title: 'Ogohlantirish: g‘irromlik aniqlandi',
  body:
    "Siz boshqa o'quvchining hisobidan arzon narxga qo'yilgan binolarni sotib olganingiz aniqlandi. " +
    'Binolar egasiga qaytarildi. Yana shunday g‘irromlik qilib sotib olsangiz, shaharcha o‘yiniga kira olmaysiz.',
}

const RESTORED = {
  type: 'town_restored',
  title: 'Binolaringiz qaytarildi',
  body:
    '11–13-noyabr kunlari hisobingizdan sotib yuborilgan binolar va yo‘qotilgan pullaringiz qaytarildi. ' +
    "Hozirgi pullaringiz joyida. Parolingizni profilingizda almashtirib qo'ying.",
}

const usd = (n) => `$${Math.round(n).toLocaleString('en-US')}`

/** What building floors `from` … `to` of `kind` costs. */
function floorsCost(kind, from, to) {
  const k = BUILDING_KINDS[kind] ? kind : 'house'
  let sum = 0
  for (let f = from; f < to; f += BUILDING_KINDS[k].step) sum += stageCost(k, f)
  return sum
}

/** A plot's last owner's open quiz on it (collect / build) would fail the owner check. */
async function cancelQuizzesOn(ctx, playerId, plotId) {
  const open = await ctx.db
    .query('townQuizzes')
    .withIndex('by_player_status', (q) => q.eq('playerId', playerId).eq('status', 'active'))
    .collect()
  for (const quiz of open) if (quiz.plotId === plotId) await ctx.db.patch(quiz._id, { status: 'cancelled' })
}

export const restoreBotirxon = internalMutation({
  args: { dryRun: v.boolean() },
  handler: async (ctx, { dryRun }) => {
    const student = await ctx.db
      .query('students')
      .withIndex('by_login', (q) => q.eq('login', LOGIN))
      .unique()
    if (!student) throw new Error('student not found')
    const me = await ctx.db
      .query('townPlayers')
      .withIndex('by_user', (q) => q.eq('userId', student._id))
      .unique()
    if (!me) throw new Error('town player not found')

    const already = await ctx.db
      .query('notifications')
      .withIndex('by_recipient', (q) => q.eq('recipientId', student._id))
      .collect()
    if (already.some((n) => n.type === 'town_restored')) throw new Error('already restored')

    const allSales = (await ctx.db.query('townSales').collect())
      .filter((s) => s.townKey === me.townKey)
      .sort((a, b) => a.at - b.at)
    const windowSales = allSales.filter((s) => s.at >= FROM && s.at < TO)
    const sales = windowSales.filter((s) => s.sellerId === me._id || s.buyerId === me._id)
    const received = sales.filter((s) => s.sellerId === me._id).reduce((sum, s) => sum + s.price, 0)
    const paid = sales.filter((s) => s.buyerId === me._id).reduce((sum, s) => sum + s.price, 0)
    const refund = Math.max(0, paid - received)

    // first time each plot left his account in the window
    const stolen = new Map()
    for (const s of sales) {
      if (s.what === 'plot' && s.sellerId === me._id && !stolen.has(s.plotId)) stolen.set(s.plotId, s)
    }

    // Profit others made re-selling his plots: per player and plot, what they got for it minus
    // what they paid (only gains count). `profitAt` = when a player first came out ahead.
    const flows = new Map()
    const profitAt = new Map()
    for (const s of windowSales) {
      if (s.what !== 'plot' || !stolen.has(s.plotId)) continue
      for (const [playerId, field] of [
        [s.buyerId, 'paid'],
        [s.sellerId, 'got'],
      ]) {
        if (playerId === me._id) continue
        const key = `${playerId}|${s.plotId}`
        if (!flows.has(key)) flows.set(key, { playerId, paid: 0, got: 0 })
        const f = flows.get(key)
        f[field] += s.price
        if (f.got > f.paid && !profitAt.has(playerId)) profitAt.set(playerId, s.at)
      }
    }
    const profitBy = new Map()
    for (const f of flows.values()) {
      const gain = Math.max(0, f.got - f.paid)
      if (gain) profitBy.set(f.playerId, (profitBy.get(f.playerId) ?? 0) + gain)
    }

    // ---- his plots go back
    const plots = []
    const buyers = new Set()
    const demolishedBy = new Map() // what a profiteer built on his plots with the profit
    for (const [plotId, sale] of stolen) {
      buyers.add(sale.buyerId)
      const row = await ctx.db
        .query('townPlots')
        .withIndex('by_town_plot', (q) => q.eq('townKey', me.townKey).eq('plotId', plotId))
        .first()
      if (!row) continue
      if (row.ownerId === me._id) {
        plots.push({ plot: PLOT_BY_ID[plotId]?.number, action: 'already his' })
        continue
      }
      const holder = await ctx.db.get(row.ownerId)
      // floors at the moment it was taken, from the sale label ("…, 15 qavat)"); none = empty plot
      const floorsThen = Number(/(\d+) qavat\)/.exec(sale.label)?.[1] ?? 0)
      const reset = row.floors > floorsThen
      const floors = reset ? floorsThen : row.floors
      const since = profitAt.get(row.ownerId)
      if (reset && since !== undefined && (row.builtAt ?? 0) >= since) {
        const cost = floorsCost(row.kind, floorsThen, row.floors)
        demolishedBy.set(row.ownerId, (demolishedBy.get(row.ownerId) ?? 0) + cost)
      }
      plots.push({ plot: PLOT_BY_ID[plotId]?.number, from: holder?.nickname, floorsNow: row.floors, floorsBack: floors })
      if (dryRun) continue
      if (holder) await cancelQuizzesOn(ctx, holder._id, plotId)
      await ctx.db.patch(row._id, {
        ownerId: me._id,
        salePrice: undefined,
        floors,
        ...(reset && floors === 0 ? { kind: undefined, design: undefined, builtAt: undefined } : {}),
        // income keeps counting from when it was taken (capped like any other income)
        lastCollectAt: floors > 0 ? sale.at : undefined,
      })
    }

    // ---- profit back from the players who made it
    const penalties = []
    for (const playerId of new Set([...buyers, ...profitBy.keys()])) {
      const player = await ctx.db.get(playerId)
      if (!player) continue
      const profit = profitBy.get(playerId) ?? 0
      let debt = profit

      const fromDemolished = Math.min(debt, demolishedBy.get(playerId) ?? 0)
      debt -= fromDemolished

      const fromMoney = Math.min(Math.max(0, player.money), debt)
      debt -= fromMoney
      const bank = player.bankBalance ?? 0
      const fromBank = Math.min(bank, debt)
      debt -= fromBank

      const seized = []
      if (debt > 0) {
        const since = profitAt.get(playerId) ?? 0
        const own = (
          await ctx.db
            .query('townPlots')
            .withIndex('by_owner', (q) => q.eq('ownerId', playerId))
            .collect()
        )
          .filter((r) => !stolen.has(r.plotId) && (r.boughtAt >= since || (r.builtAt ?? 0) >= since))
          .sort((a, b) => Math.max(b.boughtAt, b.builtAt ?? 0) - Math.max(a.boughtAt, a.builtAt ?? 0))
        for (const r of own) {
          if (debt <= 0) break
          const bought = allSales.findLast((s) => s.what === 'plot' && s.plotId === r.plotId && s.buyerId === playerId)
          const plotPrice = bought ? bought.price : (PLOT_BY_ID[r.plotId]?.price ?? 0)
          // floors count only if built after they got the plot (else they came with it)
          const built = (r.builtAt ?? 0) > r.boughtAt ? floorsCost(r.kind, 0, r.floors) : 0
          const spent = plotPrice + built
          debt -= spent
          seized.push({ row: r, plot: PLOT_BY_ID[r.plotId]?.number, floors: r.floors, spent })
        }
      }
      const giveBack = Math.max(0, -debt)
      const stillOwed = Math.max(0, debt)
      const after = {
        money: player.money - fromMoney + giveBack - stillOwed,
        bankBalance: bank - fromBank,
      }
      penalties.push({
        nickname: player.nickname,
        userId: player.userId,
        profit,
        fromDemolished,
        fromMoney,
        fromBank,
        seized: seized.map(({ plot, floors, spent }) => ({ plot, floors, spent })),
        giveBack,
        stillOwed,
        before: { money: player.money, bankBalance: bank },
        after,
      })
      if (dryRun) continue
      if (profit > 0) await ctx.db.patch(player._id, after)
      for (const { row } of seized) {
        await cancelQuizzesOn(ctx, playerId, row.plotId)
        await ctx.db.delete(row._id)
      }
    }

    const report = {
      dryRun,
      botirxon: { moneyNow: me.money, received, paid, refund, moneyAfter: me.money + refund },
      plots,
      penalties: penalties.map((p) => Object.fromEntries(Object.entries(p).filter(([key]) => key !== 'userId'))),
    }
    if (dryRun) return report

    await ctx.db.patch(me._id, { money: me.money + refund })
    for (const p of penalties) {
      let extra = ''
      if (p.profit > 0) {
        extra += ` Bu bitimlardan olgan ${usd(p.profit)} foydangiz qaytarib olindi.`
        if (p.fromDemolished > 0) extra += ' Shu pulga uning hovlisiga qurgan binongiz buzildi.'
        if (p.seized.length) extra += ` Shu foydaga olingan/qurilgan hovlilar olib qo'yildi: ${p.seized.map((s) => `№${s.plot}`).join(', ')}.`
      }
      await notify(ctx, [p.userId], { ...WARNING, body: WARNING.body + extra })
    }
    await notify(ctx, [student._id], RESTORED)
    return report
  },
})

import { query, mutation, internalMutation } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { getScope } from './lib/scoping'
import { internal } from './_generated/api'
import { notify, getOrderHandlerIds } from './lib/notify'
import { PRESET_TESTS } from './lib/presetTests'
import { DIRECTION_LABEL, groupDirection, lessonNumberOf, subjectOf, topicFitsLevel } from './lib/learningLevel'
import {
  CAR_COLORS,
  CAR_MODELS,
  BANK,
  BUILDING_KINDS,
  estimateValue,
  mudarabaRate,
  MARKET,
  plotAllows,
  upgradeOf,
  HOUSE_STYLES,
  SHOP_ITEMS,
  kindOf,
  nextStage,
  pendingIncome,
  stageCost,
  PLAYER_COLORS,
  LEARN,
  PLOT_BY_ID,
  TOWN,
  DEAL,
  insurancePremium,
  pendingCarIncome,
} from '../src/shared/config/town'

/** Every student and teacher of a center lives in the same town. */
async function resolveTownUser(ctx, token) {
  const scope = await getScope(ctx, token)
  if (scope.platformAdmin) throw new ConvexError('Shaharcha markaz foydalanuvchilari uchun')
  return { townKey: String(scope.centerId ?? 'global'), userId: scope.session.userId, role: scope.session.role }
}

async function findMe(ctx, userId) {
  return await ctx.db
    .query('townPlayers')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique()
}

async function requireMe(ctx, token) {
  const { townKey, userId } = await resolveTownUser(ctx, token)
  const me = await findMe(ctx, userId)
  if (!me) throw new ConvexError("Avval shaharchaga qo'shiling")
  return { me, townKey }
}

function spend(me, amount) {
  if (me.money < amount) throw new ConvexError("Pulingiz yetmaydi")
  return me.money - amount
}

/** Mudaraba investment balance including the profit share earned since `bankAt`, at the
 * town's current hourly profit `rate` (see `townRate`). No interest — the rate is whatever
 * the town's businesses produce, and is zero when there are none. */
function bankNow(me, now, rate) {
  const bal = me.bankBalance ?? 0
  if (!bal || !me.bankAt || !rate) return bal
  return Math.floor(bal * (1 + rate * ((now - me.bankAt) / 3_600_000)))
}

/** Town economy snapshot for the mudaraba pool. */
function townEconomy(players, plots) {
  const incomePerHour = plots.reduce((sum, p) => sum + BUILDING_KINDS[kindOf(p)].income * p.floors, 0)
  const invested = players.reduce((sum, p) => sum + (p.bankBalance ?? 0), 0)
  return { incomePerHour, invested, rate: mudarabaRate(incomePerHour, invested) }
}

/* Bandwidth note: every reactive query re-reads all the documents it touched whenever one
 * of them changes, for every open screen. Player rows change constantly (money on every quiz
 * answer), so shared, town-wide reads go through `townRoster` — a small public copy of each
 * player that only changes when what others can see changes (name, colour, car, bank stake,
 * learning score at the end of a session). Never read all `townPlayers` in a query. */

function rosterFields(p) {
  const fields = {
    nickname: p.nickname,
    color: p.color,
    car: p.car,
    carSalePrice: p.carSalePrice,
    learnCorrect: p.learnCorrect ?? 0,
    bankBalance: p.bankBalance ?? 0,
  }
  for (const k of Object.keys(fields)) if (fields[k] === undefined) delete fields[k]
  return fields
}

/** Copy a player's public fields to `townRoster`, writing only when something changed. */
async function syncRoster(ctx, playerId) {
  const p = await ctx.db.get(playerId)
  const row = await ctx.db
    .query('townRoster')
    .withIndex('by_player', (q) => q.eq('playerId', playerId))
    .unique()
  if (!p) {
    if (row) await ctx.db.delete(row._id)
    return
  }
  const fields = rosterFields(p)
  if (!row) {
    await ctx.db.insert('townRoster', { townKey: p.townKey, playerId, ...fields })
    return
  }
  const keys = new Set([...Object.keys(fields), 'car', 'carSalePrice'])
  const changed = [...keys].some((k) => JSON.stringify(row[k]) !== JSON.stringify(fields[k]))
  if (changed) await ctx.db.patch(row._id, { car: undefined, carSalePrice: undefined, ...fields })
}

async function townRoster(ctx, townKey) {
  return await ctx.db
    .query('townRoster')
    .withIndex('by_town', (q) => q.eq('townKey', townKey))
    .collect()
}

async function townPlotsOf(ctx, townKey) {
  return await ctx.db
    .query('townPlots')
    .withIndex('by_town', (q) => q.eq('townKey', townKey))
    .collect()
}

async function townRate(ctx, townKey) {
  return townEconomy(await townRoster(ctx, townKey), await townPlotsOf(ctx, townKey)).rate
}

/** One-off / repair: rebuild every roster row from `townPlayers`. Run after deploying, or
 * after editing players by hand: npx convex run town:syncAllRosters */
export const syncAllRosters = internalMutation({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query('townPlayers').collect()
    for (const p of players) await syncRoster(ctx, p._id)
    const ids = new Set(players.map((p) => p._id))
    for (const row of await ctx.db.query('townRoster').collect()) if (!ids.has(row.playerId)) await ctx.db.delete(row._id)
    return { players: players.length }
  },
})

async function getFund(ctx, townKey) {
  const row = await ctx.db
    .query('townFunds')
    .withIndex('by_town', (q) => q.eq('townKey', townKey))
    .first()
  if (row) return row
  const id = await ctx.db.insert('townFunds', { townKey, balance: 0, given: 0, donors: 0 })
  return await ctx.db.get(id)
}

/** The shared town map: residents (from the roster), owned plots and the town economy.
 * Re-runs only when something everyone sees changes — not on anyone's money moving. */
export const getTownMap = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { townKey } = await resolveTownUser(ctx, token)
    const roster = await townRoster(ctx, townKey)
    const plots = await townPlotsOf(ctx, townKey)
    const economy = townEconomy(roster, plots)
    const fundRow = await ctx.db
      .query('townFunds')
      .withIndex('by_town', (q) => q.eq('townKey', townKey))
      .first()
    const byPlayer = new Map(roster.map((r) => [r.playerId, r]))
    const stats = new Map()
    for (const x of plots) {
      const st = stats.get(x.ownerId) ?? { plots: 0, floors: 0 }
      st.plots += 1
      st.floors += x.floors
      stats.set(x.ownerId, st)
    }

    return {
      economy: {
        incomePerHour: economy.incomePerHour,
        invested: economy.invested,
        rate: economy.rate,
        fund: fundRow?.balance ?? 0,
        fundGiven: fundRow?.given ?? 0,
        fundDonors: fundRow?.donors ?? 0,
      },
      players: roster.map((r) => ({
        id: r.playerId,
        nickname: r.nickname,
        color: r.color,
        car: r.car ?? null,
        carSalePrice: r.carSalePrice ?? null,
        learnCorrect: r.learnCorrect ?? 0,
        plots: stats.get(r.playerId)?.plots ?? 0,
        floors: stats.get(r.playerId)?.floors ?? 0,
      })),
      plots: plots.map((x) => ({
        plotId: x.plotId,
        ownerId: x.ownerId,
        ownerName: byPlayer.get(x.ownerId)?.nickname ?? '?',
        ownerColor: byPlayer.get(x.ownerId)?.color ?? '#999',
        floors: x.floors,
        style: x.style,
        kind: kindOf(x),
        design: x.design ?? null,
        builtAt: x.builtAt ?? null,
        lastCollectAt: x.lastCollectAt ?? null,
        salePrice: x.salePrice ?? null,
        inDeal: !!x.dealId,
        insuredValue: x.insuredValue ?? null,
      })),
    }
  },
})

/** The caller's own player: money, bank, cooldowns. Re-runs when the caller's own row
 * changes (or the town economy does) — other players' activity doesn't touch it. */
export const getTownMe = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { townKey, userId, role } = await resolveTownUser(ctx, token)
    const viewer = { staff: role === 'teacher' }
    const me = await findMe(ctx, userId)
    if (!me) return { viewer, me: null }

    const now = Date.now()
    const rate = await townRate(ctx, townKey)
    const myPlots = (
      await ctx.db
        .query('townPlots')
        .withIndex('by_owner', (q) => q.eq('ownerId', me._id))
        .collect()
    ).filter((x) => x.townKey === townKey)
    const saleRows = await ctx.db
      .query('townSales')
      .withIndex('by_seller', (q) => q.eq('sellerId', me._id))
      .order('desc')
      .take(5)
    const sales = []
    for (const x of saleRows) {
      const buyer = await ctx.db
        .query('townRoster')
        .withIndex('by_player', (q) => q.eq('playerId', x.buyerId))
        .unique()
      sales.push({ id: x._id, label: x.label, price: x.price, at: x.at, buyer: buyer?.nickname ?? '?' })
    }

    return {
      viewer,
      me: {
        id: me._id,
        nickname: me.nickname,
        color: me.color,
        money: me.money,
        car: me.car ?? null,
        carCollectAt: me.carCollectAt ?? null,
        nextBonusAt: (me.lastBonusAt ?? 0) + TOWN.BONUS_COOLDOWN_MS,
        learnCorrect: me.learnCorrect ?? 0,
        learnEarned: me.learnEarned ?? 0,
        buildCooldownUntil: me.buildCooldownUntil ?? 0,
        bankBalance: bankNow(me, now, rate),
        loan: me.loan ?? 0,
        loanLimit: loanLimit(me, myPlots),
        zakatPaid: me.zakatPaid ?? 0,
        mudarabaProfit: me.mudarabaProfit ?? 0,
        helpAt: me.helpAt ?? 0,
        scholarUntil: me.scholarUntil ?? 0,
        builderKits: me.builderKits ?? 0,
        carInDeal: !!me.carDealId,
        sales,
        claims: (
          await ctx.db
            .query('townClaims')
            .withIndex('by_player', (q) => q.eq('playerId', me._id))
            .order('desc')
            .take(5)
        ).map((c) => ({ id: c._id, label: c.label, amount: c.amount, status: c.status, note: c.note ?? null, createdAt: c.createdAt })),
      },
    }
  },
})

/** Move into town with a username. */
export const join = mutation({
  args: { token: v.string(), nickname: v.string(), color: v.string() },
  handler: async (ctx, { token, nickname, color }) => {
    const { townKey, userId } = await resolveTownUser(ctx, token)
    if (await findMe(ctx, userId)) throw new ConvexError('Siz allaqachon shaharchadasiz')
    const name = nickname.trim()
    if (!TOWN.NICKNAME_RE.test(name)) {
      throw new ConvexError("Username 3–16 ta lotin harf, raqam yoki _ bo'lishi kerak")
    }
    if (!PLAYER_COLORS.includes(color)) throw new ConvexError("Rang noto'g'ri")
    const taken = await ctx.db
      .query('townPlayers')
      .withIndex('by_town_nickname', (q) => q.eq('townKey', townKey).eq('nicknameLower', name.toLowerCase()))
      .first()
    if (taken) throw new ConvexError('Bu username band — boshqasini tanlang')

    const id = await ctx.db.insert('townPlayers', {
      townKey,
      userId,
      nickname: name,
      nicknameLower: name.toLowerCase(),
      color,
      money: TOWN.START_MONEY,
      joinedAt: Date.now(),
    })
    await syncRoster(ctx, id)
    return id
  },
})

export const buyPlot = mutation({
  args: { token: v.string(), plotId: v.string() },
  handler: async (ctx, { token, plotId }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const plot = PLOT_BY_ID[plotId]
    if (!plot || plot.public) throw new ConvexError('Bu joy sotilmaydi')
    const owned = await ctx.db
      .query('townPlots')
      .withIndex('by_town_plot', (q) => q.eq('townKey', townKey).eq('plotId', plotId))
      .first()
    if (owned) throw new ConvexError('Bu joyni kimdir sotib olgan')

    await ctx.db.patch(me._id, { money: spend(me, plot.price) })
    await ctx.db.insert('townPlots', {
      townKey,
      plotId,
      ownerId: me._id,
      floors: 0,
      style: HOUSE_STYLES[Math.floor(Math.random() * HOUSE_STYLES.length)].id,
      boughtAt: Date.now(),
    })
  },
})

/** Next stage price, with a supermarket building kit applied if the player has one. */
function buildCost(me, kind, floors) {
  const cost = stageCost(kind, floors)
  return (me.builderKits ?? 0) > 0 ? Math.round(cost * 0.75) : cost
}

async function requireMyPlot(ctx, me, townKey, plotId) {
  const row = await ctx.db
    .query('townPlots')
    .withIndex('by_town_plot', (q) => q.eq('townKey', townKey).eq('plotId', plotId))
    .first()
  if (!row || row.ownerId !== me._id) throw new ConvexError('Bu sizning joyingiz emas')
  return row
}

export const setStyle = mutation({
  args: { token: v.string(), plotId: v.string(), style: v.string() },
  handler: async (ctx, { token, plotId, style }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const row = await requireMyPlot(ctx, me, townKey, plotId)
    if (!HOUSE_STYLES.some((s) => s.id === style)) throw new ConvexError("Uslub noto'g'ri")
    await ctx.db.patch(row._id, { style })
  },
})

/** Buy (or trade up to) a car. The old car is sold back for half its price. */
export const buyCar = mutation({
  args: { token: v.string(), model: v.string(), color: v.string() },
  handler: async (ctx, { token, model, color }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const car = CAR_MODELS.find((c) => c.id === model)
    if (!car || !CAR_COLORS.includes(color)) throw new ConvexError("Mashina noto'g'ri")
    const myPlots = await ctx.db
      .query('townPlots')
      .withIndex('by_owner', (q) => q.eq('ownerId', me._id))
      .collect()
    if (!myPlots.some((p) => p.townKey === townKey)) throw new ConvexError("Mashinani qo'yish uchun avval hovli sotib oling")
    const tradeIn = me.car ? Math.round((CAR_MODELS.find((c) => c.id === me.car.model)?.price ?? 0) / 2) : 0
    const cost = me.car?.model === model ? 500 : car.price - tradeIn // same model = just repaint
    // a new model starts earning from now; a repaint keeps the running income
    await ctx.db.patch(me._id, {
      money: spend(me, cost),
      car: { model, color },
      ...(me.car?.model === model ? {} : { carCollectAt: Date.now() }),
    })
    await syncRoster(ctx, me._id)
  },
})

/** Daily allowance. */
export const claimBonus = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { me } = await requireMe(ctx, token)
    const now = Date.now()
    if (now < (me.lastBonusAt ?? 0) + TOWN.BONUS_COOLDOWN_MS) throw new ConvexError('Bonusni hali olib bo\'lmaydi')
    await ctx.db.patch(me._id, { money: me.money + TOWN.DAILY_BONUS, lastBonusAt: now })
  },
})

/** A car is an asset: it earns a share of its price every hour, collected by the owner. */
export const collectCarIncome = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { me } = await requireMe(ctx, token)
    if (!me.car) throw new ConvexError("Mashinangiz yo'q")
    const now = Date.now()
    const amount = pendingCarIncome(me.car.model, me.carCollectAt, now)
    if (amount < 100) throw new ConvexError("Hali yig'iladigan daromad yo'q")
    await ctx.db.patch(me._id, { money: me.money + amount, carCollectAt: now })
    return amount
  },
})

/** Admin/dev only — not callable from the app; run from the CLI or Convex dashboard:
 *  npx convex run town:adminSetMoney '{"nickname":"asilbek","money":100000000000}' */
export const adminSetMoney = internalMutation({
  args: { nickname: v.string(), money: v.number() },
  handler: async (ctx, { nickname, money }) => {
    const rows = await ctx.db.query('townPlayers').collect()
    const matches = rows.filter((p) => p.nicknameLower === nickname.toLowerCase())
    if (matches.length === 0) throw new ConvexError(`@${nickname} topilmadi`)
    for (const p of matches) await ctx.db.patch(p._id, { money })
    return matches.length
  },
})

/* ------------------------------------------------------------------ learning --------- */

function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const MIN_POOL = 20

/** The student's "learning profile": which topics fit them and how far along the group is.
 *  - teacher-assigned topics of the group (always in),
 *  - the group teacher's other topics that fit the group's direction and lesson,
 *  - built-in preset topics with the same rules, if there are still too few questions.
 * A teacher playing the town gets all of their own topics. */
async function buildTopics(ctx, token) {
  const scope = await getScope(ctx, token)
  const tests = [] // { test, source, order }
  let meta = { role: scope.session.role, groupName: null, direction: 'other', lesson: null }

  if (scope.session.role === 'student') {
    const student = await ctx.db.get(scope.session.userId)
    const group = student ? await ctx.db.get(student.groupId) : null
    const nowIso = new Date().toISOString()
    const lessons = group
      ? await ctx.db
          .query('lessons')
          .withIndex('by_group', (q) => q.eq('groupId', group._id))
          .collect()
      : []
    const lesson = lessons.filter((l) => l.date <= nowIso).reduce((mx, l) => Math.max(mx, l.lessonNumber), 0)
    const direction = groupDirection(group)
    meta = { role: 'student', groupName: group?.name ?? null, direction, lesson }

    const assigned = group
      ? await ctx.db
          .query('testAssignments')
          .withIndex('by_group', (q) => q.eq('groupId', group._id))
          .collect()
      : []
    const assignedIds = new Set()
    for (const a of assigned.sort((x, y) => x.createdAt.localeCompare(y.createdAt))) {
      const test = await ctx.db.get(a.testId)
      if (test && !assignedIds.has(test._id)) {
        assignedIds.add(test._id)
        tests.push({ test, source: 'assigned', order: tests.length })
      }
    }
    if (group?.teacherId) {
      const own = await ctx.db
        .query('tests')
        .withIndex('by_teacher', (q) => q.eq('teacherId', group.teacherId))
        .collect()
      for (const test of own) {
        if (assignedIds.has(test._id)) continue
        if (topicFitsLevel({ subject: subjectOf(test), lesson: lessonNumberOf(test.title) }, direction, lesson)) {
          tests.push({ test, source: 'level', order: tests.length })
        }
      }
    }
  } else {
    const own = await ctx.db
      .query('tests')
      .withIndex('by_teacher', (q) => q.eq('teacherId', scope.session.userId))
      .collect()
    own.forEach((test) => tests.push({ test, source: 'own', order: tests.length }))
  }

  const topics = []
  for (const { test, source, order } of tests) {
    const qs = await ctx.db
      .query('testQuestions')
      .withIndex('by_test', (q) => q.eq('testId', test._id))
      .collect()
    const refs = qs.filter((q) => q.options.length === 4).map((q) => `q:${q._id}`)
    if (refs.length) {
      topics.push({ key: `t:${test._id}`, title: test.title, subject: subjectOf(test), lesson: lessonNumberOf(test.title), source, order, refs })
    }
  }

  const total = topics.reduce((sum, t) => sum + t.refs.length, 0)
  if (total < MIN_POOL) {
    const titles = new Set(topics.map((t) => t.title.toLowerCase()))
    PRESET_TESTS.forEach((preset, ti) => {
      if (titles.has(preset.title.toLowerCase())) return
      const info = { subject: preset.subject, lesson: lessonNumberOf(preset.title) }
      if (meta.role === 'student' && !topicFitsLevel(info, meta.direction, meta.lesson)) return
      topics.push({
        key: `p:${ti}`,
        title: preset.title,
        ...info,
        source: 'preset',
        order: 1000 + ti,
        refs: preset.questions.map((_, qi) => `p:${ti}:${qi}`),
      })
    })
  }

  // "Current" topic: the latest lesson the group has reached, else the newest assigned topic.
  const byLesson = topics.filter((t) => t.lesson !== null && (meta.lesson === null || t.lesson <= Math.max(1, meta.lesson)))
  const current =
    byLesson.sort((a, b) => b.lesson - a.lesson)[0] ??
    [...topics].filter((t) => t.source === 'assigned').sort((a, b) => b.order - a.order)[0] ??
    topics[0]
  return { meta, topics, currentKey: current?.key ?? null }
}

function topicMastery(topic, learned) {
  const mastered = topic.refs.filter((r) => (learned.get(r)?.correctCount ?? 0) > 0).length
  return { mastered, mastery: topic.refs.length ? mastered / topic.refs.length : 0 }
}

/** Order a topic's questions for practice: never seen → got wrong → shaky → known. */
function rankRefs(refs, learned) {
  const score = (r) => {
    const row = learned.get(r)
    if (!row) return Math.random()
    const wrong = row.wrongCount ?? 0
    if (row.correctCount === 0) return 1 + Math.random()
    if (wrong >= row.correctCount) return 2 + Math.random()
    return 3 + Math.random()
  }
  return refs.map((r) => [r, score(r)]).sort((a, b) => a[1] - b[1]).map(([r]) => r)
}

/** Pick `count` questions. One topic if `topicKey` is given; otherwise spread over topics,
 * weaker topics, assigned topics and the current topic more often. */
function pickRefs({ topics, learned, currentKey, count, topicKey, random }) {
  const chosen = topicKey ? topics.filter((t) => t.key === topicKey) : topics
  const queues = chosen.map((t) => {
    const { mastery } = topicMastery(t, learned)
    const weight = (0.35 + 0.65 * (1 - mastery)) * (t.source === 'assigned' ? 1.4 : 1) * (t.key === currentKey ? 1.6 : 1)
    return { weight, queue: random ? shuffle(t.refs) : rankRefs(t.refs, learned) }
  })
  const out = []
  while (out.length < count) {
    const open = queues.filter((q) => q.queue.length)
    if (!open.length) break
    let roll = Math.random() * open.reduce((sum, q) => sum + q.weight, 0)
    const pick = open.find((q) => (roll -= q.weight) <= 0) ?? open[open.length - 1]
    out.push(pick.queue.shift())
  }
  return out
}

async function loadQuestion(ctx, ref) {
  if (ref.startsWith('q:')) {
    const id = ctx.db.normalizeId('testQuestions', ref.slice(2))
    const q = id ? await ctx.db.get(id) : null
    if (!q) return null
    const test = await ctx.db.get(q.testId)
    return {
      text: q.text,
      isCode: !!q.isCode,
      options: q.options,
      correctIndex: q.correctIndex,
      imageUrl: q.imageStorageId ? await ctx.storage.getUrl(q.imageStorageId) : null,
      topic: test?.title ?? '',
      topicKey: `t:${q.testId}`,
    }
  }
  const [, ti, qi] = ref.split(':')
  const t = PRESET_TESTS[Number(ti)]
  const q = t?.questions[Number(qi)]
  return q
    ? { text: q.text, isCode: !!q.isCode, options: q.options, correctIndex: q.correctIndex, imageUrl: null, topic: t.title, topicKey: `p:${ti}` }
    : null
}

/** Library screen: the student's level and topics, with how much of each they've mastered. */
/** The student's level and topics. Does not read the player's answers, so it does not
 * re-run (re-reading every test question) after each answer — mastery comes from
 * `learnedRefs` and is combined on the client. */
export const learningProfile = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { meta, topics, currentKey } = await buildTopics(ctx, token)
    return {
      ...meta,
      directionLabel: DIRECTION_LABEL[meta.direction] ?? 'Umumiy',
      currentKey,
      topics: topics
        .map((t) => ({
          key: t.key,
          title: t.title,
          subject: t.subject,
          lesson: t.lesson,
          source: t.source,
          total: t.refs.length,
          refs: t.refs,
          current: t.key === currentKey,
        }))
        .sort((a, b) => (a.lesson ?? 999) - (b.lesson ?? 999) || a.title.localeCompare(b.title)),
    }
  },
})

/** Question refs the caller has answered correctly at least once. */
export const learnedRefs = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { userId } = await resolveTownUser(ctx, token)
    const me = await findMe(ctx, userId)
    if (!me) return []
    const rows = await ctx.db
      .query('townLearned')
      .withIndex('by_player', (q) => q.eq('playerId', me._id))
      .collect()
    return rows.filter((r) => r.correctCount > 0).map((r) => r.ref)
  },
})

async function learnedMap(ctx, playerId) {
  const rows = await ctx.db
    .query('townLearned')
    .withIndex('by_player', (q) => q.eq('playerId', playerId))
    .collect()
  return new Map(rows.map((r) => [r.ref, r]))
}

async function activeQuiz(ctx, playerId) {
  return await ctx.db
    .query('townQuizzes')
    .withIndex('by_player_status', (q) => q.eq('playerId', playerId).eq('status', 'active'))
    .first()
}


/** Start a library session (earn money) or the building exam for the next floor. */
export const quizStart = mutation({
  args: {
    token: v.string(),
    kind: v.union(v.literal('library'), v.literal('build'), v.literal('collect')),
    plotId: v.optional(v.string()),
    /** Library: practise one chosen topic instead of the mixed set. */
    topicKey: v.optional(v.string()),
  },
  handler: async (ctx, { token, kind, plotId, topicKey }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const old = await activeQuiz(ctx, me._id)
    if (old) await ctx.db.patch(old._id, { status: 'cancelled' })

    const { topics, currentKey } = await buildTopics(ctx, token)
    if (topics.length === 0) throw new ConvexError("Hali savollar yo'q — ustozingizdan test biriktirishni so'rang")
    const learned = await learnedMap(ctx, me._id)

    let count = LEARN.LIBRARY_QUESTIONS
    let need = 0
    if (kind === 'collect') {
      if (!plotId) throw new ConvexError('Hovli tanlanmagan')
      const row = await requireMyPlot(ctx, me, townKey, plotId)
      if (pendingIncome(kindOf(row), row.floors, row.lastCollectAt, Date.now()) < 100) throw new ConvexError("Hali yig'iladigan daromad yo'q")
      count = 1
    }
    if (kind === 'build') {
      if (!plotId) throw new ConvexError('Hovli tanlanmagan')
      const row = await requireMyPlot(ctx, me, townKey, plotId)
      const bk = kindOf(row)
      if (row.floors >= BUILDING_KINDS[bk].maxFloors) throw new ConvexError('Bino eng baland qavatga yetgan')
      const next = nextStage(bk, row.floors)
      if (me.money < buildCost(me, bk, row.floors)) throw new ConvexError('Qurilish uchun pul yetmaydi — kutubxonada ishlang')
      if ((me.buildCooldownUntil ?? 0) > Date.now()) {
        const sec = Math.ceil(((me.buildCooldownUntil ?? 0) - Date.now()) / 1000)
        throw new ConvexError(`Imtihonni ${sec} soniyadan keyin qayta topshirish mumkin`)
      }
      count = LEARN.examQuestions(next)
      need = LEARN.examNeed(next)
    }

    // Library practice favours new and missed questions; exams draw at random — still from
    // the student's own level.
    const practice = kind === 'library'
    const refs = pickRefs({
      topics,
      learned,
      currentKey,
      count,
      topicKey: practice && topicKey && topics.some((t) => t.key === topicKey) ? topicKey : undefined,
      random: !practice,
    })
    if (refs.length === 0) throw new ConvexError("Bu mavzuda savol yo'q")
    if (kind === 'build' && refs.length < count) need = Math.max(1, refs.length - 1)

    return await ctx.db.insert('townQuizzes', {
      playerId: me._id,
      kind,
      ...(plotId ? { plotId } : {}),
      refs,
      need,
      index: 0,
      correct: 0,
      streak: 0,
      earned: 0,
      status: 'active',
      createdAt: Date.now(),
    })
  },
})

/** The open session and its current question — without the answer. */
export const quizState = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { userId } = await resolveTownUser(ctx, token)
    const me = await findMe(ctx, userId)
    if (!me) return null
    const quiz = await activeQuiz(ctx, me._id)
    if (!quiz) return null
    const q = await loadQuestion(ctx, quiz.refs[quiz.index])
    const learned = await ctx.db
      .query('townLearned')
      .withIndex('by_player', (x) => x.eq('playerId', me._id).eq('ref', quiz.refs[quiz.index]))
      .first()
    return {
      id: quiz._id,
      kind: quiz.kind,
      plotId: quiz.plotId ?? null,
      index: quiz.index,
      total: quiz.refs.length,
      need: quiz.need,
      correct: quiz.correct,
      streak: quiz.streak,
      earned: quiz.earned,
      isNew: !(learned?.correctCount > 0),
      question: q ? { text: q.text, isCode: q.isCode, options: q.options, imageUrl: q.imageUrl, topic: q.topic } : null,
    }
  },
})

/** Answer the current question. Checked and paid on the server; finishing a building exam
 * builds the floor (or starts the retry cooldown). */
export const quizAnswer = mutation({
  args: { token: v.string(), quizId: v.id('townQuizzes'), index: v.number(), selectedIndex: v.number() },
  handler: async (ctx, { token, quizId, index, selectedIndex }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const quiz = await ctx.db.get(quizId)
    if (!quiz || quiz.playerId !== me._id || quiz.status !== 'active') throw new ConvexError('Sessiya topilmadi')
    if (quiz.index !== index) throw new ConvexError('Bu savolga allaqachon javob berilgan')

    const ref = quiz.refs[index]
    const q = await loadQuestion(ctx, ref)
    const correct = !!q && selectedIndex === q.correctIndex
    const learnedRow = await ctx.db
      .query('townLearned')
      .withIndex('by_player', (x) => x.eq('playerId', me._id).eq('ref', ref))
      .first()

    let reward = 0
    const streak = correct ? quiz.streak + 1 : 0
    if (correct) {
      if (quiz.kind === 'library') {
        const known = (learnedRow?.correctCount ?? 0) > 0
        reward = (known ? LEARN.REPEAT_REWARD : LEARN.NEW_REWARD) + Math.min((streak - 1) * LEARN.STREAK_BONUS, LEARN.MAX_STREAK_BONUS)
        if ((me.scholarUntil ?? 0) > Date.now()) reward = Math.round(reward * 1.5)
      }
    }
    // Remember every answer — right ones build mastery, wrong ones come back for practice.
    if (q) {
      if (learnedRow) {
        await ctx.db.patch(learnedRow._id, {
          correctCount: learnedRow.correctCount + (correct ? 1 : 0),
          wrongCount: (learnedRow.wrongCount ?? 0) + (correct ? 0 : 1),
          topic: q.topicKey,
          lastAt: Date.now(),
        })
      } else {
        await ctx.db.insert('townLearned', {
          playerId: me._id,
          ref,
          topic: q.topicKey,
          correctCount: correct ? 1 : 0,
          wrongCount: correct ? 0 : 1,
          lastAt: Date.now(),
        })
      }
    }

    const nextIndex = index + 1
    const correctTotal = quiz.correct + (correct ? 1 : 0)
    const finished = nextIndex >= quiz.refs.length
    // A build exam ends early once passing is impossible.
    const wrongSoFar = nextIndex - correctTotal
    const cannotPass = quiz.kind === 'build' && quiz.refs.length - wrongSoFar < quiz.need
    let status = 'active'
    let built = null
    let collected = 0
    let kitUsed = false
    let money = me.money + reward

    if (finished || cannotPass) {
      if (quiz.kind === 'collect') {
        status = 'done'
        const row = await requireMyPlot(ctx, me, townKey, quiz.plotId)
        const pending = pendingIncome(kindOf(row), row.floors, row.lastCollectAt, Date.now())
        // the accountant's question: right → all of it, wrong → half
        collected = correct ? pending : Math.floor(pending / 2)
        money += collected
        await ctx.db.patch(row._id, { lastCollectAt: Date.now() })
      } else if (quiz.kind !== 'build') status = 'done'
      else if (correctTotal >= quiz.need) {
        status = 'passed'
        const row = await requireMyPlot(ctx, me, townKey, quiz.plotId)
        const bk = kindOf(row)
        const max = BUILDING_KINDS[bk].maxFloors
        const cost = buildCost(me, bk, row.floors)
        if (row.floors < max && money >= cost) {
          money -= cost
          kitUsed = (me.builderKits ?? 0) > 0
          const floors = Math.min(max, row.floors + BUILDING_KINDS[bk].step)
          await ctx.db.patch(row._id, {
            floors,
            builtAt: Date.now(),
            ...(row.lastCollectAt ? {} : { lastCollectAt: Date.now() }),
          })
          built = floors
        }
      } else {
        status = 'failed'
      }
    }

    await ctx.db.patch(quiz._id, {
      index: nextIndex,
      correct: correctTotal,
      streak,
      earned: quiz.earned + reward,
      status,
    })
    await ctx.db.patch(me._id, {
      money,
      learnCorrect: (me.learnCorrect ?? 0) + (correct ? 1 : 0),
      learnEarned: (me.learnEarned ?? 0) + reward,
      ...(status === 'failed' ? { buildCooldownUntil: Date.now() + LEARN.FAIL_COOLDOWN_MS } : {}),
      ...(kitUsed ? { builderKits: (me.builderKits ?? 1) - 1 } : {}),
    })
    // the public learning score moves once per session, not on every answer
    if (status !== 'active') await syncRoster(ctx, me._id)

    return {
      correct,
      correctIndex: q?.correctIndex ?? null,
      reward,
      streak,
      status,
      built,
      correctTotal,
      answered: nextIndex,
      total: quiz.refs.length,
      need: quiz.need,
      earned: quiz.earned + reward,
      collected,
      kind: quiz.kind,
    }
  },
})

export const quizCancel = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { me } = await requireMe(ctx, token)
    const quiz = await activeQuiz(ctx, me._id)
    if (quiz) await ctx.db.patch(quiz._id, { status: 'cancelled' })
    await syncRoster(ctx, me._id)
  },
})

/* ------------------------------------------------------------------ buildings -------- */

/** Pick what to build on an empty plot (kind) and how it looks (design). The kind is fixed
 * once the first stage is built; the design can change any time. */
export const setPlan = mutation({
  args: { token: v.string(), plotId: v.string(), kind: v.string(), design: v.string() },
  handler: async (ctx, { token, plotId, kind, design }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const row = await requireMyPlot(ctx, me, townKey, plotId)
    const k = BUILDING_KINDS[kind]
    if (!k || !k.designs.some((d) => d.id === design)) throw new ConvexError("Dizayn noto'g'ri")
    if (row.floors > 0 && kindOf(row) !== kind) throw new ConvexError("Qurilgan bino turini o'zgartirib bo'lmaydi")
    if (!plotAllows(PLOT_BY_ID[plotId], kind, design)) throw new ConvexError('Bu hovli bunday bino uchun juda kichik')
    await ctx.db.patch(row._id, { kind, design })
  },
})

/** Turn a fully built house into an apartment block (or an apartment into an office tower)
 * so construction can keep going. Floors stay; the next stages follow the new kind. */
export const upgradeKind = mutation({
  args: { token: v.string(), plotId: v.string() },
  handler: async (ctx, { token, plotId }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const row = await requireMyPlot(ctx, me, townKey, plotId)
    const up = upgradeOf(PLOT_BY_ID[plotId], kindOf(row), row.floors)
    if (!up) throw new ConvexError("Bu binoni hozircha kattalashtirib bo'lmaydi")
    await ctx.db.patch(row._id, { kind: up.kind, design: up.design })
  },
})

/* ------------------------------------------------------------------ public places ---- */

/** Loan limit for qard al-hasan: half of what your plots are worth, within bounds. */
function loanLimit(me, myPlots) {
  const assets = myPlots.reduce((sum, p) => sum + estimateValue(PLOT_BY_ID[p.plotId], p), 0)
  return Math.round(Math.min(BANK.LOAN_MAX, Math.max(BANK.LOAN_MIN_LIMIT, assets * 0.5)) / 100) * 100
}

/** Settle the mudaraba balance (adds the profit share earned so far). */
async function settleBank(ctx, me, townKey, now) {
  const rate = await townRate(ctx, townKey)
  const settled = bankNow(me, now, rate)
  const profit = settled - (me.bankBalance ?? 0)
  return { bankBalance: settled, bankAt: now, mudarabaProfit: (me.mudarabaProfit ?? 0) + Math.max(0, profit) }
}

/** Mudaraba: invest money as a partner in the town's businesses. */
export const bankDeposit = mutation({
  args: { token: v.string(), amount: v.number() },
  handler: async (ctx, { token, amount }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const a = Math.floor(amount)
    if (!(a > 0)) throw new ConvexError("Summa noto'g'ri")
    const bank = await settleBank(ctx, me, townKey, Date.now())
    await ctx.db.patch(me._id, { ...bank, money: spend(me, a), bankBalance: bank.bankBalance + a })
    await syncRoster(ctx, me._id)
  },
})

export const bankWithdraw = mutation({
  args: { token: v.string(), amount: v.number() },
  handler: async (ctx, { token, amount }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const bank = await settleBank(ctx, me, townKey, Date.now())
    const a = Math.min(Math.floor(amount), bank.bankBalance)
    if (!(a > 0)) throw new ConvexError("Bankda pul yo'q")
    await ctx.db.patch(me._id, { ...bank, money: me.money + a, bankBalance: bank.bankBalance - a })
    await syncRoster(ctx, me._id)
  },
})

/** Qard al-hasan: borrow interest-free, up to your limit. */
export const qardTake = mutation({
  args: { token: v.string(), amount: v.number() },
  handler: async (ctx, { token, amount }) => {
    const { me } = await requireMe(ctx, token)
    const a = Math.floor(amount)
    if (!(a > 0)) throw new ConvexError("Summa noto'g'ri")
    const myPlots = await ctx.db
      .query('townPlots')
      .withIndex('by_owner', (q) => q.eq('ownerId', me._id))
      .collect()
    const limit = loanLimit(me, myPlots)
    if ((me.loan ?? 0) + a > limit) throw new ConvexError(`Qarz chegarasi ${limit.toLocaleString('en-US')}$ — avvalgisini qaytaring`)
    await ctx.db.patch(me._id, { money: me.money + a, loan: (me.loan ?? 0) + a })
  },
})

/** Pay back the loan — exactly what was borrowed, nothing more. */
export const qardRepay = mutation({
  args: { token: v.string(), amount: v.number() },
  handler: async (ctx, { token, amount }) => {
    const { me } = await requireMe(ctx, token)
    const a = Math.min(Math.floor(amount), me.loan ?? 0)
    if (!(a > 0)) throw new ConvexError("Qarzingiz yo'q")
    await ctx.db.patch(me._id, { money: spend(me, a), loan: (me.loan ?? 0) - a })
  },
})

/** Zakat (2.5% of wealth above nisab) or a free-will sadaqa into the town's charity fund. */
export const giveCharity = mutation({
  args: { token: v.string(), kind: v.union(v.literal('zakat'), v.literal('sadaqa')), amount: v.optional(v.number()) },
  handler: async (ctx, { token, kind, amount }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const now = Date.now()
    const bank = await settleBank(ctx, me, townKey, now)
    const wealth = me.money + bank.bankBalance - (me.loan ?? 0)
    let give
    if (kind === 'zakat') {
      if (wealth < BANK.NISAB) throw new ConvexError(`Zakot nisobdan (${BANK.NISAB.toLocaleString('en-US')}$) ortiq boylikdan beriladi`)
      give = Math.floor(wealth * BANK.ZAKAT_RATE)
    } else {
      give = Math.floor(amount ?? 0)
      if (!(give > 0)) throw new ConvexError("Summa noto'g'ri")
    }
    if (me.money < give) throw new ConvexError('Naqd pulingiz yetmaydi')
    const fund = await getFund(ctx, townKey)
    await ctx.db.patch(fund._id, { balance: fund.balance + give, donors: fund.donors + 1 })
    await ctx.db.patch(me._id, { ...bank, money: me.money - give, zakatPaid: (me.zakatPaid ?? 0) + give })
    await syncRoster(ctx, me._id)
    return give
  },
})

/** The charity fund helps a player with almost no money and no plot, once a day. */
export const askHelp = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const now = Date.now()
    if (me.money >= BANK.HELP_POOR) throw new ConvexError("Yordam faqat puli juda kam o'yinchilarga beriladi")
    const myPlots = await ctx.db
      .query('townPlots')
      .withIndex('by_owner', (q) => q.eq('ownerId', me._id))
      .first()
    if (myPlots) throw new ConvexError('Hovlisi bor o\'yinchilar yordam olmaydi')
    if (now - (me.helpAt ?? 0) < BANK.HELP_COOLDOWN_MS) throw new ConvexError('Yordam kuniga bir marta beriladi')
    const fund = await getFund(ctx, townKey)
    const amount = Math.min(BANK.HELP_AMOUNT, fund.balance)
    if (amount <= 0) throw new ConvexError("Jamg'armada hozircha pul yo'q")
    await ctx.db.patch(fund._id, { balance: fund.balance - amount, given: fund.given + amount })
    await ctx.db.patch(me._id, { money: me.money + amount, helpAt: now })
    return amount
  },
})

/** Buy a boost in the choyxona / supermarket / restaurant. */
export const buyItem = mutation({
  args: { token: v.string(), item: v.string() },
  handler: async (ctx, { token, item }) => {
    const { me } = await requireMe(ctx, token)
    const it = SHOP_ITEMS[item]
    if (!it) throw new ConvexError('Bunday mahsulot yo\'q')
    const now = Date.now()
    const patch = { money: spend(me, it.price) }
    if (it.buff === 'scholar') patch.scholarUntil = Math.max(now, me.scholarUntil ?? 0) + it.minutes * 60_000
    if (it.buff === 'builder') {
      if ((me.builderKits ?? 0) >= 3) throw new ConvexError("Ko'pi bilan 3 ta to'plam saqlash mumkin")
      patch.builderKits = (me.builderKits ?? 0) + 1
    }
    await ctx.db.patch(me._id, patch)
  },
})

/* ------------------------------------------------------------------ market ----------- */

function checkPrice(price) {
  const p = Math.round(price)
  if (!(p >= MARKET.MIN_PRICE && p <= MARKET.MAX_PRICE)) throw new ConvexError(`Narx $${MARKET.MIN_PRICE.toLocaleString('en-US')} dan katta bo'lsin`)
  return p
}

/** Owner: list a plot (with whatever is built on it) for sale, or take it off (price null). */
export const listPlot = mutation({
  args: { token: v.string(), plotId: v.string(), price: v.union(v.number(), v.null()) },
  handler: async (ctx, { token, plotId, price }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const row = await requireMyPlot(ctx, me, townKey, plotId)
    if (row.dealId) throw new ConvexError("Bu hovli bo'yicha bitim ketyapti — avval uni bekor qiling")
    await ctx.db.patch(row._id, { salePrice: price === null ? undefined : checkPrice(price) })
  },
})

/* Buying from another player is not instant. Like a real purchase, the deal goes through
 * an hour of paperwork (documents → notary → bank → cadastre): the buyer's money is held by
 * the bank, the seller sees "your house is being sold" everywhere and can stop it ("this
 * wasn't me") — so a stranger in someone's account can't quietly sell their things. */

async function startDeal(ctx, { townKey, what, plotId, seller, buyer, price, label }) {
  const now = Date.now()
  const closesAt = now + DEAL.MS
  const dealId = await ctx.db.insert('townDeals', {
    townKey,
    what,
    ...(plotId ? { plotId } : {}),
    sellerId: seller._id,
    buyerId: buyer._id,
    price,
    label,
    status: 'pending',
    createdAt: now,
    closesAt,
  })
  await ctx.scheduler.runAt(closesAt, internal.town.finalizeDeal, { dealId })
  await notify(ctx, [seller.userId], {
    type: 'town_deal_started',
    title: `${label} sotilmoqda`,
    body: `@${buyer.nickname} ${formatPrice(price)} ga sotib olyapti. Bitim 1 soatdan keyin yakunlanadi. Buni siz qilmagan bo'lsangiz, shaharchada "Bekor qilish" ni bosing.`,
  })
  return dealId
}

function formatPrice(n) {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

export const buyListedPlot = mutation({
  args: { token: v.string(), plotId: v.string(), price: v.number() },
  handler: async (ctx, { token, plotId, price }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const row = await ctx.db
      .query('townPlots')
      .withIndex('by_town_plot', (q) => q.eq('townKey', townKey).eq('plotId', plotId))
      .first()
    if (!row || row.salePrice === undefined) throw new ConvexError('Bu hovli sotuvda emas')
    if (row.ownerId === me._id) throw new ConvexError("O'zingizning hovlingiz")
    if (row.dealId) throw new ConvexError('Bu hovlini boshqa xaridor sotib olyapti')
    // the price the buyer saw must still be the price — no surprise hikes
    if (row.salePrice !== price) throw new ConvexError("Narx o'zgardi — qaytadan ko'ring")
    const seller = await ctx.db.get(row.ownerId)
    if (!seller) throw new ConvexError('Sotuvchi topilmadi')
    await ctx.db.patch(me._id, { money: spend(me, row.salePrice) })
    const plot = PLOT_BY_ID[plotId]
    const k = BUILDING_KINDS[kindOf(row)]
    const dealId = await startDeal(ctx, {
      townKey,
      what: 'plot',
      plotId,
      seller,
      buyer: me,
      price: row.salePrice,
      label: `Hovli №${plot?.number}${row.floors ? ` (${k.name}, ${row.floors} qavat)` : ''}`,
    })
    await ctx.db.patch(row._id, { dealId })
    return dealId
  },
})

/** List your car for sale (price null = take it off the market). */
export const listCar = mutation({
  args: { token: v.string(), price: v.union(v.number(), v.null()) },
  handler: async (ctx, { token, price }) => {
    const { me } = await requireMe(ctx, token)
    if (!me.car) throw new ConvexError("Sizda mashina yo'q")
    if (me.carDealId) throw new ConvexError("Mashina bo'yicha bitim ketyapti — avval uni bekor qiling")
    await ctx.db.patch(me._id, { carSalePrice: price === null ? undefined : checkPrice(price) })
    await syncRoster(ctx, me._id)
  },
})

/** Buy another player's listed car — starts an hour-long deal (see `startDeal`). Your
 * current car (if any) goes to the dealer for half its showroom price when the deal closes. */
export const buyListedCar = mutation({
  args: { token: v.string(), sellerId: v.id('townPlayers'), price: v.number() },
  handler: async (ctx, { token, sellerId, price }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const seller = await ctx.db.get(sellerId)
    if (!seller || seller.townKey !== townKey || !seller.car || seller.carSalePrice === undefined) throw new ConvexError('Bu mashina sotuvda emas')
    if (seller._id === me._id) throw new ConvexError("O'zingizning mashinangiz")
    if (seller.carDealId) throw new ConvexError('Bu mashinani boshqa xaridor sotib olyapti')
    if (seller.carSalePrice !== price) throw new ConvexError("Narx o'zgardi — qaytadan ko'ring")
    const myPlots = await ctx.db
      .query('townPlots')
      .withIndex('by_owner', (q) => q.eq('ownerId', me._id))
      .first()
    if (!myPlots) throw new ConvexError("Mashina qo'yish uchun avval hovli sotib oling")
    await ctx.db.patch(me._id, { money: spend(me, seller.carSalePrice) })
    const dealId = await startDeal(ctx, {
      townKey,
      what: 'car',
      seller,
      buyer: me,
      price: seller.carSalePrice,
      label: CAR_MODELS.find((c) => c.id === seller.car.model)?.name ?? 'Mashina',
    })
    await ctx.db.patch(seller._id, { carDealId: dealId })
    return dealId
  },
})

/** Release whatever a deal locked (plot / car) and give the buyer's held money back. */
async function unwindDeal(ctx, deal, reason) {
  const buyer = await ctx.db.get(deal.buyerId)
  if (buyer) await ctx.db.patch(buyer._id, { money: buyer.money + deal.price })
  await releaseDealLock(ctx, deal)
  await ctx.db.patch(deal._id, { status: 'cancelled', closedAt: Date.now(), cancelReason: reason })
  return buyer
}

async function releaseDealLock(ctx, deal) {
  if (deal.what === 'plot') {
    const row = await ctx.db
      .query('townPlots')
      .withIndex('by_town_plot', (q) => q.eq('townKey', deal.townKey).eq('plotId', deal.plotId))
      .first()
    if (row?.dealId === deal._id) await ctx.db.patch(row._id, { dealId: undefined })
  } else {
    const seller = await ctx.db.get(deal.sellerId)
    if (seller?.carDealId === deal._id) await ctx.db.patch(seller._id, { carDealId: undefined })
  }
}

/** Seller: "this wasn't me" — stop a deal before it closes. The buyer gets the money back. */
export const cancelDeal = mutation({
  args: { token: v.string(), dealId: v.id('townDeals') },
  handler: async (ctx, { token, dealId }) => {
    const { me } = await requireMe(ctx, token)
    const deal = await ctx.db.get(dealId)
    if (!deal || deal.sellerId !== me._id) throw new ConvexError('Bitim topilmadi')
    if (deal.status !== 'pending') throw new ConvexError('Bitim allaqachon yakunlangan')
    // the seller also takes the item off the market, so the same thing can't restart at once
    if (deal.what === 'plot') {
      const row = await ctx.db
        .query('townPlots')
        .withIndex('by_town_plot', (q) => q.eq('townKey', deal.townKey).eq('plotId', deal.plotId))
        .first()
      if (row) await ctx.db.patch(row._id, { salePrice: undefined })
    } else {
      await ctx.db.patch(me._id, { carSalePrice: undefined })
      await syncRoster(ctx, me._id)
    }
    const buyer = await unwindDeal(ctx, deal, 'seller')
    if (buyer) {
      await notify(ctx, [buyer.userId], {
        type: 'town_deal_cancelled',
        title: 'Bitim bekor qilindi',
        body: `Egasi ${deal.label} sotuvini to'xtatdi. ${formatPrice(deal.price)} hisobingizga qaytarildi.`,
      })
    }
  },
})

/** Scheduled at `closesAt`: hand the property over, pay the seller, and open an insurance
 * claim if an insured plot went for less than its insured value. */
export const finalizeDeal = internalMutation({
  args: { dealId: v.id('townDeals') },
  handler: async (ctx, { dealId }) => {
    const deal = await ctx.db.get(dealId)
    if (!deal || deal.status !== 'pending') return
    const now = Date.now()
    const seller = await ctx.db.get(deal.sellerId)
    const buyer = await ctx.db.get(deal.buyerId)
    if (!seller || !buyer) {
      await unwindDeal(ctx, deal, 'missing')
      return
    }

    if (deal.what === 'plot') {
      const row = await ctx.db
        .query('townPlots')
        .withIndex('by_town_plot', (q) => q.eq('townKey', deal.townKey).eq('plotId', deal.plotId))
        .first()
      if (!row || row.ownerId !== seller._id || row.dealId !== deal._id) {
        await unwindDeal(ctx, deal, 'changed')
        return
      }
      await ctx.db.patch(row._id, {
        ownerId: buyer._id,
        salePrice: undefined,
        dealId: undefined,
        // the policy belonged to the seller; the new owner starts uninsured
        insuredValue: undefined,
        insuredAt: undefined,
        boughtAt: now,
        lastCollectAt: row.floors > 0 ? now : undefined,
      })
      if (row.insuredValue && deal.price < row.insuredValue) {
        const amount = row.insuredValue - deal.price
        await ctx.db.insert('townClaims', {
          townKey: deal.townKey,
          playerId: seller._id,
          dealId: deal._id,
          plotId: deal.plotId,
          label: deal.label,
          insuredValue: row.insuredValue,
          salePrice: deal.price,
          amount,
          buyerName: buyer.nickname,
          status: 'pending',
          createdAt: now,
        })
        await notify(ctx, [seller.userId], {
          type: 'insurance_claim',
          title: "Sug'urta da'vosi yuborildi",
          body: `${deal.label} sug'urta qiymatidan ${formatPrice(amount)} arzonga sotildi. Da'vo admin ko'rib chiqishiga yuborildi.`,
        })
        if (deal.townKey !== 'global') {
          await notify(ctx, await getOrderHandlerIds(ctx, null, deal.townKey), {
            type: 'insurance_claim',
            title: "Yangi sug'urta da'vosi",
            body: `@${seller.nickname}: ${deal.label} — ${formatPrice(amount)} zarar. Shaharcha → Sug'urta bo'limida ko'rib chiqing.`,
          })
        }
      }
    } else {
      if (!seller.car || seller.carDealId !== deal._id) {
        await unwindDeal(ctx, deal, 'changed')
        return
      }
      const tradeIn = buyer.car ? Math.round((CAR_MODELS.find((c) => c.id === buyer.car.model)?.price ?? 0) / 2) : 0
      await ctx.db.patch(buyer._id, { money: buyer.money + tradeIn, car: seller.car, carSalePrice: undefined, carCollectAt: now })
      await ctx.db.patch(seller._id, { car: undefined, carSalePrice: undefined, carDealId: undefined })
    }

    const sellerNow = await ctx.db.get(seller._id)
    await ctx.db.patch(seller._id, { money: sellerNow.money + deal.price })
    await ctx.db.patch(deal._id, { status: 'done', closedAt: now })
    await ctx.db.insert('townSales', {
      townKey: deal.townKey,
      sellerId: seller._id,
      buyerId: buyer._id,
      what: deal.what,
      ...(deal.plotId ? { plotId: deal.plotId } : {}),
      label: deal.label,
      price: deal.price,
      at: now,
    })
    await syncRoster(ctx, seller._id)
    await syncRoster(ctx, buyer._id)
    await notify(ctx, [seller.userId], {
      type: 'town_deal_done',
      title: 'Bitim yakunlandi',
      body: `${deal.label} @${buyer.nickname} ga ${formatPrice(deal.price)} ga sotildi. Pul hisobingizda.`,
    })
    await notify(ctx, [buyer.userId], {
      type: 'town_deal_done',
      title: 'Xarid rasmiylashtirildi',
      body: `${deal.label} endi sizniki!`,
    })
  },
})

/** The caller's open deals (as seller or buyer) — small, for the "being sold" banner that
 * shows on every page. */
export const myDeals = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const scope = await getScope(ctx, token)
    if (scope.platformAdmin) return []
    const me = await findMe(ctx, scope.session.userId)
    if (!me) return []
    const selling = await ctx.db
      .query('townDeals')
      .withIndex('by_seller_status', (q) => q.eq('sellerId', me._id).eq('status', 'pending'))
      .collect()
    const buying = await ctx.db
      .query('townDeals')
      .withIndex('by_buyer_status', (q) => q.eq('buyerId', me._id).eq('status', 'pending'))
      .collect()
    const nameOf = async (playerId) =>
      (
        await ctx.db
          .query('townRoster')
          .withIndex('by_player', (q) => q.eq('playerId', playerId))
          .unique()
      )?.nickname ?? '?'
    const out = []
    for (const d of selling) out.push({ id: d._id, role: 'seller', label: d.label, price: d.price, createdAt: d.createdAt, closesAt: d.closesAt, other: await nameOf(d.buyerId) })
    for (const d of buying) out.push({ id: d._id, role: 'buyer', label: d.label, price: d.price, createdAt: d.createdAt, closesAt: d.closesAt, other: await nameOf(d.sellerId) })
    return out
  },
})

/* ------------------------------------------------------------------ insurance -------- */

/** Insure an owned plot at its current estimated value (or top up cover after building).
 * One-time premium of 5% goes to the town's insurance company. */
export const insurePlot = mutation({
  args: { token: v.string(), plotId: v.string() },
  handler: async (ctx, { token, plotId }) => {
    const { me, townKey } = await requireMe(ctx, token)
    const row = await requireMyPlot(ctx, me, townKey, plotId)
    if (row.dealId) throw new ConvexError('Bitim jarayonidagi hovlini sug\'urtalab bo\'lmaydi')
    const value = estimateValue(PLOT_BY_ID[plotId], row)
    const premium = insurancePremium(value, row.insuredValue ?? 0)
    if (premium <= 0) throw new ConvexError("Hovli allaqachon to'liq qiymatiga sug'urtalangan")
    await ctx.db.patch(me._id, { money: spend(me, premium) })
    await ctx.db.patch(row._id, { insuredValue: value, insuredAt: Date.now() })
    const fund = await getFund(ctx, townKey)
    await ctx.db.patch(fund._id, {
      insurancePool: (fund.insurancePool ?? 0) + premium,
      insurancePremiums: (fund.insurancePremiums ?? 0) + premium,
    })
    return { value, premium }
  },
})

async function requireTownAdmin(ctx, token) {
  const scope = await getScope(ctx, token)
  if (scope.platformAdmin || scope.session.role !== 'teacher' || !scope.all) {
    throw new ConvexError("Faqat markaz administratori uchun")
  }
  return { scope, townKey: String(scope.centerId) }
}

/** Admin: insurance claims of the center's town, plus the insurance company's books. */
export const listClaims = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const { townKey } = await requireTownAdmin(ctx, token)
    const claims = []
    for (const status of ['pending', 'approved', 'rejected']) {
      const rows = await ctx.db
        .query('townClaims')
        .withIndex('by_town_status', (q) => q.eq('townKey', townKey).eq('status', status))
        .order('desc')
        .take(status === 'pending' ? 200 : 50)
      claims.push(...rows)
    }
    const out = []
    for (const c of claims) {
      const player = await ctx.db.get(c.playerId)
      const decider = c.decidedBy ? await ctx.db.get(c.decidedBy) : null
      let ownerName = null
      if (player) {
        const user = await ctx.db.get(player.userId)
        ownerName = user?.fullName ?? null
      }
      out.push({
        ...c,
        nickname: player?.nickname ?? '?',
        ownerName,
        decidedByName: decider?.fullName ?? null,
      })
    }
    const fund = await ctx.db
      .query('townFunds')
      .withIndex('by_town', (q) => q.eq('townKey', townKey))
      .first()
    return {
      claims: out.sort((a, b) => b.createdAt - a.createdAt),
      company: {
        pool: fund?.insurancePool ?? 0,
        premiums: fund?.insurancePremiums ?? 0,
        paid: fund?.insurancePaid ?? 0,
        subsidy: fund?.insuranceSubsidy ?? 0,
      },
    }
  },
})

/** Admin: approve (the insurance company pays the loss) or reject a claim. */
export const decideClaim = mutation({
  args: { token: v.string(), claimId: v.id('townClaims'), approve: v.boolean(), note: v.optional(v.string()) },
  handler: async (ctx, { token, claimId, approve, note }) => {
    const { scope, townKey } = await requireTownAdmin(ctx, token)
    const claim = await ctx.db.get(claimId)
    if (!claim || claim.townKey !== townKey) throw new ConvexError("Da'vo topilmadi")
    if (claim.status !== 'pending') throw new ConvexError("Da'vo allaqachon ko'rib chiqilgan")
    const cleanNote = note?.trim().slice(0, 300) || undefined
    const player = await ctx.db.get(claim.playerId)

    if (approve) {
      const fund = await getFund(ctx, townKey)
      const pool = fund.insurancePool ?? 0
      const fromPool = Math.min(pool, claim.amount)
      await ctx.db.patch(fund._id, {
        insurancePool: pool - fromPool,
        insurancePaid: (fund.insurancePaid ?? 0) + claim.amount,
        // when the premiums don't cover it, the town tops the company up
        insuranceSubsidy: (fund.insuranceSubsidy ?? 0) + (claim.amount - fromPool),
      })
      if (player) await ctx.db.patch(player._id, { money: player.money + claim.amount })
    }
    await ctx.db.patch(claim._id, {
      status: approve ? 'approved' : 'rejected',
      decidedAt: Date.now(),
      decidedBy: scope.session.userId,
      note: cleanNote,
    })
    if (player) {
      await notify(ctx, [player.userId], approve
        ? { type: 'insurance_paid', title: "Sug'urta to'landi", body: `${claim.label} bo'yicha ${formatPrice(claim.amount)} hisobingizga o'tkazildi.` }
        : { type: 'insurance_rejected', title: "Sug'urta da'vosi rad etildi", body: `${claim.label}${cleanNote ? `: ${cleanNote}` : ''}` })
    }
  },
})

/** Admin sidebar badge: just the number of open claims (reads nothing else, so it stays
 * cheap while subscribed on every page). */
export const pendingClaimCount = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const scope = await getScope(ctx, token)
    if (scope.platformAdmin || scope.session.role !== 'teacher' || !scope.all) return 0
    const rows = await ctx.db
      .query('townClaims')
      .withIndex('by_town_status', (q) => q.eq('townKey', String(scope.centerId)).eq('status', 'pending'))
      .collect()
    return rows.length
  },
})

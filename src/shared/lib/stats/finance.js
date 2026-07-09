import { TRANSACTION_TYPES } from '@/shared/config/constants'
import { getIsoWeekKey, formatUzDate, formatUzMonthYear } from '@/shared/lib/date'

function isSameDay(isoString, reference) {
  const d = new Date(isoString)
  return d.getFullYear() === reference.getFullYear() && d.getMonth() === reference.getMonth() && d.getDate() === reference.getDate()
}

function isSameMonth(isoString, reference) {
  const d = new Date(isoString)
  return d.getFullYear() === reference.getFullYear() && d.getMonth() === reference.getMonth()
}

function sumCoinsByPeriod(transactions, type) {
  const now = new Date()
  const thisWeekKey = getIsoWeekKey(now.toISOString())
  const filtered = transactions.filter((t) => t.type === type)

  return {
    today: filtered.filter((t) => isSameDay(t.timestamp, now)).reduce((sum, t) => sum + t.amount, 0),
    thisWeek: filtered.filter((t) => getIsoWeekKey(t.timestamp) === thisWeekKey).reduce((sum, t) => sum + t.amount, 0),
    thisMonth: filtered.filter((t) => isSameMonth(t.timestamp, now)).reduce((sum, t) => sum + t.amount, 0),
    total: filtered.reduce((sum, t) => sum + t.amount, 0),
  }
}

function toMoney(coinsByPeriod, rate) {
  return Object.fromEntries(Object.entries(coinsByPeriod).map(([period, coins]) => [period, coins * rate]))
}

/**
 * Coin-to-money breakdown for the teacher finance dashboard.
 * `coinsGiven` / `moneyGiven` = value of coins awarded to students (potential liability).
 * `coinsRedeemed` / `moneySpent` = value of coins actually cashed in for gifts (real cost).
 * `outstandingMoney` = given minus spent — the money-equivalent value students are still holding.
 */
export function getFinanceOverview(transactions, rate) {
  const coinsGiven = sumCoinsByPeriod(transactions, TRANSACTION_TYPES.COIN_GIVEN)
  const coinsRedeemed = sumCoinsByPeriod(transactions, TRANSACTION_TYPES.GIFT_REDEEMED)
  const moneyGiven = toMoney(coinsGiven, rate)
  const moneySpent = toMoney(coinsRedeemed, rate)

  return {
    rate,
    coinsGiven,
    coinsRedeemed,
    moneyGiven,
    moneySpent,
    outstandingMoney: moneyGiven.total - moneySpent.total,
  }
}

function dayBucket(isoString) {
  const d = new Date(isoString)
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { key, label: formatUzDate(isoString).split(',')[0] }
}

function weekBucket(isoString) {
  const key = getIsoWeekKey(isoString)
  return { key, label: `${Number(key.split('-W')[1])}-hafta` }
}

function monthBucket(isoString) {
  const d = new Date(isoString)
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return { key, label: formatUzMonthYear(d.getFullYear(), d.getMonth()) }
}

const TREND_BUCKETERS = { day: dayBucket, week: weekBucket, month: monthBucket }

/**
 * Chronological given-vs-spent money trend for the finance dashboard's line chart.
 * `granularity` picks the bucket size: 'day' | 'week' | 'month'.
 */
export function getFinanceTrend(transactions, rate, granularity = 'day') {
  const bucketOf = TREND_BUCKETERS[granularity] ?? dayBucket
  const buckets = new Map()

  transactions.forEach((t) => {
    const { key, label } = bucketOf(t.timestamp)
    if (!buckets.has(key)) buckets.set(key, { key, label, coinsGiven: 0, coinsRedeemed: 0 })
    const bucket = buckets.get(key)
    if (t.type === TRANSACTION_TYPES.COIN_GIVEN) bucket.coinsGiven += t.amount
    else bucket.coinsRedeemed += t.amount
  })

  return [...buckets.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((b) => ({ label: b.label, given: b.coinsGiven * rate, spent: b.coinsRedeemed * rate }))
}

import { MONTHLY_GOAL } from '@/shared/config/constants'
import { formatUzMonthYear } from '@/shared/lib/date'

export function formatMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return formatUzMonthYear(year, month - 1)
}

const MESSAGES = {
  empty: ["Bu oy hali dars bo'lmadi. Birinchi darsdanoq kuchli boshlang! 🚀"],
  star: [
    'Ajoyib natija! Siz bu oyning yulduzisiz ⭐ Shu sur\'atda davom eting!',
    "Zo'r ketyapsiz! Bunday mehnat albatta o'z mevasini beradi 🏆",
    "Qoyil! Siz guruhga o'rnak bo'lyapsiz — to'xtamang! 🔥",
  ],
  reached: [
    "Barakalla! Maqsadga yetdingiz — bu oygi coinlaringiz xavfsiz ✅ Endi yanada yuqoriga!",
    'Siz 70% chegarasidan o\'tdingiz 💪 Har bir dars — yangi rekord uchun imkoniyat!',
  ],
  close: [
    "Maqsadga juda yaqinsiz! Yana {n} coin — va bu oygi coinlaringiz saqlanib qoladi 🔥",
    'Ozgina qoldi! Keyingi darsda uy vazifasini to\'liq bajaring — {n} coin yetishmayapti 💡',
  ],
  behind: [
    'Hali kech emas! Uy vazifalarini to\'liq bajaring, darsda faol bo\'ling — yana {n} coin kerak 💪',
    "Har bir dars — yangi imkoniyat. Savollarga javob bering, faol bo'ling: {n} coin yig'sangiz bas! 🚀",
    "Siz bunga qodirsiz! Maqsadgacha {n} coin qoldi — bugundan boshlang 🌱",
  ],
}

/** Motivational line for a student's current-month progress. The variant rotates daily (not
 * per render) so the text doesn't flicker while the page is open. */
export function getGoalMessage(progress, now = new Date()) {
  let tier = 'behind'
  if (!progress || progress.possible === 0) tier = 'empty'
  else if (progress.percent >= 90) tier = 'star'
  else if (progress.reached) tier = 'reached'
  else if (progress.percent >= MONTHLY_GOAL.PERCENT - 15) tier = 'close'

  const pool = MESSAGES[tier]
  const text = pool[now.getDate() % pool.length]
  return { tier, text: text.replace('{n}', progress?.coinsToGoal ?? 0) }
}

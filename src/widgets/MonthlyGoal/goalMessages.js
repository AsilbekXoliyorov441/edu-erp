import { MONTHLY_GOAL } from '@/shared/config/constants'

export { formatMonthKey } from '@/shared/lib/date'

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
  ontrack: [
    "Zo'r sur'at! Shu tarzda davom etsangiz, oy oxirida maqsadga albatta yetasiz 💪 Yana {n} coin, {r} ta dars qoldi.",
    "Yaxshi ketyapsiz! Har darsda shunday harakat qiling — maqsadgacha {n} coin qoldi 🚀",
  ],
  close: [
    "Maqsad qo'l yetadigan joyda! Qolgan {r} ta darsda {n} coin yig'ing — bu oygi coinlaringiz saqlanadi 🔥",
    "Ozgina tezlashing! Uy vazifasini to'liq bajaring — {r} ta darsda {n} coin kerak 💡",
  ],
  behind: [
    "Hali kech emas! Qolgan {r} ta darsda faol bo'ling — yana {n} coin kerak 💪",
    "Har bir dars — yangi imkoniyat. Savollarga javob bering, uy vazifasini qiling: {n} coin yig'sangiz bas! 🚀",
    "Siz bunga qodirsiz! Maqsadgacha {n} coin qoldi — bugundan boshlang 🌱",
  ],
  half: [
    "70% ga yetish qiyin bo'ldi, lekin taslim bo'lmang! {MONTHLY_HALF}% dan oshirsangiz, coinlaringizning yarmi saqlanadi — yana {h} coin 💪",
    "Har bir coin muhim! Yana {h} coin yig'sangiz, bu oygi coinlaringizning yarmi sizda qoladi 🔥",
  ],
  halfSafe: [
    "Coinlaringizning yarmi allaqachon xavfsiz 👍 70% ga yetish uchun yana {n} coin — shunda hammasi saqlanadi!",
    "Yaxshi! 50% chegarasidan o'tdingiz. Endi 70% sari — yana {n} coin va bu oygi hamma coinlaringiz sizniki 🚀",
  ],
  lost: [
    "Bu oy maqsadga yetishning imkoni qolmadi 😔 Lekin har bir dars tajriba — keyingi oyni kuchli boshlaymiz!",
  ],
}

/** Motivational line for a student's current-month progress. The variant rotates daily (not
 * per render) so the text doesn't flicker while the page is open. */
export function getGoalMessage(progress, now = new Date()) {
  let tier = 'behind'
  if (!progress || progress.possible === 0) tier = 'empty'
  else if (progress.reached) tier = progress.percent >= 90 ? 'star' : 'reached'
  else if (progress.goalUnreachable) tier = progress.halfReached ? 'halfSafe' : progress.halfUnreachable ? 'lost' : 'half'
  else if (progress.pacePercent >= MONTHLY_GOAL.PERCENT) tier = 'ontrack'
  else if (progress.pacePercent >= MONTHLY_GOAL.PERCENT - 15) tier = 'close'

  const pool = MESSAGES[tier]
  const text = pool[now.getDate() % pool.length]
  return {
    tier,
    text: text
      .replace('{n}', progress?.coinsToGoal ?? 0)
      .replace('{r}', progress?.remainingLessons ?? 0)
      .replace('{h}', progress?.coinsToHalf ?? 0)
      .replace('{MONTHLY_HALF}', MONTHLY_GOAL.HALF_PERCENT),
  }
}

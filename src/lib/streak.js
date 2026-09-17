export const POINTS = { practiced: 1, usedForReal: 5 }

const pad = (n) => String(n).padStart(2, '0')

// Local calendar day, e.g. "2026-09-17".
export const dayKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const yesterdayKey = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dayKey(d)
}

// The streak to show: it only counts if the last practice was today or yesterday.
export function currentStreak(kid) {
  const last = kid?.lastPracticeDate
  return last === dayKey() || last === yesterdayKey() ? kid.streak || 0 : 0
}

// Fields to write on the kid after a practice, or null if today already counted.
export function streakPatch(kid) {
  const today = dayKey()
  if (kid.lastPracticeDate === today) return null
  const streak = kid.lastPracticeDate === yesterdayKey() ? (kid.streak || 0) + 1 : 1
  return { streak, lastPracticeDate: today }
}

// Grown-ups gate. Kids know the family code, so settings ask for math built on it:
// "(family code × 37) + 58, type the last 2 digits". The numbers change every time,
// so a watched answer can't be reused, and three misses lock the pad for a minute
// so nobody can just try all 100 answers.

const PROBLEM_KEY = 'bravecards.gateProblem' // sessionStorage: survives a reload while in the calculator app
const MISSES_KEY = 'bravecards.gateMisses' // localStorage: a reload doesn't reset the lockout
const MAX_MISSES = 3
export const LOCK_SECONDS = 60

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1))

function makeProblem() {
  let times
  do {
    times = randomInt(13, 97)
  } while (times % 10 === 0) // ×20, ×30… are too easy
  return { times, plus: randomInt(11, 99) }
}

const isProblem = (p) =>
  Number.isInteger(p?.times) && p.times >= 13 && p.times <= 97 && Number.isInteger(p?.plus) && p.plus >= 11 && p.plus <= 99

function saveProblem(problem) {
  try {
    sessionStorage.setItem(PROBLEM_KEY, JSON.stringify(problem))
  } catch {
    // Storage blocked: the problem just won't survive a reload.
  }
  return problem
}

export function loadProblem() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PROBLEM_KEY))
    if (isProblem(saved)) return saved
  } catch {
    // Nothing saved or junk: make a new one.
  }
  return saveProblem(makeProblem())
}

export const nextProblem = () => saveProblem(makeProblem())

// The two characters to type: last two digits of (code × times) + plus, e.g. "07".
export function expectedDigits(familyCode, { times, plus }) {
  return String((Number(familyCode) * times + plus) % 100).padStart(2, '0')
}

// ---- Misses and lockout ----

function readMisses() {
  try {
    const saved = JSON.parse(localStorage.getItem(MISSES_KEY))
    return { count: Number(saved?.count) || 0, lockedUntil: Number(saved?.lockedUntil) || 0 }
  } catch {
    return { count: 0, lockedUntil: 0 }
  }
}

function writeMisses(misses) {
  try {
    if (misses) localStorage.setItem(MISSES_KEY, JSON.stringify(misses))
    else localStorage.removeItem(MISSES_KEY)
  } catch {
    // Storage blocked: lockout only lasts while the page is open.
  }
}

// Seconds left in a lockout (0 when unlocked). A lockout far in the future means the
// clock changed, so it's ignored rather than locking settings for hours.
export function lockoutSeconds() {
  const left = Math.ceil((readMisses().lockedUntil - Date.now()) / 1000)
  return left > 0 && left <= LOCK_SECONDS ? left : 0
}

// Returns the seconds of lockout now in effect (0 if none). A miss during a running
// lockout (say, from a second tab) keeps that lockout instead of resetting it.
export function recordMiss() {
  const running = lockoutSeconds()
  if (running) return running
  const count = readMisses().count + 1
  if (count >= MAX_MISSES) {
    writeMisses({ count: 0, lockedUntil: Date.now() + LOCK_SECONDS * 1000 })
    return LOCK_SECONDS
  }
  writeMisses({ count, lockedUntil: 0 })
  return 0
}

// Solved: clear misses and retire the problem so the next visit gets new numbers.
export function recordSolved() {
  writeMisses(null)
  try {
    sessionStorage.removeItem(PROBLEM_KEY)
  } catch {
    // Storage blocked: nothing to clear.
  }
}

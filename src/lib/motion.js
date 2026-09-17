export const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// Haptic tap on phones that support it (Android Chrome); silently ignored elsewhere.
export function buzz(pattern) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Not supported.
  }
}

export function shuffle(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

import { useEffect, useRef, useState } from 'react'
import { buzz } from '../lib/motion'
import Logo from './Logo'

export const MIN_CODE = 4
// 7 max: (code × 97) + 99 then stays within 9 digits, which basic phone calculators can show in full.
export const MAX_CODE = 7

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'go']

// Full-screen number pad. onSubmit(digits) returns true on success or an error message.
// With `length`, it takes exactly that many digits and submits on the last one (no Go key).
// `children` renders between the heading and the dots; `disabled` freezes the keys.
export default function CodePad({
  title,
  subtitle,
  onSubmit,
  onCancel,
  length,
  disabled = false,
  showLogo = false,
  children,
  footer,
}) {
  const [digits, setDigits] = useState('')
  const [shakes, setShakes] = useState(0)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  // The ref is the source of truth so fast typing never reads a stale render.
  const entered = useRef('')
  const mounted = useRef(true)
  const [wasDisabled, setWasDisabled] = useState(disabled)
  const minLength = length ?? MIN_CODE
  const maxLength = length ?? MAX_CODE
  const locked = busy || disabled
  // With children (like the math problem) the screen is taller, so tighten it to keep the keypad on screen.
  const compact = Boolean(children)

  // When the pad unlocks again, clear the message that explained why it was locked.
  if (wasDisabled !== disabled) {
    setWasDisabled(disabled)
    if (!disabled) setError(null)
  }

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const setEntered = (value) => {
    entered.current = value
    setDigits(value)
  }

  const submit = async () => {
    const code = entered.current
    if (code.length < minLength || busy) return
    setBusy(true)
    const result = await onSubmit(code)
    if (!mounted.current || result === true) return
    setBusy(false)
    buzz([60, 40, 60])
    setError(result)
    setShakes((s) => s + 1)
    setEntered('')
  }

  const press = (key) => {
    if (locked) return
    if (key === 'go') return submit()
    setError(null)
    const current = entered.current
    if (key === 'back') return setEntered(current.slice(0, -1))
    if (current.length >= maxLength) return
    buzz(8)
    const next = current + key
    setEntered(next)
    if (length && next.length === length) submit()
  }

  // Physical keyboard, for laptops.
  useEffect(() => {
    const onKey = (e) => {
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('back')
      else if (e.key === 'Enter') press('go')
      else if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sky">
      <div
        className={`mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center px-6 ${compact ? 'gap-3 py-4' : 'gap-5 py-8'}`}
      >
        {showLogo && <Logo />}
        <div className="text-center">
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="mt-1 text-ink-soft">{subtitle}</p>
        </div>

        {children}

        <div key={shakes} className={`flex h-10 items-center gap-3 ${shakes ? 'shake' : ''}`}>
          {Array.from({ length: Math.max(minLength, digits.length) }, (_, i) => (
            <span
              key={i}
              className={`h-5 w-5 rounded-full border-[3px] border-ink transition-colors ${i < digits.length ? 'bg-ink' : 'bg-white'}`}
            />
          ))}
        </div>
        <p className="-mt-3 min-h-6 text-center font-bold text-rose-600" aria-live="polite">
          {error}
        </p>

        <div className="grid w-full max-w-[300px] grid-cols-3 gap-3">
          {KEYS.map((key) => {
            const isGo = key === 'go'
            if (isGo && length) return <span key={key} />
            return (
              <button
                key={key}
                type="button"
                onClick={() => press(key)}
                disabled={locked || (isGo && digits.length < minLength)}
                aria-label={key === 'back' ? 'Delete' : isGo ? 'Go' : key}
                className={`btn3d ${compact ? 'h-[60px]' : 'h-[68px]'} ${isGo ? 'text-2xl' : 'text-3xl'}`}
                style={isGo ? { '--c': '#1fbf6a' } : undefined}
              >
                {key === 'back' ? '⌫' : isGo ? (busy ? '…' : 'Go') : key}
              </button>
            )
          })}
        </div>

        {onCancel && (
          <button type="button" onClick={onCancel} className="min-h-11 px-4 font-bold text-ink-soft">
            Cancel
          </button>
        )}
        {footer}
      </div>
    </div>
  )
}

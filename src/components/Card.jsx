import { useEffect, useRef, useState } from 'react'
import { buzz, prefersReducedMotion } from '../lib/motion'

const SWIPE_DISTANCE = 90 // px past which a release moves to the next or previous card
const FLING_SPEED = 0.6 // px/ms: a quick flick counts even if shorter
const LONG_PRESS_MS = 550
const EXIT_MS = 280

const REST = { x: 0, y: 0, active: false }

export default function Card({
  card,
  category,
  stats,
  customLine,
  mission,
  liked,
  practiced,
  atStart,
  enterFrom,
  flipped,
  exit,
  onFlip,
  onSwipe,
  onExited,
  onEdit,
  onLike,
  onBury,
}) {
  const [drag, setDrag] = useState(REST)
  const gesture = useRef(null)
  const exitedRef = useRef(onExited)

  useEffect(() => {
    exitedRef.current = onExited
  })

  // Let the fly-off play, then tell the deck to move on.
  useEffect(() => {
    if (!exit) return
    const timer = setTimeout(() => exitedRef.current(), prefersReducedMotion() ? 0 : EXIT_MS)
    return () => clearTimeout(timer)
  }, [exit])

  useEffect(() => () => clearTimeout(gesture.current?.timer), [])

  const onPointerDown = (e) => {
    if (exit || e.button > 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const g = { x0: e.clientX, y0: e.clientY, lastX: e.clientX, lastT: e.timeStamp, vx: 0, moved: false, longPressed: false }
    if (flipped) {
      g.timer = setTimeout(() => {
        g.longPressed = true
        buzz(20)
        onEdit()
      }, LONG_PRESS_MS)
    }
    gesture.current = g
  }

  const onPointerMove = (e) => {
    const g = gesture.current
    if (!g || g.longPressed) return
    const x = e.clientX - g.x0
    const y = e.clientY - g.y0
    if (!g.moved) {
      if (Math.hypot(x, y) < 8) return
      g.moved = true
      clearTimeout(g.timer)
    }
    const dt = e.timeStamp - g.lastT
    if (dt > 0) g.vx = (e.clientX - g.lastX) / dt
    g.lastX = e.clientX
    g.lastT = e.timeStamp
    setDrag({ x, y, active: true })
  }

  const onPointerUp = (e) => {
    const g = gesture.current
    gesture.current = null
    if (!g) return
    clearTimeout(g.timer)
    if (g.longPressed) return
    if (!g.moved) {
      onFlip()
      return
    }
    const x = e.clientX - g.x0
    const vx = e.timeStamp - g.lastT > 100 ? 0 : g.vx // finger paused before lifting: no fling
    const flung = Math.abs(vx) > FLING_SPEED && Math.sign(vx) === Math.sign(x) && Math.abs(x) > 40
    if (Math.abs(x) > SWIPE_DISTANCE || flung) {
      setDrag((d) => ({ ...d, active: false }))
      onSwipe(x > 0 ? 'right' : 'left')
    } else {
      setDrag(REST) // spring back
    }
  }

  const onPointerCancel = () => {
    clearTimeout(gesture.current?.timer)
    gesture.current = null
    setDrag(REST)
  }

  const onKeyDown = (e) => {
    if (e.target !== e.currentTarget) return // Enter on 👎 or ✏️ presses that button, not a flip
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onFlip()
    }
  }

  let transform
  let transition
  if (exit === 'down') {
    // Thumbs down: the card drops away instead of swiping.
    transform = `translate(0px, ${window.innerHeight}px) rotate(8deg) scale(0.9)`
    transition = `transform ${EXIT_MS + 60}ms cubic-bezier(0.45, 0, 0.9, 0.55)`
  } else if (exit) {
    const dir = exit === 'right' ? 1 : -1
    transform = `translate(${dir * (window.innerWidth + 200)}px, ${drag.y * 0.25 - 40}px) rotate(${dir * 28}deg)`
    transition = `transform ${EXIT_MS}ms cubic-bezier(0.45, 0, 0.9, 0.55)`
  } else if (drag.active) {
    const x = atStart && drag.x > 0 ? drag.x * 0.35 : drag.x // nothing before the first card
    const tilt = Math.max(-18, Math.min(18, x * 0.06))
    transform = `translate(${x}px, ${drag.y * 0.25}px) rotate(${tilt}deg)`
    transition = 'none'
  } else {
    transform = 'translate(0px, 0px) rotate(0deg)'
    transition = 'transform 520ms cubic-bezier(0.34, 1.7, 0.5, 1)'
  }

  const line = customLine || card.line
  const enterClass = enterFrom === 'right' ? 'card-in-right' : enterFrom === 'left' ? 'card-in-left' : 'card-enter'

  // Small round buttons on the card. They stop the press from starting a drag, flip, or long-press.
  // pressed: undefined for plain buttons, true/false for toggles like 👍.
  const iconButton = (face, label, icon, onClick, pressed) => (
    <button
      type="button"
      tabIndex={(face === 'back') === flipped ? 0 : -1}
      aria-label={label}
      aria-pressed={pressed}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-ink shadow-[0_2px_0_rgb(22_24_58/0.12)] transition-transform active:scale-90 ${pressed ? 'bg-gold ring-2 ring-ink' : 'bg-white/85'}`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {icon}
    </button>
  )

  return (
    <div className={`${enterClass} absolute inset-0`}>
      <div
        role="button"
        tabIndex={0}
        aria-label={flipped ? `${line}. Tap to flip back.` : `${card.situation}. Tap to see what to say.`}
        className="relative h-full w-full touch-none select-none [-webkit-touch-callout:none]"
        style={{ transform, transition, perspective: '1400px' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={onKeyDown}
      >
        <div className={`flipper ${flipped ? 'is-flipped' : ''}`}>
          <div className="face flex flex-col bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap gap-1.5">
                <span
                  className="truncate rounded-full px-3 py-1.5 text-sm font-bold"
                  style={{ background: category.color, color: category.text }}
                >
                  {category.emoji} {category.name}
                </span>
                {(mission || card.custom) && (
                  <span className="rounded-full bg-sky px-3 py-1.5 text-sm font-bold text-ink">
                    {mission ? '🎯 Mission' : '🏠 Family card'}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {iconButton('front', 'I like this card', '👍', onLike, Boolean(liked))}
                {iconButton('front', 'Bury this card', '👎', onBury)}
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <p className="text-sm font-bold tracking-widest text-ink-soft uppercase">When…</p>
              <p className="mt-2 font-display text-[34px] leading-[1.08]">{card.situation}</p>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-ink-soft">
              <span>{practiced ? '✓ Practiced just now' : 'Tap to flip'}</span>
              <span>
                Practiced {stats.practiced || 0} · Real {stats.usedForReal || 0}
              </span>
            </div>
          </div>

          <div className="face face-back flex flex-col p-5" style={{ background: category.color, color: category.text }}>
            <div className="flex items-start justify-between gap-2">
              <p className="pt-2 text-sm font-bold tracking-widest uppercase opacity-85">
                {customLine ? 'In your words' : 'Try this'}
              </p>
              <div className="flex gap-2">
                {iconButton('back', 'I like this card', '👍', onLike, Boolean(liked))}
                {iconButton('back', 'Bury this card', '👎', onBury)}
                {iconButton('back', 'Write it your way', '✏️', onEdit)}
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-4">
              <p className={`font-display leading-[1.1] ${line.length > 60 ? 'text-[26px]' : 'text-[32px]'}`}>{line}</p>
              {card.followUp && (
                <div>
                  <p className="text-sm font-bold tracking-widest uppercase opacity-85">Then</p>
                  <p className="mt-1 font-display text-2xl leading-tight">{card.followUp}</p>
                </div>
              )}
            </div>
            {card.tip && (
              <p className="rounded-2xl bg-white/90 px-3 py-2.5 text-[15px] font-medium text-ink">
                <span aria-hidden="true">💡 </span>
                {card.tip}
              </p>
            )}
            <p className="mt-3 text-center text-xs font-bold opacity-80">Hold the card to say it your way</p>
          </div>
        </div>

        <span
          className="stamp left-1/2 -translate-x-1/2 -rotate-6 text-rose-600"
          style={{ opacity: exit === 'down' ? 1 : 0 }}
          aria-hidden="true"
        >
          👎 Buried
        </span>
      </div>
    </div>
  )
}

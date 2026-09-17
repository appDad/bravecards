import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'

// Star + number that ticks up and pulses when points go up.
export default function PointsCounter({ value = 0, className = '' }) {
  const [shown, setShown] = useState(value)
  const [pulses, setPulses] = useState(0)
  const previous = useRef(value)

  useEffect(() => {
    const from = previous.current
    previous.current = value
    if (value === from) return
    if (value < from || prefersReducedMotion()) {
      setShown(value)
      return
    }

    setPulses((n) => n + 1)
    const start = performance.now()
    const duration = Math.min(900, 260 + (value - from) * 90)
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      setShown(Math.round(from + (value - from) * (1 - (1 - t) ** 3)))
      if (t < 1) frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [value])

  return (
    <span key={pulses} className={`pill ${pulses ? 'pulse-pop' : ''} ${className}`} aria-label={`${value} points`}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9z"
          fill="#ffc833"
          stroke="#16183a"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      <span className="tabular-nums">{shown}</span>
    </span>
  )
}

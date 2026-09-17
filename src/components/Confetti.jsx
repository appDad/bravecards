import { useEffect, useRef, useState } from 'react'

const COLORS = ['#ff5fa2', '#2f6bff', '#1fbf6a', '#ffc833', '#7b4dff', '#16c6d9', '#ff7a1a']
const COUNT = 30

function makePieces() {
  return Array.from({ length: COUNT }, (_, i) => {
    const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.5
    const distance = 110 + Math.random() * 140
    const size = 8 + Math.random() * 7
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 70,
      spin: Math.random() * 900 - 450,
      color: COLORS[i % COLORS.length],
      size,
      round: i % 3 === 0,
      delay: Math.random() * 90,
    }
  })
}

// A one-shot burst: plain divs with CSS keyframes. Mount with a new key to fire again.
export default function Confetti({ points, message = 'You did it for real!', onDone }) {
  const [pieces] = useState(makePieces)
  const doneRef = useRef(onDone)

  useEffect(() => {
    doneRef.current = onDone
  })

  useEffect(() => {
    const timer = setTimeout(() => doneRef.current(), 1900)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center" aria-live="polite">
      <div className="relative h-0 w-0">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              '--x': `${p.x}px`,
              '--y': `${p.y}px`,
              '--r': `${p.spin}deg`,
              width: p.size,
              height: p.round ? p.size : p.size * 0.55,
              borderRadius: p.round ? '50%' : '2px',
              background: p.color,
              animationDelay: `${p.delay}ms`,
            }}
          />
        ))}
      </div>
      <div className="celebrate-pop absolute flex flex-col items-center rounded-[28px] bg-white px-7 py-5 text-center shadow-[0_8px_0_rgb(22_24_58/0.15)]">
        <span className="font-display text-5xl text-ink">+{points} ⭐</span>
        <span className="mt-1 font-display text-2xl text-ink">{message}</span>
      </div>
    </div>
  )
}

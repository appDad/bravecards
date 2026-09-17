import { useEffect, useRef } from 'react'

// Bottom sheet dialog. Tap outside or press Escape to close.
export default function Sheet({ title, onClose, children }) {
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close"
        className="sheet-backdrop absolute inset-0 cursor-default bg-ink/45"
        onClick={onClose}
      />
      <div className="sheet-panel relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white px-5 pt-3 pb-[max(22px,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/15" />
        <h2 className="font-display text-[28px] leading-tight">{title}</h2>
        {children}
      </div>
    </div>
  )
}

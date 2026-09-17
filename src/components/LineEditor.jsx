import { useState } from 'react'
import Sheet from './Sheet'

// Rewrite a card's line in the kid's own words. Saving the original text (or blank) resets it.
export default function LineEditor({ card, customLine, onSave, onClose }) {
  const [text, setText] = useState(customLine || card.line)
  const clean = text.trim()

  const save = (e) => {
    e.preventDefault()
    onSave(clean && clean !== card.line ? clean : null)
    onClose()
  }

  return (
    <Sheet title="Say it your way" onClose={onClose}>
      <form onSubmit={save} className="mt-2 flex flex-col gap-4">
        <p className="text-ink-soft">
          When… <span className="font-bold text-ink">{card.situation}</span>
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={140}
          rows={3}
          autoFocus
          className="w-full resize-none rounded-2xl border-[3px] border-ink/15 p-3 font-display text-2xl leading-snug outline-none focus:border-ink"
        />
        {customLine && (
          <p className="text-sm text-ink-soft">
            Original: <span className="font-bold">{card.line}</span>
          </p>
        )}
        <div className="flex gap-3">
          {customLine && (
            <button
              type="button"
              className="btn3d flex-1 text-lg"
              onClick={() => {
                onSave(null)
                onClose()
              }}
            >
              Use original
            </button>
          )}
          <button type="submit" className="btn3d flex-1" style={{ '--c': '#ffc833' }}>
            Save
          </button>
        </div>
      </form>
    </Sheet>
  )
}

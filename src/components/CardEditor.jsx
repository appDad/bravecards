import { useState } from 'react'
import { categories } from '../cards'
import { addCustomCard, removeCustomCard, updateCustomCard } from '../lib/store'
import Sheet from './Sheet'

const inputClass =
  'w-full rounded-2xl border-[3px] border-ink/15 bg-white px-4 py-3 text-lg outline-none focus:border-ink'

// Add a family card (card = null) or edit / delete one the family made.
export default function CardEditor({ code, card, onClose }) {
  const [fields, setFields] = useState({
    categoryId: card?.categoryId ?? categories[0].id,
    situation: card?.situation ?? '',
    line: card?.line ?? '',
    followUp: card?.followUp ?? '',
    tip: card?.tip ?? '',
  })
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }))
  const canSave = fields.situation.trim() && fields.line.trim()

  const save = (e) => {
    e.preventDefault()
    if (!canSave) return
    const write = card ? updateCustomCard(code, card.id, fields) : addCustomCard(code, fields)
    write.catch((err) => console.error(err))
    onClose()
  }

  if (confirmingDelete) {
    return (
      <Sheet title="Delete this card?" onClose={onClose}>
        <p className="mt-2 text-ink-soft">It disappears from every kid's decks.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" className="btn3d" onClick={() => setConfirmingDelete(false)}>
            Keep
          </button>
          <button
            type="button"
            className="btn3d text-white"
            style={{ '--c': '#e11d48' }}
            onClick={() => {
              removeCustomCard(code, card.id).catch((err) => console.error(err))
              onClose()
            }}
          >
            Delete
          </button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet title={card ? 'Edit card' : 'New card'} onClose={onClose}>
      <form onSubmit={save} className="mt-4 flex flex-col gap-4">
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-ink-soft">Deck</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const selected = c.id === fields.categoryId
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFields((f) => ({ ...f, categoryId: c.id }))}
                  className={`min-h-11 rounded-full px-3 text-sm font-bold transition-transform active:scale-95 ${selected ? 'ring-[3px] ring-ink ring-offset-2' : 'opacity-70'}`}
                  style={{ background: c.color, color: c.text }}
                >
                  {c.emoji} {c.name}
                </button>
              )
            })}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-ink-soft">When… (front of the card)</span>
          <input
            value={fields.situation}
            onChange={set('situation')}
            maxLength={80}
            placeholder="A kid is sitting alone at lunch"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-ink-soft">What to say (back of the card)</span>
          <textarea
            value={fields.line}
            onChange={set('line')}
            maxLength={140}
            rows={2}
            placeholder="Can I sit here?"
            className={`${inputClass} resize-none`}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-ink-soft">Then say (optional)</span>
          <input
            value={fields.followUp}
            onChange={set('followUp')}
            maxLength={100}
            placeholder="What'd you bring?"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-ink-soft">Tip (optional)</span>
          <input
            value={fields.tip}
            onChange={set('tip')}
            maxLength={120}
            placeholder="Smile first, then ask."
            className={inputClass}
          />
        </label>

        <button type="submit" disabled={!canSave} className="btn3d w-full" style={{ '--c': '#ffc833' }}>
          {card ? 'Save card' : 'Add card'}
        </button>
        {card && (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="min-h-11 font-bold text-rose-600 underline-offset-4 hover:underline"
          >
            Delete card
          </button>
        )}
      </form>
    </Sheet>
  )
}

import { useState } from 'react'
import { AVATARS, KID_COLORS } from '../lib/avatars'
import { addKid, removeKid, updateKid } from '../lib/store'
import Avatar from './Avatar'
import Sheet from './Sheet'

const pick = (list) => list[Math.floor(Math.random() * list.length)]

// Add a kid (kid = null) or edit / remove an existing one.
export default function KidEditor({ code, kid, onClose }) {
  const [name, setName] = useState(kid?.name ?? '')
  const [avatar, setAvatar] = useState(() => kid?.avatar ?? pick(AVATARS))
  const [color, setColor] = useState(() => kid?.color ?? pick(KID_COLORS))
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  const cleanName = name.trim()

  const save = (e) => {
    e.preventDefault()
    if (!cleanName) return
    const fields = { name: cleanName, avatar, color }
    const write = kid ? updateKid(code, kid.id, fields) : addKid(code, fields)
    write.catch((err) => console.error(err))
    onClose()
  }

  const remove = () => {
    removeKid(code, kid.id).catch((err) => console.error(err))
    onClose()
  }

  if (confirmingRemove) {
    return (
      <Sheet title={`Remove ${kid.name}?`} onClose={onClose}>
        <p className="mt-2 text-ink-soft">This deletes their points, streak, and all card progress. It can't be undone.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" className="btn3d" onClick={() => setConfirmingRemove(false)}>
            Keep
          </button>
          <button type="button" className="btn3d text-white" style={{ '--c': '#e11d48' }} onClick={remove}>
            Remove
          </button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet title={kid ? 'Edit kid' : 'Add a kid'} onClose={onClose}>
      <form onSubmit={save} className="mt-4 flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Avatar kid={{ avatar, color }} size={84} />
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm font-bold text-ink-soft">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoComplete="off"
              className="h-14 w-full rounded-2xl border-[3px] border-ink/15 bg-white px-4 font-display text-2xl outline-none focus:border-ink"
              placeholder="Name"
            />
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-bold text-ink-soft">Avatar</legend>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatar(emoji)}
                aria-label={`Avatar ${emoji}`}
                aria-pressed={emoji === avatar}
                className={`flex h-12 items-center justify-center rounded-2xl text-[28px] transition-transform active:scale-90 ${emoji === avatar ? 'bg-sky ring-[3px] ring-ink' : 'bg-sky/60'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-bold text-ink-soft">Color</legend>
          <div className="grid grid-cols-4 gap-3">
            {KID_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                aria-pressed={c === color}
                className={`h-11 rounded-full transition-transform active:scale-90 ${c === color ? 'ring-[3px] ring-ink ring-offset-2' : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </fieldset>

        <button type="submit" disabled={!cleanName} className="btn3d w-full" style={{ '--c': '#ffc833' }}>
          {kid ? 'Save' : 'Add kid'}
        </button>
        {kid && (
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            className="min-h-11 font-bold text-rose-600 underline-offset-4 hover:underline"
          >
            Remove {kid.name}
          </button>
        )}
      </form>
    </Sheet>
  )
}

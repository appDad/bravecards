import { useState } from 'react'
import Avatar from './Avatar'
import KidEditor from './KidEditor'
import Logo from './Logo'

export default function ProfilePicker({ code, family, kids, error, onPick, onSettings }) {
  const [adding, setAdding] = useState(false)
  const noKids = kids.length === 0

  return (
    <div className="flex flex-1 flex-col">
      <div className="pt-4 pb-1">
        <Logo size="sm" />
      </div>
      {family?.name && <p className="text-center text-sm font-bold text-ink-soft">{family.name}</p>}

      <h1 className="mt-6 text-center font-display text-[34px] leading-tight">
        {noKids ? "Let's add your kids" : "Who's practicing?"}
      </h1>
      {noKids && (
        <p className="mt-1 text-center text-ink-soft">Each kid gets their own points, streak, and trophies.</p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6">
        {kids.map((kid, i) => (
          <button
            key={kid.id}
            type="button"
            onClick={() => onPick(kid.id)}
            className="tile-stagger group flex flex-col items-center gap-3 rounded-3xl p-2"
            style={{ '--i': i }}
          >
            <span className="transition-transform duration-150 group-active:scale-95">
              <Avatar kid={kid} size={120} />
            </span>
            <span className="font-display text-2xl leading-tight">{kid.name}</span>
          </button>
        ))}

        {/* Right after entering the family code there's nobody to pick yet, so let them add one here. */}
        {noKids && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="group col-span-2 flex flex-col items-center gap-3 rounded-3xl p-2"
          >
            <span className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-4 border-dashed border-ink/30 bg-white/60 text-5xl text-ink-soft transition-transform duration-150 group-active:scale-95">
              +
            </span>
            <span className="font-display text-2xl leading-tight">Add kid</span>
          </button>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-2xl bg-white p-3 text-center text-sm">
          Couldn't load kids. Check the internet connection and try again.
        </p>
      )}

      <div className="mt-auto flex justify-center pt-10">
        <button
          type="button"
          onClick={onSettings}
          className="flex min-h-11 items-center gap-2 rounded-full bg-white/70 px-5 font-bold text-ink-soft transition-transform active:scale-95"
        >
          <span aria-hidden="true">⚙️</span> Grown-ups settings
        </button>
      </div>

      {adding && <KidEditor code={code} kid={null} onClose={() => setAdding(false)} />}
    </div>
  )
}

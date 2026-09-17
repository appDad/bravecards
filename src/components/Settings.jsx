import { useState } from 'react'
import Avatar from './Avatar'
import CardEditor from './CardEditor'
import KidEditor from './KidEditor'
import Sheet from './Sheet'

// Grown-ups area: kids, the family's own cards, and this device.
export default function Settings({ code, family, kids, customCards, library, onBack, onLeaveFamily }) {
  // Each is null (closed), 'new', or the item being edited.
  const [kidEditor, setKidEditor] = useState(null)
  const [cardEditor, setCardEditor] = useState(null)
  const [confirmingLeave, setConfirmingLeave] = useState(false)

  return (
    <div className="flex flex-1 flex-col pb-4">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Done"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-[0_3px_0_rgb(22_24_58/0.14)] transition-transform active:scale-90"
        >
          ←
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-none">Grown-ups</h1>
          <p className="truncate text-sm text-ink-soft">
            {family?.name} · code {code}
          </p>
        </div>
      </header>

      <Section title="Kids" action="+ Add kid" onAction={() => setKidEditor('new')}>
        {kids.length === 0 && <Empty>No kids yet.</Empty>}
        {kids.map((kid) => (
          <button
            key={kid.id}
            type="button"
            onClick={() => setKidEditor(kid)}
            className="flex min-h-[64px] items-center gap-3 rounded-2xl bg-white p-2 pr-4 text-left transition-transform active:scale-[0.98]"
          >
            <Avatar kid={kid} size={48} />
            <span className="min-w-0 flex-1 truncate font-display text-xl">{kid.name}</span>
            <span className="text-sm font-bold text-ink-soft">{kid.points || 0} pts</span>
            <span aria-hidden="true" className="text-ink-soft">
              ✏️
            </span>
          </button>
        ))}
      </Section>

      <Section title="Your cards" action="+ Add card" onAction={() => setCardEditor('new')}>
        <p className="-mt-1 mb-1 text-sm text-ink-soft">
          Write situations from your kids' real days. They show up in the decks for everyone in your family.
        </p>
        {customCards.length === 0 && <Empty>No cards of your own yet.</Empty>}
        {customCards.map((card) => {
          const category = library.categoryById[card.categoryId]
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setCardEditor(card)}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 text-left transition-transform active:scale-[0.98]"
              style={{ borderLeft: `8px solid ${category?.color ?? '#999'}` }}
            >
              <span className="min-w-0 flex-1">
                <span className="block leading-snug font-bold">{card.line}</span>
                <span className="block text-sm text-ink-soft">
                  {category?.emoji} {card.situation}
                </span>
              </span>
              <span aria-hidden="true" className="text-ink-soft">
                ✏️
              </span>
            </button>
          )
        })}
      </Section>

      <Section title="This device">
        <button
          type="button"
          onClick={() => setConfirmingLeave(true)}
          className="btn3d w-full text-lg text-rose-600"
        >
          Sign out of this family
        </button>
      </Section>

      {kidEditor && <KidEditor code={code} kid={kidEditor === 'new' ? null : kidEditor} onClose={() => setKidEditor(null)} />}
      {cardEditor && (
        <CardEditor code={code} card={cardEditor === 'new' ? null : cardEditor} onClose={() => setCardEditor(null)} />
      )}
      {confirmingLeave && (
        <Sheet title="Sign out of this family?" onClose={() => setConfirmingLeave(false)}>
          <p className="mt-2 text-ink-soft">
            Nothing is deleted. You'll need the family code ({code}) to get back in on this device.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" className="btn3d" onClick={() => setConfirmingLeave(false)}>
              Stay
            </button>
            <button type="button" className="btn3d text-white" style={{ '--c': '#e11d48' }} onClick={onLeaveFamily}>
              Sign out
            </button>
          </div>
        </Sheet>
      )}
    </div>
  )
}

function Section({ title, action, onAction, children }) {
  return (
    <section className="mt-8 flex flex-col gap-2">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-2xl">{title}</h2>
        {action && (
          <button
            type="button"
            onClick={onAction}
            className="min-h-11 rounded-full bg-gold px-4 font-display text-lg shadow-[0_3px_0_#d9a400] transition-transform active:translate-y-0.5"
          >
            {action}
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

function Empty({ children }) {
  return <p className="rounded-2xl border-2 border-dashed border-ink/15 p-4 text-center text-ink-soft">{children}</p>
}

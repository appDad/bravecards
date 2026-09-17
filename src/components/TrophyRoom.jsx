import Avatar from './Avatar'
import PointsCounter from './PointsCounter'

// Decks can hold hundreds of cards, so this shows deck progress, the cards this kid
// has actually used, and the hidden ones (with a way to bring them back).
export default function TrophyRoom({ library, progress, onBack }) {
  const { kid, cards, streak, toggleHidden } = progress
  const { allCards, categories, categoryById } = library
  const p = (card) => cards[card.id] ?? {}
  const sum = (field) => allCards.reduce((total, card) => total + (p(card)[field] || 0), 0)

  const visible = allCards.filter((card) => !p(card).hidden)
  const hidden = allCards.filter((card) => p(card).hidden)
  const used = visible
    .filter((card) => p(card).practiced || p(card).usedForReal || p(card).mission || p(card).customLine)
    .sort(
      (a, b) =>
        (p(b).usedForReal || 0) - (p(a).usedForReal || 0) ||
        (p(b).practiced || 0) - (p(a).practiced || 0) ||
        Number(Boolean(p(b).mission)) - Number(Boolean(p(a).mission)),
    )

  return (
    <div className="flex flex-1 flex-col pb-4">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back home"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-[0_3px_0_rgb(22_24_58/0.14)] transition-transform active:scale-90"
        >
          ←
        </button>
        <h1 className="font-display text-3xl">Trophy Room</h1>
      </header>

      <section className="mt-5 rounded-[28px] bg-white p-5 shadow-[0_6px_0_rgb(22_24_58/0.1)]">
        <div className="flex items-center gap-4">
          <Avatar kid={kid} size={64} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-2xl leading-tight">{kid.name}</p>
            <p className="text-sm text-ink-soft">Total points</p>
          </div>
          <PointsCounter value={kid.points} className="h-14 bg-sky px-4 text-3xl" />
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Stat label="cards practiced" value={visible.filter((card) => p(card).practiced).length} />
          <Stat label="said for real" value={sum('usedForReal')} />
          <Stat label="day streak" value={streak} />
          <Stat label="with a parent" value={sum('practicedWithParent')} />
          <Stat label="with a friend" value={sum('practicedWithFriend')} />
          <Stat label="missions" value={visible.filter((card) => p(card).mission).length} />
        </dl>
      </section>

      <section className="mt-7">
        <h2 className="font-display text-2xl">Decks</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {categories.map((category) => {
            const deckCards = category.cards.filter((card) => !p(card).hidden)
            const practiced = deckCards.filter((card) => p(card).practiced).length
            const real = deckCards.reduce((total, card) => total + (p(card).usedForReal || 0), 0)
            const pct = deckCards.length ? (practiced / deckCards.length) * 100 : 0
            return (
              <li key={category.id} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
                  style={{ background: category.color }}
                  aria-hidden="true"
                >
                  {category.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-bold">{category.name}</p>
                    <p className="shrink-0 text-sm font-bold text-ink-soft">
                      {practiced}/{deckCards.length}
                      {real > 0 && ` · ⭐ ${real}`}
                    </p>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-sky">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: category.color }} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-7">
        <h2 className="font-display text-2xl">Your cards</h2>
        {used.length === 0 ? (
          <p className="mt-3 rounded-2xl border-2 border-dashed border-ink/15 p-4 text-center text-ink-soft">
            Practice a card and it shows up here.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {used.map((card) => {
              const progressOf = p(card)
              const category = categoryById[card.categoryId]
              return (
                <li
                  key={card.id}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3"
                  style={{ borderLeft: `8px solid ${category.color}` }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug font-bold">
                      {progressOf.mission && <span aria-label="Mission">🎯 </span>}
                      {progressOf.customLine || card.line}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-soft">{card.situation}</p>
                    {progressOf.practiced > 0 && (
                      <p className="mt-1 text-xs font-bold text-ink-soft">
                        👨‍👩‍👧 {progressOf.practicedWithParent || 0} · 🧑‍🤝‍🧑 {progressOf.practicedWithFriend || 0}
                      </p>
                    )}
                  </div>
                  <Count value={progressOf.practiced || 0} label="practiced" />
                  <Count value={progressOf.usedForReal || 0} label="for real" gold />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {hidden.length > 0 && (
        <details className="group mt-7">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-2xl bg-white/70 px-4 font-display text-xl">
            <span>👎 Hidden cards ({hidden.length})</span>
            <span className="transition-transform group-open:rotate-180" aria-hidden="true">
              ▾
            </span>
          </summary>
          <ul className="mt-2 flex flex-col gap-2">
            {hidden.map((card) => (
              <li key={card.id} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                <div className="min-w-0 flex-1 opacity-70">
                  <p className="leading-snug font-bold">{p(card).customLine || card.line}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {categoryById[card.categoryId].emoji} {card.situation}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleHidden(card.id, false)}
                  className="min-h-11 shrink-0 rounded-full bg-sky px-4 text-sm font-bold transition-transform active:scale-95"
                >
                  Show again
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col-reverse rounded-2xl bg-sky px-1 py-3">
      <dt className="mt-1 text-xs font-bold text-ink-soft">{label}</dt>
      <dd className="font-display text-[28px] leading-none">{value}</dd>
    </div>
  )
}

function Count({ value, label, gold = false }) {
  return (
    <div className="flex w-14 shrink-0 flex-col items-center">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-xl ${gold && value ? 'bg-gold' : 'bg-sky'}`}
      >
        {value}
      </span>
      <span className="mt-0.5 text-[11px] leading-tight font-bold text-ink-soft">{label}</span>
    </div>
  )
}

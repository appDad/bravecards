import { useEffect, useState } from 'react'
import useStoredState from '../hooks/useStoredState'
import { buzz, shuffle } from '../lib/motion'
import { POINTS } from '../lib/streak'
import Card from './Card'
import Confetti from './Confetti'
import DeckDone from './DeckDone'
import LineEditor from './LineEditor'
import PointsCounter from './PointsCounter'
import ProgressDots from './ProgressDots'

const DECK_SIZE = 10 // cards dealt per run, picked at random from the deck
const UNDO_MS = 5000
let swipeHintSeen = false

const PARTNERS = [
  { id: 'parent', label: 'Parent', emoji: '👨‍👩‍👧' },
  { id: 'friend', label: 'Friend', emoji: '🧑‍🤝‍🧑' },
]

// Deal a run: never cards this kid gave a thumbs down.
function buildDeck(library, deckId, cards) {
  const visible = library.allCards.filter((card) => !cards[card.id]?.hidden)
  if (deckId === 'missions') return shuffle(visible.filter((card) => cards[card.id]?.mission))
  const pool = deckId === 'random' ? visible : visible.filter((card) => card.categoryId === deckId)
  return shuffle(pool).slice(0, DECK_SIZE)
}

function deckInfo(library, deckId) {
  if (deckId === 'random') return { name: 'Random mix', emoji: '🎲', color: '#16183a' }
  if (deckId === 'missions') return { name: 'My missions', emoji: '🎯', color: '#16183a' }
  return library.categoryById[deckId]
}

// Holds the deck between rounds; each round is a fresh random deal.
export default function Practice({ deckId, library, progress, onExit }) {
  const [round, setRound] = useState(() => ({ n: 0, deck: buildDeck(library, deckId, progress.cards) }))
  const [summary, setSummary] = useState(null)
  const [undo, setUndo] = useState(null) // { cardId, key } for the "Hidden. Undo" toast

  useEffect(() => {
    if (!undo) return
    const timer = setTimeout(() => setUndo(null), UNDO_MS)
    return () => clearTimeout(timer)
  }, [undo])

  const startRound = (deck) => {
    setRound((r) => ({ n: r.n + 1, deck }))
    setSummary(null)
  }

  let content
  if (round.deck.length === 0) {
    const missions = deckId === 'missions'
    content = (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <span className="text-7xl" aria-hidden="true">
          {missions ? '🎯' : '👎'}
        </span>
        <p className="font-display text-3xl">{missions ? 'No missions right now' : 'No cards left here'}</p>
        <p className="text-ink-soft">
          {missions
            ? 'On any card, tap "Gonna try it with a friend" to add it here.'
            : 'Every card in this deck is hidden. Bring some back in the Trophy Room.'}
        </p>
        <button type="button" className="btn3d w-full" onClick={onExit}>
          Back home
        </button>
      </div>
    )
  } else if (summary) {
    // Counted from live progress, so a card un-hidden with Undo counts as skipped, not hidden.
    const { deck, results, earned } = summary
    const stillHidden = (card, i) => results[i] === 'hidden' && progress.cards[card.id]?.hidden
    const skipped = deck.filter((card, i) => results[i] === 'skipped' || (results[i] === 'hidden' && !stillHidden(card, i)))
    content = (
      <DeckDone
        summary={{
          practiced: results.filter((r) => r === 'practiced').length,
          skipped,
          hidden: deck.filter(stillHidden).length,
          earned,
        }}
        onAgain={() => startRound(buildDeck(library, deckId, progress.cards))}
        onRetrySkipped={() => startRound(skipped)}
        onHome={onExit}
      />
    )
  } else {
    content = (
      <Round
        key={round.n}
        info={deckInfo(library, deckId)}
        deck={round.deck}
        library={library}
        progress={progress}
        onExit={onExit}
        onFinish={setSummary}
        onHidden={(cardId) => setUndo({ cardId, key: Date.now() })}
      />
    )
  }

  return (
    <>
      {content}
      {undo && (
        <div
          key={undo.key}
          role="status"
          className="pop-in fixed top-[max(12px,env(safe-area-inset-top))] left-1/2 z-40 flex w-[min(92vw,380px)] -translate-x-1/2 items-center gap-3 rounded-full bg-ink py-1.5 pr-1.5 pl-5 text-white shadow-[0_6px_20px_rgb(22_24_58/0.3)]"
        >
          <span className="flex-1 font-bold">👎 Hidden from your decks</span>
          <button
            type="button"
            onClick={() => {
              progress.toggleHidden(undo.cardId, false)
              setUndo(null)
            }}
            className="min-h-11 rounded-full bg-gold px-5 font-display text-lg text-ink"
          >
            Undo
          </button>
        </div>
      )}
    </>
  )
}

function Round({ info, deck, library, progress, onExit, onFinish, onHidden }) {
  const { kid, cards, practice, sayForReal, toggleMission, toggleHidden, saveLine } = progress
  const [partner, setPartner] = useStoredState('bravecards.partner', 'parent')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [exit, setExit] = useState(null) // 'left' | 'right' | 'down' (hidden)
  const [results, setResults] = useState([]) // 'practiced' | 'skipped' | 'hidden', one per dealt card
  const [earned, setEarned] = useState(0)
  const [saidForReal, setSaidForReal] = useState(() => new Set())
  const [celebration, setCelebration] = useState(null)
  const [editing, setEditing] = useState(false)
  const [showHint, setShowHint] = useState(!swipeHintSeen)

  const card = deck[index]
  const category = library.categoryById[card?.categoryId]
  const cardProgress = (card && cards[card.id]) || {}
  const alreadySaid = card ? saidForReal.has(card.id) : false

  const leaveCard = (result, direction) => {
    setResults((r) => [...r, result])
    setExit(direction)
    swipeHintSeen = true
    setShowHint(false)
  }

  const swipe = (dir) => {
    if (!card || exit || editing) return
    if (dir === 'right') {
      practice(card.id, partner)
      setEarned((e) => e + POINTS.practiced)
      buzz(15)
    }
    leaveCard(dir === 'right' ? 'practiced' : 'skipped', dir)
  }

  const hide = () => {
    if (!card || exit || editing) return
    toggleHidden(card.id, true)
    buzz(25)
    onHidden(card.id)
    leaveCard('hidden', 'down')
  }

  const advance = () => {
    const next = index + 1
    if (next >= deck.length) {
      onFinish({ deck, results, earned })
      return
    }
    setExit(null)
    setFlipped(false)
    setIndex(next)
  }

  const didItForReal = () => {
    if (!card || alreadySaid) return
    const wasMission = Boolean(cardProgress.mission)
    sayForReal(card.id)
    setSaidForReal((s) => new Set(s).add(card.id))
    setEarned((e) => e + POINTS.usedForReal)
    setCelebration({ key: Date.now(), message: wasMission ? 'Mission complete!' : 'You did it for real!' })
    buzz([30, 50, 30, 50, 80])
  }

  const flipMission = () => {
    if (!card) return
    const on = !cardProgress.mission
    toggleMission(card.id, on)
    if (on) buzz(20)
  }

  // Keyboard for laptops: arrows swipe, space/enter flips.
  useEffect(() => {
    const onKey = (e) => {
      if (editing || e.target.closest?.('button, input, textarea, [role="button"]')) return
      if (e.key === 'ArrowRight') swipe('right')
      else if (e.key === 'ArrowLeft') swipe('left')
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!card) return null

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExit}
          aria-label="Back home"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-[0_3px_0_rgb(22_24_58/0.14)] transition-transform active:scale-90"
        >
          ✕
        </button>
        <h1 className="min-w-0 flex-1 truncate font-display text-[22px]">
          <span aria-hidden="true">{info.emoji} </span>
          {info.name}
        </h1>
        <PointsCounter value={kid.points} />
      </header>

      <div className="mt-3 flex items-center gap-2" role="radiogroup" aria-label="Practicing with">
        <span className="shrink-0 text-sm font-bold text-ink-soft">Practicing with</span>
        {PARTNERS.map((p) => {
          const selected = partner === p.id
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPartner(p.id)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-2 font-bold transition-all active:scale-95 ${selected ? 'bg-ink text-white' : 'bg-white/80 text-ink-soft'}`}
            >
              <span aria-hidden="true">{p.emoji}</span> {p.label}
            </button>
          )
        })}
      </div>

      <div className="mt-3">
        <ProgressDots count={deck.length} index={index} results={results} color={info.color} />
      </div>

      <div className="relative mt-3 min-h-[320px] flex-1">
        <Card
          key={`${index}-${card.id}`}
          card={card}
          category={category}
          stats={cardProgress}
          customLine={cardProgress.customLine}
          mission={Boolean(cardProgress.mission)}
          flipped={flipped}
          exit={exit}
          onFlip={() => setFlipped((f) => !f)}
          onSwipe={swipe}
          onExited={advance}
          onEdit={() => setEditing(true)}
          onHide={hide}
        />
      </div>

      <p className="mt-3 h-5 text-center text-sm font-bold text-ink-soft" aria-hidden={!showHint}>
        {showHint ? 'Swipe right if you practiced it, left to skip' : ''}
      </p>

      <div className="mt-1 grid grid-cols-2 gap-3">
        <button type="button" className="btn3d text-ink-soft" onClick={() => swipe('left')}>
          <span aria-hidden="true">←</span> Skip
        </button>
        <button type="button" className="btn3d" style={{ '--c': '#1fbf6a' }} onClick={() => swipe('right')}>
          Practiced <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={flipMission}
          aria-pressed={Boolean(cardProgress.mission)}
          className="btn3d min-h-[64px] px-3 text-[1.05rem] leading-tight"
          style={{ '--c': cardProgress.mission ? '#d7e6ff' : '#ffffff' }}
        >
          <span aria-hidden="true">🎯</span>
          {cardProgress.mission ? 'On my missions' : 'Gonna try it with a friend'}
        </button>
        <button
          type="button"
          onClick={didItForReal}
          disabled={alreadySaid}
          className="btn3d min-h-[64px] px-3 text-[1.05rem] leading-tight disabled:opacity-100"
          style={{ '--c': alreadySaid ? '#fff1b8' : '#ffc833' }}
        >
          <span aria-hidden="true">⭐</span>
          {alreadySaid ? 'Brave move! +5' : 'I said it for real! +5'}
        </button>
      </div>

      {celebration && (
        <Confetti
          key={celebration.key}
          points={POINTS.usedForReal}
          message={celebration.message}
          onDone={() => setCelebration(null)}
        />
      )}

      {editing && (
        <LineEditor
          card={card}
          customLine={cardProgress.customLine}
          onSave={(text) => saveLine(card.id, text)}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}

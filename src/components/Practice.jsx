import { useEffect, useState } from 'react'
import useStoredState from '../hooks/useStoredState'
import { deal } from '../lib/deal'
import { buzz, shuffle } from '../lib/motion'
import { POINTS } from '../lib/streak'
import Card from './Card'
import Confetti from './Confetti'
import DeckDone from './DeckDone'
import LineEditor from './LineEditor'
import PointsCounter from './PointsCounter'
import ProgressDots from './ProgressDots'

const DECK_SIZE = 10 // cards dealt per run
const UNDO_MS = 5000
const PRACTICED_PAUSE_MS = 450 // let the ✓ land before sliding to the next card
let swipeHintSeen = false

const PARTNERS = [
  { id: 'parent', label: 'Parent', emoji: '👨‍👩‍👧' },
  { id: 'friend', label: 'Friend', emoji: '🧑‍🤝‍🧑' },
]

// Deal a run of 10 at random, weighted toward this kid's 👍 cards. 👎 (buried) cards only
// fill in when a deck runs short; missions are the kid's own picks, minus buried ones.
function buildDeck(library, deckId, cards) {
  if (deckId === 'missions') {
    return shuffle(library.allCards.filter((card) => cards[card.id]?.mission && !cards[card.id]?.hidden))
  }
  const pool = deckId === 'random' ? library.allCards : library.allCards.filter((card) => card.categoryId === deckId)
  return deal(pool, cards, DECK_SIZE)
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
  const [undo, setUndo] = useState(null) // { cardId, previous, key } for the "Buried. Undo" toast

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
          {missions ? '🎯' : '🃏'}
        </span>
        <p className="font-display text-3xl">{missions ? 'No missions right now' : 'No cards here yet'}</p>
        <p className="text-ink-soft">
          {missions
            ? 'On any card, tap "Gonna try it with a friend" to add it here.'
            : 'This deck is empty. Add cards in Grown-ups settings.'}
        </p>
        <button type="button" className="btn3d w-full" onClick={onExit}>
          Back home
        </button>
      </div>
    )
  } else if (summary) {
    // Read from live progress, so a card un-buried with Undo stops counting as buried.
    const { deck, practicedIds, buriedIds, earned } = summary
    const buried = deck.filter((card) => buriedIds.has(card.id) && progress.cards[card.id]?.hidden)
    const notPracticed = deck.filter((card) => !practicedIds.has(card.id) && !buried.includes(card))
    content = (
      <DeckDone
        summary={{ practiced: practicedIds.size, left: notPracticed, buried: buried.length, earned }}
        onAgain={() => startRound(buildDeck(library, deckId, progress.cards))}
        onRetryLeft={() => startRound(notPracticed)}
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
        onBuried={(cardId, previous) => setUndo({ cardId, previous, key: Date.now() })}
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
          <span className="flex-1 font-bold">👎 Buried. It'll hardly come up.</span>
          <button
            type="button"
            onClick={() => {
              progress.rateCard(undo.cardId, undo.previous)
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

function Round({ info, deck, library, progress, onExit, onFinish, onBuried }) {
  const { kid, cards, practice, sayForReal, toggleMission, rateCard, saveLine } = progress
  const [partner, setPartner] = useStoredState('bravecards.partner', 'parent')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  // A move in progress: { exit: 'left' | 'right' | 'down', step: -1 | 1 }
  const [move, setMove] = useState(null)
  const [enterFrom, setEnterFrom] = useState(null) // which side the card slid in from
  const [practicedIds, setPracticedIds] = useState(() => new Set())
  const [buriedIds, setBuriedIds] = useState(() => new Set())
  const [earned, setEarned] = useState(0)
  const [saidForReal, setSaidForReal] = useState(() => new Set())
  const [celebration, setCelebration] = useState(null)
  const [editing, setEditing] = useState(false)
  const [showHint, setShowHint] = useState(!swipeHintSeen)

  const card = deck[index]
  const category = library.categoryById[card?.categoryId]
  const cardProgress = (card && cards[card.id]) || {}
  const alreadyPracticed = card ? practicedIds.has(card.id) : false
  const alreadySaid = card ? saidForReal.has(card.id) : false
  const busy = Boolean(move) || editing

  // step: +1 next card, -1 the one before. Swiping left goes forward, right goes back.
  const go = (step, exit = step > 0 ? 'left' : 'right') => {
    if (!card || busy) return
    if (step < 0 && index === 0) return // nothing before the first card
    swipeHintSeen = true
    setShowHint(false)
    setMove({ exit, step })
  }

  const finishMove = () => {
    const { step } = move
    const next = index + step
    if (next >= deck.length) {
      onFinish({ deck, practicedIds, buriedIds, earned })
      return
    }
    setEnterFrom(step > 0 ? 'right' : 'left')
    setMove(null)
    setFlipped(false)
    setIndex(next)
  }

  const markPracticed = () => {
    if (!card || busy || alreadyPracticed) return
    practice(card.id, partner)
    setPracticedIds((ids) => new Set(ids).add(card.id))
    setEarned((e) => e + POINTS.practiced)
    buzz(15)
    setTimeout(() => go(1), PRACTICED_PAUSE_MS)
  }

  // 👍 toggles and stays on this card. 👎 buries it and moves on (with an Undo toast).
  const like = () => {
    if (!card || busy) return
    const on = !cardProgress.liked
    rateCard(card.id, on ? 'up' : null)
    if (on) buzz(20)
  }

  const bury = () => {
    if (!card || busy) return
    const previous = cardProgress.liked ? 'up' : null
    rateCard(card.id, 'down')
    buzz(25)
    setBuriedIds((ids) => new Set(ids).add(card.id))
    onBuried(card.id, previous)
    go(1, 'down')
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

  // Keyboard for laptops: arrows move between cards, space/enter flips.
  useEffect(() => {
    const onKey = (e) => {
      if (editing || e.target.closest?.('button, input, textarea, [role="button"]')) return
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!card) return null

  const dots = deck.map((c) => (practicedIds.has(c.id) ? 'practiced' : buriedIds.has(c.id) ? 'hidden' : undefined))

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
        <ProgressDots count={deck.length} index={index} results={dots} color={info.color} />
      </div>

      <div className="relative mt-3 min-h-[320px] flex-1">
        <Card
          key={`${index}-${card.id}`}
          card={card}
          category={category}
          stats={cardProgress}
          customLine={cardProgress.customLine}
          mission={Boolean(cardProgress.mission)}
          liked={Boolean(cardProgress.liked)}
          practiced={alreadyPracticed}
          atStart={index === 0}
          enterFrom={enterFrom}
          flipped={flipped}
          exit={move?.exit ?? null}
          onFlip={() => setFlipped((f) => !f)}
          onSwipe={(dir) => go(dir === 'left' ? 1 : -1)}
          onExited={finishMove}
          onEdit={() => setEditing(true)}
          onLike={like}
          onBury={bury}
        />
      </div>

      <p className="mt-3 h-5 text-center text-sm font-bold text-ink-soft" aria-hidden={!showHint}>
        {showHint ? 'Swipe left and right to move between cards' : ''}
      </p>

      <div className="mt-1 grid grid-cols-[64px_1fr_64px] gap-3">
        <button
          type="button"
          className="btn3d px-0 text-2xl text-ink-soft"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Card before this one"
        >
          ←
        </button>
        <button
          type="button"
          className="btn3d px-2 text-[1.15rem] disabled:opacity-100"
          style={{ '--c': alreadyPracticed ? '#c7f0d8' : '#1fbf6a' }}
          onClick={markPracticed}
          disabled={alreadyPracticed}
        >
          {alreadyPracticed ? 'Practiced ✓' : 'Practiced +1'}
        </button>
        <button
          type="button"
          className="btn3d px-0 text-2xl text-ink-soft"
          onClick={() => go(1)}
          aria-label={index === deck.length - 1 ? 'Finish the deck' : 'Next card'}
        >
          →
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

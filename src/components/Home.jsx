import { useEffect, useState } from 'react'
import Avatar from './Avatar'
import CategoryTile from './CategoryTile'
import PointsCounter from './PointsCounter'
import StreakFlame from './StreakFlame'

// Tiles stagger in the first time Home shows after the app opens, not on every return.
let tilesHaveEntered = false

export default function Home({ library, progress, onOpenDeck, onTrophies, onSwitchKid }) {
  const { kid, cards, streak } = progress
  const [stagger] = useState(() => !tilesHaveEntered)
  const missionCount = library.allCards.filter((card) => cards[card.id]?.mission && !cards[card.id]?.hidden).length
  const { categories } = library

  useEffect(() => {
    tilesHaveEntered = true
  }, [])

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSwitchKid}
          aria-label={`Playing as ${kid.name}. Switch player.`}
          className="flex min-h-11 min-w-0 items-center gap-2 rounded-full bg-white/70 py-1 pr-4 pl-1 transition-transform active:scale-95"
        >
          <Avatar kid={kid} size={44} />
          <span className="truncate font-display text-xl">{kid.name}</span>
        </button>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <StreakFlame streak={streak} />
          <PointsCounter value={kid.points} />
        </div>
      </header>

      <div className="mt-7">
        <h1 className="font-display text-[38px] leading-none">Pick a deck</h1>
        <p className="mt-2 text-ink-soft">Practice here. Be brave at school.</p>
      </div>

      {missionCount > 0 && (
        <button
          type="button"
          onClick={() => onOpenDeck('missions')}
          className="btn3d mt-5 min-h-[72px] w-full justify-start gap-3 px-4 text-left"
          style={{ '--c': '#ffffff' }}
        >
          <span className="text-4xl" aria-hidden="true">
            🎯
          </span>
          <span className="flex flex-col">
            <span className="text-[1.35rem] leading-tight">
              My missions ({missionCount})
            </span>
            <span className="font-sans text-sm font-bold text-ink-soft">Warm up before school</span>
          </span>
        </button>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        {categories.map((category, i) => (
          <CategoryTile
            key={category.id}
            category={category}
            index={i}
            stagger={stagger}
            wide={i === categories.length - 1 && categories.length % 2 === 1}
            practicedCount={category.cards.filter((card) => cards[card.id]?.practiced && !cards[card.id]?.hidden).length}
            total={category.cards.filter((card) => !cards[card.id]?.hidden).length}
            onClick={() => onOpenDeck(category.id)}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <button
          type="button"
          className="btn3d w-full text-[1.45rem]"
          style={{ '--c': '#ffc833' }}
          onClick={() => onOpenDeck('random')}
        >
          <span aria-hidden="true">🎲</span> Random mix
        </button>
        <button type="button" className="btn3d w-full" onClick={onTrophies}>
          <span aria-hidden="true">🏆</span> Trophy room
        </button>
      </div>
    </div>
  )
}

import { shuffle } from './motion'

// How much more often a 👍 card is dealt than an ordinary one.
export const LIKED_WEIGHT = 4

// Deal `size` cards for one kid: a weighted random pick without replacement
// (Efraimidis–Spirakis), so 👍 cards come up about 4x as often. 👎 cards are buried:
// they're only used to fill in when a deck doesn't have enough other cards.
export function deal(cards, progress, size) {
  const active = []
  const buried = []
  for (const card of cards) (progress[card.id]?.hidden ? buried : active).push(card)

  const picked = active
    .map((card) => ({ card, key: Math.random() ** (1 / (progress[card.id]?.liked ? LIKED_WEIGHT : 1)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, size)
    .map(({ card }) => card)

  if (picked.length < size) picked.push(...shuffle(buried).slice(0, size - picked.length))
  return shuffle(picked) // so 👍 cards aren't always first
}

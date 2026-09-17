// Brave Cards content: deck info from content/decks.js plus the built-in cards in
// content/cards.json. Families can also add their own cards in the app (Grown-ups
// settings); those live in Firestore and merge into these decks.
//
// To add lots of cards: `npm run cards:export`, edit the CSV, `npm run cards:import -- <file>`.
// A card: id (permanent, progress is saved under it), situation (front), line (back),
// optional followUp (a second thing to say) and tip (one short sentence).

import cardsByDeck from './content/cards.json'
import { decks } from './content/decks'

export const categories = decks.map((deck) => ({ ...deck, cards: cardsByDeck[deck.id] ?? [] }))

export const categoryIds = categories.map((c) => c.id)

// Merge a family's own cards (from Firestore) into the built-in decks.
export function buildLibrary(customCards = []) {
  const merged = categories.map((category) => ({
    ...category,
    cards: [
      ...category.cards,
      ...customCards
        .filter((card) => card.categoryId === category.id)
        .map(({ id, situation, line, followUp, tip }) => ({ id, situation, line, followUp, tip, custom: true })),
    ],
  }))

  return {
    categories: merged,
    allCards: merged.flatMap((category) => category.cards.map((card) => ({ ...card, categoryId: category.id }))),
    categoryById: Object.fromEntries(merged.map((c) => [c.id, c])),
  }
}

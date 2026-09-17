// Export every built-in card to a CSV you can edit in Excel, Google Sheets, or with an AI.
// Usage: npm run cards:export [-- output.csv]      (default: cards-export.csv)

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { decks } from '../src/content/decks.js'
import { toCsv } from './csv.mjs'

const root = resolve(import.meta.dirname, '..')
const output = resolve(process.argv[2] ?? resolve(root, 'cards-export.csv'))
const cardsByDeck = JSON.parse(readFileSync(resolve(root, 'src/content/cards.json'), 'utf8'))

const rows = decks.flatMap((deck) => (cardsByDeck[deck.id] ?? []).map((card) => ({ deck: deck.id, ...card })))
writeFileSync(output, toCsv(rows))

console.log(`Exported ${rows.length} cards to ${output}`)
for (const deck of decks) console.log(`  ${deck.id.padEnd(14)} ${String(cardsByDeck[deck.id]?.length ?? 0).padStart(4)}  ${deck.name}`)

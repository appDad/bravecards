// Import an edited card CSV back into src/content/cards.json.
// Usage: npm run cards:import -- path/to/cards.csv [--dry-run]
//
// Columns (header row required, any order): deck, id, situation, line, followUp, tip
//   deck       a deck id (morning) or name (Morning Hello)
//   id         keep it for existing cards so progress carries over; leave blank for new cards
//   situation  front of the card      line      what to say
//   followUp   optional               tip       optional
// Rows missing from the file are removed from the app. Nothing is written if any row has an error.

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { decks } from '../src/content/decks.js'
import { parseDelimited } from './csv.mjs'

const LIMITS = { situation: 80, line: 140, followUp: 100, tip: 140 }
const HEADER_ALIASES = {
  deck: 'deck',
  category: 'deck',
  categoryid: 'deck',
  id: 'id',
  situation: 'situation',
  when: 'situation',
  front: 'situation',
  line: 'line',
  say: 'line',
  whattosay: 'line',
  back: 'line',
  followup: 'followUp',
  then: 'followUp',
  thensay: 'followUp',
  tip: 'tip',
}

const args = process.argv.slice(2)
// npm swallows --dry-run when it's typed without the `--` separator, but tells us via this env var.
const dryRun = args.includes('--dry-run') || process.env.npm_config_dry_run === 'true'
const input = args.find((a) => !a.startsWith('--'))
if (!input) {
  console.error('Usage: npm run cards:import -- <file.csv> [--dry-run]')
  process.exit(1)
}

const root = resolve(import.meta.dirname, '..')
const jsonPath = resolve(root, 'src/content/cards.json')
const before = JSON.parse(readFileSync(jsonPath, 'utf8'))
const beforeById = new Map(
  Object.entries(before).flatMap(([deck, cards]) => cards.map((card) => [card.id, { deck, ...card }])),
)

// Letters and numbers in any language; emoji-only text falls back to itself.
const key = (s) => s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') || s.trim()
const clean = (s) => (s ?? '').replace(/\s+/g, ' ').trim()
const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const fail = (message) => {
  console.error(`Not imported. Nothing was changed.\n\n  ✗ ${message}`)
  process.exit(1)
}

const text = readFileSync(resolve(input), 'utf8')
if (text.includes('�')) {
  fail(
    'This file is not UTF-8, so some characters came through garbled.\n' +
      '    In Excel: File > Save As > "CSV UTF-8 (Comma delimited)". In Google Sheets: File > Download > CSV.',
  )
}

let rows
try {
  rows = parseDelimited(text)
} catch (error) {
  fail(error.message)
}
if (rows.length < 2) fail('The file needs a header row and at least one card.')

// Header names are matched loosely ("Follow up", "followUp", "Tip (optional)"), but an
// unrecognized column stops the import: silently ignoring it could wipe every tip.
const headerKey = (h) => h.replace(/\(.*?\)/g, '').toLowerCase().replace(/[^a-z]/g, '')
const columns = rows[0].map((h) => HEADER_ALIASES[headerKey(h)])
const unknownColumns = rows[0].filter((h, i) => h.trim() && !columns[i])
if (unknownColumns.length) {
  fail(`Unknown column(s): ${unknownColumns.join(', ')}. Use: deck, id, situation, line, followUp, tip`)
}
const col = (name) => columns.indexOf(name)
const missingColumns = ['deck', 'situation', 'line'].filter((c) => col(c) === -1)
if (missingColumns.length) fail(`Missing column(s): ${missingColumns.join(', ')}. Header found: ${rows[0].join(' | ')}`)

const deckByKey = new Map(decks.flatMap((d) => [[key(d.id), d.id], [key(d.name), d.id]]))
const cell = (cells, name) => (col(name) === -1 ? '' : clean(cells[col(name)]))
const contentKey = (deck, situation, line) => `${deck}|${key(situation)}|${key(line)}`
const contentKeyOf = (cells) =>
  contentKey(deckByKey.get(key(cell(cells, 'deck'))), cell(cells, 'situation'), cell(cells, 'line'))

// A row with no id whose text exactly matches a card already in the app is that card, so it
// keeps its id (and the kids' progress). Re-importing the same file then changes nothing.
const idByContent = new Map([...beforeById.values()].map((c) => [contentKey(c.deck, c.situation, c.line), c.id]))

const errors = []
const warnings = []
const result = Object.fromEntries(decks.map((d) => [d.id, []]))
const seenContent = new Map()
const seenIds = new Map()

// First pass: ids written in the file, and which card content they belong to. A row without an
// id that repeats one of these cards is the duplicate, wherever it sits in the file.
const idsInFile = new Set()
const contentWithId = new Map()
rows.slice(1).forEach((cells, i) => {
  const id = cell(cells, 'id')
  if (!id) return
  idsInFile.add(id)
  if (!contentWithId.has(contentKeyOf(cells))) contentWithId.set(contentKeyOf(cells), i + 2)
})

rows.slice(1).forEach((cells, i) => {
  const rowNumber = i + 2 // spreadsheet row, counting the header as row 1
  const [deckText, situation, line, followUp, tip] = ['deck', 'situation', 'line', 'followUp', 'tip'].map((name) =>
    cell(cells, name),
  )
  let id = cell(cells, 'id')

  if (cells.slice(rows[0].length).some((extra) => extra.trim())) {
    errors.push(`Row ${rowNumber}: more cells than columns. A comma inside text needs the whole field in "quotes".`)
    return
  }
  if (cells.length > rows[0].length) {
    warnings.push(`Row ${rowNumber}: more cells than columns, so a comma may have split some text. Check this card.`)
  }
  const deck = deckByKey.get(key(deckText))
  if (!deck) {
    errors.push(`Row ${rowNumber}: unknown deck "${deckText}". Use one of: ${decks.map((d) => d.id).join(', ')}`)
    return
  }
  if (!situation || !line) {
    errors.push(`Row ${rowNumber}: needs both a situation and a line.`)
    return
  }
  for (const [field, value] of Object.entries({ situation, line, followUp, tip })) {
    if (value.length > LIMITS[field]) {
      warnings.push(`Row ${rowNumber}: ${field} is ${value.length} characters (over ${LIMITS[field]}); it may look crowded.`)
    }
  }

  const rowKey = contentKeyOf(cells)
  if (!id && contentWithId.has(rowKey)) {
    warnings.push(`Row ${rowNumber}: same as the existing card on row ${contentWithId.get(rowKey)}, skipped.`)
    return
  }
  if (seenContent.has(rowKey)) {
    warnings.push(`Row ${rowNumber}: same situation and line as row ${seenContent.get(rowKey)}, skipped.`)
    return
  }
  seenContent.set(rowKey, rowNumber)

  const matchingId = idByContent.get(rowKey)
  if (!id && matchingId && !idsInFile.has(matchingId) && !seenIds.has(matchingId)) id = matchingId

  if (id) {
    if (!/^[a-z0-9][a-z0-9-]{1,59}$/.test(id)) {
      errors.push(`Row ${rowNumber}: id "${id}" should be lowercase letters, numbers, and dashes (or leave it blank).`)
      return
    }
    if (seenIds.has(id)) {
      errors.push(`Row ${rowNumber}: id "${id}" is already used on row ${seenIds.get(id)}. Leave one blank to make a new card.`)
      return
    }
  } else {
    // A random suffix means a new card never takes over the id (and saved progress) of a card
    // removed now or in an earlier import that happened to have similar wording.
    const base = `${deck}-${slug(line).slice(0, 32).replace(/-+$/, '') || 'card'}`
    do {
      id = `${base}-${Math.random().toString(36).slice(2, 6)}`
    } while (idsInFile.has(id) || seenIds.has(id) || beforeById.has(id))
  }
  seenIds.set(id, rowNumber)

  result[deck].push({ id, situation, line, ...(followUp ? { followUp } : {}), ...(tip ? { tip } : {}) })
})

if (errors.length) {
  console.error(`Not imported: ${errors.length} problem(s). Nothing was changed.\n`)
  errors.forEach((e) => console.error(`  ✗ ${e}`))
  process.exit(1)
}

const after = Object.values(result).flat()
const afterIds = new Set(after.map((c) => c.id))
const added = after.filter((c) => !beforeById.has(c.id))
const changed = Object.entries(result).flatMap(([deck, cards]) =>
  cards.filter((c) => {
    const old = beforeById.get(c.id)
    return old && JSON.stringify({ deck, ...c }) !== JSON.stringify(old)
  }),
)
const removed = [...beforeById.values()].filter((c) => !afterIds.has(c.id))

warnings.forEach((w) => console.log(`  ! ${w}`))
console.log(`\n${dryRun ? 'Dry run (nothing written)' : 'Imported'}: ${after.length} cards`)
console.log(`  ${added.length} new, ${changed.length} changed, ${removed.length} removed`)
for (const deck of decks) console.log(`  ${deck.id.padEnd(14)} ${String(result[deck.id].length).padStart(4)}  ${deck.name}`)
if (changed.length) {
  console.log(`\nChanged:`)
  changed.forEach((c) => console.log(`  ~ ${c.id}: ${c.line}`))
}
if (removed.length) {
  console.log(`\nRemoved (their saved progress stays in the database but they no longer show):`)
  removed.forEach((c) => console.log(`  - ${c.id}: ${c.line}`))
}

if (!dryRun) writeFileSync(jsonPath, JSON.stringify(result, null, 2) + '\n')

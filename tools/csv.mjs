// Minimal CSV/TSV reading and writing for the card export/import tools (no dependencies).

export const COLUMNS = ['deck', 'id', 'situation', 'line', 'followUp', 'tip']

const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

// UTF-8 with a BOM and CRLF line endings so Excel on Windows opens it cleanly.
export function toCsv(rows) {
  const lines = [COLUMNS.join(','), ...rows.map((row) => COLUMNS.map((c) => quote(row[c])).join(','))]
  return '﻿' + lines.join('\r\n') + '\r\n'
}

// Parses CSV (or tab-separated text pasted from a spreadsheet). Handles quoted fields
// with commas, doubled quotes, and line breaks. Returns an array of string arrays.
// Throws on broken quoting (with the line number) rather than guessing, since a guess
// can silently merge several cards into one.
export function parseDelimited(text) {
  text = text.replace(/^﻿/, '')
  const firstLine = text.slice(0, text.search(/\r?\n|$/))
  const delimiter = firstLine.includes('\t') && !firstLine.includes(',') ? '\t' : ','

  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let line = 1
  let quoteStartLine = 1

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\n') line++
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
        const next = text[i + 1]
        if (next !== undefined && next !== delimiter && next !== '\r' && next !== '\n') {
          throw new Error(
            `Line ${line}: text right after a closing quote. Put the whole field in quotes and double any quotes inside it, like "He said ""hi"" to me".`,
          )
        }
      } else {
        field += ch
      }
    } else if (ch === '"' && field === '') {
      inQuotes = true
      quoteStartLine = line
    } else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') {
        i++
        line++
      }
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (inQuotes) {
    throw new Error(`Line ${quoteStartLine}: a quote is opened but never closed.`)
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

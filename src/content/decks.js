// The decks, in the order they appear on the home screen. Their cards live in
// cards.json (edit it by exporting to a spreadsheet and importing back; see README).
//
// `text` is the color for words on top of `color`: dark on bright colors, white on deep ones.
// A deck's `id` is how cards.json and the import file refer to it, so don't rename it.

const INK = '#16183a'
const WHITE = '#ffffff'

export const decks = [
  { id: 'morning', name: 'Morning Hello', emoji: '☀️', color: '#ffb400', text: INK },
  { id: 'class', name: 'Class', emoji: '✏️', color: '#2f6bff', text: WHITE },
  { id: 'recess', name: 'Recess', emoji: '🏃', color: '#ff7a1a', text: INK },
  { id: 'lunch', name: 'Lunch', emoji: '🥪', color: '#1fbf6a', text: INK },
  { id: 'after-school', name: 'After School', emoji: '⚽', color: '#ff5fa2', text: INK },
  { id: 'goodbye', name: 'Goodbye for the Day', emoji: '👋', color: '#7b4dff', text: WHITE },
  { id: 'brain-freeze', name: 'Brain Freeze Rescue', emoji: '🧊', color: '#16c6d9', text: INK },
  { id: 'tricky', name: 'Tricky Moments', emoji: '🛟', color: '#ef4444', text: INK },
  { id: 'stand-up', name: 'Stand Up for Yourself', emoji: '💪', color: INK, text: WHITE },
]

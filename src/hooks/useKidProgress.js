import { useCallback, useEffect, useRef, useState } from 'react'
import { logPractice, saveCustomLine, setHidden, setMission, subscribeKid, subscribeKidCards } from '../lib/store'
import { currentStreak } from '../lib/streak'

const logError = (error) => console.error(error)

// Live points, streak, and per-card progress for one kid, plus the actions that change them.
export default function useKidProgress(familyCode, kidId) {
  // Each result is tagged with the kid it belongs to, so switching kids never shows stale data.
  const [kid, setKid] = useState({ for: null, doc: null })
  const [cards, setCards] = useState({ for: null, map: {} })
  const latestKid = useRef(null)

  useEffect(() => {
    if (!kidId) return
    const offKid = subscribeKid(
      familyCode,
      kidId,
      (doc) => {
        latestKid.current = doc
        setKid({ for: kidId, doc })
      },
      logError,
    )
    const offCards = subscribeKidCards(familyCode, kidId, (map) => setCards({ for: kidId, map }), logError)
    return () => {
      offKid()
      offCards()
    }
  }, [familyCode, kidId])

  const log = useCallback(
    (cardId, kind, partner) => {
      const current = latestKid.current
      if (!current || current.id !== kidId) return
      // Not awaited: offline writes resolve only after syncing, but the UI updates right away.
      logPractice(familyCode, current, cardId, kind, partner).catch(logError)
    },
    [familyCode, kidId],
  )

  const practice = useCallback((cardId, partner) => log(cardId, 'practiced', partner), [log])
  const sayForReal = useCallback((cardId) => log(cardId, 'usedForReal'), [log])
  const toggleMission = useCallback(
    (cardId, on) => setMission(familyCode, kidId, cardId, on).catch(logError),
    [familyCode, kidId],
  )
  const toggleHidden = useCallback(
    (cardId, hidden) => setHidden(familyCode, kidId, cardId, hidden).catch(logError),
    [familyCode, kidId],
  )
  const saveLine = useCallback(
    (cardId, text) => saveCustomLine(familyCode, kidId, cardId, text).catch(logError),
    [familyCode, kidId],
  )

  const ready = Boolean(kidId) && kid.for === kidId && cards.for === kidId
  const kidDoc = ready ? kid.doc : null

  return {
    loading: !ready,
    kid: kidDoc,
    cards: ready ? cards.map : {},
    streak: currentStreak(kidDoc),
    practice,
    sayForReal,
    toggleMission,
    toggleHidden,
    saveLine,
  }
}

import { useEffect, useMemo, useState } from 'react'
import { buildLibrary } from '../cards'
import { subscribeCustomCards, subscribeFamily } from '../lib/store'

// The family doc plus its card library (built-in decks merged with the family's own cards).
export default function useFamily(code) {
  const [family, setFamily] = useState({ for: null, doc: null, missing: false })
  const [customCards, setCustomCards] = useState({ for: null, list: [] })

  useEffect(() => {
    const offFamily = subscribeFamily(
      code,
      // Only trust "doesn't exist" from the server, not from an empty offline cache.
      (doc, fromCache) => setFamily({ for: code, doc, missing: !doc && !fromCache }),
      (error) => {
        console.error(error)
        setFamily({ for: code, doc: null, missing: error.code === 'permission-denied' })
      },
    )
    const offCards = subscribeCustomCards(
      code,
      (list) => setCustomCards({ for: code, list }),
      (error) => {
        console.error(error)
        setCustomCards({ for: code, list: [] })
      },
    )
    return () => {
      offFamily()
      offCards()
    }
  }, [code])

  const cardsReady = customCards.for === code
  const list = cardsReady ? customCards.list : null
  const library = useMemo(() => buildLibrary(list ?? []), [list])

  return {
    loading: family.for !== code || !cardsReady,
    family: family.for === code ? family.doc : null,
    missing: family.for === code && family.missing,
    customCards: list ?? [],
    library,
  }
}

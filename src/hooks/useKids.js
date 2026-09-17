import { useEffect, useState } from 'react'
import { subscribeKids } from '../lib/store'

export default function useKids(familyCode) {
  const [state, setState] = useState({ for: null, kids: [], error: null })

  useEffect(
    () =>
      subscribeKids(
        familyCode,
        (kids) => setState({ for: familyCode, kids, error: null }),
        (error) => {
          console.error(error)
          setState({ for: familyCode, kids: [], error })
        },
      ),
    [familyCode],
  )

  const ready = state.for === familyCode
  return { loading: !ready, kids: ready ? state.kids : [], error: ready ? state.error : null }
}

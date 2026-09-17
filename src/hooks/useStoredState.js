import { useCallback, useState } from 'react'

// A string in localStorage that survives reloads (null removes it).
export default function useStoredState(key, initial = null) {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) ?? initial
    } catch {
      return initial
    }
  })

  const update = useCallback(
    (next) => {
      setValue(next)
      try {
        if (next == null) localStorage.removeItem(key)
        else localStorage.setItem(key, next)
      } catch {
        // Storage blocked: fine for this session.
      }
    },
    [key],
  )

  return [value, update]
}

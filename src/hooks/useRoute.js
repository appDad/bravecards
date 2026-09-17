import { useCallback, useEffect, useState } from 'react'

const readHash = () => window.location.hash.replace(/^#/, '') || '/'

// Tiny hash router so the phone's back button moves between screens.
export default function useRoute() {
  const [path, setPath] = useState(readHash)

  useEffect(() => {
    const sync = () => setPath(readHash())
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  const navigate = useCallback((to, { replace = false } = {}) => {
    const depth = (window.history.state?.depth ?? 0) + (replace ? 0 : 1)
    window.history[replace ? 'replaceState' : 'pushState']({ depth }, '', `#${to}`)
    setPath(to)
  }, [])

  // In-app back: pop our own history entry if there is one, otherwise jump to fallback.
  const goBack = useCallback(
    (fallback = '/') => {
      if ((window.history.state?.depth ?? 0) > 0) window.history.back()
      else navigate(fallback, { replace: true })
    },
    [navigate],
  )

  return { path, navigate, goBack }
}

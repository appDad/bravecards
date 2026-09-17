import { lazy, Suspense, useEffect, useState } from 'react'
import FamilyGate from './components/FamilyGate'
import Home from './components/Home'
import MathGate from './components/MathGate'
import Practice from './components/Practice'
import ProfilePicker from './components/ProfilePicker'
import Settings from './components/Settings'
import Splash from './components/Splash'
import TrophyRoom from './components/TrophyRoom'
import useFamily from './hooks/useFamily'
import useKidProgress from './hooks/useKidProgress'
import useKids from './hooks/useKids'
import useRoute from './hooks/useRoute'
import useStoredState from './hooks/useStoredState'

// Admin (and the Firebase Auth SDK) only loads when someone opens it.
const AdminPanel = lazy(() => import('./components/AdminPanel'))

export default function App() {
  const route = useRoute()
  const [familyCode, setFamilyCode] = useStoredState('bravecards.family')
  const [gateNote, setGateNote] = useState(null)
  const [, screen] = route.path.split('/')

  if (screen === 'admin') {
    return (
      <Screen>
        <Suspense fallback={<Splash />}>
          <AdminPanel
            onExit={() => route.goBack('/')}
            onOpenFamily={(code) => {
              setFamilyCode(code)
              route.navigate('/', { replace: true })
            }}
          />
        </Suspense>
      </Screen>
    )
  }

  if (!familyCode) {
    return (
      <FamilyGate
        note={gateNote}
        onEnter={(code) => {
          setGateNote(null)
          setFamilyCode(code)
        }}
        onAdmin={() => route.navigate('/admin')}
      />
    )
  }

  return (
    <FamilyApp
      key={familyCode}
      code={familyCode}
      route={route}
      onLeave={(note) => {
        setGateNote(note ?? null)
        setFamilyCode(null)
        route.navigate('/', { replace: true })
      }}
    />
  )
}

function FamilyApp({ code, route, onLeave }) {
  const { path, navigate, goBack } = route
  const { family, missing, customCards, library, loading: familyLoading } = useFamily(code)
  const { kids, loading: kidsLoading, error } = useKids(code)
  const [kidId, setKidId] = useStoredState('bravecards.kid')
  const kidExists = kids.some((k) => k.id === kidId)
  const progress = useKidProgress(code, kidExists ? kidId : null)
  const [settingsUnlocked, setSettingsUnlocked] = useState(false)
  const [, screen, param] = path.split('/')

  // Relock as soon as settings is left by any route (in-app back, phone back button, URL),
  // so a kid can't walk back in after a grown-up solved the problem.
  if (settingsUnlocked && screen !== 'settings') setSettingsUnlocked(false)

  useEffect(() => {
    if (missing) onLeave('That family code no longer works. Enter a new one.')
  }, [missing, onLeave])

  let content
  if (familyLoading || kidsLoading || missing) {
    content = <Splash />
  } else if (screen === 'settings') {
    content = settingsUnlocked ? (
      <Settings
        code={code}
        family={family}
        kids={kids}
        customCards={customCards}
        library={library}
        onBack={() => goBack('/')}
        onLeaveFamily={() => onLeave()}
      />
    ) : (
      <MathGate familyCode={code} onUnlock={() => setSettingsUnlocked(true)} onCancel={() => goBack('/')} />
    )
  } else if (!kidExists || screen === 'kids') {
    content = (
      <ProfilePicker
        code={code}
        family={family}
        kids={kids}
        error={error}
        onPick={(id) => {
          setKidId(id)
          if (screen === 'kids') goBack('/')
        }}
        onSettings={() => navigate('/settings')}
      />
    )
  } else if (progress.loading) {
    content = <Splash />
  } else if (screen === 'practice' && (param === 'random' || param === 'missions' || library.categoryById[param])) {
    content = (
      <Practice key={param} deckId={param} library={library} progress={progress} onExit={() => goBack('/')} />
    )
  } else if (screen === 'trophies') {
    content = <TrophyRoom library={library} progress={progress} onBack={() => goBack('/')} />
  } else {
    content = (
      <Home
        library={library}
        progress={progress}
        onOpenDeck={(id) => navigate(`/practice/${id}`)}
        onTrophies={() => navigate('/trophies')}
        onSwitchKid={() => navigate('/kids')}
      />
    )
  }

  return <Screen>{content}</Screen>
}

function Screen({ children }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(14px,env(safe-area-inset-top))] pb-[max(18px,env(safe-area-inset-bottom))]">
      {children}
    </main>
  )
}

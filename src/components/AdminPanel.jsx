import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { ADMIN_EMAIL, auth, authErrorMessage, isAdminUser, signInAdmin, signOutAdmin } from '../lib/admin'
import { createFamily, deleteFamily, renameFamily, subscribeFamilies } from '../lib/store'
import { MAX_CODE, MIN_CODE } from './CodePad'
import Sheet from './Sheet'

const randomCode = () => String(Math.floor(100000 + Math.random() * 900000))

export default function AdminPanel({ onExit, onOpenFamily }) {
  const [user, setUser] = useState(undefined) // undefined = still checking
  const [error, setError] = useState(null)

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  const signIn = async () => {
    setError(null)
    try {
      await signInAdmin()
    } catch (err) {
      setError(authErrorMessage(err))
    }
  }

  return (
    <div className="flex flex-1 flex-col pb-6">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExit}
          aria-label="Back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-[0_3px_0_rgb(22_24_58/0.14)] transition-transform active:scale-90"
        >
          ←
        </button>
        <h1 className="font-display text-3xl">Admin</h1>
        {user && (
          <button
            type="button"
            onClick={() => signOutAdmin()}
            className="ml-auto min-h-11 rounded-full px-3 text-sm font-bold text-ink-soft"
          >
            Sign out
          </button>
        )}
      </header>

      {user === undefined && <p className="mt-10 text-center text-ink-soft">Checking sign-in…</p>}

      {user === null && (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-[28px] bg-white p-6 text-center">
          <p className="font-display text-2xl">Manage family codes</p>
          <p className="text-ink-soft">Only {ADMIN_EMAIL} can sign in here.</p>
          <button type="button" onClick={signIn} className="btn3d w-full" style={{ '--c': '#ffc833' }}>
            <GoogleIcon /> Sign in with Google
          </button>
        </div>
      )}

      {user && !isAdminUser(user) && (
        <div className="mt-10 rounded-[28px] bg-white p-6 text-center">
          <p className="font-display text-2xl">Not an admin account</p>
          <p className="mt-2 text-ink-soft">
            You're signed in as {user.email}. Sign out and use {ADMIN_EMAIL}.
          </p>
        </div>
      )}

      {error && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-center font-bold text-rose-700">{error}</p>}

      {isAdminUser(user) && <Families onOpenFamily={onOpenFamily} />}
    </div>
  )
}

function Families({ onOpenFamily }) {
  const [families, setFamilies] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState(randomCode)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [renaming, setRenaming] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(
    () =>
      subscribeFamilies(setFamilies, (err) => {
        console.error(err)
        setLoadError('Could not load families. Are the Firestore rules deployed?')
      }),
    [],
  )

  const validCode = new RegExp(`^\\d{${MIN_CODE},${MAX_CODE}}$`).test(code)

  const create = async (e) => {
    e.preventDefault()
    if (!name.trim() || !validCode) return
    setSaving(true)
    setFormError(null)
    try {
      await createFamily(code, name.trim())
      setName('')
      setCode(randomCode())
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <form onSubmit={create} className="mt-6 flex flex-col gap-3 rounded-[28px] bg-white p-5">
        <h2 className="font-display text-2xl">New family</h2>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-ink-soft">Family name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="The Rivera family"
            className="h-12 rounded-2xl border-[3px] border-ink/15 px-4 text-lg outline-none focus:border-ink"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-ink-soft">
            Code ({MIN_CODE}–{MAX_CODE} digits)
          </span>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, MAX_CODE))}
              inputMode="numeric"
              className="h-12 min-w-0 flex-1 rounded-2xl border-[3px] border-ink/15 px-4 font-display text-2xl tracking-[0.2em] outline-none focus:border-ink"
            />
            <button
              type="button"
              onClick={() => setCode(randomCode())}
              aria-label="Make a random code"
              className="h-12 w-12 rounded-2xl bg-sky text-2xl transition-transform active:scale-90"
            >
              🎲
            </button>
          </div>
          <span className="text-xs text-ink-soft">
            The code is the family's key, so longer is safer. 6+ digits for families outside your own.
          </span>
        </label>
        {formError && <p className="font-bold text-rose-600">{formError}</p>}
        <button
          type="submit"
          disabled={!name.trim() || !validCode || saving}
          className="btn3d w-full"
          style={{ '--c': '#1fbf6a' }}
        >
          {saving ? 'Creating…' : 'Create family'}
        </button>
      </form>

      <h2 className="mt-8 font-display text-2xl">Families</h2>
      {loadError && <p className="mt-2 font-bold text-rose-600">{loadError}</p>}
      {families === null && !loadError && <p className="mt-2 text-ink-soft">Loading…</p>}
      {families?.length === 0 && <p className="mt-2 text-ink-soft">No families yet.</p>}
      <ul className="mt-3 flex flex-col gap-3">
        {families?.map((family) => (
          <li key={family.id} className="rounded-2xl bg-white p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-lg font-bold">{family.name}</p>
              <p className="font-display text-2xl tracking-[0.15em]">{family.id}</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button type="button" className="btn3d min-h-11 px-2 text-base" onClick={() => onOpenFamily(family.id)}>
                Open
              </button>
              <button type="button" className="btn3d min-h-11 px-2 text-base" onClick={() => setRenaming(family)}>
                Rename
              </button>
              <button
                type="button"
                className="btn3d min-h-11 px-2 text-base text-rose-600"
                onClick={() => setDeleting(family)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {renaming && <RenameSheet family={renaming} onClose={() => setRenaming(null)} />}
      {deleting && <DeleteSheet family={deleting} onClose={() => setDeleting(null)} />}
    </>
  )
}

function RenameSheet({ family, onClose }) {
  const [name, setName] = useState(family.name)
  const save = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    renameFamily(family.id, name.trim()).catch((err) => console.error(err))
    onClose()
  }
  return (
    <Sheet title="Rename family" onClose={onClose}>
      <form onSubmit={save} className="mt-4 flex flex-col gap-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoFocus
          className="h-14 rounded-2xl border-[3px] border-ink/15 px-4 text-xl outline-none focus:border-ink"
        />
        <button type="submit" disabled={!name.trim()} className="btn3d w-full" style={{ '--c': '#ffc833' }}>
          Save
        </button>
      </form>
    </Sheet>
  )
}

function DeleteSheet({ family, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const remove = async () => {
    setBusy(true)
    try {
      await deleteFamily(family.id)
      onClose()
    } catch (err) {
      console.error(err)
      setError('Delete failed. Try again.')
      setBusy(false)
    }
  }
  return (
    <Sheet title={`Delete ${family.name}?`} onClose={busy ? () => {} : onClose}>
      <p className="mt-2 text-ink-soft">
        This deletes code {family.id}, all its kids, their progress, and the family's own cards. It can't be undone.
      </p>
      {error && <p className="mt-2 font-bold text-rose-600">{error}</p>}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" className="btn3d" onClick={onClose} disabled={busy}>
          Keep
        </button>
        <button type="button" className="btn3d text-white" style={{ '--c': '#e11d48' }} onClick={remove} disabled={busy}>
          {busy ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Sheet>
  )
}

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.3 5.7c4.3-3.9 7-9.8 7-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.5 0 20.1 0 24s1 7.5 2.6 10.8l7.9-6.2z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.2C6.6 42.6 14.6 48 24 48z" />
    </svg>
  )
}

import { GoogleAuthProvider, getAuth, signInWithPopup, signOut } from 'firebase/auth'
import { app } from '../firebase'

// Must match the email in firestore.rules, which is what actually enforces this.
export const ADMIN_EMAIL = 'egabel@gmail.com'

export const auth = getAuth(app)

export const isAdminUser = (user) => user?.email === ADMIN_EMAIL && user.emailVerified

export function signInAdmin() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return signInWithPopup(auth, provider)
}

export const signOutAdmin = () => signOut(auth)

export function authErrorMessage(error) {
  switch (error?.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null
    case 'auth/popup-blocked':
      return 'The sign-in window was blocked. Allow pop-ups for this site and try again.'
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'Google sign-in is not turned on yet. In the Firebase console: Authentication > Sign-in method > Google > Enable.'
    case 'auth/unauthorized-domain':
      return 'This web address is not allowed to sign in. Add it in Firebase console: Authentication > Settings > Authorized domains.'
    default:
      return error?.message || 'Sign-in failed.'
  }
}

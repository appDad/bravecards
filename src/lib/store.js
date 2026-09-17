import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  deleteField,
} from 'firebase/firestore'
import { db } from '../firebase'
import { POINTS, streakPatch } from './streak'

// Data layout. The family code is the family's document id, and it's the secret:
// Firestore rules let anyone who knows a code open that family, but nobody can list codes.
//
//   families/{code}                               name, createdAt
//   families/{code}/kids/{kidId}                  name, avatar, color, points, streak, lastPracticeDate, createdAt
//   families/{code}/kids/{kidId}/cards/{cardId}   practiced, practicedWithParent, practicedWithFriend,
//                                                 usedForReal, mission, liked, hidden, lastPracticed, customLine
//   families/{code}/customCards/{cardId}          categoryId, situation, line, followUp, tip, createdAt

const familyRef = (code) => doc(db, 'families', code)
const kidsCol = (code) => collection(db, 'families', code, 'kids')
const kidRef = (code, kidId) => doc(db, 'families', code, 'kids', kidId)
const kidCardsCol = (code, kidId) => collection(db, 'families', code, 'kids', kidId, 'cards')
const customCardsCol = (code) => collection(db, 'families', code, 'customCards')
const withId = (snap) => ({ id: snap.id, ...snap.data() })

// ---- Families ----

export async function familyExists(code) {
  return (await getDoc(familyRef(code))).exists()
}

// onData(family or null, fromCache)
export const subscribeFamily = (code, onData, onError) =>
  onSnapshot(familyRef(code), (snap) => onData(snap.exists() ? withId(snap) : null, snap.metadata.fromCache), onError)

// Admin only (enforced by Firestore rules). onData(families, fromCache); a non-admin gets
// onError with code 'permission-denied', which is how the app learns who is an admin.
// includeMetadataChanges: the server's confirmation of an already-cached list changes only
// fromCache, and without this option Firestore wouldn't send that snapshot at all.
export const subscribeFamilies = (onData, onError) =>
  onSnapshot(
    query(collection(db, 'families'), orderBy('createdAt')),
    { includeMetadataChanges: true },
    (snap) => onData(snap.docs.map(withId), snap.metadata.fromCache),
    onError,
  )

export async function createFamily(code, name) {
  if (await familyExists(code)) throw new Error('That code is already in use.')
  await setDoc(familyRef(code), { name, createdAt: Date.now() })
}

export const renameFamily = (code, name) => updateDoc(familyRef(code), { name })

export async function deleteFamily(code) {
  const refs = []
  const kids = await getDocs(kidsCol(code))
  for (const kid of kids.docs) {
    const cards = await getDocs(kidCardsCol(code, kid.id))
    refs.push(...cards.docs.map((d) => d.ref), kid.ref)
  }
  const customCards = await getDocs(customCardsCol(code))
  refs.push(...customCards.docs.map((d) => d.ref), familyRef(code))
  await deleteInChunks(refs)
}

async function deleteInChunks(refs) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db)
    refs.slice(i, i + 400).forEach((ref) => batch.delete(ref))
    await batch.commit()
  }
}

// ---- Kids ----

export const subscribeKids = (code, onData, onError) =>
  onSnapshot(query(kidsCol(code), orderBy('createdAt')), (snap) => onData(snap.docs.map(withId)), onError)

export const subscribeKid = (code, kidId, onData, onError) =>
  onSnapshot(kidRef(code, kidId), (snap) => onData(snap.exists() ? withId(snap) : null), onError)

export const subscribeKidCards = (code, kidId, onData, onError) =>
  onSnapshot(
    kidCardsCol(code, kidId),
    (snap) => onData(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))),
    onError,
  )

export const addKid = (code, { name, avatar, color }) =>
  addDoc(kidsCol(code), { name, avatar, color, points: 0, streak: 0, lastPracticeDate: null, createdAt: Date.now() })

export const updateKid = (code, kidId, { name, avatar, color }) => updateDoc(kidRef(code, kidId), { name, avatar, color })

export async function removeKid(code, kidId) {
  const cards = await getDocs(kidCardsCol(code, kidId))
  await deleteInChunks([...cards.docs.map((d) => d.ref), kidRef(code, kidId)])
}

// ---- Practice ----

// kind: 'practiced' (with partner 'parent' | 'friend') or 'usedForReal'.
export function logPractice(code, kid, cardId, kind, partner) {
  const cardUpdate = { [kind]: increment(1), lastPracticed: serverTimestamp() }
  if (kind === 'practiced') {
    cardUpdate[partner === 'friend' ? 'practicedWithFriend' : 'practicedWithParent'] = increment(1)
  } else {
    cardUpdate.mission = false // doing it for real completes the mission
  }

  const batch = writeBatch(db)
  batch.update(kidRef(code, kid.id), { points: increment(POINTS[kind]), ...streakPatch(kid) })
  batch.set(doc(kidCardsCol(code, kid.id), cardId), cardUpdate, { merge: true })
  return batch.commit()
}

export const setMission = (code, kidId, cardId, on) =>
  setDoc(doc(kidCardsCol(code, kidId), cardId), { mission: on }, { merge: true })

// 👍 / 👎 for one kid: 'up' (dealt more often), 'down' (buried), or null (neither).
// 👎 is stored as `hidden` so cards hidden before burying existed stay buried.
export const setRating = (code, kidId, cardId, rating) =>
  setDoc(doc(kidCardsCol(code, kidId), cardId), { liked: rating === 'up', hidden: rating === 'down' }, { merge: true })

export const saveCustomLine = (code, kidId, cardId, text) =>
  setDoc(doc(kidCardsCol(code, kidId), cardId), { customLine: text || deleteField() }, { merge: true })

// ---- Family's own cards ----

export const subscribeCustomCards = (code, onData, onError) =>
  onSnapshot(query(customCardsCol(code), orderBy('createdAt')), (snap) => onData(snap.docs.map(withId)), onError)

const cardFields = ({ categoryId, situation, line, followUp, tip }) => ({
  categoryId,
  situation: situation.trim(),
  line: line.trim(),
  followUp: followUp?.trim() ?? '',
  tip: tip?.trim() ?? '',
})

export const addCustomCard = (code, card) => addDoc(customCardsCol(code), { ...cardFields(card), createdAt: Date.now() })

export const updateCustomCard = (code, cardId, card) => updateDoc(doc(customCardsCol(code), cardId), cardFields(card))

export const removeCustomCard = (code, cardId) => deleteDoc(doc(customCardsCol(code), cardId))

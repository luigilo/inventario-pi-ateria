import { db } from './firebase'
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc, serverTimestamp, setDoc } from 'firebase/firestore'

const colRef = collection(db, 'users')

export async function listUsers() {
  const snapshot = await getDocs(colRef)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Crea/actualiza un documento de usuario (no crea la cuenta de Auth)
export async function upsertUserDoc(id, data) {
  const ref = doc(db, 'users', id)
  await setDoc(ref, { ...data, updatedAt: Date.now(), createdAt: data.createdAt || Date.now() }, { merge: true })
}

export async function createUserDoc(data) {
  // Si no tienes un UID aún, crea un doc sin relación con Auth (no recomendado).
  // Idealmente usar el UID de Authentication como id.
  const ref = await addDoc(colRef, { ...data, createdAt: Date.now(), updatedAt: Date.now() })
  return ref.id
}

export async function updateUserDoc(id, data) {
  const ref = doc(db, 'users', id)
  await updateDoc(ref, { ...data, updatedAt: Date.now() })
}

export async function deleteUserDoc(id) {
  const ref = doc(db, 'users', id)
  await deleteDoc(ref)
}

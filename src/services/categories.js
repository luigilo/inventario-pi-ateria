import { db } from './firebase'
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc } from 'firebase/firestore'

const colRef = collection(db, 'categories')

export async function listCategories() {
  const snapshot = await getDocs(colRef)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createCategory(data) {
  const ref = await addDoc(colRef, {
    name: data.name || '',
    description: data.description || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
  return ref.id
}

export async function updateCategory(id, data) {
  const ref = doc(db, 'categories', id)
  await updateDoc(ref, { ...data, updatedAt: Date.now() })
}

export async function deleteCategory(id) {
  const ref = doc(db, 'categories', id)
  await deleteDoc(ref)
}

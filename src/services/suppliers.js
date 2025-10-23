import { db } from './firebase'
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc } from 'firebase/firestore'

const colRef = collection(db, 'suppliers')

export async function listSuppliers() {
  const snapshot = await getDocs(colRef)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createSupplier(data) {
  const ref = await addDoc(colRef, {
    name: data.name || '',
    description: data.description || '',
    contact: data.contact || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
  return ref.id
}

export async function updateSupplier(id, data) {
  const ref = doc(db, 'suppliers', id)
  await updateDoc(ref, { ...data, updatedAt: Date.now() })
}

export async function deleteSupplier(id) {
  const ref = doc(db, 'suppliers', id)
  await deleteDoc(ref)
}

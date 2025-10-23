import { db } from './firebase'
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc } from 'firebase/firestore'

const colRef = collection(db, 'customers')

export async function listCustomers() {
  const snap = await getDocs(colRef)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createCustomer(data) {
  const payload = {
    name: data.name || '',
    document: data.document || '',
    email: data.email || '',
    phone: data.phone || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const ref = await addDoc(colRef, payload)
  return { id: ref.id, ...payload }
}

export async function updateCustomer(id, data) {
  await updateDoc(doc(db, 'customers', id), { ...data, updatedAt: Date.now() })
}

export async function deleteCustomer(id) {
  await deleteDoc(doc(db, 'customers', id))
}

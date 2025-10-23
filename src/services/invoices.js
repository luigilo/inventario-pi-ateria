import { db } from './firebase'
import { collection, addDoc, getDocs, getDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore'

const colRef = collection(db, 'invoices')

export async function listInvoices() {
  const snap = await getDocs(colRef)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getInvoice(id) {
  const snap = await getDoc(doc(db, 'invoices', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createInvoice(data) {
  const payload = {
    customerName: data.customerName || '',
    customerId: data.customerId || '',
    customerEmail: data.customerEmail || '',
    number: typeof data.number === 'number' ? data.number : null,
    items: Array.isArray(data.items) ? data.items : [],
    subtotal: Number(data.subtotal || 0),
    total: Number(data.total || 0),
    notes: data.notes || '',
    userId: data.userId || null,
    userEmail: data.userEmail || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const ref = await addDoc(colRef, payload)
  return ref.id
}

export async function updateInvoice(id, data) {
  await updateDoc(doc(db, 'invoices', id), { ...data, updatedAt: Date.now() })
}

export async function deleteInvoice(id) {
  await deleteDoc(doc(db, 'invoices', id))
}

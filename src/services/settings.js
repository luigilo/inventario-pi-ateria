import { db } from './firebase'
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore'

const storeDocRef = doc(db, 'settings', 'store')
const countersDocRef = doc(db, 'counters', 'invoices')

export async function getStoreSettings() {
  const snap = await getDoc(storeDocRef)
  return snap.exists() ? snap.data() : { name: 'Happy Happy Piñatería', nit: '', address: '', phone: '', logo: '/logoHappy.jpeg' }
}

export async function updateStoreSettings(data) {
  await setDoc(storeDocRef, { ...data, updatedAt: Date.now() }, { merge: true })
}

export async function nextInvoiceNumber() {
  const num = await runTransaction(db, async (tx) => {
    const cSnap = await tx.get(countersDocRef)
    const curr = cSnap.exists() ? Number(cSnap.data().seq || 0) : 0
    const next = curr + 1
    tx.set(countersDocRef, { seq: next, updatedAt: Date.now() }, { merge: true })
    return next
  })
  return num
}

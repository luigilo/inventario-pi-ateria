 import { db } from './firebase'
 import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, updateDoc, increment, getDoc } from 'firebase/firestore'

 const movementsRef = collection(db, 'stock_movements')

export async function addMovement({ productId, type, units, note }) {
  const unitsNum = Number(units || 0)
  if (!productId || !unitsNum || !['in', 'out'].includes(type)) {
    throw new Error('Datos de movimiento inválidos')
  }
  const prodRef = doc(db, 'products', productId)
  const delta = type === 'in' ? unitsNum : -unitsNum
  await updateDoc(prodRef, { quantity: increment(delta), updatedAt: Date.now() })
  await addDoc(movementsRef, {
    productId,
    type,
    units: unitsNum,
    note: note || '',
    createdAt: serverTimestamp(),
  })
}

export async function listMovements() {
  const q = query(movementsRef, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  const items = []
  // cache product names
  const names = {}
  for (const d of snap.docs) {
    const data = d.data()
    let productName = ''
    if (data.productId) {
      if (!names[data.productId]) {
        const pSnap = await getDoc(doc(db, 'products', data.productId))
        names[data.productId] = pSnap.exists() ? pSnap.data().name : '(eliminado)'
      }
      productName = names[data.productId]
    }
    items.push({ id: d.id, ...data, productName })
  }
  return items
}

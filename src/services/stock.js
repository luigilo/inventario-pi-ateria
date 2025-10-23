 import { db } from './firebase'
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, updateDoc, increment, getDoc } from 'firebase/firestore'

const movementsRef = collection(db, 'stock_movements')

export async function addMovement({ productId, type, units, note, saleType, priceAtSale, total, userId, userEmail, costAtEntry, totalCost, invoiceId }) {
  const unitsNum = Number(units || 0)
  if (!productId || !unitsNum || !['in', 'out'].includes(type)) {
    throw new Error('Datos de movimiento inválidos')
  }
  const prodRef = doc(db, 'products', productId)
  const delta = type === 'in' ? unitsNum : -unitsNum

  // Leer producto actual para cálculos de costo promedio en entradas
  let current = {}
  try {
    const snap = await getDoc(prodRef)
    current = snap.exists() ? snap.data() : {}
  } catch {
    current = {}
  }

  if (type === 'in') {
    const currQty = Number(current.quantity || 0)
    const currCost = Number(current.cost || 0)
    const unitCost = Number(costAtEntry || 0)
    const nextQty = currQty + unitsNum
    let nextCost = currCost
    if (unitCost > 0 && nextQty > 0) {
      // costo promedio ponderado
      nextCost = Math.round(((currQty * currCost) + (unitsNum * unitCost)) / nextQty)
    }
    await updateDoc(prodRef, { quantity: increment(delta), cost: nextCost, updatedAt: Date.now() })
  } else {
    await updateDoc(prodRef, { quantity: increment(delta), updatedAt: Date.now() })
  }
  // preparar payload
  const isSale = type === 'out'
  const price = isSale ? Number(priceAtSale || 0) : null
  const movementTotal = isSale ? Number(total ?? unitsNum * Number(priceAtSale || 0)) : null
  const unitCost = !isSale ? Number(costAtEntry || 0) : null
  const movementTotalCost = !isSale ? Number(totalCost ?? unitsNum * Number(costAtEntry || 0)) : null
  await addDoc(movementsRef, {
    productId,
    type,
    units: unitsNum,
    note: note || '',
    invoiceId: invoiceId || null,
    saleType: isSale ? (saleType === 'mayor' ? 'mayor' : 'detal') : null,
    priceAtSale: isSale ? price : null,
    total: isSale ? movementTotal : null,
    costAtEntry: !isSale ? unitCost : null,
    totalCost: !isSale ? movementTotalCost : null,
    userId: userId || null,
    userEmail: userEmail || null,
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

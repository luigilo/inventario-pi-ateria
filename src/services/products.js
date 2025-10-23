import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc } from 'firebase/firestore'
import { db } from './firebase'

const colRef = collection(db, 'products')

export async function listProducts() {
  const snapshot = await getDocs(colRef)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createProduct(data) {
  const ref = await addDoc(colRef, {
    name: data.name || '',
    category: data.category || '',
    price: Number(data.price || 0),
    quantity: Number(data.quantity || 0),
    supplier: data.supplier || '',
    description: data.description || '',
    imageUrl: data.imageUrl || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
  return ref.id
}

export async function updateProduct(id, data) {
  const ref = doc(db, 'products', id)
  await updateDoc(ref, { ...data, updatedAt: Date.now() })
}

export async function deleteProduct(id) {
  const ref = doc(db, 'products', id)
  await deleteDoc(ref)
}

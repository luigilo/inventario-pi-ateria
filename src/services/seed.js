import { db } from './firebase'
import { collection, addDoc, setDoc, doc } from 'firebase/firestore'

export async function seedCategories() {
  const categories = [
    { name: 'Piñatas', description: 'Piñatas para fiestas' },
    { name: 'Globos', description: 'Globos de todo tipo' },
    { name: 'Disfraces', description: 'Disfraces infantiles' },
    { name: 'Dulces', description: 'Dulces y confitería' },
    { name: 'Decoración', description: 'Decoración y accesorios' },
  ]
  const col = collection(db, 'categories')
  for (const c of categories) {
    await addDoc(col, { ...c, createdAt: Date.now(), updatedAt: Date.now() })
  }
}

export async function seedSuppliers() {
  const suppliers = [
    { name: 'Proveedor A', description: 'Mayorista A', contact: 'contacto@a.com' },
    { name: 'Proveedor B', description: 'Mayorista B', contact: 'contacto@b.com' },
  ]
  const col = collection(db, 'suppliers')
  for (const s of suppliers) {
    await addDoc(col, { ...s, createdAt: Date.now(), updatedAt: Date.now() })
  }
}

export async function seedSampleProducts() {
  const products = [
    { name: 'Piñata Unicornio', category: 'Piñatas', price: 25, quantity: 10, supplier: 'Proveedor A', description: 'Piñata temática unicornio', imageUrl: '' },
    { name: 'Pack Globos', category: 'Globos', price: 8, quantity: 50, supplier: 'Proveedor B', description: 'Pack de 50 globos', imageUrl: '' },
  ]
  const col = collection(db, 'products')
  for (const p of products) {
    await addDoc(col, { ...p, createdAt: Date.now(), updatedAt: Date.now() })
  }
}

export async function ensureUserRole(uid, role = 'admin') {
  if (!uid) return
  await setDoc(doc(db, 'users', uid), { role }, { merge: true })
}

export async function seedAll(uid) {
  await seedCategories()
  await seedSuppliers()
  await seedSampleProducts()
  if (uid) {
    await ensureUserRole(uid, 'admin')
  }
}

import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

const colRef = collection(db, "products");

export async function listProducts() {
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createProduct(data) {
  const ref = await addDoc(colRef, {
    name: data.name || "",
    category: data.category || "",
    price: Number(data.price || 0),
    cost: Number(data.cost || 0),
    quantity: Number(data.quantity || 0),
    supplier: data.supplier || "",
    description: data.description || "",
    imageUrl: data.imageUrl || "",
    profit: Number(data.price || 0) - Number(data.cost || 0),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return ref.id;
}

export async function updateProduct(id, data) {
  const ref = doc(db, "products", id);
  let patch = { ...data };
  if (Object.prototype.hasOwnProperty.call(data, "price") || Object.prototype.hasOwnProperty.call(data, "cost")) {
    const snap = await getDoc(ref);
    const current = snap.exists() ? snap.data() : {};
    const price = Object.prototype.hasOwnProperty.call(data, "price") ? Number(data.price || 0) : Number(current.price || 0);
    const cost = Object.prototype.hasOwnProperty.call(data, "cost") ? Number(data.cost || 0) : Number(current.cost || 0);
    patch.profit = price - cost;
  }
  await updateDoc(ref, { ...patch, updatedAt: Date.now() });
}

export async function deleteProduct(id) {
  const ref = doc(db, "products", id);
  await deleteDoc(ref);
}

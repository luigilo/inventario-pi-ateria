import { storage } from './firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

export async function uploadProductImage(file, productId = 'tmp') {
  const ext = file.name?.split('.').pop() || 'bin'
  const ts = Date.now()
  const storageRef = ref(storage, `products/${productId}/${ts}.${ext}`)
  const snap = await uploadBytes(storageRef, file)
  const url = await getDownloadURL(snap.ref)
  return url
}

 export async function deleteByUrl(url) {
   try {
     const fileRef = ref(storage, url)
     await deleteObject(fileRef)
   } catch {
     // ignore if not found or invalid
   }
 }

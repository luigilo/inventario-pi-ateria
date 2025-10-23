export async function uploadProductImage(file, productId = 'tmp') {
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Faltan variables de entorno de Cloudinary (VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET)')
  }
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)
  form.append('folder', `products/${productId}`)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    let detail = ''
    try {
      const j = await res.json()
      detail = j?.error?.message || ''
    } catch {}
    throw new Error(`No se pudo subir imagen a Cloudinary. ${detail}`.trim())
  }
  const data = await res.json()
  return data.secure_url
}

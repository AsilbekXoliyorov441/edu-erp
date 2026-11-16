const LONG_SIDE = 1600

/** Shrinks a photo to a JPEG at most `LONG_SIDE` px on its long side — phone photos are
 * several MB, and a smaller picture uploads faster and is cheaper for the AI to read while
 * handwriting stays legible. PDFs, small images and pictures the browser can't decode (e.g.
 * HEIC outside Safari) are returned as they are. */
export async function shrinkImage(file) {
  if (!file.type.startsWith('image/') || file.size < 400 * 1024) return file
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('bad image'))
      el.src = url
    })
    const k = Math.min(1, LONG_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * k)
    canvas.height = Math.round(img.naturalHeight * k)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.85),
    )
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(url)
  }
}

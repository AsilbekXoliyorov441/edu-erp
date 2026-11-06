import { useState } from 'react'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import { api } from '@convex/_generated/api'
import { useAuthStore } from '@/entities/session/model/store'

const SIZE = 384

/** Center-crops the picked image to a square and shrinks it to a small JPEG, so photos stay
 * light no matter what the phone camera produced. */
async function toSquareJpeg(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('bad image'))
      el.src = url
    })
    const side = Math.min(img.naturalWidth, img.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const g = canvas.getContext('2d')
    g.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIZE, SIZE)
    return await new Promise((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))), 'image/jpeg', 0.86),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Student: upload or remove their own profile photo. */
export function useAvatarUpload() {
  const token = useAuthStore((s) => s.token)
  const generateUrl = useMutation(api.students.generateAvatarUploadUrl)
  const setAvatar = useMutation(api.students.setMyAvatar)
  const removeAvatar = useMutation(api.students.removeMyAvatar)
  const [busy, setBusy] = useState(false)

  const upload = async (file) => {
    if (!file) return null
    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm fayl tanlang')
      return null
    }
    setBusy(true)
    try {
      const blob = await toSquareJpeg(file)
      const uploadUrl = await generateUrl({ token })
      const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob })
      if (!res.ok) throw new Error('upload failed')
      const { storageId } = await res.json()
      const url = await setAvatar({ token, storageId })
      toast.success('Rasm saqlandi')
      return url
    } catch (err) {
      toast.error(err?.data ?? 'Rasmni yuklab bo\'lmadi')
      return null
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await removeAvatar({ token })
      toast.success("Rasm o'chirildi")
    } catch (err) {
      toast.error(err?.data ?? 'Xatolik yuz berdi')
    } finally {
      setBusy(false)
    }
  }

  return { upload, remove, busy }
}

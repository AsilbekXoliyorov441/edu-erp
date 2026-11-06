import { useState } from 'react'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { useAvatarUpload } from '@/features/upload-avatar/model/useAvatarUpload'
import { cn } from '@/shared/lib/utils'

/** Hidden file input + a trigger. `children(open, busy)` renders a custom trigger; without it a
 * small camera badge is shown (meant to sit on the corner of an avatar). */
export function AvatarUploadButton({ children, onUploaded, className }) {
  // The input element is kept in state (not a ref) so `open` can be handed to render props.
  const [input, setInput] = useState(null)
  const { upload, busy } = useAvatarUpload()
  const open = () => input?.click()

  return (
    <>
      <input
        ref={setInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          const url = await upload(file)
          if (url) onUploaded?.(url)
        }}
      />
      {children ? (
        children(open, busy)
      ) : (
        <button
          type="button"
          onClick={open}
          disabled={busy}
          aria-label="Rasm yuklash"
          title="Rasm yuklash"
          className={cn(
            'flex size-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background transition-transform hover:scale-110 disabled:opacity-60',
            className,
          )}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
        </button>
      )}
    </>
  )
}

export function AvatarRemoveButton({ className }) {
  const { remove, busy } = useAvatarUpload()
  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className={cn(
        'flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive disabled:opacity-60',
        className,
      )}
    >
      <Trash2 className="size-3.5" /> Rasmni o'chirish
    </button>
  )
}

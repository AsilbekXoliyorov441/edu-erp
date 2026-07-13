import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Circle, Code2, ImagePlus, Loader2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Switch } from '@/shared/ui/switch'
import { CodeBlock } from '@/shared/ui/code-block'
import { cn } from '@/shared/lib/utils'
import { useQuestionsForTest, useUploadQuestionImage } from '@/entities/test-question/model/store'

const OPTION_LETTERS = ['A', 'B', 'C', 'D']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/** Mounted only while the dialog is open, so its field state always starts fresh from `question`. */
function QuestionFormBody({ testId, question, onDone }) {
  const isEdit = Boolean(question)
  const [text, setText] = useState(question?.text ?? '')
  const [isCode, setIsCode] = useState(question?.isCode ?? false)
  const [options, setOptions] = useState(question?.options ?? ['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(question?.correctIndex ?? 0)
  const [imageStorageId, setImageStorageId] = useState(question?.imageStorageId ?? undefined)
  const [imagePreview, setImagePreview] = useState(question?.imageUrl ?? null)
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const { create, update } = useQuestionsForTest(testId)
  const uploadImage = useUploadQuestionImage(testId)

  const setOption = (index, value) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)))
  }

  const handlePickImage = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error("Faqat rasm fayli yuklash mumkin")
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Rasm hajmi 5 MB dan oshmasligi kerak")
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageStorageId(undefined)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedText = text.trim()
    const trimmedOptions = options.map((o) => o.trim())
    if (!trimmedText || trimmedOptions.some((o) => !o)) {
      toast.error("Savol matni va barcha 4 ta javobni to'ldiring")
      return
    }

    let finalImageStorageId = imageStorageId
    if (imageFile) {
      setUploading(true)
      try {
        finalImageStorageId = await uploadImage(imageFile)
      } catch {
        toast.error("Rasmni yuklab bo'lmadi, qaytadan urinib ko'ring")
        setUploading(false)
        return
      }
      setUploading(false)
    }

    const payload = { text: trimmedText, isCode, imageStorageId: finalImageStorageId, options: trimmedOptions, correctIndex }
    if (isEdit) {
      await update(question.id, payload)
      toast.success('Savol yangilandi')
    } else {
      await create(payload)
      toast.success("Savol qo'shildi")
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Savolni tahrirlash' : "Yangi savol qo'shish"}</DialogTitle>
        <DialogDescription>4 ta javob varianti kiriting va to'g'ri javobni belgilang.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="question-text">Savol matni</Label>
          <Label htmlFor="question-code-toggle" className="flex cursor-pointer items-center gap-1.5 text-xs font-normal text-muted-foreground">
            <Code2 className="size-3.5" /> Kod formatida
            <Switch id="question-code-toggle" checked={isCode} onCheckedChange={setIsCode} />
          </Label>
        </div>
        <Textarea
          id="question-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isCode ? 'Masalan: console.log(typeof [])' : 'Savol matnini kiriting'}
          className={cn('min-h-24', isCode && 'font-mono text-sm')}
          autoFocus
          required
        />
        {isCode && text.trim() && <CodeBlock code={text} />}

        <div className="space-y-2">
          <Label>Rasm (ixtiyoriy)</Label>
          {imagePreview ? (
            <div className="relative w-fit">
              <img src={imagePreview} alt="Savol rasmi" className="max-h-48 rounded-xl border border-border/60 object-contain" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                aria-label="Rasmni o'chirish"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="size-3.5" /> Rasm biriktirish
            </Button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
        </div>

        <div className="space-y-2">
          <Label>Javob variantlari — to'g'risini belgilang</Label>
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCorrectIndex(index)}
                className={cn(
                  'flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
                  correctIndex === index ? 'bg-success/15 text-success' : 'text-muted-foreground hover:bg-accent',
                )}
                aria-label={`${OPTION_LETTERS[index]} variantini to'g'ri deb belgilash`}
              >
                {correctIndex === index ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                {OPTION_LETTERS[index]}
              </button>
              <Input
                value={option}
                onChange={(e) => setOption(index, e.target.value)}
                placeholder={`${OPTION_LETTERS[index]} varianti`}
                required
              />
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={uploading} className="gap-1.5">
          {uploading && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? 'Saqlash' : "Qo'shish"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function QuestionFormDialog({ testId, question, trigger }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        {open && <QuestionFormBody testId={testId} question={question} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

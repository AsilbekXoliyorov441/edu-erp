import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Circle, Code2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Switch } from '@/shared/ui/switch'
import { cn } from '@/shared/lib/utils'
import { useQuestionsForTest } from '@/entities/test-question/model/store'

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

/** Mounted only while the dialog is open, so its field state always starts fresh from `question`. */
function QuestionFormBody({ testId, question, onDone }) {
  const isEdit = Boolean(question)
  const [text, setText] = useState(question?.text ?? '')
  const [isCode, setIsCode] = useState(question?.isCode ?? false)
  const [options, setOptions] = useState(question?.options ?? ['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(question?.correctIndex ?? 0)
  const { create, update } = useQuestionsForTest(testId)

  const setOption = (index, value) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedText = text.trim()
    const trimmedOptions = options.map((o) => o.trim())
    if (!trimmedText || trimmedOptions.some((o) => !o)) {
      toast.error("Savol matni va barcha 4 ta javobni to'ldiring")
      return
    }

    const payload = { text: trimmedText, isCode, options: trimmedOptions, correctIndex }
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
          placeholder={isCode ? 'Masalan: console.log(typeof [])' : "Savol matnini kiriting"}
          className={cn('min-h-24', isCode && 'font-mono text-sm')}
          autoFocus
          required
        />

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
        <Button type="submit">{isEdit ? 'Saqlash' : "Qo'shish"}</Button>
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

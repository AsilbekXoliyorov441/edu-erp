import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { GraduationCap, KeyRound, LockKeyhole, User } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { useAuthStore } from '@/entities/session/model/store'
import { ROLES, ROUTES } from '@/shared/config/constants'

export function LoginForm() {
  const [role, setRole] = useState(ROLES.TEACHER)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const loginTeacher = useAuthStore((s) => s.loginTeacher)
  const loginStudent = useAuthStore((s) => s.loginStudent)
  const navigate = useNavigate()
  const location = useLocation()

  const handleRoleChange = (value) => {
    setRole(value)
    setIdentifier('')
    setPassword('')
    setError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    let result
    try {
      result =
        role === ROLES.TEACHER ? await loginTeacher(identifier, password) : await loginStudent(identifier, password)
    } catch (err) {
      console.error('Login failed', err)
      result = { ok: false, error: "Serverga ulanib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring." }
    }
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      toast.error(result.error)
      return
    }

    toast.success('Xush kelibsiz!')
    const fallback = role === ROLES.TEACHER ? ROUTES.DASHBOARD : ROUTES.LEADERBOARD
    navigate(location.state?.from?.pathname ?? fallback, { replace: true })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Tabs value={role} onValueChange={handleRoleChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value={ROLES.TEACHER} className="gap-1.5">
            <KeyRound className="size-3.5" /> O'qituvchi
          </TabsTrigger>
          <TabsTrigger value={ROLES.STUDENT} className="gap-1.5">
            <GraduationCap className="size-3.5" /> O'quvchi
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-1.5">
        <Label htmlFor="identifier">Login</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="identifier"
            autoComplete="username"
            placeholder={role === ROLES.TEACHER ? 'ustoz' : 'login'}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="pl-9"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Parol</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9"
            required
          />
        </div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        Kirish
      </Button>
    </form>
  )
}

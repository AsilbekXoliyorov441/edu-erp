import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ChevronRight, Gamepad2, Play, Radio, Timer, Trophy, User, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { EmptyState } from '@/shared/ui/empty-state'
import { useAuthStore } from '@/entities/session/model/store'
import { useGroupStore } from '@/entities/group/model/store'
import { useTopics } from '@/entities/test/model/store'
import { useActiveGameForMe, useGameActions, useTeacherGames } from '@/entities/game/model/store'
import { GAME_RULES, ROLES, ROUTES } from '@/shared/config/constants'
import { formatRelativeUz } from '@/shared/lib/date'
import { cn } from '@/shared/lib/utils'

const STATUS_LABEL = { lobby: 'Kutish zali', question: 'Davom etmoqda', reveal: 'Davom etmoqda', finished: 'Tugagan' }

function ChoiceButton({ selected, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-4 text-sm font-semibold transition-all',
        selected
          ? 'border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/25'
          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
        className,
      )}
    >
      {children}
    </button>
  )
}

function CreateGameCard() {
  const navigate = useNavigate()
  const groups = useGroupStore((s) => s.items)
  const { items: topics } = useTopics()
  const { create } = useGameActions()

  const [groupId, setGroupId] = useState('')
  const [testId, setTestId] = useState('')
  const [mode, setMode] = useState('solo')
  const [teamCount, setTeamCount] = useState(2)
  const [durationSec, setDurationSec] = useState(GAME_RULES.DEFAULT_DURATION)
  const [creating, setCreating] = useState(false)

  const playableTopics = topics.filter((t) => t.questionCount > 0)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const gameId = await create({ groupId, testId, mode, teamCount, durationSec })
      navigate(ROUTES.game(gameId))
    } catch (err) {
      toast.error(err.data ?? "O'yinni yaratib bo'lmadi")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="size-5 text-blue-500" /> Yangi jonli o'yin
        </CardTitle>
        <CardDescription>
          Mavzudagi savollar hamma o'quvchiga bir vaqtda chiqadi. Tez va to'g'ri javob — ko'proq ball.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Guruh</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Guruhni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Mavzu</Label>
            <Select value={testId} onValueChange={setTestId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={playableTopics.length ? 'Mavzuni tanlang' : "Savolli mavzu yo'q"} />
              </SelectTrigger>
              <SelectContent>
                {playableTopics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title} • {t.questionCount} savol
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>O'yin turi</Label>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceButton selected={mode === 'solo'} onClick={() => setMode('solo')}>
                <User className="size-4" /> Yakka
              </ChoiceButton>
              <ChoiceButton selected={mode === 'team'} onClick={() => setMode('team')}>
                <Users className="size-4" /> Jamoaviy
              </ChoiceButton>
            </div>
          </div>
          {mode === 'team' && (
            <div className="space-y-1.5">
              <Label>Jamoalar soni</Label>
              <div className="grid grid-cols-3 gap-2">
                {GAME_RULES.TEAM_COUNTS.map((n) => (
                  <ChoiceButton key={n} selected={teamCount === n} onClick={() => setTeamCount(n)}>
                    {n} ta
                  </ChoiceButton>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Timer className="size-4" /> Har bir savolga vaqt
          </Label>
          <div className="grid grid-cols-4 gap-2 sm:max-w-md">
            {GAME_RULES.DURATIONS.map((d) => (
              <ChoiceButton key={d} selected={durationSec === d} onClick={() => setDurationSec(d)}>
                {d} s
              </ChoiceButton>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleCreate}
            disabled={!groupId || !testId || creating}
            className="gap-2 bg-blue-500 text-white hover:bg-blue-600"
          >
            <Play className="size-5" /> O'yin xonasini ochish
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function GameHistory() {
  const games = useTeacherGames()
  if (games.length === 0) return null

  return (
    <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-base">So'nggi o'yinlar</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {games.map((g) => {
            const live = g.status !== 'finished'
            return (
              <Link
                key={g.id}
                to={ROUTES.game(g.id)}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/60"
              >
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                    live ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-800',
                  )}
                >
                  {live ? <Radio className="size-5" /> : <Trophy className="size-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{g.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {g.groupName} • {g.mode === 'team' ? 'Jamoaviy' : 'Yakka'} • {g.playerCount} o'quvchi •{' '}
                    {formatRelativeUz(new Date(g.createdAt).toISOString())}
                    {!live && g.winnerName && ` • 🏆 ${g.winnerName}`}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-semibold',
                    live
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
                  )}
                >
                  {STATUS_LABEL[g.status]}
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function StudentGames() {
  const active = useActiveGameForMe()

  if (!active) {
    return (
      <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <CardContent>
          <EmptyState
            icon={Gamepad2}
            title="Hozircha jonli o'yin yo'q"
            description="Ustozingiz o'yin boshlaganda u shu yerda paydo bo'ladi — tayyor turing!"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
      <Card className="overflow-hidden border-0 bg-blue-500 text-white shadow-xl shadow-blue-500/25">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <span className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
            <span className="size-2 animate-pulse rounded-full bg-white" /> JONLI
          </span>
          <div>
            <h2 className="text-2xl font-extrabold">{active.title}</h2>
            <p className="mt-1 text-sm text-white/80">
              {active.mode === 'team' ? "Jamoaviy o'yin" : "Yakka o'yin"} •{' '}
              {active.status === 'lobby' ? 'boshlanishini kutmoqda' : 'davom etmoqda'}
            </p>
          </div>
          <Button asChild size="lg" className="gap-2 bg-white text-blue-600 hover:bg-gray-100">
            <Link to={ROUTES.game(active.id)}>
              <Play className="size-5" /> O'yinga qo'shilish
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function GamesPage() {
  const role = useAuthStore((s) => s.role)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Jonli o'yinlar</h2>
        <p className="text-sm text-muted-foreground">
          Butun guruh bilan real vaqtda viktorina — darsni o'yin orqali mustahkamlang.
        </p>
      </div>
      {role === ROLES.TEACHER ? (
        <>
          <CreateGameCard />
          <GameHistory />
        </>
      ) : (
        <StudentGames />
      )}
    </div>
  )
}

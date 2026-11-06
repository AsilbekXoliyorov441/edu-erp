import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ChevronRight,
  CircleAlert,
  FileQuestion,
  FolderOpen,
  History,
  ListChecks,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Users2,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { EmptyState } from '@/shared/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { TestFormDialog } from '@/features/manage-tests/ui/TestFormDialog'
import { DeleteTestDialog } from '@/features/manage-tests/ui/DeleteTestDialog'
import { useAuthStore } from '@/entities/session/model/store'
import { useTopics } from '@/entities/test/model/store'
import { useGroupStore } from '@/entities/group/model/store'
import {
  DEFAULT_SECTION,
  getTestSection,
  getTestSubject,
  groupTestsBySection,
  groupTestsBySubject,
} from '@/entities/test/lib/subject'
import { useMyAssignedTests } from '@/entities/test-assignment/model/store'
import { useMyAttempts } from '@/entities/quiz/model/store'
import { ROLES, ROUTES, TEST_SUBJECTS } from '@/shared/config/constants'
import { cn } from '@/shared/lib/utils'

const UNASSIGNED = '__unassigned'

/* ───────────────────────── shared pieces ───────────────────────── */

function SubjectMark({ subject, size = 'md' }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center font-black text-white',
        size === 'lg' ? 'size-14 rounded-2xl text-base' : 'size-11 rounded-2xl text-[13px]',
      )}
      style={{ backgroundColor: subject.color }}
      aria-hidden="true"
    >
      {subject.short}
    </div>
  )
}

/** The selected subject lives in the URL (`?fan=html`), so the browser back button and
 * page refresh keep the teacher where they were. */
function useSubjectParam() {
  const [params, setParams] = useSearchParams()
  const subject = TEST_SUBJECTS.find((s) => s.key === params.get('fan')) ?? null
  const open = (key) => setParams(key ? { fan: key } : {})
  return [subject, open]
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative min-w-[200px] flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label={placeholder}
      />
    </div>
  )
}

function GroupSelect({ groups, value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-52" aria-label="Guruh">
        <SelectValue placeholder="Guruh" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Barcha guruhlar</SelectItem>
        <SelectItem value={UNASSIGNED}>Guruhga ulanmaganlar</SelectItem>
        {groups.map((g) => (
          <SelectItem key={g.id} value={g.id}>
            {g.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Level 1 tile: one subject with its counts and a peek at its inner sections. */
function SubjectTile({ subject, tests, index, onOpen, warning }) {
  const sections = groupTestsBySection(tests)
  const named = sections.map((s) => s.name).filter((n) => n !== DEFAULT_SECTION)
  const questions = tests.reduce((sum, t) => sum + (t.questionCount ?? 0), 0)

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04 }}
      whileHover={{ y: -3 }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-colors hover:border-primary/40"
    >
      <span className="h-1.5 w-full" style={{ backgroundColor: subject.color }} aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <SubjectMark subject={subject} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-foreground">{subject.label}</p>
            <p className="text-sm text-muted-foreground">
              {tests.length} mavzu · {questions} savol
            </p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="flex items-center gap-1 font-medium text-muted-foreground">
            <FolderOpen className="size-3.5" /> {sections.length} bo'lim
          </span>
          {named.slice(0, 3).map((name) => (
            <span key={name} className="rounded-md bg-secondary px-1.5 py-0.5 font-medium text-foreground/80">
              {name}
            </span>
          ))}
          {named.length > 3 && <span className="text-muted-foreground">+{named.length - 3}</span>}
        </div>
        {warning}
      </div>
    </motion.button>
  )
}

function SectionHeader({ title, count, color, action }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-2">
      <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
        {color ? (
          <span className="size-3 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
        ) : (
          <FolderOpen className="size-4 text-muted-foreground" aria-hidden="true" />
        )}
        {title}
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">{count}</span>
      </h3>
      {action}
    </div>
  )
}

function Breadcrumb({ subject, onBack }) {
  return (
    <nav aria-label="Yo'l" className="flex items-center gap-1.5 text-sm">
      <button
        type="button"
        onClick={onBack}
        className="flex cursor-pointer items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Testlar
      </button>
      <ChevronRight className="size-3.5 text-muted-foreground" />
      <span className="font-semibold text-foreground">{subject.label}</span>
    </nav>
  )
}

function SectionChips({ sections, value, onChange }) {
  if (sections.length < 2) return null
  const total = sections.reduce((sum, s) => sum + s.tests.length, 0)
  return (
    <div role="tablist" aria-label="Bo'lim" className="flex flex-wrap gap-1.5">
      {[{ name: 'all', label: "Barcha bo'limlar", count: total }, ...sections.map((s) => ({ name: s.name, label: s.name, count: s.tests.length }))].map(
        (s) => {
          const active = value === s.name
          return (
            <button
              key={s.name}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(s.name)}
              className={cn(
                'flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-secondary',
              )}
            >
              {s.label}
              <span className={cn('tabular-nums', active ? 'opacity-80' : 'opacity-60')}>{s.count}</span>
            </button>
          )
        },
      )}
    </div>
  )
}

/* ───────────────────────── teacher ───────────────────────── */

function TopicCard({ topic, index, showSubject }) {
  const subject = getTestSubject(topic)
  const groupNames = topic.groupNames ?? []
  const shown = groupNames.slice(0, 2)
  const hidden = groupNames.length - shown.length

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.03 }}>
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardContent className="flex items-start gap-3 p-4">
          <Link to={ROUTES.testDetail(topic.id)} className="flex min-w-0 flex-1 items-start gap-3">
            <SubjectMark subject={subject} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground" title={topic.title}>
                {topic.title}
              </p>
              {showSubject && (
                <p className="truncate text-xs text-muted-foreground">
                  {subject.label} › {getTestSection(topic)}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="gap-1">
                  <FileQuestion className="size-3" /> {topic.questionCount} savol
                </Badge>
                {topic.attemptCount > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <History className="size-3" /> {topic.attemptCount} urinish
                  </Badge>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {groupNames.length === 0 ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <CircleAlert className="size-3.5" /> Guruhga ulanmagan
                  </span>
                ) : (
                  <>
                    {shown.map((name) => (
                      <span
                        key={name}
                        className="flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                      >
                        <Users2 className="size-3" /> {name}
                      </span>
                    ))}
                    {hidden > 0 && <span className="text-xs text-muted-foreground">+{hidden}</span>}
                  </>
                )}
                {topic.questionCount === 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                    <CircleAlert className="size-3.5" /> Savol yo'q
                  </span>
                )}
              </div>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-0.5">
            <TestFormDialog
              test={topic}
              trigger={
                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Tahrirlash">
                  <Pencil className="size-3.5" />
                </Button>
              }
            />
            <DeleteTestDialog test={topic} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TopicGrid({ topics, showSubject }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {topics.map((topic, index) => (
        <TopicCard key={topic.id} topic={topic} index={index} showSubject={showSubject} />
      ))}
    </div>
  )
}

function TeacherTestsPage() {
  const { items: topics, importPresets } = useTopics()
  const groups = useGroupStore((s) => s.items)
  const [subject, openSubject] = useSubjectParam()
  const [importing, setImporting] = useState(false)
  const [query, setQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [sectionFilter, setSectionFilter] = useState('all')

  const handleImportPresets = async () => {
    setImporting(true)
    try {
      const { added } = await importPresets()
      if (added > 0) toast.success(`${added} ta tayyor mavzu qo'shildi`)
      else toast.info("Tayyor mavzular allaqachon qo'shilgan")
    } catch (error) {
      toast.error(error?.data ?? 'Xatolik yuz berdi')
    } finally {
      setImporting(false)
    }
  }

  const goTo = (key) => {
    openSubject(key)
    setQuery('')
    setSectionFilter('all')
  }

  const needle = query.trim().toLocaleLowerCase()
  const byGroup = useMemo(
    () =>
      topics.filter((t) => {
        if (groupFilter === UNASSIGNED) return (t.groupIds ?? []).length === 0
        if (groupFilter !== 'all') return (t.groupIds ?? []).includes(groupFilter)
        return true
      }),
    [topics, groupFilter],
  )
  const matches = (t) =>
    !needle || t.title.toLocaleLowerCase().includes(needle) || getTestSection(t).toLocaleLowerCase().includes(needle)

  const unassignedCount = topics.filter((t) => (t.groupIds ?? []).length === 0).length
  const totalQuestions = topics.reduce((sum, t) => sum + t.questionCount, 0)

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Testlar</h2>
        <p className="text-sm text-muted-foreground">
          {topics.length} mavzu · {totalQuestions} savol
          {unassignedCount > 0 && (
            <>
              {' · '}
              <button
                type="button"
                onClick={() => setGroupFilter(UNASSIGNED)}
                className="cursor-pointer font-medium text-amber-600 hover:underline dark:text-amber-400"
              >
                {unassignedCount} tasi guruhga ulanmagan
              </button>
            </>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="gap-1.5" onClick={handleImportPresets} disabled={importing}>
          <Sparkles className="size-4" /> Tayyor testlar
        </Button>
        <TestFormDialog
          defaultSubject={subject?.key}
          trigger={
            <Button className="gap-1.5">
              <Plus className="size-4" /> Mavzu qo'shish
            </Button>
          }
        />
      </div>
    </div>
  )

  if (topics.length === 0) {
    return (
      <div className="space-y-5">
        {header}
        <EmptyState
          icon={ListChecks}
          title="Hali mavzu yo'q"
          description="Birinchi mavzuingizni yarating yoki “Tayyor testlar” orqali HTML, CSS, Python testlarini qo'shing."
        />
      </div>
    )
  }

  /* ── Level 2: one subject → its inner sections → topics ── */
  if (subject) {
    const subjectTopics = byGroup.filter((t) => getTestSubject(t).key === subject.key)
    const allSections = groupTestsBySection(subjectTopics.filter(matches))
    const sections = sectionFilter === 'all' ? allSections : allSections.filter((s) => s.name === sectionFilter)

    return (
      <div className="space-y-5">
        {header}
        <Breadcrumb subject={subject} onBack={() => goTo(null)} />

        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <SubjectMark subject={subject} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold text-foreground">{subject.label}</p>
            <p className="text-sm text-muted-foreground">
              {subjectTopics.length} mavzu · {groupTestsBySection(subjectTopics).length} bo'lim ·{' '}
              {subjectTopics.reduce((sum, t) => sum + t.questionCount, 0)} savol
            </p>
          </div>
          <TestFormDialog
            defaultSubject={subject.key}
            trigger={
              <Button variant="outline" className="gap-1.5">
                <Plus className="size-4" /> {subject.label} mavzusi
              </Button>
            }
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <SearchBox value={query} onChange={setQuery} placeholder={`${subject.label} ichida qidirish`} />
            <GroupSelect groups={groups} value={groupFilter} onChange={setGroupFilter} />
          </div>
          <SectionChips sections={allSections} value={sectionFilter} onChange={setSectionFilter} />
        </div>

        {sections.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Bu filtr bo'yicha mavzu topilmadi.</p>
        ) : (
          <div className="space-y-7">
            {sections.map((section) => (
              <section key={section.name} aria-label={section.name}>
                <SectionHeader
                  title={section.name}
                  count={section.tests.length}
                  action={
                    <TestFormDialog
                      defaultSubject={subject.key}
                      defaultSection={section.name === DEFAULT_SECTION ? '' : section.name}
                      trigger={
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground">
                          <Plus className="size-3.5" /> Shu bo'limga
                        </Button>
                      }
                    />
                  }
                />
                <TopicGrid topics={section.tests} />
              </section>
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ── Level 1: subjects (or search results across all of them) ── */
  const subjects = groupTestsBySubject(byGroup)
  const searchResults = needle ? groupTestsBySubject(byGroup.filter(matches)) : null

  return (
    <div className="space-y-5">
      {header}

      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={query} onChange={setQuery} placeholder="Barcha testlardan qidirish" />
        <GroupSelect groups={groups} value={groupFilter} onChange={setGroupFilter} />
      </div>

      {searchResults ? (
        searchResults.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">“{query.trim()}” bo'yicha mavzu topilmadi.</p>
        ) : (
          <div className="space-y-7">
            {searchResults.map(({ subject: s, tests }) => (
              <section key={s.key} aria-label={s.label}>
                <SectionHeader
                  title={s.label}
                  count={tests.length}
                  color={s.color}
                  action={
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => goTo(s.key)}>
                      Bo'limga o'tish <ChevronRight className="size-3.5" />
                    </Button>
                  }
                />
                <TopicGrid topics={tests} showSubject />
              </section>
            ))}
          </div>
        )
      ) : subjects.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Bu guruh uchun mavzu topilmadi.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map(({ subject: s, tests }, index) => {
            const unassigned = tests.filter((t) => (t.groupIds ?? []).length === 0).length
            return (
              <SubjectTile
                key={s.key}
                subject={s}
                tests={tests}
                index={index}
                onOpen={() => goTo(s.key)}
                warning={
                  unassigned > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <CircleAlert className="size-3.5" /> {unassigned} tasi guruhga ulanmagan
                    </span>
                  )
                }
              />
            )
          })}
          <TestFormDialog
            trigger={
              <button
                type="button"
                className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <Plus className="size-5" /> Yangi mavzu
              </button>
            }
          />
        </div>
      )}
    </div>
  )
}

/* ───────────────────────── student ───────────────────────── */

function StudentTestCard({ test, index, bestPercent }) {
  const subject = getTestSubject(test)
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.03 }}>
      <Link to={ROUTES.takeTest(test.id)}>
        <Card className="h-full transition-colors hover:border-primary/40">
          <CardContent className="flex items-center gap-3 p-4">
            <SubjectMark subject={subject} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{test.title}</p>
              <p className="text-xs text-muted-foreground">
                {test.questionCount} ta savol{bestPercent === null ? ' · hali yechilmagan' : ''}
              </p>
            </div>
            {bestPercent !== null ? (
              <Badge variant={bestPercent >= 80 ? 'success' : bestPercent >= 50 ? 'warning' : 'destructive'}>{bestPercent}%</Badge>
            ) : (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

function StudentTestsPage() {
  const tests = useMyAssignedTests()
  const attempts = useMyAttempts()
  const [subject, openSubject] = useSubjectParam()

  const bestPercentFor = (testId) => {
    const testAttempts = attempts.filter((a) => a.testId === testId)
    if (testAttempts.length === 0) return null
    return Math.max(...testAttempts.map((a) => (a.totalQuestions ? Math.round((a.score / a.totalQuestions) * 100) : 0)))
  }
  const solvedIn = (list) => list.filter((t) => bestPercentFor(t.id) !== null).length

  const header = (
    <div>
      <h2 className="text-lg font-semibold text-foreground">Testlar</h2>
      <p className="text-sm text-muted-foreground">
        {tests.length > 0 ? `${tests.length} ta test · ${solvedIn(tests)} tasi yechilgan` : "O'tilgan mavzular bo'yicha testlarni yeching"}
      </p>
    </div>
  )

  if (tests.length === 0) {
    return (
      <div className="space-y-5">
        {header}
        <EmptyState icon={ListChecks} title="Hali test yo'q" description="Ustozingiz test qo'shganda shu yerda ko'rinadi." />
      </div>
    )
  }

  if (subject) {
    const subjectTests = tests.filter((t) => getTestSubject(t).key === subject.key)
    return (
      <div className="space-y-5">
        {header}
        <Breadcrumb subject={subject} onBack={() => openSubject(null)} />
        {subjectTests.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Bu bo'limda test yo'q.</p>
        ) : (
          <div className="space-y-7">
            {groupTestsBySection(subjectTests).map((section) => (
              <section key={section.name} aria-label={section.name}>
                <SectionHeader title={section.name} count={section.tests.length} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {section.tests.map((test, index) => (
                    <StudentTestCard key={test.id} test={test} index={index} bestPercent={bestPercentFor(test.id)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {header}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groupTestsBySubject(tests).map(({ subject: s, tests: subjectTests }, index) => {
          const solved = solvedIn(subjectTests)
          return (
            <SubjectTile
              key={s.key}
              subject={s}
              tests={subjectTests}
              index={index}
              onOpen={() => openSubject(s.key)}
              warning={
                <div className="space-y-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(solved / subjectTests.length) * 100}%`, backgroundColor: s.color }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {solved}/{subjectTests.length} yechilgan
                  </p>
                </div>
              }
            />
          )
        })}
      </div>
    </div>
  )
}

export function TestsPage() {
  const role = useAuthStore((s) => s.role)
  return role === ROLES.TEACHER ? <TeacherTestsPage /> : <StudentTestsPage />
}

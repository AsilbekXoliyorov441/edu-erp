import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users2, Calendar, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/empty-state'
import { Badge } from '@/shared/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { CreateGroupDialog } from '@/features/create-group/ui/CreateGroupDialog'
import { RenameGroupDialog } from '@/features/rename-group/ui/RenameGroupDialog'
import { DeleteGroupDialog } from '@/features/remove-group/ui/DeleteGroupDialog'
import { useGroupStore } from '@/entities/group/model/store'
import { useStudentStore } from '@/entities/student/model/store'
import { useLessonStore } from '@/entities/lesson/model/store'
import { useCoinEntryStore } from '@/entities/coin-entry/model/store'
import { useTeacherStore } from '@/entities/teacher/model/store'
import { useAuthStore } from '@/entities/session/model/store'
import { getGroupStats } from '@/shared/lib/stats'
import { formatUzDate } from '@/shared/lib/date'
import { ROUTES } from '@/shared/config/constants'

const ALL_TEACHERS = 'all'

export function GroupsPage() {
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin)
  const allGroups = useGroupStore((s) => s.items)
  const students = useStudentStore((s) => s.items)
  const lessons = useLessonStore((s) => s.items)
  const coinEntries = useCoinEntryStore((s) => s.items)
  const teachers = useTeacherStore((s) => s.items)

  const [teacherFilter, setTeacherFilter] = useState(ALL_TEACHERS)
  const teacherById = new Map(teachers.map((t) => [t.id, t]))
  const groups = isSuperAdmin && teacherFilter !== ALL_TEACHERS ? allGroups.filter((g) => g.teacherId === teacherFilter) : allGroups

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{groups.length} ta guruh</p>
        <div className="flex items-center gap-2">
          {isSuperAdmin && teachers.length > 0 && (
            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Barcha ustozlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TEACHERS}>Barcha ustozlar</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <CreateGroupDialog />
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="Hali guruh yo'q"
          description="Birinchi guruhingizni yarating va o'quvchilar qo'shishni boshlang."
          action={<CreateGroupDialog />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((group, index) => {
            const stats = getGroupStats(group, students, lessons, coinEntries)
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ y: -3 }}
                className="relative"
              >
                <Link to={ROUTES.groupDetail(group.id)}>
                  <Card className="h-full">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-center gap-3 pr-8">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                          <Users2 className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{group.name}</p>
                          <p className="text-xs text-muted-foreground">{stats.studentCount} o'quvchi</p>
                        </div>
                      </div>
                      {isSuperAdmin && teacherById.get(group.teacherId) && (
                        <Badge variant="outline">{teacherById.get(group.teacherId).fullName}</Badge>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-muted/60 p-3">
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="size-3" /> O'rtacha
                          </p>
                          <p className="font-semibold text-foreground">{stats.avgCoins} coin</p>
                        </div>
                        <div className="rounded-xl bg-muted/60 p-3">
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="size-3" /> Oxirgi dars
                          </p>
                          <p className="font-semibold text-foreground">
                            {stats.lastLessonDate ? formatUzDate(stats.lastLessonDate) : "Hali yo'q"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <div className="absolute right-3 top-3 flex items-center gap-1">
                  <RenameGroupDialog group={group} />
                  <DeleteGroupDialog group={group} />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

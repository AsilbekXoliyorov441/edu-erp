import { Moon, Sun } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Switch } from '@/shared/ui/switch'
import { Label } from '@/shared/ui/label'
import { TeacherProfileForm } from '@/features/update-teacher-profile/ui/TeacherProfileForm'
import { CoinPriceForm } from '@/features/manage-coin-price/ui/CoinPriceForm'
import { ExportDataButton } from '@/features/export-reset-data/ui/ExportDataButton'
import { ImportDataButton } from '@/features/export-reset-data/ui/ImportDataButton'
import { ResetDataDialog } from '@/features/export-reset-data/ui/ResetDataDialog'
import { useThemeStore } from '@/shared/lib/store/themeStore'
import { useAuthStore } from '@/entities/session/model/store'

export function SettingsPage() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const username = useAuthStore((s) => s.username)
  const fullName = useAuthStore((s) => s.fullName)
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin)
  const centerName = useAuthStore((s) => s.centerName)
  const teacher = username ? { username, fullName } : null

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Ko'rinish</CardTitle>
          <CardDescription>Interfeys mavzusini tanlang</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between pt-0">
          <Label htmlFor="theme-switch" className="flex cursor-pointer items-center gap-2">
            {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            Qorong'i rejim
          </Label>
          <Switch
            id="theme-switch"
            checked={theme === 'dark'}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          />
        </CardContent>
      </Card>

      {teacher && (
        <Card>
          <CardHeader>
            <CardTitle>O'qituvchi profili</CardTitle>
            <CardDescription>Shaxsiy ma'lumotlaringiz</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <TeacherProfileForm teacher={teacher} />
          </CardContent>
        </Card>
      )}

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Coin narxi{centerName ? ` — ${centerName}` : ''}</CardTitle>
            <CardDescription>1 coin necha so'mga teng — moliyaviy statistikada shu qiymat ishlatiladi</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <CoinPriceForm />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ma'lumotlar</CardTitle>
          <CardDescription>Zaxira nusxa oling, tiklang yoki tizimni qayta boshlang</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 pt-0">
          <ExportDataButton />
          <ImportDataButton />
          <ResetDataDialog />
        </CardContent>
      </Card>
    </div>
  )
}

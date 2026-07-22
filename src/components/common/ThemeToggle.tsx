import { Monitor, Moon, Sun } from 'lucide-react'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InfoTip } from '@/components/ui/tooltip'
import { useTheme, type ThemePreference } from '@/hooks/useTheme'

const OPTIONS = [
  { value: 'light', label: 'สว่าง', Icon: Sun },
  { value: 'system', label: 'ตามระบบ', Icon: Monitor },
  { value: 'dark', label: 'มืด', Icon: Moon },
] as const satisfies readonly { value: ThemePreference; label: string; Icon: typeof Sun }[]

export function ThemeToggle() {
  const { preference, setPreference } = useTheme()

  return (
    <Tabs value={preference} onValueChange={(v) => setPreference(v as ThemePreference)}>
      <TabsList aria-label="ธีมสี">
        {OPTIONS.map(({ value, label, Icon }) => (
          <InfoTip key={value} label={label}>
            <TabsTrigger value={value} className="px-1.5" aria-label={label}>
              <Icon />
            </TabsTrigger>
          </InfoTip>
        ))}
      </TabsList>
    </Tabs>
  )
}

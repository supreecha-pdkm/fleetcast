import { Menu } from 'lucide-react'

import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { InfoTip } from '@/components/ui/tooltip'
import { SIMULATED_NOW } from '@/data/constants'
import { formatTimestamp } from '@/lib/date'

export interface HeaderProps {
  readonly onOpenNav: () => void
}

export function Header({ onOpenNav }: HeaderProps) {
  return (
    <header className="hairline-b sticky top-0 z-30 flex h-14 items-center gap-3 bg-surface/85 px-4 backdrop-blur-md lg:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onOpenNav}
        aria-label="เปิดเมนู"
      >
        <Menu />
      </Button>

      <nav aria-label="เส้นทางนำทาง" className="hidden min-w-0 items-center sm:flex">
        <span className="text-[13px] font-medium text-ink">ภาพรวมความต้องการ</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <InfoTip label={formatTimestamp(SIMULATED_NOW)}>
          <span className="hidden cursor-help text-[12px] text-ink-muted lg:inline">
            {formatTimestamp(SIMULATED_NOW)}
          </span>
        </InfoTip>

        <Separator orientation="vertical" className="hidden h-5 lg:block" />

        <ThemeToggle />
      </div>
    </header>
  )
}

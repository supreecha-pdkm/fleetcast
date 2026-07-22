import { Bell, ChevronRight, Menu, Search } from 'lucide-react'

import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { InfoTip } from '@/components/ui/tooltip'
import { SIMULATED_NOW } from '@/data/constants'
import { formatTimestamp } from '@/lib/date'

export interface HeaderProps {
  readonly onOpenNav: () => void
  readonly alertCount: number
}

export function Header({ onOpenNav, alertCount }: HeaderProps) {
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

      <nav aria-label="เส้นทางนำทาง" className="hidden min-w-0 items-center gap-1.5 sm:flex">
        <span className="text-[13px] text-ink-muted">การพยากรณ์</span>
        <ChevronRight className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
        <span className="text-[13px] font-medium text-ink">ภาพรวมความต้องการ</span>
      </nav>

      <Badge tone="ai" className="hidden md:inline-flex">
        โมเดลทำงานสด
      </Badge>

      <div className="ml-auto flex items-center gap-2">
        {/* Presentational — search is not wired up in the prototype. */}
        <InfoTip label="ยังไม่เปิดใช้งานการค้นหาในต้นแบบนี้">
          <button
            type="button"
            className="hidden h-8 w-56 items-center gap-2 rounded-lg border border-hairline bg-surface-sunken px-2.5 text-[13px] text-ink-muted transition-colors duration-150 hover:border-hairline-strong xl:flex"
          >
            <Search className="size-3.5 shrink-0" aria-hidden />
            <span>ค้นหาเส้นทาง…</span>
            <kbd className="ml-auto rounded border border-hairline bg-surface px-1 py-0.5 font-sans text-[10px] text-ink-muted">
              ⌘K
            </kbd>
          </button>
        </InfoTip>

        <InfoTip label={`มีการแจ้งเตือนความจุค้างอยู่ ${alertCount} รายการ`}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`การแจ้งเตือน ${alertCount} รายการ`}
            className="relative"
          >
            <Bell />
            {alertCount > 0 ? (
              <span
                className="absolute top-1 right-1 size-1.5 rounded-full bg-critical"
                aria-hidden
              />
            ) : null}
          </Button>
        </InfoTip>

        <Separator orientation="vertical" className="hidden h-5 sm:block" />

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

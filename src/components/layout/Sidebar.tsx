import { BusFront, ChevronsUpDown, CircleDot, X } from 'lucide-react'

import { NAV_SECTIONS, type NavItem } from '@/components/layout/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InfoTip } from '@/components/ui/tooltip'
import { MODEL } from '@/data/constants'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface SidebarProps {
  readonly activeId: string
  readonly accuracy: number | null
  readonly onClose?: () => void
}

function NavButton({ item, active }: { item: NavItem; active: boolean }) {
  const { icon: Icon, label, badge, disabled } = item

  const button = (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      aria-disabled={disabled}
      className={cn(
        'group relative flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors duration-150',
        active
          ? 'bg-surface-hover text-ink'
          : 'text-ink-secondary hover:bg-surface-hover hover:text-ink',
        disabled && 'cursor-not-allowed text-ink-muted hover:bg-transparent hover:text-ink-muted',
      )}
    >
      {active ? (
        <span className="absolute inset-y-1.5 -left-2 w-0.5 rounded-full bg-ink" aria-hidden />
      ) : null}
      <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
      <span className="truncate">{label}</span>
      {badge ? (
        <Badge tone="ai" className="ml-auto">
          {badge}
        </Badge>
      ) : null}
    </button>
  )

  return disabled ? <InfoTip label="ยังไม่เปิดใช้งานในต้นแบบนี้">{button}</InfoTip> : button
}

export function Sidebar({ activeId, accuracy, onClose }: SidebarProps) {
  return (
    <div className="flex h-full w-[248px] flex-col bg-surface">
      {/* Brand */}
      <div className="hairline-b flex h-14 items-center gap-2.5 px-4">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/12 text-brand"
          aria-hidden
        >
          <BusFront className="size-4.5" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] leading-4 font-semibold tracking-[-0.01em] text-ink">
            Fleetcast
          </p>
          <p className="truncate text-[11px] leading-4 text-ink-muted">กรีน แคปปิตอล ทรานสปอร์ต</p>
        </div>
        {onClose ? (
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="ปิดเมนู">
            <X />
          </Button>
        ) : null}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="เมนูหลัก">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-5 last:mb-0">
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold tracking-[0.08em] text-ink-muted uppercase">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.id}>
                  <NavButton item={item} active={item.id === activeId} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Model status */}
      <div className="px-4 pb-3">
        <div className="rounded-lg border border-hairline bg-surface-sunken p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-secondary">
              <CircleDot className="size-3 text-good" strokeWidth={2.5} aria-hidden />
              โมเดลทำงานปกติ
            </span>
            <span className="tnum text-[11px] text-ink-muted">{MODEL.version}</span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline justify-between text-[11px] text-ink-muted">
              <span>ความแม่นยำบนชุดทดสอบ</span>
              <span className="tnum font-semibold text-ink">
                {accuracy === null ? '—' : formatPercent(accuracy)}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-good transition-[width] duration-700"
                style={{ width: `${(accuracy ?? 0) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="hairline-b border-t border-hairline px-4 py-3">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg p-1 transition-colors duration-150 hover:bg-surface-hover"
        >
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ai-wash text-[11px] font-semibold text-ai"
            aria-hidden
          >
            KJ
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[12px] leading-4 font-medium text-ink">
              กัญญาภสร จ.
            </span>
            <span className="block truncate text-[11px] leading-4 text-ink-muted">
              ฝ่ายวางแผนเครือข่ายเดินรถ
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
        </button>
      </div>
    </div>
  )
}

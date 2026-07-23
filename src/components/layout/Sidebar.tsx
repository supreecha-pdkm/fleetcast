import { BusFront, ChevronsUpDown, LayoutDashboard, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

export interface SidebarProps {
  readonly onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
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

      {/* Navigation — this prototype is a single page, so the only entry is always current */}
      <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="เมนูหลัก">
        <ul>
          <li>
            <button
              type="button"
              aria-current="page"
              className="group relative flex h-8 w-full items-center gap-2.5 rounded-lg bg-surface-hover px-2.5 text-[13px] font-medium text-ink transition-colors duration-150"
            >
              <span
                className="absolute inset-y-1.5 -left-2 w-0.5 rounded-full bg-ink"
                aria-hidden
              />
              <LayoutDashboard className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              <span className="truncate">ภาพรวมความต้องการ</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Account */}
      <div className="hairline-b border-t border-hairline px-4 py-3">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg p-1 transition-colors duration-150 hover:bg-surface-hover"
        >
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-forecast-wash text-[11px] font-semibold text-forecast"
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

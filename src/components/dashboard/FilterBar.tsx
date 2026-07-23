import { CalendarRange, Map } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HORIZON_OPTIONS, REGION_LABELS, horizonLabel, type HorizonOption } from '@/data/constants'
import { REGIONS, type DashboardFilters, type RegionFilter } from '@/services/repository'

export interface FilterBarProps {
  readonly filters: DashboardFilters
  readonly onChange: (next: Partial<DashboardFilters>) => void
  readonly recordCount: number | null
}

/**
 * One filter row above everything it scopes. Both controls re-query the
 * warehouse, so every card below re-renders against the same slice.
 */
export function FilterBar({ filters, onChange, recordCount }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-hairline bg-surface p-2 shadow-card">
      <div className="flex items-center gap-2">
        <Select
          value={String(filters.horizonDays)}
          onValueChange={(value) => onChange({ horizonDays: Number(value) as HorizonOption })}
        >
          <SelectTrigger aria-label="ช่วงเวลาพยากรณ์" className="w-[168px]">
            <span className="flex items-center gap-2">
              <CalendarRange className="size-3.5 text-ink-muted" />
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {HORIZON_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {horizonLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.region}
          onValueChange={(value) => onChange({ region: value as RegionFilter })}
        >
          <SelectTrigger aria-label="ภูมิภาคเครือข่าย" className="w-[196px]">
            <span className="flex items-center gap-2">
              <Map className="size-3.5 text-ink-muted" />
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((region) => (
              <SelectItem key={region} value={region}>
                {REGION_LABELS[region] ?? region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="ml-auto flex items-center gap-3 pr-1 text-[12px] text-ink-muted">
        {recordCount !== null ? (
          <span className="hidden sm:inline">
            <span className="tnum font-medium text-ink-secondary">
              {recordCount.toLocaleString('th-TH')}
            </span>{' '}
            รายการเที่ยวรถในขอบเขต
          </span>
        ) : null}
      </div>
    </div>
  )
}

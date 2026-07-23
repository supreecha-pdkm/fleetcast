import { CalendarRange, Map, Route as RouteIcon } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ALL_ROUTES_LABEL,
  HORIZON_OPTIONS,
  REGION_LABELS,
  horizonLabel,
  type HorizonOption,
} from '@/data/constants'
import {
  ALL_ROUTES,
  REGIONS,
  routesInRegion,
  type DashboardFilters,
  type RegionFilter,
} from '@/services/repository'

export interface FilterBarProps {
  readonly filters: DashboardFilters
  readonly onChange: (next: Partial<DashboardFilters>) => void
  readonly recordCount: number | null
}

/**
 * One filter row above everything it scopes. Every control re-queries the
 * warehouse, so every card below re-renders against the same slice. The route
 * list is scoped by the selected region; `useDashboard` resets the route back
 * to "all" whenever the region changes.
 *
 * The row sticks under the layout header (56px) so the scope stays readable
 * while the planner scrolls the cards it scopes. The outer wrapper bleeds past
 * the main column's padding and carries the plane colour, so content scrolling
 * behind never shows through the gutters beside the card's rounded corners.
 * `z-20` keeps it under the header (`z-30`); the select popovers are portalled
 * at `z-50` and still paint above both.
 */
export function FilterBar({ filters, onChange, recordCount }: FilterBarProps) {
  return (
    <div className="sticky top-14 z-20 -mx-4 bg-plane/90 px-4 pb-1 backdrop-blur lg:-mx-6 lg:px-6">
      <div className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-2 shadow-card sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Select
            value={String(filters.horizonDays)}
            onValueChange={(value) => onChange({ horizonDays: Number(value) as HorizonOption })}
          >
            <SelectTrigger aria-label="ช่วงเวลาพยากรณ์" className="w-full sm:w-42">
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
            <SelectTrigger aria-label="ภูมิภาคเครือข่าย" className="w-full sm:w-49">
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

          <Select value={filters.routeId} onValueChange={(value) => onChange({ routeId: value })}>
            <SelectTrigger aria-label="เส้นทาง" className="w-full sm:w-60">
              <span className="flex items-center gap-2">
                <RouteIcon className="size-3.5 text-ink-muted" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ROUTES}>{ALL_ROUTES_LABEL}</SelectItem>
              {routesInRegion(filters.region).map((route) => (
                <SelectItem key={route.id} value={route.id}>
                  {route.code} · {route.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 pr-1 text-[12px] text-ink-muted sm:ml-auto">
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
    </div>
  )
}

import { DataTable } from '@/components/charts/ChartCard'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

import { SEVERITY_DOT, SEVERITY_FILL } from '@/components/common/severity'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LOAD_FACTOR_THRESHOLDS } from '@/data/constants'
import { formatNumber, formatPercent } from '@/lib/format'
import { clamp, cn } from '@/lib/utils'
import type { CapacityBand } from '@/types/domain'

/**
 * Part-to-whole across four ordered capacity states. These are status
 * colours because the bands literally mean good/bad — not categorical
 * identity — and each carries a label and count, never colour alone.
 */
export function CapacityUtilization({
  bands,
  loadFactor,
}: {
  bands: readonly CapacityBand[]
  /** Network-wide predicted load factor, for the target comparison. */
  loadFactor: number
}) {
  const total = bands.reduce((acc, band) => acc + band.departures, 0)
  const target = LOAD_FACTOR_THRESHOLDS.target
  const onTarget = loadFactor >= target

  return (
    <div>
      {/* 2px surface gaps separate the segments — no borders on marks. */}
      <div
        className="flex h-3 w-full gap-0.5 overflow-hidden"
        role="img"
        aria-label="สัดส่วนการใช้ความจุ"
      >
        {bands
          .filter((band) => band.departures > 0)
          .map((band) => (
            <Tooltip key={band.label}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="h-full rounded-[3px] transition-opacity duration-150 hover:opacity-85 focus-visible:opacity-85"
                  style={{
                    width: `${band.share * 100}%`,
                    backgroundColor: SEVERITY_FILL[band.severity],
                  }}
                  aria-label={`${band.label}: ${band.departures} เที่ยวรถ`}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{band.label}</p>
                <p className="mt-1 text-ink-secondary">
                  {formatNumber(band.departures)} เที่ยวรถ · {formatPercent(band.share)}
                </p>
                <p className="mt-0.5 text-ink-muted">{band.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
      </div>

      <ul className="mt-4 space-y-2.5">
        {bands.map((band) => (
          <li key={band.label} className="flex items-start gap-2.5">
            <span
              className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', SEVERITY_DOT[band.severity])}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-ink">{band.label}</span>
                <span className="tnum shrink-0 text-[13px] font-semibold text-ink">
                  {formatPercent(band.share, 0)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] leading-4 text-ink-muted">{band.description}</span>
                <span className="tnum shrink-0 text-[11px] text-ink-muted">
                  {formatNumber(band.departures)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Where the network as a whole lands against the commercial target. */}
      <div className="mt-5 border-t border-hairline pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] font-medium tracking-[0.02em] text-ink-muted uppercase">
            อัตราบรรทุกทั้งเครือข่าย
          </span>
          <span className="tnum text-[15px] font-semibold text-ink">
            {formatPercent(loadFactor)}
          </span>
        </div>

        <div className="relative mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{
              width: `${clamp(loadFactor, 0, 1) * 100}%`,
              backgroundColor: onTarget ? 'var(--status-good)' : 'var(--status-warning)',
            }}
          />
          {/* Target marker — a 2px surface gap keeps it off the fill. */}
          <span
            className="absolute inset-y-0 w-0.5 bg-ink"
            style={{ left: `${target * 100}%` }}
            aria-hidden
          />
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-4 text-ink-muted">
          {onTarget ? (
            <CheckCircle2 className="size-3 shrink-0 text-good" aria-hidden />
          ) : (
            <AlertTriangle className="size-3 shrink-0 text-warning" aria-hidden />
          )}
          {onTarget
            ? `ถึงหรือสูงกว่าเป้าหมายเชิงพาณิชย์ที่ ${formatPercent(target, 0)}`
            : `ต่ำกว่าเป้าหมายเชิงพาณิชย์ที่ ${formatPercent(target, 0)} อยู่ ${Math.round((target - loadFactor) * 100)} จุด`}
        </p>
      </div>

      <p className="mt-4 text-[11px] leading-4 text-ink-muted">
        มีเที่ยวรถที่พยากรณ์ในขอบเขตนี้ {formatNumber(total)} เที่ยว เกณฑ์ “เหมาะสม”
        กำหนดไว้ที่อัตราบรรทุก 55–88% — สูงพอที่จะทำกำไร
        และยังเหลือส่วนต่างรองรับความต้องการที่พุ่งขึ้นกะทันหัน
      </p>
    </div>
  )
}

export function CapacityTable({ bands }: { bands: readonly CapacityBand[] }) {
  return (
    <DataTable
      headers={['ระดับ', 'นิยาม', 'จำนวนเที่ยวรถ', 'สัดส่วน']}
      align={['left', 'left', 'right', 'right']}
      rows={bands.map((band) => [
        band.label,
        band.description,
        formatNumber(band.departures),
        formatPercent(band.share),
      ])}
    />
  )
}

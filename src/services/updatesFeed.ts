import { MODEL, SIMULATED_NOW } from '@/data/constants'
import { formatShortDate } from '@/lib/date'
import { formatCompact, formatPercent } from '@/lib/format'
import type { ForecastModel } from '@/services/forecastEngine'
import type { ForecastUpdate, Recommendation, RouteForecast } from '@/types/domain'

function minutesAgo(minutes: number): string {
  return new Date(SIMULATED_NOW.getTime() - minutes * 60_000).toISOString()
}

/**
 * Activity feed for the model. Entries are written from the model's own
 * measured output, so the feed always agrees with the rest of the dashboard.
 */
export function buildUpdates(
  model: ForecastModel,
  routeForecasts: readonly RouteForecast[],
  recommendations: readonly Recommendation[],
  recordCount: number,
): ForecastUpdate[] {
  const topRoute = routeForecasts[0]
  const criticalRec = recommendations.find((r) => r.severity === 'critical')
  const weakest = [...routeForecasts].sort(
    (a, b) => a.predictedLoadFactor - b.predictedLoadFactor,
  )[0]
  const driftPoints = Math.abs(model.backtest.mape - model.previousBacktest.mape) * 100

  const entries: ForecastUpdate[] = [
    {
      id: 'u-publish',
      timestamp: minutesAgo(18),
      kind: 'publish',
      title: `เผยแพร่ผลพยากรณ์ · ${MODEL.version}`,
      detail: `ปรับปรุงช่วงพยากรณ์ 30 วัน ครอบคลุม ${routeForecasts.length} เส้นทาง และ ${model.fits.length} ชุดข้อมูลรอบเดินรถ`,
      routeCode: null,
    },
    ...(criticalRec
      ? [
          {
            id: 'u-alert',
            timestamp: minutesAgo(24),
            kind: 'alert' as const,
            title: 'พยากรณ์ว่าจะเกินความจุ',
            detail: `${criticalRec.title} — มีผลตั้งแต่ ${formatShortDate(criticalRec.effectiveFrom)}`,
            routeCode:
              routeForecasts.find((r) => r.route.id === criticalRec.routeId)?.route.code ?? null,
          },
        ]
      : []),
    {
      id: 'u-retrain',
      timestamp: minutesAgo(72),
      kind: 'retrain',
      title: 'เทรนโมเดลรอบกลางคืนเสร็จสิ้น',
      detail: `ข้อมูลเที่ยวรถ ${formatCompact(recordCount)} รายการ · ความแม่นยำบนชุดทดสอบ ${formatPercent(model.backtest.accuracy)} (MAPE ${formatPercent(model.backtest.mape)})`,
      routeCode: null,
    },
    {
      id: 'u-drift',
      timestamp: minutesAgo(96),
      kind: 'drift',
      title: driftPoints < 1.5 ? 'ผ่านการตรวจสอบค่าเบี่ยงเบน' : 'ค่าเบี่ยงเบนเกินเกณฑ์',
      detail: `ค่าความคลาดเคลื่อนเปลี่ยนไป ${driftPoints.toFixed(2)} จุด เทียบกับรอบประเมินก่อนหน้า ครอบคลุมช่วงความเชื่อมั่นที่ ${formatPercent(model.backtest.coverage, 0)}`,
      routeCode: null,
    },
    ...(topRoute
      ? [
          {
            id: 'u-top',
            timestamp: minutesAgo(140),
            kind: 'publish' as const,
            title: `ปรับพยากรณ์ ${topRoute.route.code} ขึ้น`,
            detail: `อัตราบรรทุกที่พยากรณ์อยู่ที่ ${formatPercent(topRoute.predictedLoadFactor)} สูงสุดวันที่ ${formatShortDate(topRoute.peakDate)}`,
            routeCode: topRoute.route.code,
          },
        ]
      : []),
    {
      id: 'u-ingest',
      timestamp: minutesAgo(311),
      kind: 'ingest',
      title: 'นำเข้าข้อมูลการจำหน่ายตั๋วแล้ว',
      detail:
        'โหลดรายงาน GIS ฉบับที่ 03 ของกรีนบัส (รายได้รายเวลา) เรียบร้อย — ไม่มีแถวที่ถูกปฏิเสธ และปกปิดข้อมูลส่วนบุคคลตั้งแต่ขั้นนำเข้า',
      routeCode: null,
    },
    ...(weakest
      ? [
          {
            id: 'u-weak',
            timestamp: minutesAgo(402),
            kind: 'alert' as const,
            title: `แจ้งเตือน ${weakest.route.code} ใช้ความจุไม่เต็มศักยภาพ`,
            detail: `อัตราบรรทุกที่พยากรณ์อยู่ที่ ${formatPercent(weakest.predictedLoadFactor)} ต่อเนื่องในทุกรอบเดินรถ`,
            routeCode: weakest.route.code,
          },
        ]
      : []),
  ]

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

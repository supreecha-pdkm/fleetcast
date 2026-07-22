import {
  Boxes,
  Building2,
  CalendarRange,
  Database,
  LayoutDashboard,
  Route as RouteIcon,
  Settings,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  readonly id: string
  readonly label: string
  readonly icon: LucideIcon
  readonly badge?: string
  readonly disabled?: boolean
}

export interface NavSection {
  readonly title: string
  readonly items: readonly NavItem[]
}

/**
 * Navigation is presentational — this prototype is a single page, so items
 * other than the overview are rendered as unavailable rather than linking
 * somewhere that does not exist.
 */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: 'การพยากรณ์',
    items: [
      { id: 'overview', label: 'ภาพรวมความต้องการ', icon: LayoutDashboard },
      { id: 'horizon', label: 'วางแผนช่วงพยากรณ์', icon: CalendarRange, disabled: true },
      { id: 'routes', label: 'สำรวจเส้นทาง', icon: RouteIcon, disabled: true },
      { id: 'yield', label: 'รายได้และราคา', icon: TrendingUp, disabled: true },
    ],
  },
  {
    title: 'ปฏิบัติการ',
    items: [
      { id: 'fleet', label: 'การจัดสรรรถโดยสาร', icon: Boxes, disabled: true },
      {
        id: 'recommendations',
        label: 'ข้อเสนอแนะ',
        icon: Sparkles,
        badge: 'AI',
        disabled: true,
      },
      { id: 'depots', label: 'อู่รถและสถานี', icon: Building2, disabled: true },
    ],
  },
  {
    title: 'ระบบ',
    items: [
      { id: 'sources', label: 'แหล่งข้อมูล', icon: Database, disabled: true },
      { id: 'settings', label: 'ตั้งค่า', icon: Settings, disabled: true },
    ],
  },
]

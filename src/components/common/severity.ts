import type { RouteStatus, Severity } from '@/types/domain'

/**
 * Presentation tokens for the fixed status palette. Kept out of component
 * modules so the constants can be shared without breaking Fast Refresh.
 *
 * Status colour never travels alone — every consumer pairs these with an
 * icon and a label.
 */

export const SEVERITY_DOT: Record<Severity, string> = {
  good: 'bg-good',
  warning: 'bg-warning',
  serious: 'bg-serious',
  critical: 'bg-critical',
}

export const SEVERITY_CHIP: Record<Severity, string> = {
  good: 'bg-good-wash text-good',
  warning: 'bg-warning-wash text-warning',
  serious: 'bg-serious-wash text-serious',
  critical: 'bg-critical-wash text-critical',
}

export const SEVERITY_FILL: Record<Severity, string> = {
  good: 'var(--status-good)',
  warning: 'var(--status-warning)',
  serious: 'var(--status-serious)',
  critical: 'var(--status-critical)',
}

/** How soon the recommendation needs a decision. */
export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'ดำเนินการทันที',
  serious: 'ภายในสัปดาห์นี้',
  warning: 'วางแผนล่วงหน้า',
  good: 'โอกาส',
}

/** Route health, in the words an ops planner uses. */
export const ROUTE_STATUS_LABEL: Record<RouteStatus, string> = {
  healthy: 'ปกติ',
  warning: 'เฝ้าระวัง',
  critical: 'วิกฤต',
}

export const SEVERITY_TONE: Record<Severity, Severity> = {
  good: 'good',
  warning: 'warning',
  serious: 'serious',
  critical: 'critical',
}

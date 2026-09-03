import type { WorkItem, WorkItemStatus } from '@/data/types'
import { cn } from '@/lib/cn'

import { Badge } from './Badge'
import { NumericText } from './NumericText'

/**
 * Status reads as categorical severity, the same convention Recruit's
 * strengths/gaps badges and Tracking's landed/not-landed badges already use
 * — sky good, warn caution, critical needs attention, muted just informing.
 */
const STATUS_TONE: Record<WorkItemStatus, 'sky' | 'warn' | 'critical' | 'muted'> = {
  'On Track': 'sky',
  'At Risk': 'warn',
  Blocked: 'critical',
  'Wrapping Up': 'muted',
}

const STATUS_BAR_COLOR: Record<WorkItemStatus, string> = {
  'On Track': 'bg-sky',
  'At Risk': 'bg-warn',
  Blocked: 'bg-critical',
  'Wrapping Up': 'bg-haze/50',
}

/**
 * What's behind a Workload % — a stacked bar sized by each item's loadPct,
 * then the same breakdown as a short list. Explicitly not a task board: no
 * drag targets, no per-item detail beyond what's here, nothing to reorder.
 */
export function WorkloadBreakdown({ items }: { items: WorkItem[] }) {
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-line/40">
        {items.map((item) => (
          <div
            key={item.project}
            className={cn('h-full', STATUS_BAR_COLOR[item.status])}
            style={{ width: `${item.loadPct}%` }}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li key={item.project} className="flex items-center justify-between gap-2 text-small">
            <span className="min-w-0 truncate">
              <NumericText>{item.project}</NumericText>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="num text-micro text-haze">{item.loadPct}%</span>
              <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

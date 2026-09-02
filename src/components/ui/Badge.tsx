import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'sky' | 'signal' | 'warn' | 'critical' | 'muted'

const tones: Record<Tone, string> = {
  neutral: 'border-line bg-panel-raised text-text',
  sky: 'border-sky/40 bg-sky/10 text-sky',
  signal: 'border-signal/50 bg-signal/15 text-sky',
  warn: 'border-warn/40 bg-warn/10 text-warn',
  critical: 'border-critical/40 bg-critical/10 text-critical',
  muted: 'border-line/70 bg-transparent text-haze',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] leading-5',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

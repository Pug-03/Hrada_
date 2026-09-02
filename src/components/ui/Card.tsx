import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

import { NumericText } from './NumericText'

interface CardProps {
  children: ReactNode
  className?: string
  /**
   * Hierarchy, not decoration. `flat` is a plain surface, `raised` is the one
   * an action lives on, `quiet` recedes. §3.3 warns against giving every card
   * the same radius and shadow regardless of what it holds.
   */
  tone?: 'flat' | 'raised' | 'quiet'
  interactive?: boolean
}

const tones = {
  flat: 'bg-panel border-line',
  raised: 'bg-panel-raised border-line',
  quiet: 'bg-panel/50 border-line/60',
}

export function Card({ children, className, tone = 'flat', interactive = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border',
        tones[tone],
        interactive &&
          'transition-[background-color,transform] duration-150 hover:bg-panel-raised hover:-translate-y-0.5',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  hint,
  right,
}: {
  title: string
  /** ReactNode so a hint carrying figures can put them in the mono face. */
  hint?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
      <div>
        <h2 className="text-[20px] leading-tight font-semibold">{title}</h2>
        {hint ? (
          <p className="mt-1 text-[13px] text-haze">
            {typeof hint === 'string' ? <NumericText>{hint}</NumericText> : hint}
          </p>
        ) : null}
      </div>
      {right}
    </div>
  )
}

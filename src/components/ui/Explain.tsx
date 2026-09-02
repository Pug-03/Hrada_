import type { ScoreComponent } from '@/lib/scoring'

import { NumericText } from './NumericText'
import { Num } from './Num'

/**
 * §12 — the shared breakdown view. Every score in the product is a weighted
 * sum, and every one of them explains itself with this component, so the
 * explanation always matches the arithmetic that produced the number.
 */
export function ScoreBreakdown({
  components,
  total,
  totalLabel = 'Total',
}: {
  components: ScoreComponent[]
  total: number
  totalLabel?: string
}) {
  return (
    <div className="space-y-3">
      {components.map((component) => (
        <div key={component.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px]">{component.label}</span>
            <span className="text-[13px] text-haze">
              <Num value={component.earned} decimals={1} className="text-sky" />
              <span className="num"> / {component.weight}</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-line/70">
            <div
              className="h-full rounded-full bg-sky/80"
              style={{ width: `${Math.min(100, component.ratio * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-haze">
            <NumericText>{component.detail}</NumericText>
          </p>
        </div>
      ))}
      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <span className="text-[13px] font-semibold">{totalLabel}</span>
        <Num value={total} decimals={1} className="text-[20px] text-sky" />
      </div>
    </div>
  )
}

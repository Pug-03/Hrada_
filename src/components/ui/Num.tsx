import { cn } from '@/lib/cn'
import { useCountUp } from '@/hooks/useCountUp'

interface NumProps {
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  className?: string
  /** Count up on mount. Off by default — only KPI headlines animate (§5). */
  animate?: boolean
}

/**
 * The only way a number reaches the screen. Everything routes through here so
 * §14.8 (mono, tabular-nums, everywhere) cannot be forgotten in one component.
 */
export function Num({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  className,
  animate = false,
}: NumProps) {
  const animated = useCountUp(value)
  const shown = animate ? animated : value
  return (
    <span className={cn('num', className)}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  )
}

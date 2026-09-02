import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-signal text-text hover:bg-signal/85 border-transparent',
  secondary: 'bg-panel-raised text-text border-line hover:bg-line',
  ghost: 'bg-transparent text-haze border-transparent hover:bg-panel-raised hover:text-text',
  danger: 'bg-transparent text-critical border-critical/40 hover:bg-critical/10',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: ReactNode
}

/**
 * §3.3 / §6 — the label says what will happen and stays identical through the
 * flow. No arrow is appended: an arrow on every button says nothing.
 */
export function Button({ variant = 'secondary', icon, className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-small font-medium',
        'transition-[background-color,transform,opacity] duration-150 active:translate-y-px',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

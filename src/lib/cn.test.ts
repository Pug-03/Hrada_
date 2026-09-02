import { describe, expect, it } from 'vitest'

import { cn, TYPE_SCALE } from './cn'

/**
 * These exist because the failure mode is silent. A dropped size class does
 * not error, it just renders at the inherited size, and the two places most
 * likely to hit it — Badge and Button — pair a scale class with a colour.
 */
describe('cn', () => {
  it('keeps a type-scale class alongside a text colour', () => {
    for (const size of TYPE_SCALE) {
      const result = cn(`text-${size}`, 'text-sky')
      expect(result, size).toContain(`text-${size}`)
      expect(result, size).toContain('text-sky')
    }
  })

  it('still lets one type-scale class override another', () => {
    expect(cn('text-body', 'text-micro')).toBe('text-micro')
  })

  it('still lets one text colour override another', () => {
    expect(cn('text-sky', 'text-warn')).toBe('text-warn')
  })

  it('merges ordinary conflicts as before', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('drops falsy entries the way clsx always has', () => {
    const hidden = false
    expect(cn('rounded-lg', hidden && 'hidden', undefined, 'bg-panel')).toBe(
      'rounded-lg bg-panel',
    )
  })
})

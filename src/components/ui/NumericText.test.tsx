/**
 * @vitest-environment jsdom
 */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { NumericText } from './NumericText'

describe('NumericText', () => {
  it('wraps every numeric run in the mono class', () => {
    const { container } = render(
      <NumericText>Workload 92% เกิน 85% และผลงาน 4.6/5.0</NumericText>,
    )
    const monos = [...container.querySelectorAll('.num')].map((n) => n.textContent?.trim())
    expect(monos).toEqual(['92%', '85%', '4.6', '5.0'])
  })

  it('leaves text with no digits untouched', () => {
    const { container } = render(<NumericText>ไม่มีตัวเลขในประโยคนี้</NumericText>)
    expect(container.querySelectorAll('.num')).toHaveLength(0)
    expect(container.textContent).toBe('ไม่มีตัวเลขในประโยคนี้')
  })

  it('keeps the full sentence intact', () => {
    const text = 'ครอบคลุม 2 skill ที่ยังขาด และมี Fit 76.8%'
    const { container } = render(<NumericText>{text}</NumericText>)
    expect(container.textContent).toBe(text)
  })
})

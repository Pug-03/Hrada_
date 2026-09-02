import { Fragment } from 'react'

/**
 * §14.8 — every number in the system is mono with tabular figures, including
 * the ones embedded in sentences the scoring engine writes.
 *
 * The engine returns explanation text as prose ("Workload 92% is above 85%"), so
 * the digits inside it are split out here and given the mono treatment rather
 * than restructuring every explanation into fragments. The surrounding Thai
 * stays in the body face, which is what makes the numbers read as numbers.
 */
const SPLIT_NUMERIC = /(\d+(?:[.,]\d+)*\s?%?)/g
// Separate, non-global copy: a /g regex carries lastIndex between .test calls.
const IS_NUMERIC = /^\d+(?:[.,]\d+)*\s?%?$/

export function NumericText({ children }: { children: string }) {
  const parts = children.split(SPLIT_NUMERIC)
  return (
    <>
      {parts.map((part, i) =>
        IS_NUMERIC.test(part) ? (
          <span key={i} className="num">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

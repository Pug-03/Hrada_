import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Design rules that are easy to state and easy to break months later. Each one
 * is checked against the source rather than trusted to review, because every
 * one of them was found broken at least once during the build.
 */
const ROOT = resolve(process.cwd(), 'src')

function sourceFiles(dir = ROOT): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.(ts|tsx)$/.test(entry) ? [full] : []
  })
}

const files = sourceFiles().map((path) => ({
  path: relative(ROOT, path),
  source: readFileSync(path, 'utf8'),
}))

const css = readFileSync(join(ROOT, 'index.css'), 'utf8')

describe('§3.1 the palette is closed', () => {
  it('declares colour literals only in theme.ts', () => {
    const offenders = files
      .filter((f) => f.path !== 'lib/theme.ts')
      .filter((f) => /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/.test(f.source))
      .map((f) => f.path)
    // Comments count too: a hex in a comment is a hex somebody will paste.
    expect(offenders).toEqual([])
  })

  it('declares every token in the stylesheet', () => {
    for (const token of [
      'ink',
      'panel',
      'panel-raised',
      'line',
      'signal',
      'sky',
      'haze',
      'text',
      'warn',
      'critical',
    ]) {
      expect(css, token).toContain(`--color-${token}:`)
    }
  })
})

describe('§3.2 the type scale', () => {
  it('is used by name, never as an arbitrary pixel value', () => {
    // An arbitrary pixel size renders identically to its named token today,
    // but it does not follow the token if the scale ever moves, and the editor
    // flags every one of them.
    const offenders = files
      .filter((f) => !f.path.startsWith('test/') && f.path !== 'lib/cn.test.ts')
      .filter((f) => /\btext-\[\d+px\]/.test(f.source))
      .map((f) => f.path)
    expect(offenders).toEqual([])
  })

  it('declares exactly the six sizes §3.2 allows', () => {
    const declared = [...css.matchAll(/--text-([a-z]+):/g)].map((m) => m[1]).sort()
    expect(declared).toEqual(['body', 'display', 'micro', 'section', 'small', 'title'])
  })
})

describe('charts carry no light-theme defaults', () => {
  const charts = files.find((f) => f.path === 'components/charts/Charts.tsx')!

  it('routes every tooltip through the themed wrapper', () => {
    // A bare <Tooltip> would inherit Recharts' white body.
    const bare = charts.source.match(/<Tooltip\b/g) ?? []
    expect(bare).toHaveLength(1) // the single definition inside ChartTooltip
    expect(charts.source).toContain('function ChartTooltip')
  })

  it('overrides the tooltip body, the hover cursor and the active dot', () => {
    expect(charts.source).toContain('contentStyle')
    expect(charts.source).toContain('itemStyle')
    // Recharts defaults these to white and light grey respectively.
    expect(charts.source).toMatch(/activeDot=\{\{[^}]*stroke:/)
    expect(charts.source).toMatch(/cursor === 'line'/)
  })
})

describe('focus is always visible', () => {
  it('defines a token-coloured focus ring', () => {
    expect(css).toContain(':focus-visible')
    expect(css).toContain('outline: 2px solid var(--color-sky)')
  })

  it('never clears an outline without restoring a ring in the same file', () => {
    const offenders = files
      .filter((f) => f.source.includes('outline-none'))
      .filter((f) => !f.source.includes('focus-ring'))
      .map((f) => f.path)
    expect(offenders).toEqual([])
  })
})

describe('chrome follows the theme rather than the OS', () => {
  it('themes the scrollbar in both engines', () => {
    expect(css).toContain('scrollbar-width: thin')
    expect(css).toContain('scrollbar-color:')
    expect(css).toContain('::-webkit-scrollbar-thumb')
  })

  it('themes the selection colour', () => {
    expect(css).toContain('::selection')
  })
})

describe('§5 loading states', () => {
  it('uses the named skeleton, never a generic spinner', () => {
    const offenders = files
      .filter((f) => !f.path.startsWith('test/'))
      .filter((f) => /animate-spin|Loader2|<Spinner/.test(f.source))
      .map((f) => f.path)
    expect(offenders).toEqual([])
  })

  it('names what is being analysed on every analysis screen', () => {
    for (const path of ['pages/Recruit.tsx', 'pages/TeamMatching.tsx']) {
      const page = files.find((f) => f.path === path)!
      expect(page.source, path).toContain('<AnalysisLoader')
      expect(page.source, path).toMatch(/message=\{`กำลังวิเคราะห์/)
    }
  })
})

import { useReducedMotion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { colors, withAlpha } from '@/lib/theme'

const axis = { stroke: colors.haze, fontSize: 11, tickLine: false }
/** §14.8 — numeric ticks take the mono face; categorical ones stay in the body face. */
const numericTick = { fill: colors.haze, fontSize: 11, fontFamily: 'var(--font-mono)' }
const categoricalTick = { fill: colors.haze, fontSize: 11 }
const gridProps = { stroke: colors.line, strokeDasharray: '3 3', vertical: false }

/**
 * Recharts ships light-theme defaults that only show up on interaction — a
 * white tooltip body, a light-grey hover cursor, a white ring on the
 * active dot.
 * Every one of them is overridden here rather than per chart, so a new chart
 * cannot reintroduce them by omission.
 */
function ChartTooltip({
  suffix = '',
  cursor = 'area',
}: {
  suffix?: string
  /** Bars highlight the band behind them; lines get a vertical guide. */
  cursor?: 'area' | 'line' | false
}) {
  return (
    <Tooltip
      cursor={
        cursor === false
          ? false
          : cursor === 'line'
            ? { stroke: colors.line, strokeWidth: 1 }
            : { fill: withAlpha(colors.sky, 0.06) }
      }
      contentStyle={{
        background: colors.panelRaised,
        border: `1px solid ${colors.line}`,
        borderRadius: 8,
        fontSize: 12,
        color: colors.text,
        boxShadow: `0 8px 24px ${withAlpha(colors.ink, 0.55)}`,
        padding: '6px 10px',
      }}
      wrapperStyle={{ outline: 'none' }}
      labelStyle={{ color: colors.haze, fontSize: 11 }}
      itemStyle={{ color: colors.text, fontSize: 12, padding: 0 }}
      formatter={(value) => [`${value ?? ''}${suffix}`, '']}
    />
  )
}

/**
 * §5 — charts draw in once on mount and stay put afterwards. Recharts replays
 * its animation on every data change by default, which turns a filter tweak
 * into a full redraw; isAnimationActive is bound to first mount only.
 */
export function CoverageBarChart({
  data,
}: {
  data: { department: string; coverage: number; coveredCount: number; demandCount: number }[]
}) {
  const reduced = useReducedMotion()
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="department" {...axis} tick={categoricalTick} />
        <YAxis
          {...axis}
          tick={numericTick}
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          width={44}
        />
        <ChartTooltip suffix="%" cursor="area" />
        <Bar
          dataKey={(row: { coverage: number }) => Math.round(row.coverage * 100)}
          name="Skill Coverage"
          fill={colors.sky}
          radius={[4, 4, 0, 0]}
          maxBarSize={46}
          isAnimationActive={!reduced}
          animationDuration={700}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SkillHistoryLineChart({
  data,
  series,
}: {
  data: Record<string, number | string>[]
  series: { key: string; name: string; color: string }[]
}) {
  const reduced = useReducedMotion()
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -22 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="month" {...axis} tick={numericTick} />
        <YAxis {...axis} tick={numericTick} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} width={40} />
        <ChartTooltip cursor="line" />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 2.5, strokeWidth: 0 }}
            // Recharts rings the active dot in white by default.
            activeDot={{ r: 4, stroke: colors.panel, strokeWidth: 2 }}
            isAnimationActive={!reduced}
            animationDuration={800}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function SkillRadarChart({
  data,
  currentLabel = 'Current level',
  targetLabel = 'Target role',
}: {
  data: { skill: string; level: number; required?: number }[]
  currentLabel?: string
  targetLabel?: string
}) {
  const reduced = useReducedMotion()
  const hasTarget = data.some((d) => d.required !== undefined)
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={colors.line} />
        <PolarAngleAxis dataKey="skill" tick={{ ...categoricalTick, fontSize: 10 }} />
        <PolarRadiusAxis
          domain={[0, 5]}
          tick={{ ...numericTick, fontSize: 9 }}
          axisLine={false}
        />
        <ChartTooltip cursor={false} />
        {hasTarget ? (
          <Radar
            name={targetLabel}
            dataKey="required"
            stroke={colors.haze}
            strokeDasharray="4 3"
            fill="transparent"
            isAnimationActive={!reduced}
            animationDuration={700}
          />
        ) : null}
        <Radar
          name={currentLabel}
          dataKey="level"
          stroke={colors.sky}
          fill={colors.sky}
          fillOpacity={0.18}
          isAnimationActive={!reduced}
          animationDuration={800}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

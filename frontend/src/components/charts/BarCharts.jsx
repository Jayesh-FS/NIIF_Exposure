import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--white)',
    border: '1px solid var(--border2)',
    borderRadius: 8,
    fontSize: 11,
    fontFamily: 'Inter',
  },
}

/** Vertical bar chart */
export function VerticalBar({
  data, dataKey, nameKey = 'label',
  color = 'var(--blue)', height = 280,
  unit = '', formatter,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey={nameKey}
          tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'Inter' }}
          tickLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={48}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'Inter' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatter}
        />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [formatter ? formatter(v) : `${v}${unit}`, dataKey]} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Horizontal bar chart — best for named group comparisons */
export function HorizontalBar({
  data, dataKey, nameKey = 'name',
  color = 'var(--blue)', height,
  unit = '', formatter,
}) {
  const h = height || Math.max(220, data.length * 28)
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'Inter' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatter}
        />
        <YAxis
          type="category"
          dataKey={nameKey}
          width={90}
          tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'Inter' }}
          tickLine={false}
        />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [formatter ? formatter(v) : `${v}${unit}`, dataKey]} />
        <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} maxBarSize={18}>
          <LabelList
            dataKey={dataKey}
            position="right"
            style={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'Inter' }}
            formatter={(v) => formatter ? formatter(v) : `${v}${unit}`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Multi-series grouped bar */
export function GroupedBar({
  data, series, nameKey = 'name',
  height = 280,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey={nameKey}
          tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'Inter' }}
          tickLine={false}
          angle={-30}
          textAnchor="end"
          height={48}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'Inter' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip {...TOOLTIP_STYLE} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={20} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

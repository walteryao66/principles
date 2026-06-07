import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { Stats, Category } from '../types'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types'

const tooltipStyle = {
  backgroundColor: '#1c1c1f',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
  fontSize: '13px',
  color: '#f5f5f7',
}

const legendStyle = {
  color: '#86868b',
  fontSize: '12px',
}

export default function StatsChart({ stats }: { stats: Stats }) {
  const categoryData = (Object.keys(stats.by_category) as Category[]).map(cat => ({
    name: CATEGORY_LABELS[cat],
    value: stats.by_category[cat],
    color: CATEGORY_COLORS[cat],
  }))

  const sourceData = Object.entries(stats.by_source)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name,
      value,
      color: name === 'Ray Dalio' ? '#0a84ff' : name === 'Naval Ravikant' ? '#ff9f0a' : '#6e6e73',
    }))
    .sort((a, b) => b.value - a.value)

  const themeData = Object.entries(stats.by_theme)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const hasThemes = themeData.length > 0

  const chartTitle = 'text-sm text-[#f5f5f7] font-medium tracking-tight mb-4'
  const cardBase = 'bg-[#161618] border border-white/[0.06] rounded-2xl p-5 transition-all duration-300 hover:border-white/[0.1]'

  return (
    <div className={`grid grid-cols-1 ${hasThemes ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
      {/* Category pie chart */}
      <div className={cardBase}>
        <h3 className={chartTitle}>分类分布</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={80}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
              labelLine={false}
            >
              {categoryData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={legendStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Source bar chart */}
      <div className={cardBase}>
        <h3 className={chartTitle}>来源分布</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={sourceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#86868b' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: '#86868b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" name="数量" radius={[4, 4, 0, 0]}>
              {sourceData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Theme bar chart (conditional) */}
      {hasThemes && (
        <div className={cardBase}>
          <h3 className={chartTitle}>主题分布</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={themeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#86868b' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#86868b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" name="数量" fill="#0a84ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

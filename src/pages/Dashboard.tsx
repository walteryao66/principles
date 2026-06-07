import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/principles'
import type { Stats, Principle, Category } from '../types'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types'
import { mergeWithPersonalization, getPersonalizedCount, getDeprecatedIds } from '../utils/personalization'
import {
  IconBook, IconEdit, IconDoc, IconShield,
  IconActivity, IconTag, IconCheck, IconClock,
  IconZap, IconLayers,
} from '../components/Icons'
import PrincipleCard from '../components/PrincipleCard'

// 分类配置
const catConfig: { key: Category; label: string; color: string; bg: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { key: 'work', label: '工作', color: CATEGORY_COLORS.work, bg: 'rgba(10,132,255,0.08)', icon: IconActivity },
  { key: 'invest', label: '投资', color: CATEGORY_COLORS.invest, bg: 'rgba(48,209,88,0.08)', icon: IconZap },
  { key: 'life', label: '生活', color: CATEGORY_COLORS.life, bg: 'rgba(255,159,10,0.08)', icon: IconShield },
]

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Principle[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState('')
  const [localPersonalized, setLocalPersonalized] = useState(0)
  const [localDeprecated, setLocalDeprecated] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([api.getStats(), api.listPrinciples()])
      setStats(s)
      setRecent(r.slice(0, 6).map(mergeWithPersonalization))
      setLocalPersonalized(getPersonalizedCount())
      setLocalDeprecated(getDeprecatedIds().size)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSeed = async () => {
    setSeeding(true)
    try { const res = await api.seedData(); setSeedResult(res.message); await fetchData() }
    catch (e: any) { setSeedResult(`错误：${e.message}`) }
    finally { setSeeding(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-white/[0.1] border-t-[#0a84ff] rounded-full animate-spin" />
      </div>
    )
  }

  const total = stats?.total || 0
  const progress = total > 0 ? Math.round((localPersonalized / total) * 100) : 0
  const themeCount = stats ? Object.keys(stats.by_theme || {}).filter(k => (stats.by_theme[k] || 0) > 0).length : 0

  return (
    <div className="space-y-12">
      {/* ============================================
          Hero — 数字驱动叙事
          ============================================ */}
      <section className="pt-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-full">
              <IconShield size={14} className="text-[#0a84ff]" />
              <span className="text-[11px] text-[#86868b] font-medium tracking-wide uppercase">Principles Library</span>
            </div>
            <h1 className="text-[42px] leading-[1.05] font-semibold tracking-tighter text-[#f5f5f7]">
              个人<br/>原则库
            </h1>
            <p className="text-[15px] text-[#86868b] leading-relaxed max-w-md">
              基于 Ray Dalio 与 Naval Ravikant 的思想体系，构建属于你的工作、投资与生活原则。
              每个人的定制数据独立存储于本地浏览器。
            </p>
          </div>

          {/* KPI 卡片 */}
          <div className="flex gap-4">
            <div className="bg-[#161618] border border-white/[0.06] rounded-2xl px-6 py-5 text-center min-w-[100px]">
              <div className="text-[36px] font-semibold tracking-tighter text-[#0a84ff]">{total}</div>
              <div className="text-[11px] text-[#6e6e73] mt-0.5 tracking-wide uppercase">总原则</div>
            </div>
            <div className="bg-[#161618] border border-white/[0.06] rounded-2xl px-6 py-5 text-center min-w-[100px]">
              <div className="text-[36px] font-semibold tracking-tighter text-[#30d158]">{localPersonalized}</div>
              <div className="text-[11px] text-[#6e6e73] mt-0.5 tracking-wide uppercase">已定制</div>
            </div>
            <div className="bg-[#161618] border border-white/[0.06] rounded-2xl px-6 py-5 text-center min-w-[100px]">
              <div className="text-[36px] font-semibold tracking-tighter text-[#ff9f0a]">{localDeprecated}</div>
              <div className="text-[11px] text-[#6e6e73] mt-0.5 tracking-wide uppercase">已淘汰</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          空数据
          ============================================ */}
      {total === 0 && (
        <div className="bg-[#1c1c1e] border border-white/[0.06] rounded-2xl p-8 text-center space-y-4">
          <IconBook size={40} className="mx-auto text-[#48484d]" />
          <p className="text-[15px] text-[#86868b]">数据库为空，请先导入初始原则</p>
          <button
            onClick={handleSeed} disabled={seeding}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a84ff] text-white text-sm font-medium rounded-xl hover:bg-[#1a8eff] transition-colors disabled:opacity-50"
          >
            {seeding ? '导入中...' : '导入种子数据'}
          </button>
          {seedResult && <p className="text-xs text-[#6e6e73]">{seedResult}</p>}
        </div>
      )}

      {total > 0 && (
        <>
          {/* ============================================
              进度条
              ============================================ */}
          <section className="bg-[#161618] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-[#86868b] font-medium">定制进度</span>
              <span className="text-[13px] text-[#f5f5f7] font-medium tabular-nums">
                {localPersonalized} / {total}
              </span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0a84ff] to-[#30d158] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          {/* ============================================
              分类分布
              ============================================ */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {catConfig.map(cat => {
              const count = stats?.by_category[cat.key] || 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <Link
                  key={cat.key}
                  to={`/principles?category=${cat.key}`}
                  className="group bg-[#161618] border border-white/[0.06] rounded-2xl p-5 hover:bg-[#1c1c1f] hover:border-white/[0.1] transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cat.bg }}>
                      <span style={{ color: cat.color }}>
                        <cat.icon size={18} />
                      </span>
                    </div>
                    <IconEdit size={14} className="text-[#48484d] group-hover:text-[#86868b] transition-colors" />
                  </div>
                  <div className="text-[28px] font-semibold tracking-tighter" style={{ color: cat.color }}>
                    {count}
                  </div>
                  <div className="text-[13px] text-[#86868b] mt-0.5">{cat.label}原则</div>
                  <div className="mt-3 text-[12px] text-[#6e6e73]">{pct}% 占比</div>
                </Link>
              )
            })}
          </section>

          {/* ============================================
              来源分布
              ============================================ */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <IconLayers size={16} className="text-[#6e6e73]" />
              <span className="text-[13px] text-[#86868b] font-medium uppercase tracking-wide">来源分布</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(stats?.by_source || {})
                .filter(([, v]) => (v as number) > 0)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([name, count]) => {
                  const cnt = count as number
                  const pct = total > 0 ? Math.round((cnt / total) * 100) : 0
                  const color = name === 'Ray Dalio' ? '#0a84ff' : name === 'Naval Ravikant' ? '#ff9f0a' : '#86868b'
                  return (
                    <div key={name} className="bg-[#161618] border border-white/[0.06] rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[14px] font-medium text-[#f5f5f7]">{name}</span>
                        <span className="text-[14px] font-semibold tabular-nums" style={{ color }}>{cnt}</span>
                      </div>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <div className="text-[11px] text-[#6e6e73] mt-2">{pct}% · {cnt} 条原则</div>
                    </div>
                  )
                })}
            </div>
          </section>

          {/* ============================================
              最近原则
              ============================================ */}
          {recent.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <IconClock size={16} className="text-[#6e6e73]" />
                  <span className="text-[13px] text-[#86868b] font-medium uppercase tracking-wide">最近更新</span>
                </div>
                <Link to="/principles" className="text-[13px] text-[#0a84ff] hover:text-[#1a8eff] transition-colors">
                  查看全部 →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recent.map(p => (
                  <PrincipleCard key={p.id} principle={p} />
                ))}
              </div>
            </section>
          )}

          {/* ============================================
              CTA
              ============================================ */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/customize"
              className="group flex items-center gap-4 bg-[#161618] border border-white/[0.06] rounded-2xl p-6 hover:bg-[#1c1c1f] hover:border-[#0a84ff]/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0a84ff]/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <IconEdit size={22} className="text-[#0a84ff]" />
              </div>
              <div>
                <div className="text-[15px] font-medium text-[#f5f5f7]">个性化定制</div>
                <div className="text-[13px] text-[#6e6e73] mt-0.5">评分、备注、修改每条原则</div>
              </div>
            </Link>
            <Link
              to="/generate"
              className="group flex items-center gap-4 bg-[#161618] border border-white/[0.06] rounded-2xl p-6 hover:bg-[#1c1c1f] hover:border-[#30d158]/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#30d158]/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <IconDoc size={22} className="text-[#30d158]" />
              </div>
              <div>
                <div className="text-[15px] font-medium text-[#f5f5f7]">生成正式版 V1</div>
                <div className="text-[13px] text-[#6e6e73] mt-0.5">导出你的个人原则规范</div>
              </div>
            </Link>
          </section>
        </>
      )}
    </div>
  )
}

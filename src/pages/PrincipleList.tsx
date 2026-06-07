import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/principles'
import type { Principle, Category } from '../types'
import { CATEGORY_LABELS, STATUS_LABELS } from '../types'
import { mergeWithPersonalization } from '../utils/personalization'
import PrincipleCard from '../components/PrincipleCard'
import {
  IconSearch, IconPlus, IconEdit, IconCheck, IconTrash, IconBook,
  IconActivity, IconZap, IconShield,
} from '../components/Icons'

const CATEGORY_ICONS: Record<Category, React.FC<{ size?: number; className?: string }>> = {
  work: IconActivity,
  invest: IconZap,
  life: IconShield,
}

export default function PrincipleList() {
  const [principles, setPrinciples] = useState<Principle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  const categoryFilter = searchParams.get('category') || ''
  const statusFilter = searchParams.get('status') || ''
  const search = searchParams.get('search') || ''

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.listPrinciples({
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      })
      setPrinciples(data.map(mergeWithPersonalization))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, statusFilter, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateFilter = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams)
    if (value) {
      p.set(key, value)
    } else {
      p.delete(key)
    }
    setSearchParams(p)
  }

  const handleDeprecate = async (id: number, title: string) => {
    if (!confirm(`确定汰换原则「${title}」吗？汰换后的原则将标记为已淘汰。`)) return
    await api.deprecatePrinciple(id)
    fetchData()
  }

  const handlePublish = async (id: number) => {
    await api.publishPrinciple(id)
    fetchData()
  }

  // Group by category for category headers
  const categoryOrder: Category[] = ['work', 'invest', 'life']
  const grouped = useMemo(() => {
    const map: Record<Category, Principle[]> = { work: [], invest: [], life: [] }
    for (const p of principles) {
      map[p.category].push(p)
    }
    return map
  }, [principles])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/[0.08] border-t-[#0a84ff]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ============================================
          Filter bar — bg-[#161618] card
          ============================================ */}
      <div className="bg-[#161618] border border-white/[0.06] rounded-2xl p-5 space-y-4">
        {/* Row 1: Category pills */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs font-medium text-[#6e6e73] tracking-wider uppercase mr-1">分类</span>
          {(['', 'work', 'invest', 'life'] as (string | Category)[]).map(c => {
            const Icon = c ? CATEGORY_ICONS[c as Category] : null
            return (
              <button
                key={c}
                onClick={() => updateFilter('category', c)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 active:scale-[0.97] ${
                  categoryFilter === c
                    ? 'bg-[#0a84ff] text-white'
                    : 'bg-white/[0.04] text-[#86868b] hover:bg-white/[0.08] hover:text-[#f5f5f7]'
                }`}
              >
                {Icon && <Icon size={13} />}
                {c ? CATEGORY_LABELS[c as Category] : '全部'}
              </button>
            )
          })}
        </div>

        {/* Row 2: Status pills + search + new */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1.5">
            {(['', 'published', 'draft', 'deprecated'] as string[]).map(s => (
              <button
                key={s}
                onClick={() => updateFilter('status', s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 active:scale-[0.97] ${
                  statusFilter === s
                    ? 'bg-[#f5f5f7] text-[#0a0a0c]'
                    : 'bg-white/[0.04] text-[#86868b] hover:bg-white/[0.08] hover:text-[#f5f5f7]'
                }`}
              >
                {s ? STATUS_LABELS[s as keyof typeof STATUS_LABELS] : '全部'}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="flex-1 min-w-[200px] relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e6e73]">
              <IconSearch size={15} />
            </span>
            <input
              type="text"
              placeholder="搜索原则..."
              value={search}
              onChange={e => updateFilter('search', e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-[#121215] border border-white/[0.08] rounded-xl text-[#f5f5f7] placeholder:text-[#6e6e73] focus:outline-none focus:border-white/[0.15] focus:bg-[#1c1c1f] transition-all duration-300"
            />
          </div>

          {/* New principle button */}
          <Link
            to="/principles/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0a84ff] text-white text-sm font-medium rounded-xl hover:bg-[#1a8eff] transition-all duration-300 active:scale-[0.97]"
          >
            <IconPlus size={14} strokeWidth={2.2} />
            新建原则
          </Link>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-[#6e6e73] tracking-tight">
        共 {principles.length} 条原则
      </p>

      {/* ============================================
          Empty state
          ============================================ */}
      {principles.length === 0 ? (
        <div className="text-center py-16 bg-[#161618] border border-white/[0.06] rounded-2xl">
          <div className="flex justify-center mb-4">
            <span className="text-[#6e6e73]">
              <IconBook size={40} strokeWidth={1.5} />
            </span>
          </div>
          <p className="text-[#86868b] mb-3 text-sm">暂无匹配的原则</p>
          <Link
            to="/principles/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/[0.06] text-[#f5f5f7] text-sm rounded-xl border border-white/[0.08] hover:bg-white/[0.1] transition-all duration-300"
          >
            <IconPlus size={14} />
            创建第一条原则
          </Link>
        </div>
      ) : categoryFilter ? (
        /* ============================================
           Flat list when category filter is active
           ============================================ */
        <div className="space-y-3">
          {principles.map(p => (
            <div key={p.id} className="space-y-2">
              <PrincipleCard principle={p} />
              {/* Action buttons */}
              <div className="flex items-center gap-1 px-2">
                <Link
                  to={`/principles/${p.id}/edit`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#0a84ff] hover:bg-white/[0.04] rounded-lg transition-all duration-300"
                >
                  <IconEdit size={12} />
                  编辑
                </Link>
                {p.status === 'draft' && (
                  <button
                    onClick={() => handlePublish(p.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#30d158] hover:bg-white/[0.04] rounded-lg transition-all duration-300"
                  >
                    <IconCheck size={12} />
                    发布
                  </button>
                )}
                {p.status !== 'deprecated' && (
                  <button
                    onClick={() => handleDeprecate(p.id, p.title)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#ff375f] hover:bg-white/[0.04] rounded-lg transition-all duration-300"
                  >
                    <IconTrash size={12} />
                    汰换
                  </button>
                )}
                {p.status === 'draft' && (
                  <span className="ml-auto text-[10px] text-[#6e6e73] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                    草稿
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ============================================
           Grouped by category with headers
           ============================================ */
        <div className="space-y-6">
          {categoryOrder.map(cat => {
            const items = grouped[cat]
            if (items.length === 0) return null
            const CategoryIcon = CATEGORY_ICONS[cat]
            return (
              <div key={cat} className="space-y-3">
                {/* Category header */}
                <div className="flex items-center gap-2 pb-1">
                  <span className={
                    cat === 'work' ? 'text-[#0a84ff]' :
                    cat === 'invest' ? 'text-[#30d158]' :
                    'text-[#ff9f0a]'
                  }>
                    <CategoryIcon size={16} />
                  </span>
                  <h2 className="text-[15px] font-medium tracking-tight text-[#f5f5f7]">
                    {CATEGORY_LABELS[cat]}
                  </h2>
                  <span className="text-xs text-[#6e6e73] bg-white/[0.04] px-1.5 py-0.5 rounded-full font-medium">
                    {items.length}
                  </span>
                </div>

                {/* Principle cards */}
                {items.map(p => (
                  <div key={p.id} className="space-y-2">
                    <PrincipleCard principle={p} />
                    {/* Action buttons */}
                    <div className="flex items-center gap-1 px-2">
                      <Link
                        to={`/principles/${p.id}/edit`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#0a84ff] hover:bg-white/[0.04] rounded-lg transition-all duration-300"
                      >
                        <IconEdit size={12} />
                        编辑
                      </Link>
                      {p.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(p.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#30d158] hover:bg-white/[0.04] rounded-lg transition-all duration-300"
                        >
                          <IconCheck size={12} />
                          发布
                        </button>
                      )}
                      {p.status !== 'deprecated' && (
                        <button
                          onClick={() => handleDeprecate(p.id, p.title)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#ff375f] hover:bg-white/[0.04] rounded-lg transition-all duration-300"
                        >
                          <IconTrash size={12} />
                          汰换
                        </button>
                      )}
                      {p.status === 'draft' && (
                        <span className="ml-auto text-[10px] text-[#6e6e73] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                          草稿
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

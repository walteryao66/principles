import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/principles'
import type { Principle } from '../types'
import { CATEGORY_LABELS, STATUS_LABELS } from '../types'
import { mergeWithPersonalization } from '../utils/personalization'
import { getPrincipleFeedback } from '../utils/decisions'
import CategoryBadge from '../components/CategoryBadge'
import ThemeBadge from '../components/ThemeBadge'
import VersionTimeline from '../components/VersionTimeline'
import {
  IconEdit, IconCheck, IconTrash, IconStar, IconChevronRight,
  IconInfo, IconTag, IconClock, IconTarget, IconClipboard,
  IconLightbulb, IconAlert, IconPen,
} from '../components/Icons'

export default function PrincipleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [principle, setPrinciple] = useState<Principle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.getPrinciple(Number(id))
      .then(p => setPrinciple(mergeWithPersonalization(p)))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  // P4: 原则反馈统计
  const feedback = useMemo(() => {
    if (!id) return null;
    return getPrincipleFeedback(Number(id));
  }, [id]);

  const handleDeprecate = async () => {
    if (!principle || !confirm(`确定汰换原则「${principle.title}」吗？`)) return
    await api.deprecatePrinciple(principle.id)
    setPrinciple({ ...principle, status: 'deprecated' })
  }

  const handlePublish = async () => {
    if (!principle) return
    await api.publishPrinciple(principle.id)
    setPrinciple({ ...principle, status: 'published' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/[0.08] border-t-[#0a84ff]" />
      </div>
    )
  }

  if (error || !principle) {
    return (
      <div className="text-center py-12">
        <p className="text-[#ff375f] mb-2">{error || '原则未找到'}</p>
        <Link to="/principles" className="text-[#0a84ff] hover:underline text-sm">返回列表</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ============================================
          Breadcrumb
          ============================================ */}
      <div className="flex items-center gap-1.5 text-[13px] text-[#6e6e73] tracking-tight">
        <Link to="/principles" className="hover:text-[#f5f5f7] transition-all duration-300">
          原则列表
        </Link>
        <span className="text-white/[0.2]">
          <IconChevronRight size={12} />
        </span>
        <span className="text-[#86868b]">{principle.title}</span>
      </div>

      {/* ============================================
          Main content card
          ============================================ */}
      <div className="bg-[#161618] rounded-2xl p-6 border border-white/[0.06]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* Badges row */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <CategoryBadge category={principle.category} />
              {principle.theme && (
                <ThemeBadge theme={principle.theme} category={principle.category} />
              )}
              <span className="text-[11px] bg-[#121215] text-[#6e6e73] px-2 py-0.5 rounded-full font-medium border border-white/[0.06]">
                V{principle.version}
              </span>
              {principle.status === 'draft' && (
                <span className="text-[11px] bg-[#ff9f0a]/10 text-[#ff9f0a] px-2 py-0.5 rounded-full font-medium">
                  草稿
                </span>
              )}
              {principle.status === 'deprecated' && (
                <span className="text-[11px] bg-white/[0.04] text-[#6e6e73] px-2 py-0.5 rounded-full font-medium border border-white/[0.06]">
                  已汰换
                </span>
              )}
              {principle.is_personalized && (
                <span className="text-[11px] bg-[#30d158]/10 text-[#30d158] px-2 py-0.5 rounded-full font-medium">
                  已定制
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl font-medium tracking-tighter text-[#f5f5f7] mb-1">
              {principle.title}
            </h1>
          </div>
        </div>

        {/* English text — quote style */}
        {principle.english_text && (
          <blockquote className="border-l-2 border-[#0a84ff]/30 pl-4 py-3 my-4 bg-[#121215] rounded-r-lg">
            <p className="text-[14px] text-[#86868b] italic leading-relaxed tracking-tight">
              {principle.english_text}
            </p>
          </blockquote>
        )}

        {/* Chinese content */}
        <div className="text-[14px] text-[#f5f5f7] whitespace-pre-wrap leading-relaxed tracking-tight">
          {principle.content}
        </div>

        {/* Tags */}
        {principle.tags && (
          <div className="flex flex-wrap gap-1.5 mt-5">
            <span className="text-[#6e6e73] mr-1 mt-0.5">
              <IconTag size={13} />
            </span>
            {principle.tags.split(',').map((tag, i) => (
              <span
                key={i}
                className="text-[11px] bg-white/[0.04] text-[#86868b] px-2.5 py-0.5 rounded-full border border-white/[0.06] transition-all duration-300 hover:bg-white/[0.08] hover:text-[#f5f5f7]"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* ============================================
            Personalization area — amber tone card
            ============================================ */}
        {(principle.personal_note || principle.relevance > 0) && (
          <div className="mt-5 p-4 bg-[#ff9f0a]/5 rounded-xl border border-[#ff9f0a]/15 transition-all duration-300 hover:border-[#ff9f0a]/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#ff9f0a]">
                <IconStar size={14} filled />
              </span>
              <span className="text-xs text-[#ff9f0a] font-medium uppercase tracking-wider">
                个人定制
              </span>
            </div>
            {principle.relevance > 0 && (
              <p className="text-[13px] text-[#ff9f0a] mb-1.5 font-medium tracking-tight flex items-center gap-1">
                相关度：
                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <IconStar
                      key={i}
                      size={13}
                      filled={i < principle.relevance}
                      className={i < principle.relevance ? 'text-[#ff9f0a]' : 'text-[#ff9f0a]/20'}
                    />
                  ))}
                </span>
              </p>
            )}
            {principle.personal_note && (
              <div className="flex items-start gap-2">
                <span className="text-[#ff9f0a]/60 mt-0.5 shrink-0">
                  <IconEdit size={13} />
                </span>
                <p className="text-[13px] text-[#f5f5f7] leading-relaxed tracking-tight">
                  {principle.personal_note}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================
            P4: 决策反馈统计 & 关联决策
            ============================================ */}
        {feedback && feedback.total_decisions > 0 && (
          <div className="mt-5 p-4 bg-[#121215] rounded-xl border border-white/[0.06] space-y-4">
            {/* 统计摘要 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconTarget size={14} className="text-[#86868b]" />
                <span className="text-[12px] text-[#86868b] font-medium">
                  决策反馈 ({feedback.total_decisions} 次关联)
                </span>
              </div>
              {feedback.total_decisions > 0 && (
                <Link
                  to="/decisions"
                  className="text-[11px] text-[#6e6e73] hover:text-[#f5f5f7] transition-colors"
                >
                  查看全部 →
                </Link>
              )}
            </div>

            {/* 有效性统计条 */}
            <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.04]">
              {feedback.effective_count > 0 && (
                <div
                  className="bg-[#30d158] transition-all"
                  style={{ width: `${(feedback.effective_count / feedback.total_decisions) * 100}%` }}
                />
              )}
              {feedback.partial_count > 0 && (
                <div
                  className="bg-[#ff9f0a] transition-all"
                  style={{ width: `${(feedback.partial_count / feedback.total_decisions) * 100}%` }}
                />
              )}
              {feedback.ineffective_count > 0 && (
                <div
                  className="bg-[#ff375f] transition-all"
                  style={{ width: `${(feedback.ineffective_count / feedback.total_decisions) * 100}%` }}
                />
              )}
            </div>

            {/* 统计数字 */}
            <div className="flex gap-4 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#30d158]" />
                <span className="text-[#86868b]">有效</span>
                <span className="text-[#f5f5f7] font-medium">{feedback.effective_count}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ff9f0a]" />
                <span className="text-[#86868b]">部分有效</span>
                <span className="text-[#f5f5f7] font-medium">{feedback.partial_count}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ff375f]" />
                <span className="text-[#86868b]">无效</span>
                <span className="text-[#f5f5f7] font-medium">{feedback.ineffective_count}</span>
              </span>
            </div>

            {/* 关联决策列表（最近5条） */}
            <div className="space-y-1.5">
              {feedback.decisions.slice(0, 5).map(dwr => {
                const isReviewed = !!dwr.review;
                return (
                  <Link
                    key={dwr.decision.id}
                    to={`/decisions/${dwr.decision.id}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
                  >
                    {/* 状态圆点 */}
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: !isReviewed ? '#6e6e73'
                          : dwr.review!.effectiveness === 'effective' ? '#30d158'
                          : dwr.review!.effectiveness === 'partial' ? '#ff9f0a'
                          : '#ff375f',
                      }}
                    />
                    <span className="text-[12px] text-[#98989d] truncate flex-1">
                      {dwr.decision.decision_made || dwr.decision.context}
                    </span>
                    <span className="text-[10px] text-[#6e6e73]">
                      {isReviewed ? '已复盘' : '待复盘'}
                    </span>
                    <IconChevronRight size={10} className="text-[#48484d] group-hover:text-[#86868b] transition-colors" />
                  </Link>
                );
              })}
            </div>

            {/* 反馈驱动的修订提示 */}
            {feedback.ineffective_count > feedback.effective_count && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 bg-[#ff375f]/5 border border-[#ff375f]/10 rounded-lg">
                <IconAlert size={13} className="text-[#ff375f] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[12px] text-[#ff9f0a] font-medium">
                    这条原则在实践中效果不佳
                  </p>
                  <p className="text-[11px] text-[#86868b] mt-0.5">
                    无效决策 ({feedback.ineffective_count}) 超过有效 ({feedback.effective_count})，建议修订或汰换
                  </p>
                  <Link
                    to={`/principles/${principle.id}/edit`}
                    className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-[#ff9f0a] hover:text-[#ffb023] transition-colors"
                  >
                    <IconEdit size={11} />
                    修订原则
                  </Link>
                </div>
              </div>
            )}

            {feedback.total_decisions > 0 && feedback.effective_count >= feedback.ineffective_count && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[#30d158]/5 border border-[#30d158]/10 rounded-lg">
                <IconCheck size={13} className="text-[#30d158] shrink-0" />
                <p className="text-[12px] text-[#30d158]">
                  这条原则在实践中表现良好
                </p>
              </div>
            )}
          </div>
        )}

        {/* 无决策关联时的引导 */}
        {(!feedback || feedback.total_decisions === 0) && (
          <div className="mt-5 p-4 bg-[#121215] rounded-xl border border-white/[0.06]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
                <IconClipboard size={14} className="text-[#48484d]" />
              </div>
              <div>
                <p className="text-[12px] text-[#86868b] font-medium">尚无决策关联</p>
                <p className="text-[11px] text-[#6e6e73] mt-1">
                  记录决策时关联这条原则，事后复盘来验证它的有效性
                </p>
                <Link
                  to="/decisions/new"
                  className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-[#0a84ff] hover:text-[#1a8eff] transition-colors"
                >
                  <IconPen size={11} />
                  记录决策
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            Meta info row
            ============================================ */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#6e6e73] tracking-tight">
          <span className="inline-flex items-center gap-1">
            <IconInfo size={11} />
            来源：{principle.source || '-'}
          </span>
          <span className="text-white/[0.1]">|</span>
          <span>状态：{STATUS_LABELS[principle.status]}</span>
          <span className="text-white/[0.1]">|</span>
          <span className="inline-flex items-center gap-1">
            <IconClock size={11} />
            {new Date(principle.created_at).toLocaleString('zh-CN')}
          </span>
          <span className="text-white/[0.1]">|</span>
          <span>更新：{new Date(principle.updated_at).toLocaleString('zh-CN')}</span>
        </div>

        {/* ============================================
            Action buttons — all with SVG icons
            ============================================ */}
        <div className="mt-5 flex gap-2.5">
          <Link
            to={`/principles/${principle.id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0a84ff] text-white text-sm font-medium rounded-xl hover:bg-[#1a8eff] transition-all duration-300 active:scale-[0.97]"
          >
            <IconEdit size={14} strokeWidth={2} />
            修订原则
          </Link>
          {principle.status === 'draft' && (
            <button
              onClick={handlePublish}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#30d158] text-white text-sm font-medium rounded-xl hover:bg-[#34d95d] transition-all duration-300 active:scale-[0.97]"
            >
              <IconCheck size={14} strokeWidth={2.2} />
              沉淀（发布）
            </button>
          )}
          {principle.status !== 'deprecated' && (
            <button
              onClick={handleDeprecate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[#ff375f] text-sm font-medium rounded-xl border border-[#ff375f]/20 hover:bg-[#ff375f]/8 transition-all duration-300 active:scale-[0.97]"
            >
              <IconTrash size={14} />
              汰换
            </button>
          )}
        </div>
      </div>

      {/* ============================================
          Version history
          ============================================ */}
      <div className="bg-[#161618] rounded-2xl p-6 border border-white/[0.06]">
        <h2 className="text-base font-medium tracking-tight text-[#f5f5f7] mb-4">
          修订历史
        </h2>
        <VersionTimeline versions={principle.versions} />
      </div>
    </div>
  )
}

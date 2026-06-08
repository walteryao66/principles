/**
 * 决策详情 & 复盘页 — P3
 *
 * 展示决策完整信息 + 复盘表单（未复盘时）/ 复盘结果（已复盘时）。
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDecision, getReview, deleteDecision, saveReview, getPrincipleFeedback } from '../utils/decisions';
import { EMBEDDED_PRINCIPLES } from '../data/embedded';
import {
  CATEGORY_LABELS, EFFECTIVENESS_LABELS, EFFECTIVENESS_COLORS,
  ADHERENCE_LABELS, ADHERENCE_COLORS,
} from '../types';
import type { Decision, Review, Effectiveness, Adherence, PrincipleFeedback } from '../types';
import {
  IconPen, IconChevronRight, IconX, IconCheck, IconTrash,
  IconStar, IconTarget, IconClock, IconLightbulb, IconAlert,
} from '../components/Icons';

// 内联图标
const IconActivityCp: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
);
const IconZapCp: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
);
const IconShieldCp: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);

const CAT_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  work: IconActivityCp,
  invest: IconZapCp,
  life: IconShieldCp,
};

const CAT_COLORS: Record<string, string> = {
  work: '#0a84ff',
  invest: '#30d158',
  life: '#ff9f0a',
};

export default function DecisionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [decision, setDecision] = useState<Decision | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 复盘表单状态
  const [actualOutcome, setActualOutcome] = useState('');
  const [effectiveness, setEffectiveness] = useState<Effectiveness | ''>('');
  const [adherence, setAdherence] = useState<Adherence | ''>('');
  const [violatedReason, setViolatedReason] = useState('');
  const [reflection, setReflection] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // 加载决策
  useEffect(() => {
    if (!id) return;
    const d = getDecision(id);
    if (!d) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setDecision(d);

    // 尝试加载复盘
    const r = getReview(id);
    setReview(r);
    if (r) {
      setActualOutcome(r.actual_outcome);
      setEffectiveness(r.effectiveness);
      setAdherence(r.adherence || '');
      setViolatedReason(r.violated_reason || '');
      setReflection(r.reflection);
    }
    setLoading(false);
  }, [id]);

  // 关联原则详情
  const linkedPrinciples = useMemo(() => {
    if (!decision) return [];
    return decision.linked_principle_ids
      .map(pid => EMBEDDED_PRINCIPLES.find(p => p.id === pid))
      .filter(Boolean);
  }, [decision]);

  // 原则反馈统计
  const principleFeedbacks = useMemo(() => {
    if (!decision) return new Map<number, PrincipleFeedback>();
    const map = new Map<number, PrincipleFeedback>();
    for (const pid of decision.linked_principle_ids) {
      map.set(pid, getPrincipleFeedback(pid));
    }
    return map;
  }, [decision]);

  // 保存复盘
  const handleSaveReview = useCallback(() => {
    if (!id || !effectiveness) return;
    setSaving(true);

    const newReview: Review = {
      decision_id: id,
      actual_outcome: actualOutcome.trim(),
      effectiveness,
      adherence: adherence,
      violated_reason: adherence === 'violated' ? violatedReason.trim() : '',
      reflection: reflection.trim(),
      reviewed_at: new Date().toISOString(),
    };

    saveReview(newReview);
    setReview(newReview);
    setShowReviewForm(false);
    setSaving(false);
  }, [id, actualOutcome, effectiveness, adherence, violatedReason, reflection]);

  // 编辑复盘
  const handleEditReview = useCallback(() => {
    if (review) {
      setActualOutcome(review.actual_outcome);
      setEffectiveness(review.effectiveness);
      setReflection(review.reflection);
    }
    setShowReviewForm(true);
  }, [review]);

  // 删除决策
  const handleDelete = useCallback(() => {
    if (!id) return;
    deleteDecision(id);
    navigate('/decisions', { replace: true });
  }, [id, navigate]);

  // 加载中
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-[14px] text-[#86868b]">加载中...</p>
      </div>
    );
  }

  // 未找到
  if (notFound || !decision) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
          <IconX size={20} className="text-[#48484d]" />
        </div>
        <p className="text-[14px] text-[#f5f5f7] font-medium">决策不存在</p>
        <p className="text-[12px] text-[#6e6e73] mt-1">该决策可能已被删除</p>
        <Link
          to="/decisions"
          className="mt-4 px-4 py-2 bg-white/[0.06] text-[13px] text-[#86868b] rounded-lg hover:bg-white/[0.1] transition-colors"
        >
          返回决策列表
        </Link>
      </div>
    );
  }

  const isReviewed = !!review;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-[13px] text-[#86868b] hover:text-[#f5f5f7] transition-colors"
        >
          <IconChevronRight size={13} className="rotate-180" />
          返回
        </button>
        <button
          onClick={() => setDeleteConfirm(true)}
          className="p-2 rounded-lg text-[#48484d] hover:text-[#ff375f] hover:bg-[#ff375f]/5 transition-all"
        >
          <IconTrash size={14} />
        </button>
      </div>

      {/* ============================================
          决策详情卡片
          ============================================ */}
      <section className="bg-[#161618] border border-white/[0.06] rounded-2xl p-5">
        {/* 状态标签 */}
        <div className="flex items-center gap-2 mb-4">
          {isReviewed ? (
            <span
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{
                color: EFFECTIVENESS_COLORS[review.effectiveness as Effectiveness] || '#86868b',
                backgroundColor: `${EFFECTIVENESS_COLORS[review.effectiveness as Effectiveness] || '#fff'}10`,
              }}
            >
              <IconCheck size={11} />
              {EFFECTIVENESS_LABELS[review.effectiveness as Effectiveness] || '已复盘'}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full text-[#ff9f0a] bg-[#ff9f0a]/10">
              <IconClock size={11} />
              待复盘
            </span>
          )}
          <span className="text-[11px] text-[#6e6e73]">
            {formatDateTime(decision.created_at)}
          </span>
        </div>

        {/* 决策背景 */}
        <div className="mb-4">
          <h3 className="text-[11px] text-[#6e6e73] font-medium uppercase tracking-wider mb-2">
            决策背景
          </h3>
          <p className="text-[14px] text-[#98989d] leading-relaxed">
            {decision.context}
          </p>
        </div>

        {/* 做出的决定 */}
        <div className="mb-4">
          <h3 className="text-[11px] text-[#6e6e73] font-medium uppercase tracking-wider mb-2">
            做出的决定
          </h3>
          <p className="text-[15px] text-[#f5f5f7] leading-relaxed font-medium">
            {decision.decision_made}
          </p>
        </div>

        {/* 预期结果 */}
        {decision.expected_outcome && (
          <div>
            <h3 className="text-[11px] text-[#6e6e73] font-medium uppercase tracking-wider mb-2">
              预期结果
            </h3>
            <p className="text-[13px] text-[#98989d] leading-relaxed">
              {decision.expected_outcome}
            </p>
          </div>
        )}
      </section>

      {/* ============================================
          关联原则
          ============================================ */}
      {linkedPrinciples.length > 0 && (
        <section className="bg-[#161618] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-[11px] text-[#6e6e73] font-medium uppercase tracking-wider mb-3">
            关联原则 ({linkedPrinciples.length})
          </h3>
          <div className="space-y-2">
            {linkedPrinciples.map(p => {
              if (!p) return null;
              const CatIcon = CAT_ICONS[p.category];
              const feedback = principleFeedbacks.get(p.id);
              return (
                <Link
                  key={p.id}
                  to={`/principles/${p.id}`}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors group"
                >
                  {CatIcon && (
                    <span className="mt-0.5 shrink-0" style={{ color: CAT_COLORS[p.category], display: 'inline-flex' }}>
                      <CatIcon size={13} />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] text-[#f5f5f7] font-medium">{p.title}</p>
                      <span className="text-[10px] text-[#6e6e73]">{CATEGORY_LABELS[p.category]}</span>
                    </div>
                    {p.theme && (
                      <p className="text-[11px] text-[#6e6e73] mt-0.5">{p.theme}</p>
                    )}
                    {/* 原则反馈统计 */}
                    {feedback && feedback.total_decisions > 0 && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-[#86868b]">
                          {feedback.total_decisions} 次关联
                        </span>
                        {feedback.effective_count > 0 && (
                          <span className="text-[10px] text-[#30d158]">✅ {feedback.effective_count} 有效</span>
                        )}
                        {feedback.partial_count > 0 && (
                          <span className="text-[10px] text-[#ff9f0a]">⚠️ {feedback.partial_count} 部分</span>
                        )}
                        {feedback.ineffective_count > 0 && (
                          <span className="text-[10px] text-[#ff375f]">❌ {feedback.ineffective_count} 无效</span>
                        )}
                      </div>
                    )}
                  </div>
                  <IconChevronRight size={12} className="text-[#48484d] group-hover:text-[#86868b] transition-colors mt-1" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================
          复盘区域
          ============================================ */}
      <section className="bg-[#161618] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IconTarget size={15} className={isReviewed ? 'text-[#30d158]' : 'text-[#ff9f0a]'} />
            <h2 className="text-[13px] font-medium text-[#f5f5f7]">决策复盘</h2>
          </div>
          {isReviewed && !showReviewForm && (
            <button
              onClick={handleEditReview}
              className="flex items-center gap-1 text-[12px] text-[#86868b] hover:text-[#f5f5f7] transition-colors"
            >
              <IconPen size={12} />
              修改
            </button>
          )}
        </div>

        {/* 未复盘 — 显示空白引导 + 开始复盘按钮 */}
        {!isReviewed && !showReviewForm && (
          <div className="text-center py-6">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[#ff9f0a]/10 flex items-center justify-center">
              <IconTarget size={18} className="text-[#ff9f0a]" />
            </div>
            <p className="text-[14px] text-[#f5f5f7] font-medium">尚未复盘</p>
            <p className="text-[12px] text-[#6e6e73] mt-1.5 max-w-xs mx-auto">
              记录决策的实际结果，评估关联原则是否有效
            </p>
            <button
              onClick={() => setShowReviewForm(true)}
              className="mt-4 px-5 py-2.5 bg-[#ff9f0a] text-[#0a0a0c] text-[13px] font-medium rounded-xl hover:bg-[#ffb023] active:scale-[0.98] transition-all"
            >
              开始复盘
            </button>
          </div>
        )}

        {/* 复盘表单 */}
        {showReviewForm && (
          <div className="space-y-4">
            {/* 实际结果 */}
            <div>
              <label className="text-[12px] text-[#86868b] font-medium mb-2 block">
                实际结果 <span className="text-[#6e6e73]">必填</span>
              </label>
              <textarea
                value={actualOutcome}
                onChange={(e) => setActualOutcome(e.target.value)}
                placeholder="决策执行后的实际结果是什么？和预期一致吗？"
                rows={3}
                className="w-full px-4 py-3 bg-[#121215] border border-white/[0.08] rounded-xl text-[14px] text-[#f5f5f7] placeholder:text-[#6e6e73] focus:border-[#ff9f0a] focus:ring-1 focus:ring-[#ff9f0a]/20 outline-none transition-all resize-y leading-relaxed"
              />
            </div>

            {/* 有效性评价 */}
            <div>
              <label className="text-[12px] text-[#86868b] font-medium mb-2.5 block">
                原则有效性 <span className="text-[#6e6e73]">必选</span>
              </label>
              <div className="flex gap-2">
                {(['effective', 'partial', 'ineffective'] as Effectiveness[]).map(eff => (
                  <button
                    key={eff}
                    onClick={() => setEffectiveness(eff)}
                    className={`flex-1 py-3 rounded-xl text-[13px] font-medium border transition-all ${
                      effectiveness === eff
                        ? 'border-current text-white'
                        : 'border-transparent text-[#6e6e73] bg-[#121215] hover:bg-white/[0.04]'
                    }`}
                    style={{
                      backgroundColor: effectiveness === eff
                        ? `${EFFECTIVENESS_COLORS[eff]}15`
                        : undefined,
                      color: effectiveness === eff
                        ? EFFECTIVENESS_COLORS[eff]
                        : undefined,
                      borderColor: effectiveness === eff
                        ? `${EFFECTIVENESS_COLORS[eff]}40`
                        : undefined,
                    }}
                  >
                    {EFFECTIVENESS_LABELS[eff].split(' ')[0]}
                    <div className="text-[10px] opacity-70 mt-0.5">
                      {EFFECTIVENESS_LABELS[eff].split(' ').slice(1).join(' ')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 是否遵循原则 */}
            <div>
              <label className="text-[12px] text-[#86868b] font-medium mb-2.5 block">
                是否遵循原则 <span className="text-[#6e6e73]">必选</span>
              </label>
              <div className="flex gap-2">
                {(['followed', 'violated', 'not_applicable'] as Adherence[]).map(adh => (
                  <button
                    key={adh}
                    onClick={() => setAdherence(adh)}
                    className={`flex-1 py-3 rounded-xl text-[13px] font-medium border transition-all ${
                      adherence === adh
                        ? 'border-current'
                        : 'border-transparent text-[#6e6e73] bg-[#121215] hover:bg-white/[0.04]'
                    }`}
                    style={{
                      backgroundColor: adherence === adh
                        ? `${ADHERENCE_COLORS[adh]}15`
                        : undefined,
                      color: adherence === adh
                        ? ADHERENCE_COLORS[adh]
                        : undefined,
                      borderColor: adherence === adh
                        ? `${ADHERENCE_COLORS[adh]}40`
                        : undefined,
                    }}
                  >
                    {ADHERENCE_LABELS[adh].split(' ')[0]}
                    <div className="text-[10px] opacity-70 mt-0.5">
                      {ADHERENCE_LABELS[adh].split(' ').slice(1).join(' ')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 违背原则时的主动追问 */}
            {adherence === 'violated' && (
              <div className="p-4 bg-[#ff375f]/5 border border-[#ff375f]/10 rounded-xl space-y-3">
                <div className="flex items-start gap-2">
                  <IconAlert size={13} className="text-[#ff375f] mt-0.5 shrink-0" />
                  <p className="text-[12px] text-[#ff375f] font-medium">
                    你违背了这条原则，花一分钟反思一下
                  </p>
                </div>

                <div>
                  <label className="text-[11px] text-[#86868b] mb-1.5 block">
                    为什么违背？请诚实回答
                  </label>
                  <textarea
                    value={violatedReason}
                    onChange={(e) => setViolatedReason(e.target.value)}
                    placeholder="例如：时间紧迫来不及权衡 / 情绪上头做了冲动决定 / 当时觉得这条原则不适用于这个场景 / 明知应该按原则做但没做到……"
                    rows={3}
                    className="w-full px-4 py-3 bg-[#121215] border border-[#ff375f]/15 rounded-xl text-[14px] text-[#f5f5f7] placeholder:text-[#6e6e73] focus:border-[#ff375f]/30 focus:ring-1 focus:ring-[#ff375f]/10 outline-none transition-all resize-y leading-relaxed"
                  />
                </div>

                <div className="text-[11px] text-[#98989d] space-y-1">
                  <p className="font-medium text-[#86868b]">追问自己：</p>
                  <p>• 如果再来一次，你会在哪个环节做出不同的选择？</p>
                  <p>• 这条原则在当前场景下真的适用吗？还是原则本身需要修订？</p>
                  <p>• 你需要的是一次提醒，还是一个更强的执行机制？</p>
                </div>
              </div>
            )}

            {/* 原则不适用时的追问 */}
            {adherence === 'not_applicable' && (
              <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <div className="flex items-start gap-2">
                  <IconLightbulb size={13} className="text-[#86868b] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[12px] text-[#86868b] font-medium">
                      这条原则在这个决策场景下不适用
                    </p>
                    <p className="text-[11px] text-[#6e6e73] mt-1">
                      考虑一下：是否有另一条未被关联的原则更适合这个决策？如果是，在反思笔记中记录下来，下次决策时可以关联它。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 反思笔记 */}
            <div>
              <label className="text-[12px] text-[#86868b] font-medium mb-2 block">
                反思笔记 <span className="text-[#6e6e73]">可选</span>
              </label>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="这次决策后你学到了什么？原则需要调整吗？"
                rows={2}
                className="w-full px-4 py-3 bg-[#121215] border border-white/[0.08] rounded-xl text-[14px] text-[#f5f5f7] placeholder:text-[#6e6e73] focus:border-[#ff9f0a] focus:ring-1 focus:ring-[#ff9f0a]/20 outline-none transition-all resize-y leading-relaxed"
              />
            </div>

            {/* 按钮 */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  if (review) {
                    // 取消编辑，恢复原值
                    setShowReviewForm(false);
                    setActualOutcome(review.actual_outcome);
                    setEffectiveness(review.effectiveness);
                    setAdherence(review.adherence || '');
                    setViolatedReason(review.violated_reason || '');
                    setReflection(review.reflection);
                  } else {
                    setShowReviewForm(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-[#86868b] bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveReview}
                disabled={!effectiveness || !adherence || !actualOutcome.trim() || saving}
                className={`flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  effectiveness && adherence && actualOutcome.trim() && !saving
                    ? 'bg-[#ff9f0a] text-[#0a0a0c] hover:bg-[#ffb023] active:scale-[0.98]'
                    : 'bg-white/[0.06] text-[#48484d] cursor-not-allowed'
                }`}
              >
                {saving ? '保存中...' : (review ? '更新复盘' : '保存复盘')}
              </button>
            </div>
          </div>
        )}

        {/* 已复盘 — 展示复盘结果 */}
        {isReviewed && !showReviewForm && (
          <div className="space-y-4">
            {/* 有效性标签 */}
            <div className="flex items-center gap-2">
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
                style={{
                  color: EFFECTIVENESS_COLORS[review.effectiveness as Effectiveness],
                  backgroundColor: `${EFFECTIVENESS_COLORS[review.effectiveness as Effectiveness]}10`,
                }}
              >
                <IconTarget size={12} />
                {EFFECTIVENESS_LABELS[review.effectiveness as Effectiveness]}
              </span>
              {review.adherence && (
                <span
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
                  style={{
                    color: ADHERENCE_COLORS[review.adherence as Adherence],
                    backgroundColor: `${ADHERENCE_COLORS[review.adherence as Adherence]}10`,
                  }}
                >
                  {ADHERENCE_LABELS[review.adherence as Adherence]}
                </span>
              )}
              <span className="text-[11px] text-[#6e6e73]">
                {formatDateTime(review.reviewed_at)} 复盘
              </span>
            </div>

            {/* 违背原因 */}
            {review.adherence === 'violated' && review.violated_reason && (
              <div className="p-3 bg-[#ff375f]/5 border border-[#ff375f]/10 rounded-lg">
                <p className="text-[11px] text-[#86868b] font-medium mb-1">违背原因</p>
                <p className="text-[13px] text-[#98989d] leading-relaxed">{review.violated_reason}</p>
              </div>
            )}

            {/* 实际结果 */}
            <div>
              <h3 className="text-[11px] text-[#6e6e73] font-medium uppercase tracking-wider mb-1.5">
                实际结果
              </h3>
              <p className="text-[14px] text-[#f5f5f7] leading-relaxed">
                {review.actual_outcome}
              </p>
            </div>

            {/* 对比预期 */}
            {decision.expected_outcome && (
              <div className="mt-3 p-3 bg-[#121215] rounded-xl border border-white/[0.05]">
                <h3 className="text-[11px] text-[#6e6e73] font-medium uppercase tracking-wider mb-1.5">
                  预期 vs 实际
                </h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="text-[11px] text-[#6e6e73] shrink-0 w-10">预期：</span>
                    <p className="text-[12px] text-[#86868b]">{decision.expected_outcome}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[11px] text-[#6e6e73] shrink-0 w-10">实际：</span>
                    <p className="text-[12px] text-[#f5f5f7]">{review.actual_outcome}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 反思笔记 */}
            {review.reflection && (
              <div>
                <h3 className="text-[11px] text-[#6e6e73] font-medium uppercase tracking-wider mb-1.5">
                  <span className="inline-flex items-center gap-1">
                    <IconLightbulb size={11} />
                    反思笔记
                  </span>
                </h3>
                <p className="text-[13px] text-[#98989d] leading-relaxed">
                  {review.reflection}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ============================================
          操作区
          ============================================ */}
      <div className="flex gap-2 pt-1">
        {!isReviewed && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-[#ff9f0a] text-[#0a0a0c] text-[14px] font-medium rounded-xl hover:bg-[#ffb023] active:scale-[0.98] transition-all"
          >
            <IconTarget size={15} />
            开始复盘
          </button>
        )}
        <Link
          to="/"
          className="flex-1 flex items-center justify-center py-3 bg-white/[0.04] text-[14px] text-[#86868b] font-medium rounded-xl hover:bg-white/[0.08] transition-colors"
        >
          返回首页
        </Link>
      </div>

      {/* 删除确认弹窗 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(false)} />
          <div className="relative bg-[#1c1c1f] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#ff375f]/10 flex items-center justify-center">
                <IconTrash size={16} className="text-[#ff375f]" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#f5f5f7]">确认删除这条决策？</p>
                <p className="text-[12px] text-[#86868b]">
                  {isReviewed ? '已关联的复盘记录也将被删除' : '此操作不可撤销'}
                </p>
              </div>
            </div>
            <p className="text-[13px] text-[#98989d] line-clamp-2 mb-5 px-1">
              {decision.decision_made || decision.context}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-[#86868b] bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-white bg-[#ff375f] hover:bg-[#ff2d55] transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部留白 */}
      <div className="h-8" />
    </div>
  );
}

// ============================================================
// 辅助函数
// ============================================================

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `今天 ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `昨天 ${time}`;

  return `${d.toLocaleDateString('zh-CN')} ${time}`;
}

/**
 * 新建决策页 — P2
 *
 * 流程：输入背景 → 系统推荐原则 → 关联原则 → 填写决定和预期 → 保存
 * 支持 ?context=xxx URL 参数从今日视图快速跳转。
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EMBEDDED_PRINCIPLES } from '../data/embedded';
import { recommendPrinciples } from '../utils/recommendations';
import { saveDecision, generateDecisionId } from '../utils/decisions';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import type { PrincipleRecommendation, Decision } from '../types';
import {
  IconPen, IconChevronRight, IconX, IconCheck,
  IconLightbulb, IconTag,
} from '../components/Icons';

// 内联图标定义（避免额外 import）
const IconActivityCp: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
);
const IconZapCp: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
);
const IconShieldCp: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);

const CAT_ICONS_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  work: IconActivityCp,
  invest: IconZapCp,
  life: IconShieldCp,
};

const CAT_COLORS_MAP: Record<string, string> = {
  work: '#0a84ff',
  invest: '#30d158',
  life: '#ff9f0a',
};

export default function DecisionNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillContext = searchParams.get('context') || '';

  // 表单状态
  const [context, setContext] = useState(prefillContext);
  const [decisionMade, setDecisionMade] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [recommendations, setRecommendations] = useState<PrincipleRecommendation[]>([]);
  const [saving, setSaving] = useState(false);
  const [showAllPrinciples, setShowAllPrinciples] = useState(false);

  // 实时推荐
  useEffect(() => {
    if (context.trim().length >= 2) {
      const recs = recommendPrinciples(context, 8);
      setRecommendations(recs);
    } else {
      setRecommendations([]);
    }
  }, [context]);

  // 已选原则详情
  const selectedPrinciples = useMemo(() => {
    return EMBEDDED_PRINCIPLES.filter(p => selectedIds.has(p.id));
  }, [selectedIds]);

  // 未在推荐列表中的已选原则（用于显示在额外区域）
  const extraSelected = useMemo(() => {
    const recIds = new Set(recommendations.map(r => r.principle_id));
    return selectedPrinciples.filter(p => !recIds.has(p.id));
  }, [selectedPrinciples, recommendations]);

  // 切换选中
  const togglePrinciple = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // 手动添加原则（从全部原则中选）
  const availablePrinciples = useMemo(() => {
    if (!showAllPrinciples) return [];
    return EMBEDDED_PRINCIPLES.filter(p => p.status !== 'deprecated');
  }, [showAllPrinciples]);

  // 保存
  const handleSave = useCallback(async () => {
    if (!context.trim()) return;
    if (!decisionMade.trim()) return;

    setSaving(true);
    const decision: Decision = {
      id: generateDecisionId(),
      context: context.trim(),
      linked_principle_ids: Array.from(selectedIds),
      decision_made: decisionMade.trim(),
      expected_outcome: expectedOutcome.trim(),
      created_at: new Date().toISOString(),
    };

    saveDecision(decision);
    setSaving(false);
    navigate(`/decisions/${decision.id}`, { replace: true });
  }, [context, decisionMade, expectedOutcome, selectedIds, navigate]);

  // 是否可以保存
  const canSave = context.trim().length > 0 && decisionMade.trim().length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-[#f5f5f7]">记录一次决策</h1>
          <p className="text-[13px] text-[#86868b] mt-1">
            描述决策背景，关联相关原则，记录你的决定
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-white/[0.06] text-[#86868b] hover:text-[#f5f5f7] transition-colors"
        >
          <IconX size={18} />
        </button>
      </div>

      {/* ============================================
          步骤 1: 决策背景
          ============================================ */}
      <section className="bg-[#161618] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0a84ff]/15 text-[#0a84ff] text-[11px] font-bold">1</span>
          <span className="text-[13px] font-medium text-[#f5f5f7]">决策背景</span>
          <span className="text-[11px] text-[#6e6e73]">必填</span>
        </div>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="描述你面临的选择或决策背景。例如：团队新项目需要选择技术栈，有两个方案在考量..."
          rows={4}
          autoFocus
          className="w-full px-4 py-3 bg-[#121215] border border-white/[0.08] rounded-xl text-[14px] text-[#f5f5f7] placeholder:text-[#6e6e73] focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff]/20 outline-none transition-all resize-y leading-relaxed"
        />
        <p className="text-[11px] text-[#6e6e73] mt-2">
          输入更多关键词可以获得更精准的原则推荐
        </p>
      </section>

      {/* ============================================
          步骤 2: 关联原则（推荐 + 手动）
          ============================================ */}
      <section className="bg-[#161618] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ff9f0a]/15 text-[#ff9f0a] text-[11px] font-bold">2</span>
          <span className="text-[13px] font-medium text-[#f5f5f7]">关联原则</span>
          <span className="text-[11px] text-[#6e6e73]">可选</span>
        </div>

        {/* 已选原则标签 */}
        {selectedPrinciples.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedPrinciples.map(p => {
              const CatIcon = CAT_ICONS_MAP[p.category];
              return (
                <button
                  key={p.id}
                  onClick={() => togglePrinciple(p.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border transition-all active:scale-95"
                  style={{
                    backgroundColor: `${CAT_COLORS_MAP[p.category]}10`,
                    borderColor: `${CAT_COLORS_MAP[p.category]}30`,
                    color: CAT_COLORS_MAP[p.category],
                  }}
                >
                  {CatIcon && <CatIcon size={11} />}
                  <span className="max-w-[160px] truncate">{p.title}</span>
                  <IconX size={11} />
                </button>
              );
            })}
            {selectedPrinciples.length > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-[11px] text-[#48484d] hover:text-[#86868b] px-1.5 transition-colors"
              >
                清除全部
              </button>
            )}
          </div>
        )}

        {/* 推荐列表 */}
        {recommendations.length > 0 && (
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <IconLightbulb size={12} className="text-[#ff9f0a]" />
              <span className="text-[11px] text-[#6e6e73] font-medium uppercase tracking-wider">系统推荐</span>
            </div>
            {recommendations.map(rec => {
              const isSelected = selectedIds.has(rec.principle_id);
              const CatIcon = CAT_ICONS_MAP[rec.category];
              return (
                <button
                  key={rec.principle_id}
                  onClick={() => togglePrinciple(rec.principle_id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
                    isSelected
                      ? 'bg-white/[0.06] border-white/[0.12]'
                      : 'bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/[0.06]'
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#0a84ff] border-[#0a84ff]'
                        : 'border-white/[0.12]'
                    }`}
                  >
                    {isSelected && <IconCheck size={10} strokeWidth={3} className="text-white" />}
                  </div>

                  {/* 原则信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[#f5f5f7] truncate font-medium">{rec.title}</span>
                      {CatIcon && (
                        <span style={{ color: CAT_COLORS_MAP[rec.category], display: 'inline-flex' }}>
                          <CatIcon size={11} />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6e6e73] mt-0.5">{rec.match_reason}</p>
                  </div>

                  {/* 匹配度 */}
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                    style={{
                      color: rec.match_score >= 50 ? '#30d158' : '#86868b',
                      backgroundColor: rec.match_score >= 50 ? 'rgba(48,209,88,0.08)' : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    {rec.match_score}%
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 无推荐时的提示 */}
        {context.trim().length >= 2 && recommendations.length === 0 && (
          <p className="text-[12px] text-[#6e6e73] mb-4">
            未找到匹配的原则，你可以手动浏览选择
          </p>
        )}

        {context.trim().length < 2 && (
          <p className="text-[12px] text-[#6e6e73] mb-4">
            输入决策背景后可自动推荐相关原则
          </p>
        )}

        {/* 手动浏览全部原则 */}
        {!showAllPrinciples ? (
          <button
            onClick={() => setShowAllPrinciples(true)}
            className="flex items-center gap-1.5 text-[12px] text-[#86868b] hover:text-[#f5f5f7] transition-colors"
          >
            <IconTag size={13} />
            浏览全部原则 ({EMBEDDED_PRINCIPLES.filter(p => p.status !== 'deprecated').length} 条)
          </button>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#6e6e73] font-medium uppercase tracking-wider">全部原则</span>
              <button
                onClick={() => setShowAllPrinciples(false)}
                className="text-[11px] text-[#86868b] hover:text-[#f5f5f7] transition-colors"
              >
                收起
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
              {availablePrinciples.map(p => {
                const isSelected = selectedIds.has(p.id);
                const CatIcon = CAT_ICONS_MAP[p.category];
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePrinciple(p.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left ${
                      isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'bg-[#0a84ff] border-[#0a84ff]' : 'border-white/[0.12]'
                      }`}
                    >
                      {isSelected && <IconCheck size={8} strokeWidth={3} className="text-white" />}
                    </div>
                    <span className="text-[12px] text-[#98989d] truncate flex-1">{p.title}</span>
                    {CatIcon && (
                      <span style={{ color: CAT_COLORS_MAP[p.category], display: 'inline-flex' }}>
                        <CatIcon size={10} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ============================================
          步骤 3: 做出的决定
          ============================================ */}
      <section className="bg-[#161618] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#30d158]/15 text-[#30d158] text-[11px] font-bold">3</span>
          <span className="text-[13px] font-medium text-[#f5f5f7]">做出的决定</span>
          <span className="text-[11px] text-[#6e6e73]">必填</span>
        </div>
        <textarea
          value={decisionMade}
          onChange={(e) => setDecisionMade(e.target.value)}
          placeholder="你最终做了什么决定？例如：选择了 Vue 3 + Nuxt 方案..."
          rows={3}
          className="w-full px-4 py-3 bg-[#121215] border border-white/[0.08] rounded-xl text-[14px] text-[#f5f5f7] placeholder:text-[#6e6e73] focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff]/20 outline-none transition-all resize-y leading-relaxed"
        />
      </section>

      {/* ============================================
          步骤 4: 预期结果
          ============================================ */}
      <section className="bg-[#161618] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.06] text-[#86868b] text-[11px] font-bold">4</span>
          <span className="text-[13px] font-medium text-[#f5f5f7]">预期结果</span>
          <span className="text-[11px] text-[#6e6e73]">可选</span>
        </div>
        <textarea
          value={expectedOutcome}
          onChange={(e) => setExpectedOutcome(e.target.value)}
          placeholder="你预期这个决定会带来什么结果？这对后续复盘很有帮助..."
          rows={2}
          className="w-full px-4 py-3 bg-[#121215] border border-white/[0.08] rounded-xl text-[14px] text-[#f5f5f7] placeholder:text-[#6e6e73] focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff]/20 outline-none transition-all resize-y leading-relaxed"
        />
      </section>

      {/* ============================================
          操作按钮
          ============================================ */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 py-3 rounded-xl text-[14px] font-medium text-[#86868b] bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className={`flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-medium transition-all ${
            canSave && !saving
              ? 'bg-[#0a84ff] text-white hover:bg-[#1a8eff] active:scale-[0.98] shadow-[0_0_24px_rgba(10,132,255,0.2)]'
              : 'bg-white/[0.06] text-[#48484d] cursor-not-allowed'
          }`}
        >
          {saving ? (
            <>保存中...</>
          ) : (
            <>
              <IconPen size={15} strokeWidth={2} />
              保存决策
              {selectedIds.size > 0 && (
                <span className="text-[11px] opacity-70">
                  (关联 {selectedIds.size} 条原则)
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* 底部留白 */}
      <div className="h-8" />
    </div>
  );
}

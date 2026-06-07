/**
 * 今日视图 — V2 首页
 *
 * 移动端优先：打开即见今日原则、快速记录决策、待复盘提醒。
 * 桌面端同样适用，布局自适应。
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EMBEDDED_PRINCIPLES } from '../data/embedded';
import { getDailyPrinciple, recommendPrinciples } from '../utils/recommendations';
import {
  listPendingReviews,
  listReviewedDecisions,
  getPendingReviewCount,
  getTotalDecisionCount,
} from '../utils/decisions';
import type { DecisionWithReview, Principle, PrincipleRecommendation } from '../types';
import { CATEGORY_LABELS } from '../types';
import {
  IconHome, IconPen, IconTarget, IconAlert, IconClipboard,
  IconLightbulb, IconChevronRight, IconStar, IconCheck,
  IconBook, IconZap, IconShield, IconActivity,
  IconLayers, IconClock,
} from '../components/Icons';

// 分类图标映射
const CAT_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  work: IconActivity,
  invest: IconZap,
  life: IconShield,
};

// 分类颜色
const CAT_COLORS: Record<string, string> = {
  work: '#0a84ff',
  invest: '#30d158',
  life: '#ff9f0a',
};

export default function TodayView() {
  const navigate = useNavigate();
  const [dailyPrinciple, setDailyPrinciple] = useState<Principle | null>(null);
  const [pendingReviews, setPendingReviews] = useState<DecisionWithReview[]>([]);
  const [reviewedDecisions, setReviewedDecisions] = useState<DecisionWithReview[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalDecisions, setTotalDecisions] = useState(0);
  const [quickInput, setQuickInput] = useState('');
  const [quickRecs, setQuickRecs] = useState<PrincipleRecommendation[]>([]);

  const loadData = useCallback(() => {
    setDailyPrinciple(getDailyPrinciple());
    setPendingReviews(listPendingReviews());
    setReviewedDecisions(listReviewedDecisions().slice(0, 5));
    setPendingCount(getPendingReviewCount());
    setTotalDecisions(getTotalDecisionCount());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 快速推荐（用户输入关键词时实时匹配）
  const handleQuickInput = useCallback((value: string) => {
    setQuickInput(value);
    if (value.trim().length >= 2) {
      setQuickRecs(recommendPrinciples(value, 4));
    } else {
      setQuickRecs([]);
    }
  }, []);

  // 快速跳转到新建决策（携带输入的背景）
  const handleStartDecision = useCallback(() => {
    if (quickInput.trim()) {
      navigate(`/decisions/new?context=${encodeURIComponent(quickInput.trim())}`);
    } else {
      navigate('/decisions/new');
    }
  }, [quickInput, navigate]);

  const dailyCatIcon = dailyPrinciple ? CAT_ICONS[dailyPrinciple.category] : null;
  const dailyCatColor = dailyPrinciple ? CAT_COLORS[dailyPrinciple.category] : '#6e6e73';

  return (
    <div className="space-y-6">
      {/* ============================================
          Hero — 今日原则思考
          ============================================ */}
      <section className="bg-gradient-to-br from-[#161618] via-[#1a1a1d] to-[#161618] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <IconLightbulb size={15} className="text-[#ff9f0a]" />
          <span className="text-[11px] text-[#ff9f0a] font-medium tracking-wider uppercase">
            今日原则思考
          </span>
        </div>

        {dailyPrinciple ? (
          <div className="space-y-3">
            {/* 分类 + 主题 */}
            <div className="flex items-center gap-2">
              {dailyCatIcon && (
                <span style={{ color: dailyCatColor, display: 'inline-flex' }}>
                  {React.createElement(dailyCatIcon, { size: 14 })}
                </span>
              )}
              <span className="text-[11px] text-[#86868b] font-medium">
                {CATEGORY_LABELS[dailyPrinciple.category]}
              </span>
              {dailyPrinciple.theme && (
                <>
                  <span className="text-white/[0.1]">·</span>
                  <span className="text-[11px] text-[#6e6e73]">{dailyPrinciple.theme}</span>
                </>
              )}
            </div>

            {/* 标题 */}
            <h2 className="text-[18px] font-semibold tracking-tighter text-[#f5f5f7] leading-snug">
              {dailyPrinciple.title}
            </h2>

            {/* 内容摘要 */}
            <p className="text-[13px] text-[#98989d] leading-relaxed line-clamp-3">
              {dailyPrinciple.content}
            </p>

            {/* 英文原文 */}
            {dailyPrinciple.english_text && (
              <blockquote className="border-l-2 border-white/[0.08] pl-3 text-[12px] text-[#6e6e73] italic leading-relaxed">
                {dailyPrinciple.english_text}
              </blockquote>
            )}

            {/* 操作 */}
            <div className="flex items-center gap-2 pt-1">
              <Link
                to={`/principles/${dailyPrinciple.id}`}
                className="inline-flex items-center gap-1 text-[12px] text-[#86868b] hover:text-[#f5f5f7] transition-colors"
              >
                查看详情
                <IconChevronRight size={12} />
              </Link>
              <span className="text-white/[0.1]">·</span>
              <Link
                to="/principles"
                className="text-[12px] text-[#6e6e73] hover:text-[#86868b] transition-colors"
              >
                浏览全部原则
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-[#86868b]">暂无原则数据</p>
        )}
      </section>

      {/* ============================================
          快速决策入口 — 主 CTA
          ============================================ */}
      <section className="bg-[#161618] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <IconPen size={15} className="text-[#0a84ff]" />
          <span className="text-[11px] text-[#0a84ff] font-medium tracking-wider uppercase">
            记录决策
          </span>
        </div>

        {/* 快速输入 */}
        <div className="relative mb-3">
          <textarea
            value={quickInput}
            onChange={(e) => handleQuickInput(e.target.value)}
            placeholder="描述你面临的选择或决策背景..."
            rows={2}
            className="w-full px-4 py-3 bg-[#121215] border border-white/[0.08] rounded-xl text-[14px] text-[#f5f5f7] placeholder:text-[#6e6e73] focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff]/20 outline-none transition-all resize-none leading-relaxed"
          />
        </div>

        {/* 实时原则推荐 */}
        {quickRecs.length > 0 && (
          <div className="mb-3 space-y-1.5">
            <p className="text-[10px] text-[#6e6e73] uppercase tracking-wider mb-2">推荐原则</p>
            {quickRecs.map((rec) => {
              const CatIcon = CAT_ICONS[rec.category];
              return (
                <div
                  key={rec.principle_id}
                  className="flex items-center gap-2 px-3 py-2 bg-[#121215] rounded-lg border border-white/[0.04]"
                >
                  {CatIcon && (
                    <span style={{ color: CAT_COLORS[rec.category], display: 'inline-flex' }}>
                      <CatIcon size={13} />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#f5f5f7] truncate font-medium">{rec.title}</p>
                    <p className="text-[10px] text-[#6e6e73]">{rec.match_reason}</p>
                  </div>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      color: rec.match_score >= 50 ? '#30d158' : '#86868b',
                      backgroundColor: rec.match_score >= 50 ? 'rgba(48,209,88,0.08)' : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    {rec.match_score}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA 按钮 */}
        <button
          onClick={handleStartDecision}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0a84ff] text-white text-[14px] font-medium rounded-xl hover:bg-[#1a8eff] active:scale-[0.98] transition-all"
        >
          <IconPen size={15} strokeWidth={2} />
          {quickInput.trim() ? '开始记录决策' : '记录一次决策'}
        </button>

        {quickInput.trim() && quickRecs.length === 0 && (
          <p className="text-[11px] text-[#6e6e73] text-center mt-2">
            输入更多关键词来匹配相关原则
          </p>
        )}
      </section>

      {/* ============================================
          待复盘提醒
          ============================================ */}
      {pendingCount > 0 && (
        <section className="bg-[#161618] border border-[#ff9f0a]/15 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconAlert size={15} className="text-[#ff9f0a]" />
              <span className="text-[11px] text-[#ff9f0a] font-medium tracking-wider uppercase">
                待复盘
              </span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#ff9f0a] text-[#0a0a0c] text-[11px] font-bold">
                {pendingCount}
              </span>
            </div>
            {pendingCount > 3 && (
              <Link
                to="/decisions"
                className="text-[12px] text-[#86868b] hover:text-[#f5f5f7] transition-colors"
              >
                查看全部 →
              </Link>
            )}
          </div>

          <div className="space-y-2">
            {pendingReviews.slice(0, 5).map((dwr) => (
              <Link
                key={dwr.decision.id}
                to={`/decisions/${dwr.decision.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors group"
              >
                <IconTarget size={14} className="text-[#ff9f0a] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#f5f5f7] truncate">
                    {dwr.decision.context || dwr.decision.decision_made}
                  </p>
                  <p className="text-[11px] text-[#6e6e73] mt-0.5">
                    {formatRelativeTime(dwr.decision.created_at)} · {dwr.decision.linked_principle_ids.length} 条原则关联
                  </p>
                </div>
                <IconChevronRight size={12} className="text-[#48484d] group-hover:text-[#86868b] transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============================================
          无待复盘时的空状态引导
          ============================================ */}
      {pendingCount === 0 && totalDecisions === 0 && (
        <section className="text-center py-6">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-white/[0.04] flex items-center justify-center">
            <IconClipboard size={18} className="text-[#48484d]" />
          </div>
          <p className="text-[13px] text-[#86868b]">还没有记录过决策</p>
          <p className="text-[12px] text-[#6e6e73] mt-1">
            遇到需要权衡的选择时，点击上方按钮记录你的第一次决策
          </p>
        </section>
      )}

      {pendingCount === 0 && totalDecisions > 0 && (
        <div className="flex items-center justify-center gap-2 py-4 text-[13px] text-[#30d158]">
          <IconCheck size={15} />
          全部决策已完成复盘 ✅
        </div>
      )}

      {/* ============================================
          最近已复盘
          ============================================ */}
      {reviewedDecisions.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <IconClock size={14} className="text-[#6e6e73]" />
            <span className="text-[11px] text-[#6e6e73] font-medium tracking-wider uppercase">
              最近复盘
            </span>
          </div>

          <div className="space-y-2">
            {reviewedDecisions.map((dwr) => (
              <Link
                key={dwr.decision.id}
                to={`/decisions/${dwr.decision.id}`}
                className="flex items-center gap-3 px-3 py-2.5 bg-[#161618] border border-white/[0.06] rounded-lg hover:bg-[#1c1c1f] transition-colors group"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      dwr.review?.effectiveness === 'effective' ? '#30d158' :
                      dwr.review?.effectiveness === 'partial' ? '#ff9f0a' :
                      dwr.review?.effectiveness === 'ineffective' ? '#ff375f' :
                      '#6e6e73',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#f5f5f7] truncate">
                    {dwr.decision.decision_made || dwr.decision.context}
                  </p>
                  <p className="text-[11px] text-[#6e6e73] mt-0.5">
                    复盘于 {formatRelativeTime(dwr.review?.reviewed_at || '')}
                  </p>
                </div>
                <IconChevronRight size={12} className="text-[#48484d] group-hover:text-[#86868b] transition-colors" />
              </Link>
            ))}
          </div>

          {reviewedDecisions.length >= 5 && (
            <Link
              to="/decisions"
              className="block text-center text-[12px] text-[#86868b] hover:text-[#f5f5f7] mt-3 py-1 transition-colors"
            >
              查看全部决策 →
            </Link>
          )}
        </section>
      )}

      {/* ============================================
          原则库入口
          ============================================ */}
      <section className="grid grid-cols-3 gap-3">
        <Link
          to="/principles"
          className="flex flex-col items-center gap-1.5 px-3 py-4 bg-[#161618] border border-white/[0.06] rounded-xl hover:bg-[#1c1c1f] transition-colors"
        >
          <IconBook size={18} className="text-[#86868b]" />
          <span className="text-[11px] text-[#86868b]">原则库</span>
        </Link>
        <Link
          to="/customize"
          className="flex flex-col items-center gap-1.5 px-3 py-4 bg-[#161618] border border-white/[0.06] rounded-xl hover:bg-[#1c1c1f] transition-colors"
        >
          <IconStar size={18} className="text-[#ff9f0a]" />
          <span className="text-[11px] text-[#86868b]">定制原则</span>
        </Link>
        <Link
          to="/decisions"
          className="flex flex-col items-center gap-1.5 px-3 py-4 bg-[#161618] border border-white/[0.06] rounded-xl hover:bg-[#1c1c1f] transition-colors"
        >
          <IconClipboard size={18} className="text-[#86868b]" />
          <span className="text-[11px] text-[#86868b]">全部决策</span>
        </Link>
      </section>
    </div>
  );
}

// ============================================================
// 辅助函数
// ============================================================

/** 格式化为相对时间 */
function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours} 小时前`;

  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days} 天前`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} 周前`;

  return new Date(dateStr).toLocaleDateString('zh-CN');
}

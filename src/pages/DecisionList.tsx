/**
 * 决策列表页 — P2
 *
 * 选项卡：全部 / 待复盘 / 已复盘
 * 支持查看、删除决策。
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  listAllDecisionWithReviews,
  listPendingReviews,
  listReviewedDecisions,
  deleteDecision,
  getTotalDecisionCount,
} from '../utils/decisions';
import { EMBEDDED_PRINCIPLES } from '../data/embedded';
import { EFFECTIVENESS_LABELS } from '../types';
import type { DecisionWithReview } from '../types';
import {
  IconClipboard, IconTarget, IconChevronRight, IconTrash,
  IconX, IconCheck, IconClock, IconAlert,
} from '../components/Icons';

type TabKey = 'all' | 'pending' | 'reviewed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待复盘' },
  { key: 'reviewed', label: '已复盘' },
];

export default function DecisionList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [decisions, setDecisions] = useState<DecisionWithReview[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<DecisionWithReview | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 加载数据
  useEffect(() => {
    let data: DecisionWithReview[];
    switch (activeTab) {
      case 'pending':
        data = listPendingReviews();
        break;
      case 'reviewed':
        data = listReviewedDecisions();
        break;
      default:
        data = listAllDecisionWithReviews();
    }
    setDecisions(data);
    setPendingCount(listPendingReviews().length);
    setReviewedCount(listReviewedDecisions().length);
    setTotalCount(getTotalDecisionCount());
  }, [activeTab, refreshKey]);

  // 确认删除
  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteDecision(deleteTarget.decision.id);
    setDeleteTarget(null);
    setRefreshKey(k => k + 1);
  }, [deleteTarget]);

  // 获取原则标题
  const getPrincipleTitle = useCallback((id: number): string => {
    const p = EMBEDDED_PRINCIPLES.find(pr => pr.id === id);
    return p?.title || `原则 #${id}`;
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-[#f5f5f7]">决策记录</h1>
          <p className="text-[13px] text-[#86868b] mt-1">
            {totalCount === 0 ? '记录你的决策，结合原则进行复盘' : `${totalCount} 条决策 · ${pendingCount} 条待复盘`}
          </p>
        </div>
        <Link
          to="/decisions/new"
          className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white bg-[#0a84ff] rounded-lg hover:bg-[#1a8eff] transition-colors shadow-[0_0_16px_rgba(10,132,255,0.2)]"
        >
          + 新建
        </Link>
      </div>

      {/* 选项卡 */}
      <div className="flex gap-1 p-1 bg-[#121215] rounded-xl border border-white/[0.06]">
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-[13px] font-medium rounded-lg transition-all ${
                active
                  ? 'bg-white/[0.08] text-[#f5f5f7]'
                  : 'text-[#6e6e73] hover:text-[#98989d]'
              }`}
            >
              {tab.label}
              {tab.key === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-[#ff9f0a] text-[#0a0a0c] text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 决策列表 */}
      {decisions.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-2 stagger-list">
          {decisions.map(dwr => (
            <DecisionCard
              key={dwr.decision.id}
              dwr={dwr}
              getPrincipleTitle={getPrincipleTitle}
              onDelete={() => setDeleteTarget(dwr)}
            />
          ))}
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <DeleteModal
          dwr={deleteTarget}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* 底部留白 */}
      <div className="h-8" />
    </div>
  );
}

// ============================================================
// 子组件
// ============================================================

/** 决策卡片 */
function DecisionCard({
  dwr,
  getPrincipleTitle,
  onDelete,
}: {
  dwr: DecisionWithReview;
  getPrincipleTitle: (id: number) => string;
  onDelete: () => void;
}) {
  const { decision, review } = dwr;
  const isReviewed = !!review;

  return (
    <div className="group bg-[#161618] border border-white/[0.06] rounded-xl hover:border-white/[0.1] transition-all">
      <Link
        to={`/decisions/${decision.id}`}
        className="block p-4"
      >
        {/* 状态 + 时间 */}
        <div className="flex items-center gap-2 mb-2.5">
          {isReviewed ? (
            <span
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{
                color: review.effectiveness === 'effective' ? '#30d158' :
                       review.effectiveness === 'partial' ? '#ff9f0a' :
                       '#ff375f',
                backgroundColor: review.effectiveness === 'effective' ? 'rgba(48,209,88,0.1)' :
                                review.effectiveness === 'partial' ? 'rgba(255,159,10,0.1)' :
                                'rgba(255,55,95,0.1)',
              }}
            >
              <IconCheck size={11} />
              已复盘
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full text-[#ff9f0a] bg-[#ff9f0a]/10">
              <IconClock size={11} />
              待复盘
            </span>
          )}
          <span className="text-[11px] text-[#6e6e73]">
            {formatRelativeTime(decision.created_at)}
          </span>
          {review && (
            <span className="text-[11px] text-[#6e6e73]">
              · 复盘于 {formatRelativeTime(review.reviewed_at)}
            </span>
          )}
        </div>

        {/* 决策背景 */}
        <p className="text-[14px] text-[#f5f5f7] leading-relaxed line-clamp-2">
          {decision.decision_made || decision.context}
        </p>

        {/* 背景摘要 */}
        {decision.decision_made && decision.context && (
          <p className="text-[12px] text-[#86868b] mt-1 line-clamp-1">
            {decision.context}
          </p>
        )}

        {/* 关联原则 */}
        {decision.linked_principle_ids.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {decision.linked_principle_ids.slice(0, 4).map(pid => (
              <span
                key={pid}
                className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[11px] text-[#86868b] border border-white/[0.06]"
              >
                {getPrincipleTitle(pid)}
              </span>
            ))}
            {decision.linked_principle_ids.length > 4 && (
              <span className="text-[11px] text-[#6e6e73]">
                +{decision.linked_principle_ids.length - 4}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* 操作 */}
      <div className="flex items-center justify-end gap-1 px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          to={`/decisions/${decision.id}`}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/[0.04] rounded-lg transition-all"
        >
          {isReviewed ? '查看详情' : '去复盘'}
          <IconChevronRight size={11} />
        </Link>
        <button
          onClick={(e) => { e.preventDefault(); onDelete(); }}
          className="p-1.5 rounded-lg text-[#48484d] hover:text-[#ff375f] hover:bg-[#ff375f]/5 transition-all"
        >
          <IconTrash size={13} />
        </button>
      </div>
    </div>
  );
}

/** 空状态 */
function EmptyState({ tab }: { tab: TabKey }) {
  switch (tab) {
    case 'pending':
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-[#30d158]/10 flex items-center justify-center mb-4">
            <IconCheck size={20} className="text-[#30d158]" />
          </div>
          <p className="text-[14px] text-[#f5f5f7] font-medium">全部决策已完成复盘</p>
          <p className="text-[12px] text-[#6e6e73] mt-1.5 max-w-xs">
            没有等待复盘的决策，做得不错！
          </p>
          <Link
            to="/decisions/new"
            className="mt-4 px-4 py-2 bg-white/[0.06] text-[13px] text-[#86868b] rounded-lg hover:bg-white/[0.1] transition-colors"
          >
            记录新决策
          </Link>
        </div>
      );
    case 'reviewed':
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
            <IconTarget size={20} className="text-[#48484d]" />
          </div>
          <p className="text-[14px] text-[#f5f5f7] font-medium">还没有复盘记录</p>
          <p className="text-[12px] text-[#6e6e73] mt-1.5 max-w-xs">
            每次决策后及时复盘，观察原则在实践中的有效性
          </p>
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
            <IconClipboard size={20} className="text-[#48484d]" />
          </div>
          <p className="text-[14px] text-[#f5f5f7] font-medium">还没有决策记录</p>
          <p className="text-[12px] text-[#6e6e73] mt-1.5 max-w-xs">
            遇到需要权衡的选择时，描述背景、关联原则、记录你的决定
          </p>
          <Link
            to="/decisions/new"
            className="mt-4 px-4 py-2 bg-white/[0.06] text-[13px] text-[#86868b] rounded-lg hover:bg-white/[0.1] transition-colors"
          >
            记录第一次决策
          </Link>
        </div>
      );
  }
}

/** 删除确认弹窗 */
function DeleteModal({
  dwr,
  onConfirm,
  onCancel,
}: {
  dwr: DecisionWithReview;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* 弹窗 */}
      <div className="relative bg-[#1c1c1f] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#ff375f]/10 flex items-center justify-center">
            <IconTrash size={16} className="text-[#ff375f]" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-[#f5f5f7]">确认删除这条决策？</p>
            <p className="text-[12px] text-[#86868b]">此操作不可撤销</p>
          </div>
        </div>

        <p className="text-[13px] text-[#98989d] line-clamp-2 mb-5 px-1">
          {dwr.decision.decision_made || dwr.decision.context}
        </p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-[#86868b] bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-white bg-[#ff375f] hover:bg-[#ff2d55] transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 辅助函数
// ============================================================

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

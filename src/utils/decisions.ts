/**
 * 决策 & 复盘 localStorage 工具
 *
 * 存储结构（localStorage key: principle_decisions）:
 * {
 *   decisions: Record<string, Decision>,     // key = decision.id
 *   reviews: Record<string, Review>,         // key = decision.id
 * }
 */

import type { Decision, Review, DecisionWithReview, Effectiveness, PrincipleFeedback } from '../types';

const STORAGE_KEY = 'principle_decisions';

interface StorageShape {
  decisions: Record<string, Decision>;
  reviews: Record<string, Review>;
}

function load(): StorageShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { decisions: {}, reviews: {} };
    return JSON.parse(raw);
  } catch {
    return { decisions: {}, reviews: {} };
  }
}

function save(data: StorageShape): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ============================================================
// Decision CRUD
// ============================================================

/** 生成唯一ID */
export function generateDecisionId(): string {
  return `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 保存/更新决策 */
export function saveDecision(decision: Decision): void {
  const data = load();
  data.decisions[decision.id] = decision;
  save(data);
}

/** 获取单条决策 */
export function getDecision(id: string): Decision | null {
  const data = load();
  return data.decisions[id] ?? null;
}

/** 获取所有决策，按时间倒序 */
export function listDecisions(): Decision[] {
  const data = load();
  return Object.values(data.decisions).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/** 获取某条原则关联的所有决策 */
export function getDecisionsByPrinciple(principleId: number): Decision[] {
  const data = load();
  return Object.values(data.decisions)
    .filter(d => d.linked_principle_ids.includes(principleId))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/** 删除决策及其复盘 */
export function deleteDecision(id: string): void {
  const data = load();
  delete data.decisions[id];
  delete data.reviews[id];
  save(data);
}

// ============================================================
// Review CRUD
// ============================================================

/** 保存复盘 */
export function saveReview(review: Review): void {
  const data = load();
  data.reviews[review.decision_id] = review;
  save(data);
}

/** 获取复盘 */
export function getReview(decisionId: string): Review | null {
  const data = load();
  return data.reviews[decisionId] ?? null;
}

/** 获取所有待复盘的决策（有决策但没复盘） */
export function listPendingReviews(): DecisionWithReview[] {
  const data = load();
  const result: DecisionWithReview[] = [];
  for (const d of Object.values(data.decisions)) {
    if (!data.reviews[d.id]) {
      result.push({ decision: d, review: null });
    }
  }
  return result.sort(
    (a, b) => new Date(b.decision.created_at).getTime() - new Date(a.decision.created_at).getTime()
  );
}

/** 获取所有已完成复盘的决策 */
export function listReviewedDecisions(): DecisionWithReview[] {
  const data = load();
  const result: DecisionWithReview[] = [];
  for (const d of Object.values(data.decisions)) {
    const review = data.reviews[d.id];
    if (review) {
      result.push({ decision: d, review });
    }
  }
  return result.sort(
    (a, b) => new Date(b.review!.reviewed_at).getTime() - new Date(a.review!.reviewed_at).getTime()
  );
}

/** 获取所有决策+复盘（合并视图） */
export function listAllDecisionWithReviews(): DecisionWithReview[] {
  const data = load();
  return Object.values(data.decisions)
    .map(d => ({ decision: d, review: data.reviews[d.id] ?? null }))
    .sort((a, b) => new Date(b.decision.created_at).getTime() - new Date(a.decision.created_at).getTime());
}

/** 待复盘数量 */
export function getPendingReviewCount(): number {
  const data = load();
  return Object.values(data.decisions).filter(d => !data.reviews[d.id]).length;
}

/** 总决策数 */
export function getTotalDecisionCount(): number {
  const data = load();
  return Object.keys(data.decisions).length;
}

// ============================================================
// 原则反馈统计
// ============================================================

/** 获取某条原则的反馈统计 */
export function getPrincipleFeedback(principleId: number): PrincipleFeedback {
  const all = listAllDecisionWithReviews();
  const related = all.filter(d => d.decision.linked_principle_ids.includes(principleId));

  let effective = 0, partial = 0, ineffective = 0;
  for (const d of related) {
    if (d.review) {
      if (d.review.effectiveness === 'effective') effective++;
      else if (d.review.effectiveness === 'partial') partial++;
      else if (d.review.effectiveness === 'ineffective') ineffective++;
    }
  }

  return {
    total_decisions: related.length,
    effective_count: effective,
    partial_count: partial,
    ineffective_count: ineffective,
    decisions: related,
  };
}

/** 导出所有数据 */
export function exportAllData(): string {
  const data = load();
  return JSON.stringify(data, null, 2);
}

/** 清空所有决策数据 */
export function clearAllDecisions(): void {
  localStorage.removeItem(STORAGE_KEY);
}

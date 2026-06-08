/**
 * 原则推荐引擎
 *
 * MVP 版本：基于标签/主题/关键词匹配，不使用 AI。
 * 输入用户描述的决策背景，返回 Top-N 匹配的原则。
 */

import { EMBEDDED_PRINCIPLES } from '../data/embedded';
import type { Principle, PrincipleRecommendation, Category } from '../types';

/** 简单中文分词（按常见分隔符和2-gram切分） */
function tokenize(text: string): string[] {
  // 移除标点，按空格/逗号/句号等分割
  const cleaned = text.replace(/[，。！？、；：""''（）\s]+/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter(w => w.length >= 1);

  // 补充 2-gram（连续两个字符的组合），提升短输入匹配
  const bigrams: string[] = [];
  for (const word of words) {
    if (word.length >= 2) {
      for (let i = 0; i < word.length - 1; i++) {
        bigrams.push(word.slice(i, i + 2));
      }
    }
  }

  return [...new Set([...words, ...bigrams])];
}

/** 计算匹配分数 */
function computeScore(
  tokens: string[],
  principle: Principle
): number {
  let score = 0;
  const reasons: string[] = [];
  const target = `${principle.title} ${principle.content} ${principle.tags} ${principle.theme} ${principle.category}`.toLowerCase();

  for (const token of tokens) {
    const t = token.toLowerCase();
    if (t.length === 0) continue;

    // 标题匹配（权重 x3）
    if (principle.title.toLowerCase().includes(t)) {
      score += 30;
      reasons.push(`标题匹配: "${token}"`);
      continue;
    }

    // 标签匹配（权重 x2）
    if (principle.tags.toLowerCase().includes(t)) {
      score += 20;
      reasons.push(`标签匹配: "${token}"`);
      continue;
    }

    // 主题匹配（权重 x2）
    if (principle.theme.toLowerCase().includes(t)) {
      score += 20;
      reasons.push(`主题匹配: "${token}"`);
      continue;
    }

    // 内容匹配（权重 x1）
    if (principle.content.toLowerCase().includes(t)) {
      score += 10;
      reasons.push(`内容匹配: "${token}"`);
    }
  }

  return Math.min(score, 100);
}

/** 生成匹配原因 */
function generateReason(
  tokens: string[],
  principle: Principle
): string {
  const reasons: string[] = [];
  const target = `${principle.title} ${principle.tags} ${principle.theme}`.toLowerCase();

  for (const token of tokens) {
    const t = token.toLowerCase();
    if (principle.title.toLowerCase().includes(t)) reasons.push(`标题含"${token}"`);
    else if (principle.tags.toLowerCase().includes(t)) reasons.push(`标签含"${token}"`);
    else if (principle.theme.toLowerCase().includes(t)) reasons.push(`主题含"${token}"`);
  }

  return reasons.slice(0, 2).join('、') || '关键词匹配';
}

/**
 * 根据输入文本推荐原则
 * @param input 用户输入的决策背景
 * @param topN 返回前N条
 * @param categoryFilter 可选分类过滤
 */
export function recommendPrinciples(
  input: string,
  topN: number = 5,
  categoryFilter?: Category
): PrincipleRecommendation[] {
  if (!input.trim()) return [];

  const tokens = tokenize(input);
  if (tokens.length === 0) return [];

  const candidates = categoryFilter
    ? EMBEDDED_PRINCIPLES.filter(p => p.category === categoryFilter && p.status === 'published')
    : EMBEDDED_PRINCIPLES.filter(p => p.status === 'published');

  const scored = candidates.map(p => {
    const score = computeScore(tokens, p);
    return {
      principle_id: p.id,
      title: p.title,
      category: p.category,
      theme: p.theme,
      match_score: score,
      match_reason: generateReason(tokens, p),
    };
  });

  return scored
    .filter(s => s.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, topN);
}

/**
 * 随机获取一条原则（用于每日推荐）
 */
export function getDailyPrinciple(): Principle | null {
  const active = EMBEDDED_PRINCIPLES.filter(p => p.status === 'published');
  if (active.length === 0) return null;
  // 基于日期选择（同一天返回同一条）
  const today = new Date().toISOString().slice(0, 10);
  const hash = today.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return active[hash % active.length];
}

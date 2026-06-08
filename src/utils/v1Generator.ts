/**
 * 客户端 V1 HTML/Markdown 生成器
 *
 * 在浏览器端生成正式版文档，合并 localStorage 中的个性化数据。
 */

import type { Principle, Category } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { loadPersonalizations } from '../utils/personalization';

const CATEGORY_BG: Record<string, string> = {
  work: '#eff6ff',
  invest: '#ecfdf5',
  life: '#fffbeb',
  constitution: '#faf5ff',
};
const CATEGORY_BORDER: Record<string, string> = {
  work: '#bfdbfe',
  invest: '#a7f3d0',
  life: '#fde68a',
  constitution: '#e9d5ff',
};

export interface V1Result {
  html: string;
  markdown: string;
  principleCount: number;
  categories: Record<string, number>;
  title: string;
}

export function generateV1Client(
  principles: Principle[],
  options: {
    title?: string;
    subtitle?: string;
    includeSource?: boolean;
    includeEnglish?: boolean;
  } = {}
): V1Result {
  const {
    title = '个人原则规范 V1',
    subtitle = '基于 Ray Dalio 与 Naval Ravikant 原则体系，经个人化定制',
    includeSource = true,
    includeEnglish = true,
  } = options;

  const personalizations = loadPersonalizations();

  // 应用个人化内容
  const merged = principles.map((p) => {
    const pd = personalizations[p.id];
    if (!pd) return p;
    return {
      ...p,
      personal_note: pd.personal_note || '',
      relevance: pd.relevance || 0,
      is_personalized: pd.is_personalized || false,
      content: pd.custom_content || p.content,
    };
  });

  // 按分类分组
  const categories = { work: 0, invest: 0, life: 0, constitution: 0 };
  const byCategory: Record<string, Principle[]> = {
    work: [], invest: [], life: [], constitution: [],
  };

  for (const p of merged) {
    if (p.category in categories) {
      categories[p.category]++;
      byCategory[p.category].push(p);
    }
  }

  const html = generateHTML(merged, byCategory, categories, title, subtitle, includeSource, includeEnglish);
  const md = generateMarkdown(merged, byCategory, categories, title, includeSource, includeEnglish);

  return {
    html,
    markdown: md,
    principleCount: merged.length,
    categories: categories as Record<string, number>,
    title,
  };
}

function generateHTML(
  principles: Principle[],
  byCategory: Record<string, Principle[]>,
  categories: Record<string, number>,
  title: string,
  subtitle: string,
  includeSource: boolean,
  includeEnglish: boolean,
): string {
  const nowStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const total = principles.length;
  const catOrder: Category[] = ['work', 'invest', 'life', 'constitution'];

  // 分组：按主题
  function groupByTheme(ps: Principle[]): Record<string, Principle[]> {
    const groups: Record<string, Principle[]> = {};
    for (const p of ps) {
      const t = p.theme || '其他';
      if (!groups[t]) groups[t] = [];
      groups[t].push(p);
    }
    return groups;
  }

  let cardsHTML = '';
  for (const cat of catOrder) {
    const ps = byCategory[cat] || [];
    const label = CATEGORY_LABELS[cat];
    const color = CATEGORY_COLORS[cat];
    const bg = CATEGORY_BG[cat] || '#f9fafb';

    cardsHTML += `<div class="category-section">`;
    cardsHTML += `<h2 class="category-title" style="color: ${color}; border-bottom: 3px solid ${color}; padding-bottom: 8px;">${label} <span class="count-badge">${ps.length} 条</span></h2>`;

    if (ps.length === 0) {
      cardsHTML += '<p class="empty">暂无原则</p></div>';
      continue;
    }

    const themes = groupByTheme(ps);
    for (const [theme, tps] of Object.entries(themes)) {
      if (Object.keys(themes).length > 1) {
        cardsHTML += `<h3 class="theme-title">${theme}</h3>`;
      }
      for (let i = 0; i < tps.length; i++) {
        const p = tps[i];
        const stars = p.relevance > 0
          ? '<span class="stars">' + '★'.repeat(p.relevance) + '☆'.repeat(5 - p.relevance) + '</span>'
          : '';

        cardsHTML += `<div class="principle-item" style="border-left-color: ${color};">`;
        cardsHTML += `<div class="principle-header">`;
        cardsHTML += `<span class="principle-number" style="color: ${color};">${i + 1}.</span>`;
        cardsHTML += `<span class="principle-title">${esc(p.title)}</span>`;
        if (stars) cardsHTML += stars;
        cardsHTML += `</div>`;

        if (includeEnglish && p.english_text) {
          cardsHTML += `<blockquote class="english-quote">${esc(p.english_text)}</blockquote>`;
        }

        cardsHTML += `<div class="principle-content">${esc(p.content)}</div>`;

        const meta = [];
        if (includeSource && p.source) meta.push(`来源：${esc(p.source)}`);
        meta.push(`版本：V${p.version}`);
        if (p.personal_note) meta.push(`💡 ${esc(p.personal_note)}`);
        cardsHTML += `<div class="principle-meta">${meta.join(' &nbsp;|&nbsp; ')}</div>`;
        cardsHTML += `</div>`;
      }
    }
    cardsHTML += `</div>`;
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
    @page { size: A4; margin: 2cm 2.2cm;
        @top-center { content: "${esc(title)}"; font-size: 9pt; color: #888; }
        @bottom-center { content: "第 " counter(page) " 页"; font-size: 9pt; color: #888; } }
    body { font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif; font-size: 11pt; line-height: 1.85; color: #1a1a2e; }
    .cover { text-align: center; padding: 80px 20px 60px; page-break-after: always; }
    .cover-icon { font-size: 64px; margin-bottom: 20px; }
    .cover h1 { font-size: 32pt; color: #1e3a8a; margin-bottom: 10px; letter-spacing: 4px; }
    .cover .subtitle { font-size: 13pt; color: #6b7280; margin-bottom: 30px; }
    .cover .stats { display: flex; justify-content: center; gap: 50px; margin: 30px 0; }
    .cover .stat-item { text-align: center; }
    .cover .stat-num { font-size: 30pt; font-weight: bold; color: #1e3a8a; }
    .cover .stat-label { font-size: 10pt; color: #6b7280; }
    .cover .version-tag { display: inline-block; background: #1e3a8a; color: white; padding: 6px 24px; border-radius: 20px; font-size: 11pt; margin-top: 20px; }
    .cover .meta { font-size: 9pt; color: #9ca3af; margin-top: 40px; }
    .category-section { margin-bottom: 35px; page-break-before: always; }
    .category-section:first-of-type { page-break-before: auto; }
    .category-title { font-size: 18pt; margin-bottom: 18px; }
    .count-badge { font-size: 10pt; color: #9ca3af; font-weight: normal; margin-left: 8px; }
    .theme-title { font-size: 13pt; color: #4b5563; margin: 16px 0 10px; padding-left: 12px; border-left: 3px solid #d1d5db; }
    .principle-item { background: #fafbfc; border-left: 4px solid #3b82f6; padding: 14px 18px; margin-bottom: 16px; border-radius: 6px; page-break-inside: avoid; }
    .principle-header { font-weight: bold; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .principle-number { font-weight: bold; min-width: 24px; }
    .principle-title { font-size: 12pt; flex: 1; }
    .stars { font-size: 9pt; color: #f59e0b; white-space: nowrap; }
    .english-quote { margin: 6px 0 10px; padding: 8px 14px; background: #f1f5f9; border-radius: 4px; font-style: italic; color: #475569; font-size: 10pt; line-height: 1.6; border: none; }
    .principle-content { margin: 8px 0; text-align: justify; color: #1f2937; white-space: pre-wrap; }
    .principle-meta { font-size: 9pt; color: #9ca3af; margin-top: 8px; }
    .empty { color: #9ca3af; font-style: italic; }
    .footer-note { text-align: center; margin-top: 40px; padding: 20px; color: #9ca3af; font-size: 9pt; border-top: 1px solid #e5e7eb; }
</style>
</head>
<body>
<div class="cover">
    <div class="cover-icon">⚖️</div>
    <h1>${esc(title)}</h1>
    <div class="subtitle">${esc(subtitle)}</div>
    <div class="stats">
        <div class="stat-item"><div class="stat-num">${total}</div><div class="stat-label">核心原则</div></div>
        <div class="stat-item"><div class="stat-num">${categories['work'] || 0}</div><div class="stat-label">工作原则</div></div>
        <div class="stat-item"><div class="stat-num">${categories['invest'] || 0}</div><div class="stat-label">投资原则</div></div>
        <div class="stat-item"><div class="stat-num">${categories['life'] || 0}</div><div class="stat-label">生活原则</div></div>
        <div class="stat-item"><div class="stat-num">${categories['constitution'] || 0}</div><div class="stat-label">原则宪法</div></div>
    </div>
    <div class="version-tag">Version 1.0 · 正式版</div>
    <div class="meta">基于 Ray Dalio 与 Naval Ravikant 原则体系<br/>经个人化定制与沉淀 · ${nowStr}</div>
</div>
${cardsHTML}
<div class="footer-note">
    <p>本文档由个人原则库系统生成 · 个人原则规范 V1 正式版</p>
    <p>这些原则将随着个人成长和实践不断迭代进化</p>
</div>
</body>
</html>`;
}

function generateMarkdown(
  principles: Principle[],
  byCategory: Record<string, Principle[]>,
  categories: Record<string, number>,
  title: string,
  includeSource: boolean,
  includeEnglish: boolean,
): string {
  const nowStr = new Date().toLocaleDateString('zh-CN');
  const total = principles.length;
  const catOrder: Category[] = ['work', 'invest', 'life', 'constitution'];

  const lines: string[] = [];
  lines.push(`# ${title}\n`);
  lines.push(`> ${total} 条原则 | 工作 ${categories['work'] || 0} 条 | 投资 ${categories['invest'] || 0} 条 | 生活 ${categories['life'] || 0} 条 | 宪法 ${categories['constitution'] || 0} 条\n`);
  lines.push(`> 生成时间：${nowStr}\n`);

  for (const cat of catOrder) {
    const ps = byCategory[cat] || [];
    lines.push(`\n## ${CATEGORY_LABELS[cat]}\n`);
    if (ps.length === 0) {
      lines.push('（暂无原则）\n');
      continue;
    }
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      lines.push(`### ${i + 1}. ${p.title}\n`);
      if (includeEnglish && p.english_text) {
        lines.push(`> *${p.english_text}*\n`);
      }
      lines.push(`${p.content}\n`);
      const meta = [];
      if (includeSource && p.source) meta.push(`来源：${p.source}`);
      meta.push(`版本：V${p.version}`);
      if (p.personal_note) meta.push(`备注：${p.personal_note}`);
      if (p.relevance > 0) meta.push(`相关度：${'★'.repeat(p.relevance)}`);
      lines.push(`*${meta.join(' | ')}*\n`);
    }
  }

  lines.push('\n---\n');
  lines.push(`*本文档由个人原则库生成 · ${title}*\n`);
  return lines.join('\n');
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

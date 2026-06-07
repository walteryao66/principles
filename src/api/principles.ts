/**
 * 本地数据 API 层
 *
 * 所有原则数据已内嵌在 ./data/embedded 中，
 * 不再依赖后端 HTTP 服务。个性化数据仍走 localStorage。
 */
import { EMBEDDED_PRINCIPLES, EMBEDDED_STATS } from '../data/embedded';
import type { Principle, Stats, PrincipleCreate, PrincipleUpdate } from '../types';

// ============================================================
// 本地写入操作（模拟后端 CRUD）
// ============================================================
let _nextId = Math.max(...EMBEDDED_PRINCIPLES.map(p => p.id), 0) + 1;

function clonePrinciples(): Principle[] {
  return EMBEDDED_PRINCIPLES.map(p => ({ ...p, versions: p.versions?.map(v => ({ ...v })) }));
}

export const api = {
  // ---- 列表查询 ----
  listPrinciples(params?: Record<string, string | boolean | undefined>): Promise<Principle[]> {
    let list = clonePrinciples();
    if (params) {
      if (params.category && params.category !== '') {
        list = list.filter(p => p.category === params.category);
      }
      if (params.status && params.status !== '') {
        list = list.filter(p => p.status === params.status);
      }
      if (params.source && params.source !== '') {
        list = list.filter(p => p.source === params.source);
      }
      if (params.search && params.search !== '') {
        const q = String(params.search).toLowerCase();
        list = list.filter(p =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.tags && p.tags.toLowerCase().includes(q))
        );
      }
    }
    return Promise.resolve(list);
  },

  // ---- 单条查询 ----
  getPrinciple(id: number): Promise<Principle> {
    const p = EMBEDDED_PRINCIPLES.find(x => x.id === id);
    if (!p) return Promise.reject(new Error('原则未找到'));
    return Promise.resolve({ ...p, versions: p.versions?.map(v => ({ ...v })) });
  },

  // ---- 创建 ----
  createPrinciple(data: Record<string, unknown>): Promise<Principle> {
    const now = new Date().toISOString();
    const p: Principle = {
      id: _nextId++,
      title: data.title as string,
      content: data.content as string,
      english_text: (data.english_text as string) || '',
      category: data.category as 'work' | 'invest' | 'life',
      source: (data.source as string) || '自定义',
      tags: (data.tags as string) || '',
      theme: (data.theme as string) || '',
      status: 'published',
      version: 1,
      sort_order: (data.sort_order as number) || 999,
      personal_note: '',
      relevance: 0,
      is_personalized: false,
      created_at: now,
      updated_at: now,
      versions: [{
        id: _nextId,
        principle_id: _nextId - 1,
        content: data.content as string,
        version_number: 1,
        change_note: '初始创建',
        created_at: now,
      }],
    };
    EMBEDDED_PRINCIPLES.push(p);
    return Promise.resolve(p);
  },

  // ---- 更新 ----
  updatePrinciple(id: number, data: Record<string, unknown>): Promise<Principle> {
    const idx = EMBEDDED_PRINCIPLES.findIndex(p => p.id === id);
    if (idx === -1) return Promise.reject(new Error('原则未找到'));
    const p = EMBEDDED_PRINCIPLES[idx];
    if (data.title !== undefined) p.title = data.title as string;
    if (data.content !== undefined) p.content = data.content as string;
    if (data.english_text !== undefined) p.english_text = data.english_text as string;
    if (data.category !== undefined) p.category = data.category as 'work' | 'invest' | 'life';
    if (data.tags !== undefined) p.tags = data.tags as string;
    if (data.theme !== undefined) p.theme = data.theme as string;
    p.updated_at = new Date().toISOString();
    p.version += 1;
    p.versions.push({
      id: _nextId++,
      principle_id: id,
      content: p.content,
      version_number: p.version,
      change_note: (data.change_note as string) || '内容更新',
      created_at: p.updated_at,
    });
    return Promise.resolve({ ...p, versions: p.versions.map(v => ({ ...v })) });
  },

  // ---- 删除/淘汰 ----
  deprecatePrinciple(id: number): Promise<{ message: string }> {
    const p = EMBEDDED_PRINCIPLES.find(x => x.id === id);
    if (!p) return Promise.reject(new Error('原则未找到'));
    p.status = 'deprecated';
    p.updated_at = new Date().toISOString();
    return Promise.resolve({ message: '已淘汰' });
  },

  // ---- 发布 ----
  publishPrinciple(id: number): Promise<{ message: string }> {
    const p = EMBEDDED_PRINCIPLES.find(x => x.id === id);
    if (!p) return Promise.reject(new Error('原则未找到'));
    p.status = 'published';
    p.updated_at = new Date().toISOString();
    return Promise.resolve({ message: '已发布' });
  },

  // ---- 个性化（走 localStorage，这里只是 stub）----
  personalizePrinciple(_id: number, _data: Record<string, unknown>): Promise<{ message: string }> {
    return Promise.resolve({ message: '已保存到本地存储' });
  },

  batchPersonalize(_updates: Record<string, unknown>[]): Promise<{ message: string }> {
    return Promise.resolve({ message: '批量保存成功' });
  },

  // ---- 统计 ----
  getStats(): Promise<Stats> {
    // 计算实时统计（包含本地创建的新原则）
    const all = EMBEDDED_PRINCIPLES;
    const by_category: Record<string, number> = { work: 0, invest: 0, life: 0 };
    const by_status: Record<string, number> = { draft: 0, published: 0, deprecated: 0 };
    const by_source: Record<string, number> = {};
    const by_theme: Record<string, number> = {};
    for (const p of all) {
      by_category[p.category] = (by_category[p.category] || 0) + 1;
      by_status[p.status] = (by_status[p.status] || 0) + 1;
      by_source[p.source] = (by_source[p.source] || 0) + 1;
      if (p.theme) by_theme[p.theme] = (by_theme[p.theme] || 0) + 1;
    }
    return Promise.resolve({
      total: all.length,
      by_category: by_category as Stats['by_category'],
      by_status: by_status as Stats['by_status'],
      by_source,
      by_theme,
      total_versions: all.reduce((s, p) => s + (p.versions?.length || 1), 0),
      personalized_count: 0,
      total_personalized: 0,
    });
  },

  getThemes(): Promise<string[]> {
    const themes = [...new Set(EMBEDDED_PRINCIPLES.map(p => p.theme).filter(Boolean))];
    return Promise.resolve(themes);
  },

  // ---- V1 生成（客户端实现，不需要后端）----
  generateV1(_onlyPersonalized = true): Promise<{ html: string; markdown: string; principle_count: number; categories: Record<string, number> }> {
    return Promise.resolve({
      html: '',
      markdown: '',
      principle_count: 0,
      categories: { work: 0, invest: 0, life: 0 },
    });
  },

  // ---- 导出（这些仍然需要后端，但生成时用客户端替代）----
  getV1Html() { return ''; },
  getExportPdfUrl() { return ''; },
  getExportMarkdownUrl() { return ''; },
  getPdfPreview(): Promise<string> { return Promise.resolve(''); },
  getMarkdownPreview(): Promise<string> { return Promise.resolve(''); },

  // ---- 种子数据（不需要了，已内嵌）----
  seedData(): Promise<{ message: string }> {
    return Promise.resolve({ message: '数据已内嵌，无需导入' });
  },
};

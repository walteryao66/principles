/**
 * 个人原则库 - 本地个性化数据管理
 *
 * 所有个性化数据（评分、备注、自定义内容）存储在浏览器 localStorage 中，
 * 初始原则数据从服务端加载。
 *
 * 数据结构:
 * localStorage key: "principle_personalizations"
 * value: {
 *   [principleId: number]: {
 *     personal_note: string,
 *     relevance: number (0-5),
 *     is_personalized: boolean,
 *     status: 'keep' | 'deprecated' | null,
 *     custom_content: string | null,
 *     updated_at: string (ISO)
 *   }
 * }
 */

import type { Principle, Category } from '../types';

const STORAGE_KEY = 'principle_personalizations';

export interface PersonalizationData {
  personal_note: string;
  relevance: number;
  is_personalized: boolean;
  status: 'keep' | 'deprecated' | null;
  custom_content: string | null;
  updated_at: string;
}

export type PersonalizationMap = Record<number, PersonalizationData>;

/** 读取所有个性化数据 */
export function loadPersonalizations(): PersonalizationMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // 迁移旧数据格式
    if (Array.isArray(parsed)) {
      const map: PersonalizationMap = {};
      for (const item of parsed) {
        if (item.id) map[item.id] = normalizeEntry(item);
      }
      return map;
    }
    return parsed as PersonalizationMap;
  } catch {
    return {};
  }
}

/** 保存所有个性化数据 */
export function savePersonalizations(data: PersonalizationMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** 获取单条原则的个性化数据 */
export function getPersonalization(principleId: number): PersonalizationData | null {
  const all = loadPersonalizations();
  return all[principleId] || null;
}

/** 保存单条原则的个性化数据 */
export function savePersonalization(
  principleId: number,
  data: Partial<PersonalizationData>
): PersonalizationData {
  const all = loadPersonalizations();
  const existing = all[principleId] || createDefault();
  const updated: PersonalizationData = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };
  all[principleId] = updated;
  savePersonalizations(all);
  return updated;
}

/** 批量保存个性化 */
export function batchSavePersonalization(
  updates: Array<{ id: number; data: Partial<PersonalizationData> }>
): void {
  const all = loadPersonalizations();
  const now = new Date().toISOString();
  for (const { id, data } of updates) {
    const existing = all[id] || createDefault();
    all[id] = { ...existing, ...data, updated_at: now };
  }
  savePersonalizations(all);
}

/** 将服务端原则数据与本地个性化数据合并 */
export function mergeWithPersonalization(
  principle: Principle
): Principle {
  const pdata = getPersonalization(principle.id);
  if (!pdata) return principle;

  return {
    ...principle,
    personal_note: pdata.personal_note || '',
    relevance: pdata.relevance || 0,
    is_personalized: pdata.is_personalized || false,
    content: pdata.custom_content || principle.content,
  };
}

/** 批量合并 */
export function mergePrinciples(
  principles: Principle[]
): Principle[] {
  return principles.map(mergeWithPersonalization);
}

/** 获取已定制的原则 ID 集合 */
export function getPersonalizedIds(): Set<number> {
  const all = loadPersonalizations();
  const ids = new Set<number>();
  for (const [idStr, data] of Object.entries(all)) {
    if (data.is_personalized && data.status !== 'deprecated') {
      ids.add(Number(idStr));
    }
  }
  return ids;
}

/** 获取已淘汰的原则 ID 集合 */
export function getDeprecatedIds(): Set<number> {
  const all = loadPersonalizations();
  const ids = new Set<number>();
  for (const [idStr, data] of Object.entries(all)) {
    if (data.status === 'deprecated') {
      ids.add(Number(idStr));
    }
  }
  return ids;
}

/** 统计已定制数量 */
export function getPersonalizedCount(): number {
  return getPersonalizedIds().size;
}

/** 获取已定制 + 已淘汰的总数 */
export function getTouchedCount(): number {
  const all = loadPersonalizations();
  return Object.keys(all).length;
}

/** 导出所有个性化数据（用于备份/迁移） */
export function exportPersonalizations(): string {
  return JSON.stringify(loadPersonalizations(), null, 2);
}

/** 导入个性化数据 */
export function importPersonalizations(json: string): number {
  try {
    const data = JSON.parse(json) as PersonalizationMap;
    savePersonalizations(data);
    return Object.keys(data).length;
  } catch {
    return 0;
  }
}

/** 清除所有个性化数据（慎用） */
export function clearPersonalizations(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** 生成 V1 用的已定制原则列表（过滤掉淘汰的，使用自定义内容） */
export function getV1Principles(
  principles: Principle[],
  minRelevance: number = 1
): Principle[] {
  const deprecatedIds = getDeprecatedIds();
  const all = loadPersonalizations();

  return principles
    .filter((p) => {
      // 排除已淘汰的
      if (deprecatedIds.has(p.id)) return false;
      const pd = all[p.id];
      // 如果已定制且相关度达标，包含
      if (pd?.is_personalized && pd.relevance >= minRelevance) return true;
      // 如果未淘汰且未定制，也包含（用户可能还没处理）
      if (!pd) return true;
      return false;
    })
    .map((p) => mergeWithPersonalization(p));
}

function createDefault(): PersonalizationData {
  return {
    personal_note: '',
    relevance: 0,
    is_personalized: false,
    status: null,
    custom_content: null,
    updated_at: new Date().toISOString(),
  };
}

function normalizeEntry(item: Record<string, unknown>): PersonalizationData {
  return {
    personal_note: String(item.personal_note || ''),
    relevance: Number(item.relevance || 0),
    is_personalized: Boolean(item.is_personalized),
    status: (item.status as 'keep' | 'deprecated' | null) || null,
    custom_content: item.custom_content ? String(item.custom_content) : null,
    updated_at: String(item.updated_at || new Date().toISOString()),
  };
}

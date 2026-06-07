/**
 * Hook: usePersonalizedPrinciples
 *
 * 从服务端加载原则列表，自动与 localStorage 中的个性化数据合并，
 * 返回已合并的原则列表和辅助统计信息。
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api/principles';
import type { Principle } from '../types';
import {
  loadPersonalizations,
  mergeWithPersonalization,
  getPersonalizedCount,
  getTouchedCount,
  getPersonalizedIds,
  getDeprecatedIds,
  getV1Principles,
  type PersonalizationData,
  type PersonalizationMap,
} from '../utils/personalization';

export interface UsePersonalizedPrinciplesReturn {
  /** 合并后的完整原则列表 */
  principles: Principle[];
  /** 仅已定制且非淘汰的原则 */
  personalizedPrinciples: Principle[];
  /** V1 候选原则（定制 + 未处理的） */
  v1Principles: Principle[];
  /** 原始服务端原则 */
  serverPrinciples: Principle[];
  /** 所有个性化数据 */
  personalizations: PersonalizationMap;
  /** 已定制数 */
  personalizedCount: number;
  /** 已处理数（定制+淘汰） */
  touchedCount: number;
  /** 加载状态 */
  loading: boolean;
  /** 错误 */
  error: string;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 强制刷新本地个性化数据 */
  refreshPersonalizations: () => void;
}

export function usePersonalizedPrinciples(
  params?: Record<string, string | boolean | undefined>
): UsePersonalizedPrinciplesReturn {
  const [serverPrinciples, setServerPrinciples] = useState<Principle[]>([]);
  const [personalizations, setPersonalizations] = useState<PersonalizationMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshPersonalizations = useCallback(() => {
    setPersonalizations(loadPersonalizations());
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listPrinciples(params);
      setServerPrinciples(data);
      refreshPersonalizations();
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [params, refreshPersonalizations]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 合并服务端数据与本地个性化数据
  const principles = useMemo(() => {
    return serverPrinciples.map((p) => mergeWithPersonalization(p));
  }, [serverPrinciples, personalizations]);

  const personalizedPrinciples = useMemo(() => {
    const ids = getPersonalizedIds();
    return principles.filter((p) => ids.has(p.id));
  }, [principles]);

  const v1Principles = useMemo(() => {
    return getV1Principles(serverPrinciples);
  }, [serverPrinciples]);

  const personalizedCount = useMemo(() => getPersonalizedCount(), [personalizations]);
  const touchedCount = useMemo(() => getTouchedCount(), [personalizations]);

  return {
    principles,
    personalizedPrinciples,
    v1Principles,
    serverPrinciples,
    personalizations,
    personalizedCount,
    touchedCount,
    loading,
    error,
    refresh: fetchData,
    refreshPersonalizations,
  };
}

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/principles';
import type { Principle, Category } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import {
  loadPersonalizations,
  mergeWithPersonalization,
  getPersonalizedCount,
  getDeprecatedIds,
} from '../utils/personalization';
import { generateV1Client, type V1Result } from '../utils/v1Generator';
import {
  IconDoc,
  IconDownload,
  IconRefresh,
  IconShare,
  IconStar,
  IconEdit,
  IconCheck,
  IconTrash,
  IconLayers,
  IconZap,
  IconDiamond,
  IconEye,
  IconInfo,
  IconChevronRight,
} from '../components/Icons';

const DARK_COLORS: Record<Category, string> = {
  work: '#0a84ff',
  invest: '#30d158',
  life: '#ff9f0a',
};

function StatCard({
  label,
  count,
  color,
  icon,
}: {
  label: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-4 border transition-all duration-300 hover:scale-[1.02]"
      style={{
        backgroundColor: `${color}0A`,
        borderColor: `${color}20`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium tracking-tight" style={{ color }}>
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}18` }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tighter leading-none" style={{ color }}>
        {count}
      </div>
    </div>
  );
}

export default function GenerateV1() {
  const [principles, setPrinciples] = useState<Principle[]>([]);
  const [v1Result, setV1Result] = useState<V1Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [onlyPersonalized, setOnlyPersonalized] = useState(true);
  const [error, setError] = useState('');

  const loadPrinciples = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listPrinciples();
      const allPrinciples: Principle[] = data ?? [];
      setPrinciples(allPrinciples);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '加载失败';
      setError(msg);
      setPrinciples([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrinciples();
  }, [loadPrinciples]);

  const filteredPrinciples = useMemo(() => {
    const deprecatedIds = getDeprecatedIds();
    const personalizations = loadPersonalizations();

    const merged = principles
      .map((p) => {
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

    if (onlyPersonalized) {
      return merged.filter(
        (p) => p.is_personalized && !deprecatedIds.has(p.id) && p.status !== 'deprecated',
      );
    }

    return merged.filter(
      (p) => !deprecatedIds.has(p.id) && p.status !== 'deprecated',
    );
  }, [principles, onlyPersonalized]);

  useEffect(() => {
    if (!loading && filteredPrinciples.length > 0) {
      setGenerating(true);
      const result = generateV1Client(filteredPrinciples);
      setV1Result(result);
      setGenerating(false);
    } else if (!loading && filteredPrinciples.length === 0 && principles.length > 0) {
      setV1Result(null);
    }
  }, [filteredPrinciples, loading, principles.length]);

  const personalizedCount = useMemo(() => getPersonalizedCount(), []);
  const deprecatedCount = useMemo(() => getDeprecatedIds().size, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = { work: 0, invest: 0, life: 0 };
    for (const p of filteredPrinciples) {
      if (p.category in counts) {
        counts[p.category]++;
      }
    }
    return counts;
  }, [filteredPrinciples]);

  const stats = useMemo(() => {
    return [
      { label: '总数', count: filteredPrinciples.length, color: '#98989d', icon: <IconLayers size={14} className="text-[#98989d]" /> },
      { label: CATEGORY_LABELS.work, count: categoryCounts.work, color: DARK_COLORS.work, icon: <IconZap size={14} className="text-[#0a84ff]" /> },
      { label: CATEGORY_LABELS.invest, count: categoryCounts.invest, color: DARK_COLORS.invest, icon: <IconDiamond size={14} className="text-[#30d158]" /> },
      { label: CATEGORY_LABELS.life, count: categoryCounts.life, color: DARK_COLORS.life, icon: <IconEye size={14} className="text-[#ff9f0a]" /> },
      { label: '已定制', count: personalizedCount, color: '#30d158', icon: <IconStar size={14} filled className="text-[#30d158]" /> },
      { label: '已淘汰', count: deprecatedCount, color: '#86868b', icon: <IconTrash size={14} className="text-[#86868b]" /> },
    ];
  }, [filteredPrinciples.length, categoryCounts, personalizedCount, deprecatedCount]);

  const handleRefresh = () => {
    loadPrinciples();
  };

  const handleDownloadPDF = () => {
    if (!v1Result) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(v1Result.html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const handleDownloadMD = () => {
    if (!v1Result) return;
    const blob = new Blob([v1Result.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '个人原则规范_V1.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  // -------- Loading --------
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/[0.08] border-t-[#0a84ff]" />
          <p className="text-[14px] tracking-tight text-[#86868b]">正在加载原则数据...</p>
        </div>
      </div>
    );
  }

  // -------- Error --------
  if (error) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Title */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-[#ff375f]/12 flex items-center justify-center">
              <IconDoc size={18} className="text-[#ff375f]" />
            </div>
            <h1 className="text-xl font-medium tracking-tighter text-[#f5f5f7]">生成个人原则规范</h1>
          </div>
          <p className="text-[14px] tracking-tight text-[#86868b] leading-relaxed ml-12">
            汇总所有已完成个人化定制的原则，生成精美的正式版原则规范文档
          </p>
        </div>

        <div className="bg-[#ff375f]/8 border border-[#ff375f]/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <IconInfo size={18} className="text-[#ff375f] shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-medium tracking-tight text-[#ff375f]">加载失败</p>
              <p className="text-[13px] tracking-tight text-[#98989d] mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] tracking-tight text-[#ff375f] hover:underline"
              >
                <IconRefresh size={13} />
                重试
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------- Empty state --------
  if (!loading && !error && filteredPrinciples.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Title */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-[#ff9f0a]/12 flex items-center justify-center">
              <IconDoc size={18} className="text-[#ff9f0a]" />
            </div>
            <h1 className="text-xl font-medium tracking-tighter text-[#f5f5f7]">生成个人原则规范</h1>
          </div>
          <p className="text-[14px] tracking-tight text-[#86868b] leading-relaxed ml-12">
            汇总所有已完成个人化定制的原则，生成精美的正式版原则规范文档
          </p>
        </div>

        <div className="bg-[#161618] border border-white/[0.06] rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#ff9f0a]/10 flex items-center justify-center mx-auto mb-5">
            <IconEdit size={28} className="text-[#ff9f0a]" />
          </div>
          <p className="text-[15px] font-medium tracking-tight text-[#f5f5f7] mb-2">
            暂无已定制的原则
          </p>
          <p className="text-[13px] tracking-tight text-[#86868b] leading-relaxed mb-6">
            请先去个性化定制页面标记您感兴趣的原则，然后再来生成正式版。
          </p>
          <Link
            to="/customize"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a84ff]/10 text-[#0a84ff] text-[13px] font-medium tracking-tight rounded-xl border border-[#0a84ff]/20 hover:bg-[#0a84ff]/15 transition-all duration-200 active:scale-[0.97]"
          >
            前往定制
            <IconChevronRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ==================== Title ==================== */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#0a84ff]/12 flex items-center justify-center">
            <IconDoc size={18} className="text-[#0a84ff]" />
          </div>
          <h1 className="text-xl font-medium tracking-tighter text-[#f5f5f7]">生成个人原则规范</h1>
        </div>
        <p className="text-[14px] tracking-tight text-[#86868b] leading-relaxed ml-12">
          汇总所有已完成个人化定制的原则，生成精美的正式版原则规范文档
        </p>
      </div>

      {/* ==================== Controls ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={!v1Result}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-[#ff375f] text-[13px] font-medium tracking-tight rounded-xl border border-[#ff375f]/20 hover:bg-[#ff375f]/8 transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconDownload size={15} />
            下载 PDF
          </button>

          <button
            onClick={handleDownloadMD}
            disabled={!v1Result}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-[#86868b] text-[13px] font-medium tracking-tight rounded-xl border border-white/[0.08] hover:bg-white/[0.04] hover:text-[#f5f5f7] transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconShare size={15} />
            下载 Markdown
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-[#86868b] text-[13px] font-medium tracking-tight rounded-xl border border-white/[0.08] hover:bg-white/[0.04] hover:text-[#f5f5f7] transition-all duration-200 active:scale-[0.97] disabled:opacity-40"
          >
            <IconRefresh size={15} />
            刷新预览
          </button>
        </div>

        {/* Custom toggle */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setOnlyPersonalized(!onlyPersonalized)}
            className={`relative inline-flex items-center h-5 w-10 rounded-full transition-colors duration-200 cursor-pointer ${
              onlyPersonalized ? 'bg-[#0a84ff]' : 'bg-white/[0.08]'
            }`}
            role="switch"
            aria-checked={onlyPersonalized}
          >
            <span
              className={`inline-block w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                onlyPersonalized ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="text-[13px] tracking-tight text-[#98989d] select-none">
            仅已定制
          </span>
        </div>
      </div>

      {/* ==================== Stats grid ==================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            count={stat.count}
            color={stat.color}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* ==================== Preview ==================== */}
      {generating && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/[0.08] border-t-[#0a84ff]" />
          <p className="text-[14px] tracking-tight text-[#86868b]">正在生成预览...</p>
        </div>
      )}

      {v1Result && !generating && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <IconDoc size={14} className="text-[#86868b]" />
            <h2 className="text-[15px] font-medium tracking-tight text-[#f5f5f7]">正式版预览</h2>
            {onlyPersonalized && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-tight bg-[#30d158]/12 text-[#30d158] border border-[#30d158]/20">
                <IconCheck size={10} className="inline mr-0.5" />
                仅已定制
              </span>
            )}
          </div>

          <div className="bg-[#161618] border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* macOS title bar */}
            <div className="bg-[#0a0a0c] border-b border-white/[0.06] px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff375f] shrink-0" />
                <div className="w-3 h-3 rounded-full bg-[#ff9f0a] shrink-0" />
                <div className="w-3 h-3 rounded-full bg-[#30d158] shrink-0" />
              </div>
              <span className="text-[11px] tracking-tight text-[#6e6e73] ml-3">
                {v1Result.title} · {v1Result.principleCount} 条原则
              </span>
            </div>
            <iframe
              srcDoc={v1Result.html}
              className="w-full border-0 bg-white"
              style={{ height: '600px' }}
              title="V1 预览"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      )}
    </div>
  );
}

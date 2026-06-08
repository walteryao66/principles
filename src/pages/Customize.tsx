import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../api/principles';
import type { Principle, Category } from '../types';
import { CATEGORY_LABELS } from '../types';
import {
  loadPersonalizations,
  savePersonalization,
  mergeWithPersonalization,
  getPersonalizedCount,
  getTouchedCount,
  type PersonalizationData,
} from '../utils/personalization';
import ThemeBadge from '../components/ThemeBadge';
import CategoryBadge from '../components/CategoryBadge';
import {
  IconBook,
  IconEdit,
  IconStar,
  IconCheck,
  IconTrash,
  IconChevronRight,
  IconDownload,
  IconLayers,
} from '../components/Icons';

type FilterMode = 'all' | 'unpersonalized' | 'personalized' | 'deprecated';

const CATEGORIES: Category[] = ['work', 'invest', 'life', 'constitution'];

const CAT_COLORS: Record<Category, string> = {
  work: '#0a84ff',
  invest: '#30d158',
  life: '#ff9f0a',
  constitution: '#a78bfa',
};

export default function Customize() {
  const [principles, setPrinciples] = useState<Principle[]>([]);
  const [personalizationMap, setPersonalizationMap] = useState<Record<number, PersonalizationData>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [relevance, setRelevance] = useState(0);
  const [personalNote, setPersonalNote] = useState('');
  const [modifiedContent, setModifiedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  // -------- Load principles from server + personalizations from localStorage --------
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (categoryFilter) params.category = categoryFilter;

      const serverPrinciples: Principle[] = await api.listPrinciples(params);
      const localMap = loadPersonalizations();

      const merged = serverPrinciples.map((p) => mergeWithPersonalization(p));
      setPrinciples(merged);
      setPersonalizationMap(localMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -------- Derived: filtered principles --------
  const filteredPrinciples = useMemo(() => {
    return principles.filter((p) => {
      const pd = personalizationMap[p.id];

      switch (filterMode) {
        case 'unpersonalized':
          return !pd || !pd.is_personalized;
        case 'personalized':
          return pd?.is_personalized && pd?.status !== 'deprecated';
        case 'deprecated':
          return pd?.status === 'deprecated';
        default:
          return true;
      }
    });
  }, [principles, personalizationMap, filterMode]);

  // -------- Derived: themes grouped by category --------
  const themesByCategory = useMemo(() => {
    const grouped: Record<Category, string[]> = { work: [], invest: [], life: [], constitution: [] };
    const seen: Record<Category, Set<string>> = {
      work: new Set(),
      invest: new Set(),
      life: new Set(),
      constitution: new Set(),
    };

    principles.forEach((p) => {
      if (p.theme && CATEGORIES.includes(p.category)) {
        seen[p.category].add(p.theme);
      }
    });

    grouped.work = Array.from(seen.work).sort();
    grouped.invest = Array.from(seen.invest).sort();
    grouped.life = Array.from(seen.life).sort();

    return grouped;
  }, [principles]);

  // -------- Progress counts --------
  const countByCategory = useMemo(() => {
    const counts: Record<Category, { total: number; personalized: number }> = {
      work: { total: 0, personalized: 0 },
      invest: { total: 0, personalized: 0 },
      life: { total: 0, personalized: 0 },
      constitution: { total: 0, personalized: 0 },
    };

    principles.forEach((p) => {
      if (CATEGORIES.includes(p.category)) {
        counts[p.category].total++;
        const pd = personalizationMap[p.id];
        if (pd?.is_personalized && pd?.status !== 'deprecated') {
          counts[p.category].personalized++;
        }
      }
    });

    return counts;
  }, [principles, personalizationMap]);

  const overallPersonalized = getPersonalizedCount();
  const overallTouched = getTouchedCount();

  // -------- Select a principle --------
  const selectedPrinciple = useMemo(() => {
    if (selectedId === null) return null;
    return principles.find((p) => p.id === selectedId) || null;
  }, [selectedId, principles]);

  const handleSelectPrinciple = useCallback(
    (id: number) => {
      setSelectedId(id);
      const pd = personalizationMap[id];
      setRelevance(pd?.relevance || 0);
      setPersonalNote(pd?.personal_note || '');
      const principle = principles.find((p) => p.id === id);
      setModifiedContent(pd?.custom_content || principle?.content || '');
      setSaveMessage('');
    },
    [personalizationMap, principles],
  );

  // -------- Save helpers --------
  const persistLocal = useCallback(
    (id: number, data: Partial<PersonalizationData>) => {
      const updated = savePersonalization(id, data);
      setPersonalizationMap((prev) => ({ ...prev, [id]: updated }));
      setPrinciples((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          return {
            ...p,
            personal_note: data.personal_note !== undefined ? (data.personal_note || '') : p.personal_note,
            relevance: data.relevance !== undefined ? data.relevance : p.relevance,
            is_personalized: data.is_personalized !== undefined ? data.is_personalized : p.is_personalized,
            content: data.custom_content || p.content,
          };
        }),
      );
      return updated;
    },
    [],
  );

  // -------- Star rating (click = immediate save) --------
  const handleStarClick = useCallback(
    (star: number) => {
      if (!selectedId) return;
      setRelevance(star);
      persistLocal(selectedId, { relevance: star });
    },
    [selectedId, persistLocal],
  );

  // -------- Note onBlur save --------
  const handleNoteBlur = useCallback(() => {
    if (!selectedId) return;
    persistLocal(selectedId, { personal_note: personalNote });
  }, [selectedId, personalNote, persistLocal]);

  // -------- Content onBlur save --------
  const handleContentBlur = useCallback(() => {
    if (!selectedId) return;
    const principle = principles.find((p) => p.id === selectedId);
    const customContent = modifiedContent !== principle?.content ? modifiedContent : null;
    persistLocal(selectedId, { custom_content: customContent });
  }, [selectedId, modifiedContent, principles, persistLocal]);

  // -------- Buttons --------
  const handleKeep = useCallback(() => {
    if (!selectedId) return;
    persistLocal(selectedId, {
      is_personalized: true,
      status: 'keep',
      personal_note: personalNote,
      relevance,
    });
    setSaveMessage('已保留，标记为已定制');
  }, [selectedId, personalNote, relevance, persistLocal]);

  const handleStash = useCallback(() => {
    if (!selectedId) return;
    const principle = principles.find((p) => p.id === selectedId);
    const customContent = modifiedContent !== principle?.content ? modifiedContent : null;
    persistLocal(selectedId, {
      personal_note: personalNote,
      relevance,
      custom_content: customContent,
    });
    setSaveMessage('已保存定制内容');
  }, [selectedId, personalNote, relevance, modifiedContent, principles, persistLocal]);

  const handleDeprecate = useCallback(() => {
    if (!selectedId || !selectedPrinciple) return;
    if (!confirm(`确定淘汰原则「${selectedPrinciple.title}」吗？淘汰后标记为已淘汰。`)) return;
    persistLocal(selectedId, { status: 'deprecated' });
    setSaveMessage('已淘汰');
  }, [selectedId, selectedPrinciple, persistLocal]);

  // -------- Filter handlers --------
  const handleCategoryClick = useCallback(
    (cat: Category) => {
      setCategoryFilter((prev) => (prev === cat ? '' : cat));
      setSelectedId(null);
      setSaveMessage('');
    },
    [],
  );

  const handleFilterModeChange = useCallback((mode: FilterMode) => {
    setFilterMode(mode);
    setSelectedId(null);
    setSaveMessage('');
  }, []);

  const selectedPersonalization = selectedId !== null ? personalizationMap[selectedId] : null;

  // -------- Render: star rating with SVG IconStar --------
  const renderStars = (rating: number, interactive: boolean) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= rating;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && handleStarClick(star)}
              className={`transition-all duration-150 ${
                interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
              }`}
            >
              <IconStar
                size={16}
                filled={filled}
                className={`${filled ? 'text-[#ff9f0a]' : 'text-[#48484d]'} ${
                  interactive && !filled ? 'hover:text-[#ff9f0a]/50' : ''
                }`}
              />
            </button>
          );
        })}
        {interactive && rating > 0 && (
          <span className="ml-2 text-[11px] tracking-tight text-[#6e6e73]">
            {rating >= 4 ? '非常相关' : rating >= 3 ? '相关' : rating >= 2 ? '部分相关' : '不太相关'}
          </span>
        )}
      </div>
    );
  };

  // -------- Loading state --------
  if (loading && principles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/[0.08] border-t-[#0a84ff]" />
      </div>
    );
  }

  // -------- Main layout --------
  return (
    <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-5rem)]">
      {/* ==================== LEFT SIDEBAR (w-56) ==================== */}
      <div className="w-full lg:w-56 shrink-0 bg-[#0a0a0c] border border-white/[0.06] rounded-2xl p-5 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <IconLayers size={14} className="text-[#6e6e73]" />
          <h3 className="text-[12px] text-[#6e6e73] uppercase tracking-wider">分类</h3>
        </div>

        {/* Quick filters */}
        <div className="mb-5">
          <h4 className="text-[10px] text-[#6e6e73] uppercase tracking-wider mb-2">筛选</h4>
          <div className="flex flex-wrap gap-1.5">
            {([
              { value: 'all', label: '全部' },
              { value: 'unpersonalized', label: '未定制' },
              { value: 'personalized', label: '已定制' },
              { value: 'deprecated', label: '已淘汰' },
            ] as const).map((f) => (
              <button
                key={f.value}
                onClick={() => handleFilterModeChange(f.value)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium tracking-tight transition-all duration-200 active:scale-[0.97] ${
                  filterMode === f.value
                    ? 'bg-[#0a84ff] text-white'
                    : 'bg-white/[0.04] text-[#86868b] hover:bg-white/[0.08] hover:text-[#98989d]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories with theme sub-nav */}
        {CATEGORIES.map((cat) => {
          const isActive = categoryFilter === cat;
          const catThemes = themesByCategory[cat];
          const counts = countByCategory[cat];
          const color = CAT_COLORS[cat];

          return (
            <div key={cat} className="mb-4">
              {/* Category header */}
              <button
                onClick={() => handleCategoryClick(cat)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium tracking-tight transition-all duration-200 active:scale-[0.97]"
                style={{
                  backgroundColor: isActive ? `${color}10` : 'transparent',
                  color: isActive ? color : '#98989d',
                }}
              >
                <span>{CATEGORY_LABELS[cat]}</span>
                <span className="text-[10px] tracking-tight" style={{ color: isActive ? color : '#6e6e73' }}>
                  {counts.personalized}/{counts.total}
                </span>
              </button>

              {/* Progress bar for active category */}
              {isActive && counts.total > 0 && (
                <div className="px-3 mt-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: color,
                          width: `${Math.round((counts.personalized / counts.total) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] tracking-tight text-[#6e6e73]">
                      {Math.round((counts.personalized / counts.total) * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Theme sub-navigation */}
              {catThemes.length > 0 && (
                <div className="ml-2 mt-1 space-y-0.5">
                  {catThemes.map((theme) => (
                    <button
                      key={theme}
                      onClick={() => {
                        setCategoryFilter(cat);
                        setSelectedId(null);
                        setSaveMessage('');
                      }}
                      className="w-full text-left px-3 py-1.5 rounded text-[11px] tracking-tight transition-all duration-150 text-[#6e6e73] hover:text-[#98989d] hover:bg-white/[0.03]"
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Overall progress */}
        <div className="mt-5 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <IconDownload size={12} className="text-[#6e6e73]" />
            <h4 className="text-[10px] text-[#6e6e73] uppercase tracking-wider">总体进度</h4>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0a84ff] rounded-full transition-all duration-500"
                style={{
                  width: `${principles.length > 0 ? Math.round((overallPersonalized / principles.length) * 100) : 0}%`,
                }}
              />
            </div>
            <span className="text-[11px] tracking-tight text-[#86868b] whitespace-nowrap">
              {overallPersonalized}/{principles.length}
            </span>
          </div>
          <div className="text-[11px] tracking-tight text-[#6e6e73]">
            已处理 {overallTouched} 条
          </div>
        </div>
      </div>

      {/* ==================== CENTER - PRINCIPLES LIST (flex-1) ==================== */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {filteredPrinciples.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#161618] rounded-2xl border border-white/[0.06]">
            <IconBook size={40} className="text-[#48484d] mb-4" />
            <p className="text-[14px] tracking-tight text-[#98989d] mb-1">暂无匹配的原则</p>
            <p className="text-[12px] tracking-tight text-[#6e6e73]">请调整筛选条件或先导入原则数据</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPrinciples.map((p) => {
              const pd = personalizationMap[p.id];
              const isSelected = selectedId === p.id;
              const isPersonalized = pd?.is_personalized && pd?.status !== 'deprecated';
              const isDeprecated = pd?.status === 'deprecated';

              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPrinciple(p.id)}
                  className={`w-full text-left rounded-2xl p-5 transition-all duration-200 group ${
                    isDeprecated ? 'opacity-40' : ''
                  } ${
                    isSelected
                      ? 'bg-[#1c1c1f] border border-white/[0.1] border-l-2 border-l-[#0a84ff]'
                      : isPersonalized
                        ? 'bg-[#161618] border border-white/[0.06] border-l-2 border-l-[#30d158] hover:bg-[#1c1c1f] hover:border-white/[0.1]'
                        : 'bg-[#161618] border border-white/[0.06] hover:bg-[#1c1c1f] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2 flex-wrap">
                    <IconBook size={14} className="text-[#48484d] mt-0.5" />
                    {p.theme && (
                      <ThemeBadge theme={p.theme} category={p.category} size="sm" />
                    )}
                    <CategoryBadge category={p.category} />
                    {isPersonalized && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium tracking-tight bg-[#30d158]/15 text-[#30d158]">
                        <IconCheck size={10} className="mr-0.5" />
                        已定制
                      </span>
                    )}
                    {isDeprecated && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium tracking-tight bg-white/[0.04] text-[#86868b]">
                        <IconTrash size={10} className="mr-0.5" />
                        已淘汰
                      </span>
                    )}
                  </div>

                  <h4
                    className={`text-[14px] font-medium tracking-tight text-[#f5f5f7] mb-1.5 group-hover:text-white transition-colors ${
                      isDeprecated ? 'line-through' : ''
                    }`}
                  >
                    {p.title}
                  </h4>

                  {p.english_text && (
                    <blockquote
                      className={`border-l-2 border-white/[0.08] pl-3 my-1.5 text-[12px] text-[#98989d] italic tracking-tight leading-relaxed line-clamp-2 ${
                        isDeprecated ? 'line-through' : ''
                      }`}
                    >
                      {p.english_text}
                    </blockquote>
                  )}

                  <p
                    className={`text-[12px] tracking-tight text-[#86868b] leading-relaxed line-clamp-3 mb-1.5 ${
                      isDeprecated ? 'line-through' : ''
                    }`}
                  >
                    {p.content}
                  </p>

                  {/* Star rating from localStorage */}
                  {isPersonalized && pd && pd.relevance > 0 && (
                    <div className="mt-2 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <IconStar
                          key={i}
                          size={11}
                          filled={i < pd.relevance}
                          className={i < pd.relevance ? 'text-[#ff9f0a]' : 'text-[#48484d]'}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== RIGHT PANEL - CUSTOMIZATION (w-80) ==================== */}
      <div className="w-full lg:w-80 shrink-0 bg-[#161618] border border-white/[0.06] rounded-2xl p-6 overflow-y-auto">
        {!selectedPrinciple ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
              <IconEdit size={22} className="text-[#48484d]" />
            </div>
            <p className="text-[14px] tracking-tight text-[#98989d] mb-1">选定一条原则</p>
            <p className="text-[12px] tracking-tight text-[#6e6e73]">开始个性化定制</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <IconBook size={14} className="text-[#48484d]" />
                {selectedPrinciple.theme && (
                  <ThemeBadge theme={selectedPrinciple.theme} category={selectedPrinciple.category} size="sm" />
                )}
                <CategoryBadge category={selectedPrinciple.category} />
                {selectedPersonalization?.is_personalized &&
                  selectedPersonalization?.status !== 'deprecated' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium tracking-tight bg-[#30d158]/15 text-[#30d158]">
                      <IconCheck size={10} className="mr-0.5" />
                      已定制
                    </span>
                  )}
              </div>
              <h3 className="text-[15px] font-medium tracking-tight text-[#f5f5f7] leading-relaxed mb-2">
                {selectedPrinciple.title}
              </h3>

              {selectedPrinciple.english_text && (
                <blockquote className="border-l-2 border-white/[0.08] pl-3 my-2 text-[12px] text-[#98989d] italic tracking-tight leading-relaxed">
                  {selectedPrinciple.english_text}
                </blockquote>
              )}

              <p className="text-[13px] tracking-tight text-[#98989d] leading-relaxed mb-2">
                {selectedPrinciple.content}
              </p>

              <div className="flex items-center gap-2 text-[11px] tracking-tight text-[#6e6e73]">
                <span>来源：{selectedPrinciple.source || '-'}</span>
                {selectedPrinciple.version > 0 && (
                  <>
                    <span className="text-white/[0.1]">·</span>
                    <span>v{selectedPrinciple.version}</span>
                  </>
                )}
              </div>
            </div>

            <hr className="border-white/[0.06]" />

            {/* Relevance rating */}
            <div>
              <label className="block text-[10px] tracking-wider text-[#6e6e73] uppercase mb-2">
                相关度评分
              </label>
              {renderStars(relevance, true)}
            </div>

            {/* Personal note */}
            <div>
              <label className="block text-[10px] tracking-wider text-[#6e6e73] uppercase mb-2">
                个人备注
              </label>
              <textarea
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                onBlur={handleNoteBlur}
                placeholder="添加你的个人理解..."
                rows={3}
                className="w-full px-4 py-3 bg-[#121215] border border-white/[0.08] rounded-xl text-[13px] tracking-tight text-[#f5f5f7] placeholder:text-[#6e6e73] focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff]/20 outline-none transition-all duration-200 resize-none leading-relaxed"
              />
            </div>

            {/* Custom content */}
            <div>
              <label className="block text-[10px] tracking-wider text-[#6e6e73] uppercase mb-2">
                内容修改
              </label>
              <textarea
                value={modifiedContent}
                onChange={(e) => setModifiedContent(e.target.value)}
                onBlur={handleContentBlur}
                placeholder="修改原则内容..."
                rows={4}
                className="w-full px-4 py-3 bg-[#121215] border border-white/[0.08] rounded-xl text-[13px] tracking-tight text-[#f5f5f7] placeholder:text-[#6e6e73] focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff]/20 outline-none transition-all duration-200 resize-none leading-relaxed"
              />
              {modifiedContent !== selectedPrinciple.content && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <IconEdit size={12} className="text-[#ff9f0a]" />
                  <p className="text-[11px] tracking-tight text-[#ff9f0a]">内容已修改，将保存为定制版本</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              <button
                onClick={handleKeep}
                disabled={selectedPersonalization?.status === 'deprecated'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#30d158]/10 text-[#30d158] text-[13px] font-medium tracking-tight rounded-xl border border-[#30d158]/20 hover:bg-[#30d158]/15 transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <IconCheck size={15} />
                保留
              </button>

              <button
                onClick={handleStash}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0a84ff]/10 text-[#0a84ff] text-[13px] font-medium tracking-tight rounded-xl border border-[#0a84ff]/20 hover:bg-[#0a84ff]/15 transition-all duration-200 active:scale-[0.97]"
              >
                <IconDownload size={15} />
                暂存
              </button>

              <button
                onClick={handleDeprecate}
                disabled={selectedPersonalization?.status === 'deprecated'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[#ff375f] text-[13px] font-medium tracking-tight rounded-xl border border-[#ff375f]/20 hover:bg-[#ff375f]/8 transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <IconTrash size={15} />
                淘汰
              </button>
            </div>

            {/* Status messages */}
            {saveMessage && (
              <div
                className={`flex items-center gap-2 text-[13px] tracking-tight rounded-xl p-3 ${
                  saveMessage.includes('失败')
                    ? 'bg-[#ff375f]/8 border border-[#ff375f]/20 text-[#ff375f]'
                    : 'bg-[#30d158]/8 border border-[#30d158]/20 text-[#30d158]'
                }`}
              >
                <IconCheck size={14} />
                {saveMessage}
              </div>
            )}

            {selectedPersonalization?.is_personalized &&
              selectedPersonalization?.status !== 'deprecated' &&
              !saveMessage && (
                <div className="flex items-center gap-2 bg-[#30d158]/8 border border-[#30d158]/20 text-[#30d158] text-[13px] tracking-tight rounded-xl p-3">
                  <IconCheck size={14} />
                  此原则已定制完成
                  {selectedPersonalization?.relevance > 0 &&
                    ` (${selectedPersonalization.relevance} 星)`}
                </div>
              )}

            {selectedPersonalization?.status === 'deprecated' && (
              <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] text-[#86868b] text-[13px] tracking-tight rounded-xl p-3">
                <IconTrash size={14} />
                此原则已淘汰
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

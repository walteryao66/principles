export type Category = 'work' | 'invest' | 'life';
export type Status = 'draft' | 'published' | 'deprecated';

export interface PrincipleVersion {
  id: number;
  principle_id: number;
  content: string;
  version_number: number;
  change_note: string;
  created_at: string;
}

export interface Principle {
  id: number;
  title: string;
  content: string;
  english_text: string;
  category: Category;
  source: string;
  tags: string;
  theme: string;
  status: Status;
  version: number;
  sort_order: number;
  personal_note: string;
  relevance: number;
  is_personalized: boolean;
  created_at: string;
  updated_at: string;
  versions: PrincipleVersion[];
}

export interface PrincipleCreate {
  title: string;
  content: string;
  english_text?: string;
  category: Category;
  source?: string;
  tags?: string;
  theme?: string;
  sort_order?: number;
}

export interface PrincipleUpdate {
  title?: string;
  content?: string;
  english_text?: string;
  category?: Category;
  source?: string;
  tags?: string;
  theme?: string;
  change_note?: string;
}

export interface PrinciplePersonalize {
  personal_note?: string;
  relevance?: number;
  is_personalized?: boolean;
  content?: string;
}

export interface Stats {
  total: number;
  by_category: Record<Category, number>;
  by_status: Record<Status, number>;
  by_source: Record<string, number>;
  by_theme: Record<string, number>;
  total_versions: number;
  personalized_count: number;
  total_personalized: number;
}

export interface GenerateV1Response {
  html: string;
  markdown: string;
  principle_count: number;
  categories: Record<Category, number>;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  work: '工作原则',
  invest: '投资原则',
  life: '生活原则',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  work: '#2563eb',
  invest: '#059669',
  life: '#d97706',
};

export const CATEGORY_BG: Record<Category, string> = {
  work: '#eff6ff',
  invest: '#ecfdf5',
  life: '#fffbeb',
};

export const CATEGORY_BORDER: Record<Category, string> = {
  work: '#bfdbfe',
  invest: '#a7f3d0',
  life: '#fde68a',
};

export const STATUS_LABELS: Record<Status, string> = {
  draft: '草稿',
  published: '已发布',
  deprecated: '已汰换',
};

// ============================================================
// V2: 决策 & 复盘系统
// ============================================================

export type Effectiveness = 'effective' | 'partial' | 'ineffective';

export const EFFECTIVENESS_LABELS: Record<Effectiveness, string> = {
  effective: '✅ 有效',
  partial: '⚠️ 部分有效',
  ineffective: '❌ 无效',
};

export const EFFECTIVENESS_COLORS: Record<Effectiveness, string> = {
  effective: '#30d158',
  partial: '#ff9f0a',
  ineffective: '#ff375f',
};

/** 一条决策记录 */
export interface Decision {
  id: string;
  context: string;            // 决策背景
  linked_principle_ids: number[]; // 关联的原则ID
  decision_made: string;      // 做出的决定
  expected_outcome: string;   // 预期结果
  created_at: string;
}

/** 一条复盘记录（关联到决策） */
export interface Review {
  decision_id: string;
  actual_outcome: string;     // 实际结果
  effectiveness: Effectiveness | ''; // 原则有效性
  reflection: string;         // 反思笔记
  reviewed_at: string;
}

/** 合并后的决策+复盘视图 */
export interface DecisionWithReview {
  decision: Decision;
  review: Review | null;
}

/** 原则推荐结果 */
export interface PrincipleRecommendation {
  principle_id: number;
  title: string;
  category: Category;
  theme: string;
  match_score: number;        // 0-100 匹配度
  match_reason: string;       // 匹配原因
}

/** 原则反馈统计 */
export interface PrincipleFeedback {
  total_decisions: number;
  effective_count: number;
  partial_count: number;
  ineffective_count: number;
  decisions: DecisionWithReview[];
}

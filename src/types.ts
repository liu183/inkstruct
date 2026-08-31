// ============ 领域模型 ============

import type { AxisSelections, SeedAxes } from './data/genreProfiles';

export type { AxisSelections, SeedAxes };

export type SceneStatus = 'idea' | 'draft' | 'writing' | 'revising' | 'done';

export const SCENE_STATUS_META: Record<SceneStatus, { label: string; color: string; dot: string }> = {
  idea:     { label: '灵感', color: 'text-slate-400',     dot: 'bg-slate-400' },
  draft:    { label: '草稿', color: 'text-sky-400',       dot: 'bg-sky-400' },
  writing:  { label: '写作中', color: 'text-amber-400',   dot: 'bg-amber-400' },
  revising: { label: '修改中', color: 'text-fuchsia-400', dot: 'bg-fuchsia-400' },
  done:     { label: '已完成', color: 'text-emerald-400', dot: 'bg-emerald-400' },
};

export interface Beat {
  id: string;
  summary: string;
}

export interface Scene {
  id: string;
  chapterId: string;
  title: string;
  order: number;
  pov: string;          // 视角角色
  location: string;     // 地点
  timeline: string;     // 时间线
  mood: string;         // 情绪基调
  status: SceneStatus;
  labels: string[];
  beats: Beat[];
  summary: string;
  content: string;
  wordCount: number;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  summary: string;
  status: SceneStatus;
  scenes: Scene[];
}

export type CodexType = 'character' | 'location' | 'item' | 'event' | 'faction' | 'lore' | 'storyline';

export const CODEX_TYPE_META: Record<CodexType, { label: string; color: string; desc: string }> = {
  character: { label: '角色', color: '#a78bfa', desc: '人物档案,记录身份、目标与关系网' },
  location:  { label: '地点', color: '#34d399', desc: '场景设定,构建可信的空间世界' },
  item:      { label: '物品', color: '#fbbf24', desc: '法宝道具,明确来源与限制' },
  event:     { label: '事件', color: '#f472b6', desc: '历史与主线事件,串联因果' },
  faction:   { label: '势力', color: '#60a5fa', desc: '组织阵营,锚定利益格局' },
  lore:      { label: '世界观', color: '#f87171', desc: '规则与历史,保证设定自洽' },
  storyline: { label: '故事线', color: '#22d3ee', desc: '主线、感情线、支线与暗线的走向节点' },
};

/** 故事线类别:区分主线/感情线/支线等不同类型的剧情推进 */
export const STORYLINE_CATEGORIES = ['主线', '感情线', '支线', '暗线', '成长线', '复仇线', '事业线'] as const;
export type StorylineCategory = (typeof STORYLINE_CATEGORIES)[number];

/** 故事线进度 */
export const STORYLINE_STATUSES = ['构思中', '进行中', '已收束', '已完结', '暂停'] as const;
export type StorylineStatus = (typeof STORYLINE_STATUSES)[number];

// ============ Codex 类型化字段模板 ============

export type CodexFieldValue = string | number | string[];

export type CodexFieldType = 'text' | 'textarea' | 'tags' | 'number' | 'select' | 'ref';

export interface CodexFieldDef {
  /** 字段唯一标识 */
  id: string;
  label: string;
  type: CodexFieldType;
  placeholder?: string;
  /** select 选项 */
  options?: string[];
  /** ref 可引用的档案类型(缺省 = 全部类型) */
  refTypes?: CodexType[];
  /** ref 是否多选 */
  multi?: boolean;
  /** 占满整行 */
  full?: boolean;
}

export interface CodexEntry {
  id: string;
  type: CodexType;
  name: string;
  title?: string;
  summary: string;
  details: string;
  tags: string[];
  /** 按类型模板存储的结构化字段 */
  fields: Record<string, CodexFieldValue>;
  /** 由 ref 字段自动汇总的关联档案 id */
  relatedIds: string[];
  /** 参考图(dataURL):作为头像与封面展示,角色/地点/物品均可配图 */
  image?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  title: string;
  author: string;
  genre: string;
  logline: string;
  chapters: Chapter[];
  codex: CodexEntry[];
  /** 灵感池:收藏的灵感卡片 */
  inspirationCards: InspirationCard[];
  /** 灵感助手配置 */
  inspirationConfig: InspirationConfig;
}

// ============ AI 灵感助手 ============

export type InspirationType = 'plot' | 'character' | 'twist' | 'world' | 'goldfinger' | 'title';

export const INSPIRATION_TYPE_META: Record<
  InspirationType,
  { label: string; color: string; desc: string }
> = {
  plot:       { label: '情节脑洞', color: '#a78bfa', desc: '冲突、转折、钩子与支线点子' },
  character:  { label: '人物火花', color: '#f472b6', desc: '人设、弧光、关系与秘密' },
  twist:      { label: '反转伏笔', color: '#fbbf24', desc: '意料之外的真相与身份反转' },
  world:      { label: '世界观',   color: '#34d399', desc: '规则、组织、秘境与历史' },
  goldfinger: { label: '金手指',   color: '#60a5fa', desc: '能力、系统、宝物与成长机制' },
  title:      { label: '标题文案', color: '#f87171', desc: '书名、卷名与章节名灵感' },
};

/** 灵感方向(风格标签) */
export const INSPIRATION_DIRECTIONS = ['爽点', '虐心', '悬疑', '反转', '治愈', '热血', '黑暗', '沙雕'] as const;
export type InspirationDirection = (typeof INSPIRATION_DIRECTIONS)[number];

/** 题材维度:限制灵感落在哪个类型的作品上 */
export const INSPIRATION_GENRES = [
  '仙侠玄幻', '都市异能', '科幻末世', '历史架空', '悬疑惊悚', '情感虐恋', '热血争霸', '轻松日常', '暗黑权谋', '游戏系统',
] as const;
export type InspirationGenre = (typeof INSPIRATION_GENRES)[number];

/** 卡片来源:AI 生成 / 作者手记 */
export type InspirationSource = 'ai' | 'manual';

export interface InspirationCard {
  id: string;
  type: InspirationType;
  /** 所属题材(种子自带,手记可不填) */
  genre?: InspirationGenre;
  title: string;
  /** 一句话钩子 */
  hook: string;
  /** 展开提示 */
  tips: string[];
  tags: string[];
  /** 关联的 Codex 档案名(联动时生成) */
  codexRefs?: string[];
  /** 该卡片的题材轴标注(种子卡片自带,手记可不填) */
  axes?: SeedAxes;
  /** 故事弧位置(种子卡片自带,五张卡拼成一段弧) */
  arcRole?: ArcRole;
  /** 主角标签(种子卡片自带,如"废柴逆袭者"/"觉醒者") */
  protagonist?: ProtagonistTag;
  /** 冲突核心(种子卡片自带,一句话说清矛盾) */
  conflict?: ConflictCore;
  /** 第一幕动作(种子卡片自带,可直接作为开篇场景) */
  openAction?: OpeningAction;
  /** 卡片来源 */
  source: InspirationSource;
  createdAt: number;
}

/** 故事弧位置:5 张卡片 = 一段故事弧
 * 开局(钩子/导火索) → 发展(人物/关系) → 转折(反转/伏笔) → 高潮(冲突爆点) → 终局(基调/标题)
 */
export type ArcRole = 'opening' | 'rising' | 'turn' | 'climax' | 'resolve';

export const ARC_ROLE_META: Record<ArcRole, { label: string; color: string; desc: string }> = {
  opening: { label: '开局',     color: '#a78bfa', desc: '把读者拽进来的第一个画面' },
  rising:  { label: '发展',     color: '#f472b6', desc: '人物登场、关系建立、世界铺开' },
  turn:    { label: '转折',     color: '#fbbf24', desc: '认知反转、立场错位、伏笔揭晓' },
  climax:  { label: '高潮',     color: '#f87171', desc: '矛盾爆点、命悬一线、关键抉择' },
  resolve: { label: '终局基调', color: '#34d399', desc: '留下余味的名字与调性' },
};

/** 主角标签:给作者一个"是谁"的可视化锚点 */
export type ProtagonistTag = string;

/** 冲突核心:一句话说清矛盾 */
export type ConflictCore = string;

/** 第一幕动作:开篇可写的具体场景 */
export type OpeningAction = string;

export interface InspirationConfig {
  /** 每次抽卡数量 */
  count: 3 | 5 | 8;
  /** 灵感方向/风格(多选,空 = 全方向) */
  directions: InspirationDirection[];
  /** 题材限定(多选,空 = 不限题材,用于抽卡与定向) */
  genres: InspirationGenre[];
  /** 题材轴细化:每个被选题材下各轴的取值(空 = 通配该轴) */
  axisSelections: AxisSelections;
  /** 脑洞程度 1 克制 / 2 平衡 / 3 放飞 */
  wildness: 1 | 2 | 3;
  /** 生成时融入 Codex 档案名,让灵感贴合作品 */
  codexLinked: boolean;
  /** 写作时自动弹出灵感提示 */
  ambientEnabled: boolean;
  /** 自动灵感频率 */
  ambientFrequency: 'low' | 'medium' | 'high';
  /** 卡片是否默认展开提示 */
  showTips: boolean;
}

export const DEFAULT_INSPIRATION_CONFIG: InspirationConfig = {
  count: 5,
  directions: [],
  genres: [],
  axisSelections: {},
  wildness: 2,
  codexLinked: true,
  ambientEnabled: true,
  ambientFrequency: 'medium',
  showTips: true,
};

// ============ 命令模型 ============

export type CommandCategory = 'ai-generate' | 'ai-edit' | 'structure' | 'codex' | 'view';

export interface SlashCommand {
  id: string;
  keyword: string;
  label: string;
  description: string;
  category: CommandCategory;
  icon: string;
  shortcut?: string;
}

// ============ 视图模式 ============

export type PlanViewMode = 'grid' | 'matrix' | 'outline';
export type Workspace = 'plan' | 'write' | 'codex' | 'inspiration';

import type { SlashCommand } from '../types';

/**
 * 编辑器 / 命令面板注册表
 * 分类:ai-generate(AI 生成) / ai-edit(AI 编辑) / structure(结构) / codex(档案) / view(视图)
 */
export const SLASH_COMMANDS: SlashCommand[] = [
  // -------- AI 生成 --------
  { id: 'ai-continue',    keyword: 'continue',    label: '续写',     description: '基于当前内容继续往下写',        category: 'ai-generate', icon: 'pen',       shortcut: '⌘J' },
  { id: 'ai-generate',    keyword: 'generate',    label: '生成',     description: '根据场景描述生成一段正文',       category: 'ai-generate', icon: 'sparkles' },
  { id: 'ai-dialogue',    keyword: 'dialogue',    label: '对话',     description: '生成角色对话',                   category: 'ai-generate', icon: 'message' },
  { id: 'ai-describe',    keyword: 'describe',    label: '描写',     description: '生成场景/环境/战斗描写',         category: 'ai-generate', icon: 'eye' },
  { id: 'ai-brainstorm',  keyword: 'brainstorm',  label: '头脑风暴', description: '生成情节走向与创意点子',           category: 'ai-generate', icon: 'lightbulb' },
  { id: 'ai-beat',        keyword: 'beat',        label: '节拍',     description: '生成场景节拍大纲',               category: 'ai-generate', icon: 'list' },
  // -------- AI 编辑 --------
  { id: 'ai-polish',      keyword: 'polish',      label: '润色',     description: '打磨文笔,提升表现力',           category: 'ai-edit', icon: 'wand' },
  { id: 'ai-expand',      keyword: 'expand',      label: '扩写',     description: '扩写当前段落,补充细节',          category: 'ai-edit', icon: 'maximize' },
  { id: 'ai-condense',    keyword: 'condense',    label: '压缩',     description: '精简冗余,加快节奏',             category: 'ai-edit', icon: 'minimize' },
  { id: 'ai-rewrite',     keyword: 'rewrite',     label: '改写',     description: '换个风格重写选中内容',           category: 'ai-edit', icon: 'refresh' },
  { id: 'ai-summarize',   keyword: 'summarize',   label: '总结',     description: '概括场景要点更新到摘要',         category: 'ai-edit', icon: 'file-text' },
  // -------- 结构 --------
  { id: 'struct-h1',      keyword: 'h1',          label: '标题',     description: '插入场景标题',                   category: 'structure', icon: 'heading' },
  { id: 'struct-hr',      keyword: 'hr',          label: '分隔线',   description: '插入场景分隔符',                 category: 'structure', icon: 'minus' },
  { id: 'struct-todo',    keyword: 'todo',        label: '待办',     description: '插入创作待办',                   category: 'structure', icon: 'check-square' },
  // -------- Codex --------
  { id: 'codex-character', keyword: 'character',  label: '角色',     description: '插入角色档案引用',               category: 'codex', icon: 'user' },
  { id: 'codex-location',  keyword: 'location',   label: '地点',     description: '插入地点档案引用',               category: 'codex', icon: 'map' },
  { id: 'codex-item',      keyword: 'item',       label: '物品',     description: '插入物品档案引用',               category: 'codex', icon: 'package' },
  // -------- 视图 --------
  { id: 'view-focus',     keyword: 'focus',       label: '专注模式', description: '隐藏面板,沉浸式写作',            category: 'view', icon: 'focus', shortcut: '⌘⇧F' },
];

import type { CodexFieldDef, CodexFieldValue, CodexType } from '../types';

/**
 * 六类档案的专业字段模板:
 * 每种类型拥有专属结构字段(如角色有目标/动机/关系,地点有环境/居民),
 * 与 NovelCrafter 等专业创作工具保持一致。
 */
export const CODEX_TEMPLATES: Record<CodexType, CodexFieldDef[]> = {
  character: [
    { id: 'alias',     label: '别名 / 称号', type: 'tags', placeholder: '回车添加别名,如:小沈、剑主' },
    { id: 'gender',    label: '性别',     type: 'select', options: ['男', '女', '无', '未知'] },
    { id: 'age',       label: '年龄',     type: 'text', placeholder: '如:24 / 十六岁 / 活了三百岁' },
    { id: 'realm',     label: '境界 / 修为', type: 'select', options: ['凡人', '炼气', '筑基', '金丹', '元婴', '化神', '渡劫', '大乘', '未知'] },
    { id: 'identity',  label: '身份 / 职业', type: 'text', placeholder: '青云宗杂役弟子' },
    { id: 'appearance', label: '外貌描写', type: 'textarea', placeholder: '身材、面容、衣着、标志性特征…' },
    { id: 'personality', label: '性格',    type: 'textarea', placeholder: '核心性格、行为习惯、说话方式…' },
    { id: 'goal',      label: '目标',     type: 'textarea', placeholder: '短期目标 / 长期目标' },
    { id: 'motivation', label: '动机',    type: 'textarea', placeholder: 'ta 为什么追求这个目标?埋藏的原动力' },
    { id: 'background', label: '背景故事', type: 'textarea', placeholder: '出身、关键经历、创伤与转折…' },
    { id: 'abilities', label: '能力 / 功法', type: 'tags', placeholder: '如:无名古剑、御剑术、商业思维' },
    { id: 'weakness',  label: '弱点 / 软肋', type: 'textarea', placeholder: '性格缺陷、修为短板、在意的人…' },
    { id: 'faction',   label: '所属势力', type: 'ref', refTypes: ['faction'], placeholder: '选择所属势力' },
    { id: 'allies',    label: '盟友',     type: 'ref', refTypes: ['character'], multi: true, placeholder: '选择盟友角色' },
    { id: 'enemies',   label: '宿敌 / 敌对', type: 'ref', refTypes: ['character'], multi: true, placeholder: '选择敌对角色' },
    { id: 'home',      label: '常驻地点', type: 'ref', refTypes: ['location'], multi: true, placeholder: '选择常出没的地点' },
  ],
  location: [
    { id: 'category',   label: '类别', type: 'select', options: ['宗门', '秘境', '城池', '洞府', '战场', '荒野', '其他'] },
    { id: 'world',      label: '所属世界', type: 'ref', refTypes: ['lore'], placeholder: '选择所属世界观' },
    { id: 'position',   label: '地理位置', type: 'text', placeholder: '如:青云山脉主峰 / 后山深渊' },
    { id: 'climate',    label: '环境 / 气候', type: 'textarea', placeholder: '地貌、天象、灵气浓度、氛围…' },
    { id: 'significance', label: '重要性', type: 'textarea', placeholder: '对主线/角色的意义,为何存在' },
    { id: 'residents',  label: '常驻角色', type: 'ref', refTypes: ['character'], multi: true, placeholder: '选择常驻角色' },
    { id: 'items',      label: '相关物品', type: 'ref', refTypes: ['item'], multi: true, placeholder: '选择相关物品' },
    { id: 'events',     label: '相关事件', type: 'ref', refTypes: ['event'], multi: true, placeholder: '选择相关事件' },
  ],
  item: [
    { id: 'category',   label: '类别', type: 'select', options: ['法宝', '丹药', '灵植', '典籍', '信物', '兵器', '其他'] },
    { id: 'source',     label: '来历 / 来源', type: 'text', placeholder: '师承所赠 / 秘境所得 / 上古遗物' },
    { id: 'effect',     label: '功效 / 功能', type: 'textarea', placeholder: '用途、威力、使用方式…' },
    { id: 'limitation', label: '限制 / 代价', type: 'textarea', placeholder: '使用条件、反噬、封印层数…' },
    { id: 'owner',      label: '持有者', type: 'ref', refTypes: ['character'], placeholder: '选择当前持有者' },
    { id: 'location',   label: '存放地点', type: 'ref', refTypes: ['location'], placeholder: '选择存放地点' },
  ],
  event: [
    { id: 'timeline',   label: '时间线', type: 'text', placeholder: '如:三年前 / 穿越当夜子时' },
    { id: 'location',   label: '发生地点', type: 'ref', refTypes: ['location'], placeholder: '选择发生地点' },
    { id: 'characters', label: '涉及角色', type: 'ref', refTypes: ['character'], multi: true, placeholder: '选择涉及角色' },
    { id: 'cause',      label: '起因', type: 'textarea', placeholder: '事件如何被触发' },
    { id: 'impact',     label: '影响 / 后果', type: 'textarea', placeholder: '对世界、剧情、角色的后续影响' },
  ],
  faction: [
    { id: 'category',  label: '类别', type: 'select', options: ['宗门', '家族', '王朝', '散修组织', '魔道', '商会', '其他'] },
    { id: 'motto',     label: '宗旨 / 教义', type: 'textarea', placeholder: '立身之本、行事准则' },
    { id: 'leader',    label: '首领', type: 'ref', refTypes: ['character'], placeholder: '选择首领' },
    { id: 'members',   label: '核心成员', type: 'ref', refTypes: ['character'], multi: true, placeholder: '选择核心成员' },
    { id: 'territory', label: '势力范围', type: 'text', placeholder: '地盘、据点、影响力辐射' },
    { id: 'events',    label: '重要事件', type: 'ref', refTypes: ['event'], multi: true, placeholder: '选择相关事件' },
  ],
  lore: [
    { id: 'category', label: '类别', type: 'select', options: ['修炼体系', '地理', '历史', '规则设定', '宗门秘辛', '其他'] },
    { id: 'rules',    label: '核心规则', type: 'textarea', placeholder: '必须遵循的硬性设定(写错即穿帮)' },
    { id: 'history',  label: '历史沿革', type: 'textarea', placeholder: '时间线上的重要节点' },
    { id: 'related',  label: '相关档案', type: 'ref', multi: true, placeholder: '关联任意档案' },
  ],
  storyline: [
    { id: 'category',    label: '线的类别', type: 'select', options: ['主线', '感情线', '支线', '暗线', '成长线', '复仇线', '事业线'] },
    { id: 'status',      label: '推进状态', type: 'select', options: ['构思中', '进行中', '已收束', '已完结', '暂停'] },
    { id: 'importance',  label: '权重',     type: 'select', options: ['核心', '重要', '次要'] },
    { id: 'characters',  label: '涉及角色', type: 'ref', refTypes: ['character'], multi: true, placeholder: '选择参与这条线的角色' },
    { id: 'start',       label: '起点',     type: 'textarea', placeholder: '这条线从哪个事件/状态开始' },
    { id: 'end',         label: '终点 / 收束', type: 'textarea', placeholder: '这条线最终走向什么结局' },
    { id: 'conflict',    label: '核心冲突', type: 'textarea', full: true, placeholder: '推动这条线前进的矛盾是什么' },
    { id: 'beats',       label: '关键节点', type: 'tags', placeholder: '回车添加节点,如:古剑认主 / 万剑俯首' },
    { id: 'locations',   label: '相关地点', type: 'ref', refTypes: ['location'], multi: true, placeholder: '选择发生地点' },
    { id: 'events',      label: '关键事件', type: 'ref', refTypes: ['event'], multi: true, placeholder: '选择串联的事件' },
  ],
};

/** 按模板生成新档案的默认字段值 */
export function createDefaultFields(type: CodexType): Record<string, CodexFieldValue> {
  const fields: Record<string, CodexFieldValue> = {};
  for (const def of CODEX_TEMPLATES[type]) {
    if (def.type === 'tags' || (def.type === 'ref' && def.multi)) {
      fields[def.id] = [];
    } else if (def.type === 'number') {
      fields[def.id] = 0;
    } else {
      fields[def.id] = '';
    }
  }
  return fields;
}

/** 从 fields 中的 ref 字段收集关联档案 id(排除被置空的) */
export function collectRelatedIds(fields: Record<string, CodexFieldValue>): string[] {
  const ids = new Set<string>();
  for (const v of Object.values(fields)) {
    if (Array.isArray(v)) {
      v.forEach((id) => typeof id === 'string' && id && ids.add(id));
    } else if (typeof v === 'string' && v.startsWith('codex-')) {
      ids.add(v);
    }
  }
  return [...ids];
}

/** 移除对某档案的引用(用于删除档案时的反向清理) */
export function stripRefs(fields: Record<string, CodexFieldValue>, removedId: string): Record<string, CodexFieldValue> {
  const next: Record<string, CodexFieldValue> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) {
      next[k] = v.filter((x) => x !== removedId);
    } else if (v === removedId) {
      next[k] = '';
    } else {
      next[k] = v;
    }
  }
  return next;
}

/** 类型主字段:用于卡片摘要展示的关键字段 id */
export const CARD_KEY_FIELDS: Record<CodexType, string[]> = {
  character: ['identity', 'realm', 'age'],
  location: ['category', 'position'],
  item: ['category', 'source'],
  event: ['timeline', 'location'],
  faction: ['category', 'territory'],
  lore: ['category'],
  storyline: ['category', 'status', 'importance'],
};

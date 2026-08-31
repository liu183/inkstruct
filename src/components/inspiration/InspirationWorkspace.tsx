import { useMemo, useState } from 'react';
import {
  AlertTriangle, BookmarkPlus, BookOpen, Dices, FileDown, Lightbulb, Plus, RefreshCw, Search,
  Settings2, Sliders, Sparkles, Target, Trash2, Users, Wand2, X,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { drawInspirationCards, targetedInspirationCards, type PoolDiagnostic } from '../../data/inspirationEngine';
import type {
  ArcRole, CodexType, InspirationCard, InspirationConfig, InspirationGenre, InspirationType,
} from '../../types';
import { ARC_ROLE_META, INSPIRATION_TYPE_META } from '../../types';
import { INSPIRATION_GENRES } from '../../types';
import { GENRE_AXES } from '../../data/genreProfiles';
import InspirationCardView from './InspirationCard';
import InspirationConfigPanel from './InspirationConfigPanel';

const POOL_TYPES: (InspirationType | 'all')[] = ['all', 'plot', 'character', 'twist', 'world', 'goldfinger', 'title'];

/** 灵感类型 → Codex 档案类型(采纳用) */
const TO_CODEX_TYPE: Record<InspirationType, CodexType> = {
  plot: 'event',
  character: 'character',
  twist: 'event',
  world: 'lore',
  goldfinger: 'item',
  title: 'lore',
};

type Mode = 'draw' | 'targeted' | 'design';

export default function InspirationWorkspace() {
  const project = useProjectStore((s) => s.project);
  const config = project.inspirationConfig;
  const pool = project.inspirationCards;
  const updateConfig = useProjectStore((s) => s.updateInspirationConfig);
  const addCard = useProjectStore((s) => s.addInspirationCard);
  const removeCard = useProjectStore((s) => s.removeInspirationCard);
  const addCodexEntry = useProjectStore((s) => s.addCodexEntry);
  const updateCodex = useProjectStore((s) => s.updateCodex);
  const setStatusMessage = useUIStore((s) => s.setStatusMessage);

  const [mode, setMode] = useState<Mode>('draw');
  const initial = useMemo(
    () => drawInspirationCards(config, { codex: project.codex }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [cards, setCards] = useState<InspirationCard[]>(initial.cards);
  const [drawDiag, setDrawDiag] = useState<PoolDiagnostic | null>(initial.diagnostic);
  const [targeted, setTargeted] = useState<InspirationCard[]>([]);
  const [targetedDiag, setTargetedDiag] = useState<PoolDiagnostic | null>(null);
  const [targetInput, setTargetInput] = useState('');
  const [usePool, setUsePool] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [poolType, setPoolType] = useState<InspirationType | 'all'>('all');
  const [poolQuery, setPoolQuery] = useState('');

  const savedIds = useMemo(() => new Set(pool.map((c) => c.id)), [pool]);

  /* ---------- 盲盒抽卡 ---------- */
  const redraw = () => {
    const result = drawInspirationCards(config, { codex: project.codex });
    setCards(result.cards);
    setDrawDiag(result.diagnostic);
    setStatusMessage(`盲盒抽取了 ${result.cards.length} 张灵感卡片`);
  };

  const saveAll = () => {
    cards.forEach((c) => addCard(c));
    setStatusMessage(`已将 ${cards.length} 张灵感卡片加入灵感池`);
  };

  /* ---------- 定向灵感(开书前命题构思) ---------- */
  const genTargeted = () => {
    const result = targetedInspirationCards(
      config,
      {
        input: targetInput,
        usePool,
        poolCards: pool,
        codex: project.codex,
      },
      3
    );
    setTargeted(result.cards);
    setTargetedDiag(result.diagnostic);
    setStatusMessage(targetInput.trim() ? '已基于你的描述生成 3 条定向灵感' : '已生成 3 条定向灵感');
  };

  /* ---------- 采纳:转为 Codex 档案草稿 ---------- */
  const adoptToCodex = (card: InspirationCard) => {
    const id = addCodexEntry(TO_CODEX_TYPE[card.type]);
    updateCodex(id, {
      name: card.title,
      summary: card.hook,
      details: [
        card.protagonist && `主角:${card.protagonist}`,
        card.conflict && `冲突:${card.conflict}`,
        card.openAction && `开篇场景:${card.openAction}`,
        card.tips.length ? '\n展开思路:\n' + card.tips.join('\n') : '',
      ]
        .filter(Boolean)
        .join('\n'),
      tags: card.tags.slice(0, 5),
    });
    setStatusMessage(`灵感「${card.title}」已转为 Codex 档案草稿`);
  };

  const filteredPool = useMemo(
    () =>
      pool.filter(
        (c) =>
          (poolType === 'all' || c.type === poolType) &&
          (!poolQuery.trim() ||
            c.title.toLowerCase().includes(poolQuery.toLowerCase()) ||
            c.hook.toLowerCase().includes(poolQuery.toLowerCase()) ||
            c.tags.some((t) => t.toLowerCase().includes(poolQuery.toLowerCase())))
      ),
    [pool, poolType, poolQuery]
  );

  const countBy = (t: InspirationType | 'all') =>
    t === 'all' ? pool.length : pool.filter((c) => c.type === t).length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ===== 头部 ===== */}
      <div className="border-b border-ink-700/60 bg-gradient-to-r from-ink-900 via-ink-850 to-ink-900 px-5 py-4">
        <div className="flex items-center gap-3">
          <Sparkles size={18} className="text-amber-400" />
          <h1 className="text-lg font-semibold text-slate-100">灵感助手 · 开书前故事设计</h1>
          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="font-mono text-xs font-semibold text-slate-300">{config.count}</span> 张/次
            </span>
            <span className="flex items-center gap-1">
              风格
              <span className="font-mono text-xs font-semibold text-slate-300">
                {config.directions.length === 0 ? '全部' : config.directions.join('+')}
              </span>
            </span>
            <span className="flex items-center gap-1">
              题材
              <span className="font-mono text-xs font-semibold text-slate-300">
                {config.genres.length === 0 ? '不限' : config.genres.join('+')}
              </span>
            </span>
            <span className="flex items-center gap-1">
              脑洞
              <span className="font-mono text-xs font-semibold text-slate-300">{['克制', '平衡', '放飞'][config.wildness - 1]}</span>
            </span>
          </div>

          <button onClick={() => setConfigOpen(true)} className="btn-ghost ml-auto">
            <Settings2 size={14} />
            配置
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          盲盒探索灵感 → 故事设计台合成整体大纲走向与角色设计 → 导入 Plan 细化小说规划
        </p>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* ===== 左:灵感池 ===== */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-ink-700/60 bg-ink-900/40">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              灵感池 · {pool.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setManualOpen(true)}
                className="rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-sky-300"
                title="手动记录灵感(手记)"
              >
                <Plus size={13} />
              </button>
              {pool.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('清空灵感池?此操作不可撤销')) {
                      useProjectStore.getState().clearInspirationCards();
                      setStatusMessage('已清空灵感池');
                    }
                  }}
                  className="text-slate-600 transition-colors hover:text-red-400"
                  title="清空灵感池"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          {/* 类型 tabs */}
          <div className="flex flex-wrap items-center gap-1 px-3 pb-1">
            {POOL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setPoolType(t)}
                className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                  poolType === t ? 'bg-ink-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t !== 'all' && (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: INSPIRATION_TYPE_META[t].color }} />
                )}
                {t === 'all' ? '全部' : INSPIRATION_TYPE_META[t].label}
                <span className="opacity-50">{countBy(t)}</span>
              </button>
            ))}
          </div>

          {/* 搜索 */}
          <div className="px-3 py-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                value={poolQuery}
                onChange={(e) => setPoolQuery(e.target.value)}
                placeholder="搜索灵感池…"
                className="input-dark !py-1.5 !pl-7 text-[11px]"
              />
            </div>
          </div>

          {/* 池卡片列表 */}
          <div className="flex-1 space-y-1.5 overflow-y-auto px-2 pb-3">
            {filteredPool.map((c) => (
              <InspirationCardView
                key={c.id}
                card={c}
                mode="pool"
                expandedByDefault={config.showTips}
                onRemove={() => removeCard(c.id)}
                onAdopt={() => adoptToCodex(c)}
              />
            ))}
            {filteredPool.length === 0 && (
              <div className="px-3 py-8 text-center text-[11px] text-slate-600">
                收藏 AI 灵感,或点右上角 + 手动记录你的点子
              </div>
            )}
          </div>
        </aside>

        {/* ===== 右:主区 ===== */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* 模式切换 */}
          <div className="flex items-center gap-1 border-b border-ink-700/50 px-4 py-2">
            <ModeTab active={mode === 'draw'} icon={<Dices size={13} />} label="盲盒抽卡" onClick={() => setMode('draw')} />
            <ModeTab active={mode === 'targeted'} icon={<Target size={13} />} label="定向灵感" onClick={() => setMode('targeted')} />
            <ModeTab active={mode === 'design'} icon={<BookOpen size={13} />} label="故事设计" onClick={() => setMode('design')} />
            <div className="ml-auto text-[10px] text-slate-600">
              {mode === 'draw'
                ? '不给任何提示,随机探索,寻找意外惊喜'
                : mode === 'targeted'
                  ? '写下你的命题,AI 贴合描述生成开书点子'
                  : '从灵感池合成故事整体大纲走向 + 角色设计,导入 Plan 细化规划'}
            </div>
          </div>

          {mode === 'draw' ? (
            /* ---------- 盲盒抽卡区 ---------- */
            <div className="flex-1 overflow-y-auto">
              {/* 故事雏形总览:5 张卡片 = 一段弧 */}
              {cards.length >= 3 && <StoryArcOverview cards={cards} />}

              {/* 操作条 */}
              <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
                <button onClick={redraw} className="btn-primary">
                  <RefreshCw size={13} />
                  再抽一批
                </button>
                <button
                  onClick={saveAll}
                  className="btn border border-ink-700 text-slate-300 hover:border-amber-500/40 hover:text-amber-300"
                >
                  <BookmarkPlus size={13} />
                  全部收藏
                </button>
                <div className="ml-auto flex items-center gap-1 text-[10px] text-slate-600">
                  <Wand2 size={11} className="text-amber-400/70" />
                  收藏到灵感池 · 在「故事设计」合成整体走向
                </div>
              </div>

              {/* 当前限定摘要(题材档案) + 配置生效警告 */}
              <div className="space-y-1.5 px-4 pt-2">
                <RestrictionSummary config={config} onOpenConfig={() => setConfigOpen(true)} />
                {drawDiag && drawDiag.warnings.length > 0 && (
                  <div className="flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-2 text-[10px] text-amber-200">
                    <AlertTriangle size={12} className="mt-px shrink-0 text-amber-400" />
                    <div className="space-y-0.5">
                      {drawDiag.warnings.map((w, i) => (
                        <div key={i}>{w}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 卡片网格 */}
              <div
                className={`grid gap-3 p-4 ${
                  config.count >= 6
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                    : config.count >= 4
                      ? 'grid-cols-1 md:grid-cols-2'
                      : 'grid-cols-1'
                }`}
              >
                {cards.map((c) => (
                  <InspirationCardView
                    key={c.id}
                    card={c}
                    mode="draw"
                    saved={savedIds.has(c.id)}
                    expandedByDefault={config.showTips}
                    onToggleSave={() => {
                      if (savedIds.has(c.id)) removeCard(c.id);
                      else addCard(c);
                    }}
                    onAdopt={() => adoptToCodex(c)}
                  />
                ))}
              </div>
            </div>
          ) : mode === 'targeted' ? (
            /* ---------- 定向灵感区 ---------- */
            <div className="flex-1 overflow-y-auto p-4">
              {/* 意图输入 */}
              <div className="rounded-xl border border-accent-500/30 bg-accent-500/[0.05] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-accent-200">
                  <Lightbulb size={13} />
                  你想开一本什么书?描述得越具体,灵感越贴合
                </div>
                <textarea
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      genTargeted();
                    }
                  }}
                  rows={2}
                  placeholder="例:一个被宗门逐出山门的废柴,靠一本残破古书逆袭;或者:主角能看见别人的寿命,还能收割…"
                  className="input-dark mt-2 w-full resize-none text-xs !py-2"
                />

                {/* 题材档案摘要 */}
                <div className="mt-2.5 rounded-lg border border-ink-700/40 bg-ink-850/50 p-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                    <Sliders size={10} />
                    题材档案(已生效)
                    <button
                      onClick={() => setConfigOpen(true)}
                      className="ml-auto text-[10px] text-accent-300 transition-colors hover:text-accent-200"
                    >
                      打开完整配置 →
                    </button>
                  </div>
                  {config.genres.length === 0 ? (
                    <div className="mt-1 text-[10px] text-slate-600">未限定题材 — 所有题材的灵感都会出现</div>
                  ) : (
                    <div className="mt-1.5 space-y-1.5">
                      {config.genres.map((g) => {
                        const axes = GENRE_AXES[g];
                        const userAxes = config.axisSelections[g] ?? {};
                        const refinedEntries = axes.filter((a) => (userAxes[a.key] ?? []).length > 0);
                        return (
                          <div key={g} className="text-[10px]">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-medium text-accent-300">{g}</span>
                              {refinedEntries.length === 0 && (
                                <span className="text-slate-600">(未细化,所有轴通配)</span>
                              )}
                            </div>
                            {refinedEntries.length > 0 && (
                              <div className="ml-2 mt-0.5 space-y-0.5">
                                {refinedEntries.map((a) => (
                                  <div key={a.key} className="flex items-baseline gap-1.5">
                                    <span className="text-slate-500">{a.label}:</span>
                                    <span className="text-slate-300">
                                      {(userAxes[a.key] ?? []).join(' · ')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 生成行 */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={genTargeted} className="btn-primary">
                    <Sparkles size={13} />
                    生成 3 条定向灵感
                  </button>
                  <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-slate-400 transition-colors hover:text-slate-200">
                    <input
                      type="checkbox"
                      checked={usePool}
                      onChange={(e) => setUsePool(e.target.checked)}
                      className="accent-accent-500"
                    />
                    融入灵感池({pool.length} 条)的已有想法
                  </label>
                  <span className="ml-auto text-[9px] text-slate-600">Enter 快捷生成 · Shift+Enter 换行</span>
                </div>
              </div>

              {/* 定向结果 */}
              {targeted.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                    <Wand2 size={11} className="text-amber-400" />
                    定向结果 · 贴合你的命题
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {targeted.map((c) => (
                      <InspirationCardView
                        key={c.id}
                        card={c}
                        mode="draw"
                        saved={savedIds.has(c.id)}
                        expandedByDefault={config.showTips}
                        onToggleSave={() => {
                          if (savedIds.has(c.id)) removeCard(c.id);
                          else addCard(c);
                        }}
                        onAdopt={() => adoptToCodex(c)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ---------- 故事设计区 ---------- */
            <StoryDesignView pool={pool} />
          )}
        </section>
      </div>

      {/* 配置抽屉 */}
      <InspirationConfigPanel open={configOpen} onClose={() => setConfigOpen(false)} />

      {/* 手动记录弹窗 */}
      <ManualInspirationModal open={manualOpen} onClose={() => setManualOpen(false)} />
    </div>
  );
}

/* ============ 故事设计:灵感池 → 故事整体大纲走向 + 角色设计 ============ */

const ARC_ORDER: ArcRole[] = ['opening', 'rising', 'turn', 'climax', 'resolve'];

interface ArcSegment {
  arc: ArcRole;
  card?: InspirationCard;
  title: string;
  direction: string;
  conflict: string;
}

interface CharacterDesign {
  key: string;
  name: string;
  role: string;
  conflict: string;
  sourceTitles: string[];
}

function StoryDesignView({ pool }: { pool: InspirationCard[] }) {
  const setStatusMessage = useUIStore((s) => s.setStatusMessage);
  const setWorkspace = useUIStore((s) => s.setWorkspace);
  const setPlanViewMode = useUIStore((s) => s.setPlanViewMode);
  const addChapter = useProjectStore((s) => s.addChapter);
  const updateChapterMeta = useProjectStore((s) => s.updateChapterMeta);
  const addCodexEntry = useProjectStore((s) => s.addCodexEntry);
  const updateCodexField = useProjectStore((s) => s.updateCodexField);

  // 故事整体大纲走向:按弧位聚合灵感池,每弧位取一张代表卡片
  const arcSegments = useMemo<ArcSegment[]>(() => {
    const byArc = new Map<ArcRole, InspirationCard>();
    pool.forEach((c) => {
      if (c.arcRole && !byArc.has(c.arcRole)) byArc.set(c.arcRole, c);
    });
    return ARC_ORDER.map((arc) => {
      const card = byArc.get(arc);
      const meta = ARC_ROLE_META[arc];
      return {
        arc,
        card,
        title: card?.title ?? `${meta.label} · 待补充`,
        direction: card?.hook ?? '',
        conflict: card?.conflict ?? '',
      };
    });
  }, [pool]);
  const hasArcCards = arcSegments.filter((s) => s.card).length;

  // 角色设计:聚合主角标签
  const characters = useMemo<CharacterDesign[]>(() => {
    const map = new Map<string, CharacterDesign>();
    pool.forEach((c) => {
      if (!c.protagonist) return;
      const key = c.protagonist;
      const cur = map.get(key);
      if (cur) {
        cur.sourceTitles.push(c.title);
        if (!cur.conflict && c.conflict) cur.conflict = c.conflict;
      } else {
        map.set(key, {
          key,
          name: key,
          role: c.type === 'character' ? '核心角色' : '主角',
          conflict: c.conflict ?? '',
          sourceTitles: [c.title],
        });
      }
    });
    return [...map.values()];
  }, [pool]);

  /* ---------- 落笔:故事整体大纲走向 → Plan 章节大纲 ---------- */
  const importToPlan = () => {
    const filled = arcSegments.filter((s) => s.card);
    if (filled.length === 0) {
      setStatusMessage('灵感池还没有带故事弧位的卡片,先抽卡或定向生成并收藏');
      return;
    }
    filled.forEach((seg, i) => {
      const card = seg.card!;
      const chapterId = addChapter();
      const lines = [
        `【${ARC_ROLE_META[seg.arc].label}】${card.hook}`,
        card.conflict && `冲突:${card.conflict}`,
        card.protagonist && `主角:${card.protagonist}`,
        card.openAction && `\n开篇场景:\n${card.openAction}`,
        card.tips.length && `\n展开思路:\n${card.tips.map((t) => `- ${t}`).join('\n')}`,
      ].filter(Boolean);
      updateChapterMeta(chapterId, {
        title: `第${i + 1}章 · ${card.title}`,
        summary: lines.join('\n'),
      });
    });
    setPlanViewMode('outline');
    setWorkspace('plan');
    setStatusMessage(`已按 ${filled.length} 段弧位生成章节大纲,可在 Plan 中细化小说规划`);
  };

  /* ---------- 落笔:角色设计 → Codex 角色档案 ---------- */
  const exportCharacters = () => {
    if (characters.length === 0) {
      setStatusMessage('尚未从灵感池提取到角色设计,先收藏带主角标签的灵感');
      return;
    }
    characters.forEach((ch) => {
      const id = addCodexEntry('character');
      updateCodexField(id, 'identity', ch.role);
      updateCodexField(id, 'goal', ch.conflict);
      updateCodexField(id, 'motivation', ch.conflict);
      updateCodexField(id, 'background', ch.sourceTitles.join('、'));
      updateCodexField(id, 'alias', [ch.name]);
    });
    setStatusMessage(`已为 ${characters.length} 个角色生成 Codex 角色档案`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* 设计台头部 */}
      <div className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/[0.06] via-ink-850 to-violet-500/[0.06] p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-200">
          <BookOpen size={14} />
          开书故事设计台
          <span className="text-[10px] font-normal text-slate-500">
            从灵感池合成故事整体大纲走向与角色设计,导入 Plan 细化小说规划
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={exportCharacters}
            disabled={characters.length === 0}
            className="btn border border-pink-500/40 text-pink-300 hover:bg-pink-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Users size={13} />
            生成角色档案({characters.length})
          </button>
          <button
            onClick={importToPlan}
            disabled={hasArcCards === 0}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileDown size={13} />
            导入 Plan 大纲({hasArcCards}/5 段弧)
          </button>
          <span className="ml-auto text-[9px] text-slate-600">
            灵感池 {pool.length} 条 · 弧位卡片 {hasArcCards} 张
          </span>
        </div>
      </div>

      {/* 故事整体大纲走向 */}
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
          <Sparkles size={11} className="text-amber-400" />
          故事整体大纲走向
          <span className="font-normal text-slate-600">· 五段弧位,每段可对应一卷/一部</span>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
          {arcSegments.map((seg) => {
            const meta = ARC_ROLE_META[seg.arc];
            return (
              <div
                key={seg.arc}
                className={`rounded-xl border p-3 ${
                  seg.card
                    ? 'border-ink-700/60 bg-ink-850/70'
                    : 'border-dashed border-ink-700/40 bg-ink-900/30'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="rounded px-1.5 py-px text-[9px] font-bold text-ink-950"
                    style={{ background: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <span className="text-[9px] text-slate-500">{meta.desc}</span>
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-100">{seg.title}</div>
                {seg.direction && <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{seg.direction}</p>}
                {seg.conflict && (
                  <div className="mt-1.5 rounded bg-ink-900/50 px-1.5 py-1 text-[9px] text-amber-200/80">
                    冲突:{seg.conflict}
                  </div>
                )}
                {!seg.card && <div className="mt-1 text-[9px] italic text-slate-600">收藏对应弧位的灵感卡以填充</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 角色设计 */}
      <div className="mt-4 pb-6">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
          <Users size={11} className="text-pink-400" />
          角色设计
          <span className="font-normal text-slate-600">· 从带主角标签的灵感中聚合</span>
        </div>
        {characters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-700/40 bg-ink-900/30 px-4 py-6 text-center text-[11px] text-slate-600">
            收藏带主角标签的灵感(如「替身少年」「隐忍天才」)后,这里会自动聚合出角色设计
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {characters.map((ch) => (
              <div key={ch.key} className="rounded-xl border border-ink-700/60 bg-ink-850/70 p-3">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                  <span className="text-xs font-semibold text-slate-100">{ch.name}</span>
                  <span className="rounded bg-pink-500/10 px-1 py-px text-[9px] text-pink-300 ring-1 ring-pink-500/20">
                    {ch.role}
                  </span>
                </div>
                {ch.conflict && <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">{ch.conflict}</p>}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {ch.sourceTitles.map((t) => (
                    <span key={t} className="rounded bg-ink-800 px-1 py-px text-[9px] text-slate-500">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ 手动记录弹窗 ============ */

const MANUAL_TYPE_ORDER: InspirationType[] = ['plot', 'character', 'twist', 'world', 'goldfinger', 'title'];

function ManualInspirationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addManual = useProjectStore((s) => s.addManualInspiration);
  const setStatusMessage = useUIStore((s) => s.setStatusMessage);

  const [type, setType] = useState<InspirationType>('plot');
  const [genre, setGenre] = useState<InspirationGenre | ''>('');
  const [title, setTitle] = useState('');
  const [hook, setHook] = useState('');
  const [tags, setTags] = useState('');

  if (!open) return null;

  const submit = () => {
    if (!title.trim() && !hook.trim()) return;
    addManual({
      type,
      genre: genre || undefined,
      title,
      hook,
      tags: tags
        .split(/[,，、\s]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setStatusMessage('已记录到灵感池');
    setTitle('');
    setHook('');
    setTags('');
    setType('plot');
    setGenre('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-[440px] rounded-xl border border-ink-700 bg-ink-900 shadow-2xl animate-slide-up">
        <div className="flex items-center gap-2 border-b border-ink-700/60 px-4 py-3">
          <Lightbulb size={14} className="text-sky-400" />
          <span className="text-sm font-semibold text-slate-100">记录你的灵感</span>
          <button onClick={onClose} className="ml-auto rounded p-1 text-slate-500 hover:bg-ink-700 hover:text-slate-200">
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">灵感标题 *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="一句话概括,如:主角是被宗门丢弃的杂役"
              className="input-dark text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">展开描述</label>
            <textarea
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              rows={2}
              placeholder="补一句细节,比如冲突、人物或想要的氛围…"
              className="input-dark w-full resize-none text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-slate-500">类型</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InspirationType)}
                className="input-dark w-full text-xs"
              >
                {MANUAL_TYPE_ORDER.map((t) => (
                  <option key={t} value={t}>{INSPIRATION_TYPE_META[t].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-slate-500">题材(可选)</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as InspirationGenre | '')}
                className="input-dark w-full text-xs"
              >
                <option value="">不限</option>
                {INSPIRATION_GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-slate-500">标签(逗号分隔)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="废柴,逆袭,扮猪吃虎"
              className="input-dark text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-ink-700/60 px-4 py-3">
          <button onClick={onClose} className="btn text-slate-400 hover:bg-ink-700">取消</button>
          <button onClick={submit} disabled={!title.trim() && !hook.trim()} className="btn-primary !py-1.5">
            <Plus size={13} />
            记录到灵感池
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'bg-ink-700 text-amber-300 ring-1 ring-amber-500/30'
          : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ============ 故事弧总览:5 张卡片 = 一段弧 ============ */

function StoryArcOverview({ cards }: { cards: InspirationCard[] }) {
  // 按 arcRole 聚合:每弧位取第一张
  const arcOrder: ArcRole[] = ['opening', 'rising', 'turn', 'climax', 'resolve'];
  const arcMap = new Map<ArcRole, InspirationCard>();
  cards.forEach((c) => {
    if (c.arcRole && !arcMap.has(c.arcRole)) arcMap.set(c.arcRole, c);
  });
  const present = arcOrder.filter((a) => arcMap.has(a));
  if (present.length === 0) return null;

  return (
    <div className="border-b border-ink-700/40 bg-gradient-to-r from-amber-500/[0.04] via-accent-500/[0.05] to-violet-500/[0.04] px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-200">
        <Sparkles size={12} className="text-amber-400" />
        故事雏形
        <span className="text-[10px] font-normal text-slate-500">
          ·  {cards.length} 张卡片 = {present.length}/5 段弧(开局 → 终局)
        </span>
        <div className="ml-auto text-[9px] text-slate-600">
          卡片之间会自动补全未出现的弧位
        </div>
      </div>
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
        {arcOrder.map((arc) => {
          const card = arcMap.get(arc);
          const meta = ARC_ROLE_META[arc];
          return (
            <div
              key={arc}
              className={`min-w-[160px] shrink-0 rounded-lg border p-2 ${
                card
                  ? 'border-ink-700/60 bg-ink-850/70'
                  : 'border-dashed border-ink-700/40 bg-ink-900/30 opacity-60'
              }`}
            >
              <div className="flex items-center gap-1">
                <span
                  className="rounded px-1 py-px text-[9px] font-bold text-ink-950"
                  style={{ background: meta.color }}
                >
                  {meta.label}
                </span>
                <span className="truncate text-[9px] text-slate-500">{meta.desc}</span>
              </div>
              {card ? (
                <div className="mt-1 truncate text-[11px] font-medium text-slate-200" title={card.title}>
                  {card.title}
                </div>
              ) : (
                <div className="mt-1 text-[10px] italic text-slate-600">未抽到</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ 当前限定摘要 ============ */

function RestrictionSummary({ config, onOpenConfig }: { config: InspirationConfig; onOpenConfig: () => void }) {
  const hasGenre = config.genres.length > 0;
  const hasDir = config.directions.length > 0;
  const hasAxis = Object.values(config.axisSelections).some(
    (g) => Object.values(g as Record<string, string[]>).some((arr) => arr.length > 0)
  );
  if (!hasGenre && !hasDir && !hasAxis) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
        <span>未限定 — 所有题材/风格/轴向均通配</span>
        <button onClick={onOpenConfig} className="ml-1 text-accent-300 hover:text-accent-200">
          打开配置 →
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
      <span className="font-semibold">当前限定:</span>
      {hasDir &&
        config.directions.map((d: string) => (
          <span key={d} className="rounded bg-ink-800 px-1.5 py-px text-slate-400 ring-1 ring-ink-700/60">
            风格·{d}
          </span>
        ))}
      {hasGenre &&
        config.genres.map((g: InspirationGenre) => {
          const refined = (config.axisSelections[g] ?? {}) as Record<string, string[]>;
          const refinedEntries = Object.entries(refined).filter(([, v]) => v.length > 0);
          return (
            <span key={g} className="rounded bg-ink-800 px-1.5 py-px text-slate-400 ring-1 ring-ink-700/60">
              题材·{g}
              {refinedEntries.length > 0 && (
                <span className="ml-1 text-[9px] text-accent-300">
                  ·{refinedEntries.length} 项细化
                </span>
              )}
            </span>
          );
        })}
      <button onClick={onOpenConfig} className="ml-1 text-accent-300 hover:text-accent-200">
        打开配置 →
      </button>
    </div>
  );
}

import { useMemo, useState } from 'react';
import {
  ChevronRight, FileText, Layers, PenSquare, ScrollText, Search,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { SCENE_STATUS_META } from '../../types';
import { flatChapters, totalWords as countWords } from '../../utils/structure';

/**
 * 章纲与存稿:
 * - 左:卷 / 单元 / 章 三级清单(可按标题搜索)
 * - 右:选中章的「章纲」编辑 + 该章「存稿」(场景)列表
 */
export default function DraftsWorkspace() {
  const project = useProjectStore((s) => s.project);
  const updateChapterMeta = useProjectStore((s) => s.updateChapterMeta);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const setWorkspace = useUIStore((s) => s.setWorkspace);

  const all = useMemo(() => flatChapters(project), [project]);
  const [selectedId, setSelectedId] = useState<string>(all[0]?.chapter.id ?? '');
  const [query, setQuery] = useState('');

  const selected = all.find((x) => x.chapter.id === selectedId) ?? all[0] ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      ({ volume, unit, chapter }) =>
        !q ||
        chapter.title.toLowerCase().includes(q) ||
        unit.title.toLowerCase().includes(q) ||
        volume.title.toLowerCase().includes(q) ||
        chapter.summary.toLowerCase().includes(q)
    );
  }, [all, query]);

  const stats = useMemo(
    () => ({
      chapters: all.length,
      outlined: all.filter((x) => x.chapter.summary.trim()).length,
      words: countWords(project),
    }),
    [all, project]
  );

  // 按卷 → 单元分组
  const grouped = useMemo(() => {
    const map = new Map<string, { volumeTitle: string; units: Map<string, { unitTitle: string; items: typeof all }> }>();
    filtered.forEach((item) => {
      if (!map.has(item.volume.id)) {
        map.set(item.volume.id, { volumeTitle: item.volume.title, units: new Map() });
      }
      const vol = map.get(item.volume.id)!;
      if (!vol.units.has(item.unit.id)) {
        vol.units.set(item.unit.id, { unitTitle: item.unit.title, items: [] });
      }
      vol.units.get(item.unit.id)!.items.push(item);
    });
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 头部 */}
      <div className="border-b border-ink-700/60 bg-gradient-to-r from-ink-900 via-ink-850 to-ink-900 px-5 py-4">
        <div className="flex items-center gap-3">
          <ScrollText size={18} className="text-sky-400" />
          <h1 className="text-lg font-semibold text-slate-100">章纲与存稿</h1>
          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            <span>
              章 <span className="font-mono text-xs font-semibold text-slate-300">{stats.chapters}</span>
            </span>
            <span>
              已写纲{' '}
              <span className="font-mono text-xs font-semibold text-emerald-400">{stats.outlined}</span>
            </span>
            <span>
              存稿{' '}
              <span className="font-mono text-xs font-semibold text-slate-300">
                {stats.words.toLocaleString()}
              </span>{' '}
              字
            </span>
          </div>
          <div className="relative ml-auto w-52">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索章纲…"
              className="input-dark !py-1.5 !pl-7 text-[11px]"
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          左侧挑章,右侧写「这一章要发生什么」;下方是该章已写的场景存稿
        </p>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* 左:结构清单 */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-ink-700/60 bg-ink-900/40">
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {grouped.map(([volumeId, vol]) => (
              <div key={volumeId} className="mb-2">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {vol.volumeTitle}
                </div>
                {[...vol.units.entries()].map(([unitId, u]) => (
                  <div key={unitId}>
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-accent-300/80">
                      <Layers size={10} />
                      {u.unitTitle}
                    </div>
                    <div className="ml-1.5 border-l border-ink-700/50 pl-1">
                      {u.items.map(({ chapter }) => (
                        <button
                          key={chapter.id}
                          onClick={() => setSelectedId(chapter.id)}
                          className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                            selected?.chapter.id === chapter.id
                              ? 'bg-accent-500/15 text-slate-100 ring-1 ring-accent-500/30'
                              : 'text-slate-400 hover:bg-ink-800 hover:text-slate-200'
                          }`}
                        >
                          <span className="font-mono text-[9px] text-slate-600">
                            {String(chapter.order).padStart(2, '0')}
                          </span>
                          <span className="flex-1 truncate text-[11px]">{chapter.title}</span>
                          {chapter.summary.trim() ? (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                              title="已有章纲"
                            />
                          ) : (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600"
                              title="未写章纲"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {grouped.length === 0 && (
              <div className="px-3 py-8 text-center text-[11px] text-slate-600">没有匹配的章节</div>
            )}
          </div>
        </aside>

        {/* 右:章纲 + 存稿 */}
        <section className="min-w-0 flex-1 overflow-y-auto">
          {selected ? (
            <div className="mx-auto max-w-3xl px-6 py-6">
              {/* 章标题路径 */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                {selected.volume.title}
                <ChevronRight size={10} />
                {selected.unit.title}
                <ChevronRight size={10} />
                <span className="text-slate-300">{selected.chapter.title}</span>
                <span className={`ml-auto chip ${SCENE_STATUS_META[selected.chapter.status].color} bg-ink-800`}>
                  {SCENE_STATUS_META[selected.chapter.status].label}
                </span>
              </div>

              {/* 章纲 */}
              <div className="mt-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                  <ScrollText size={12} className="text-sky-400" />
                  章纲
                  <span className="text-[9px] font-normal text-slate-600">
                    这一章要发生什么,写给未来的自己看
                  </span>
                </div>
                <textarea
                  value={selected.chapter.summary}
                  onChange={(e) => updateChapterMeta(selected.chapter.id, { summary: e.target.value })}
                  rows={7}
                  placeholder={
                    '例:\n开场:沈墨尘在藏剑阁外排队,被同门嘲讽。\n推进:择剑大典开启,满阁仙剑无一人择主。\n转折:他踏入剑阁,无名古剑自行出鞘。\n落点:万剑俯首,长老震怒,苏晚晴出手护他。'
                  }
                  className="codex-textarea mt-2 !min-h-40"
                />
              </div>

              {/* 存稿 */}
              <div className="mt-6">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                  <FileText size={12} className="text-accent-400" />
                  存稿
                  <span className="text-[9px] font-normal text-slate-600">
                    {selected.chapter.scenes.length} 个场景 ·{' '}
                    {selected.chapter.scenes.reduce((n, s) => n + s.wordCount, 0).toLocaleString()} 字
                  </span>
                </div>

                <div className="mt-2 space-y-2">
                  {selected.chapter.scenes.map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => {
                        setActiveScene(scene.id);
                        setWorkspace('write');
                      }}
                      className="group w-full rounded-xl border border-ink-700/50 bg-ink-850/60 p-3 text-left transition-all hover:border-accent-500/40 hover:bg-ink-850"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-600">
                          {String(scene.order).padStart(2, '0')}
                        </span>
                        <span className="flex-1 truncate text-xs font-semibold text-slate-200 group-hover:text-accent-300">
                          {scene.title}
                        </span>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SCENE_STATUS_META[scene.status].dot}`} />
                        <span className="shrink-0 font-mono text-[10px] text-slate-600">
                          {scene.wordCount.toLocaleString()} 字
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                        {scene.content.replace(/\s+/g, ' ').slice(0, 120) || scene.summary || '尚未开始写作…'}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">
                        <PenSquare size={10} />
                        点击进入写作
                      </div>
                    </button>
                  ))}

                  {selected.chapter.scenes.length === 0 && (
                    <div className="rounded-xl border border-dashed border-ink-700/50 bg-ink-900/30 px-4 py-6 text-center text-[11px] text-slate-600">
                      本章还没有场景,可在 Plan 大纲视图中新增
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-600">
              <ScrollText size={36} className="opacity-30" />
              <p className="text-sm">从左侧选择一章,开始写章纲</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

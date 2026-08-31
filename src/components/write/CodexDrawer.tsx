import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Link2, Search, SearchCheck, X } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { CODEX_TYPE_META, type CodexEntry } from '../../types';
import { CARD_KEY_FIELDS, CODEX_TEMPLATES } from '../../data/codexTemplates';
import { formatFieldValue } from '../codex/CodexFieldInput';
import CodexAvatar from '../codex/CodexAvatar';

/**
 * Write 页右侧 Codex 抽屉:
 *  - 正文提及检测:自动找出场景正文中提到的档案
 *  - 上下文相关:通过 POV/地点/标签启发式匹配
 *  - 全文检索
 */
export default function CodexDrawer() {
  const project = useProjectStore((s) => s.project);
  const scene = useProjectStore((s) =>
    s.project.chapters.flatMap((c) => c.scenes).find((sc) => sc.id === s.activeSceneId)
  );
  const setCodexDrawerOpen = useUIStore((s) => s.setCodexDrawerOpen);
  const setWorkspace = useUIStore((s) => s.setWorkspace);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // 1) 正文提及:按档案名扫描场景正文
  const mentionedIds = useMemo(() => {
    const set = new Set<string>();
    const text = scene?.content ?? '';
    if (!text) return set;
    project.codex.forEach((e) => {
      // 多字档案名优先匹配,避免短名误报
      if (e.name.length >= 2 && text.includes(e.name)) set.add(e.id);
    });
    return set;
  }, [scene, project.codex]);

  // 2) 上下文相关:通过 POV/地点/标签匹配
  const contextIds = useMemo(() => {
    if (!scene) return new Set<string>();
    const set = new Set<string>();
    project.codex.forEach((e) => {
      const haystack = `${e.name}${e.summary}${e.tags.join('')}${e.fields ? Object.values(e.fields).join('') : ''}`;
      if (
        (scene.pov && haystack.includes(scene.pov)) ||
        (scene.location && haystack.includes(scene.location)) ||
        e.tags.some((t) => scene.labels.includes(t))
      ) {
        set.add(e.id);
      }
    });
    return set;
  }, [scene, project.codex]);

  // 3) 搜索
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return project.codex.filter(
      (e) =>
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [project.codex, query]);

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-ink-700/60 bg-ink-900/60">
      {/* 头部 */}
      <div className="flex items-center gap-2 border-b border-ink-700/50 px-3.5 py-2.5">
        <BookOpen size={14} className="text-gold" />
        <span className="text-xs font-semibold text-slate-200">Codex · 世界档案</span>
        <button
          onClick={() => setCodexDrawerOpen(false)}
          className="ml-auto rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-slate-200"
        >
          <X size={14} />
        </button>
      </div>

      {/* 搜索 */}
      <div className="px-3.5 py-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索角色、地点、物品…"
            className="input-dark !py-1.5 !pl-7 text-[11px]"
          />
        </div>
      </div>

      {/* 正文提及区 */}
      {!query && scene && mentionedIds.size > 0 && (
        <div className="mx-3.5 mb-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
            <SearchCheck size={12} />
            本场景正文提到 {mentionedIds.size} 条档案
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {project.codex
              .filter((e) => mentionedIds.has(e.id))
              .map((e) => (
                <button
                  key={e.id}
                  onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  className="rounded-md bg-ink-800 px-1.5 py-0.5 text-[10px] text-slate-300 ring-1 ring-ink-700/60 transition-colors hover:text-emerald-300 hover:ring-emerald-500/40"
                >
                  {e.name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* 档案列表 */}
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
        {list.map((entry) => (
          <CodexCard
            key={entry.id}
            entry={entry}
            entries={project.codex}
            related={contextIds.has(entry.id) || mentionedIds.has(entry.id)}
            mentioned={mentionedIds.has(entry.id)}
            expanded={expanded === entry.id}
            onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)}
          />
        ))}
      </div>

      {/* 底部 */}
      <div className="border-t border-ink-700/50 p-2.5">
        <button
          onClick={() => {
            setCodexDrawerOpen(false);
            setWorkspace('codex');
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-ink-700/70 py-2 text-[11px] text-slate-400 transition-colors hover:border-accent-500/40 hover:text-accent-300"
        >
          打开完整 Codex 工作台
          <ArrowRight size={12} />
        </button>
      </div>
    </aside>
  );
}

function CodexCard({
  entry,
  entries,
  related,
  mentioned,
  expanded,
  onToggle,
}: {
  entry: CodexEntry;
  entries: CodexEntry[];
  related: boolean;
  mentioned: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = CODEX_TYPE_META[entry.type];
  const keyFields = CARD_KEY_FIELDS[entry.type]
    .map((fid) => {
      const def = CODEX_TEMPLATES[entry.type].find((f) => f.id === fid);
      if (!def) return null;
      const text = formatFieldValue(def, entry.fields?.[fid], entries);
      return text ? { label: def.label, text } : null;
    })
    .filter(Boolean) as { label: string; text: string }[];

  return (
    <div
      className={`rounded-lg border p-2.5 transition-all ${
        mentioned
          ? 'border-emerald-500/40 bg-emerald-500/[0.05]'
          : related
            ? 'border-accent-500/40 bg-accent-500/[0.07]'
            : 'border-ink-700/50 bg-ink-850/70'
      }`}
    >
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-start gap-2">
          <CodexAvatar
            entry={entry}
            size={34}
            rounded={entry.type === 'character' ? 'full' : 'lg'}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className="rounded px-1 py-px text-[9px] font-semibold text-ink-950"
                style={{ background: meta.color }}
              >
                {meta.label}
              </span>
              {mentioned && (
                <span className="rounded bg-emerald-500/20 px-1 py-px text-[9px] text-emerald-300">正文提及</span>
              )}
              {!mentioned && related && (
                <span className="rounded bg-accent-500/20 px-1 py-px text-[9px] text-accent-300">场景相关</span>
              )}
              {entry.relatedIds.length > 0 && (
                <span className="ml-auto flex items-center gap-0.5 text-[9px] text-slate-600">
                  <Link2 size={9} />
                  {entry.relatedIds.length}
                </span>
              )}
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-100">{entry.name}</div>
            {entry.title && <div className="text-[10px] text-slate-500">{entry.title}</div>}
            {keyFields.length > 0 && (
              <div className="mt-1 text-[10px] leading-relaxed text-slate-500">
                {keyFields.map((f) => (
                  <span key={f.label}>
                    <span className="text-slate-600">{f.label}:</span> {f.text}
                    {f !== keyFields[keyFields.length - 1] && ' · '}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-500">{entry.summary}</p>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-2 border-t border-ink-700/40 pt-2 text-[10px] leading-relaxed text-slate-400 animate-fade-in">
          {entry.details || '暂无详细描述'}
          {entry.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {entry.tags.map((t) => (
                <span key={t} className="rounded bg-ink-800 px-1 py-px text-[9px] text-slate-500 ring-1 ring-ink-700/40">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

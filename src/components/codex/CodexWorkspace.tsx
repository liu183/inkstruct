import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookMarked, ChevronDown, FilePlus2, Link2, Network, Plus, Route,
  Search, Trash2, Clock3, Upload,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { CODEX_TYPE_META, type CodexType, type CodexEntry } from '../../types';
import { CARD_KEY_FIELDS, CODEX_TEMPLATES } from '../../data/codexTemplates';
import { fileToDataURL } from '../../utils/imageUtils';
import { CodexFieldInput, formatFieldValue } from './CodexFieldInput';
import CodexAvatar, { CodexAvatarPlaceholder } from './CodexAvatar';

const TYPES: (CodexType | 'all')[] = ['all', 'character', 'location', 'item', 'event', 'faction', 'lore', 'storyline'];

/** 角色用圆形头像,地点/物品/势力等用圆角方形,视觉上区分"人"与"物" */
function avatarShape(entry: CodexEntry) {
  return entry.type === 'character' ? ('full' as const) : ('lg' as const);
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function CodexWorkspace() {
  const project = useProjectStore((s) => s.project);
  const updateCodex = useProjectStore((s) => s.updateCodex);
  const updateCodexField = useProjectStore((s) => s.updateCodexField);
  const addCodexEntry = useProjectStore((s) => s.addCodexEntry);
  const deleteCodexEntry = useProjectStore((s) => s.deleteCodexEntry);

  const [filter, setFilter] = useState<CodexType | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(project.codex[0]?.id ?? null);
  const [newOpen, setNewOpen] = useState(false);

  const selected = project.codex.find((e) => e.id === selectedId) ?? null;

  // 删除当前选中后自动选择相邻档案
  useEffect(() => {
    if (!selected && project.codex.length > 0 && selectedId) {
      setSelectedId(project.codex[0].id);
    }
  }, [selected, selectedId, project.codex]);

  const list = useMemo(
    () =>
      project.codex.filter(
        (e) =>
          (filter === 'all' || e.type === filter) &&
          (!query.trim() ||
            e.name.toLowerCase().includes(query.toLowerCase()) ||
            e.summary.toLowerCase().includes(query.toLowerCase()) ||
            e.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())))
      ),
    [project.codex, filter, query]
  );

  const countBy = (t: CodexType | 'all') =>
    t === 'all' ? project.codex.length : project.codex.filter((e) => e.type === t).length;

  const stats = useMemo(() => {
    const links = project.codex.reduce((n, e) => n + e.relatedIds.length, 0);
    const reverseLinks = project.codex.filter((e) => e.fields && Object.keys(e.fields).length).length;
    return { links, reverseLinks };
  }, [project.codex]);

  const createEntry = (type: CodexType) => {
    const id = addCodexEntry(type);
    setNewOpen(false);
    setSelectedId(id);
    setFilter(type); // 切换过滤,确保新档案立即可见
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ===== 头部 ===== */}
      <div className="border-b border-ink-700/60 bg-gradient-to-r from-ink-900 via-ink-850 to-ink-900 px-5 py-4">
        <div className="flex items-center gap-3">
          <BookMarked size={18} className="text-gold" />
          <h1 className="text-lg font-semibold text-slate-100">世界档案库 Codex</h1>
          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="font-mono text-xs font-semibold text-slate-300">{project.codex.length}</span> 条档案
            </span>
            <span className="flex items-center gap-1">
              <span className="font-mono text-xs font-semibold text-slate-300">{stats.links}</span> 条引用
            </span>
            <span className="hidden items-center gap-1 xl:flex">
              <span className="font-mono text-xs font-semibold text-slate-300">{Object.keys(CODEX_TYPE_META).length}</span> 种类型
            </span>
          </div>

          {/* 新建档案 */}
          <div className="relative ml-auto">
            <button onClick={() => setNewOpen((o) => !o)} className="btn-primary">
              <Plus size={14} />
              新建档案
              <ChevronDown size={12} className={`transition-transform ${newOpen ? 'rotate-180' : ''}`} />
            </button>
            {newOpen && (
              <div className="absolute right-0 top-full z-40 mt-1.5 w-44 overflow-hidden rounded-xl border border-ink-600 bg-ink-850 py-1 shadow-2xl animate-slide-up">
                {TYPES.filter((t) => t !== 'all').map((t) => (
                  <button
                    key={t}
                    onClick={() => createEntry(t)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] text-slate-300 transition-colors hover:bg-ink-800"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: CODEX_TYPE_META[t].color }} />
                    <span className="flex-1 font-medium">{CODEX_TYPE_META[t].label}</span>
                    <span className="text-[9px] text-slate-600">{CODEX_TYPE_META[t].desc.split(',')[0]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          类型化字段 + 引用关系管理人物、地点、物品与世界观,让设定不再散落各处
        </p>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* ===== 左:档案列表 ===== */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-ink-700/60 bg-ink-900/40">
          {/* 类型 tabs */}
          <div className="flex flex-wrap items-center gap-1 border-b border-ink-700/50 px-3 py-2">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                filter === 'all' ? 'bg-ink-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              全部 {countBy('all')}
            </button>
            {TYPES.filter((t) => t !== 'all').map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                  filter === t ? 'bg-ink-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: CODEX_TYPE_META[t].color }} />
                {CODEX_TYPE_META[t].label}
                <span className="opacity-50">{countBy(t)}</span>
              </button>
            ))}
          </div>

          {/* 搜索 */}
          <div className="px-3 py-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索名称、摘要、标签…"
                className="input-dark !py-1.5 !pl-7"
              />
            </div>
          </div>

          {/* 卡片列表 */}
          <div className="flex-1 space-y-1.5 overflow-y-auto px-2 pb-3">
            {list.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                entries={project.codex}
                active={entry.id === selectedId}
                onClick={() => setSelectedId(entry.id)}
              />
            ))}
            {list.length === 0 && (
              <div className="px-3 py-8 text-center text-[11px] text-slate-600">暂无匹配档案</div>
            )}
          </div>
        </aside>

        {/* ===== 右:详情编辑器 ===== */}
        <section className="min-w-0 flex-1 overflow-y-auto">
          {selected ? (
            <EntryDetail
              key={selected.id}
              entry={selected}
              entries={project.codex}
              onChange={(patch) => updateCodex(selected.id, patch)}
              onField={updateCodexField}
              onDelete={() => {
                deleteCodexEntry(selected.id);
                setSelectedId(null);
              }}
              onJump={(id) => setSelectedId(id)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-600">
              <Network size={36} className="opacity-30" />
              <p className="text-sm">从左侧选择一条档案,或点击「新建档案」开始构建世界观</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ============ 列表卡片 ============ */

function EntryCard({
  entry,
  entries,
  active,
  onClick,
}: {
  entry: CodexEntry;
  entries: CodexEntry[];
  active: boolean;
  onClick: () => void;
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
    <button
      onClick={onClick}
      className={`group w-full rounded-lg border p-2.5 text-left transition-all ${
        active
          ? 'border-accent-500/50 bg-accent-500/[0.08] shadow-glow'
          : 'border-ink-700/50 bg-ink-850/70 hover:border-ink-600 hover:bg-ink-850'
      }`}
    >
      <div className="flex items-start gap-2">
        <CodexAvatar entry={entry} size={36} rounded={avatarShape(entry)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-semibold text-slate-100">{entry.name}</span>
            <span className="ml-auto shrink-0 text-[9px] font-medium" style={{ color: meta.color }}>
              {meta.label}
            </span>
          </div>
          {keyFields.length > 0 && (
            <div className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
              {keyFields.map((f) => (
                <span key={f.label}>
                  <span className="text-slate-600">{f.label}:</span> {f.text}
                </span>
              ))}
            </div>
          )}
          <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-600">{entry.summary}</p>
          {entry.relatedIds.length > 0 && (
            <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-600">
              <Link2 size={9} />
              {entry.relatedIds.length} 条关联
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/* ============ 详情编辑器 ============ */

function EntryDetail({
  entry,
  entries,
  onChange,
  onField,
  onDelete,
  onJump,
}: {
  entry: CodexEntry;
  entries: CodexEntry[];
  onChange: (patch: Partial<CodexEntry>) => void;
  onField: (entryId: string, fieldId: string, value: CodexEntry['fields'][string]) => void;
  onDelete: () => void;
  onJump: (id: string) => void;
}) {
  const meta = CODEX_TYPE_META[entry.type];
  const template = CODEX_TEMPLATES[entry.type];

  // 双向关系:本档案引用 + 被谁引用
  const backward = useMemo(
    () =>
      entries.filter(
        (e) => e.id !== entry.id && e.relatedIds.includes(entry.id)
      ),
    [entries, entry.id]
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      {/* 头部:参考图 + 类型 + 名称 + 操作 */}
      <div className="flex items-start gap-4">
        {/* 参考图:上传后作为头像展示 */}
        <AvatarUploader entry={entry} onImage={(image) => onChange({ image })} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="shrink-0 rounded-md px-2 py-1 text-[11px] font-bold text-ink-950"
              style={{ background: meta.color }}
            >
              {meta.label}
            </span>
            <input
              value={entry.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="min-w-0 flex-1 bg-transparent font-serif text-2xl font-semibold text-slate-100 outline-none placeholder:text-slate-600"
              placeholder="档案名称"
            />
          </div>
          <input
            value={entry.title ?? ''}
            onChange={(e) => onChange({ title: e.target.value })}
            className="mt-0.5 w-full bg-transparent text-xs text-slate-500 outline-none placeholder:text-slate-700"
            placeholder="副标题 / 定位(可选)"
          />
        </div>
        <div className="flex shrink-0 items-center gap-1 pt-1">
          <span className="flex items-center gap-1 rounded-md bg-ink-800 px-2 py-1 text-[9px] text-slate-600 ring-1 ring-ink-700/50">
            <Clock3 size={10} />
            更新 {fmtTime(entry.updatedAt)}
          </span>
          <button
            onClick={onDelete}
            title="删除档案"
            className="rounded-md p-1.5 text-slate-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* 摘要 */}
      <textarea
        value={entry.summary}
        onChange={(e) => onChange({ summary: e.target.value })}
        placeholder="一句话摘要:ta 是谁 / 这是什么,用于快速检索…"
        rows={2}
        className="mt-3 w-full resize-none rounded-xl border border-ink-700 bg-ink-900/70 px-3 py-2 text-xs leading-relaxed text-slate-300 outline-none transition-colors placeholder:text-slate-600 focus:border-accent-500/50"
      />

      {/* 结构化字段 */}
      <div className="mt-5">
        <SectionTitle icon={<FilePlus2 size={12} />} title={`结构化档案 · ${template.length} 个字段`} hint="字段已按类型模板定制,AI 写作时优先参考" />
        <div className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
          {template.map((def) => (
            <div key={def.id} className={def.full ? 'md:col-span-2' : ''}>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {def.label}
              </label>
              <CodexFieldInput
                def={def}
                value={entry.fields?.[def.id] ?? (def.multi ? [] : '')}
                entries={entries}
                onChange={(v) => onField(entry.id, def.id, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 故事线专属:走向时间轴(起点 → 关键节点 → 收束) */}
      {entry.type === 'storyline' && (
        <div className="mt-6">
          <SectionTitle icon={<Route size={12} />} title="故事线走向" hint="在「关键节点」字段回车添加节点" />
          <div className="mt-2.5 rounded-xl border border-ink-700/60 bg-ink-900/50 p-4">
            <StorylineTimeline entry={entry} />
          </div>
        </div>
      )}

      {/* 详细描述 */}
      <div className="mt-6">
        <SectionTitle icon={<BookMarked size={12} />} title="详细描述" hint="自由发挥,存放完整设定文本" />
        <textarea
          value={entry.details}
          onChange={(e) => onChange({ details: e.target.value })}
          rows={6}
          placeholder="在这里撰写完整的背景设定、外貌描写、剧情作用…"
          className="codex-textarea mt-2.5 !min-h-28"
        />
      </div>

      {/* 标签 */}
      <div className="mt-6">
        <SectionTitle icon={<BookMarked size={12} />} title="标签" hint="用于检索与场景联动" />
        <div className="mt-2.5">
          <CodexFieldInput
            def={{ id: 'tags', label: '标签', type: 'tags', placeholder: '输入标签后回车…' }}
            value={entry.tags}
            entries={entries}
            onChange={(v) => onChange({ tags: Array.isArray(v) ? v : [] })}
          />
        </div>
      </div>

      {/* 关系面板 */}
      <div className="mt-6 rounded-xl border border-ink-700/60 bg-ink-900/50 p-4">
        <SectionTitle icon={<Network size={13} />} title="关系网络" hint={`${entry.relatedIds.length} 出 · ${backward.length} 入`} />

        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1.5 text-[10px] font-semibold text-slate-500">此档案引用 (出向)</div>
            {entry.relatedIds.length === 0 ? (
              <p className="text-[10px] text-slate-700">暂无引用,在上方字段中选择关联档案</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {entry.relatedIds.map((rid) => {
                  const e = entries.find((x) => x.id === rid);
                  if (!e) return null;
                  return (
                    <button
                      key={rid}
                      onClick={() => onJump(rid)}
                      className="group flex items-center gap-1 rounded-lg border border-ink-700/60 bg-ink-850 px-2 py-1 text-[10px] text-slate-300 transition-colors hover:border-accent-500/40 hover:text-accent-300"
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: CODEX_TYPE_META[e.type].color }} />
                      {e.name}
                      <span className="text-[8px] text-slate-600">{CODEX_TYPE_META[e.type].label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-semibold text-slate-500">被谁引用 (入向)</div>
            {backward.length === 0 ? (
              <p className="text-[10px] text-slate-700">暂无档案引用本条目</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {backward.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onJump(e.id)}
                    className="group flex items-center gap-1 rounded-lg border border-ink-700/60 bg-ink-850 px-2 py-1 text-[10px] text-slate-300 transition-colors hover:border-accent-500/40 hover:text-accent-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: CODEX_TYPE_META[e.type].color }} />
                    {e.name}
                    <span className="text-[8px] text-slate-600">{CODEX_TYPE_META[e.type].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
      <span className="text-accent-400/80">{icon}</span>
      {title}
      {hint && <span className="ml-1 text-[9px] font-normal text-slate-600">{hint}</span>}
    </div>
  );
}

/* ============ 参考图上传(头像) ============ */

function AvatarUploader({
  entry,
  onImage,
}: {
  entry: CodexEntry;
  onImage: (dataUrl: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const setStatusMessage = useUIStore((s) => s.setStatusMessage);
  const [busy, setBusy] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await fileToDataURL(file);
      onImage(url);
      setStatusMessage(`已为「${entry.name || '档案'}」设置参考图`);
    } catch (e) {
      setStatusMessage(e instanceof Error ? e.message : '图片处理失败');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <div className="group relative">
        {entry.image ? (
          <CodexAvatar entry={entry} size={88} rounded={avatarShape(entry)} />
        ) : (
          <CodexAvatarPlaceholder size={88} />
        )}
        <button
          onClick={() => inputRef.current?.click()}
          title="上传参考图"
          className="absolute inset-0 flex items-center justify-center rounded-full bg-ink-950/70 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Upload size={17} className="text-slate-200" />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => inputRef.current?.click()}
          className="text-[9px] text-accent-300 transition-colors hover:text-accent-200"
        >
          {busy ? '处理中…' : entry.image ? '更换参考图' : '上传参考图'}
        </button>
        {entry.image && (
          <button
            onClick={() => onImage(undefined)}
            className="text-[9px] text-slate-600 transition-colors hover:text-red-400"
          >
            移除
          </button>
        )}
      </div>
    </div>
  );
}

/* ============ 故事线走向时间轴 ============ */

function StorylineTimeline({ entry }: { entry: CodexEntry }) {
  const color = CODEX_TYPE_META.storyline.color;
  const beats = Array.isArray(entry.fields?.beats) ? (entry.fields.beats as string[]) : [];
  const start = String(entry.fields?.start ?? '');
  const end = String(entry.fields?.end ?? '');

  return (
    <div className="relative pl-5">
      <div className="absolute bottom-2 left-[7px] top-2 w-px" style={{ background: `${color}3d` }} />
      <TimelineNode color={color} label="起点" text={start || '未填写起点'} dim={!start} />
      {beats.length === 0 ? (
        <TimelineNode color={color} label="关键节点" text="在上方「关键节点」字段回车添加" dim />
      ) : (
        beats.map((b, i) => (
          <TimelineNode key={i} color={color} label={`节点 ${i + 1}`} text={b} />
        ))
      )}
      <TimelineNode color={color} label="收束" text={end || '未填写终点'} dim={!end} />
    </div>
  );
}

function TimelineNode({
  color,
  label,
  text,
  dim,
}: {
  color: string;
  label: string;
  text: string;
  dim?: boolean;
}) {
  return (
    <div className="relative mb-3 last:mb-0">
      <span
        className="absolute -left-5 top-[5px] h-[9px] w-[9px] rounded-full"
        style={{ background: dim ? '#475569' : color, boxShadow: `0 0 0 3px ${dim ? '#47556922' : `${color}22`}` }}
      />
      <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: dim ? '#64748b' : color }}>
        {label}
      </div>
      <div className={`mt-0.5 text-[11px] leading-relaxed ${dim ? 'italic text-slate-600' : 'text-slate-300'}`}>
        {text}
      </div>
    </div>
  );
}

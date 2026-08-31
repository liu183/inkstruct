import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Link2, Plus, Search, X } from 'lucide-react';
import type { CodexEntry, CodexFieldDef, CodexFieldValue } from '../../types';
import { CODEX_TYPE_META } from '../../types';

/** 根据字段定义与值,渲染对应的专业输入控件 */
export function CodexFieldInput({
  def,
  value,
  entries,
  onChange,
}: {
  def: CodexFieldDef;
  value: CodexFieldValue;
  entries: CodexEntry[];
  onChange: (v: CodexFieldValue) => void;
}) {
  switch (def.type) {
    case 'text':
      return (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
          className="codex-input"
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value={typeof value === 'number' ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="codex-input"
        />
      );
    case 'textarea':
      return (
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
          rows={def.full ? 4 : 2}
          className="codex-textarea"
        />
      );
    case 'select':
      return (
        <div className="relative">
          <select
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            className="codex-input appearance-none pr-7"
          >
            <option value="">未设置</option>
            {def.options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-600" />
        </div>
      );
    case 'tags':
      return <TagsInput value={value} onChange={onChange} placeholder={def.placeholder} />;
    case 'ref':
      return <RefPicker def={def} value={value} entries={entries} onChange={onChange} />;
    default:
      return null;
  }
}

/** 标签编辑器:回车/逗号添加,点击删除 */
function TagsInput({
  value,
  onChange,
  placeholder,
}: {
  value: CodexFieldValue;
  onChange: (v: CodexFieldValue) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const tags = Array.isArray(value) ? (value as string[]) : [];

  const add = (raw: string) => {
    const t = raw.trim();
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-900 px-2 py-1.5 focus-within:border-accent-500/50">
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 rounded-md bg-accent-500/10 px-1.5 py-0.5 text-[10px] text-accent-300 ring-1 ring-accent-500/25">
          {t}
          <button
            onClick={() => onChange(tags.filter((x) => x !== t))}
            className="text-accent-400/60 hover:text-red-400"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(input);
            setInput('');
          }
        }}
        onBlur={() => {
          if (input.trim()) add(input);
          setInput('');
        }}
        placeholder={tags.length === 0 ? placeholder : '添加…'}
        className="min-w-16 flex-1 bg-transparent text-[11px] text-slate-200 outline-none placeholder:text-slate-600"
      />
    </div>
  );
}

/** 关联引用选择器:从其他档案中选取关联对象 */
function RefPicker({
  def,
  value,
  entries,
  onChange,
}: {
  def: CodexFieldDef;
  value: CodexFieldValue;
  entries: CodexEntry[];
  onChange: (v: CodexFieldValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const selected: string[] = def.multi
    ? Array.isArray(value)
      ? (value as string[])
      : []
    : typeof value === 'string' && value
      ? [value]
      : [];

  const candidates = entries.filter(
    (e) => (!def.refTypes || def.refTypes.includes(e.type)) && e.id !== selected[0]
  );
  const filtered = candidates.filter((e) => !q.trim() || e.name.toLowerCase().includes(q.toLowerCase()));

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      if (!rootRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const toggle = (id: string) => {
    if (def.multi) {
      const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
      onChange(next);
    } else {
      onChange(id);
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} data-ref-picker className="relative">
      {/* 已选 chips / 触发器 */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="codex-input flex w-full items-center gap-1.5 text-left"
      >
        <Link2 size={12} className="shrink-0 text-slate-500" />
        {selected.length === 0 ? (
          <span className="text-slate-600">{def.placeholder ?? '选择关联档案'}</span>
        ) : (
          <span className="flex flex-1 flex-wrap gap-1">
            {selected.map((id) => {
              const e = entries.find((x) => x.id === id);
              if (!e) return null;
              return (
                <span
                  key={id}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-slate-200 ring-1 ring-ink-600"
                  style={{ background: `${CODEX_TYPE_META[e.type].color}1f` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: CODEX_TYPE_META[e.type].color }} />
                  {e.name}
                </span>
              );
            })}
          </span>
        )}
        <ChevronDown size={12} className={`ml-auto shrink-0 text-slate-600 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-lg border border-ink-600 bg-ink-850 shadow-2xl animate-slide-up">
          <div className="relative border-b border-ink-700/60 px-2 py-1.5">
            <Search size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索档案…"
              className="w-full bg-transparent py-0.5 pl-5 text-[11px] text-slate-200 outline-none placeholder:text-slate-600"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-[10px] text-slate-600">没有可关联的档案</div>
            )}
            {filtered.map((e) => {
              const isSel = selected.includes(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => toggle(e.id)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-colors ${
                    isSel ? 'bg-accent-500/10 text-slate-100' : 'text-slate-400 hover:bg-ink-800'
                  }`}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: CODEX_TYPE_META[e.type].color }} />
                  <span className="flex-1 truncate">{e.name}</span>
                  <span className="text-[9px] text-slate-600">{CODEX_TYPE_META[e.type].label}</span>
                  {isSel && <Check size={12} className="shrink-0 text-accent-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** 将字段值格式化为展示文本(用于卡片摘要/详情展示) */
export function formatFieldValue(def: CodexFieldDef, value: CodexFieldValue, entries: CodexEntry[]): string {
  if (value === undefined || value === null || value === '') return '';
  if (def.type === 'ref') {
    const ids = Array.isArray(value) ? (value as string[]) : [value as string];
    const names = ids.map((id) => entries.find((e) => e.id === id)?.name).filter(Boolean);
    return names.length ? names.join('、') : '';
  }
  if (def.type === 'tags') {
    const arr = Array.isArray(value) ? value : [];
    return arr.length ? arr.join('、') : '';
  }
  return String(value);
}

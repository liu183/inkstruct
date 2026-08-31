import { useState } from 'react';
import {
  BookmarkPlus, BookmarkCheck, ChevronDown, Copy, FilePlus2,
  Lightbulb, Link2, Sparkles, Trash2, Users,
} from 'lucide-react';
import type { InspirationCard as Card } from '../../types';
import { ARC_ROLE_META, INSPIRATION_TYPE_META } from '../../types';

interface Props {
  card: Card;
  /** draw=抽卡区 / pool=灵感池 */
  mode: 'draw' | 'pool';
  saved?: boolean;
  onToggleSave?: () => void;
  onRemove?: () => void;
  onAdopt?: () => void;
  expandedByDefault?: boolean;
}

export default function InspirationCardView({
  card,
  mode,
  saved,
  onToggleSave,
  onRemove,
  onAdopt,
  expandedByDefault,
}: Props) {
  const meta = INSPIRATION_TYPE_META[card.type];
  const arcMeta = card.arcRole ? ARC_ROLE_META[card.arcRole] : undefined;
  const [expanded, setExpanded] = useState(!!expandedByDefault);
  const [showOpen, setShowOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const big = card.type === 'title' ? card.hook : card.title;
  const sub = card.type === 'title' ? undefined : card.hook;

  const copy = async () => {
    const text = [
      card.title,
      card.hook,
      card.protagonist && `主角:${card.protagonist}`,
      card.conflict && `冲突:${card.conflict}`,
      card.openAction && `开篇: ${card.openAction}`,
      card.tips.length ? card.tips.join('\n') : '',
    ].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* 静默 */
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-ink-700/60 bg-ink-850/70 p-3.5 transition-all hover:border-ink-600">
      {/* 顶部:类型 + 题材 + 弧位 + 操作 */}
      <div className="flex items-center gap-1.5">
        <span
          className="rounded px-1.5 py-px text-[9px] font-bold text-ink-950"
          style={{ background: meta.color }}
        >
          {meta.label}
        </span>
        {card.genre && (
          <span className="rounded bg-ink-700/80 px-1 py-px text-[9px] text-slate-400 ring-1 ring-ink-600/60">
            {card.genre}
          </span>
        )}
        {arcMeta && (
          <span
            className="rounded px-1.5 py-px text-[9px] font-bold text-ink-950"
            style={{ background: arcMeta.color }}
            title={`故事弧位:${arcMeta.desc}`}
          >
            {arcMeta.label}
          </span>
        )}
        {card.source === 'manual' ? (
          <span className="rounded bg-sky-500/15 px-1 py-px text-[9px] text-sky-300 ring-1 ring-sky-500/30">手记</span>
        ) : (
          <span className="text-[9px] text-slate-600">AI</span>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <button
            title="复制卡片(含主角/冲突/开篇)"
            onClick={copy}
            className="rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-slate-200"
          >
            {copied ? <BookmarkCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
          {mode === 'draw' && onToggleSave && (
            <button
              title={saved ? '已收藏到灵感池' : '收藏到灵感池'}
              onClick={onToggleSave}
              className={`rounded p-1 transition-colors ${
                saved ? 'text-amber-300' : 'text-slate-500 hover:bg-ink-700 hover:text-amber-300'
              }`}
            >
              <BookmarkPlus size={12} />
            </button>
          )}
          {mode === 'pool' && onRemove && (
            <button
              title="从灵感池移除"
              onClick={onRemove}
              className="rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* 标题 + 钩子 */}
      <div className="mt-2 text-sm font-semibold leading-snug text-slate-100">{big}</div>
      {sub && <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{sub}</p>}

      {/* 结构化三栏:主角 / 冲突 */}
      {(card.protagonist || card.conflict) && (
        <div className="mt-2 grid grid-cols-1 gap-1.5">
          {card.protagonist && (
            <div className="flex items-start gap-1.5 rounded-md bg-ink-900/40 px-2 py-1">
              <Users size={10} className="mt-px shrink-0 text-pink-400" />
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">主角</div>
                <div className="truncate text-[10px] text-slate-300" title={card.protagonist}>
                  {card.protagonist}
                </div>
              </div>
            </div>
          )}
          {card.conflict && (
            <div className="flex items-start gap-1.5 rounded-md bg-ink-900/40 px-2 py-1">
              <Sparkles size={10} className="mt-px shrink-0 text-amber-400" />
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">冲突</div>
                <div className="text-[10px] leading-relaxed text-slate-300">{card.conflict}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 第一幕动作(可展开) */}
      {card.openAction && (
        <div className="mt-2">
          <button
            onClick={() => setShowOpen((v) => !v)}
            className="flex items-center gap-1 text-[9px] font-medium text-emerald-300 transition-colors hover:text-emerald-200"
          >
            <Lightbulb size={10} />
            {showOpen ? '收起开篇场景' : '展开开篇场景(可直接写)'}
            <ChevronDown size={10} className={`transition-transform ${showOpen ? 'rotate-180' : ''}`} />
          </button>
          {showOpen && (
            <div className="mt-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-2">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-emerald-300/70">开篇场景</div>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-300">{card.openAction}</p>
            </div>
          )}
        </div>
      )}

      {/* 关联档案 */}
      {card.codexRefs && card.codexRefs.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <Link2 size={10} className="text-accent-400/70" />
          {card.codexRefs.map((r) => (
            <span key={r} className="rounded bg-accent-500/10 px-1 py-px text-[9px] text-accent-300 ring-1 ring-accent-500/20">
              {r}
            </span>
          ))}
        </div>
      )}

      {/* 展开提示 */}
      {card.tips.length > 0 && (
        <div className="mt-auto">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-2 flex items-center gap-1 text-[9px] font-medium text-slate-600 transition-colors hover:text-accent-300"
          >
            <ChevronDown size={11} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? '收起展开思路' : '展开思路提示'}
          </button>
          {expanded && (
            <ul className="mt-1.5 space-y-1 rounded-lg bg-ink-900/60 p-2">
              {card.tips.map((t, i) => (
                <li key={i} className="flex gap-1.5 text-[10px] leading-relaxed text-slate-400">
                  <span className="shrink-0 text-accent-500/70">▸</span>
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 标签 */}
      <div className="mt-2.5 flex flex-wrap gap-1">
        {card.tags.map((t) => (
          <span key={t} className="rounded bg-ink-800 px-1 py-px text-[9px] text-slate-500 ring-1 ring-ink-700/40">
            #{t}
          </span>
        ))}
      </div>

      {/* 落笔按钮组:灵感 → Codex 档案 */}
      {onAdopt && (
        <div className="mt-2.5 flex flex-wrap gap-1 border-t border-ink-700/40 pt-2">
          <button
            title="转为 Codex 档案草稿 — 沉淀人物/地点/设定,供故事设计台引用"
            onClick={onAdopt}
            className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-300 ring-1 ring-amber-500/30 transition-all hover:bg-amber-500/20"
          >
            <FilePlus2 size={11} />
            → Codex
          </button>
          {mode === 'draw' && (
            <span className="ml-auto flex items-center text-[9px] text-slate-600">
              收藏后可在「故事设计」合成整体走向
            </span>
          )}
        </div>
      )}
    </div>
  );
}
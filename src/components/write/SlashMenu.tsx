import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckSquare, Eye, FileText, Heading, Lightbulb, List, Map, MapPin,
  Maximize, MessageSquare, Minimize, Minus, Package, Pen, RefreshCw,
  Sparkles, User, Wand2, Zap,
} from 'lucide-react';
import { SLASH_COMMANDS } from '../../data/commands';
import type { SlashCommand, CommandCategory } from '../../types';

const ICONS: Record<string, typeof Sparkles> = {
  pen: Pen, sparkles: Sparkles, message: MessageSquare, eye: Eye,
  lightbulb: Lightbulb, list: List, wand: Wand2, maximize: Maximize,
  minimize: Minimize, refresh: RefreshCw, 'file-text': FileText,
  heading: Heading, minus: Minus, 'check-square': CheckSquare,
  user: User, map: MapPin, package: Package, focus: Zap,
};

const CATEGORY_META: Record<CommandCategory, { label: string; color: string }> = {
  'ai-generate': { label: 'AI 生成', color: 'text-violet-300' },
  'ai-edit':     { label: 'AI 编辑', color: 'text-sky-300' },
  structure:     { label: '结构',   color: 'text-emerald-300' },
  codex:         { label: '档案',   color: 'text-amber-300' },
  view:          { label: '视图',   color: 'text-rose-300' },
};

interface Props {
  query: string;
  onSelect: (cmd: SlashCommand) => void;
  onClose: () => void;
}

export default function SlashMenu({ query, onSelect, onClose }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().replace('/', '');
    const list = q
      ? SLASH_COMMANDS.filter(
          (c) => c.keyword.includes(q) || c.label.includes(q) || c.description.includes(q)
        )
      : SLASH_COMMANDS;
    // 按分类分组展示
    const order: CommandCategory[] = ['ai-generate', 'ai-edit', 'structure', 'codex', 'view'];
    return order
      .map((cat) => ({ cat, items: list.filter((c) => c.category === cat) }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  const flat = useMemo(() => filtered.flatMap((g) => g.items), [filtered]);

  useEffect(() => setActiveIdx(0), [query]);

  // 键盘导航
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = flat[activeIdx];
        if (cmd) onSelect(cmd);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flat, activeIdx, onSelect, onClose]);

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (filtered.length === 0) {
    return (
      <div className="panel w-72 p-3 text-center text-xs text-slate-500">
        没有匹配的命令
      </div>
    );
  }

  return (
    <div data-slash-menu className="panel w-[340px] overflow-hidden shadow-2xl animate-slide-up">
      <div className="flex items-center gap-2 border-b border-ink-700/60 bg-ink-900/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <Sparkles size={12} className="text-accent-400" />
        AI 命令面板
        <span className="ml-auto font-normal normal-case text-slate-600">↑↓ 选择 · ↵ 执行 · Esc 关闭</span>
      </div>
      <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
        {filtered.map((group) => (
          <div key={group.cat}>
            <div className={`px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-wider ${CATEGORY_META[group.cat].color}`}>
              {CATEGORY_META[group.cat].label}
            </div>
            {group.items.map((cmd) => {
              const Icon = ICONS[cmd.icon] ?? Sparkles;
              const idx = flat.indexOf(cmd);
              const active = idx === activeIdx;
              return (
                <button
                  key={cmd.id}
                  data-active={active}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => onSelect(cmd)}
                  className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors ${
                    active ? 'bg-accent-500/15 text-slate-100' : 'text-slate-400'
                  }`}
                >
                  <Icon size={14} className={`shrink-0 ${active ? 'text-accent-300' : 'text-slate-500'}`} />
                  <span className="shrink-0 font-medium">{cmd.label}</span>
                  <span className="truncate text-[10px] text-slate-600">{cmd.description}</span>
                  {cmd.shortcut && (
                    <kbd className="ml-auto shrink-0 rounded bg-ink-700 px-1 py-0.5 font-mono text-[9px] text-slate-500">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

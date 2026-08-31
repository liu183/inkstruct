import {
  Expand, FilePen, ListPlus, Maximize, MessageSquarePlus,
  PenLine, Sparkles, WandSparkles, X, ZoomIn,
} from 'lucide-react';
import type { AIOutputState } from '../../hooks/useAIWriter';

export type ActionId = 'ai-continue' | 'ai-generate' | 'ai-dialogue' | 'ai-describe' | 'ai-polish' | 'ai-expand' | 'ai-beat' | 'ai-summarize';

interface Props {
  onRun: (actionId: ActionId) => void;
  ai: AIOutputState;
  onStop: () => void;
  onApply: (mode: 'append' | 'replace') => void;
  onDiscard: () => void;
}

const ACTIONS: { id: ActionId; label: string; icon: typeof Sparkles; desc: string; primary?: boolean }[] = [
  { id: 'ai-continue',  label: '续写',     icon: PenLine,          desc: '顺着当前内容继续写', primary: true },
  { id: 'ai-generate',  label: '生成',     icon: Sparkles,         desc: '生成场景正文' },
  { id: 'ai-dialogue',  label: '对话',     icon: MessageSquarePlus, desc: '生成角色对话' },
  { id: 'ai-describe',  label: '描写',     icon: ZoomIn,           desc: '生成环境/战斗描写' },
  { id: 'ai-polish',    label: '润色',     icon: WandSparkles,     desc: '提升文笔表现力' },
  { id: 'ai-expand',    label: '扩写',     icon: Maximize,         desc: '补充细节扩写' },
  { id: 'ai-beat',      label: '节拍',     icon: ListPlus,         desc: '生成节拍大纲' },
  { id: 'ai-summarize', label: '总结',     icon: FilePen,          desc: '生成场景摘要' },
];

export default function ActionBar({ onRun, ai, onStop, onApply, onDiscard }: Props) {
  if (ai.active) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-accent-500/40 bg-accent-500/10 px-3 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-400" />
        </span>
        <span className="text-xs font-medium text-accent-200">AI 正在{ai.commandLabel}…</span>
        <span className="font-mono text-[10px] text-accent-400/70">{ai.output.length} 字</span>
        <button onClick={onStop} className="btn ml-auto !px-2 !py-1 text-slate-300 hover:bg-ink-700">
          <X size={13} />
          停止
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.id}
            title={a.desc}
            onClick={() => onRun(a.id)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
              a.primary
                ? 'bg-accent-600 text-white shadow-glow hover:bg-accent-500'
                : 'border border-ink-700/70 bg-ink-850 text-slate-300 hover:border-accent-500/40 hover:text-accent-300'
            }`}
          >
            <Icon size={13} />
            {a.label}
          </button>
        );
      })}
      <span className="ml-1 flex items-center gap-1 rounded-md bg-ink-800 px-2 py-1 text-[10px] text-slate-600 ring-1 ring-ink-700/50">
        <Expand size={10} />
        在正文输入 <kbd className="rounded bg-ink-700 px-1 font-mono">/</kbd> 唤起更多 AI 命令
      </span>
    </div>
  );
}

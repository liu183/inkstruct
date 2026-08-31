import { ClipboardCheck, ClipboardCopy, PenSquare, Trash2 } from 'lucide-react';
import { useState } from 'react';

/**
 * AI 输出预览:插入正文(追加/替换)、复制、丢弃
 */
export default function CommandOutput({
  label,
  output,
  mode,
  onModeChange,
  onApply,
  onDiscard,
}: {
  label: string;
  output: string;
  mode: 'append' | 'replace';
  onModeChange: (m: 'append' | 'replace') => void;
  onApply: () => void;
  onDiscard: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* 静默 */
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-200">
        <PenSquare size={12} />
        {label}完成
        <button
          onClick={copy}
          className="ml-auto flex items-center gap-1 rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-slate-300 transition-colors hover:text-emerald-300"
        >
          {copied ? <ClipboardCheck size={10} /> : <ClipboardCopy size={10} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>

      <div className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-ink-950/50 p-2.5 text-[11px] leading-relaxed text-slate-300">
        {output}
      </div>

      {/* 应用方式 */}
      <div className="mt-2.5 flex items-center gap-1 text-[10px]">
        <span className="text-slate-500">应用方式</span>
        <button
          onClick={() => onModeChange('append')}
          className={`rounded px-1.5 py-0.5 transition-colors ${
            mode === 'append' ? 'bg-accent-500/20 text-accent-200' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          追加到末尾
        </button>
        <button
          onClick={() => onModeChange('replace')}
          className={`rounded px-1.5 py-0.5 transition-colors ${
            mode === 'replace' ? 'bg-accent-500/20 text-accent-200' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          替换全文
        </button>
      </div>

      <div className="mt-2 flex gap-1.5">
        <button onClick={onApply} className="btn-primary flex-1 !py-1.5 text-[11px]">
          <PenSquare size={12} />
          应用到正文
        </button>
        <button
          onClick={onDiscard}
          className="btn border border-ink-700 text-slate-400 !py-1.5 text-[11px] hover:text-red-400"
        >
          <Trash2 size={12} />
          丢弃
        </button>
      </div>
    </div>
  );
}

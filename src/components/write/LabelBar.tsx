import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import type { Scene } from '../../types';

const PRESETS = ['开篇', '战斗', '伏笔', '高光', '情感', '转折', '穿越', '试炼', '冲突', '悬念', '日常', '虐'];

interface Props {
  scene: Scene;
}

export default function LabelBar({ scene }: Props) {
  const updateSceneMeta = useProjectStore((s) => s.updateSceneMeta);
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);

  const addLabel = (label: string) => {
    const l = label.trim();
    if (!l || scene.labels.includes(l)) return;
    updateSceneMeta(scene.id, { labels: [...scene.labels, l] });
    setInput('');
  };

  const removeLabel = (label: string) => {
    updateSceneMeta(scene.id, { labels: scene.labels.filter((l) => l !== label) });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">标签</span>
      {scene.labels.map((label) => (
        <span
          key={label}
          className="group flex items-center gap-1 rounded-md border border-accent-500/25 bg-accent-500/10 px-2 py-0.5 text-[11px] text-accent-300"
        >
          {label}
          <button
            onClick={() => removeLabel(label)}
            className="text-accent-400/50 transition-colors hover:text-red-400"
          >
            <X size={10} />
          </button>
        </span>
      ))}

      {adding ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addLabel(input);
            setAdding(false);
          }}
          className="flex items-center gap-1"
        >
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={() => {
              if (input.trim()) addLabel(input);
              setAdding(false);
            }}
            placeholder="输入标签…"
            className="input-dark !w-28 !py-0.5 text-[11px]"
          />
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] text-slate-600 transition-colors hover:bg-ink-700 hover:text-slate-300"
        >
          <Plus size={11} />
          添加
        </button>
      )}

      <div className="ml-2 hidden items-center gap-1 xl:flex">
        {PRESETS.filter((p) => !scene.labels.includes(p))
          .slice(0, 6)
          .map((p) => (
            <button
              key={p}
              onClick={() => addLabel(p)}
              className="rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-slate-600 ring-1 ring-ink-700/50 transition-colors hover:text-slate-300 hover:ring-accent-500/30"
            >
              +{p}
            </button>
          ))}
      </div>
    </div>
  );
}

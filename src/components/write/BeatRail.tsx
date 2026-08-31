import { GripVertical, ListPlus, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { buildBeatsFromScene } from '../../utils/aiEngine';
import type { Scene, SceneStatus } from '../../types';
import { SCENE_STATUS_META } from '../../types';

const STATUSES: SceneStatus[] = ['idea', 'draft', 'writing', 'revising', 'done'];

interface Props {
  scene: Scene;
}

export default function BeatRail({ scene }: Props) {
  const updateBeat = useProjectStore((s) => s.updateBeat);
  const addBeat = useProjectStore((s) => s.addBeat);
  const setBeats = useProjectStore((s) => s.setBeats);
  const updateSceneMeta = useProjectStore((s) => s.updateSceneMeta);

  const genBeats = () => {
    const beats = buildBeatsFromScene(scene.title, scene.pov, scene.location, scene.mood).map((b, i) => ({
      id: `${scene.id}-beat-${Date.now()}-${i}`,
      summary: b.summary,
    }));
    setBeats(scene.id, beats);
  };

  return (
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-ink-700/60 bg-ink-900/50">
      {/* 状态 */}
      <div className="border-b border-ink-700/40 px-3 py-2.5">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">场景状态</div>
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((st) => {
            const meta = SCENE_STATUS_META[st];
            const active = scene.status === st;
            return (
              <button
                key={st}
                onClick={() => updateSceneMeta(scene.id, { status: st })}
                className={`chip transition-all ${
                  active ? `${meta.color} bg-ink-800 ring-1 ring-current` : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${active ? meta.dot : 'bg-ink-600'}`} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 节拍列表 */}
      <div className="flex items-center justify-between px-3 pb-1 pt-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">节拍 (Beats)</span>
        <div className="flex items-center gap-0.5">
          <button title="AI 生成节拍" onClick={genBeats} className="rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-accent-300">
            <Sparkles size={12} />
          </button>
          <button title="添加节拍" onClick={() => addBeat(scene.id)} className="rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-accent-300">
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
        {scene.beats.map((beat, idx) => (
          <div key={beat.id} className="group relative rounded-lg border border-ink-700/50 bg-ink-850/70 p-2 transition-colors hover:border-accent-500/30">
            <div className="flex items-center gap-1.5">
              <GripVertical size={11} className="shrink-0 cursor-grab text-slate-700" />
              <span className="font-mono text-[10px] font-semibold text-accent-400/70">{String(idx + 1).padStart(2, '0')}</span>
              <button
                onClick={() => {
                  const next = scene.beats.filter((b) => b.id !== beat.id);
                  setBeats(scene.id, next);
                }}
                className="ml-auto hidden shrink-0 rounded p-0.5 text-slate-600 hover:text-red-400 group-hover:block"
              >
                <Trash2 size={10} />
              </button>
            </div>
            <textarea
              value={beat.summary}
              onChange={(e) => updateBeat(scene.id, beat.id, e.target.value)}
              rows={2}
              className="mt-1 w-full resize-none rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[11px] leading-relaxed text-slate-300 outline-none transition-colors hover:border-ink-700 focus:border-accent-500/40 focus:bg-ink-900"
            />
          </div>
        ))}

        <button
          onClick={() => addBeat(scene.id)}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-ink-700/60 py-1.5 text-[11px] text-slate-600 transition-colors hover:border-accent-500/40 hover:text-accent-400"
        >
          <ListPlus size={12} />
          添加节拍
        </button>

        <p className="pt-2 text-center text-[10px] leading-relaxed text-slate-700">
          节拍是场景的"骨架",
          <br />
          写作时用它引导 AI 保持节奏
        </p>
      </div>
    </div>
  );
}

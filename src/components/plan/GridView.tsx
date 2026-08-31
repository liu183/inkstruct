import { Clock, MapPin, MessageSquareText, Plus, UserRound } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { SCENE_STATUS_META } from '../../types';

/**
 * Grid 视图:章节卡片 + 场景卡片的可视化网格
 */
export default function GridView() {
  const project = useProjectStore((s) => s.project);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const addScene = useProjectStore((s) => s.addScene);
  const setWorkspace = useUIStore((s) => s.setWorkspace);

  return (
    <div className="p-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {project.chapters.map((chapter) => (
          <section key={chapter.id} className="panel overflow-hidden">
            {/* 章节头 */}
            <header className="flex items-center gap-2.5 border-b border-ink-700/60 bg-ink-900/50 px-4 py-3">
              <span className="rounded-md bg-accent-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent-300 ring-1 ring-accent-500/25">
                CH.{chapter.order}
              </span>
              <h3 className="flex-1 truncate text-sm font-semibold text-slate-100">{chapter.title}</h3>
              <span className={`chip ${SCENE_STATUS_META[chapter.status].color} bg-ink-800`}>
                <span className={`h-1.5 w-1.5 rounded-full ${SCENE_STATUS_META[chapter.status].dot}`} />
                {SCENE_STATUS_META[chapter.status].label}
              </span>
            </header>

            {/* 场景网格 */}
            <div className="grid grid-cols-1 gap-2.5 p-3.5 md:grid-cols-2">
              {chapter.scenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    setActiveScene(scene.id);
                    setWorkspace('write');
                  }}
                  className="group flex flex-col gap-2 rounded-xl border border-ink-700/50 bg-ink-900/60 p-3 text-left transition-all hover:border-accent-500/40 hover:bg-ink-850 hover:shadow-glow"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-600">{String(scene.order).padStart(2, '0')}</span>
                    <span className="flex-1 truncate text-xs font-semibold text-slate-200 group-hover:text-accent-300">
                      {scene.title}
                    </span>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SCENE_STATUS_META[scene.status].dot}`} />
                  </div>

                  <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">{scene.summary}</p>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <UserRound size={10} className="text-violet-400/80" />
                      {scene.pov || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={10} className="text-emerald-400/80" />
                      {scene.location || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} className="text-amber-400/80" />
                      {scene.timeline || '—'}
                    </span>
                    {scene.labels.slice(0, 2).map((l) => (
                      <span key={l} className="rounded bg-ink-700/70 px-1 py-px text-[9px] text-slate-400">
                        {l}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-ink-700/40 pt-2 text-[10px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <MessageSquareText size={10} />
                      {scene.beats.length} 节拍
                    </span>
                    <span>{scene.wordCount.toLocaleString()} 字</span>
                  </div>
                </button>
              ))}

              <button
                onClick={() => addScene(chapter.id)}
                className="flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-700/70 text-xs text-slate-600 transition-colors hover:border-accent-500/40 hover:text-accent-400"
              >
                <Plus size={16} />
                添加场景
              </button>
            </div>
          </section>
        ))}

        {/* 新增章节 */}
        <button
          onClick={() => useProjectStore.getState().addChapter()}
          className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-700/70 text-xs text-slate-600 transition-colors hover:border-accent-500/40 hover:text-accent-400"
        >
          <Plus size={18} />
          新增章节
        </button>
      </div>
    </div>
  );
}

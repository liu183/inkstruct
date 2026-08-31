import { Clock, Layers, MapPin, MessageSquareText, Plus, UserRound } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { SCENE_STATUS_META, type Chapter } from '../../types';

/**
 * Grid 视图:按「卷 → 单元」分组,展示章卡片与其下的场景卡片
 */
export default function GridView() {
  const project = useProjectStore((s) => s.project);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const addScene = useProjectStore((s) => s.addScene);
  const addChapter = useProjectStore((s) => s.addChapter);
  const addUnit = useProjectStore((s) => s.addUnit);
  const addVolume = useProjectStore((s) => s.addVolume);
  const setWorkspace = useUIStore((s) => s.setWorkspace);

  return (
    <div className="space-y-5 p-5">
      {project.volumes.map((volume) => (
        <section key={volume.id} className="space-y-3">
          {/* 卷头 */}
          <div className="flex items-center gap-2.5">
            <span className="rounded-md bg-accent-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-accent-300 ring-1 ring-accent-500/25">
              VOL.{volume.order}
            </span>
            <h2 className="text-sm font-semibold text-slate-100">{volume.title}</h2>
            <span className={`chip ${SCENE_STATUS_META[volume.status].color} bg-ink-800`}>
              {SCENE_STATUS_META[volume.status].label}
            </span>
            <button
              onClick={() => addUnit(volume.id)}
              className="ml-auto flex items-center gap-1 text-[10px] text-slate-500 transition-colors hover:text-accent-400"
            >
              <Plus size={12} />
              新增单元
            </button>
          </div>

          {volume.units.map((unit) => (
            <div key={unit.id} className="space-y-2.5 pl-1">
              {/* 单元头 */}
              <div className="flex items-center gap-2">
                <Layers size={12} className="text-accent-400/70" />
                <h3 className="text-xs font-medium text-slate-300">{unit.title}</h3>
                <span className="text-[10px] text-slate-600">{unit.chapters.length} 章</span>
                <button
                  onClick={() => addChapter(unit.id)}
                  className="flex items-center gap-1 text-[10px] text-slate-600 transition-colors hover:text-accent-400"
                >
                  <Plus size={11} />
                  新增章
                </button>
              </div>

              {/* 章卡片网格 */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {unit.chapters.map((chapter) => (
                  <ChapterCard
                    key={chapter.id}
                    chapter={chapter}
                    onOpenScene={(id) => {
                      setActiveScene(id);
                      setWorkspace('write');
                    }}
                    onAddScene={() => addScene(chapter.id)}
                  />
                ))}

                <button
                  onClick={() => addChapter(unit.id)}
                  className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-700/70 text-xs text-slate-600 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                >
                  <Plus size={18} />
                  新增章
                </button>
              </div>
            </div>
          ))}
        </section>
      ))}

      <button
        onClick={() => addVolume()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink-700/70 py-4 text-xs text-slate-600 transition-colors hover:border-accent-500/40 hover:text-accent-400"
      >
        <Plus size={16} />
        新增卷
      </button>
    </div>
  );
}

function ChapterCard({
  chapter,
  onOpenScene,
  onAddScene,
}: {
  chapter: Chapter;
  onOpenScene: (sceneId: string) => void;
  onAddScene: () => void;
}) {
  return (
    <div className="panel overflow-hidden">
      <header className="flex items-center gap-2.5 border-b border-ink-700/60 bg-ink-900/50 px-4 py-3">
        <span className="rounded-md bg-accent-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent-300 ring-1 ring-accent-500/25">
          CH.{chapter.order}
        </span>
        <h4 className="flex-1 truncate text-sm font-semibold text-slate-100">{chapter.title}</h4>
        <span className={`chip ${SCENE_STATUS_META[chapter.status].color} bg-ink-800`}>
          <span className={`h-1.5 w-1.5 rounded-full ${SCENE_STATUS_META[chapter.status].dot}`} />
          {SCENE_STATUS_META[chapter.status].label}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-2.5 p-3.5 md:grid-cols-2">
        {chapter.scenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => onOpenScene(scene.id)}
            className="group flex flex-col gap-2 rounded-xl border border-ink-700/50 bg-ink-900/60 p-3 text-left transition-all hover:border-accent-500/40 hover:bg-ink-850 hover:shadow-glow"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-slate-600">
                {String(scene.order).padStart(2, '0')}
              </span>
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
          onClick={onAddScene}
          className="flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-700/70 text-xs text-slate-600 transition-colors hover:border-accent-500/40 hover:text-accent-400"
        >
          <Plus size={16} />
          添加场景
        </button>
      </div>
    </div>
  );
}

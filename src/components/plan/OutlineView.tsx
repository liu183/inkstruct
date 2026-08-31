import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileText, ListOrdered, Target } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { SCENE_STATUS_META } from '../../types';

/**
 * Outline 视图:层级大纲(章节 → 场景 → 摘要 + 节拍),支持折叠
 */
export default function OutlineView() {
  const project = useProjectStore((s) => s.project);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const setWorkspace = useUIStore((s) => s.setWorkspace);
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});

  const stats = useMemo(
    () => ({
      scenes: project.chapters.flatMap((c) => c.scenes).length,
      done: project.chapters.flatMap((c) => c.scenes).filter((s) => s.status === 'done').length,
      writing: project.chapters.flatMap((c) => c.scenes).filter((s) => s.status === 'writing').length,
    }),
    [project]
  );

  return (
    <div className="mx-auto max-w-4xl p-5">
      {/* 进度概览 */}
      <div className="panel mb-4 flex items-center gap-5 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Target size={14} className="text-accent-400" />
          进度
        </div>
        <ProgressBar value={stats.done / Math.max(stats.scenes, 1)} label={`${stats.done}/${stats.scenes} 完成`} />
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> 完成 {stats.done}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> 写作中 {stats.writing}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {project.chapters.map((chapter) => {
          const open = openChapters[chapter.id] !== false;
          return (
            <section key={chapter.id} className="panel overflow-hidden">
              <button
                onClick={() => setOpenChapters((c) => ({ ...c, [chapter.id]: !open }))}
                className="flex w-full items-center gap-2.5 border-b border-ink-700/40 bg-ink-900/50 px-4 py-2.5 text-left transition-colors hover:bg-ink-850"
              >
                {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                <span className="font-mono text-[10px] font-semibold text-accent-400">CH.{chapter.order}</span>
                <span className="flex-1 text-sm font-medium text-slate-100">{chapter.title}</span>
                <span className="text-[10px] text-slate-500">
                  {chapter.scenes.length} 场 · {chapter.scenes.reduce((n, s) => n + s.wordCount, 0).toLocaleString()} 字
                </span>
                <span className={`chip ${SCENE_STATUS_META[chapter.status].color} bg-ink-800`}>
                  {SCENE_STATUS_META[chapter.status].label}
                </span>
              </button>

              {open && (
                <div className="divide-y divide-ink-700/30">
                  {chapter.scenes.map((scene) => (
                    <div key={scene.id} className="group px-4 py-3 transition-colors hover:bg-ink-850/50">
                      <button
                        onClick={() => {
                          setActiveScene(scene.id);
                          setWorkspace('write');
                        }}
                        className="flex w-full items-start gap-3 text-left"
                      >
                        <span className="mt-0.5 font-mono text-[10px] text-slate-600">{String(scene.order).padStart(2, '0')}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <FileText size={12} className="shrink-0 text-slate-500" />
                            <span className="text-xs font-semibold text-slate-200 group-hover:text-accent-300">{scene.title}</span>
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SCENE_STATUS_META[scene.status].dot}`} />
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{scene.summary}</p>

                          {/* 节拍列表 */}
                          {scene.beats.length > 0 && (
                            <div className="mt-2 flex items-start gap-1.5">
                              <ListOrdered size={11} className="mt-0.5 shrink-0 text-accent-400/60" />
                              <div className="space-y-0.5">
                                {scene.beats.map((b, idx) => (
                                  <p key={b.id} className="text-[10px] text-slate-600">
                                    <span className="mr-1 font-mono text-accent-400/50">{idx + 1}.</span>
                                    {b.summary}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 text-[10px] font-mono text-slate-600">{scene.wordCount.toLocaleString()} 字</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-600 to-emerald-400 transition-all"
          style={{ width: `${Math.max(value * 100, 4)}%` }}
        />
      </div>
      <span className="w-16 text-[10px] text-slate-500">{label}</span>
    </div>
  );
}

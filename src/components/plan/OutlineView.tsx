import { useMemo, useState } from 'react';
import {
  ChevronDown, ChevronRight, FileText, Layers, ListOrdered, Plus, Target,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { SCENE_STATUS_META, type Chapter, type Unit, type Volume } from '../../types';
import { flatScenes, statusStats } from '../../utils/structure';

/**
 * Outline 视图:四层大纲(卷 → 单元 → 章 → 场景),支持逐级折叠
 */
export default function OutlineView() {
  const project = useProjectStore((s) => s.project);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const setWorkspace = useUIStore((s) => s.setWorkspace);
  const addVolume = useProjectStore((s) => s.addVolume);
  const addUnit = useProjectStore((s) => s.addUnit);
  const addChapter = useProjectStore((s) => s.addChapter);
  const addScene = useProjectStore((s) => s.addScene);

  const [openVolumes, setOpenVolumes] = useState<Record<string, boolean>>({});
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({});
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});

  const stats = useMemo(() => statusStats(project), [project]);
  const volOpen = (id: string) => openVolumes[id] !== false;
  const unitOpen = (id: string) => openUnits[id] !== false;
  const chapOpen = (id: string) => openChapters[id] !== false;

  return (
    <div className="mx-auto max-w-4xl p-5">
      {/* 进度概览 */}
      <div className="panel mb-4 flex items-center gap-5 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Target size={14} className="text-accent-400" />
          进度
        </div>
        <ProgressBar
          value={stats.done / Math.max(stats.total, 1)}
          label={`${stats.done}/${stats.total} 完成`}
        />
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
        {project.volumes.map((volume) => (
          <section key={volume.id} className="panel overflow-hidden">
            {/* 卷 */}
            <div
              className={`flex w-full items-center gap-2.5 border-b border-ink-700/40 px-4 py-2.5 text-left transition-colors ${
                volume.id === project.volumes[0]?.id
                  ? 'bg-gradient-to-r from-accent-500/[0.07] to-ink-900/50'
                  : 'bg-ink-900/50'
              }`}
            >
              <button
                onClick={() => setOpenVolumes((c) => ({ ...c, [volume.id]: !volOpen(volume.id) }))}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                {volOpen(volume.id) ? (
                  <ChevronDown size={14} className="shrink-0 text-slate-500" />
                ) : (
                  <ChevronRight size={14} className="shrink-0 text-slate-500" />
                )}
                <span className="rounded bg-accent-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent-300 ring-1 ring-accent-500/25">
                  VOL.{volume.order}
                </span>
                <span className="flex-1 truncate text-sm font-semibold text-slate-100">{volume.title}</span>
                <span className="text-[10px] text-slate-500">
                  {volume.units.reduce((n, u) => n + u.chapters.length, 0)} 章 ·{' '}
                  {volume.units
                    .reduce(
                      (n, u) =>
                        n + u.chapters.reduce((m, c) => m + c.scenes.reduce((k, s) => k + s.wordCount, 0), 0),
                      0
                    )
                    .toLocaleString()}{' '}
                  字
                </span>
                <span className={`chip ${SCENE_STATUS_META[volume.status].color} bg-ink-800`}>
                  {SCENE_STATUS_META[volume.status].label}
                </span>
              </button>
              <button
                title="新增单元"
                onClick={() => addUnit(volume.id)}
                className="shrink-0 rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-accent-400"
              >
                <Plus size={13} />
              </button>
            </div>

            {volOpen(volume.id) && (
              <div className="divide-y divide-ink-700/25">
                {volume.units.map((unit) => (
                  <UnitBlock
                    key={unit.id}
                    unit={unit}
                    open={unitOpen(unit.id)}
                    onToggle={() => setOpenUnits((c) => ({ ...c, [unit.id]: !unitOpen(unit.id) }))}
                    chapterOpen={chapOpen}
                    onToggleChapter={(id) => setOpenChapters((c) => ({ ...c, [id]: !chapOpen(id) }))}
                    onAddChapter={() => addChapter(unit.id)}
                    onAddScene={addScene}
                    onOpenScene={(id) => {
                      setActiveScene(id);
                      setWorkspace('write');
                    }}
                  />
                ))}
                {volume.units.length === 0 && (
                  <button
                    onClick={() => addUnit(volume.id)}
                    className="w-full px-4 py-3 text-left text-[11px] text-slate-600 transition-colors hover:text-accent-400"
                  >
                    + 在本卷下添加单元
                  </button>
                )}
              </div>
            )}
          </section>
        ))}
      </div>

      <button
        onClick={() => addVolume()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink-700/70 py-4 text-xs text-slate-600 transition-colors hover:border-accent-500/40 hover:text-accent-400"
      >
        <Plus size={15} />
        新增卷
      </button>

      {project.volumes.length === 0 && (
        <p className="mt-3 text-center text-[11px] text-slate-600">
          还没有结构,先新增一卷,再在其下建单元与章
        </p>
      )}
    </div>
  );
}

/* ============ 单元块 ============ */

function UnitBlock({
  unit,
  open,
  onToggle,
  chapterOpen,
  onToggleChapter,
  onAddChapter,
  onAddScene,
  onOpenScene,
}: {
  unit: Unit;
  open: boolean;
  onToggle: () => void;
  chapterOpen: (id: string) => boolean;
  onToggleChapter: (id: string) => void;
  onAddChapter: () => void;
  onAddScene: (chapterId: string) => void;
  onOpenScene: (sceneId: string) => void;
}) {
  return (
    <div className="bg-ink-900/20">
      <div className="flex items-center gap-2 px-4 py-2">
        <button onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {open ? (
            <ChevronDown size={13} className="shrink-0 text-slate-500" />
          ) : (
            <ChevronRight size={13} className="shrink-0 text-slate-500" />
          )}
          <Layers size={12} className="shrink-0 text-accent-400/70" />
          <span className="flex-1 truncate text-xs font-medium text-slate-200">{unit.title}</span>
          <span className="text-[10px] text-slate-500">
            {unit.chapters.length} 章 ·{' '}
            {unit.chapters.reduce((m, c) => m + c.scenes.reduce((k, s) => k + s.wordCount, 0), 0).toLocaleString()}{' '}
            字
          </span>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SCENE_STATUS_META[unit.status].dot}`} />
        </button>
        <button
          title="新增章"
          onClick={onAddChapter}
          className="shrink-0 rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-accent-400"
        >
          <Plus size={12} />
        </button>
      </div>

      {open && (
        <div className="divide-y divide-ink-700/20">
          {unit.chapters.map((chapter) => (
            <ChapterBlock
              key={chapter.id}
              chapter={chapter}
              open={chapterOpen(chapter.id)}
              onToggle={() => onToggleChapter(chapter.id)}
              onAddScene={() => onAddScene(chapter.id)}
              onOpenScene={onOpenScene}
            />
          ))}
          {unit.chapters.length === 0 && (
            <button
              onClick={onAddChapter}
              className="w-full py-2 pl-10 text-left text-[10px] text-slate-600 transition-colors hover:text-accent-400"
            >
              + 添加章
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ============ 章块 ============ */

function ChapterBlock({
  chapter,
  open,
  onToggle,
  onAddScene,
  onOpenScene,
}: {
  chapter: Chapter;
  open: boolean;
  onToggle: () => void;
  onAddScene: () => void;
  onOpenScene: (sceneId: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 py-2 pl-8 pr-4">
        <button onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {open ? (
            <ChevronDown size={12} className="shrink-0 text-slate-500" />
          ) : (
            <ChevronRight size={12} className="shrink-0 text-slate-500" />
          )}
          <span className="font-mono text-[10px] text-slate-600">CH.{chapter.order}</span>
          <span className="flex-1 truncate text-[11px] font-medium text-slate-300">{chapter.title}</span>
          <span className="text-[10px] text-slate-600">
            {chapter.scenes.length} 场 ·{' '}
            {chapter.scenes.reduce((n, s) => n + s.wordCount, 0).toLocaleString()} 字
          </span>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SCENE_STATUS_META[chapter.status].dot}`} />
        </button>
        <button
          title="新增场景"
          onClick={onAddScene}
          className="shrink-0 rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-accent-400"
        >
          <Plus size={12} />
        </button>
      </div>

      {open && (
        <div className="divide-y divide-ink-700/15">
          {chapter.scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => onOpenScene(scene.id)}
              className="group flex w-full items-start gap-3 py-2.5 pl-14 pr-4 text-left transition-colors hover:bg-ink-850/50"
            >
              <span className="mt-0.5 font-mono text-[10px] text-slate-600">
                {String(scene.order).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText size={12} className="shrink-0 text-slate-500" />
                  <span className="text-[11px] font-semibold text-slate-300 group-hover:text-accent-300">
                    {scene.title}
                  </span>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SCENE_STATUS_META[scene.status].dot}`} />
                </div>
                <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{scene.summary}</p>

                {scene.beats.length > 0 && (
                  <div className="mt-1.5 flex items-start gap-1.5">
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
              <span className="shrink-0 text-[10px] font-mono text-slate-600">
                {scene.wordCount.toLocaleString()} 字
              </span>
            </button>
          ))}
          {chapter.scenes.length === 0 && (
            <button
              onClick={onAddScene}
              className="w-full py-2.5 pl-14 text-left text-[10px] text-slate-600 transition-colors hover:text-accent-400"
            >
              + 添加场景
            </button>
          )}
        </div>
      )}
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

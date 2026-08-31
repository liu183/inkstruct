import { useState } from 'react';
import {
  Clock, GripVertical, Layers, MapPin, MessageSquareText, Pencil,
  Plus, Trash2, UserRound,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { SCENE_STATUS_META, type Chapter, type Scene, type Unit, type Volume } from '../../types';
import SceneEditModal from './SceneEditModal';

/**
 * Grid 视图:按「卷 → 单元」分组,章卡片可拖拽排序/跨单元移动,
 * 场景支持增删改查(添加/编辑走表单模态,可直接进入写作)
 */
export default function GridView() {
  const project = useProjectStore((s) => s.project);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const moveChapter = useProjectStore((s) => s.moveChapter);
  const deleteScene = useProjectStore((s) => s.deleteScene);
  const setWorkspace = useUIStore((s) => s.setWorkspace);
  const addUnit = useProjectStore((s) => s.addUnit);
  const addVolume = useProjectStore((s) => s.addVolume);

  // 拖拽状态
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // 场景模态:编辑既有 / 在某章下新建
  const [editing, setEditing] = useState<Scene | null>(null);
  const [creatingFor, setCreatingFor] = useState<{ chapterId: string; chapterTitle: string } | null>(null);

  const dropOnChapter = (targetChapter: Chapter, unit: Unit) => {
    if (!dragId || dragId === targetChapter.id) return;
    const toIdx = unit.chapters.findIndex((c) => c.id === targetChapter.id);
    if (toIdx >= 0) moveChapter(dragId, unit.id, toIdx);
    setDragId(null);
    setOverId(null);
  };

  const dropOnAppend = (unit: Unit) => {
    if (!dragId) return;
    moveChapter(dragId, unit.id, unit.chapters.length);
    setDragId(null);
    setOverId(null);
  };

  return (
    <div className="space-y-5 p-5">
      {project.volumes.map((volume) => (
        <VolumeSection
          key={volume.id}
          volume={volume}
          dragId={dragId}
          overId={overId}
          setDragId={setDragId}
          setOverId={setOverId}
          dropOnChapter={dropOnChapter}
          dropOnAppend={dropOnAppend}
          onAddUnit={() => addUnit(volume.id)}
          onAddChapter={() => useProjectStore.getState().addChapter(volume.units[0]?.id)}
          onOpenScene={(id) => {
            setActiveScene(id);
            setWorkspace('write');
          }}
          onEditScene={setEditing}
          onDeleteScene={(s) => {
            if (confirm(`删除场景「${s.title}」?其正文将一并删除`)) deleteScene(s.id);
          }}
          onAddScene={(chapterId, chapterTitle) => setCreatingFor({ chapterId, chapterTitle })}
        />
      ))}

      <button
        onClick={() => addVolume()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink-700/70 py-4 text-xs text-slate-600 transition-colors hover:border-accent-500/40 hover:text-accent-400"
      >
        <Plus size={16} />
        新增卷
      </button>

      {/* 场景表单模态 */}
      {editing && (
        <SceneEditModal scene={editing} onClose={() => setEditing(null)} />
      )}
      {creatingFor && (
        <SceneEditModal
          chapterId={creatingFor.chapterId}
          chapterTitle={creatingFor.chapterTitle}
          onClose={() => setCreatingFor(null)}
        />
      )}
    </div>
  );
}

/* ============ 卷区块 ============ */

function VolumeSection({
  volume,
  dragId,
  overId,
  setDragId,
  setOverId,
  dropOnChapter,
  dropOnAppend,
  onAddUnit,
  onAddChapter,
  onOpenScene,
  onEditScene,
  onDeleteScene,
  onAddScene,
}: {
  volume: Volume;
  dragId: string | null;
  overId: string | null;
  setDragId: (id: string | null) => void;
  setOverId: (id: string | null) => void;
  dropOnChapter: (target: Chapter, unit: Unit) => void;
  dropOnAppend: (unit: Unit) => void;
  onAddUnit: () => void;
  onAddChapter: () => void;
  onOpenScene: (sceneId: string) => void;
  onEditScene: (scene: Scene) => void;
  onDeleteScene: (scene: Scene) => void;
  onAddScene: (chapterId: string, chapterTitle: string) => void;
}) {
  return (
    <section className="space-y-3">
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
          onClick={onAddUnit}
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
              onClick={onAddChapter}
              className="flex items-center gap-1 text-[10px] text-slate-600 transition-colors hover:text-accent-400"
            >
              <Plus size={11} />
              新增章
            </button>
            <span className="ml-1 hidden text-[9px] text-slate-700 sm:inline">
              · 拖动章卡片可排序 / 跨单元移动
            </span>
          </div>

          {/* 章卡片网格 */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {unit.chapters.map((chapter) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                unit={unit}
                dragging={dragId === chapter.id}
                dropping={overId === chapter.id}
                setDragId={setDragId}
                setOverId={setOverId}
                onDrop={dropOnChapter}
                onOpenScene={onOpenScene}
                onEditScene={onEditScene}
                onDeleteScene={onDeleteScene}
                onAddScene={onAddScene}
              />
            ))}

            {/* 拖拽追加位 */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(`append:${unit.id}`);
              }}
              onDrop={() => dropOnAppend(unit)}
              className={`flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-xs transition-colors ${
                overId === `append:${unit.id}` && dragId
                  ? 'border-accent-500/60 bg-accent-500/[0.06] text-accent-300'
                  : 'border-ink-700/70 text-slate-600 hover:border-accent-500/40 hover:text-accent-400'
              }`}
            >
              <Plus size={18} />
              {dragId ? '放到这里追加' : '新增章'}
              {!dragId && <span className="text-[9px] text-slate-700">默认加入本单元第一个位置</span>}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ============ 章卡片(可拖拽) ============ */

function ChapterCard({
  chapter,
  unit,
  dragging,
  dropping,
  setDragId,
  setOverId,
  onDrop,
  onOpenScene,
  onEditScene,
  onDeleteScene,
  onAddScene,
}: {
  chapter: Chapter;
  unit: Unit;
  dragging: boolean;
  dropping: boolean;
  setDragId: (id: string | null) => void;
  setOverId: (id: string | null) => void;
  onDrop: (target: Chapter, unit: Unit) => void;
  onOpenScene: (sceneId: string) => void;
  onEditScene: (scene: Scene) => void;
  onDeleteScene: (scene: Scene) => void;
  onAddScene: (chapterId: string, chapterTitle: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={() => setDragId(chapter.id)}
      onDragEnd={() => {
        setDragId(null);
        setOverId(null);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOverId(chapter.id);
      }}
      onDrop={() => onDrop(chapter, unit)}
      className={`panel overflow-hidden transition-all ${
        dragging ? 'scale-[0.98] opacity-50' : ''
      } ${dropping && !dragging ? 'ring-2 ring-accent-500/50' : ''}`}
    >
      <header className="flex items-center gap-2.5 border-b border-ink-700/60 bg-ink-900/50 px-4 py-3">
        <GripVertical size={13} className="shrink-0 cursor-grab text-slate-600" aria-label="拖动排序" />
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
          <SceneCard
            key={scene.id}
            scene={scene}
            onOpen={() => onOpenScene(scene.id)}
            onEdit={() => onEditScene(scene)}
            onDelete={() => onDeleteScene(scene)}
          />
        ))}

        <button
          onClick={() => onAddScene(chapter.id, chapter.title)}
          className="flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-700/70 text-xs text-slate-600 transition-colors hover:border-accent-500/40 hover:text-accent-400"
        >
          <Plus size={16} />
          添加场景
        </button>
      </div>
    </div>
  );
}

/* ============ 场景卡片(可编辑/删除) ============ */

function SceneCard({
  scene,
  onOpen,
  onEdit,
  onDelete,
}: {
  scene: Scene;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative flex flex-col gap-2 rounded-xl border border-ink-700/50 bg-ink-900/60 p-3 text-left transition-all hover:border-accent-500/40 hover:bg-ink-850">
      {/* 操作按钮 */}
      <div className="absolute right-2 top-2 hidden items-center gap-0.5 group-hover:flex">
        <button
          title="编辑场景信息"
          onClick={onEdit}
          className="rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-accent-300"
        >
          <Pencil size={12} />
        </button>
        <button
          title="删除场景"
          onClick={onDelete}
          className="rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-red-400"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <button onClick={onOpen} className="flex flex-col gap-2 text-left">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-600">
            {String(scene.order).padStart(2, '0')}
          </span>
          <span className="flex-1 truncate pr-10 text-xs font-semibold text-slate-200 group-hover:text-accent-300">
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
    </div>
  );
}

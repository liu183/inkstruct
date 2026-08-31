import { useState } from 'react';
import {
  BookOpen, ChevronDown, ChevronRight, FileText, FolderOpen, Layers, Library,
  NotebookPen, Plus, ScrollText, Sparkles, Trash2,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { SCENE_STATUS_META, type Chapter, type Scene, type Unit, type Volume } from '../../types';
import { flatScenes, totalWords as countWords } from '../../utils/structure';
import ProjectSwitcher from '../project/ProjectSwitcher';

/**
 * 侧边栏:项目切换 + 四层结构树(卷 → 单元 → 章 → 场景)+ 功能入口
 */
export default function Sidebar() {
  const project = useProjectStore((s) => s.project);
  const activeSceneId = useProjectStore((s) => s.activeSceneId);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const setActiveChapter = useProjectStore((s) => s.setActiveChapter);
  const addScene = useProjectStore((s) => s.addScene);
  const deleteScene = useProjectStore((s) => s.deleteScene);
  const addChapter = useProjectStore((s) => s.addChapter);
  const deleteChapter = useProjectStore((s) => s.deleteChapter);
  const addUnit = useProjectStore((s) => s.addUnit);
  const deleteUnit = useProjectStore((s) => s.deleteUnit);
  const addVolume = useProjectStore((s) => s.addVolume);
  const deleteVolume = useProjectStore((s) => s.deleteVolume);
  const setWorkspace = useUIStore((s) => s.setWorkspace);
  const workspace = useUIStore((s) => s.workspace);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  /** 默认展开 */
  const open = (id: string) => collapsed[id] !== true;

  const stats = {
    volumes: project.volumes.length,
    scenes: flatScenes(project).length,
    words: countWords(project),
  };

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-ink-700/60 bg-ink-900/60">
      {/* 项目头部(可切换 / 新建 / 删除书) */}
      <ProjectSwitcher />

      {/* 统计条 */}
      <div className="grid grid-cols-3 gap-1.5 border-b border-ink-700/60 px-3 py-2 text-center">
        <Stat label="卷" value={stats.volumes} />
        <Stat label="场景" value={stats.scenes} />
        <Stat label="字数" value={stats.words.toLocaleString()} />
      </div>

      {/* 结构树 */}
      <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          故事结构 · 卷 / 单元 / 章
        </span>
        <button
          className="text-slate-500 transition-colors hover:text-accent-400"
          title="新增卷"
          onClick={() => addVolume()}
        >
          <Plus size={14} />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
        {project.volumes.map((volume) => (
          <VolumeNode
            key={volume.id}
            volume={volume}
            open={open(volume.id)}
            activeSceneId={activeSceneId}
            onToggle={() => toggle(volume.id)}
            onAddUnit={() => addUnit(volume.id)}
            onDeleteVolume={() => {
              if (confirm(`删除「${volume.title}」及其下所有单元、章节与场景?`)) deleteVolume(volume.id);
            }}
            onAddChapter={addChapter}
            onDeleteUnit={(u) => {
              if (confirm(`删除单元「${u.title}」及其下所有章节?`)) deleteUnit(u.id);
            }}
            onDeleteChapter={(c) => {
              if (confirm(`删除「${c.title}」及其下所有场景?`)) deleteChapter(c.id);
            }}
            onAddScene={addScene}
            onDeleteScene={deleteScene}
            onOpenScene={(id) => {
              setActiveScene(id);
              setWorkspace('write');
            }}
            onOpenChapter={setActiveChapter}
          />
        ))}

        {project.volumes.length === 0 && (
          <div className="px-3 py-8 text-center text-[11px] text-slate-600">
            还没有卷,点右上角 + 开始搭结构
          </div>
        )}
      </nav>

      {/* 底部功能入口 */}
      <div className="space-y-1 border-t border-ink-700/60 p-2">
        <Entry
          icon={<Library size={14} className="text-gold/90" />}
          label="世界档案库 Codex"
          badge={project.codex.length}
          active={workspace === 'codex'}
          onClick={() => setWorkspace('codex')}
        />
        <Entry
          icon={<ScrollText size={14} className="text-sky-400/90" />}
          label="章纲与存稿"
          badge={project.volumes.reduce((n, v) => n + v.units.reduce((m, u) => m + u.chapters.length, 0), 0)}
          active={workspace === 'drafts'}
          onClick={() => setWorkspace('drafts')}
        />
        <Entry
          icon={<NotebookPen size={14} className="text-emerald-400/90" />}
          label="创作日志"
          badge={project.journal.length}
          active={workspace === 'journal'}
          onClick={() => setWorkspace('journal')}
        />
        <Entry
          icon={<Sparkles size={14} className="text-amber-400/90" />}
          label="开书灵感设计"
          badge={project.inspirationCards.length}
          active={workspace === 'inspiration'}
          onClick={() => setWorkspace('inspiration')}
        />
      </div>
    </aside>
  );
}

/* ============ 卷节点 ============ */

function VolumeNode({
  volume,
  open,
  activeSceneId,
  onToggle,
  onAddUnit,
  onDeleteVolume,
  onAddChapter,
  onDeleteUnit,
  onDeleteChapter,
  onAddScene,
  onDeleteScene,
  onOpenScene,
  onOpenChapter,
}: {
  volume: Volume;
  open: boolean;
  activeSceneId: string;
  onToggle: () => void;
  onAddUnit: () => void;
  onDeleteVolume: () => void;
  onAddChapter: (unitId: string) => void;
  onDeleteUnit: (u: Unit) => void;
  onDeleteChapter: (c: Chapter) => void;
  onAddScene: (chapterId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onOpenScene: (sceneId: string) => void;
  onOpenChapter: (chapterId: string) => void;
}) {
  return (
    <div>
      <Row
        indent={0}
        icon={open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        label={volume.title}
        color={SCENE_STATUS_META[volume.status].dot}
        onMain={onToggle}
        actions={
          <>
            <IconAction title="新增单元" onClick={onAddUnit}>
              <Plus size={11} />
            </IconAction>
            <IconAction title="删除卷" danger onClick={onDeleteVolume}>
              <Trash2 size={11} />
            </IconAction>
          </>
        }
      />

      {open && (
        <div className="ml-1.5 border-l border-ink-700/60 pl-1">
          {volume.units.map((unit) => (
            <UnitNode
              key={unit.id}
              unit={unit}
              open={open}
              activeSceneId={activeSceneId}
              onAddChapter={() => onAddChapter(unit.id)}
              onDeleteUnit={() => onDeleteUnit(unit)}
              onDeleteChapter={onDeleteChapter}
              onAddScene={onAddScene}
              onDeleteScene={onDeleteScene}
              onOpenScene={onOpenScene}
              onOpenChapter={onOpenChapter}
            />
          ))}
          {volume.units.length === 0 && (
            <button
              onClick={onAddUnit}
              className="ml-4 py-1 text-[10px] text-slate-600 transition-colors hover:text-accent-400"
            >
              + 添加单元
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ============ 单元节点 ============ */

function UnitNode({
  unit,
  open: parentOpen,
  activeSceneId,
  onAddChapter,
  onDeleteUnit,
  onDeleteChapter,
  onAddScene,
  onDeleteScene,
  onOpenScene,
  onOpenChapter,
}: {
  unit: Unit;
  open: boolean;
  activeSceneId: string;
  onAddChapter: () => void;
  onDeleteUnit: () => void;
  onDeleteChapter: (c: Chapter) => void;
  onAddScene: (chapterId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onOpenScene: (sceneId: string) => void;
  onOpenChapter: (chapterId: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className={parentOpen ? '' : 'hidden'}>
      <Row
        indent={1}
        icon={<Layers size={12} className="text-accent-400/70" />}
        label={unit.title}
        color={SCENE_STATUS_META[unit.status].dot}
        onMain={() => setOpen((o) => !o)}
        actions={
          <>
            <IconAction title="新增章" onClick={onAddChapter}>
              <Plus size={11} />
            </IconAction>
            <IconAction title="删除单元" danger onClick={onDeleteUnit}>
              <Trash2 size={11} />
            </IconAction>
          </>
        }
      />

      {open && (
        <div className="ml-1.5 border-l border-ink-700/50 pl-1">
          {unit.chapters.map((chapter) => (
            <ChapterNode
              key={chapter.id}
              chapter={chapter}
              activeSceneId={activeSceneId}
              onDeleteChapter={() => onDeleteChapter(chapter)}
              onAddScene={onAddScene}
              onDeleteScene={onDeleteScene}
              onOpenScene={onOpenScene}
              onOpenChapter={onOpenChapter}
            />
          ))}
          {unit.chapters.length === 0 && (
            <button
              onClick={onAddChapter}
              className="ml-4 py-1 text-[10px] text-slate-600 transition-colors hover:text-accent-400"
            >
              + 添加章
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ============ 章节点 ============ */

function ChapterNode({
  chapter,
  activeSceneId,
  onDeleteChapter,
  onAddScene,
  onDeleteScene,
  onOpenScene,
  onOpenChapter,
}: {
  chapter: Chapter;
  activeSceneId: string;
  onDeleteChapter: () => void;
  onAddScene: (chapterId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onOpenScene: (sceneId: string) => void;
  onOpenChapter: (chapterId: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <Row
        indent={2}
        icon={<FolderOpen size={12} className="text-accent-400/60" />}
        label={chapter.title}
        color={SCENE_STATUS_META[chapter.status].dot}
        onMain={() => {
          onOpenChapter(chapter.id);
          setOpen((o) => !o);
        }}
        actions={
          <>
            <IconAction title="新增场景" onClick={() => onAddScene(chapter.id)}>
              <Plus size={11} />
            </IconAction>
            <IconAction title="删除章" danger onClick={onDeleteChapter}>
              <Trash2 size={11} />
            </IconAction>
          </>
        }
      />

      {open && (
        <div className="ml-1.5 border-l border-ink-700/40 pl-1">
          {chapter.scenes.map((scene) => (
            <SceneRow
              key={scene.id}
              scene={scene}
              active={scene.id === activeSceneId}
              onClick={() => onOpenScene(scene.id)}
              onDelete={() => {
                if (confirm(`删除场景「${scene.title}」?`)) onDeleteScene(scene.id);
              }}
            />
          ))}
          {chapter.scenes.length === 0 && (
            <button
              onClick={() => onAddScene(chapter.id)}
              className="ml-4 py-1 text-[10px] text-slate-600 transition-colors hover:text-accent-400"
            >
              + 添加场景
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ============ 通用行组件 ============ */

function Row({
  indent,
  icon,
  label,
  color,
  onMain,
  actions,
}: {
  indent: number;
  icon: React.ReactNode;
  label: string;
  color?: string;
  onMain: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className="group flex items-center gap-1 rounded-lg pr-1 transition-colors hover:bg-ink-800"
      style={{ paddingLeft: indent * 10 }}
    >
      <button
        onClick={onMain}
        className="flex min-w-0 flex-1 items-center gap-1.5 px-1.5 py-1 text-left"
      >
        <span className="shrink-0 text-slate-500">{icon}</span>
        <span className="flex-1 truncate text-[11px] text-slate-300">{label}</span>
        {color && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />}
      </button>
      <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">{actions}</div>
    </div>
  );
}

function SceneRow({
  scene,
  active,
  onClick,
  onDelete,
}: {
  scene: Scene;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-1.5 rounded-lg pr-1 transition-colors ${
        active ? 'bg-accent-500/15 ring-1 ring-accent-500/30' : 'hover:bg-ink-800'
      }`}
    >
      <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-1 text-left">
        <FileText size={11} className="shrink-0 text-slate-500" />
        <span
          className={`flex-1 truncate text-[11px] ${
            active ? 'text-accent-300' : 'text-slate-400'
          }`}
        >
          {scene.title}
        </span>
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SCENE_STATUS_META[scene.status].dot}`} />
      </button>
      <button
        title="删除场景"
        onClick={onDelete}
        className="hidden shrink-0 rounded p-0.5 text-slate-600 hover:text-red-400 group-hover:block"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

function IconAction({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded p-0.5 transition-colors ${
        danger ? 'text-slate-600 hover:text-red-400' : 'text-slate-500 hover:text-accent-400'
      }`}
    >
      {children}
    </button>
  );
}

function Entry({
  icon,
  label,
  badge,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors ${
        active
          ? 'bg-ink-800 text-slate-100 ring-1 ring-accent-500/30'
          : 'text-slate-400 hover:bg-ink-800 hover:text-slate-200'
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && <span className="text-[10px] text-slate-600">{badge}</span>}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-ink-800/60 px-1 py-1.5">
      <div className="text-xs font-semibold text-slate-200">{value}</div>
      <div className="text-[9px] text-slate-500">{label}</div>
    </div>
  );
}

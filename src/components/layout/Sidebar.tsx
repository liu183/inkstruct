import { useMemo, useState } from 'react';
import {
  BookOpen, ChevronDown, ChevronRight, FileText, FolderOpen,
  Library, Plus, PenLine, ScrollText, Sparkles, Trash2,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { SCENE_STATUS_META } from '../../types';

export default function Sidebar() {
  const project = useProjectStore((s) => s.project);
  const activeChapterId = useProjectStore((s) => s.activeChapterId);
  const activeSceneId = useProjectStore((s) => s.activeSceneId);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const setActiveChapter = useProjectStore((s) => s.setActiveChapter);
  const addScene = useProjectStore((s) => s.addScene);
  const deleteScene = useProjectStore((s) => s.deleteScene);
  const setWorkspace = useUIStore((s) => s.setWorkspace);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const totalWords = useMemo(
    () => project.chapters.flatMap((c) => c.scenes).reduce((n, s) => n + s.wordCount, 0),
    [project]
  );

  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-ink-700/60 bg-ink-900/60">
      {/* 项目头部 */}
      <div className="flex items-center gap-2.5 border-b border-ink-700/60 px-3.5 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30">
          <BookOpen size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-100">{project.title}</div>
          <div className="truncate text-[10px] text-slate-500">
            {project.genre} · {project.author}
          </div>
        </div>
      </div>

      {/* 统计条 */}
      <div className="grid grid-cols-3 gap-1.5 border-b border-ink-700/60 px-3 py-2 text-center">
        <Stat label="章节" value={project.chapters.length} />
        <Stat label="场景" value={project.chapters.flatMap((c) => c.scenes).length} />
        <Stat label="字数" value={totalWords.toLocaleString()} />
      </div>

      {/* 章节树 */}
      <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          故事结构
        </span>
        <button
          className="text-slate-500 transition-colors hover:text-accent-400"
          title="新增章节"
          onClick={() => useProjectStore.getState().addChapter()}
        >
          <Plus size={14} />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
        {project.chapters.map((chapter) => {
          const isOpen = collapsed[chapter.id] !== true;
          const isActive = chapter.id === activeChapterId;
          return (
            <div key={chapter.id}>
              <button
                onClick={() => {
                  setActiveChapter(chapter.id);
                  toggle(chapter.id);
                }}
                className={`group flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                  isActive ? 'bg-ink-700/70 text-slate-100' : 'text-slate-400 hover:bg-ink-800 hover:text-slate-200'
                }`}
              >
                {isOpen ? <ChevronDown size={13} className="shrink-0" /> : <ChevronRight size={13} className="shrink-0" />}
                <FolderOpen size={13} className="shrink-0 text-accent-400/80" />
                <span className="flex-1 truncate">{chapter.title}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${SCENE_STATUS_META[chapter.status].dot}`} />
              </button>

              {isOpen && (
                <div className="ml-3 mt-0.5 space-y-0.5 border-l border-ink-700/60 pl-2">
                  {chapter.scenes.map((scene) => {
                    const active = scene.id === activeSceneId;
                    return (
                      <div
                        key={scene.id}
                        className="group relative flex items-center gap-1.5 rounded-lg pr-1"
                      >
                        <button
                          onClick={() => {
                            setActiveScene(scene.id);
                            setWorkspace('write');
                          }}
                          className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left text-[11px] transition-colors ${
                            active
                              ? 'bg-accent-500/15 text-accent-300 ring-1 ring-accent-500/30'
                              : 'text-slate-500 hover:bg-ink-800 hover:text-slate-300'
                          }`}
                        >
                          <FileText size={12} className="shrink-0" />
                          <span className="flex-1 truncate">{scene.title}</span>
                          <span className={`h-1 w-1 shrink-0 rounded-full ${SCENE_STATUS_META[scene.status].dot}`} />
                        </button>
                        <button
                          title="删除场景"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteScene(scene.id);
                          }}
                          className="hidden shrink-0 rounded p-0.5 text-slate-600 hover:text-red-400 group-hover:block"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => addScene(chapter.id)}
                    className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left text-[11px] text-slate-600 transition-colors hover:bg-ink-800 hover:text-accent-400"
                  >
                    <Plus size={11} /> 添加场景
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 底部功能入口 */}
      <div className="space-y-1 border-t border-ink-700/60 p-2">
        <button
          onClick={() => setWorkspace('codex')}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-400 transition-colors hover:bg-ink-800 hover:text-slate-200"
        >
          <Library size={14} className="text-gold/90" />
          <span className="flex-1">世界档案库 (Codex)</span>
          <span className="text-[10px] text-slate-600">{project.codex.length}</span>
        </button>
        <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-400 transition-colors hover:bg-ink-800 hover:text-slate-200">
          <ScrollText size={14} className="text-sky-400/90" />
          <span className="flex-1">章纲与存稿</span>
        </button>
        <button
          onClick={() => setWorkspace('inspiration')}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-400 transition-colors hover:bg-ink-800 hover:text-slate-200"
        >
          <Sparkles size={14} className="text-amber-400/90" />
          <span className="flex-1">开书灵感设计</span>
        </button>
        <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-400 transition-colors hover:bg-ink-800 hover:text-slate-200">
          <PenLine size={14} className="text-emerald-400/90" />
          <span className="flex-1">创作日志</span>
        </button>
      </div>
    </aside>
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

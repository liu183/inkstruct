import { useEffect, useRef, useState } from 'react';
import {
  BookOpen, Check, ChevronDown, Copy, Pencil, Plus, Trash2, X,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { totalWords as countWords } from '../../utils/structure';
import type { Project } from '../../types';

/**
 * 项目(书)切换器:
 * - 切换 / 新建 / 重命名 / 复制 / 删除
 * - 所有改动即时持久化到 localStorage
 */
export default function ProjectSwitcher() {
  const projects = useProjectStore((s) => s.projects);
  const project = useProjectStore((s) => s.project);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const createProject = useProjectStore((s) => s.createProject);
  const updateProjectMeta = useProjectStore((s) => s.updateProjectMeta);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);
  const setStatusMessage = useUIStore((s) => s.setStatusMessage);

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      if (!rootRef.current?.contains(ev.target as Node)) {
        setOpen(false);
        setCreating(false);
        setRenaming(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative border-b border-ink-700/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-ink-800/60"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30">
          <BookOpen size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-100">{project.title}</div>
          <div className="truncate text-[10px] text-slate-500">
            {project.genre || '未分类'} · {project.author || '佚名'}
          </div>
        </div>
        <ChevronDown size={14} className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-2 right-2 top-full z-40 mt-1 overflow-hidden rounded-xl border border-ink-600 bg-ink-850 shadow-2xl animate-slide-up">
          {/* 项目列表 */}
          <div className="max-h-64 overflow-y-auto py-1">
            {projects.map((p) => (
              <div
                key={p.id}
                className={`group flex items-center gap-2 px-2 py-1.5 transition-colors ${
                  p.id === project.id ? 'bg-accent-500/10' : 'hover:bg-ink-800'
                }`}
              >
                <button
                  onClick={() => {
                    setActiveProject(p.id);
                    setOpen(false);
                    setStatusMessage(`已切换到《${p.title}》`);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <Check
                    size={13}
                    className={`shrink-0 ${p.id === project.id ? 'text-accent-400' : 'text-transparent'}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-medium text-slate-200">{p.title}</div>
                    <div className="truncate text-[9px] text-slate-600">
                      {p.genre || '未分类'} · {countWords(p).toLocaleString()} 字
                    </div>
                  </div>
                </button>
                <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                  <MiniBtn
                    title="复制此书"
                    onClick={() => {
                      duplicateProject(p.id);
                      setOpen(false);
                      setStatusMessage('已复制为副本');
                    }}
                  >
                    <Copy size={11} />
                  </MiniBtn>
                  <MiniBtn
                    title="删除此书"
                    danger
                    onClick={() => {
                      if (projects.length <= 1) {
                        setStatusMessage('至少保留一本书');
                        return;
                      }
                      if (confirm(`删除《${p.title}》?此操作不可撤销`)) {
                        deleteProject(p.id);
                        setOpen(false);
                        setStatusMessage('已删除');
                      }
                    }}
                  >
                    <Trash2 size={11} />
                  </MiniBtn>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-ink-700/60 p-1">
            {renaming ? (
              <MetaForm
                title="重命名当前书"
                initial={{
                  title: project.title,
                  author: project.author,
                  genre: project.genre,
                  logline: project.logline,
                }}
                submitLabel="保存"
                onSubmit={(v) => {
                  updateProjectMeta(v);
                  setRenaming(false);
                  setStatusMessage('已更新作品信息');
                }}
                onCancel={() => setRenaming(false)}
              />
            ) : creating ? (
              <MetaForm
                title="新建一本书"
                initial={{ title: '', author: project.author, genre: '', logline: '' }}
                submitLabel="创建"
                onSubmit={(v) => {
                  createProject(v);
                  setCreating(false);
                  setOpen(false);
                  setStatusMessage(`已创建《${v.title}》`);
                }}
                onCancel={() => setCreating(false)}
              />
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={() => setCreating(true)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-accent-300 transition-colors hover:bg-ink-800"
                >
                  <Plus size={12} />
                  新建
                </button>
                <button
                  onClick={() => setRenaming(true)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-ink-800 hover:text-slate-200"
                >
                  <Pencil size={12} />
                  编辑信息
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** 作品元信息表单:书名 / 作者 / 题材 / 一句话简介 */
function MetaForm({
  title,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  title: string;
  initial: Pick<Project, 'title' | 'author' | 'genre' | 'logline'>;
  submitLabel: string;
  onSubmit: (v: Pick<Project, 'title' | 'author' | 'genre' | 'logline'>) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(initial);

  return (
    <div className="space-y-2 p-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
        <Pencil size={11} />
        {title}
      </div>
      <input
        autoFocus
        value={v.title}
        onChange={(e) => setV({ ...v, title: e.target.value })}
        placeholder="书名,如《青云问道》"
        className="input-dark !py-1.5 text-[11px]"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={v.author}
          onChange={(e) => setV({ ...v, author: e.target.value })}
          placeholder="笔名"
          className="input-dark !py-1.5 text-[11px]"
        />
        <input
          value={v.genre}
          onChange={(e) => setV({ ...v, genre: e.target.value })}
          placeholder="题材,如 仙侠 · 玄幻"
          className="input-dark !py-1.5 text-[11px]"
        />
      </div>
      <textarea
        value={v.logline}
        onChange={(e) => setV({ ...v, logline: e.target.value })}
        rows={2}
        placeholder="一句话简介:主角是谁,要干什么,赌注是什么"
        className="input-dark w-full resize-none !py-1.5 text-[11px]"
      />
      <div className="flex gap-1.5">
        <button
          onClick={onCancel}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-ink-800"
        >
          <X size={12} />
          取消
        </button>
        <button
          onClick={() => onSubmit(v)}
          disabled={!v.title.trim()}
          className="btn-primary flex-1 !py-1.5 text-[11px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check size={12} />
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function MiniBtn({
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
      className={`rounded p-1 transition-colors ${
        danger ? 'text-slate-600 hover:text-red-400' : 'text-slate-500 hover:text-accent-400'
      }`}
    >
      {children}
    </button>
  );
}

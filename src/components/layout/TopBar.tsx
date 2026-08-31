import {
  BookMarked, Grid3x3, LayoutGrid, ListTree, Map, PenSquare,
  PanelRight, Settings, Share2, Sparkles, Target,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useProjectStore, useActiveScene } from '../../store/useProjectStore';
import { locateChapter } from '../../utils/structure';
import type { PlanViewMode, Workspace } from '../../types';

const WORKSPACES: { id: Workspace; label: string; icon: typeof PenSquare; hint: string }[] = [
  { id: 'plan',        label: 'Plan',  icon: Map,        hint: '规划工作台' },
  { id: 'write',       label: 'Write', icon: PenSquare,  hint: '写作工作台' },
  { id: 'codex',       label: 'Codex', icon: BookMarked, hint: '世界档案库' },
  { id: 'inspiration', label: '灵感',   icon: Sparkles,   hint: 'AI 灵感助手' },
];

const PLAN_VIEWS: { id: PlanViewMode; label: string; icon: typeof Grid3x3 }[] = [
  { id: 'grid',    label: '网格',   icon: Grid3x3 },
  { id: 'matrix',  label: '矩阵',   icon: LayoutGrid },
  { id: 'outline', label: '大纲',   icon: ListTree },
];

export default function TopBar() {
  const workspace = useUIStore((s) => s.workspace);
  const setWorkspace = useUIStore((s) => s.setWorkspace);
  const planViewMode = useUIStore((s) => s.planViewMode);
  const setPlanViewMode = useUIStore((s) => s.setPlanViewMode);
  const setCodexDrawerOpen = useUIStore((s) => s.setCodexDrawerOpen);
  const codexDrawerOpen = useUIStore((s) => s.codexDrawerOpen);
  const setAiPanelOpen = useUIStore((s) => s.setAiPanelOpen);
  const setShareOpen = useUIStore((s) => s.setShareOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const aiPanelOpen = useUIStore((s) => s.aiPanelOpen);

  const scene = useActiveScene();
  const project = useProjectStore((s) => s.project);
  const loc = useProjectStore((s) => locateChapter(s.project, s.activeChapterId));

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-ink-700/60 bg-ink-900/70 px-3 backdrop-blur">
      {/* 品牌标识 */}
      <div className="flex shrink-0 items-center gap-2 pr-1" title="墨构 InkStruct · 构世界,写长篇">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-violet-500 text-[13px] font-bold text-white shadow-glow">
          墨
        </div>
        <div className="hidden leading-none lg:block">
          <div className="text-[13px] font-semibold tracking-wide text-slate-100">墨构</div>
          <div className="text-[9px] tracking-wider text-slate-500">InkStruct</div>
        </div>
      </div>
      <div className="h-5 w-px shrink-0 bg-ink-700" />

      {/* 工作台切换 */}
      <div className="flex items-center gap-0.5 rounded-lg bg-ink-800/80 p-0.5 ring-1 ring-ink-700/60">
        {WORKSPACES.map((w) => {
          const Icon = w.icon;
          const active = workspace === w.id;
          return (
            <button
              key={w.id}
              title={w.hint}
              onClick={() => setWorkspace(w.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? 'bg-accent-600 text-white shadow-glow'
                  : 'text-slate-400 hover:bg-ink-700/60 hover:text-slate-200'
              }`}
            >
              <Icon size={14} />
              {w.label}
            </button>
          );
        })}
      </div>

      {/* 当前定位:项目 / 卷 / 单元 / 章 / 场景 */}
      <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
        {(workspace === 'drafts' || workspace === 'journal') && (
          <>
            <span className="rounded bg-ink-800 px-1.5 py-px text-[10px] font-medium text-accent-300 ring-1 ring-ink-700/60">
              {workspace === 'drafts' ? '章纲与存稿' : '创作日志'}
            </span>
            <span className="text-slate-700">/</span>
          </>
        )}
        <span className="truncate">{project.title}</span>
        {loc && (
          <>
            <span className="text-slate-700">/</span>
            <span className="max-w-24 truncate">{loc.volume.title}</span>
            <span className="text-slate-700">/</span>
            <span className="max-w-24 truncate">{loc.unit.title}</span>
            <span className="text-slate-700">/</span>
            <span className="max-w-32 truncate text-slate-300">{loc.chapter.title}</span>
          </>
        )}
        {workspace === 'write' && scene && (
          <>
            <span className="text-slate-700">/</span>
            <span className="max-w-40 truncate text-accent-300">{scene.title}</span>
          </>
        )}
      </div>

      {/* Plan 视图模式切换 */}
      {workspace === 'plan' && (
        <div className="ml-auto flex items-center gap-0.5 rounded-lg bg-ink-800/80 p-0.5 ring-1 ring-ink-700/60">
          {PLAN_VIEWS.map((v) => {
            const Icon = v.icon;
            const active = planViewMode === v.id;
            return (
              <button
                key={v.id}
                title={`${v.label}视图`}
                onClick={() => setPlanViewMode(v.id)}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                  active
                    ? 'bg-ink-700 text-accent-300 ring-1 ring-accent-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={13} />
                {v.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 右侧工具 */}
      <div className="ml-auto flex items-center gap-1.5">
        {workspace === 'write' && (
          <button
            title="打开 Codex 抽屉"
            onClick={() => setCodexDrawerOpen(!codexDrawerOpen)}
            className={`btn ${codexDrawerOpen ? 'btn-primary' : 'btn-ghost'}`}
          >
            <PanelRight size={14} />
            Codex
          </button>
        )}
        <button
          title="AI 助手"
          onClick={() => setAiPanelOpen(true)}
          className={`btn ${aiPanelOpen ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Sparkles size={14} className="text-amber-400" />
          AI
        </button>
        <button
          title="分享与导出"
          onClick={() => setShareOpen(true)}
          className="btn-ghost !px-2"
        >
          <Share2 size={14} />
        </button>
        <button title="设置" onClick={() => setSettingsOpen(true)} className="btn-ghost !px-2">
          <Settings size={14} />
        </button>
        <div className="mx-1 h-5 w-px bg-ink-700" />
        <div className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-2 py-1 text-[11px] text-slate-400 ring-1 ring-ink-700/60">
          <Target size={12} className="text-accent-400" />
          {scene ? `${scene.wordCount.toLocaleString()} 字` : '—'}
        </div>
      </div>
    </header>
  );
}

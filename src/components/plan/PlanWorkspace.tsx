import { TrendingUp } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useProjectStore } from '../../store/useProjectStore';
import { flatChapters, statusStats, totalWords } from '../../utils/structure';
import GridView from './GridView';
import MatrixView from './MatrixView';
import OutlineView from './OutlineView';

export default function PlanWorkspace() {
  const mode = useUIStore((s) => s.planViewMode);
  const project = useProjectStore((s) => s.project);
  const stats = statusStats(project);
  const words = totalWords(project);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 项目概览头部 */}
      <div className="border-b border-ink-700/60 bg-gradient-to-r from-ink-900 via-ink-850 to-ink-900 px-5 py-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-wide text-slate-100">{project.title}</h1>
            <p className="mt-0.5 line-clamp-2 max-w-2xl text-xs leading-relaxed text-slate-500">
              {project.logline}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="panel flex items-center gap-3 px-3 py-2 text-center">
              <MiniStat label="卷" value={project.volumes.length} />
              <Divider />
              <MiniStat label="章" value={flatChapters(project).length} />
              <Divider />
              <MiniStat label="场景" value={stats.total} />
              <Divider />
              <MiniStat label="总字数" value={words.toLocaleString()} />
            </div>
            <div className="panel flex items-center gap-1.5 px-3 py-2 text-[11px] text-emerald-400">
              <TrendingUp size={13} />
              完成 {stats.done}/{stats.total}
            </div>
          </div>
        </div>
      </div>

      {/* 视图主体 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {mode === 'grid' && <GridView />}
        {mode === 'matrix' && <MatrixView />}
        {mode === 'outline' && <OutlineView />}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-100">{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}
function Divider() {
  return <div className="h-7 w-px bg-ink-700/70" />;
}

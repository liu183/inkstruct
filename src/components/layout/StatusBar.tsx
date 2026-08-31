import { CheckCircle2, Cloud, Loader2 } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useProjectStore } from '../../store/useProjectStore';
import { locateScene, totalWords as countWords } from '../../utils/structure';

export default function StatusBar() {
  const statusMessage = useUIStore((s) => s.statusMessage);
  const project = useProjectStore((s) => s.project);
  const scene = useProjectStore((s) => locateScene(s.project, s.activeSceneId)?.scene ?? null);

  const totalWords = countWords(project);

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-ink-700/60 bg-ink-900/70 px-3 text-[10px] text-slate-500">
      <div className="flex items-center gap-1.5">
        <Cloud size={11} className="text-emerald-400/80" />
        已保存到云端
      </div>
      <div className="flex items-center gap-1.5 text-slate-600">
        <CheckCircle2 size={11} />
        内容一致
      </div>

      <div className="mx-auto flex items-center gap-1.5 text-accent-300/90">
        <Loader2 size={11} className="animate-spin" />
        {statusMessage}
      </div>

      <div className="flex items-center gap-3">
        <span>全书 {totalWords.toLocaleString()} 字</span>
        <span>·</span>
        <span>当前场景 {scene ? `${scene.wordCount.toLocaleString()} 字` : '—'}</span>
        <span>·</span>
        <span className="text-slate-600">墨构 InkStruct v0.1.0</span>
      </div>
    </footer>
  );
}

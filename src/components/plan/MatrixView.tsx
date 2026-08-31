import { useMemo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { SCENE_STATUS_META } from '../../types';
import { flatScenes } from '../../utils/structure';

/**
 * Matrix 视图:以表格矩阵呈现"场景 × 属性",方便横向对比节奏与分布
 */
export default function MatrixView() {
  const project = useProjectStore((s) => s.project);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const setWorkspace = useUIStore((s) => s.setWorkspace);

  const rows = useMemo(
    () =>
      flatScenes(project).map(({ volume, unit, chapter, scene }) => ({
        sceneId: scene.id,
        /** 卷/单元/章 的路径标识,用于判断分组换行 */
        groupKey: `${volume.id}::${unit.id}::${chapter.id}`,
        chapterNo: chapter.order,
        chapterTitle: chapter.title,
        order: scene.order,
        title: scene.title,
        pov: scene.pov || '—',
        location: scene.location || '—',
        timeline: scene.timeline || '—',
        mood: scene.mood || '—',
        status: scene.status,
        words: scene.wordCount,
      })),
    [project]
  );

  return (
    <div className="p-5">
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-ink-700/60 bg-ink-900/60 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2.5 font-medium">章节</th>
                <th className="px-3 py-2.5 font-medium">场景</th>
                <th className="px-3 py-2.5 font-medium">视角 (POV)</th>
                <th className="px-3 py-2.5 font-medium">地点</th>
                <th className="px-3 py-2.5 font-medium">时间线</th>
                <th className="px-3 py-2.5 font-medium">情绪基调</th>
                <th className="px-3 py-2.5 font-medium">状态</th>
                <th className="px-3 py-2.5 text-right font-medium">字数</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const meta = SCENE_STATUS_META[row.status as keyof typeof SCENE_STATUS_META] ?? SCENE_STATUS_META.idea;
                const isNewChapter = i === 0 || rows[i - 1].groupKey !== row.groupKey;
                return (
                  <tr
                    key={row.sceneId}
                    onClick={() => {
                      setActiveScene(row.sceneId);
                      setWorkspace('write');
                    }}
                    className={`group cursor-pointer transition-colors hover:bg-accent-500/[0.06] ${
                      isNewChapter ? 'border-t border-ink-700/70' : ''
                    } border-b border-ink-700/30`}
                  >
                    {isNewChapter ? (
                      <td className="max-w-36 px-3 py-2.5 align-top">
                        <div className="truncate text-[11px] font-medium text-slate-300" title={row.chapterTitle}>
                          {row.chapterTitle}
                        </div>
                        <div className="font-mono text-[9px] text-accent-400/70">CH.{row.chapterNo}</div>
                      </td>
                    ) : (
                      <td className="px-3 py-2.5 align-top" />
                    )}
                    <td className="max-w-44 px-3 py-2.5">
                      <div className="truncate font-medium text-slate-200 group-hover:text-accent-300">
                        {row.order}. {row.title}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-violet-300/90">{row.pov}</td>
                    <td className="px-3 py-2.5 text-emerald-300/80">{row.location}</td>
                    <td className="px-3 py-2.5 text-amber-300/80">{row.timeline}</td>
                    <td className="px-3 py-2.5 text-slate-400">{row.mood}</td>
                    <td className="px-3 py-2.5">
                      <span className={`chip ${meta.color} bg-ink-800`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-500">{row.words.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 px-1 text-[11px] text-slate-600">
        💡 提示:在矩阵视图中可快速扫描 POV 分布与节奏密度,点击任意行可跳转到对应场景。
      </p>
    </div>
  );
}

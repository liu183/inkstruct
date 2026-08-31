import { useRef, useState } from 'react';
import {
  Clock, GripVertical, MapPin, Sparkles, UserRound,
} from 'lucide-react';
import { useActiveChapter, useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { SCENE_STATUS_META, type Chapter } from '../../types';
import { locateScene } from '../../utils/structure';
import { streamAIText } from '../../utils/aiEngine';
import SceneEditor from './SceneEditor';
import CodexDrawer from './CodexDrawer';
import AmbientInspiration from './AmbientInspiration';

/**
 * Write 写作工作台(章级):
 * - 一章的所有场景正文连续排版,场景之间用分隔横幅标识,正文放在一起写
 * - 左侧「本章结构」列出 Plan 已规划的场景与节拍,点击定位;节拍可一键 AI 扩写
 */
export default function WriteWorkspace() {
  const chapter = useActiveChapter();
  const activeSceneId = useProjectStore((s) => s.activeSceneId);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const updateSceneContent = useProjectStore((s) => s.updateSceneContent);
  const setStatusMessage = useUIStore((s) => s.setStatusMessage);
  const codexDrawerOpen = useUIStore((s) => s.codexDrawerOpen);
  const focusMode = useUIStore((s) => s.focusMode);

  const sceneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [expandingBeat, setExpandingBeat] = useState<string | null>(null);

  if (!chapter) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-600">
        请先在 Plan 中创建章节与场景
      </div>
    );
  }

  const jumpToScene = (sceneId: string) => {
    setActiveScene(sceneId);
    sceneRefs.current[sceneId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /** 扩写节拍:AI 生成一段正文,带「◆ 节拍N」标识插入该场景正文末尾 */
  const expandBeat = async (sceneId: string, beatSummary: string, idx: number) => {
    if (expandingBeat) return;
    const scene = locateScene(useProjectStore.getState().project, sceneId)?.scene;
    if (!scene) return;
    setExpandingBeat(sceneId);
    setStatusMessage(`正在扩写节拍 ${idx + 1}…`);
    let acc = '';
    try {
      for await (const chunk of streamAIText({
        commandId: 'ai-beat-expand',
        sceneTitle: beatSummary.trim() || `节拍 ${idx + 1}`,
        pov: scene.pov || '主角',
        location: scene.location || '场景',
        mood: scene.mood || '紧张',
        content: scene.content,
        labels: scene.labels,
      })) {
        acc += chunk;
      }
      const marker = `◆ 节拍 ${idx + 1} · ${beatSummary.trim() || '未命名'}`;
      const sep = scene.content.trim() ? '\n\n' : '';
      updateSceneContent(sceneId, scene.content.trimEnd() + sep + marker + '\n' + acc.trim());
      setStatusMessage(`节拍 ${idx + 1} 扩写已插入「${scene.title}」正文`);
    } catch {
      setStatusMessage('扩写失败,请重试');
    } finally {
      setExpandingBeat(null);
    }
  };

  return (
    <div className="flex h-full min-w-0">
      {/* 本章结构导航 */}
      {!focusMode && (
        <ChapterNav
          chapter={chapter}
          activeSceneId={activeSceneId}
          onJump={jumpToScene}
          onExpandBeat={expandBeat}
          expanding={expandingBeat}
        />
      )}

      {/* 章级连续编辑器:所有场景正文放一起,场景框已在左侧导航,这里只展示正文 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-6">
          {chapter.scenes.map((scene) => (
            <div
              key={scene.id}
              ref={(el) => {
                sceneRefs.current[scene.id] = el;
              }}
              className="border-b border-ink-700/30 last:border-b-0"
            >
              <SceneEditor scene={scene} />
            </div>
          ))}

          {chapter.scenes.length === 0 && (
            <div className="rounded-xl border border-dashed border-ink-700/50 bg-ink-900/30 px-4 py-12 text-center text-[11px] text-slate-600">
              本章还没有场景,回 Plan 规划后再来写作
            </div>
          )}
        </div>
      </div>

      {/* Codex 抽屉 */}
      {codexDrawerOpen && !focusMode && <CodexDrawer />}

      {/* 自动灵感弹卡 */}
      <AmbientInspiration />
    </div>
  );
}

/* ============ 本章结构导航 ============ */

function ChapterNav({
  chapter,
  activeSceneId,
  onJump,
  onExpandBeat,
  expanding,
}: {
  chapter: Chapter;
  activeSceneId: string;
  onJump: (sceneId: string) => void;
  onExpandBeat: (sceneId: string, beatSummary: string, idx: number) => void;
  expanding: string | null;
}) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-ink-700/60 bg-ink-900/50">
      <div className="border-b border-ink-700/40 px-3 py-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          本章结构
        </div>
        <div className="mt-0.5 truncate text-[11px] font-medium text-slate-300">{chapter.title}</div>
        <div className="mt-0.5 text-[9px] text-slate-600">
          {chapter.scenes.length} 个场景 · {chapter.scenes.reduce((n, s) => n + s.beats.length, 0)} 个节拍
        </div>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-2 py-2">
        {chapter.scenes.map((scene, i) => {
          const active = scene.id === activeSceneId;
          return (
            <div
              key={scene.id}
              className={`overflow-hidden rounded-lg border transition-all ${
                active
                  ? 'border-accent-500/40 bg-accent-500/[0.07]'
                  : 'border-ink-700/40 bg-ink-850/50 hover:border-ink-600'
              }`}
            >
              {/* 场景行 */}
              <button
                onClick={() => onJump(scene.id)}
                className="flex w-full items-center gap-1.5 px-2 py-2 text-left"
              >
                <span className="shrink-0 rounded bg-accent-500/15 px-1 py-px font-mono text-[9px] font-bold text-accent-300 ring-1 ring-accent-500/20">
                  {i + 1}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-[11px] font-medium ${
                    active ? 'text-accent-200' : 'text-slate-300'
                  }`}
                >
                  {scene.title}
                </span>
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SCENE_STATUS_META[scene.status].dot}`} />
              </button>

              {/* 节拍列表 */}
              {scene.beats.length > 0 && (
                <div className="space-y-0.5 border-t border-ink-700/30 px-2 py-1.5">
                  {scene.beats.map((beat, idx) => (
                    <div key={beat.id} className="group flex items-start gap-1.5 rounded px-1 py-0.5">
                      <button
                        onClick={() => onJump(scene.id)}
                        title={`定位到场景:${beat.summary}`}
                        className="flex min-w-0 flex-1 items-start gap-1.5 text-left transition-colors hover:bg-ink-800"
                      >
                        <GripVertical size={9} className="mt-0.5 shrink-0 text-slate-700" />
                        <span className="shrink-0 font-mono text-[9px] text-accent-400/60">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="line-clamp-2 min-w-0 flex-1 text-[10px] leading-relaxed text-slate-500 group-hover:text-slate-400">
                          {beat.summary || '（空节拍）'}
                        </span>
                      </button>
                      <button
                        title="AI 扩写此节拍,插入该场景正文"
                        onClick={() => onExpandBeat(scene.id, beat.summary, idx)}
                        disabled={!!expanding}
                        className="mt-0.5 shrink-0 rounded p-1 text-amber-400/70 transition-colors hover:bg-amber-500/15 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Sparkles size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-ink-700/40 px-3 py-2 text-[9px] leading-relaxed text-slate-700">
        场景来自 Plan 规划 · 点击定位 · ✨ 逐节拍扩写
      </div>
    </aside>
  );
}

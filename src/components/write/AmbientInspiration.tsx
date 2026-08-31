import { useEffect, useState } from 'react';
import { ArrowUpRight, BookmarkPlus, RefreshCw, Sparkles, X } from 'lucide-react';
import { useProjectStore, useActiveScene } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { targetedInspirationCards } from '../../data/inspirationEngine';
import type { InspirationCard } from '../../types';
import { INSPIRATION_TYPE_META } from '../../types';

const FREQ_MS = { low: 120000, medium: 60000, high: 30000 } as const;

/**
 * Write 页自动灵感弹卡:
 * 按配置频率随机弹出灵感提示,可收藏到灵感池 / 换一条 / 跳转灵感助手。
 */
export default function AmbientInspiration() {
  const project = useProjectStore((s) => s.project);
  const config = project.inspirationConfig;
  const scene = useActiveScene();
  const focusMode = useUIStore((s) => s.focusMode);
  const setWorkspace = useUIStore((s) => s.setWorkspace);
  const setStatusMessage = useUIStore((s) => s.setStatusMessage);

  const addCard = useProjectStore((s) => s.addInspirationCard);

  const [card, setCard] = useState<InspirationCard | null>(null);
  const [dismissedUntil, setDismissedUntil] = useState(0);

  const gen = () =>
    setCard(
      targetedInspirationCards(
        config,
        {
          scene: scene
            ? { title: scene.title, pov: scene.pov, location: scene.location, mood: scene.mood, labels: scene.labels }
            : undefined,
          codex: project.codex,
        },
        1
      ).cards[0]
    );

  // 自动弹出
  useEffect(() => {
    if (!config.ambientEnabled || focusMode) return;
    const timer = setInterval(() => {
      if (Date.now() > dismissedUntil) gen();
    }, FREQ_MS[config.ambientFrequency]);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.ambientEnabled, config.ambientFrequency, focusMode, dismissedUntil, project.codex, scene]);

  if (focusMode || !config.ambientEnabled) return null;

  const dismiss = (minutes: number) => {
    setCard(null);
    setDismissedUntil(Date.now() + minutes * 60_000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {/* 弹卡 */}
      {card && (
        <div className="w-80 overflow-hidden rounded-xl border border-amber-500/40 bg-ink-850/95 shadow-2xl backdrop-blur animate-slide-up">
          <div className="flex items-center gap-1.5 border-b border-ink-700/50 px-3 py-2">
            <Sparkles size={12} className="text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-200">AI 灵感提示</span>
            <span
              className="rounded px-1.5 py-px text-[9px] font-bold text-ink-950"
              style={{ background: INSPIRATION_TYPE_META[card.type].color }}
            >
              {INSPIRATION_TYPE_META[card.type].label}
            </span>
            <button
              onClick={() => dismiss(5)}
              className="ml-auto rounded p-0.5 text-slate-600 transition-colors hover:text-slate-300"
              title="关闭(5 分钟内不再弹出)"
            >
              <X size={12} />
            </button>
          </div>
          <div className="px-3 py-2.5">
            <div className="text-xs font-semibold leading-snug text-slate-100">
              {card.type === 'title' ? card.hook : card.title}
            </div>
            {card.type !== 'title' && (
              <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{card.hook}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 border-t border-ink-700/50 px-3 py-2">
            <button
              onClick={() => {
                addCard(card);
                setStatusMessage(`灵感「${card.title}」已收藏到灵感池`);
                dismiss(5);
              }}
              className="btn !py-1 text-[10px] text-amber-300 hover:bg-amber-500/10"
            >
              <BookmarkPlus size={11} />
              收藏
            </button>
            <button onClick={gen} className="btn !py-1 text-[10px] text-slate-400 hover:bg-ink-700">
              <RefreshCw size={11} />
              换一条
            </button>
            <button
              onClick={() => {
                setWorkspace('inspiration');
              }}
              className="btn ml-auto !py-1 text-[10px] text-accent-300 hover:bg-accent-500/10"
            >
              去灵感助手
              <ArrowUpRight size={11} />
            </button>
          </div>
        </div>
      )}

      {/* 悬浮触发按钮 */}
      {!card && (
        <button
          onClick={gen}
          title="立即生成一条灵感"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-ink-950 shadow-glow transition-transform hover:scale-105"
        >
          <Sparkles size={18} />
        </button>
      )}
    </div>
  );
}

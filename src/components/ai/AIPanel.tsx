import { useState } from 'react';
import {
  Check, Eye, Lightbulb, ListOrdered, Maximize2, MessageSquareText, Minimize2,
  PenLine, RefreshCw, Sparkles, Square, Wand2, X,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { useAIWriter } from '../../hooks/useAIWriter';
import { locateScene } from '../../utils/structure';
import CommandOutput from './CommandOutput';

interface AITask {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  /** 该命令是否需要选中/已有正文 */
  needsContent: boolean;
}

const GENERATE_TASKS: AITask[] = [
  { id: 'ai-continue',   label: '续写',     desc: '接着当前正文往下写',         icon: <PenLine size={13} />,         needsContent: true },
  { id: 'ai-generate',   label: '生成',     desc: '按场景设定生成一段正文',     icon: <Sparkles size={13} />,        needsContent: false },
  { id: 'ai-dialogue',   label: '对话',     desc: '生成角色对话',               icon: <MessageSquareText size={13} />, needsContent: false },
  { id: 'ai-describe',   label: '描写',     desc: '生成环境/战斗描写',          icon: <Eye size={13} />,             needsContent: false },
  { id: 'ai-brainstorm', label: '头脑风暴', desc: '生成情节走向与点子',         icon: <Lightbulb size={13} />,       needsContent: false },
  { id: 'ai-beat',       label: '节拍',     desc: '生成这一场的节拍大纲',       icon: <ListOrdered size={13} />,     needsContent: false },
];

const EDIT_TASKS: AITask[] = [
  { id: 'ai-polish',    label: '润色', desc: '打磨文笔,提升表现力', icon: <Wand2 size={13} />,      needsContent: true },
  { id: 'ai-expand',    label: '扩写', desc: '补充细节,拉长篇幅',   icon: <Maximize2 size={13} />,  needsContent: true },
  { id: 'ai-condense',  label: '压缩', desc: '精简冗余,加快节奏',   icon: <Minimize2 size={13} />,  needsContent: true },
  { id: 'ai-rewrite',   label: '改写', desc: '换个风格重写',         icon: <RefreshCw size={13} />,  needsContent: true },
  { id: 'ai-summarize', label: '总结', desc: '概括本场要点',         icon: <Check size={13} />,      needsContent: true },
];

/**
 * AI 助手面板:对当前场景执行生成 / 编辑命令,流式输出后可插入正文
 */
export default function AIPanel() {
  const open = useUIStore((s) => s.aiPanelOpen);
  const setOpen = useUIStore((s) => s.setAiPanelOpen);
  const setStatusMessage = useUIStore((s) => s.setStatusMessage);
  const setWorkspace = useUIStore((s) => s.setWorkspace);

  const { state, runAI, stop, applyToScene, discard } = useAIWriter();

  const [applyMode, setApplyMode] = useState<'append' | 'replace'>('append');

  const sceneLoc = useProjectStore((s) => locateScene(s.project, s.activeSceneId)?.scene ?? null);

  if (!open) return null;

  const run = (task: AITask) => {
    if (!sceneLoc) {
      setStatusMessage('请先在写作页打开一个场景');
      return;
    }
    if (task.needsContent && !sceneLoc.content.trim()) {
      setStatusMessage('当前场景还没有正文,换用「生成」类命令');
      return;
    }
    runAI(task.id, {
      commandId: task.id,
      sceneTitle: sceneLoc.title,
      pov: sceneLoc.pov,
      location: sceneLoc.location,
      mood: sceneLoc.mood,
      content: sceneLoc.content,
      labels: sceneLoc.labels,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-[2px]" onClick={() => setOpen(false)} />

      <aside className="relative flex h-full w-[400px] flex-col border-l border-ink-700 bg-ink-900 shadow-2xl animate-slide-up">
        {/* 头部 */}
        <div className="flex items-center gap-2 border-b border-ink-700/60 px-4 py-3">
          <Sparkles size={15} className="text-amber-400" />
          <span className="text-sm font-semibold text-slate-100">AI 助手</span>
          <span className="text-[10px] text-slate-600">墨构 InkStruct</span>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-slate-200"
          >
            <X size={15} />
          </button>
        </div>

        {/* 当前作用对象 */}
        <div className="border-b border-ink-700/40 bg-ink-850/50 px-4 py-2.5">
          {sceneLoc ? (
            <>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                作用于当前场景
              </div>
              <div className="mt-0.5 truncate text-xs font-medium text-slate-200">{sceneLoc.title}</div>
              <div className="mt-0.5 text-[10px] text-slate-500">
                {sceneLoc.pov || '未设视角'} · {sceneLoc.location || '未设地点'} ·{' '}
                {sceneLoc.wordCount.toLocaleString()} 字
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">还没有打开场景</span>
              <button
                onClick={() => {
                  setOpen(false);
                  setWorkspace('write');
                }}
                className="text-[10px] text-accent-300 transition-colors hover:text-accent-200"
              >
                去写作页 →
              </button>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {/* 生成类 */}
          <Section title="生成" hint="从无到有产出内容" />
          <div className="mt-2 grid grid-cols-2 gap-2">
            {GENERATE_TASKS.map((t) => (
              <TaskButton key={t.id} task={t} disabled={state.active} onClick={() => run(t)} />
            ))}
          </div>

          {/* 编辑类 */}
          <div className="mt-5">
            <Section title="编辑" hint="基于已写正文加工" />
            <div className="mt-2 grid grid-cols-2 gap-2">
              {EDIT_TASKS.map((t) => (
                <TaskButton key={t.id} task={t} disabled={state.active} onClick={() => run(t)} />
              ))}
            </div>
          </div>

          {/* 输出区 */}
          {state.active && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-200">
                <Sparkles size={12} className="animate-pulse" />
                正在{state.commandLabel}…
                <button
                  onClick={stop}
                  className="ml-auto flex items-center gap-1 rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-slate-300 transition-colors hover:text-red-400"
                >
                  <Square size={10} />
                  停止
                </button>
              </div>
              <div className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300">
                {state.output}
                <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-amber-400 align-middle" />
              </div>
            </div>
          )}

          {!state.active && state.output && (
            <CommandOutput
              label={state.commandLabel}
              output={state.output}
              mode={applyMode}
              onModeChange={setApplyMode}
              onApply={() => sceneLoc && applyToScene(sceneLoc.id, applyMode)}
              onDiscard={discard}
            />
          )}

          {state.error && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/[0.06] p-2.5 text-[11px] text-red-300">
              {state.error}
            </div>
          )}
        </div>

        {/* 底部说明 */}
        <div className="border-t border-ink-700/60 px-4 py-2.5 text-[9px] leading-relaxed text-slate-600">
          当前为本地模拟引擎(流式打字机效果)。接入真实大模型时,只需替换
          <code className="mx-1 rounded bg-ink-800 px-1 text-slate-400">src/utils/aiEngine.ts</code>
          内部实现,UI 与交互无需改动。
        </div>
      </aside>
    </div>
  );
}

function Section({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
      {title}
      <span className="text-[9px] font-normal text-slate-600">{hint}</span>
    </div>
  );
}

function TaskButton({
  task,
  onClick,
  disabled,
}: {
  task: AITask;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-start gap-0.5 rounded-lg border border-ink-700/60 bg-ink-850/70 px-2.5 py-2 text-left transition-all hover:border-accent-500/40 hover:bg-ink-850 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200">
        <span className="text-accent-400">{task.icon}</span>
        {task.label}
      </span>
      <span className="text-[9px] leading-tight text-slate-500">{task.desc}</span>
    </button>
  );
}

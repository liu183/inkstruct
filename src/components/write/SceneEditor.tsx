import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown, FilePen, ListPlus, Maximize, MessageSquarePlus,
  MousePointerClick, PenLine, Sparkles, WandSparkles, X, ZoomIn,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { useAIWriter } from '../../hooks/useAIWriter';
import { SCENE_STATUS_META, type Scene } from '../../types';
import AICommandPanel from './AICommandPanel';
import SlashMenu from './SlashMenu';
import { SLASH_COMMANDS } from '../../data/commands';
import type { SlashCommand } from '../../types';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function textToHtml(text: string): string {
  if (!text) return '<p><br></p>';
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

interface CmdBtn {
  id: string;
  label: string;
  icon: typeof Sparkles;
  desc: string;
  primary?: boolean;
}

const CMDS: CmdBtn[] = [
  { id: 'ai-continue',   label: '续写',       icon: PenLine,           desc: '顺着当前内容继续写' },
  { id: 'ai-generate',   label: '生成',       icon: Sparkles,          desc: '按场景设定生成一段' },
  { id: 'ai-dialogue',   label: '对话',       icon: MessageSquarePlus, desc: '生成角色对话' },
  { id: 'ai-describe',   label: '描写',       icon: ZoomIn,            desc: '环境 / 战斗描写' },
  { id: 'ai-polish',     label: '润色',       icon: WandSparkles,      desc: '提升文笔表现力' },
  { id: 'ai-expand',     label: '扩写',       icon: Maximize,          desc: '补充细节,拉长' },
  { id: 'ai-summarize',  label: '总结',       icon: FilePen,           desc: '生成场景摘要' },
  { id: 'ai-beat',       label: '生成节拍',   icon: ListPlus,          desc: '基于场景生成节拍', primary: true },
];

/**
 * 场景正文块(Write 页内每场景一个):
 * - 只保留正文编辑器(场景元信息已在左侧导航,正文区不再重复展示)
 * - AI 命令按钮触发参数面板,用户在面板内调整参数后才生成
 * - 节拍生成是特殊命令:面板显示参考内容、参数、预览,用户确认追加到导航节拍
 */
export default function SceneEditor({ scene }: { scene: Scene }) {
  const updateSceneContent = useProjectStore((s) => s.updateSceneContent);
  const setBeats = useProjectStore((s) => s.setBeats);
  const focusMode = useUIStore((s) => s.focusMode);
  const setFocusMode = useUIStore((s) => s.setFocusMode);

  const [openCmd, setOpenCmd] = useState<string | null>(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');

  const { state: ai, runAI, stop, applyToScene, discard } = useAIWriter();

  const editorRef = useRef<HTMLDivElement>(null);
  const lastInnerRef = useRef<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 初始化正文
  useEffect(() => {
    const el = editorRef.current;
    if (el) {
      el.innerHTML = textToHtml(scene.content);
      lastInnerRef.current = scene.content;
    }
  }, [scene.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 外部内容变更同步
  useEffect(() => {
    const el = editorRef.current;
    if (el && lastInnerRef.current !== scene.content) {
      el.innerHTML = textToHtml(scene.content);
      lastInnerRef.current = scene.content;
    }
  }, [scene.content]);

  // AI 流式输出滚动
  useEffect(() => {
    if (scrollRef.current && ai.active) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ai.output, ai.active]);

  const getSlashQuery = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return { query: '', active: false };
    const node = sel.anchorNode;
    if (node.nodeType !== Node.TEXT_NODE) return { query: '', active: false };
    const textBefore = node.textContent?.slice(0, sel.anchorOffset) ?? '';
    const lastSlash = textBefore.lastIndexOf('/');
    const lastSpace = Math.max(textBefore.lastIndexOf(' '), textBefore.lastIndexOf('\n'));
    if (lastSlash > lastSpace) return { query: textBefore.slice(lastSlash + 1), active: true };
    return { query: '', active: false };
  }, []);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText.replace(/\u00a0/g, ' ').replace(/\n+$/, '');
    lastInnerRef.current = text;
    updateSceneContent(scene.id, text);

    const { query, active } = getSlashQuery();
    setSlashQuery(query);
    setSlashOpen(active);
  }, [scene.id, updateSceneContent, getSlashQuery]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === '/' && !slashOpen) {
        setSlashQuery('');
        setSlashOpen(true);
      }
      if (e.key === 'Escape' && slashOpen) setSlashOpen(false);
    },
    [slashOpen]
  );

  // 关闭 / 菜单(点击编辑)
  useEffect(() => {
    if (!slashOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-slash-menu]')) setSlashOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [slashOpen]);

  const handleCommand = useCallback(
    (cmd: SlashCommand) => {
      setSlashOpen(false);
      const el = editorRef.current;

      switch (cmd.category) {
        case 'ai-generate':
        case 'ai-edit':
          setOpenCmd(cmd.id);
          break;
        case 'view':
          if (cmd.id === 'view-focus') setFocusMode(!focusMode);
          break;
        case 'structure': {
          const insert =
            cmd.id === 'struct-h1' ? `\n\n# ${scene.title}\n\n` :
            cmd.id === 'struct-hr' ? '\n\n—— ◇ ——\n\n' :
            '\n\n□ [ ] 待办\n\n';
          const base = el?.innerText.replace(/\n+$/, '').replace(/\/\s*$/, '') ?? '';
          const next = (base + insert).replace(/\n{3,}/g, '\n\n');
          updateSceneContent(scene.id, next);
          requestAnimationFrame(() => {
            if (editorRef.current) {
              editorRef.current.innerHTML = textToHtml(next);
              lastInnerRef.current = next;
            }
          });
          break;
        }
        case 'codex': {
          const name = SLASH_COMMANDS.find((c) => c.id === cmd.id)?.label ?? '档案';
          const base = el?.innerText.replace(/\n+$/, '').replace(/\/\s*$/, '') ?? '';
          const next = `${base}\n\n[${name}::${cmd.id}]`;
          updateSceneContent(scene.id, next);
          requestAnimationFrame(() => {
            if (editorRef.current) {
              editorRef.current.innerHTML = textToHtml(next);
              lastInnerRef.current = next;
            }
          });
          break;
        }
      }
    },
    [scene, setFocusMode, focusMode, updateSceneContent]
  );

  /** 节拍生成完成后,用户确认 → 解析输出为节拍列表,追加到当前场景 */
  const acceptBeatDraft = (raw: string) => {
    const lines = raw
      .split('\n')
      .map((l) => l.replace(/^[◆•\-*\d.)\s]+/, '').trim())
      .filter((l) => l.length > 4);
    if (!lines.length) return;
    const beats = lines.slice(0, 8).map((summary, i) => ({
      id: `${scene.id}-beat-${Date.now()}-${i}`,
      summary,
    }));
    setBeats(scene.id, beats);
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
        <div className={`mx-auto ${focusMode ? 'max-w-2xl pt-16' : 'max-w-3xl px-8 pt-6'}`}>
          {/* AI 命令按钮组 */}
          {!focusMode && (
            <div className="flex flex-wrap items-center gap-1 mb-3">
              {CMDS.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    title={c.desc}
                    onClick={() => setOpenCmd(c.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                      c.primary
                        ? 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/30 hover:bg-amber-500/25'
                        : 'border border-ink-700/60 bg-ink-850 text-slate-300 hover:border-accent-500/40 hover:text-accent-300'
                    }`}
                  >
                    <Icon size={13} />
                    {c.label}
                  </button>
                );
              })}
              <span className="ml-1 flex items-center gap-1 rounded-md bg-ink-800 px-2 py-1 text-[10px] text-slate-600 ring-1 ring-ink-700/50">
                在正文输入 <kbd className="rounded bg-ink-700 px-1 font-mono">/</kbd> 唤起更多 AI 命令
              </span>
              <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-600">
                {SCENE_STATUS_META[scene.status].dot.replace('bg-', 'text-')}
                {SCENE_STATUS_META[scene.status].label} · {scene.beats.length} 节拍 · {scene.content.replace(/\s/g, '').length.toLocaleString()} 字
              </span>
            </div>
          )}

          {/* AI 命令参数面板(点击 AI 按钮展开) */}
          {!focusMode && openCmd && (
            <AICommandPanel
              scene={scene}
              commandId={openCmd}
              onClose={() => setOpenCmd(null)}
              onBeatAccept={acceptBeatDraft}
            />
          )}

          {/* 正文 contentEditable */}
          <div className="relative pb-24">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                const el = editorRef.current;
                if (el) {
                  const text = el.innerText.replace(/\u00a0/g, ' ').replace(/\n+$/, '');
                  updateSceneContent(scene.id, text);
                }
              }}
              data-placeholder="在这里直接写,或点击上方 AI 命令,先调整参数再生成…"
              className="prose-editor min-h-[320]"
            />

            {/* / 命令菜单 */}
            {slashOpen && (
              <div className="absolute left-0 top-2 z-30">
                <SlashMenu query={slashQuery} onSelect={handleCommand} onClose={() => setSlashOpen(false)} />
              </div>
            )}

            {/* AI 流式输出 */}
            {ai.active && (
              <div className="mt-4 rounded-xl border border-accent-500/40 bg-accent-500/[0.06] p-4 animate-fade-in">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-accent-200">
                  <MousePointerClick size={13} />
                  AI 正在{ai.commandLabel}…
                  <button
                    onClick={stop}
                    className="ml-auto flex items-center gap-1 rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-slate-300 hover:text-red-400"
                  >
                    <X size={10} />
                    停止
                  </button>
                </div>
                <div className="prose-editor ai-cursor max-h-56 overflow-y-auto text-slate-200">
                  {ai.output.split('\n').map((line, i) => (
                    <p key={i} className={line.trim() === '' ? 'h-3' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* AI 完成 → 操作 */}
            {!ai.active && ai.output && !ai.error && openCmd !== 'ai-beat' && (
              <div className="mt-4 rounded-xl border border-ink-700/70 bg-ink-850/80 p-4 animate-fade-in">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-300">
                  <ChevronDown size={12} />
                  AI {ai.commandLabel}完成 · 选择如何处理
                </div>
                <div className="prose-editor max-h-64 overflow-y-auto text-slate-300">
                  {ai.output.split('\n').map((line, i) => (
                    <p key={i} className={line.trim() === '' ? 'h-3' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => applyToScene(scene.id, 'append')} className="btn-primary">
                    追加到正文
                  </button>
                  <button
                    onClick={() => applyToScene(scene.id, 'replace')}
                    className="btn border border-ink-700 text-slate-300 hover:border-accent-500/40"
                  >
                    替换全文
                  </button>
                  <button onClick={discard} className="btn-ghost">丢弃</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
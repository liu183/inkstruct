import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, MapPin, MousePointerClick, Smile, UserRound } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { useAIWriter } from '../../hooks/useAIWriter';
import ActionBar, { type ActionId } from './ActionBar';
import LabelBar from './LabelBar';
import SlashMenu from './SlashMenu';
import { SLASH_COMMANDS } from '../../data/commands';
import type { Scene, SlashCommand } from '../../types';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 纯文本 → HTML(段落结构) */
function textToHtml(text: string): string {
  if (!text) return '<p><br></p>';
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

interface Props {
  scene: Scene;
}

export default function SceneEditor({ scene }: Props) {
  const updateSceneContent = useProjectStore((s) => s.updateSceneContent);
  const updateSceneMeta = useProjectStore((s) => s.updateSceneMeta);
  const focusMode = useUIStore((s) => s.focusMode);
  const setFocusMode = useUIStore((s) => s.setFocusMode);

  const editorRef = useRef<HTMLDivElement>(null);
  const lastInnerRef = useRef<string>('');

  // Slash 菜单状态
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');

  const { state: ai, runAI, stop, applyToScene, discard } = useAIWriter();

  // 场景切换时重置编辑器内容
  useEffect(() => {
    const el = editorRef.current;
    if (el) {
      el.innerHTML = textToHtml(scene.content);
      lastInnerRef.current = scene.content;
    }
  }, [scene.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 外部内容变更(如 AI 应用)同步回 DOM
  useEffect(() => {
    const el = editorRef.current;
    if (el && lastInnerRef.current !== scene.content) {
      el.innerHTML = textToHtml(scene.content);
      lastInnerRef.current = scene.content;
    }
  }, [scene.content]);

  /** 读取光标前从上一个空白到光标的内容(用于 / 过滤) */
  const getSlashQuery = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return { query: '', active: false };
    const node = sel.anchorNode;
    if (node.nodeType !== Node.TEXT_NODE) return { query: '', active: false };
    const textBefore = node.textContent?.slice(0, sel.anchorOffset) ?? '';
    const lastSlash = textBefore.lastIndexOf('/');
    const lastSpace = Math.max(textBefore.lastIndexOf(' '), textBefore.lastIndexOf('\n'));
    if (lastSlash > lastSpace) {
      return { query: textBefore.slice(lastSlash + 1), active: true };
    }
    return { query: '', active: false };
  }, []);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText.replace(/\u00a0/g, ' ');
    // 去掉末尾的孤立换行(由空 <p> 产生)
    const clean = text.replace(/\n+$/, '');
    lastInnerRef.current = clean;
    updateSceneContent(scene.id, clean);

    const { query, active } = getSlashQuery();
    if (active) {
      setSlashQuery(query);
      setSlashOpen(true);
    } else {
      setSlashOpen(false);
    }
  }, [scene.id, updateSceneContent, getSlashQuery]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // 输入 / 后立即检测
      if (e.key === '/' && !slashOpen) {
        setSlashQuery('');
        setSlashOpen(true);
      }
      if (e.key === 'Escape' && slashOpen) {
        setSlashOpen(false);
      }
    },
    [slashOpen]
  );

  // 点击编辑区外部时关闭 / 菜单
  useEffect(() => {
    if (!slashOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-slash-menu]')) setSlashOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [slashOpen]);

  /** 执行 / 命令 */
  const handleCommand = useCallback(
    (cmd: SlashCommand) => {
      setSlashOpen(false);
      const el = editorRef.current;
      const rest = el?.innerText ?? '';

      switch (cmd.category) {
        case 'ai-generate':
        case 'ai-edit': {
          runAI(cmd.id, {
            commandId: cmd.id,
            sceneTitle: scene.title,
            pov: scene.pov || '主角',
            location: scene.location || '场景',
            mood: scene.mood || '紧张',
            content: scene.content,
            labels: scene.labels,
          });
          break;
        }
        case 'view': {
          if (cmd.id === 'view-focus') setFocusMode(!focusMode);
          break;
        }
        case 'structure': {
          const insert =
            cmd.id === 'struct-h1'
              ? `\n\n# ${scene.title}\n\n`
              : cmd.id === 'struct-hr'
                ? '\n\n—— ◇ ——\n\n'
                : '\n\n□ [ ] 待办\n\n';
          const base = el?.innerText.replace(/\n+$/, '') ?? '';
          const removeSlash = base.replace(/\/\s*$/, '');
          const next = removeSlash + insert;
          updateSceneContent(scene.id, next.replace(/\n{3,}/g, '\n\n'));
          requestAnimationFrame(() => {
            if (editorRef.current) {
              editorRef.current.innerHTML = textToHtml(next.replace(/\n{3,}/g, '\n\n'));
              lastInnerRef.current = next.replace(/\n{3,}/g, '\n\n');
            }
          });
          break;
        }
        case 'codex': {
          const name = SLASH_COMMANDS.find((c) => c.id === cmd.id)?.label ?? '档案';
          const base = el?.innerText.replace(/\/\s*$/, '') ?? '';
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
      void rest;
    },
    [scene, runAI, setFocusMode, focusMode, updateSceneContent]
  );

  const handleAction = useCallback(
    (actionId: ActionId) => {
      runAI(actionId, {
        commandId: actionId,
        sceneTitle: scene.title,
        pov: scene.pov || '主角',
        location: scene.location || '场景',
        mood: scene.mood || '紧张',
        content: scene.content,
        labels: scene.labels,
      });
    },
    [scene, runAI]
  );

  const hasMeta = useMemo(
    () => [scene.pov, scene.location, scene.timeline, scene.mood].some(Boolean),
    [scene.pov, scene.location, scene.timeline, scene.mood]
  );

  // AI 流式输出时自动滚动到底部
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && ai.active) el.scrollTop = el.scrollHeight;
  }, [ai.output, ai.active]);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
        <div className={`mx-auto ${focusMode ? 'max-w-2xl pt-16' : 'max-w-3xl px-8 pt-8'}`}>
          {/* 标题 */}
          <input
            value={scene.title}
            onChange={(e) => updateSceneMeta(scene.id, { title: e.target.value })}
            placeholder="场景标题…"
            className={`w-full bg-transparent font-serif font-semibold text-slate-100 outline-none placeholder:text-slate-600 ${
              focusMode ? 'text-3xl' : 'text-2xl'
            }`}
          />

          {/* 元信息条 */}
          {!focusMode && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-b border-ink-700/40 pb-3">
              <MetaChip icon={UserRound} label="POV" value={scene.pov} color="text-violet-300" onChange={(v) => updateSceneMeta(scene.id, { pov: v })} placeholder="视角角色" />
              <MetaChip icon={MapPin} label="地点" value={scene.location} color="text-emerald-300" onChange={(v) => updateSceneMeta(scene.id, { location: v })} placeholder="地点" />
              <MetaChip icon={Clock} label="时间" value={scene.timeline} color="text-amber-300" onChange={(v) => updateSceneMeta(scene.id, { timeline: v })} placeholder="时间线" />
              <MetaChip icon={Smile} label="基调" value={scene.mood} color="text-rose-300" onChange={(v) => updateSceneMeta(scene.id, { mood: v })} placeholder="情绪基调" />
              {!hasMeta && <span className="text-[10px] text-slate-600">点击填写场景元信息,AI 将据此保持一致性</span>}
            </div>
          )}

          {!focusMode && (
            <div className="mt-2.5">
              <LabelBar scene={scene} />
            </div>
          )}

          {/* ActionBar */}
          {!focusMode && (
            <div className="mt-3.5">
              <ActionBar onRun={handleAction} ai={ai} onStop={stop} onApply={(m) => applyToScene(scene.id, m)} onDiscard={discard} />
            </div>
          )}

          {/* 正文编辑器 */}
          <div className="relative mt-4 pb-24">
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
              data-placeholder="从这里开始写作,输入 / 唤起 AI 命令…"
              className="prose-editor min-h-[300px]"
            />

            {/* / 命令菜单 */}
            {slashOpen && (
              <div className="absolute left-0 top-2 z-30">
                <SlashMenu query={slashQuery} onSelect={handleCommand} onClose={() => setSlashOpen(false)} />
              </div>
            )}

            {/* AI 流式输出区 */}
            {ai.active && (
              <div className="mt-4 rounded-xl border border-accent-500/40 bg-accent-500/[0.06] p-4 animate-fade-in">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-accent-200">
                  <MousePointerClick size={13} />
                  AI 输出 · {ai.commandLabel}
                  <span className="ml-auto font-mono text-[10px] text-accent-400/60">{ai.output.length} 字</span>
                </div>
                <div className="prose-editor ai-cursor text-slate-200">
                  {ai.output.split('\n').map((line, i) => (
                    <p key={i} className={line.trim() === '' ? 'h-3' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* AI 完成 → 操作区 */}
            {!ai.active && ai.output && !ai.error && (
              <div className="mt-4 rounded-xl border border-ink-700/70 bg-ink-850/80 p-4 animate-fade-in">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-300">
                  <SparkleIcon />
                  AI {ai.commandLabel}完成 · 请选择如何处理
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
                  <button onClick={() => applyToScene(scene.id, 'replace')} className="btn border border-ink-700 text-slate-300 hover:border-accent-500/40">
                    替换全文
                  </button>
                  <button onClick={discard} className="btn-ghost">
                    丢弃
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return <span className="text-emerald-300">✦</span>;
}

/** 可编辑元信息 chip */
function MetaChip({
  icon: Icon,
  label,
  value,
  color,
  onChange,
  placeholder,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  color: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    onChange(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="input-dark !w-36 !py-0.5 text-[11px]"
      />
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title={`编辑${label}`}
      className="group flex items-center gap-1 rounded-md border border-ink-700/50 bg-ink-850 px-2 py-0.5 text-[11px] transition-colors hover:border-accent-500/40"
    >
      <span className="text-slate-600">{label}</span>
      <span className={`flex items-center gap-1 ${value ? color : 'text-slate-600'}`}>
        <Icon size={11} />
        {value || placeholder}
      </span>
    </button>
  );
}

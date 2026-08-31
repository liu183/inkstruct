import { useState } from 'react';
import {
  Check, ChevronDown, ChevronRight, Eye, ListPlus, Sliders, Sparkles, X,
} from 'lucide-react';
import { useAIWriter } from '../../hooks/useAIWriter';
import type { Scene } from '../../types';
import { SCENE_STATUS_META } from '../../types';

export type AIOutputLength = 'short' | 'medium' | 'long' | 'xl';
export type AIPovTense = 'third' | 'first';
export type AIStyle = 'classic' | 'modern' | 'concise' | 'ornate' | 'tense' | 'warm';

export interface AIParams {
  length: AIOutputLength;
  povTense: AIPovTense;
  style: AIStyle;
  userHint: string;
  /** 节拍生成专用 */
  beatCount?: 2 | 4 | 6 | 8;
  beatDensity?: 'tight' | 'balanced' | 'loose';
  beatFocus?: Array<'conflict' | 'character' | 'suspense' | 'emotion' | 'action'>;
}

const LENGTH_LABEL: Record<AIOutputLength, string> = {
  short: '短(≤200 字)',
  medium: '中(200-500 字)',
  long: '长(500-1000 字)',
  xl: '超长(1000+ 字)',
};

const STYLE_LABEL: Record<AIStyle, string> = {
  classic: '古风典雅',
  modern: '现代简练',
  concise: '简洁紧凑',
  ornate: '华丽铺陈',
  tense: '紧张悬疑',
  warm: '温情感性',
};

const FOCUS_LABEL: Record<NonNullable<AIParams['beatFocus']>[number], string> = {
  conflict: '冲突',
  character: '人物',
  suspense: '悬念',
  emotion: '情感',
  action: '动作',
};

const CMD_LABEL: Record<string, string> = {
  'ai-continue': '续写',
  'ai-generate': '生成',
  'ai-dialogue': '对话',
  'ai-describe': '描写',
  'ai-polish': '润色',
  'ai-expand': '扩写',
  'ai-summarize': '总结',
  'ai-beat': '生成节拍',
};

/**
 * AI 命令参数面板:
点 - 点击 AI 按钮后弹出,用户在此调整专业参数才生成
- 通用参数:输出长度、视角/人称、文风、用户额外要求
- 生成节拍特殊:显示参考内容、参数(数量/密度/关注点)、流式预览,确认后追加到导航节拍
 */
export default function AICommandPanel({
  scene,
  commandId,
  onClose,
  onBeatAccept,
}: {
  scene: Scene;
  commandId: string;
  onClose: () => void;
  onBeatAccept?: (rawOutput: string) => void;
}) {
  const isBeat = commandId === 'ai-beat';
  const { state: ai, runAI, stop, discard } = useAIWriter();

  const [params, setParams] = useState<AIParams>({
    length: 'medium',
    povTense: 'third',
    style: 'classic',
    userHint: '',
    beatCount: 4,
    beatDensity: 'balanced',
    beatFocus: ['conflict', 'character'],
  });
  const [refOpen, setRefOpen] = useState(true);

  const run = () => {
    runAI(commandId, {
      commandId,
      sceneTitle: scene.title,
      pov: scene.pov || '主角',
      location: scene.location || '场景',
      mood: scene.mood || '紧张',
      content: scene.content,
      labels: scene.labels,
      length: params.length,
      povTense: params.povTense,
      style: params.style,
      userHint: params.userHint.trim(),
      beatCount: params.beatCount,
      beatDensity: params.beatDensity,
      beatFocus: params.beatFocus,
    });
  };

  const previewBeats = ai.output
    ? ai.output
        .split('\n')
        .map((l) => l.replace(/^[◆•\-*\d.)\s]+/, '').trim())
        .filter((l) => l.length > 4)
    : [];

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-accent-500/30 bg-ink-850/90 animate-slide-up">
      {/* 头部 */}
      <div className="flex items-center gap-2 border-b border-ink-700/60 px-4 py-2.5">
        <Sliders size={13} className="text-accent-400" />
        <span className="text-xs font-semibold text-slate-100">{CMD_LABEL[commandId]} · 参数配置</span>
        <span className="text-[10px] text-slate-600">基于「{scene.title}」</span>
        <button
          onClick={onClose}
          className="ml-auto rounded p-1 text-slate-500 hover:bg-ink-700 hover:text-slate-200"
        >
          <X size={13} />
        </button>
      </div>

      {/* 上下文摘要 */}
      <div className="border-b border-ink-700/40 bg-ink-900/50 px-4 py-2 text-[10px] text-slate-500">
        <span className="text-slate-600">基于 · </span>
        <span className="text-violet-300/80">POV {scene.pov || '—'}</span>
        <span className="mx-1 text-slate-700">/</span>
        <span className="text-emerald-300/80">地点 {scene.location || '—'}</span>
        <span className="mx-1 text-slate-700">/</span>
        <span className="text-amber-300/80">时间 {scene.timeline || '—'}</span>
        <span className="mx-1 text-slate-700">/</span>
        <span className="text-rose-300/80">基调 {scene.mood || '—'}</span>
        <span className="mx-1 text-slate-700">/</span>
        <span className="text-accent-300/80">{SCENE_STATUS_META[scene.status].label}</span>
        <span className="mx-1 text-slate-700">/</span>
        <span>{scene.content.replace(/\s/g, '').length.toLocaleString()} 字</span>
      </div>

      {!isBeat ? (
        /* ========= 通用 AI 写作命令参数 ========= */
        <div className="space-y-3 px-4 py-3">
          <div className="grid grid-cols-3 gap-3">
            <Field label="输出长度">
              <select
                value={params.length}
                onChange={(e) => setParams({ ...params, length: e.target.value as AIOutputLength })}
                className="input-dark text-xs"
              >
                {(Object.keys(LENGTH_LABEL) as AIOutputLength[]).map((k) => (
                  <option key={k} value={k}>{LENGTH_LABEL[k]}</option>
                ))}
              </select>
            </Field>
            <Field label="视角/人称">
              <select
                value={params.povTense}
                onChange={(e) => setParams({ ...params, povTense: e.target.value as AIPovTense })}
                className="input-dark text-xs"
              >
                <option value="third">第三人称(上帝视角)</option>
                <option value="first">第一人称(内心独白)</option>
              </select>
            </Field>
            <Field label="文风">
              <select
                value={params.style}
                onChange={(e) => setParams({ ...params, style: e.target.value as AIStyle })}
                className="input-dark text-xs"
              >
                {(Object.keys(STYLE_LABEL) as AIStyle[]).map((k) => (
                  <option key={k} value={k}>{STYLE_LABEL[k]}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="用户额外要求(选填)" hint="对这一段生成有什么特别要求…">
            <textarea
              value={params.userHint}
              onChange={(e) => setParams({ ...params, userHint: e.target.value })}
              rows={2}
              placeholder="例:这段结尾要留悬念;增加一段内心独白;突出紧张感…"
              className="input-dark w-full resize-none text-xs"
            />
          </Field>

          {/* 参考正文(可折叠) */}
          <button
            onClick={() => setRefOpen((o) => !o)}
            className="flex items-center gap-1 text-[10px] text-slate-500 transition-colors hover:text-slate-300"
          >
            {refOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            <Eye size={11} />
            参考当前正文 {scene.content.replace(/\s/g, '').length.toLocaleString()} 字
          </button>
          {refOpen && (
            <pre className="max-h-28 overflow-y-auto whitespace-pre-wrap rounded-md border border-ink-700/40 bg-ink-950/60 px-2.5 py-1.5 text-[10px] leading-relaxed text-slate-500">
              {scene.content.trim() || '（暂无正文）'}
            </pre>
          )}

          {/* 操作 */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={run}
              disabled={ai.active}
              className="btn-primary !py-1.5 text-xs disabled:opacity-40"
            >
              <Sparkles size={12} />
              生成
            </button>
            <button onClick={onClose} className="btn text-slate-400 hover:bg-ink-700 !py-1.5 text-xs">
              取消
            </button>
          </div>
        </div>
      ) : (
        /* ========= 生成节拍专用面板 ========= */
        <div className="space-y-3 px-4 py-3">
          {/* 参数 */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="节拍数量">
              <select
                value={params.beatCount}
                onChange={(e) => setParams({ ...params, beatCount: Number(e.target.value) as 2 | 4 | 6 | 8 })}
                className="input-dark text-xs"
              >
                <option value={2}>2 个</option>
                <option value={4}>4 个</option>
                <option value={6}>6 个</option>
                <option value={8}>8 个</option>
              </select>
            </Field>
            <Field label="节奏密度">
              <select
                value={params.beatDensity}
                onChange={(e) => setParams({ ...params, beatDensity: e.target.value as 'tight' | 'balanced' | 'loose' })}
                className="input-dark text-xs"
              >
                <option value="tight">紧凑(快节奏)</option>
                <option value="balanced">平衡</option>
                <option value="loose">舒缓(慢节奏)</option>
              </select>
            </Field>
            <Field label="当前已有节拍">
              <div className="input-dark flex items-center text-xs text-slate-500">
                {scene.beats.length} 个(将替换)
              </div>
            </Field>
          </div>

          <Field label="关注点(多选)">
            <div className="flex flex-wrap gap-1.5">
              {(['conflict', 'character', 'suspense', 'emotion', 'action'] as const).map((f) => {
                const on = params.beatFocus?.includes(f);
                return (
                  <button
                    key={f}
                    onClick={() => {
                      const cur = params.beatFocus ?? [];
                      const next = on ? cur.filter((x) => x !== f) : [...cur, f];
                      setParams({ ...params, beatFocus: next });
                    }}
                    className={`rounded-md px-2 py-1 text-[10px] transition-all ${
                      on
                        ? 'bg-accent-500/20 text-accent-200 ring-1 ring-accent-500/40'
                        : 'border border-ink-700/50 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {FOCUS_LABEL[f]}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="用户额外要求(选填)">
            <textarea
              value={params.userHint}
              onChange={(e) => setParams({ ...params, userHint: e.target.value })}
              rows={2}
              placeholder="对这一场景的节拍有什么特别要求…"
              className="input-dark w-full resize-none text-xs"
            />
          </Field>

          {/* 参考内容 */}
          <button
            onClick={() => setRefOpen((o) => !o)}
            className="flex items-center gap-1 text-[10px] text-slate-500 transition-colors hover:text-slate-300"
          >
            {refOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            <Eye size={11} />
            参考:场景全文 + 元信息
          </button>
          {refOpen && (
            <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md border border-ink-700/40 bg-ink-950/60 px-2.5 py-1.5 text-[10px] leading-relaxed text-slate-500">
              POV {scene.pov || '—'} · 地点 {scene.location || '—'} · 时间 {scene.timeline || '—'} · 基调 {scene.mood || '—'}

{scene.content.trim() || '（暂无正文 — AI 将根据场景元信息生成节拍）'}
            </pre>
          )}

          {/* 生成按钮 */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={run}
              disabled={ai.active}
              className="btn-primary !py-1.5 text-xs disabled:opacity-40"
            >
              <ListPlus size={12} />
              生成节拍
            </button>
            <button onClick={onClose} className="btn text-slate-400 hover:bg-ink-700 !py-1.5 text-xs">
              取消
            </button>
          </div>
        </div>
      )}

      {/* ========= 节拍预览(ai-beat 流式输出后展示) ========= */}
      {isBeat && (ai.active || ai.output) && !ai.error && (
        <div className="border-t border-ink-700/60 bg-amber-500/[0.04] px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-200">
            <ListPlus size={12} />
            节拍预览
            {ai.active && <span className="ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />}
            <span className="ml-auto font-mono text-[10px] text-amber-400/70">
              {previewBeats.length} / {params.beatCount}
            </span>
          </div>
          <div className="space-y-1">
            {previewBeats.map((b, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-ink-950/60 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-300"
              >
                <span className="shrink-0 font-mono text-amber-400/70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1">{b}</span>
              </div>
            ))}
          </div>

          {!ai.active && ai.output && onBeatAccept && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => {
                  onBeatAccept(ai.output);
                  onClose();
                  discard();
                }}
                disabled={previewBeats.length === 0}
                className="btn-primary !py-1.5 text-xs disabled:opacity-40"
              >
                <Check size={12} />
                同意追加到导航节拍
              </button>
              <button
                onClick={() => {
                  onClose();
                  discard();
                }}
                className="btn border border-ink-700 text-slate-400 hover:bg-ink-700 !py-1.5 text-xs"
              >
                丢弃
              </button>
              <span className="text-[10px] text-slate-600">
                点击「同意追加」将替换当前场景的节拍列表
              </span>
            </div>
          )}
        </div>
      )}

      {/* 流式生成中(非节拍) */}
      {!isBeat && ai.active && (
        <div className="border-t border-ink-700/60 px-4 py-2">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Sparkles size={10} className="animate-pulse text-accent-400" />
            AI 正在生成…完成后将出现在下方
            <button onClick={stop} className="ml-auto text-red-400 hover:text-red-300">停止</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold text-slate-500">
        {label}
        {hint && <span className="ml-1 font-normal text-slate-600">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
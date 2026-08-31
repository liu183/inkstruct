import { useState } from 'react';
import {
  Check, ClipboardCopy, Download, FileCode2, FileText, Link2, Share2, X,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { flatScenes, totalWords as countWords } from '../../utils/structure';

type Format = 'markdown' | 'txt' | 'outline' | 'json';

/**
 * 分享与导出:
 * - 导出全本/章纲/存稿为 Markdown、TXT
 * - 导出项目 JSON(完整备份,可再导入)
 * - 复制作品简介
 */
export default function ShareModal() {
  const open = useUIStore((s) => s.shareOpen);
  const setOpen = useUIStore((s) => s.setShareOpen);
  const setStatusMessage = useUIStore((s) => s.setStatusMessage);
  const project = useProjectStore((s) => s.project);

  const [format, setFormat] = useState<Format>('markdown');
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const scenes = flatScenes(project);
  const words = countWords(project);

  /* ---------- 内容生成 ---------- */

  const buildText = (): string => {
    if (format === 'json') {
      return JSON.stringify(project, null, 2);
    }
    if (format === 'outline') {
      const lines: string[] = [`# ${project.title} · 大纲`, ''];
      if (project.logline) lines.push(`> ${project.logline}`, '');
      project.volumes.forEach((v) => {
        lines.push(`## ${v.title}`, '');
        v.units.forEach((u) => {
          lines.push(`### ${u.title}`, '');
          u.chapters.forEach((c) => {
            lines.push(`#### ${c.title}`);
            if (c.summary.trim()) lines.push('', c.summary);
            c.scenes.forEach((s) => {
              lines.push(`- ${s.title}${s.summary ? ` — ${s.summary}` : ''}`);
            });
            lines.push('');
          });
        });
      });
      return lines.join('\n');
    }

    // markdown / txt:正文导出
    const isMd = format === 'markdown';
    const out: string[] = [];
    out.push(`${isMd ? '# ' : ''}${project.title}`);
    out.push(`${isMd ? '> ' : ''}${project.author || '佚名'} · ${project.genre || '未分类'}`);
    if (project.logline) out.push(`${isMd ? '> ' : ''}${project.logline}`);
    out.push('');

    project.volumes.forEach((v) => {
      out.push(`${isMd ? '## ' : ''}${v.title}`, '');
      v.units.forEach((u) => {
        out.push(`${isMd ? '### ' : ''}${u.title}`, '');
        u.chapters.forEach((c) => {
          out.push(`${isMd ? '#### ' : ''}${c.title}`, '');
          if (c.summary.trim()) {
            out.push(`${isMd ? '*' : ''}${c.summary}${isMd ? '*' : ''}`, '');
          }
          c.scenes.forEach((s) => {
            out.push(`${isMd ? '##### ' : ''}${s.title}`, '');
            if (includeDrafts && s.content.trim()) {
              out.push(s.content, '');
            }
          });
        });
      });
    });
    return out.join('\n');
  };

  const filename = () => {
    const base = project.title.replace(/[\\/:*?"<>|]/g, '_');
    const ext = format === 'json' ? 'json' : format === 'outline' ? 'md' : format === 'txt' ? 'txt' : 'md';
    const suffix = format === 'outline' ? '·大纲' : '';
    return `${base}${suffix}.${ext}`;
  };

  const download = () => {
    const blob = new Blob([buildText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename();
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage(`已导出 ${filename()}`);
  };

  const copyIntro = async () => {
    const text = [
      `《${project.title}》`,
      `${project.author || '佚名'} · ${project.genre || '未分类'}`,
      project.logline,
      '',
      `${project.volumes.length} 卷 · ${scenes.length} 场景 · ${words.toLocaleString()} 字`,
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      setStatusMessage('作品简介已复制');
    } catch {
      setStatusMessage('复制失败,请手动选择');
    }
  };

  const formats: { id: Format; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'markdown', label: 'Markdown 全本', desc: '含章纲与正文,可直接发布', icon: <FileText size={14} /> },
    { id: 'txt',      label: 'TXT 纯文本',    desc: '兼容所有阅读器',           icon: <FileText size={14} /> },
    { id: 'outline',  label: '大纲',          desc: '只导出结构与章纲',         icon: <FileCode2 size={14} /> },
    { id: 'json',     label: '项目备份 JSON', desc: '完整数据,可再导入',       icon: <FileCode2 size={14} /> },
  ];

  const content = buildText();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-[2px]" onClick={() => setOpen(false)} />

      <div className="relative flex max-h-[86vh] w-[560px] flex-col overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-2xl animate-slide-up">
        {/* 头部 */}
        <div className="flex items-center gap-2 border-b border-ink-700/60 px-4 py-3">
          <Share2 size={15} className="text-accent-400" />
          <span className="text-sm font-semibold text-slate-100">分享与导出</span>
          <span className="text-[10px] text-slate-600">
            {project.volumes.length} 卷 · {scenes.length} 场景 · {words.toLocaleString()} 字
          </span>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-slate-200"
          >
            <X size={15} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {/* 格式选择 */}
          <div className="grid grid-cols-2 gap-2">
            {formats.map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={`flex flex-col items-start gap-0.5 rounded-lg border p-2.5 text-left transition-all ${
                  format === f.id
                    ? 'border-accent-500/50 bg-accent-500/[0.08]'
                    : 'border-ink-700/60 bg-ink-850/60 hover:border-ink-600'
                }`}
              >
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200">
                  <span className="text-accent-400">{f.icon}</span>
                  {f.label}
                </span>
                <span className="text-[9px] text-slate-500">{f.desc}</span>
              </button>
            ))}
          </div>

          {/* 选项 */}
          {(format === 'markdown' || format === 'txt') && (
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-400">
              <input
                type="checkbox"
                checked={includeDrafts}
                onChange={(e) => setIncludeDrafts(e.target.checked)}
                className="accent-accent-500"
              />
              包含正文存稿(取消则只导出章纲)
            </label>
          )}

          {/* 预览 */}
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
              预览 · {filename()}
              <span className="ml-auto font-normal text-slate-600">
                {content.length.toLocaleString()} 字符
              </span>
            </div>
            <pre className="max-h-52 overflow-auto rounded-lg border border-ink-700/60 bg-ink-950/60 p-2.5 text-[10px] leading-relaxed text-slate-400">
              {content.slice(0, 2000) || '（空）'}
              {content.length > 2000 && '\n… 已截断预览'}
            </pre>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center gap-2 border-t border-ink-700/60 px-4 py-3">
          <button
            onClick={copyIntro}
            className="btn border border-ink-700 text-slate-300 hover:border-accent-500/40 hover:text-accent-300"
          >
            {copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
            {copied ? '已复制简介' : '复制简介'}
          </button>
          <button
            onClick={() => setStatusMessage('在线分享链接将在接入云端后开放')}
            className="btn border border-ink-700 text-slate-400"
          >
            <Link2 size={13} />
            生成分享链接
          </button>
          <button onClick={download} className="btn-primary ml-auto">
            <Download size={13} />
            导出文件
          </button>
        </div>
      </div>
    </div>
  );
}

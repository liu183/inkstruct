import { useRef, useState } from 'react';
import {
  AlertTriangle, Check, Database, Download, Palette, Settings, Trash2, Upload, UserCog, X,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { totalWords as countWords } from '../../utils/structure';
import type { Project } from '../../types';

/**
 * 设置:作品信息 / 写作偏好 / 数据管理
 */
export default function SettingsModal() {
  const open = useUIStore((s) => s.settingsOpen);
  const setOpen = useUIStore((s) => s.setSettingsOpen);
  const setStatusMessage = useUIStore((s) => s.setStatusMessage);
  const setFocusMode = useUIStore((s) => s.setFocusMode);

  const project = useProjectStore((s) => s.project);
  const projects = useProjectStore((s) => s.projects);
  const updateProjectMeta = useProjectStore((s) => s.updateProjectMeta);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<'info' | 'prefs' | 'data'>('info');
  const [meta, setMeta] = useState({
    title: project.title,
    author: project.author,
    genre: project.genre,
    logline: project.logline,
  });
  const [dailyGoal, setDailyGoal] = useState(
    () => Number(localStorage.getItem('inkstruct.dailyGoal') ?? 3000)
  );

  if (!open) return null;

  const saveMeta = () => {
    updateProjectMeta(meta);
    setStatusMessage('作品信息已保存');
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ projects }, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inkstruct-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('已导出全部项目备份');
  };

  const importAll = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { projects?: Project[] };
      if (!parsed.projects?.length) {
        setStatusMessage('文件格式不正确');
        return;
      }
      localStorage.setItem(
        'inkstruct.projects.v1',
        JSON.stringify({ projects: parsed.projects, activeProjectId: parsed.projects[0].id })
      );
      setStatusMessage(`已导入 ${parsed.projects.length} 个项目,刷新后生效`);
    } catch {
      setStatusMessage('导入失败:不是有效的 JSON');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const clearAll = () => {
    if (!confirm('清空本地全部项目数据?此操作不可撤销,建议先导出备份。')) return;
    localStorage.removeItem('inkstruct.projects.v1');
    setStatusMessage('已清空本地数据,刷新后回到示例项目');
  };

  const tabs = [
    { id: 'info' as const,  label: '作品信息', icon: <UserCog size={13} /> },
    { id: 'prefs' as const, label: '写作偏好', icon: <Palette size={13} /> },
    { id: 'data' as const,  label: '数据管理', icon: <Database size={13} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-[2px]" onClick={() => setOpen(false)} />

      <div className="relative flex max-h-[86vh] w-[600px] flex-col overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-2xl animate-slide-up">
        {/* 头部 */}
        <div className="flex items-center gap-2 border-b border-ink-700/60 px-4 py-3">
          <Settings size={15} className="text-slate-300" />
          <span className="text-sm font-semibold text-slate-100">设置</span>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-slate-200"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* 侧边 tab */}
          <div className="w-32 shrink-0 space-y-0.5 border-r border-ink-700/60 p-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] transition-colors ${
                  tab === t.id
                    ? 'bg-ink-800 text-slate-100 ring-1 ring-accent-500/25'
                    : 'text-slate-500 hover:bg-ink-800/60 hover:text-slate-300'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* 内容 */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === 'info' && (
              <div className="space-y-3">
                <Field label="书名">
                  <input
                    value={meta.title}
                    onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                    className="input-dark text-xs"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="笔名">
                    <input
                      value={meta.author}
                      onChange={(e) => setMeta({ ...meta, author: e.target.value })}
                      className="input-dark text-xs"
                    />
                  </Field>
                  <Field label="题材">
                    <input
                      value={meta.genre}
                      onChange={(e) => setMeta({ ...meta, genre: e.target.value })}
                      placeholder="仙侠 · 玄幻 · 穿越"
                      className="input-dark text-xs"
                    />
                  </Field>
                </div>
                <Field label="一句话简介">
                  <textarea
                    value={meta.logline}
                    onChange={(e) => setMeta({ ...meta, logline: e.target.value })}
                    rows={3}
                    placeholder="主角是谁,要干什么,赌注是什么"
                    className="input-dark w-full resize-none text-xs"
                  />
                </Field>

                <div className="flex items-center gap-2 pt-1">
                  <button onClick={saveMeta} className="btn-primary">
                    <Check size={13} />
                    保存
                  </button>
                  <span className="text-[10px] text-slate-600">
                    当前《{project.title}》共 {countWords(project).toLocaleString()} 字
                  </span>
                </div>

                {/* 项目切换 */}
                {projects.length > 1 && (
                  <div className="mt-4 border-t border-ink-700/50 pt-3">
                    <div className="mb-1.5 text-[10px] font-semibold text-slate-500">切换到其他作品</div>
                    <div className="space-y-1">
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActiveProject(p.id);
                            setStatusMessage(`已切换到《${p.title}》`);
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                            p.id === project.id
                              ? 'bg-accent-500/10 text-slate-100'
                              : 'text-slate-400 hover:bg-ink-800'
                          }`}
                        >
                          <span className="flex-1 truncate">{p.title}</span>
                          <span className="text-[9px] text-slate-600">
                            {countWords(p).toLocaleString()} 字
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'prefs' && (
              <div className="space-y-4">
                <Field label="每日字数目标" hint="用于创作日志的进度对照">
                  <input
                    type="number"
                    value={dailyGoal}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setDailyGoal(v);
                      localStorage.setItem('inkstruct.dailyGoal', String(v));
                    }}
                    className="input-dark w-32 text-xs"
                  />
                </Field>

                <div className="rounded-lg border border-ink-700/60 bg-ink-850/50 p-3">
                  <div className="text-[11px] font-medium text-slate-200">专注模式</div>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    写作页隐藏侧边栏与 Codex 抽屉,只留正文
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      onClick={() => {
                        setFocusMode(true);
                        setOpen(false);
                      }}
                      className="btn border border-ink-700 text-slate-300 hover:border-accent-500/40 hover:text-accent-300"
                    >
                      开启专注模式
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-ink-700/60 bg-ink-850/50 p-3">
                  <div className="text-[11px] font-medium text-slate-200">AI 引擎</div>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
                    当前使用本地模拟引擎(流式打字机)。替换
                    <code className="mx-1 rounded bg-ink-800 px-1 text-slate-400">
                      src/utils/aiEngine.ts
                    </code>
                    即可接入真实大模型,无需改动任何 UI。
                  </p>
                </div>
              </div>
            )}

            {tab === 'data' && (
              <div className="space-y-3">
                <div className="rounded-lg border border-ink-700/60 bg-ink-850/50 p-3">
                  <div className="text-[11px] font-medium text-slate-200">本地存储</div>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
                    项目数据保存在浏览器 localStorage,不上传服务器。换设备或清缓存前请先导出备份。
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button onClick={exportAll} className="btn border border-ink-700 text-slate-300 hover:border-accent-500/40 hover:text-accent-300">
                      <Download size={13} />
                      导出全部备份
                    </button>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="btn border border-ink-700 text-slate-300 hover:border-accent-500/40 hover:text-accent-300"
                    >
                      <Upload size={13} />
                      导入备份
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={(e) => importAll(e.target.files?.[0])}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-red-500/25 bg-red-500/[0.05] p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-red-300">
                    <AlertTriangle size={12} />
                    危险操作
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    清空后本地所有作品将不可恢复。
                  </p>
                  <button
                    onClick={clearAll}
                    className="mt-2 btn border border-red-500/40 text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 size={13} />
                    清空本地数据
                  </button>
                </div>

                <div className="text-[10px] leading-relaxed text-slate-600">
                  墨构 InkStruct v0.1.0 · React + TypeScript + Vite + Tailwind + Zustand
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
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

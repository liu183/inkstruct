import { useEffect, useState } from 'react';
import { Check, FileText, PenLine, Plus, X } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { SCENE_STATUS_META, type Scene, type SceneStatus } from '../../types';

export interface SceneDraft {
  title: string;
  pov: string;
  location: string;
  timeline: string;
  mood: string;
  summary: string;
  status: SceneStatus;
}

const EMPTY: SceneDraft = {
  title: '',
  pov: '',
  location: '',
  timeline: '',
  mood: '',
  summary: '',
  status: 'idea',
};

/**
 * 场景编辑模态:
 * - create 模式:填写标题/视角/地点/摘要后创建,并直接进入写作页
 * - edit 模式:修改既有场景的元信息(Plan 内完成增删改查的"改")
 */
export default function SceneEditModal({
  /** 编辑既有场景 */
  scene,
  /** 在该章下新建场景 */
  chapterId,
  chapterTitle,
  onClose,
}: {
  scene?: Scene;
  chapterId?: string;
  chapterTitle?: string;
  onClose: () => void;
}) {
  const updateSceneMeta = useProjectStore((s) => s.updateSceneMeta);
  const addScene = useProjectStore((s) => s.addScene);
  const deleteScene = useProjectStore((s) => s.deleteScene);
  const setActiveScene = useProjectStore((s) => s.setActiveScene);
  const setWorkspace = useUIStore((s) => s.setWorkspace);
  const setStatusMessage = useUIStore((s) => s.setStatusMessage);

  const [v, setV] = useState<SceneDraft>(
    scene
      ? {
          title: scene.title,
          pov: scene.pov,
          location: scene.location,
          timeline: scene.timeline,
          mood: scene.mood,
          summary: scene.summary,
          status: scene.status,
        }
      : EMPTY
  );

  // Esc 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isEdit = !!scene;

  const submit = () => {
    const patch = { ...v, title: v.title.trim() || '未命名场景' };
    if (isEdit && scene) {
      updateSceneMeta(scene.id, patch);
      setStatusMessage(`场景「${patch.title}」已更新`);
    } else if (chapterId) {
      addScene(chapterId);
      const newId = useProjectStore.getState().activeSceneId;
      updateSceneMeta(newId, patch);
      setActiveScene(newId);
      setWorkspace('write');
      setStatusMessage(`场景「${patch.title}」已创建,开始写作`);
    }
    onClose();
  };

  const remove = () => {
    if (!scene) return;
    if (confirm(`删除场景「${scene.title}」?其正文将一并删除`)) {
      deleteScene(scene.id);
      setStatusMessage('场景已删除');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-[480px] overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-2xl animate-slide-up">
        {/* 头部 */}
        <div className="flex items-center gap-2 border-b border-ink-700/60 px-4 py-3">
          {isEdit ? <PenLine size={14} className="text-accent-400" /> : <Plus size={14} className="text-emerald-400" />}
          <span className="text-sm font-semibold text-slate-100">
            {isEdit ? '编辑场景' : '添加场景'}
          </span>
          {chapterTitle && <span className="truncate text-[10px] text-slate-600">{chapterTitle}</span>}
          <button
            onClick={onClose}
            className="ml-auto rounded p-1 text-slate-500 transition-colors hover:bg-ink-700 hover:text-slate-200"
          >
            <X size={15} />
          </button>
        </div>

        {/* 表单 */}
        <div className="space-y-3 px-4 py-4">
          <Field label="场景标题 *">
            <input
              autoFocus
              value={v.title}
              onChange={(e) => setV({ ...v, title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && v.title.trim()) submit();
              }}
              placeholder="如:荒山古庙 · 初醒"
              className="input-dark text-xs"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="视角 POV">
              <input
                value={v.pov}
                onChange={(e) => setV({ ...v, pov: e.target.value })}
                placeholder="沈墨尘"
                className="input-dark text-xs"
              />
            </Field>
            <Field label="地点">
              <input
                value={v.location}
                onChange={(e) => setV({ ...v, location: e.target.value })}
                placeholder="青云山 · 荒山古庙"
                className="input-dark text-xs"
              />
            </Field>
            <Field label="时间线">
              <input
                value={v.timeline}
                onChange={(e) => setV({ ...v, timeline: e.target.value })}
                placeholder="穿越当夜 · 子时"
                className="input-dark text-xs"
              />
            </Field>
            <Field label="情绪基调">
              <input
                value={v.mood}
                onChange={(e) => setV({ ...v, mood: e.target.value })}
                placeholder="压抑 · 惊疑"
                className="input-dark text-xs"
              />
            </Field>
          </div>

          <Field label="场景摘要" hint="这一场要发生什么">
            <textarea
              value={v.summary}
              onChange={(e) => setV({ ...v, summary: e.target.value })}
              rows={3}
              placeholder="主角确认穿越事实,首次动用古剑之力…"
              className="input-dark w-full resize-none text-xs"
            />
          </Field>

          <Field label="状态">
            <div className="flex flex-wrap gap-1">
              {(Object.keys(SCENE_STATUS_META) as SceneStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setV({ ...v, status: s })}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] transition-colors ${
                    v.status === s
                      ? 'bg-ink-700 text-slate-100 ring-1 ring-accent-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${SCENE_STATUS_META[s].dot}`} />
                  {SCENE_STATUS_META[s].label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* 底部 */}
        <div className="flex items-center gap-2 border-t border-ink-700/60 px-4 py-3">
          {isEdit && (
            <button
              onClick={remove}
              className="btn border border-red-500/30 text-red-300 hover:bg-red-500/10"
            >
              删除场景
            </button>
          )}
          {!isEdit && (
            <span className="flex items-center gap-1 text-[10px] text-slate-600">
              <FileText size={10} />
              创建后自动进入写作页
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={onClose} className="btn text-slate-400 hover:bg-ink-700">
              取消
            </button>
            <button onClick={submit} className="btn-primary">
              <Check size={13} />
              {isEdit ? '保存' : '创建并写作'}
            </button>
          </div>
        </div>
      </div>
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

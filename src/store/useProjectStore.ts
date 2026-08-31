import { create } from 'zustand';
import type {
  Beat, Chapter, CodexEntry, CodexFieldValue, InspirationCard,
  InspirationConfig, InspirationGenre, InspirationType, Project, Scene, SceneStatus,
} from '../types';
import { seedProject } from '../data/seed';
import { collectRelatedIds, createDefaultFields, stripRefs } from '../data/codexTemplates';

let uid = 1000;
export const nextId = (prefix: string) => `${prefix}-${++uid}`;

interface ProjectState {
  project: Project;
  activeChapterId: string;
  activeSceneId: string;

  setActiveChapter: (chapterId: string) => void;
  setActiveScene: (sceneId: string) => void;

  updateSceneContent: (sceneId: string, content: string) => void;
  updateSceneMeta: (sceneId: string, patch: Partial<Scene>) => void;
  addScene: (chapterId: string, order?: number) => void;
  deleteScene: (sceneId: string) => void;
  addBeat: (sceneId: string) => void;
  updateBeat: (sceneId: string, beatId: string, summary: string) => void;
  setBeats: (sceneId: string, beats: Beat[]) => void;

  updateChapterMeta: (chapterId: string, patch: Partial<Chapter>) => void;
  addChapter: () => string;
  /** 追加一条大纲草稿到指定章节的 summary */
  appendOutlineDraft: (chapterId: string, payload: { title: string; hook: string; protagonist?: string; conflict?: string; openAction?: string }) => void;

  updateCodex: (entryId: string, patch: Partial<CodexEntry>) => void;
  /** 更新结构化字段,并自动重算关联引用 */
  updateCodexField: (entryId: string, fieldId: string, value: CodexFieldValue) => void;
  addCodexEntry: (type: CodexEntry['type']) => string;
  deleteCodexEntry: (entryId: string) => void;

  // ---- 灵感助手 ----
  /** 更新灵感助手配置 */
  updateInspirationConfig: (patch: Partial<InspirationConfig>) => void;
  /** 收藏一张灵感卡片到灵感池 */
  addInspirationCard: (card: InspirationCard) => void;
  /** 从灵感池移除 */
  removeInspirationCard: (cardId: string) => void;
  /** 清空灵感池 */
  clearInspirationCards: () => void;
  /** 手动记录一条作者灵感(手记) */
  addManualInspiration: (data: {
    type: InspirationType;
    genre?: InspirationGenre;
    title: string;
    hook: string;
    tags: string[];
  }) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: seedProject,
  activeChapterId: seedProject.chapters[0].id,
  activeSceneId: seedProject.chapters[0].scenes[0].id,

  setActiveChapter: (chapterId) => set({ activeChapterId: chapterId }),
  setActiveScene: (sceneId) => {
    const { project } = get();
    const scene = project.chapters.flatMap((c) => c.scenes).find((s) => s.id === sceneId);
    if (scene) set({ activeSceneId: sceneId, activeChapterId: scene.chapterId });
  },

  updateSceneContent: (sceneId, content) =>
    set((state) => ({
      project: {
        ...state.project,
        chapters: state.project.chapters.map((c) => ({
          ...c,
          scenes: c.scenes.map((s) =>
            s.id === sceneId
              ? { ...s, content, wordCount: content.replace(/\s/g, '').length }
              : s
          ),
        })),
      },
    })),

  updateSceneMeta: (sceneId, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        chapters: state.project.chapters.map((c) => ({
          ...c,
          scenes: c.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s)),
        })),
      },
    })),

  addScene: (chapterId) =>
    set((state) => ({
      project: {
        ...state.project,
        chapters: state.project.chapters.map((c) => {
          if (c.id !== chapterId) return c;
          const order = c.scenes.length + 1;
          const scene: Scene = {
            id: nextId('s'),
            chapterId,
            title: `新场景 ${order}`,
            order,
            pov: '',
            location: '',
            timeline: '',
            mood: '',
            status: 'idea',
            labels: [],
            beats: [{ id: nextId('b'), summary: '拖拽节点或在此填写节拍' }],
            summary: '',
            content: '',
            wordCount: 0,
          };
          return { ...c, scenes: [...c.scenes, scene] };
        }),
      },
      activeSceneId: `s-${uid}`,
    })),

  deleteScene: (sceneId) =>
    set((state) => {
      const flat = state.project.chapters.flatMap((c) => c.scenes);
      const idx = flat.findIndex((s) => s.id === sceneId);
      const nextScene = flat[idx + 1] ?? flat[idx - 1];
      return {
        activeSceneId: nextScene?.id ?? state.activeSceneId,
        project: {
          ...state.project,
          chapters: state.project.chapters.map((c) => ({
            ...c,
            scenes: c.scenes.filter((s) => s.id !== sceneId),
          })),
        },
      };
    }),

  addBeat: (sceneId) =>
    set((state) => ({
      project: {
        ...state.project,
        chapters: state.project.chapters.map((c) => ({
          ...c,
          scenes: c.scenes.map((s) =>
            s.id === sceneId
              ? { ...s, beats: [...s.beats, { id: nextId('b'), summary: '新节拍' }] }
              : s
          ),
        })),
      },
    })),

  updateBeat: (sceneId, beatId, summary) =>
    set((state) => ({
      project: {
        ...state.project,
        chapters: state.project.chapters.map((c) => ({
          ...c,
          scenes: c.scenes.map((s) =>
            s.id === sceneId
              ? {
                  ...s,
                  beats: s.beats.map((b) => (b.id === beatId ? { ...b, summary } : b)),
                }
              : s
          ),
        })),
      },
    })),

  setBeats: (sceneId, beats) =>
    set((state) => ({
      project: {
        ...state.project,
        chapters: state.project.chapters.map((c) => ({
          ...c,
          scenes: c.scenes.map((s) => (s.id === sceneId ? { ...s, beats } : s)),
        })),
      },
    })),

  updateChapterMeta: (chapterId, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        chapters: state.project.chapters.map((c) =>
          c.id === chapterId ? { ...c, ...patch } : c
        ),
      },
    })),

  addChapter: () => {
    const id = nextId('c');
    set((state) => {
      const chapter: Chapter = {
        id,
        title: `第${state.project.chapters.length + 1}章 · 新章节`,
        order: state.project.chapters.length + 1,
        summary: '',
        status: 'idea',
        scenes: [],
      };
      return { project: { ...state.project, chapters: [...state.project.chapters, chapter] } };
    });
    return id;
  },

  appendOutlineDraft: (chapterId, payload) =>
    set((state) => ({
      project: {
        ...state.project,
        chapters: state.project.chapters.map((c) => {
          if (c.id !== chapterId) return c;
          const block = [
            `\n## [灵感草稿] ${payload.title}`,
            payload.hook && `> ${payload.hook}`,
            payload.protagonist && `- 主角:${payload.protagonist}`,
            payload.conflict && `- 冲突:${payload.conflict}`,
            payload.openAction && `- 开篇场景:${payload.openAction}`,
          ]
            .filter(Boolean)
            .join('\n');
          return { ...c, summary: c.summary ? c.summary + block : block.trimStart() };
        }),
      },
    })),

  updateCodex: (entryId, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        codex: state.project.codex.map((e) =>
          e.id === entryId ? { ...e, ...patch, updatedAt: Date.now() } : e
        ),
      },
    })),

  updateCodexField: (entryId, fieldId, value) =>
    set((state) => ({
      project: {
        ...state.project,
        codex: state.project.codex.map((e) => {
          if (e.id !== entryId) return e;
          const fields = { ...e.fields, [fieldId]: value };
          return { ...e, fields, relatedIds: collectRelatedIds(fields), updatedAt: Date.now() };
        }),
      },
    })),

  addCodexEntry: (type) => {
    const id = nextId('codex');
    const now = Date.now();
    const entry: CodexEntry = {
      id,
      type,
      name: '新档案',
      title: '',
      summary: '',
      details: '',
      tags: [],
      fields: createDefaultFields(type),
      relatedIds: [],
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ project: { ...state.project, codex: [...state.project.codex, entry] } }));
    return id;
  },

  deleteCodexEntry: (entryId) =>
    set((state) => ({
      project: {
        ...state.project,
        // 删除档案,并反向清理其他档案中对它的引用
        codex: state.project.codex
          .filter((e) => e.id !== entryId)
          .map((e) => {
            if (!e.relatedIds.includes(entryId) && !Object.values(e.fields).some((v) => v === entryId || (Array.isArray(v) && v.includes(entryId)))) {
              return e;
            }
            const fields = stripRefs(e.fields, entryId);
            return { ...e, fields, relatedIds: collectRelatedIds(fields), updatedAt: Date.now() };
          }),
      },
    })),

  // ==================== 灵感助手 ====================

  updateInspirationConfig: (patch) =>
    set((state) => ({
      project: {
        ...state.project,
        inspirationConfig: { ...state.project.inspirationConfig, ...patch },
      },
    })),

  addInspirationCard: (card) =>
    set((state) => {
      if (state.project.inspirationCards.some((c) => c.id === card.id)) return state;
      return {
        project: {
          ...state.project,
          inspirationCards: [card, ...state.project.inspirationCards],
        },
      };
    }),

  removeInspirationCard: (cardId) =>
    set((state) => ({
      project: {
        ...state.project,
        inspirationCards: state.project.inspirationCards.filter((c) => c.id !== cardId),
      },
    })),

  clearInspirationCards: () =>
    set((state) => ({
      project: { ...state.project, inspirationCards: [] },
    })),

  addManualInspiration: ({ type, genre, title, hook, tags }) =>
    set((state) => ({
      project: {
        ...state.project,
        inspirationCards: [
          {
            id: nextId('ins'),
            type,
            genre,
            title: title.trim() || '未命名灵感',
            hook: hook.trim(),
            tips: [],
            tags,
            source: 'manual',
            createdAt: Date.now(),
          },
          ...state.project.inspirationCards,
        ],
      },
    })),
}));

/** 便捷选择器:获取当前章节 */
export const useActiveChapter = () => {
  const project = useProjectStore((s) => s.project);
  const chapterId = useProjectStore((s) => s.activeChapterId);
  return project.chapters.find((c) => c.id === chapterId) ?? project.chapters[0];
};

/** 便捷选择器:获取当前场景 */
export const useActiveScene = () => {
  const project = useProjectStore((s) => s.project);
  const sceneId = useProjectStore((s) => s.activeSceneId);
  return project.chapters.flatMap((c) => c.scenes).find((s) => s.id === sceneId) ?? null;
};

export type { SceneStatus };

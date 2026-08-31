import { create } from 'zustand';
import type {
  Beat, Chapter, CodexEntry, CodexFieldValue, InspirationCard,
  InspirationConfig, InspirationGenre, InspirationType, JournalEntry, Project, Scene,
  SceneStatus, Unit, Volume,
} from '../types';
import { DEFAULT_INSPIRATION_CONFIG } from '../types';
import { seedProject } from '../data/seed';
import { collectRelatedIds, createDefaultFields, stripRefs } from '../data/codexTemplates';
import { flatScenes, locateChapter, locateScene, locateUnit } from '../utils/structure';

export const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const STORAGE_KEY = 'inkstruct.projects.v1';

/** 从 localStorage 恢复项目列表 */
function loadState(): { projects: Project[]; activeProjectId: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { projects?: Project[]; activeProjectId?: string };
    if (!parsed.projects?.length) return null;
    // 兼容早期版本:旧数据只有 chapters,补齐卷/单元两层
    const projects = parsed.projects.map((p) => migrate(p));
    const activeProjectId =
      parsed.activeProjectId && projects.some((p) => p.id === parsed.activeProjectId)
        ? parsed.activeProjectId
        : projects[0].id;
    return { projects, activeProjectId };
  } catch {
    return null;
  }
}

/** 旧结构(chapters 平铺)迁移为 卷 → 单元 → 章 */
function migrate(p: Project): Project {
  if (p.volumes?.length) return p;
  const legacy = (p as unknown as { chapters?: Chapter[] }).chapters ?? [];
  const volume: Volume = {
    id: nextId('v'),
    title: '第一卷',
    order: 1,
    summary: '',
    status: 'idea',
    units: [
      {
        id: nextId('u'),
        title: '单元一',
        order: 1,
        summary: '',
        status: 'idea',
        chapters: legacy,
      },
    ],
  };
  return { ...p, volumes: [volume] };
}

function saveState(projects: Project[], activeProjectId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, activeProjectId }));
  } catch {
    /* 超出配额时静默失败(多为参考图过大) */
  }
}

function createScene(chapterId: string, order: number): Scene {
  return {
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
}

/** 新建项目的初始结构:一卷 · 一单元 · 一章 · 一场景 */
function createBlankProject(data: {
  title: string;
  author: string;
  genre: string;
  logline: string;
}): Project {
  const chapterId = nextId('c');
  const now = Date.now();
  return {
    id: nextId('p'),
    title: data.title.trim() || '未命名新书',
    author: data.author.trim(),
    genre: data.genre.trim(),
    logline: data.logline.trim(),
    volumes: [
      {
        id: nextId('v'),
        title: '第一卷',
        order: 1,
        summary: '',
        status: 'idea',
        units: [
          {
            id: nextId('u'),
            title: '单元一',
            order: 1,
            summary: '',
            status: 'idea',
            chapters: [
              {
                id: chapterId,
                title: '第一章',
                order: 1,
                summary: '',
                status: 'idea',
                scenes: [createScene(chapterId, 1)],
              },
            ],
          },
        ],
      },
    ],
    codex: [],
    inspirationCards: [],
    inspirationConfig: { ...DEFAULT_INSPIRATION_CONFIG },
    journal: [],
    createdAt: now,
    updatedAt: now,
  };
}

/* ==================== 四层结构的更新 helper ==================== */

function mapVolumes(project: Project, fn: (v: Volume) => Volume): Project {
  return { ...project, volumes: project.volumes.map(fn) };
}
function mapUnits(project: Project, fn: (u: Unit, v: Volume) => Unit): Project {
  return mapVolumes(project, (v) => ({ ...v, units: v.units.map((u) => fn(u, v)) }));
}
function mapChapters(project: Project, fn: (c: Chapter, u: Unit, v: Volume) => Chapter): Project {
  return mapUnits(project, (u, v) => ({ ...u, chapters: u.chapters.map((c) => fn(c, u, v)) }));
}
function mapScenes(
  project: Project,
  fn: (s: Scene, c: Chapter, u: Unit, v: Volume) => Scene
): Project {
  return mapChapters(project, (c, u, v) => ({ ...c, scenes: c.scenes.map((s) => fn(s, c, u, v)) }));
}

/* ==================== Store ==================== */

interface ProjectState {
  /** 全部项目 */
  projects: Project[];
  activeProjectId: string;
  /** 当前项目(与 projects 中对应项保持同步) */
  project: Project;

  activeVolumeId: string;
  activeUnitId: string;
  activeChapterId: string;
  activeSceneId: string;

  // ---- 项目(书)增删改查 ----
  createProject: (data: { title: string; author: string; genre: string; logline: string }) => string;
  updateProjectMeta: (patch: Partial<Pick<Project, 'title' | 'author' | 'genre' | 'logline'>>) => void;
  deleteProject: (projectId: string) => void;
  setActiveProject: (projectId: string) => void;
  duplicateProject: (projectId: string) => void;

  // ---- 结构导航 ----
  setActiveVolume: (volumeId: string) => void;
  setActiveUnit: (unitId: string) => void;
  setActiveChapter: (chapterId: string) => void;
  setActiveScene: (sceneId: string) => void;

  // ---- 场景 ----
  updateSceneContent: (sceneId: string, content: string) => void;
  updateSceneMeta: (sceneId: string, patch: Partial<Scene>) => void;
  addScene: (chapterId: string) => void;
  deleteScene: (sceneId: string) => void;
  addBeat: (sceneId: string) => void;
  updateBeat: (sceneId: string, beatId: string, summary: string) => void;
  setBeats: (sceneId: string, beats: Beat[]) => void;

  // ---- 章 ----
  addChapter: (unitId?: string) => string;
  updateChapterMeta: (chapterId: string, patch: Partial<Chapter>) => void;
  deleteChapter: (chapterId: string) => void;
  /** 拖拽移动章:插入到目标单元的 targetIndex 位置,并重排 order */
  moveChapter: (chapterId: string, targetUnitId: string, targetIndex: number) => void;

  // ---- 单元 ----
  addUnit: (volumeId?: string) => string;
  updateUnitMeta: (unitId: string, patch: Partial<Unit>) => void;
  deleteUnit: (unitId: string) => void;

  // ---- 卷 ----
  addVolume: () => string;
  updateVolumeMeta: (volumeId: string, patch: Partial<Volume>) => void;
  deleteVolume: (volumeId: string) => void;

  // ---- Codex ----
  updateCodex: (entryId: string, patch: Partial<CodexEntry>) => void;
  updateCodexField: (entryId: string, fieldId: string, value: CodexFieldValue) => void;
  addCodexEntry: (type: CodexEntry['type']) => string;
  deleteCodexEntry: (entryId: string) => void;

  // ---- 灵感助手 ----
  updateInspirationConfig: (patch: Partial<InspirationConfig>) => void;
  addInspirationCard: (card: InspirationCard) => void;
  removeInspirationCard: (cardId: string) => void;
  clearInspirationCards: () => void;
  addManualInspiration: (data: {
    type: InspirationType;
    genre?: InspirationGenre;
    title: string;
    hook: string;
    tags: string[];
  }) => void;

  // ---- 创作日志 ----
  addJournalEntry: (data: { date: string; words: number; note: string; mood?: string }) => void;
  updateJournalEntry: (entryId: string, patch: Partial<JournalEntry>) => void;
  deleteJournalEntry: (entryId: string) => void;
}

const persisted = loadState();
const initialProjects = persisted?.projects ?? [seedProject];
const initialProject =
  initialProjects.find((p) => p.id === persisted?.activeProjectId) ?? initialProjects[0];

/** 取当前项目第一个可用场景,用于初始化/切换项目时的导航(字段名与 state 一致,可直接展开) */
function firstIds(project: Project): {
  activeVolumeId: string;
  activeUnitId: string;
  activeChapterId: string;
  activeSceneId: string;
} {
  const loc = flatScenes(project)[0];
  return {
    activeVolumeId: loc?.volume.id ?? '',
    activeUnitId: loc?.unit.id ?? '',
    activeChapterId: loc?.chapter.id ?? '',
    activeSceneId: loc?.scene.id ?? '',
  };
}
const ids0 = firstIds(initialProject);

export const useProjectStore = create<ProjectState>((set, get) => {
  /** 统一提交:更新当前项目并同步回 projects 列表 */
  const commit = (updater: (p: Project) => Project, extra?: Partial<ProjectState>) => {
    set((state) => {
      const next = { ...updater(state.project), updatedAt: Date.now() };
      const projects = state.projects.map((p) => (p.id === next.id ? next : p));
      saveState(projects, state.activeProjectId);
      return { ...extra, project: next, projects };
    });
  };

  /** 重新校准导航 id(删除操作后防悬空) */
  const reanchor = () => {
    const { project, activeSceneId, activeChapterId, activeUnitId, activeVolumeId } = get();
    const sceneOk = !!locateScene(project, activeSceneId);
    const chapterOk = !!locateChapter(project, activeChapterId);
    const unitOk = !!locateUnit(project, activeUnitId);
    const volumeOk = project.volumes.some((v) => v.id === activeVolumeId);
    const patch: Partial<ProjectState> = {};
    if (!sceneOk) patch.activeSceneId = flatScenes(project)[0]?.scene.id ?? '';
    if (!chapterOk) patch.activeChapterId = locateChapter(project, get().activeChapterId)?.chapter.id ?? flatScenes(project)[0]?.chapter.id ?? '';
    if (!unitOk) patch.activeUnitId = flatScenes(project)[0]?.unit.id ?? '';
    if (!volumeOk) patch.activeVolumeId = project.volumes[0]?.id ?? '';
    if (Object.keys(patch).length) set(patch);
  };

  return {
    projects: initialProjects,
    activeProjectId: initialProject.id,
    project: initialProject,

    activeVolumeId: ids0.activeVolumeId,
    activeUnitId: ids0.activeUnitId,
    activeChapterId: ids0.activeChapterId,
    activeSceneId: ids0.activeSceneId,

    /* ============ 项目 CRUD ============ */

    createProject: (data) => {
      const project = createBlankProject(data);
      set((state) => {
        const projects = [project, ...state.projects];
        saveState(projects, project.id);
        const ids = firstIds(project);
        return {
          projects,
          project,
          activeProjectId: project.id,
          ...ids,
        };
      });
      return project.id;
    },

    updateProjectMeta: (patch) => commit((p) => ({ ...p, ...patch })),

    deleteProject: (projectId) => {
      const { projects } = get();
      if (projects.length <= 1) return; // 至少保留一本书
      const rest = projects.filter((p) => p.id !== projectId);
      const next = rest[0];
      const ids = firstIds(next);
      set(() => {
        saveState(rest, next.id);
        return {
          projects: rest,
          project: next,
          activeProjectId: next.id,
          ...ids,
        };
      });
    },

    setActiveProject: (projectId) => {
      const target = get().projects.find((p) => p.id === projectId);
      if (!target) return;
      const ids = firstIds(target);
      set(() => {
        saveState(get().projects, projectId);
        return { project: target, activeProjectId: projectId, ...ids };
      });
    },

    duplicateProject: (projectId) => {
      const src = get().projects.find((p) => p.id === projectId);
      if (!src) return;
      const copy: Project = {
        ...structuredClone(src),
        id: nextId('p'),
        title: `${src.title} · 副本`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set((state) => {
        const projects = [copy, ...state.projects];
        saveState(projects, copy.id);
        return { projects, project: copy, activeProjectId: copy.id, ...firstIds(copy) };
      });
    },

    /* ============ 导航 ============ */

    setActiveVolume: (volumeId) => set({ activeVolumeId: volumeId }),
    setActiveUnit: (unitId) => {
      const loc = locateUnit(get().project, unitId);
      set({ activeUnitId: unitId, ...(loc ? { activeVolumeId: loc.volume.id } : {}) });
    },
    setActiveChapter: (chapterId) => {
      const loc = locateChapter(get().project, chapterId);
      set({
        activeChapterId: chapterId,
        ...(loc ? { activeVolumeId: loc.volume.id, activeUnitId: loc.unit.id } : {}),
      });
    },
    setActiveScene: (sceneId) => {
      const loc = locateScene(get().project, sceneId);
      set({
        activeSceneId: sceneId,
        ...(loc
          ? {
              activeVolumeId: loc.volume.id,
              activeUnitId: loc.unit.id,
              activeChapterId: loc.chapter.id,
            }
          : {}),
      });
    },

    /* ============ 场景 ============ */

    updateSceneContent: (sceneId, content) =>
      commit((p) =>
        mapScenes(p, (s) =>
          s.id === sceneId ? { ...s, content, wordCount: content.replace(/\s/g, '').length } : s
        )
      ),

    updateSceneMeta: (sceneId, patch) =>
      commit((p) => mapScenes(p, (s) => (s.id === sceneId ? { ...s, ...patch } : s))),

    addScene: (chapterId) => {
      let newId = '';
      commit((p) =>
        mapChapters(p, (c) => {
          if (c.id !== chapterId) return c;
          const scene = createScene(chapterId, c.scenes.length + 1);
          newId = scene.id;
          return { ...c, scenes: [...c.scenes, scene] };
        })
      );
      if (newId) set({ activeSceneId: newId });
    },

    deleteScene: (sceneId) => {
      commit((p) => mapChapters(p, (c) => ({ ...c, scenes: c.scenes.filter((s) => s.id !== sceneId) })));
      reanchor();
    },

    addBeat: (sceneId) =>
      commit((p) =>
        mapScenes(p, (s) =>
          s.id === sceneId ? { ...s, beats: [...s.beats, { id: nextId('b'), summary: '新节拍' }] } : s
        )
      ),

    updateBeat: (sceneId, beatId, summary) =>
      commit((p) =>
        mapScenes(p, (s) =>
          s.id === sceneId
            ? { ...s, beats: s.beats.map((b) => (b.id === beatId ? { ...b, summary } : b)) }
            : s
        )
      ),

    setBeats: (sceneId, beats) =>
      commit((p) => mapScenes(p, (s) => (s.id === sceneId ? { ...s, beats } : s))),

    /* ============ 章 ============ */

    addChapter: (unitId) => {
      const targetUnitId = unitId ?? get().activeUnitId;
      let chapterId = '';
      commit((p) =>
        mapUnits(p, (u) => {
          if (u.id !== targetUnitId) return u;
          chapterId = nextId('c');
          const chapter: Chapter = {
            id: chapterId,
            title: `第${u.chapters.length + 1}章 · 新章节`,
            order: u.chapters.length + 1,
            summary: '',
            status: 'idea',
            scenes: [],
          };
          return { ...u, chapters: [...u.chapters, chapter] };
        })
      );
      reanchor();
      return chapterId;
    },

    updateChapterMeta: (chapterId, patch) =>
      commit((p) => mapChapters(p, (c) => (c.id === chapterId ? { ...c, ...patch } : c))),

    moveChapter: (chapterId, targetUnitId, targetIndex) => {
      // 1. 找到被拖的章
      let moved: Chapter | undefined;
      get().project.volumes.forEach((v) =>
        v.units.forEach((u) => {
          const found = u.chapters.find((c) => c.id === chapterId);
          if (found) moved = found;
        })
      );
      if (!moved) return;
      // 2. 从原位置移除
      const removed = mapUnits(get().project, (u) => ({
        ...u,
        chapters: u.chapters.filter((c) => c.id !== chapterId),
      }));
      // 3. 插入目标位置并重排 order(拖到目标卡上,落在目标卡附近)
      const next = mapUnits(removed, (u) => {
        if (u.id !== targetUnitId) return u;
        const arr = [...u.chapters];
        const insertAt = Math.max(0, Math.min(targetIndex, arr.length));
        arr.splice(insertAt, 0, moved!);
        return { ...u, chapters: arr.map((c, i) => ({ ...c, order: i + 1 })) };
      });
      set((state) => {
        const project = { ...next, updatedAt: Date.now() };
        const projects = state.projects.map((p) => (p.id === project.id ? project : p));
        saveState(projects, state.activeProjectId);
        return { project, projects };
      });
    },

    deleteChapter: (chapterId) => {
      commit((p) => mapUnits(p, (u) => ({ ...u, chapters: u.chapters.filter((c) => c.id !== chapterId) })));
      reanchor();
    },

    /* ============ 单元 ============ */

    addUnit: (volumeId) => {
      const targetVolumeId = volumeId ?? get().activeVolumeId;
      let unitId = '';
      commit((p) =>
        mapVolumes(p, (v) => {
          if (v.id !== targetVolumeId) return v;
          unitId = nextId('u');
          const unit: Unit = {
            id: unitId,
            title: `单元${v.units.length + 1}`,
            order: v.units.length + 1,
            summary: '',
            status: 'idea',
            chapters: [],
          };
          return { ...v, units: [...v.units, unit] };
        })
      );
      reanchor();
      return unitId;
    },

    updateUnitMeta: (unitId, patch) =>
      commit((p) => mapUnits(p, (u) => (u.id === unitId ? { ...u, ...patch } : u))),

    deleteUnit: (unitId) => {
      commit((p) =>
        mapVolumes(p, (v) => ({ ...v, units: v.units.filter((u) => u.id !== unitId) }))
      );
      reanchor();
    },

    /* ============ 卷 ============ */

    addVolume: () => {
      let volumeId = '';
      commit((p) => {
        volumeId = nextId('v');
        const unitId = nextId('u');
        const volume: Volume = {
          id: volumeId,
          title: `第${p.volumes.length + 1}卷`,
          order: p.volumes.length + 1,
          summary: '',
          status: 'idea',
          units: [
            { id: unitId, title: '单元一', order: 1, summary: '', status: 'idea', chapters: [] },
          ],
        };
        return { ...p, volumes: [...p.volumes, volume] };
      });
      reanchor();
      return volumeId;
    },

    updateVolumeMeta: (volumeId, patch) =>
      commit((p) => mapVolumes(p, (v) => (v.id === volumeId ? { ...v, ...patch } : v))),

    deleteVolume: (volumeId) => {
      commit((p) => ({ ...p, volumes: p.volumes.filter((v) => v.id !== volumeId) }));
      reanchor();
    },

    /* ============ Codex ============ */

    updateCodex: (entryId, patch) =>
      commit((p) => ({
        ...p,
        codex: p.codex.map((e) => (e.id === entryId ? { ...e, ...patch, updatedAt: Date.now() } : e)),
      })),

    updateCodexField: (entryId, fieldId, value) =>
      commit((p) => ({
        ...p,
        codex: p.codex.map((e) => {
          if (e.id !== entryId) return e;
          const fields = { ...e.fields, [fieldId]: value };
          return { ...e, fields, relatedIds: collectRelatedIds(fields), updatedAt: Date.now() };
        }),
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
      commit((p) => ({ ...p, codex: [...p.codex, entry] }));
      return id;
    },

    deleteCodexEntry: (entryId) =>
      commit((p) => ({
        ...p,
        codex: p.codex
          .filter((e) => e.id !== entryId)
          .map((e) => {
            if (
              !e.relatedIds.includes(entryId) &&
              !Object.values(e.fields).some(
                (v) => v === entryId || (Array.isArray(v) && v.includes(entryId))
              )
            ) {
              return e;
            }
            const fields = stripRefs(e.fields, entryId);
            return { ...e, fields, relatedIds: collectRelatedIds(fields), updatedAt: Date.now() };
          }),
      })),

    /* ============ 灵感助手 ============ */

    updateInspirationConfig: (patch) =>
      commit((p) => ({ ...p, inspirationConfig: { ...p.inspirationConfig, ...patch } })),

    addInspirationCard: (card) =>
      commit((p) => {
        if (p.inspirationCards.some((c) => c.id === card.id)) return p;
        return { ...p, inspirationCards: [card, ...p.inspirationCards] };
      }),

    removeInspirationCard: (cardId) =>
      commit((p) => ({
        ...p,
        inspirationCards: p.inspirationCards.filter((c) => c.id !== cardId),
      })),

    clearInspirationCards: () => commit((p) => ({ ...p, inspirationCards: [] })),

    addManualInspiration: ({ type, genre, title, hook, tags }) =>
      commit((p) => ({
        ...p,
        inspirationCards: [
          {
            id: nextId('ins'),
            type,
            genre,
            title: title.trim() || '未命名灵感',
            hook: hook.trim(),
            tips: [],
            tags,
            source: 'manual' as const,
            createdAt: Date.now(),
          },
          ...p.inspirationCards,
        ],
      })),

    /* ============ 创作日志 ============ */

    addJournalEntry: ({ date, words, note, mood }) =>
      commit((p) => ({
        ...p,
        journal: [
          { id: nextId('j'), date, words, note, mood, createdAt: Date.now() },
          ...p.journal,
        ],
      })),

    updateJournalEntry: (entryId, patch) =>
      commit((p) => ({
        ...p,
        journal: p.journal.map((e) => (e.id === entryId ? { ...e, ...patch } : e)),
      })),

    deleteJournalEntry: (entryId) =>
      commit((p) => ({ ...p, journal: p.journal.filter((e) => e.id !== entryId) })),
  };
});

/** 便捷选择器:当前卷 */
export const useActiveVolume = () => {
  const project = useProjectStore((s) => s.project);
  const id = useProjectStore((s) => s.activeVolumeId);
  return project.volumes.find((v) => v.id === id) ?? project.volumes[0] ?? null;
};

/** 便捷选择器:当前章 */
export const useActiveChapter = () => {
  const project = useProjectStore((s) => s.project);
  const chapterId = useProjectStore((s) => s.activeChapterId);
  return locateChapter(project, chapterId)?.chapter ?? flatScenes(project)[0]?.chapter ?? null;
};

/** 便捷选择器:当前场景 */
export const useActiveScene = () => {
  const project = useProjectStore((s) => s.project);
  const sceneId = useProjectStore((s) => s.activeSceneId);
  return locateScene(project, sceneId)?.scene ?? null;
};

export type { SceneStatus };

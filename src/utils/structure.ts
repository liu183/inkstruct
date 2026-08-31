import type { Chapter, Project, Scene, Unit, Volume } from '../types';

/**
 * 四层故事结构(卷 → 单元 → 章 → 场景)的遍历工具。
 * 所有组件统一通过这些函数访问结构,避免在各处重复嵌套遍历。
 */

/** 全部单元(带上所属卷) */
export function flatUnits(project: Project): { volume: Volume; unit: Unit }[] {
  const out: { volume: Volume; unit: Unit }[] = [];
  project.volumes.forEach((volume) => {
    volume.units.forEach((unit) => out.push({ volume, unit }));
  });
  return out;
}

/** 全部章(带上所属卷与单元) */
export function flatChapters(project: Project): { volume: Volume; unit: Unit; chapter: Chapter }[] {
  const out: { volume: Volume; unit: Unit; chapter: Chapter }[] = [];
  project.volumes.forEach((volume) => {
    volume.units.forEach((unit) => {
      unit.chapters.forEach((chapter) => out.push({ volume, unit, chapter }));
    });
  });
  return out;
}

/** 全部场景(带上所属卷、单元、章) */
export function flatScenes(
  project: Project
): { volume: Volume; unit: Unit; chapter: Chapter; scene: Scene }[] {
  const out: { volume: Volume; unit: Unit; chapter: Chapter; scene: Scene }[] = [];
  project.volumes.forEach((volume) => {
    volume.units.forEach((unit) => {
      unit.chapters.forEach((chapter) => {
        chapter.scenes.forEach((scene) => out.push({ volume, unit, chapter, scene }));
      });
    });
  });
  return out;
}

/** 仅取章数组(不需要上下文时使用) */
export function chapters(project: Project): Chapter[] {
  return flatChapters(project).map((x) => x.chapter);
}

/** 仅取场景数组(不需要上下文时使用) */
export function scenes(project: Project): Scene[] {
  return flatScenes(project).map((x) => x.scene);
}

/** 按 id 定位场景及其完整路径 */
export function locateScene(
  project: Project,
  sceneId: string | null
): { volume: Volume; unit: Unit; chapter: Chapter; scene: Scene } | null {
  if (!sceneId) return null;
  return flatScenes(project).find((x) => x.scene.id === sceneId) ?? null;
}

/** 按 id 定位章及其路径 */
export function locateChapter(
  project: Project,
  chapterId: string | null
): { volume: Volume; unit: Unit; chapter: Chapter } | null {
  if (!chapterId) return null;
  return flatChapters(project).find((x) => x.chapter.id === chapterId) ?? null;
}

/** 按 id 定位单元及其所属卷 */
export function locateUnit(project: Project, unitId: string | null): { volume: Volume; unit: Unit } | null {
  if (!unitId) return null;
  return flatUnits(project).find((x) => x.unit.id === unitId) ?? null;
}

/** 全书总字数 */
export function totalWords(project: Project): number {
  return flatScenes(project).reduce((n, x) => n + x.scene.wordCount, 0);
}

/** 结构路径文本,用于面包屑,如「第一卷 · 古庙惊魂 / 第一章」 */
export function chapterPath(project: Project, chapterId: string | null): string {
  const loc = locateChapter(project, chapterId);
  if (!loc) return '—';
  return `${loc.volume.title} / ${loc.unit.title} / ${loc.chapter.title}`;
}

/** 统计各状态场景数,用于进度展示 */
export function statusStats(project: Project): { total: number; done: number; writing: number } {
  const all = flatScenes(project);
  return {
    total: all.length,
    done: all.filter((x) => x.scene.status === 'done').length,
    writing: all.filter((x) => x.scene.status === 'writing').length,
  };
}

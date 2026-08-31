import { describe, expect, it } from 'vitest';
import type { Project, Scene, SceneStatus } from '../types';
import {
  chapters,
  chapterPath,
  flatChapters,
  flatScenes,
  flatUnits,
  locateChapter,
  locateScene,
  locateUnit,
  scenes,
  statusStats,
  totalWords,
} from './structure';

function makeScene(id: string, title: string, status: SceneStatus = 'idea', wordCount = 100): Scene {
  return {
    id,
    chapterId: '',
    title,
    order: 1,
    pov: '',
    location: '',
    timeline: '',
    mood: '',
    status,
    labels: [],
    beats: [],
    summary: '',
    content: '',
    wordCount,
  };
}

function makeProject(): Project {
  return {
    id: 'p1',
    title: '测试书',
    author: 'tester',
    genre: '仙侠玄幻',
    logline: '',
    volumes: [
      {
        id: 'v1',
        title: '第一卷',
        order: 1,
        summary: '',
        status: 'idea',
        units: [
          {
            id: 'u1',
            title: '单元一',
            order: 1,
            summary: '',
            status: 'idea',
            chapters: [
              {
                id: 'c1',
                title: '第一章',
                order: 1,
                summary: '',
                status: 'idea',
                scenes: [makeScene('s1', '场景一', 'done', 300), makeScene('s2', '场景二', 'writing', 500)],
              },
              {
                id: 'c2',
                title: '第二章',
                order: 2,
                summary: '',
                status: 'idea',
                scenes: [makeScene('s3', '场景三', 'idea', 200)],
              },
            ],
          },
          {
            id: 'u2',
            title: '单元二',
            order: 2,
            summary: '',
            status: 'idea',
            chapters: [
              {
                id: 'c3',
                title: '第三章',
                order: 1,
                summary: '',
                status: 'idea',
                scenes: [makeScene('s4', '场景四', 'done', 400)],
              },
            ],
          },
        ],
      },
      {
        id: 'v2',
        title: '第二卷',
        order: 2,
        summary: '',
        status: 'idea',
        units: [],
      },
    ],
    codex: [],
    inspirationCards: [],
    inspirationConfig: {
      count: 5,
      directions: [],
      genres: [],
      axisSelections: {},
      wildness: 2,
      codexLinked: false,
      ambientEnabled: false,
      ambientFrequency: 'low',
      showTips: true,
    },
    journal: [],
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('structure 四层遍历工具', () => {
  const project = makeProject();

  it('flatUnits 返回全部单元并携带所属卷', () => {
    const units = flatUnits(project);
    expect(units).toHaveLength(2);
    expect(units[0].volume.id).toBe('v1');
    expect(units[1].unit.id).toBe('u2');
  });

  it('flatChapters 返回全部章并携带完整路径', () => {
    const chs = flatChapters(project);
    expect(chs).toHaveLength(3);
    expect(chs[1]).toMatchObject({ volume: { id: 'v1' }, unit: { id: 'u1' }, chapter: { id: 'c2' } });
  });

  it('flatScenes 返回全部场景并携带四级路径', () => {
    const sc = flatScenes(project);
    expect(sc).toHaveLength(4);
    expect(sc[3]).toMatchObject({
      volume: { id: 'v1' },
      unit: { id: 'u2' },
      chapter: { id: 'c3' },
      scene: { id: 's4' },
    });
  });

  it('chapters / scenes 只返回最内层数据', () => {
    expect(chapters(project).map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
    expect(scenes(project).map((s) => s.id)).toEqual(['s1', 's2', 's3', 's4']);
  });

  it('locateScene / locateChapter / locateUnit 按 id 定位', () => {
    const loc = locateScene(project, 's2');
    expect(loc?.scene.title).toBe('场景二');
    expect(loc?.chapter.id).toBe('c1');
    expect(locateChapter(project, 'c3')?.unit.id).toBe('u2');
    expect(locateUnit(project, 'u2')?.volume.id).toBe('v1');
    // 不存在的 id 返回 null
    expect(locateScene(project, 'not-exist')).toBeNull();
    expect(locateScene(project, null)).toBeNull();
  });

  it('totalWords 汇总全部场景字数', () => {
    expect(totalWords(project)).toBe(300 + 500 + 200 + 400);
  });

  it('chapterPath 生成面包屑文本,找不到时返回占位符', () => {
    expect(chapterPath(project, 'c1')).toBe('第一卷 / 单元一 / 第一章');
    expect(chapterPath(project, null)).toBe('—');
  });

  it('statusStats 统计各状态场景数', () => {
    const stats = statusStats(project);
    expect(stats).toEqual({ total: 4, done: 2, writing: 1 });
  });
});

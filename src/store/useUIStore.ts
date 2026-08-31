import { create } from 'zustand';
import type { PlanViewMode, Workspace } from '../types';

interface UIState {
  workspace: Workspace;
  planViewMode: PlanViewMode;
  codexDrawerOpen: boolean;   // Write 页右侧 Codex 抽屉
  focusMode: boolean;         // Write 页专注模式
  statusMessage: string;

  /** 顶栏 AI 助手面板 */
  aiPanelOpen: boolean;
  /** 设置弹窗 */
  settingsOpen: boolean;
  /** 分享弹窗 */
  shareOpen: boolean;
  /** 全局搜索 */
  searchOpen: boolean;

  setWorkspace: (w: Workspace) => void;
  setPlanViewMode: (m: PlanViewMode) => void;
  setCodexDrawerOpen: (v: boolean) => void;
  setFocusMode: (v: boolean) => void;
  setStatusMessage: (msg: string) => void;
  setAiPanelOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  setShareOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  workspace: 'write',
  planViewMode: 'grid',
  codexDrawerOpen: false,
  focusMode: false,
  statusMessage: '就绪',

  aiPanelOpen: false,
  settingsOpen: false,
  shareOpen: false,
  searchOpen: false,

  setWorkspace: (workspace) => set({ workspace }),
  setPlanViewMode: (planViewMode) => set({ planViewMode }),
  setCodexDrawerOpen: (codexDrawerOpen) => set({ codexDrawerOpen }),
  setFocusMode: (focusMode) => set({ focusMode }),
  setStatusMessage: (statusMessage) => set({ statusMessage }),
  setAiPanelOpen: (aiPanelOpen) => set({ aiPanelOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setShareOpen: (shareOpen) => set({ shareOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}));

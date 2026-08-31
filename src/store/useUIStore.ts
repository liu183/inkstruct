import { create } from 'zustand';
import type { PlanViewMode, Workspace } from '../types';

interface UIState {
  workspace: Workspace;
  planViewMode: PlanViewMode;
  codexDrawerOpen: boolean;   // Write 页右侧 Codex 抽屉
  focusMode: boolean;         // Write 页专注模式
  statusMessage: string;
  setWorkspace: (w: Workspace) => void;
  setPlanViewMode: (m: PlanViewMode) => void;
  setCodexDrawerOpen: (v: boolean) => void;
  setFocusMode: (v: boolean) => void;
  setStatusMessage: (msg: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  workspace: 'write',
  planViewMode: 'grid',
  codexDrawerOpen: false,
  focusMode: false,
  statusMessage: '就绪',
  setWorkspace: (workspace) => set({ workspace }),
  setPlanViewMode: (planViewMode) => set({ planViewMode }),
  setCodexDrawerOpen: (codexDrawerOpen) => set({ codexDrawerOpen }),
  setFocusMode: (focusMode) => set({ focusMode }),
  setStatusMessage: (statusMessage) => set({ statusMessage }),
}));

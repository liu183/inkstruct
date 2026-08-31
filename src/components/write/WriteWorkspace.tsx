import { useActiveScene } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import BeatRail from './BeatRail';
import SceneEditor from './SceneEditor';
import CodexDrawer from './CodexDrawer';
import AmbientInspiration from './AmbientInspiration';

export default function WriteWorkspace() {
  const scene = useActiveScene();
  const codexDrawerOpen = useUIStore((s) => s.codexDrawerOpen);
  const focusMode = useUIStore((s) => s.focusMode);

  if (!scene) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-600">
        请先在 Plan 中创建或选择一个场景
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0">
      {/* 节拍轨 */}
      {!focusMode && <BeatRail scene={scene} />}

      {/* 编辑器 */}
      <SceneEditor scene={scene} />

      {/* Codex 抽屉 */}
      {codexDrawerOpen && !focusMode && <CodexDrawer />}

      {/* 自动灵感弹卡 */}
      <AmbientInspiration />
    </div>
  );
}

import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import StatusBar from './components/layout/StatusBar';
import PlanWorkspace from './components/plan/PlanWorkspace';
import WriteWorkspace from './components/write/WriteWorkspace';
import CodexWorkspace from './components/codex/CodexWorkspace';
import InspirationWorkspace from './components/inspiration/InspirationWorkspace';
import DraftsWorkspace from './components/drafts/DraftsWorkspace';
import JournalWorkspace from './components/journal/JournalWorkspace';
import AIPanel from './components/ai/AIPanel';
import ShareModal from './components/share/ShareModal';
import SettingsModal from './components/settings/SettingsModal';
import { useUIStore } from './store/useUIStore';

export default function App() {
  const workspace = useUIStore((s) => s.workspace);

  return (
    <div className="flex h-full flex-col bg-ink-950">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1">
          {workspace === 'plan' && <PlanWorkspace />}
          {workspace === 'write' && <WriteWorkspace />}
          {workspace === 'codex' && <CodexWorkspace />}
          {workspace === 'inspiration' && <InspirationWorkspace />}
          {workspace === 'drafts' && <DraftsWorkspace />}
          {workspace === 'journal' && <JournalWorkspace />}
        </main>
      </div>
      <StatusBar />

      {/* 全局浮层 */}
      <AIPanel />
      <ShareModal />
      <SettingsModal />
    </div>
  );
}

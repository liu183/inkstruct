import { useCallback, useRef, useState } from 'react';
import { streamAIText, AI_COMMAND_LABELS, type AIGenContext } from '../utils/aiEngine';
import { useProjectStore } from '../store/useProjectStore';
import { useUIStore } from '../store/useUIStore';
import { locateScene } from '../utils/structure';

export interface AIOutputState {
  active: boolean;
  commandId: string | null;
  commandLabel: string;
  output: string;
  error: string | null;
}

/**
 * AI 写作状态机:
 *  - 运行中:流式输出到 output 缓冲
 *  - 完成:用户选择「插入」「替换全文」或「丢弃」
 */
export function useAIWriter() {
  const updateSceneContent = useProjectStore((s) => s.updateSceneContent);
  const setStatusMessage = useUIStore((s) => s.setStatusMessage);
  const [state, setState] = useState<AIOutputState>({
    active: false,
    commandId: null,
    commandLabel: '',
    output: '',
    error: null,
  });
  const cancelRef = useRef<() => void>(() => {});

  const runAI = useCallback(
    async (commandId: string, ctx: AIGenContext) => {
      // 取消上一次运行
      cancelRef.current();
      const label = AI_COMMAND_LABELS[commandId] ?? commandId;
      setState({ active: true, commandId, commandLabel: label, output: '', error: null });
      setStatusMessage(`AI 正在${label}…`);

      let cancelled = false;
      cancelRef.current = () => {
        cancelled = true;
      };

      let acc = '';
      try {
        for await (const chunk of streamAIText(ctx)) {
          if (cancelled) break;
          acc += chunk;
          setState((s) => ({ ...s, output: acc }));
        }
        if (!cancelled) {
          setState((s) => ({ ...s, active: false }));
          setStatusMessage(`AI ${label}完成,可插入正文`);
        }
      } catch {
        if (!cancelled) {
          setState((s) => ({ ...s, active: false, error: 'AI 生成失败,请重试' }));
          setStatusMessage('AI 生成失败');
        }
      }
    },
    [setStatusMessage]
  );

  const stop = useCallback(() => {
    cancelRef.current();
    setState((s) => ({ ...s, active: false }));
    setStatusMessage('已停止 AI 生成');
  }, [setStatusMessage]);

  /** 将 AI 输出写入场景正文 */
  const applyToScene = useCallback(
    (sceneId: string, mode: 'append' | 'replace') => {
      setState((s) => {
        if (s.output) {
          const { project } = useProjectStore.getState();
          const scene = locateScene(project, sceneId)?.scene;
          if (scene) {
            const next = mode === 'replace' ? s.output : scene.content + (scene.content ? '\n\n' : '') + s.output;
            updateSceneContent(sceneId, next);
          }
        }
        return { active: false, commandId: null, commandLabel: '', output: '', error: null };
      });
      setStatusMessage('已应用到正文');
    },
    [updateSceneContent, setStatusMessage]
  );

  const discard = useCallback(() => {
    setState({ active: false, commandId: null, commandLabel: '', output: '', error: null });
    setStatusMessage('已丢弃 AI 输出');
  }, [setStatusMessage]);

  return { state, runAI, stop, applyToScene, discard };
}

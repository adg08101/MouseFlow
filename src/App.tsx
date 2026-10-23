import { Moon, Save, Sun } from 'lucide-react';
import { useEffect } from 'react';
import type { AutomationAction, RunConfig } from '../shared/types';
import { ActionEditor } from './components/ActionEditor';
import { ActionSidebar } from './components/ActionSidebar';
import { CursorTracker } from './components/CursorTracker';
import { ExecutionConsole } from './components/ExecutionConsole';
import { ExecutionToolbar } from './components/ExecutionToolbar';
import { SequenceBuilder } from './components/SequenceBuilder';
import { useAppStore } from './store/useAppStore';

function toRunConfig(loopConfig: RunConfig['loop'], startIndex?: number, stepMode?: boolean): RunConfig {
  return {
    loop: {
      mode: loopConfig.mode,
      count: Math.max(1, loopConfig.count),
      delayBetweenIterationsMs: Math.max(0, loopConfig.delayBetweenIterationsMs)
    },
    startIndex,
    stepMode
  };
}

export default function App(): JSX.Element {
  if (!window.mouseflow) {
    return (
      <main className="flex h-full items-center justify-center p-6">
        <div className="panel max-w-xl p-6 text-sm text-slate-200">
          <h1 className="mb-2 text-lg font-semibold">MouseFlow failed to initialize</h1>
          <p className="mb-2">
            The secure preload bridge is unavailable, so the renderer cannot reach Electron IPC.
          </p>
          <p className="text-slate-400">
            Please restart <code>npm run dev</code>. If the issue persists, check main-process logs for preload load errors.
          </p>
        </div>
      </main>
    );
  }

  const actions = useAppStore((state) => state.actions);
  const selectedActionId = useAppStore((state) => state.selectedActionId);
  const setActions = useAppStore((state) => state.setActions);
  const setSelectedActionId = useAppStore((state) => state.setSelectedActionId);
  const loopConfig = useAppStore((state) => state.loopConfig);
  const executionState = useAppStore((state) => state.executionState);
  const setExecutionState = useAppStore((state) => state.setExecutionState);
  const setProgress = useAppStore((state) => state.setProgress);
  const addLog = useAppStore((state) => state.addLog);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const sequences = useAppStore((state) => state.sequences);
  const setSequences = useAppStore((state) => state.setSequences);
  const selectedSequenceId = useAppStore((state) => state.selectedSequenceId);
  const setSelectedSequenceId = useAppStore((state) => state.setSelectedSequenceId);

  useEffect(() => {
    const unsubscribe = window.mouseflow.onAutomationEvent((event) => {
      if (event.kind === 'state' && event.state) {
        setExecutionState(event.state);
      }
      if (event.kind === 'progress' && event.progress) {
        setProgress(event.progress);
      }
      if (event.kind === 'log' && event.log) {
        addLog(event.log);
      }
    });
    return unsubscribe;
  }, [addLog, setExecutionState, setProgress]);

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    const load = async () => {
      const [loadedSequences, prefs] = await Promise.all([window.mouseflow.loadSequences(), window.mouseflow.getPreferences()]);
      setSequences(loadedSequences);
      setTheme(prefs.theme);
      if (loadedSequences[0]) {
        setSelectedSequenceId(loadedSequences[0].id);
      }
    };
    void load();
  }, [setSequences, setSelectedSequenceId, setTheme]);

  const run = async (startIndex?: number, stepMode?: boolean) => {
    if (!actions.length) {
      addLog({ level: 'warn', message: 'No actions in sequence.', timestamp: new Date().toISOString() });
      return;
    }
    const config = toRunConfig(loopConfig, startIndex, stepMode);
    if (executionState === 'paused') {
      await window.mouseflow.resumeSequence();
      return;
    }
    await window.mouseflow.runSequence(actions, config);
  };

  const saveCurrent = async () => {
    const name =
      selectedSequenceId && sequences.find((item) => item.id === selectedSequenceId)
        ? sequences.find((item) => item.id === selectedSequenceId)?.name ?? 'Untitled'
        : `Sequence ${new Date().toLocaleTimeString()}`;
    const saved = await window.mouseflow.saveSequence({ id: selectedSequenceId ?? undefined, name, actions });
    const loaded = await window.mouseflow.loadSequences();
    setSequences(loaded);
    setSelectedSequenceId(saved.id);
    addLog({ level: 'info', message: `Saved sequence: ${saved.name}`, timestamp: new Date().toISOString() });
  };

  const loadSelected = async (id: string) => {
    setSelectedSequenceId(id);
    const sequence = sequences.find((item) => item.id === id);
    if (sequence) {
      setActions(sequence.actions);
      setSelectedActionId(sequence.actions[0]?.id ?? null);
    }
  };

  const capturePosition = (x: number, y: number) => {
    const selected = actions.find((item) => item.id === selectedActionId);
    if (!selected || selected.type !== 'move') {
      return;
    }
    useAppStore.getState().updateAction(selected.id, { direction: 'absolute', x, y });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveCurrent();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <main className="grid h-full grid-rows-[auto_auto_minmax(0,1fr)_260px] gap-3 overflow-hidden p-3">
      <header className="panel flex items-center justify-between p-3">
        <h1 className="text-lg font-semibold">MouseFlow</h1>
        <div className="flex items-center gap-2">
          <select className="input w-56" value={selectedSequenceId ?? ''} onChange={(event) => void loadSelected(event.target.value)}>
            <option value="">Unsaved sequence</option>
            {sequences.map((sequence) => (
              <option key={sequence.id} value={sequence.id}>
                {sequence.name}
              </option>
            ))}
          </select>
          <button className="btn" onClick={() => void saveCurrent()}>
            <Save size={15} /> Save Sequence
          </button>
          <button
            className="btn"
            onClick={async () => {
              const next = theme === 'dark' ? 'light' : 'dark';
              setTheme(next);
              await window.mouseflow.setPreferences({ theme: next });
            }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />} {theme === 'dark' ? 'Light' : 'Dark'} Theme
          </button>
        </div>
      </header>

      <ExecutionToolbar
        onPlay={() => run()}
        onPause={() => window.mouseflow.pauseSequence()}
        onStop={() => window.mouseflow.stopSequence()}
        onStep={() => window.mouseflow.stepSequence(actions as AutomationAction[], toRunConfig(loopConfig, 0, true))}
        onRestart={() => window.mouseflow.restartSequence(actions as AutomationAction[], toRunConfig(loopConfig, 0, false))}
      />

      <section className="grid min-h-0 grid-cols-[280px,1fr,340px] gap-3 overflow-hidden">
        <ActionSidebar />
        <SequenceBuilder />
        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_220px] gap-3 overflow-hidden">
          <ActionEditor />
          <CursorTracker onCapture={capturePosition} />
        </div>
      </section>

      <ExecutionConsole />
    </main>
  );
}
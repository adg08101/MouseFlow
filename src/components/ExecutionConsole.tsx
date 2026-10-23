import { useAppStore } from '../store/useAppStore';

export function ExecutionConsole(): JSX.Element {
  const logs = useAppStore((state) => state.logs);
  const progress = useAppStore((state) => state.progress);
  const clearLogs = useAppStore((state) => state.clearLogs);

  const totalIterations = progress.totalIterations === 'infinite' ? '∞' : String(progress.totalIterations);
  const percent =
    progress.totalIterations === 'infinite' || progress.totalIterations === 0
      ? 0
      : Math.min(100, Math.round((progress.currentIteration / progress.totalIterations) * 100));

  return (
    <section className="panel flex h-full min-h-0 flex-col p-3">
      <header className="mb-2 flex shrink-0 items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Execution Console</h3>
        <button className="btn px-2 py-1" onClick={() => clearLogs()}>
          Clear
        </button>
      </header>
      <div className="mb-2 shrink-0 space-y-1 text-xs text-slate-300">
        <div>
          Iteration: {progress.currentIteration}/{totalIterations} • Actions executed: {progress.actionsExecuted} • Elapsed:{' '}
          {Math.floor(progress.elapsedMs / 1000)}s
        </div>
        <div className="h-2 rounded bg-slate-700">
          <div className="h-full rounded bg-accent transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto rounded bg-slate-950/50 p-2 font-mono text-xs">
        {logs.length === 0 ? <div className="text-slate-500">No events yet.</div> : null}
        {logs.map((log, index) => (
          <div key={`${log.timestamp}-${index}`} className="text-slate-300">
            [{new Date(log.timestamp).toLocaleTimeString()}] {log.level.toUpperCase()} — {log.message}
          </div>
        ))}
      </div>
    </section>
  );
}
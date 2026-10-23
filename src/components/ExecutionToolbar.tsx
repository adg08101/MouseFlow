import { Pause, Play, RotateCcw, Square, StepForward } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function ExecutionToolbar(props: {
  onPlay: () => Promise<void>;
  onPause: () => Promise<void>;
  onStop: () => Promise<void>;
  onStep: () => Promise<void>;
  onRestart: () => Promise<void>;
}): JSX.Element {
  const executionState = useAppStore((state) => state.executionState);
  const loopConfig = useAppStore((state) => state.loopConfig);
  const setLoopConfig = useAppStore((state) => state.setLoopConfig);

  return (
    <section className="panel flex flex-wrap items-center gap-2 p-3">
      <button className="btn btn-primary" onClick={() => void props.onPlay()}>
        <Play size={15} /> PLAY
      </button>
      <button className="btn" onClick={() => void props.onPause()}>
        <Pause size={15} /> PAUSE
      </button>
      <button className="btn" onClick={() => void props.onStop()}>
        <Square size={15} /> STOP
      </button>
      <button className="btn" onClick={() => void props.onStep()}>
        <StepForward size={15} /> STEP
      </button>
      <button className="btn" onClick={() => void props.onRestart()}>
        <RotateCcw size={15} /> RESTART
      </button>

      <div className="mx-2 h-6 w-px bg-slate-700" />

      <label className="text-xs">
        Repeat
        <select
          className="input ml-2 inline-flex w-32"
          value={loopConfig.mode}
          onChange={(event) => setLoopConfig({ mode: event.target.value as never })}
        >
          <option value="once">Once</option>
          <option value="count">N times</option>
          <option value="infinite">Infinite</option>
        </select>
      </label>

      {loopConfig.mode === 'count' ? (
        <label className="text-xs">
          Count
          <input
            className="input ml-2 inline-flex w-20"
            type="number"
            min={1}
            value={loopConfig.count}
            onChange={(event) => setLoopConfig({ count: Number(event.target.value) })}
          />
        </label>
      ) : null}

      <label className="text-xs">
        Delay Between Iterations (ms)
        <input
          className="input ml-2 inline-flex w-28"
          type="number"
          min={0}
          value={loopConfig.delayBetweenIterationsMs}
          onChange={(event) => setLoopConfig({ delayBetweenIterationsMs: Number(event.target.value) })}
        />
      </label>

      <span className="ml-auto rounded bg-slate-700 px-2 py-1 text-xs uppercase">State: {executionState}</span>
    </section>
  );
}
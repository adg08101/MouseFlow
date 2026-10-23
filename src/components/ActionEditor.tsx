import type { ChangeEvent } from 'react';
import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';

export function ActionEditor(): JSX.Element {
  const actions = useAppStore((state) => state.actions);
  const selectedActionId = useAppStore((state) => state.selectedActionId);
  const updateAction = useAppStore((state) => state.updateAction);

  const action = useMemo(() => actions.find((item) => item.id === selectedActionId) ?? null, [actions, selectedActionId]);

  const updateNumber = (key: string) => (event: ChangeEvent<HTMLInputElement>) => {
    if (!action) {
      return;
    }
    updateAction(action.id, { [key]: Number(event.target.value) } as never);
  };

  if (!action) {
    return (
      <section className="panel h-full min-h-0 overflow-y-auto p-3">
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Action Configuration</h2>
        <p className="text-sm text-slate-400">Select an action in the sequence to edit its parameters.</p>
      </section>
    );
  }

  return (
    <section className="panel h-full min-h-0 space-y-3 overflow-y-auto p-3">
      <h2 className="text-sm font-semibold text-slate-300">Action Configuration</h2>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={action.enabled}
          onChange={(event) => updateAction(action.id, { enabled: event.target.checked })}
        />
        Enabled
      </label>

      {action.type === 'move' ? (
        <>
          <label className="block text-xs text-slate-300">
            Direction
            <select
              className="input mt-1"
              value={action.direction}
              onChange={(event) => updateAction(action.id, { direction: event.target.value as never })}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="absolute">Absolute</option>
              <option value="relative">Relative</option>
            </select>
          </label>
          {action.direction === 'absolute' || action.direction === 'relative' ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-300">
                X
                <input className="input mt-1" type="number" value={action.x ?? 0} onChange={updateNumber('x')} />
              </label>
              <label className="text-xs text-slate-300">
                Y
                <input className="input mt-1" type="number" value={action.y ?? 0} onChange={updateNumber('y')} />
              </label>
            </div>
          ) : (
            <label className="text-xs text-slate-300">
              Distance (px)
              <input className="input mt-1" type="number" min={0} value={action.distance ?? 0} onChange={updateNumber('distance')} />
            </label>
          )}
          <label className="text-xs text-slate-300">
            Duration (ms)
            <input className="input mt-1" type="number" min={0} value={action.durationMs} onChange={updateNumber('durationMs')} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={action.smooth}
              onChange={(event) => updateAction(action.id, { smooth: event.target.checked })}
            />
            Smooth movement
          </label>
          <label className="text-xs text-slate-300">
            Speed (steps/second)
            <input className="input mt-1" type="number" min={1} value={action.speed ?? 60} onChange={updateNumber('speed')} />
          </label>
        </>
      ) : null}

      {action.type === 'scroll' ? (
        <>
          <label className="block text-xs text-slate-300">
            Direction
            <select
              className="input mt-1"
              value={action.direction}
              onChange={(event) => updateAction(action.id, { direction: event.target.value as never })}
            >
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className="text-xs text-slate-300">
            Amount
            <input className="input mt-1" type="number" min={1} value={action.amount} onChange={updateNumber('amount')} />
          </label>
          <label className="block text-xs text-slate-300">
            Unit
            <select
              className="input mt-1"
              value={action.amountUnit}
              onChange={(event) => updateAction(action.id, { amountUnit: event.target.value as never })}
            >
              <option value="wheel">Wheel Unit</option>
              <option value="pixel">Pixel (best effort)</option>
            </select>
          </label>
          <label className="text-xs text-slate-300">
            Repeat
            <input className="input mt-1" type="number" min={1} value={action.repeat} onChange={updateNumber('repeat')} />
          </label>
          <label className="text-xs text-slate-300">
            Duration (ms)
            <input className="input mt-1" type="number" min={0} value={action.durationMs} onChange={updateNumber('durationMs')} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={action.smooth}
              onChange={(event) => updateAction(action.id, { smooth: event.target.checked })}
            />
            Smooth scrolling
          </label>
        </>
      ) : null}

      {action.type === 'click' ? (
        <>
          <label className="block text-xs text-slate-300">
            Click Type
            <select
              className="input mt-1"
              value={action.clickType}
              onChange={(event) => updateAction(action.id, { clickType: event.target.value as never })}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="middle">Middle</option>
              <option value="double">Double</option>
              <option value="press">Press</option>
              <option value="release">Release</option>
            </select>
          </label>
          <label className="text-xs text-slate-300">
            Delay (ms)
            <input className="input mt-1" type="number" min={0} value={action.delayMs} onChange={updateNumber('delayMs')} />
          </label>
        </>
      ) : null}

      {action.type === 'wait' ? (
        <label className="text-xs text-slate-300">
          Wait Duration (ms)
          <input className="input mt-1" type="number" min={0} value={action.durationMs} onChange={updateNumber('durationMs')} />
        </label>
      ) : null}
    </section>
  );
}
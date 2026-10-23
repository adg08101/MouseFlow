import { Crosshair } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CursorInfo } from '../../shared/types';
import { useAppStore } from '../store/useAppStore';

export function CursorTracker(props: { onCapture: (x: number, y: number) => void }): JSX.Element {
  const [info, setInfo] = useState<CursorInfo | null>(null);
  const executionState = useAppStore((state) => state.executionState);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const next = await window.mouseflow.getCursorInfo();
        if (active) {
          setInfo(next);
        }
      } catch {
        if (active) {
          setInfo(null);
        }
      }
    };
    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, 150);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <section className="panel p-3">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
        <Crosshair size={15} /> Cursor Tracker
      </h3>
      {!info ? (
        <p className="text-xs text-slate-400">Cursor information unavailable.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
          <div>X: {info.x}</div>
          <div>Y: {info.y}</div>
          <div>Monitor: {info.activeDisplayLabel}</div>
          <div>
            Size: {info.displayBounds.width} x {info.displayBounds.height}
          </div>
          <div className="col-span-2">State: {executionState}</div>
          <button className="btn col-span-2" onClick={() => props.onCapture(info.x, info.y)}>
            Capture Current Position
          </button>
        </div>
      )}
    </section>
  );
}
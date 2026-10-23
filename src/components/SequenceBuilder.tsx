import { Copy, GripVertical, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { describeAction } from '../utils/actions';

export function SequenceBuilder(): JSX.Element {
  const actions = useAppStore((state) => state.actions);
  const selectedActionId = useAppStore((state) => state.selectedActionId);
  const setSelectedActionId = useAppStore((state) => state.setSelectedActionId);
  const deleteAction = useAppStore((state) => state.deleteAction);
  const duplicateAction = useAppStore((state) => state.duplicateAction);
  const reorderActions = useAppStore((state) => state.reorderActions);
  const progress = useAppStore((state) => state.progress);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const activeActionId = useMemo(() => actions[progress.currentActionIndex]?.id, [actions, progress.currentActionIndex]);

  return (
    <section className="panel flex h-full flex-col p-3">
      <h2 className="mb-3 text-sm font-semibold text-slate-300">Sequence Builder</h2>
      <div className="space-y-2 overflow-y-auto pr-1">
        {actions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-600 p-4 text-sm text-slate-400">
            Add actions from the sidebar to start building a sequence.
          </div>
        ) : null}
        {actions.map((action, index) => {
          const selected = selectedActionId === action.id;
          const running = activeActionId === action.id;

          return (
            <article
              key={action.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== index) {
                  reorderActions(dragIndex, index);
                }
                setDragIndex(null);
              }}
              onClick={() => setSelectedActionId(action.id)}
              className={`rounded-lg border p-3 transition ${
                selected ? 'border-accent bg-accent/10' : 'border-slate-700 bg-panel-700/60'
              } ${running ? 'ring-2 ring-emerald-400/70' : ''}`}
            >
              <header className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <GripVertical size={14} className="text-slate-500" />
                  <span>Step {index + 1}</span>
                  <span className="rounded bg-slate-700 px-2 py-0.5 text-xs uppercase">{action.type}</span>
                  {!action.enabled ? <span className="text-xs text-amber-300">Disabled</span> : null}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="btn px-2 py-1"
                    onClick={(event) => {
                      event.stopPropagation();
                      duplicateAction(action.id);
                    }}
                    title="Duplicate action"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="btn px-2 py-1"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteAction(action.id);
                    }}
                    title="Delete action"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </header>
              <p className="mt-2 text-sm text-slate-300">{describeAction(action)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
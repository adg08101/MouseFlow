import { MousePointer2, Move, ScrollText, Timer, Mouse } from 'lucide-react';
import { createClickAction, createMoveAction, createScrollAction, createWaitAction } from '../utils/actions';
import { useAppStore } from '../store/useAppStore';

const groups = [
  {
    title: 'Cursor Movement',
    icon: Move,
    items: [
      { label: 'Move Left', add: () => createMoveAction('left') },
      { label: 'Move Right', add: () => createMoveAction('right') },
      { label: 'Move Up', add: () => createMoveAction('up') },
      { label: 'Move Down', add: () => createMoveAction('down') },
      { label: 'Move Absolute', add: () => createMoveAction('absolute') },
      { label: 'Move Relative', add: () => createMoveAction('relative') }
    ]
  },
  {
    title: 'Scrolling',
    icon: ScrollText,
    items: [
      { label: 'Scroll Up', add: () => createScrollAction('up') },
      { label: 'Scroll Down', add: () => createScrollAction('down') },
      { label: 'Scroll Left', add: () => createScrollAction('left') },
      { label: 'Scroll Right', add: () => createScrollAction('right') }
    ]
  },
  {
    title: 'Mouse Clicks',
    icon: Mouse,
    items: [
      { label: 'Left Click', add: () => createClickAction('left') },
      { label: 'Right Click', add: () => createClickAction('right') },
      { label: 'Middle Click', add: () => createClickAction('middle') },
      { label: 'Double Click', add: () => createClickAction('double') },
      { label: 'Press Button', add: () => createClickAction('press') },
      { label: 'Release Button', add: () => createClickAction('release') }
    ]
  },
  {
    title: 'Timing',
    icon: Timer,
    items: [{ label: 'Wait / Delay', add: () => createWaitAction(1000) }]
  }
];

export function ActionSidebar(): JSX.Element {
  const addAction = useAppStore((state) => state.addAction);

  return (
    <aside className="panel flex h-full min-h-0 flex-col p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
        <MousePointer2 size={16} /> Actions
      </div>
      <div className="space-y-4 overflow-y-auto pr-1">
        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <section key={group.title} className="space-y-2">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Icon size={14} /> {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button key={item.label} className="btn w-full justify-start" onClick={() => addAction(item.add())}>
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
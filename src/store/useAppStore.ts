import { create } from "zustand";
import type {
  AutomationAction,
  EngineLog,
  ExecutionProgress,
  ExecutionState,
  LoopConfig,
  Sequence,
} from "../../shared/types";

interface AppState {
  actions: AutomationAction[];
  selectedActionId: string | null;
  sequences: Sequence[];
  selectedSequenceId: string | null;
  loopConfig: LoopConfig;
  executionState: ExecutionState;
  progress: ExecutionProgress;
  logs: EngineLog[];
  theme: "dark" | "light";
  setActions: (actions: AutomationAction[]) => void;
  addAction: (action: AutomationAction) => void;
  updateAction: (id: string, patch: Partial<AutomationAction>) => void;
  deleteAction: (id: string) => void;
  duplicateAction: (id: string) => void;
  reorderActions: (from: number, to: number) => void;
  setSelectedActionId: (id: string | null) => void;
  setSequences: (sequences: Sequence[]) => void;
  setSelectedSequenceId: (id: string | null) => void;
  setLoopConfig: (loopConfig: Partial<LoopConfig>) => void;
  setExecutionState: (state: ExecutionState) => void;
  setProgress: (progress: ExecutionProgress) => void;
  addLog: (log: EngineLog) => void;
  clearLogs: () => void;
  setTheme: (theme: "dark" | "light") => void;
}

const initialProgress: ExecutionProgress = {
  state: "idle",
  currentActionIndex: 0,
  currentIteration: 0,
  totalIterations: 1,
  actionsExecuted: 0,
  elapsedMs: 0,
};

export const useAppStore = create<AppState>((set, get) => ({
  actions: [],
  selectedActionId: null,
  sequences: [],
  selectedSequenceId: null,
  loopConfig: {
    mode: "once",
    count: 1,
    delayBetweenIterationsMs: 0,
  },
  executionState: "idle",
  progress: initialProgress,
  logs: [],
  theme: "dark",
  setActions: (actions) => set({ actions }),
  addAction: (action) =>
    set({ actions: [...get().actions, action], selectedActionId: action.id }),
  updateAction: (id, patch) =>
    set({
      actions: get().actions.map((action) =>
        action.id === id
          ? ({ ...action, ...patch } as AutomationAction)
          : action,
      ),
    }),
  deleteAction: (id) =>
    set({
      actions: get().actions.filter((action) => action.id !== id),
      selectedActionId:
        get().selectedActionId === id ? null : get().selectedActionId,
    }),
  duplicateAction: (id) => {
    const actions = get().actions;
    const index = actions.findIndex((item) => item.id === id);
    if (index < 0) {
      return;
    }
    const clone: AutomationAction = {
      ...actions[index],
      id: crypto.randomUUID(),
    };
    const next = [...actions];
    next.splice(index + 1, 0, clone);
    set({ actions: next, selectedActionId: clone.id });
  },
  reorderActions: (from, to) => {
    const next = [...get().actions];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    set({ actions: next });
  },
  setSelectedActionId: (id) => set({ selectedActionId: id }),
  setSequences: (sequences) => set({ sequences }),
  setSelectedSequenceId: (id) => set({ selectedSequenceId: id }),
  setLoopConfig: (loopConfig) =>
    set({ loopConfig: { ...get().loopConfig, ...loopConfig } }),
  setExecutionState: (state) => set({ executionState: state }),
  setProgress: (progress) => set({ progress }),
  addLog: (log) => set({ logs: [log, ...get().logs].slice(0, 300) }),
  clearLogs: () => set({ logs: [] }),
  setTheme: (theme) => set({ theme }),
}));

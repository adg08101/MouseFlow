export type ExecutionState =
  | "idle"
  | "running"
  | "paused"
  | "stopping"
  | "completed"
  | "failed";

export type ActionCategory =
  | "movement"
  | "scroll"
  | "click"
  | "timing"
  | "control";

export type MoveDirection =
  | "left"
  | "right"
  | "up"
  | "down"
  | "absolute"
  | "relative";
export type ScrollDirection = "up" | "down" | "left" | "right";
export type ClickType =
  | "left"
  | "right"
  | "middle"
  | "double"
  | "press"
  | "release";

export interface BaseAction {
  id: string;
  enabled: boolean;
  label?: string;
}

export interface MoveAction extends BaseAction {
  type: "move";
  direction: MoveDirection;
  distance?: number;
  x?: number;
  y?: number;
  durationMs: number;
  smooth: boolean;
  speed?: number;
}

export interface ScrollAction extends BaseAction {
  type: "scroll";
  direction: ScrollDirection;
  amount: number;
  amountUnit: "wheel" | "pixel";
  durationMs: number;
  smooth: boolean;
  repeat: number;
}

export interface ClickAction extends BaseAction {
  type: "click";
  clickType: ClickType;
  delayMs: number;
}

export interface WaitAction extends BaseAction {
  type: "wait";
  durationMs: number;
}

export type AutomationAction =
  | MoveAction
  | ScrollAction
  | ClickAction
  | WaitAction;

export interface Sequence {
  id: string;
  name: string;
  actions: AutomationAction[];
  createdAt: string;
  updatedAt: string;
}

export interface LoopConfig {
  mode: "once" | "count" | "infinite";
  count: number;
  delayBetweenIterationsMs: number;
}

export interface RunConfig {
  loop: LoopConfig;
  startIndex?: number;
  stepMode?: boolean;
}

export interface ExecutionProgress {
  state: ExecutionState;
  currentActionIndex: number;
  currentIteration: number;
  totalIterations: number | "infinite";
  actionsExecuted: number;
  elapsedMs: number;
  message?: string;
}

export interface CursorInfo {
  x: number;
  y: number;
  activeDisplayId?: number;
  activeDisplayLabel: string;
  displayBounds: { x: number; y: number; width: number; height: number };
  virtualBounds: { x: number; y: number; width: number; height: number };
}

export interface UiPreferences {
  theme: "dark" | "light";
  emergencyShortcut: string;
}

export interface EngineLog {
  level: "info" | "warn" | "error";
  message: string;
  timestamp: string;
}

export interface AutomationEvent {
  kind: "progress" | "log" | "state";
  progress?: ExecutionProgress;
  log?: EngineLog;
  state?: ExecutionState;
}

export interface HotkeySettings {
  playPause: string;
  pause: string;
  stop: string;
  step: string;
  saveSequence: string;
  emergencyStop: string;
}

export interface SaveSequenceInput {
  name: string;
  actions: AutomationAction[];
  id?: string;
}

export interface MouseFlowApi {
  getCursorInfo: () => Promise<CursorInfo>;
  getDisplays: () => Promise<
    Array<{
      id: number;
      bounds: { x: number; y: number; width: number; height: number };
    }>
  >;
  runSequence: (
    actions: AutomationAction[],
    config: RunConfig,
  ) => Promise<void>;
  pauseSequence: () => Promise<void>;
  resumeSequence: () => Promise<void>;
  stopSequence: () => Promise<void>;
  stepSequence: (
    actions: AutomationAction[],
    config: RunConfig,
  ) => Promise<void>;
  restartSequence: (
    actions: AutomationAction[],
    config: RunConfig,
  ) => Promise<void>;
  onAutomationEvent: (callback: (event: AutomationEvent) => void) => () => void;
  loadSequences: () => Promise<Sequence[]>;
  saveSequence: (input: SaveSequenceInput) => Promise<Sequence>;
  deleteSequence: (id: string) => Promise<void>;
  renameSequence: (id: string, name: string) => Promise<Sequence>;
  exportSequence: (id: string, targetPath: string) => Promise<void>;
  importSequence: (sourcePath: string) => Promise<Sequence>;
  getPreferences: () => Promise<UiPreferences>;
  setPreferences: (
    preferences: Partial<UiPreferences>,
  ) => Promise<UiPreferences>;
  getHotkeySettings: () => Promise<HotkeySettings>;
  setHotkeySettings: (
    settings: Partial<HotkeySettings>,
  ) => Promise<HotkeySettings>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

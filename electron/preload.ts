import { contextBridge, ipcRenderer } from "electron";
import type {
  AutomationAction,
  AutomationEvent,
  HotkeySettings,
  MouseFlowApi,
  RunConfig,
  SaveSequenceInput,
  UiPreferences,
} from "../shared/types.js";

const api: MouseFlowApi = {
  getCursorInfo: () => ipcRenderer.invoke("mouseflow:get-cursor-info"),
  getDisplays: () => ipcRenderer.invoke("mouseflow:get-displays"),
  runSequence: (actions: AutomationAction[], config: RunConfig) =>
    ipcRenderer.invoke("mouseflow:run-sequence", actions, config),
  pauseSequence: () => ipcRenderer.invoke("mouseflow:pause-sequence"),
  resumeSequence: () => ipcRenderer.invoke("mouseflow:resume-sequence"),
  stopSequence: () => ipcRenderer.invoke("mouseflow:stop-sequence"),
  stepSequence: (actions: AutomationAction[], config: RunConfig) =>
    ipcRenderer.invoke("mouseflow:step-sequence", actions, config),
  restartSequence: (actions: AutomationAction[], config: RunConfig) =>
    ipcRenderer.invoke("mouseflow:restart-sequence", actions, config),
  onAutomationEvent: (callback: (event: AutomationEvent) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      payload: AutomationEvent,
    ) => callback(payload);
    ipcRenderer.on("mouseflow:event", listener);
    return () => ipcRenderer.removeListener("mouseflow:event", listener);
  },
  loadSequences: () => ipcRenderer.invoke("mouseflow:load-sequences"),
  saveSequence: (input: SaveSequenceInput) =>
    ipcRenderer.invoke("mouseflow:save-sequence", input),
  deleteSequence: (id: string) =>
    ipcRenderer.invoke("mouseflow:delete-sequence", id),
  renameSequence: (id: string, name: string) =>
    ipcRenderer.invoke("mouseflow:rename-sequence", id, name),
  exportSequence: (id: string, targetPath: string) =>
    ipcRenderer.invoke("mouseflow:export-sequence", id, targetPath),
  importSequence: (sourcePath: string) =>
    ipcRenderer.invoke("mouseflow:import-sequence", sourcePath),
  getPreferences: () => ipcRenderer.invoke("mouseflow:get-preferences"),
  setPreferences: (preferences: Partial<UiPreferences>) =>
    ipcRenderer.invoke("mouseflow:set-preferences", preferences),
  getHotkeySettings: () => ipcRenderer.invoke("mouseflow:get-hotkeys"),
  setHotkeySettings: (settings: Partial<HotkeySettings>) =>
    ipcRenderer.invoke("mouseflow:set-hotkeys", settings),
};

contextBridge.exposeInMainWorld("mouseflow", api);

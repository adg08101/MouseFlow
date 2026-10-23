import { ipcMain, screen, type BrowserWindow } from "electron";
import type { AutomationAction, RunConfig } from "../../shared/types.js";
import { validateAction } from "../../shared/validation.js";
import { AutomationEngine } from "../services/AutomationEngine.js";
import { MouseController } from "../services/MouseController.js";
import { SequenceManager } from "../services/SequenceManager.js";

const validateActions = (actions: AutomationAction[]): void => {
  if (!Array.isArray(actions)) {
    throw new Error("Actions must be an array.");
  }
  actions.forEach((action) => {
    const result = validateAction(action);
    if (!result.valid) {
      throw new Error(result.errors.join(" "));
    }
  });
};

export function registerHandlers(window: BrowserWindow): {
  engine: AutomationEngine;
  mouseController: MouseController;
  sequenceManager: SequenceManager;
} {
  const mouseController = new MouseController();
  const sequenceManager = new SequenceManager();
  const engine = new AutomationEngine(mouseController, (event) => {
    window.webContents.send("mouseflow:event", event);
  });

  ipcMain.handle("mouseflow:get-cursor-info", async () =>
    mouseController.getCursorInfo(),
  );
  ipcMain.handle("mouseflow:get-displays", async () =>
    screen
      .getAllDisplays()
      .map((display) => ({ id: display.id, bounds: display.bounds })),
  );

  ipcMain.handle(
    "mouseflow:run-sequence",
    async (_, actions: AutomationAction[], config: RunConfig) => {
      validateActions(actions);
      await engine.run(actions, config);
    },
  );

  ipcMain.handle("mouseflow:pause-sequence", async () => {
    engine.pause();
  });

  ipcMain.handle("mouseflow:resume-sequence", async () => {
    engine.resume();
  });

  ipcMain.handle("mouseflow:stop-sequence", async () => {
    await engine.stop();
  });

  ipcMain.handle(
    "mouseflow:step-sequence",
    async (_, actions: AutomationAction[], config: RunConfig) => {
      validateActions(actions);
      await engine.run(actions, { ...config, stepMode: true });
    },
  );

  ipcMain.handle(
    "mouseflow:restart-sequence",
    async (_, actions: AutomationAction[], config: RunConfig) => {
      validateActions(actions);
      await engine.stop();
      await engine.run(actions, { ...config, startIndex: 0 });
    },
  );

  ipcMain.handle("mouseflow:load-sequences", async () =>
    sequenceManager.loadSequences(),
  );
  ipcMain.handle("mouseflow:save-sequence", async (_, input) =>
    sequenceManager.saveSequence(input),
  );
  ipcMain.handle("mouseflow:delete-sequence", async (_, id: string) =>
    sequenceManager.deleteSequence(id),
  );
  ipcMain.handle(
    "mouseflow:rename-sequence",
    async (_, id: string, name: string) =>
      sequenceManager.renameSequence(id, name),
  );
  ipcMain.handle(
    "mouseflow:export-sequence",
    async (_, id: string, targetPath: string) =>
      sequenceManager.exportSequence(id, targetPath),
  );
  ipcMain.handle("mouseflow:import-sequence", async (_, sourcePath: string) =>
    sequenceManager.importSequence(sourcePath),
  );
  ipcMain.handle("mouseflow:get-preferences", async () =>
    sequenceManager.getPreferences(),
  );
  ipcMain.handle("mouseflow:set-preferences", async (_, preferences) =>
    sequenceManager.setPreferences(preferences),
  );
  ipcMain.handle("mouseflow:get-hotkeys", async () =>
    sequenceManager.getHotkeySettings(),
  );
  ipcMain.handle("mouseflow:set-hotkeys", async (_, hotkeys) =>
    sequenceManager.setHotkeySettings(hotkeys),
  );

  return { engine, mouseController, sequenceManager };
}

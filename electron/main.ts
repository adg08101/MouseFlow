import { app, BrowserWindow } from "electron";
import path from "node:path";
import { registerHandlers } from "./ipc/registerHandlers.js";
import { HotkeyManager } from "./services/HotkeyManager.js";

let mainWindow: BrowserWindow | null = null;
const hotkeyManager = new HotkeyManager();

const createWindow = async (): Promise<void> => {
  const preloadPath = path.join(
    app.getAppPath(),
    "dist-electron",
    "electron",
    "preload.js",
  );

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: "#0f1115",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.webContents.on(
    "preload-error",
    (_event, preloadPathValue, error) => {
      console.error("Preload failed to execute", {
        preloadPath: preloadPathValue,
        error,
      });
    },
  );

  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription) => {
      console.error("Renderer failed to load", { errorCode, errorDescription });
    },
  );

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("Renderer process gone", details);
  });

  const { engine, mouseController, sequenceManager } =
    registerHandlers(mainWindow);
  await mouseController.init();

  const hotkeys = sequenceManager.getHotkeySettings();
  const failed = hotkeyManager.register(hotkeys, {
    playPause: () => {
      const state = engine.getState();
      if (state === "paused") {
        engine.resume();
      }
    },
    pause: () => engine.pause(),
    stop: () => {
      void engine.stop();
    },
    step: () => {
      mainWindow?.webContents.send("mouseflow:event", {
        kind: "log",
        log: {
          level: "info",
          message:
            "Use STEP button with current sequence to execute next action.",
          timestamp: new Date().toISOString(),
        },
      });
    },
    emergencyStop: () => {
      void engine.stop();
    },
  });

  if (failed.length) {
    mainWindow.webContents.once("did-finish-load", () => {
      mainWindow?.webContents.send("mouseflow:event", {
        kind: "log",
        log: {
          level: "warn",
          message: `Failed to register shortcuts: ${failed.join(", ")}`,
          timestamp: new Date().toISOString(),
        },
      });
    });
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadFile(
      path.join(app.getAppPath(), "dist", "index.html"),
    );
  }
};

app.whenReady().then(() => {
  createWindow().catch((error) => {
    console.error("Failed to create main window", error);
  });
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((error) => {
        console.error("Failed to recreate main window", error);
      });
    }
  });
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception in main process", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection in main process", reason);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  hotkeyManager.unregisterAll();
});

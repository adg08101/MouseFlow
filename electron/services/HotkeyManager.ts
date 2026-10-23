import { app, globalShortcut } from "electron";
import type { HotkeySettings } from "../../shared/types.js";

type HotkeyHandlers = {
  playPause: () => void;
  pause: () => void;
  stop: () => void;
  step: () => void;
  emergencyStop: () => void;
};

export class HotkeyManager {
  private registered = false;

  register(settings: HotkeySettings, handlers: HotkeyHandlers): string[] {
    if (!app.isReady()) {
      throw new Error("App is not ready yet for global shortcuts.");
    }

    globalShortcut.unregisterAll();
    const failed: string[] = [];

    const pairs: Array<[string, () => void]> = [
      [settings.playPause, handlers.playPause],
      [settings.pause, handlers.pause],
      [settings.stop, handlers.stop],
      [settings.step, handlers.step],
      [settings.emergencyStop, handlers.emergencyStop],
    ];

    for (const [shortcut, callback] of pairs) {
      const ok = globalShortcut.register(shortcut, callback);
      if (!ok) {
        failed.push(shortcut);
      }
    }

    this.registered = true;
    return failed;
  }

  unregisterAll(): void {
    if (!this.registered) {
      return;
    }
    globalShortcut.unregisterAll();
    this.registered = false;
  }
}

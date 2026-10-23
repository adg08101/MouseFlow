import Store from "electron-store";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  HotkeySettings,
  SaveSequenceInput,
  Sequence,
  UiPreferences,
} from "../../shared/types.js";
import { validateSequenceInput } from "../../shared/validation.js";

interface StoreShape {
  sequences: Sequence[];
  lastSelectedSequenceId: string | null;
  preferences: UiPreferences;
  hotkeys: HotkeySettings;
}

const defaultPreferences: UiPreferences = {
  theme: "dark",
  emergencyShortcut: "CommandOrControl+Shift+F8",
};

const defaultHotkeys: HotkeySettings = {
  playPause: "F6",
  pause: "F7",
  stop: "F8",
  step: "F9",
  saveSequence: "CommandOrControl+S",
  emergencyStop: "CommandOrControl+Shift+F8",
};

export class SequenceManager {
  private readonly store = new Store<StoreShape>({
    defaults: {
      sequences: [],
      lastSelectedSequenceId: null,
      preferences: defaultPreferences,
      hotkeys: defaultHotkeys,
    },
  });

  loadSequences(): Sequence[] {
    return this.store.get("sequences", []);
  }

  saveSequence(input: SaveSequenceInput): Sequence {
    const validation = validateSequenceInput(input);
    if (!validation.valid) {
      throw new Error(validation.errors.join(" "));
    }

    const now = new Date().toISOString();
    const current = this.loadSequences();

    if (input.id) {
      const index = current.findIndex((item) => item.id === input.id);
      if (index === -1) {
        throw new Error("Sequence not found.");
      }
      const updated: Sequence = {
        ...current[index],
        name: input.name,
        actions: input.actions,
        updatedAt: now,
      };
      current[index] = updated;
      this.store.set("sequences", current);
      this.store.set("lastSelectedSequenceId", updated.id);
      return updated;
    }

    const created: Sequence = {
      id: randomUUID(),
      name: input.name,
      actions: input.actions,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set("sequences", [...current, created]);
    this.store.set("lastSelectedSequenceId", created.id);
    return created;
  }

  renameSequence(id: string, name: string): Sequence {
    const sequences = this.loadSequences();
    const index = sequences.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error("Sequence not found.");
    }
    sequences[index] = {
      ...sequences[index],
      name: name.trim(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set("sequences", sequences);
    return sequences[index];
  }

  deleteSequence(id: string): void {
    const sequences = this.loadSequences().filter((item) => item.id !== id);
    this.store.set("sequences", sequences);
    if (this.store.get("lastSelectedSequenceId") === id) {
      this.store.set("lastSelectedSequenceId", sequences[0]?.id ?? null);
    }
  }

  async exportSequence(id: string, targetPath: string): Promise<void> {
    const sequence = this.loadSequences().find((item) => item.id === id);
    if (!sequence) {
      throw new Error("Sequence not found.");
    }
    const payload = JSON.stringify(sequence, null, 2);
    await fs.writeFile(path.resolve(targetPath), payload, "utf8");
  }

  async importSequence(sourcePath: string): Promise<Sequence> {
    const raw = await fs.readFile(path.resolve(sourcePath), "utf8");
    const parsed = JSON.parse(raw) as Sequence;
    const result = validateSequenceInput({
      name: parsed.name,
      actions: parsed.actions,
    });
    if (!result.valid) {
      throw new Error(`Invalid sequence file: ${result.errors.join(" ")}`);
    }
    const imported = this.saveSequence({
      name: parsed.name,
      actions: parsed.actions,
    });
    return imported;
  }

  getPreferences(): UiPreferences {
    return this.store.get("preferences", defaultPreferences);
  }

  setPreferences(partial: Partial<UiPreferences>): UiPreferences {
    const merged = { ...this.getPreferences(), ...partial };
    this.store.set("preferences", merged);
    return merged;
  }

  getHotkeySettings(): HotkeySettings {
    return this.store.get("hotkeys", defaultHotkeys);
  }

  setHotkeySettings(partial: Partial<HotkeySettings>): HotkeySettings {
    const merged = { ...this.getHotkeySettings(), ...partial };
    this.store.set("hotkeys", merged);
    return merged;
  }
}

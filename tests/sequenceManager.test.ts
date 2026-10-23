import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const memory = new Map<string, unknown>();

vi.mock("electron-store", () => {
  class MockStore<T extends Record<string, unknown>> {
    private defaults: T;
    constructor(options: { defaults: T }) {
      this.defaults = options.defaults;
      Object.entries(this.defaults).forEach(([key, value]) => {
        if (!memory.has(key)) {
          memory.set(key, value);
        }
      });
    }
    get<K extends keyof T>(key: K, fallback?: T[K]): T[K] {
      return (memory.get(String(key)) as T[K]) ?? (fallback as T[K]);
    }
    set<K extends keyof T>(key: K, value: T[K]): void {
      memory.set(String(key), value);
    }
  }
  return { default: MockStore };
});

describe("SequenceManager import/export", () => {
  beforeEach(() => {
    memory.clear();
  });

  it("exports and imports sequence JSON with validation", async () => {
    const { SequenceManager } =
      await import("../electron/services/SequenceManager");
    const manager = new SequenceManager();

    const saved = manager.saveSequence({
      name: "My Sequence",
      actions: [{ id: "w", enabled: true, type: "wait", durationMs: 300 }],
    });

    const file = path.join(os.tmpdir(), `mouseflow-seq-${Date.now()}.json`);
    await manager.exportSequence(saved.id, file);

    const raw = await fs.readFile(file, "utf8");
    expect(raw).toContain("My Sequence");

    const imported = await manager.importSequence(file);
    expect(imported.name).toBe("My Sequence");
    expect(manager.loadSequences().length).toBe(2);
  });
});

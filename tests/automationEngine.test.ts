import { describe, expect, it } from "vitest";
import type { AutomationAction, AutomationEvent } from "../shared/types";
import { AutomationEngine } from "../electron/services/AutomationEngine";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createMockController(opts?: {
  failOnType?: AutomationAction["type"];
}) {
  const calls: string[] = [];
  return {
    calls,
    controller: {
      move: async () => {
        calls.push("move");
      },
      scroll: async () => {
        calls.push("scroll");
      },
      click: async (action: { type: string }) => {
        calls.push("click");
        if (opts?.failOnType === action.type) {
          throw new Error("Injected click failure");
        }
      },
      releaseAllButtons: async () => {
        calls.push("release");
      },
    },
  };
}

describe("AutomationEngine", () => {
  it("executes actions in sequence order", async () => {
    const mock = createMockController();
    const events: AutomationEvent[] = [];
    const engine = new AutomationEngine(mock.controller as never, (event) =>
      events.push(event),
    );

    await engine.run(
      [
        {
          id: "1",
          enabled: true,
          type: "move",
          direction: "right",
          distance: 10,
          durationMs: 0,
          smooth: false,
        },
        {
          id: "2",
          enabled: true,
          type: "scroll",
          direction: "down",
          amount: 100,
          amountUnit: "wheel",
          durationMs: 0,
          smooth: false,
          repeat: 1,
        },
        {
          id: "3",
          enabled: true,
          type: "click",
          clickType: "left",
          delayMs: 0,
        },
      ],
      { loop: { mode: "once", count: 1, delayBetweenIterationsMs: 0 } },
    );

    expect(mock.calls.slice(0, 3)).toEqual(["move", "scroll", "click"]);
    expect(
      events.some(
        (event) => event.kind === "state" && event.state === "completed",
      ),
    ).toBe(true);
  });

  it("supports pause and resume", async () => {
    const mock = createMockController();
    const events: AutomationEvent[] = [];
    const engine = new AutomationEngine(mock.controller as never, (event) =>
      events.push(event),
    );

    const runPromise = engine.run(
      [
        { id: "w1", enabled: true, type: "wait", durationMs: 250 },
        { id: "w2", enabled: true, type: "wait", durationMs: 250 },
      ],
      { loop: { mode: "once", count: 1, delayBetweenIterationsMs: 0 } },
    );

    await wait(40);
    engine.pause();
    await wait(80);
    engine.resume();
    await runPromise;

    const states = events
      .filter((event) => event.kind === "state")
      .map((event) => event.state);
    expect(states).toContain("paused");
    expect(states).toContain("running");
  });

  it("stops during wait delays", async () => {
    const mock = createMockController();
    const engine = new AutomationEngine(
      mock.controller as never,
      () => undefined,
    );

    const runPromise = engine.run(
      [{ id: "wait", enabled: true, type: "wait", durationMs: 2000 }],
      { loop: { mode: "once", count: 1, delayBetweenIterationsMs: 0 } },
    );
    await wait(50);
    await engine.stop();

    await expect(runPromise).rejects.toThrow();
  });

  it("stops during repeated execution loops", async () => {
    const mock = createMockController();
    const progress: number[] = [];
    const engine = new AutomationEngine(mock.controller as never, (event) => {
      if (event.kind === "progress" && event.progress) {
        progress.push(event.progress.actionsExecuted);
      }
    });

    const runPromise = engine.run(
      [{ id: "wait", enabled: true, type: "wait", durationMs: 100 }],
      { loop: { mode: "count", count: 100, delayBetweenIterationsMs: 10 } },
    );

    await wait(180);
    await engine.stop();
    await expect(runPromise).rejects.toThrow();
    expect(Math.max(...progress)).toBeLessThan(100);
  });

  it("prevents concurrent runs", async () => {
    const mock = createMockController();
    const engine = new AutomationEngine(
      mock.controller as never,
      () => undefined,
    );

    const p1 = engine.run(
      [{ id: "wait", enabled: true, type: "wait", durationMs: 300 }],
      { loop: { mode: "once", count: 1, delayBetweenIterationsMs: 0 } },
    );

    await expect(
      engine.run(
        [{ id: "wait2", enabled: true, type: "wait", durationMs: 10 }],
        {
          loop: { mode: "once", count: 1, delayBetweenIterationsMs: 0 },
        },
      ),
    ).rejects.toThrow("already active");

    await engine.stop();
    await expect(p1).rejects.toThrow();
  });

  it("recovers after action failure", async () => {
    const events: AutomationEvent[] = [];
    let fail = true;
    const mock = {
      move: async () => undefined,
      scroll: async () => undefined,
      click: async () => {
        if (fail) {
          fail = false;
          throw new Error("boom");
        }
      },
      releaseAllButtons: async () => undefined,
    };
    const engine = new AutomationEngine(mock as never, (event) =>
      events.push(event),
    );

    await expect(
      engine.run(
        [
          {
            id: "c1",
            enabled: true,
            type: "click",
            clickType: "left",
            delayMs: 0,
          },
        ],
        {
          loop: { mode: "once", count: 1, delayBetweenIterationsMs: 0 },
        },
      ),
    ).rejects.toThrow("boom");

    await expect(
      engine.run(
        [
          {
            id: "c1",
            enabled: true,
            type: "click",
            clickType: "left",
            delayMs: 0,
          },
        ],
        {
          loop: { mode: "once", count: 1, delayBetweenIterationsMs: 0 },
        },
      ),
    ).resolves.toBeUndefined();

    expect(
      events.some(
        (event) => event.kind === "state" && event.state === "failed",
      ),
    ).toBe(true);
  });
});

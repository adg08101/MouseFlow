import type {
  AutomationAction,
  AutomationEvent,
  ExecutionProgress,
  ExecutionState,
  RunConfig,
} from "../../shared/types.js";
import { validateAction } from "../../shared/validation.js";
import { MouseController } from "./MouseController.js";

const sleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("Operation aborted"));
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });

export class AutomationEngine {
  private state: ExecutionState = "idle";
  private currentActionIndex = 0;
  private currentIteration = 0;
  private actionsExecuted = 0;
  private startedAt = 0;
  private abortController: AbortController | null = null;
  private pausedGate: Promise<void> | null = null;
  private releasePause: (() => void) | null = null;

  constructor(
    private readonly mouseController: MouseController,
    private readonly emit: (event: AutomationEvent) => void,
  ) {}

  getState(): ExecutionState {
    return this.state;
  }

  private transition(next: ExecutionState, message?: string): void {
    this.state = next;
    this.emit({ kind: "state", state: next });
    if (message) {
      this.log("info", message);
    }
    this.emitProgress();
  }

  private log(level: "info" | "warn" | "error", message: string): void {
    this.emit({
      kind: "log",
      log: { level, message, timestamp: new Date().toISOString() },
    });
  }

  private emitProgress(totalIterations: number | "infinite" = 1): void {
    const progress: ExecutionProgress = {
      state: this.state,
      currentActionIndex: this.currentActionIndex,
      currentIteration: this.currentIteration,
      totalIterations,
      actionsExecuted: this.actionsExecuted,
      elapsedMs: this.startedAt ? Date.now() - this.startedAt : 0,
    };
    this.emit({ kind: "progress", progress });
  }

  pause(): void {
    if (this.state !== "running") {
      return;
    }
    this.pausedGate = new Promise((resolve) => {
      this.releasePause = resolve;
    });
    this.transition("paused", "Execution paused");
  }

  resume(): void {
    if (this.state !== "paused") {
      return;
    }
    this.releasePause?.();
    this.releasePause = null;
    this.pausedGate = null;
    this.transition("running", "Execution resumed");
  }

  async stop(): Promise<void> {
    if (
      this.state === "idle" ||
      this.state === "completed" ||
      this.state === "failed"
    ) {
      this.reset();
      return;
    }
    this.transition("stopping", "Stopping execution");
    this.abortController?.abort();
    this.releasePause?.();
    this.pausedGate = null;
    this.releasePause = null;
    await this.mouseController.releaseAllButtons();
    this.reset();
  }

  private reset(): void {
    this.abortController = null;
    this.currentActionIndex = 0;
    this.currentIteration = 0;
    this.actionsExecuted = 0;
    this.startedAt = 0;
    this.pausedGate = null;
    this.releasePause = null;
    this.state = "idle";
    this.emit({ kind: "state", state: "idle" });
    this.emitProgress();
  }

  private async checkpoint(signal: AbortSignal): Promise<void> {
    if (signal.aborted) {
      throw new Error("Operation aborted");
    }
    if (this.state === "paused" && this.pausedGate) {
      await this.pausedGate;
    }
    if (signal.aborted) {
      throw new Error("Operation aborted");
    }
  }

  private async executeAction(
    action: AutomationAction,
    signal: AbortSignal,
  ): Promise<void> {
    if (!action.enabled) {
      return;
    }

    const validation = validateAction(action);
    if (!validation.valid) {
      throw new Error(validation.errors.join(" "));
    }

    if (action.type === "move") {
      await this.mouseController.move(action, signal, () =>
        this.checkpoint(signal),
      );
    } else if (action.type === "scroll") {
      await this.mouseController.scroll(action, signal, () =>
        this.checkpoint(signal),
      );
    } else if (action.type === "click") {
      await this.mouseController.click(action, signal, () =>
        this.checkpoint(signal),
      );
    } else if (action.type === "wait") {
      const chunk = 25;
      let remaining = action.durationMs;
      while (remaining > 0) {
        await this.checkpoint(signal);
        const slice = Math.min(chunk, remaining);
        await sleep(slice, signal);
        remaining -= slice;
      }
    }
  }

  async run(actions: AutomationAction[], config: RunConfig): Promise<void> {
    if (
      this.state === "running" ||
      this.state === "paused" ||
      this.state === "stopping"
    ) {
      throw new Error("An automation sequence is already active.");
    }
    if (!actions.length) {
      throw new Error("No actions available to execute.");
    }

    const totalIterations =
      config.loop.mode === "once"
        ? 1
        : config.loop.mode === "count"
          ? config.loop.count
          : "infinite";

    this.abortController = new AbortController();
    this.startedAt = Date.now();
    this.actionsExecuted = 0;
    this.currentActionIndex = config.startIndex ?? 0;
    this.currentIteration = 0;
    this.transition("running", "Sequence started");

    try {
      while (
        totalIterations === "infinite" ||
        this.currentIteration < totalIterations
      ) {
        this.currentIteration += 1;
        const start = this.currentIteration === 1 ? this.currentActionIndex : 0;

        for (let index = start; index < actions.length; index += 1) {
          this.currentActionIndex = index;
          await this.checkpoint(this.abortController.signal);
          await this.executeAction(actions[index], this.abortController.signal);
          this.actionsExecuted += 1;
          this.log(
            "info",
            `Executed action ${index + 1}: ${actions[index].type}`,
          );
          this.emitProgress(totalIterations);
          if (config.stepMode) {
            this.transition("completed", "Step execution completed");
            await this.mouseController.releaseAllButtons();
            return;
          }
        }

        this.currentActionIndex = 0;
        if (
          totalIterations !== "infinite" &&
          this.currentIteration >= totalIterations
        ) {
          break;
        }

        if (config.loop.delayBetweenIterationsMs > 0) {
          let remaining = config.loop.delayBetweenIterationsMs;
          while (remaining > 0) {
            await this.checkpoint(this.abortController.signal);
            const slice = Math.min(25, remaining);
            await sleep(slice, this.abortController.signal);
            remaining -= slice;
          }
        }
      }

      this.transition("completed", "Sequence completed successfully");
      await this.mouseController.releaseAllButtons();
    } catch (error) {
      if (
        this.abortController?.signal.aborted ||
        (error as Error).message === "Operation aborted"
      ) {
        this.log("warn", "Execution stopped");
      } else {
        this.transition(
          "failed",
          `Execution failed: ${(error as Error).message}`,
        );
      }
      await this.mouseController.releaseAllButtons();
      throw error;
    } finally {
      this.reset();
    }
  }
}

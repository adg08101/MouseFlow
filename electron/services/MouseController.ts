import { screen } from "electron";
import type {
  ClickAction,
  CursorInfo,
  MoveAction,
  ScrollAction,
} from "../../shared/types.js";

const DEFAULT_CHUNK_MS = 16;

type Checkpoint = () => Promise<void>;

type NutMouseBinding = {
  getPosition: () => Promise<{ x: number; y: number }>;
  setPosition: (point: unknown) => Promise<void>;
  scrollUp: (amount: number) => Promise<void>;
  scrollDown: (amount: number) => Promise<void>;
  click: (button: unknown) => Promise<void>;
  doubleClick: (button: unknown) => Promise<void>;
  pressButton: (button: unknown) => Promise<void>;
  releaseButton: (button: unknown) => Promise<void>;
};

type NutBinding = {
  mouse: NutMouseBinding;
  Button: {
    LEFT: unknown;
    RIGHT: unknown;
    MIDDLE: unknown;
  };
  Point: new (x: number, y: number) => unknown;
};

const delay = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (!signal) {
      return;
    }
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

export class MouseController {
  private nut: NutBinding | null = null;
  private initialized = false;
  private pressedButtons = new Set<string>();

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    try {
      this.nut =
        (await import("@nut-tree-fork/nut-js")) as unknown as NutBinding;
      this.initialized = true;
    } catch {
      this.nut = null;
      this.initialized = false;
    }
  }

  async getCursorInfo(): Promise<CursorInfo> {
    const current = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(current);
    const virtualBounds = screen.getAllDisplays().reduce(
      (acc, item) => ({
        x: Math.min(acc.x, item.bounds.x),
        y: Math.min(acc.y, item.bounds.y),
        width: Math.max(acc.width, item.bounds.x + item.bounds.width),
        height: Math.max(acc.height, item.bounds.y + item.bounds.height),
      }),
      {
        x: Number.POSITIVE_INFINITY,
        y: Number.POSITIVE_INFINITY,
        width: Number.NEGATIVE_INFINITY,
        height: Number.NEGATIVE_INFINITY,
      },
    );

    return {
      x: current.x,
      y: current.y,
      activeDisplayId: display.id,
      activeDisplayLabel: `Display ${display.id}`,
      displayBounds: display.bounds,
      virtualBounds: {
        x: virtualBounds.x,
        y: virtualBounds.y,
        width: virtualBounds.width - virtualBounds.x,
        height: virtualBounds.height - virtualBounds.y,
      },
    };
  }

  private async getPosition(): Promise<{ x: number; y: number }> {
    if (!this.nut) {
      const point = screen.getCursorScreenPoint();
      return { x: point.x, y: point.y };
    }
    const point = await this.nut.mouse.getPosition();
    return { x: point.x, y: point.y };
  }

  private async setPosition(x: number, y: number): Promise<void> {
    if (!this.nut) {
      throw new Error("Native mouse automation library is unavailable.");
    }
    await this.nut.mouse.setPosition(
      new this.nut.Point(Math.round(x), Math.round(y)),
    );
  }

  async move(
    action: MoveAction,
    signal: AbortSignal,
    checkpoint: Checkpoint,
  ): Promise<void> {
    const current = await this.getPosition();
    let targetX = current.x;
    let targetY = current.y;

    switch (action.direction) {
      case "left":
        targetX = current.x - (action.distance ?? 0);
        break;
      case "right":
        targetX = current.x + (action.distance ?? 0);
        break;
      case "up":
        targetY = current.y - (action.distance ?? 0);
        break;
      case "down":
        targetY = current.y + (action.distance ?? 0);
        break;
      case "absolute":
        targetX = action.x ?? current.x;
        targetY = action.y ?? current.y;
        break;
      case "relative":
        targetX = current.x + (action.x ?? 0);
        targetY = current.y + (action.y ?? 0);
        break;
    }

    const duration = action.smooth ? Math.max(action.durationMs, 1) : 0;
    if (duration === 0) {
      await this.setPosition(targetX, targetY);
      return;
    }

    const stepMs = Math.max(
      DEFAULT_CHUNK_MS,
      action.speed ? Math.floor(1000 / action.speed) : DEFAULT_CHUNK_MS,
    );
    const steps = Math.max(1, Math.ceil(duration / stepMs));

    for (let index = 1; index <= steps; index += 1) {
      if (signal.aborted) {
        throw new Error("Operation aborted");
      }
      await checkpoint();
      const progress = index / steps;
      const x = current.x + (targetX - current.x) * progress;
      const y = current.y + (targetY - current.y) * progress;
      await this.setPosition(x, y);
      await delay(Math.min(stepMs, duration), signal);
    }
  }

  async scroll(
    action: ScrollAction,
    signal: AbortSignal,
    checkpoint: Checkpoint,
  ): Promise<void> {
    if (!this.nut) {
      throw new Error("Native mouse automation library is unavailable.");
    }
    const repeat = Math.max(1, action.repeat);
    const perRepeatDelay =
      action.smooth && action.durationMs > 0
        ? Math.max(1, Math.floor(action.durationMs / repeat))
        : 0;
    const amount = Math.max(1, Math.floor(action.amount));

    for (let i = 0; i < repeat; i += 1) {
      if (signal.aborted) {
        throw new Error("Operation aborted");
      }
      await checkpoint();
      if (action.direction === "up") {
        await this.nut.mouse.scrollUp(amount);
      } else if (action.direction === "down") {
        await this.nut.mouse.scrollDown(amount);
      } else {
        throw new Error(
          "Horizontal scrolling is not supported by this platform binding.",
        );
      }
      if (perRepeatDelay > 0) {
        await delay(perRepeatDelay, signal);
      }
    }
  }

  async click(
    action: ClickAction,
    signal: AbortSignal,
    checkpoint: Checkpoint,
  ): Promise<void> {
    if (!this.nut) {
      throw new Error("Native mouse automation library is unavailable.");
    }

    const left = this.nut.Button.LEFT;
    const right = this.nut.Button.RIGHT;
    const middle = this.nut.Button.MIDDLE;

    if (signal.aborted) {
      throw new Error("Operation aborted");
    }
    await checkpoint();

    switch (action.clickType) {
      case "left":
        await this.nut.mouse.click(left);
        break;
      case "right":
        await this.nut.mouse.click(right);
        break;
      case "middle":
        await this.nut.mouse.click(middle);
        break;
      case "double":
        await this.nut.mouse.doubleClick(left);
        break;
      case "press":
        await this.nut.mouse.pressButton(left);
        this.pressedButtons.add("left");
        break;
      case "release":
        await this.nut.mouse.releaseButton(left);
        this.pressedButtons.delete("left");
        break;
    }

    if (action.delayMs > 0) {
      await delay(action.delayMs, signal);
    }
  }

  async releaseAllButtons(): Promise<void> {
    if (!this.nut) {
      return;
    }
    const releases: Array<Promise<void>> = [];
    if (this.pressedButtons.has("left")) {
      releases.push(this.nut.mouse.releaseButton(this.nut.Button.LEFT));
      this.pressedButtons.delete("left");
    }
    await Promise.allSettled(releases);
  }
}

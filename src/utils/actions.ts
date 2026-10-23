import type {
  AutomationAction,
  ClickAction,
  MoveAction,
  ScrollAction,
  WaitAction,
} from "../../shared/types";

export const createMoveAction = (
  direction: MoveAction["direction"] = "right",
): MoveAction => ({
  id: crypto.randomUUID(),
  enabled: true,
  type: "move",
  direction,
  distance: 200,
  x: 0,
  y: 0,
  durationMs: 250,
  smooth: true,
  speed: 60,
});

export const createScrollAction = (
  direction: ScrollAction["direction"] = "down",
): ScrollAction => ({
  id: crypto.randomUUID(),
  enabled: true,
  type: "scroll",
  direction,
  amount: 120,
  amountUnit: "wheel",
  durationMs: 200,
  smooth: false,
  repeat: 1,
});

export const createClickAction = (
  clickType: ClickAction["clickType"] = "left",
): ClickAction => ({
  id: crypto.randomUUID(),
  enabled: true,
  type: "click",
  clickType,
  delayMs: 100,
});

export const createWaitAction = (durationMs = 1000): WaitAction => ({
  id: crypto.randomUUID(),
  enabled: true,
  type: "wait",
  durationMs,
});

export const describeAction = (action: AutomationAction): string => {
  if (action.type === "move") {
    if (action.direction === "absolute") {
      return `Move to (${action.x}, ${action.y}) in ${action.durationMs}ms`;
    }
    if (action.direction === "relative") {
      return `Move relative by (${action.x}, ${action.y}) in ${action.durationMs}ms`;
    }
    return `Move ${action.direction} ${action.distance}px`;
  }
  if (action.type === "scroll") {
    return `Scroll ${action.direction} ${action.amount}${action.amountUnit === "pixel" ? "px" : " units"} x${action.repeat}`;
  }
  if (action.type === "click") {
    return `${action.clickType} click (delay ${action.delayMs}ms)`;
  }
  return `Wait ${action.durationMs}ms`;
};

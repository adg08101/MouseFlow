import { describe, expect, it } from "vitest";
import { validateAction } from "../shared/validation";

describe("validateAction", () => {
  it("validates movement constraints", () => {
    const invalid = validateAction({
      id: "a",
      enabled: true,
      type: "move",
      direction: "left",
      distance: -1,
      durationMs: 50,
      smooth: true,
    });
    expect(invalid.valid).toBe(false);

    const valid = validateAction({
      id: "a",
      enabled: true,
      type: "move",
      direction: "absolute",
      x: 100,
      y: 200,
      durationMs: 300,
      smooth: true,
      speed: 80,
    });
    expect(valid.valid).toBe(true);
  });

  it("validates scroll configuration", () => {
    const invalid = validateAction({
      id: "s",
      enabled: true,
      type: "scroll",
      direction: "down",
      amount: 200,
      amountUnit: "wheel",
      durationMs: 10,
      smooth: false,
      repeat: 0,
    });
    expect(invalid.valid).toBe(false);

    const valid = validateAction({
      id: "s",
      enabled: true,
      type: "scroll",
      direction: "up",
      amount: 120,
      amountUnit: "pixel",
      durationMs: 100,
      smooth: true,
      repeat: 2,
    });
    expect(valid.valid).toBe(true);
  });
});

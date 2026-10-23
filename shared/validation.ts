import type {
  AutomationAction,
  SaveSequenceInput,
  ValidationResult,
} from "./types.js";

const MAX_DISTANCE = 100000;
const MAX_DURATION = 60 * 60 * 1000;
const MAX_REPEAT = 100000;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function validateAction(action: AutomationAction): ValidationResult {
  const errors: string[] = [];

  if (!action.id || typeof action.id !== "string") {
    errors.push("Action id is required.");
  }

  switch (action.type) {
    case "move":
      if (
        !isFiniteNumber(action.durationMs) ||
        action.durationMs < 0 ||
        action.durationMs > MAX_DURATION
      ) {
        errors.push("Move duration must be between 0 and 3600000 ms.");
      }
      if (action.direction === "absolute" || action.direction === "relative") {
        if (!isFiniteNumber(action.x) || !isFiniteNumber(action.y)) {
          errors.push(
            "Move coordinates x and y are required for absolute and relative movement.",
          );
        }
      } else if (
        !isFiniteNumber(action.distance) ||
        action.distance < 0 ||
        action.distance > MAX_DISTANCE
      ) {
        errors.push("Move distance must be between 0 and 100000 px.");
      }
      break;
    case "scroll":
      if (
        !isFiniteNumber(action.amount) ||
        action.amount < 0 ||
        action.amount > MAX_DISTANCE
      ) {
        errors.push("Scroll amount must be between 0 and 100000.");
      }
      if (
        !isFiniteNumber(action.durationMs) ||
        action.durationMs < 0 ||
        action.durationMs > MAX_DURATION
      ) {
        errors.push("Scroll duration must be between 0 and 3600000 ms.");
      }
      if (
        !Number.isInteger(action.repeat) ||
        action.repeat < 1 ||
        action.repeat > MAX_REPEAT
      ) {
        errors.push("Scroll repeat must be an integer between 1 and 100000.");
      }
      break;
    case "click":
      if (
        !isFiniteNumber(action.delayMs) ||
        action.delayMs < 0 ||
        action.delayMs > MAX_DURATION
      ) {
        errors.push("Click delay must be between 0 and 3600000 ms.");
      }
      break;
    case "wait":
      if (
        !isFiniteNumber(action.durationMs) ||
        action.durationMs < 0 ||
        action.durationMs > MAX_DURATION
      ) {
        errors.push("Wait duration must be between 0 and 3600000 ms.");
      }
      break;
    default:
      errors.push("Unsupported action type.");
  }

  return { valid: errors.length === 0, errors };
}

export function validateSequenceInput(
  input: SaveSequenceInput,
): ValidationResult {
  const errors: string[] = [];

  if (!input.name || input.name.trim().length < 1) {
    errors.push("Sequence name is required.");
  }
  if (input.name.length > 120) {
    errors.push("Sequence name must be at most 120 characters.");
  }
  if (!Array.isArray(input.actions)) {
    errors.push("Sequence actions must be an array.");
  } else {
    input.actions.forEach((action, index) => {
      const result = validateAction(action);
      if (!result.valid) {
        errors.push(`Action ${index + 1}: ${result.errors.join("; ")}`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

# MouseFlow

MouseFlow is a Windows-first desktop mouse automation controller built with Electron, React, and TypeScript. It lets you build and run visual action sequences for mouse movement, scrolling, clicks, and waits, with pause/resume/stop safety controls and persistent sequence storage.

## Tech Stack

- Node.js
- Electron
- React + TypeScript
- Vite
- Tailwind CSS
- Zustand
- `@nut-tree-fork/nut-js` (maintained fork of `nut-js`)
- `electron-store`

## Features

- Cursor movement actions
  - Left / Right / Up / Down by pixels
  - Absolute move to $(x, y)$
  - Relative move by $(\Delta x, \Delta y)$
  - Smooth or instant motion with duration/speed controls
- Scroll actions
  - Up / Down (native support)
  - Left / Right configured in UI (runtime warns when unsupported)
  - Repeat, smooth, duration, and unit selection (wheel or pixel mode intent)
- Click actions
  - Left / Right / Middle / Double / Press / Release
  - Configurable delay
- Wait action
  - First-class delay step insertable anywhere
- Sequence builder
  - Add, reorder (drag/drop), edit, duplicate, delete, enable/disable
- Execution controls
  - Play, Pause, Stop, Step, Restart
  - State machine: `idle`, `running`, `paused`, `stopping`, `completed`, `failed`
  - Loop modes: once, count, infinite (+ delay between iterations)
- Live cursor tracker
  - X/Y, active display info, capture-position button
- Persistence
  - Save/load/rename/delete sequences
  - Import/export JSON with validation
- Global shortcuts
  - F6 Play/Resume, F7 Pause, F8 Stop, F9 Step, `Ctrl+S` Save
  - Configurable emergency stop shortcut

## Project Structure

```text
MouseFlow/
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   ├── ipc/registerHandlers.ts
│   └── services/
│       ├── MouseController.ts
│       ├── AutomationEngine.ts
│       ├── SequenceManager.ts
│       └── HotkeyManager.ts
├── shared/
│   ├── types.ts
│   └── validation.ts
├── src/
│   ├── components/
│   ├── store/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── e2e/
│   ├── automationEngine.test.ts
│   ├── sequenceManager.test.ts
│   └── validation.test.ts
└── package.json
```

## Security & Safety

- Native mouse automation runs in Electron main process only.
- Renderer runs with:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - secure preload bridge (`window.mouseflow`)
- Action payloads are validated before execution.
- Execution cancellation uses `AbortController` + interruptible delay chunks.
- Stop releases held mouse buttons and clears pending waits.
- No telemetry, no remote control, no hidden startup execution.

## Scripts

```bash
npm install
npm run dev
npm run test
npm run build
npm run package
```

Additional:

- `npm run lint` — ESLint checks
- `npm run e2e` — Playwright Electron smoke test

## Development

`npm run dev` launches:

- Vite renderer at `http://localhost:5173`
- TypeScript watch build for Electron main/preload
- Electron app once renderer + main outputs are ready

## Packaging (Windows)

`npm run package` uses `electron-builder` and emits installer artifacts under `release/`.

## Testing Coverage

Vitest unit tests cover:

- Movement parameter validation
- Scroll configuration validation
- Sequence action ordering
- Pause and resume behavior
- Stop during delay actions
- Stop during repeated loops
- Prevention of concurrent runs
- JSON export/import flow
- Error recovery after failed action execution

Playwright includes a basic Electron launch smoke test.

## Manual Smoke-Test Checklist

1. Launch app with `npm run dev`.
2. Add sequence: Move Right → Wait → Scroll Down → Left Click.
3. Save sequence and reload it.
4. Run Play and verify ordered execution.
5. Pause mid-run and Resume.
6. Stop during a long Wait and verify immediate cancel.
7. Configure loop mode `Infinite`, then stop via toolbar.
8. Verify cursor tracker updates continuously.
9. Capture cursor position into an absolute move action.
10. Export sequence JSON, import it back, execute it.
11. Validate global shortcuts (F6/F7/F8/F9 and `Ctrl+S`).
12. Trigger emergency stop shortcut while running.

## Notes

- Horizontal scrolling behavior is OS/library dependent; if unsupported, runtime throws a clear error.
- For native automation to function, OS accessibility/automation permissions may be required.

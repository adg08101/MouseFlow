import { _electron as electron, test, expect } from "@playwright/test";
import path from "node:path";

test("launches MouseFlow window", async () => {
  const electronApp = await electron.launch({
    args: [path.resolve(".")],
    env: {
      ...process.env,
      NODE_ENV: "test",
    },
  });

  const window = await electronApp.firstWindow();
  await expect(window).toHaveTitle(/MouseFlow/i);

  await electronApp.close();
});

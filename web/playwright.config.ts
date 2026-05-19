import { defineConfig } from "@playwright/test";
import path from "node:path";

const DATA_ROOT = path.resolve(__dirname, "tests/.tmp/data-root");
// Use a dedicated port so we don't collide with `pnpm dev` on 3000.
const PORT = 3210;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { CAREERBOT_DATA_ROOT: DATA_ROOT },
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "e2e",
      testDir: "./tests/e2e",
      use: { browserName: "chromium" },
    },
    {
      name: "integration",
      testDir: "./tests/integration",
      use: { browserName: "chromium" },
      timeout: 5 * 60_000,
    },
  ],
});

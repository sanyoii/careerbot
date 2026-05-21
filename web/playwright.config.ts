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
  // Use `next build && next start` instead of `next dev` so the test server
  // is independent of the developer's local `pnpm dev`. Next.js 16 holds a
  // per-project dev-mode lock at `.next/dev/lock` that refuses to spawn a
  // second `next dev` even on a different port — production-mode start has
  // no such lock. The NEXT_TEST_BUILD env var (read by next.config.ts) flips
  // distDir to `.next-test` so the test build doesn't trample the dev cache.
  webServer: {
    command: `pnpm exec next build && pnpm exec next start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 300_000,
    env: {
      CAREERBOT_DATA_ROOT: DATA_ROOT,
      NEXT_TEST_BUILD: "1",
    },
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

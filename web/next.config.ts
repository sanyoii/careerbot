import type { NextConfig } from "next";
import path from "node:path";

// When running Playwright tests, build/start uses an isolated dist dir so it
// doesn't fight the local `pnpm dev` server's `.next/` cache or its
// per-project dev-mode lock at `.next/dev/lock`. Toggled via NEXT_TEST_BUILD
// from playwright.config.ts.
const isTestBuild = process.env.NEXT_TEST_BUILD === "1";

const nextConfig: NextConfig = {
  distDir: isTestBuild ? ".next-test" : ".next",
  // Pin the workspace root so multiple ancestor lockfiles don't confuse Turbopack.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

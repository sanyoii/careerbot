import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { DATA_ROOT, setupFreshRepo } from "../setup/fixtures";

const RUN = process.env.RUN_LIVE_SKILLS === "1";

test.describe("Live skill integration (opt-in)", () => {
  test.skip(!RUN, "set RUN_LIVE_SKILLS=1 to run this test (costs real Anthropic API tokens)");

  test("/find-companies populates companies/in-review/", async () => {
    await setupFreshRepo();

    // Seed a minimal ideas.md with one well-known company URL.
    await fs.writeFile(
      path.join(DATA_ROOT, "companies/ideas.md"),
      ["# Companies I'm curious about", "", "- https://linear.app", ""].join("\n"),
    );

    // Spawn the `claude` CLI inside DATA_ROOT, asking it to run /find-companies.
    // Requires the `claude` CLI on PATH and Anthropic API access.
    await runClaude(["-p", "/find-companies"], DATA_ROOT);

    // Assert: at least one .md file was written under companies/in-review/.
    const inReviewDir = path.join(DATA_ROOT, "companies/in-review");
    const entries = await fs.readdir(inReviewDir);
    const md = entries.filter((f) => f.endsWith(".md"));
    expect(md.length).toBeGreaterThan(0);

    // Validate the first file's frontmatter has the required fields.
    const raw = await fs.readFile(path.join(inReviewDir, md[0]), "utf-8");
    const parsed = matter(raw);
    const data = parsed.data as { name?: string; slug?: string; industry?: string[] };
    expect(data.name).toBeTruthy();
    expect(data.slug).toBeTruthy();
    expect(Array.isArray(data.industry)).toBe(true);
  });
});

function runClaude(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("claude", args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`claude exited with code ${code}`));
    });
  });
}

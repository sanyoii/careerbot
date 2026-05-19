import { test, expect } from "@playwright/test";
import matter from "gray-matter";
import { setupFreshRepo, fileExists, readFile } from "../setup/fixtures";

test.describe("Onboarding overlay", () => {
  test.beforeEach(async () => {
    await setupFreshRepo();
  });

  test("welcome screen appears on fresh repo", async ({ page }) => {
    await page.goto("/applications");
    await expect(page.getByRole("heading", { name: "Welcome to careerbot" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Get started/i })).toBeVisible();
  });

  test("Get started advances to step 0 with Back button", async ({ page }) => {
    await page.goto("/applications");
    await page.getByRole("button", { name: /Get started/i }).click();
    await expect(page.getByRole("heading", { name: "What kind of role?" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Back/i })).toBeVisible();
  });

  test("Back from step 0 returns to welcome", async ({ page }) => {
    await page.goto("/applications");
    await page.getByRole("button", { name: /Get started/i }).click();
    await page.getByRole("button", { name: /Back/i }).click();
    await expect(page.getByRole("heading", { name: "Welcome to careerbot" })).toBeVisible();
  });

  test("Skip on step 0 does not create preferences.md", async ({ page }) => {
    await page.goto("/applications");
    await page.getByRole("button", { name: /Get started/i }).click();
    await page.getByRole("button", { name: /^Skip$/ }).click();
    // Advanced to step 1 (Compensation) without saving
    await expect(page.getByRole("heading", { name: "Compensation" })).toBeVisible();
    expect(await fileExists("context/preferences.md")).toBe(false);
  });

  test("walk through all 7 steps saves preferences.md and lands on /companies", async ({ page }) => {
    await page.goto("/applications");
    await page.getByRole("button", { name: /Get started/i }).click();

    // Step 0: Role - add a title chip via Enter
    const titlesInput = page.getByPlaceholder("Product Designer (Enter to add)");
    await titlesInput.fill("Senior Product Designer");
    await titlesInput.press("Enter");
    await page.getByRole("button", { name: /^Next/i }).click();

    // Step 1-5: just Next through (defaults)
    for (let i = 1; i <= 5; i++) {
      await page.getByRole("button", { name: /^Next/i }).click();
    }

    // Step 6 (Voice): Finish saves AND navigates to /companies
    await page.getByRole("button", { name: /Finish/i }).click();
    await expect(page).toHaveURL(/\/companies$/);

    // Disk assertion: preferences.md exists and contains the title we typed
    expect(await fileExists("context/preferences.md")).toBe(true);
    const raw = await readFile("context/preferences.md");
    const parsed = matter(raw);
    const data = parsed.data as { role?: { titles?: string[] } };
    expect(data.role?.titles).toContain("Senior Product Designer");
  });

  test("overlay has no close button and resists Esc / backdrop click", async ({ page }) => {
    await page.goto("/applications");
    await expect(page.getByRole("heading", { name: "Welcome to careerbot" })).toBeVisible();

    // No close button.
    await expect(page.getByRole("button", { name: /Close onboarding/i })).toHaveCount(0);

    // Pressing Esc and clicking the backdrop don't close the overlay.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Welcome to careerbot" })).toBeVisible();
    // Click far outside the centered card to simulate a backdrop click.
    await page.mouse.click(10, 10);
    await expect(page.getByRole("heading", { name: "Welcome to careerbot" })).toBeVisible();
  });
});

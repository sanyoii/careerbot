import { test, expect } from "@playwright/test";
import matter from "gray-matter";
import { readFile, setupOnboarded } from "../setup/fixtures";

test.describe("Configuration form + unsaved-changes guard", () => {
  test.beforeEach(async () => {
    await setupOnboarded();
  });

  test("save persists to preferences.md and round-trips", async ({ page }) => {
    await page.goto("/configuration");

    // Add a new title chip to the Role section.
    const titles = page.getByPlaceholder("Product Designer");
    await titles.fill("Design Engineer");
    await titles.press("Enter");

    await page.getByRole("button", { name: /Save preferences/i }).click();
    await expect(page.getByText(/Preferences saved/)).toBeVisible();

    // Disk assertion: frontmatter contains the new title.
    const raw = await readFile("context/preferences.md");
    const parsed = matter(raw);
    const data = parsed.data as { role?: { titles?: string[] } };
    expect(data.role?.titles).toContain("Design Engineer");

    // Reload + verify form re-renders with the saved value.
    await page.reload();
    await expect(page.getByText("Design Engineer", { exact: true })).toBeVisible();
  });

  test("unsaved edit triggers warning modal on side-nav click", async ({ page }) => {
    await page.goto("/configuration");
    await page.getByPlaceholder("direct, occasionally self-deprecating, never gushing").fill("test edit");
    await page.getByRole("link", { name: /^Applications$/ }).click();

    await expect(page).toHaveURL(/\/configuration$/);
    await expect(page.getByRole("heading", { name: "Discard unsaved changes?" })).toBeVisible();
  });

  test("Keep editing dismisses the modal and stays on page", async ({ page }) => {
    await page.goto("/configuration");
    const tone = page.getByPlaceholder("direct, occasionally self-deprecating, never gushing");
    await tone.fill("keep editing test");
    await page.getByRole("link", { name: /^Applications$/ }).click();
    await page.getByRole("button", { name: /Keep editing/i }).click();

    await expect(page).toHaveURL(/\/configuration$/);
    await expect(tone).toHaveValue("keep editing test");
  });

  test("Discard changes navigates away and drops the edit", async ({ page }) => {
    await page.goto("/configuration");
    await page.getByPlaceholder("direct, occasionally self-deprecating, never gushing").fill("discard test");
    await page.getByRole("link", { name: /^Applications$/ }).click();
    await page.getByRole("button", { name: /Discard changes/i }).click();

    await expect(page).toHaveURL(/\/applications$/);
  });

  test("clean form navigates without modal", async ({ page }) => {
    await page.goto("/configuration");
    await page.getByRole("link", { name: /^Applications$/ }).click();
    await expect(page).toHaveURL(/\/applications$/);
    await expect(page.getByRole("heading", { name: "Discard unsaved changes?" })).not.toBeVisible();
  });
});

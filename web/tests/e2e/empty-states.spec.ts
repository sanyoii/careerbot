import { test, expect } from "@playwright/test";
import { setupOnboarded, setupWithCompanies } from "../setup/fixtures";

test.describe("Empty-state CTAs", () => {
  test("/applications: 3-step CTA when no companies", async ({ page }) => {
    await setupOnboarded();
    await page.goto("/applications");
    await expect(page.getByRole("heading", { name: "No applications yet" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Check configuration/i })).toBeVisible();
    await expect(page.getByText("/find-companies").first()).toBeVisible();
    await expect(page.getByText("/find-roles").first()).toBeVisible();
  });

  test("/applications: 1-step CTA when companies exist", async ({ page }) => {
    await setupWithCompanies({ interested: ["linear"] });
    await page.goto("/applications");
    await expect(page.getByRole("heading", { name: "No applications yet" })).toBeVisible();
    await expect(page.getByText("/find-roles").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Check configuration/i })).not.toBeVisible();
    // /find-companies should not appear as a stub command in the empty state
    await expect(
      page.locator("code", { hasText: /^\/find-companies$/ }),
    ).toHaveCount(0);
  });

  test("/companies: 2-step CTA when no companies", async ({ page }) => {
    await setupOnboarded();
    await page.goto("/companies");
    await expect(page.getByRole("heading", { name: "No companies yet" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Check configuration/i })).toBeVisible();
    await expect(page.getByText("/find-companies").first()).toBeVisible();
  });

  test("/answer-bank: 3-step CTA when no companies", async ({ page }) => {
    await setupOnboarded();
    await page.goto("/answer-bank");
    await expect(page.getByRole("heading", { name: "No questions yet" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Check configuration/i })).toBeVisible();
    await expect(page.getByText("/find-companies").first()).toBeVisible();
    await expect(page.getByText("/find-roles").first()).toBeVisible();
  });

  test("/answer-bank: 1-step CTA when companies exist", async ({ page }) => {
    await setupWithCompanies({ interested: ["linear"] });
    await page.goto("/answer-bank");
    await expect(page.getByRole("heading", { name: "No questions yet" })).toBeVisible();
    await expect(page.getByText("/find-roles").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Check configuration/i })).not.toBeVisible();
  });
});

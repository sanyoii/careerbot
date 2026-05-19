import { test, expect } from "@playwright/test";
import { setupMidPipeline } from "../setup/fixtures";

// setupMidPipeline copies three answer-bank files:
//   beliefs/mission-fit.md      (FILLED)
//   beliefs/culture-fit.md      (STUB)
//   career/companies-admired.md (STUB)
//
// Total: 3 entries, 1 answered, 2 unanswered. One stub in beliefs, one in career.

test.describe("Answer Bank answered-state filter", () => {
  test("default 'All' shows all entries with chip on stubs", async ({ page }) => {
    await setupMidPipeline();
    await page.goto("/answer-bank");

    const list = page.getByRole("list");

    // Three rows total.
    await expect(list.getByRole("link")).toHaveCount(3);

    // Two stubs have the chip; the filled entry does not.
    await expect(
      list.getByRole("link", { name: /culture/i }).getByText("Unanswered"),
    ).toBeVisible();
    await expect(
      list.getByRole("link", { name: /companies/i }).getByText("Unanswered"),
    ).toBeVisible();
    await expect(
      list.getByRole("link", { name: /mission/i }).getByText("Unanswered"),
    ).toHaveCount(0);
  });

  test("'Unanswered' filter narrows to stubs, hides chip, composes with theme tabs", async ({
    page,
  }) => {
    await setupMidPipeline();
    await page.goto("/answer-bank");

    // Click the Unanswered filter (only one tab with this name; theme row no
    // longer has an "Unanswered" tab).
    await page.getByRole("tab", { name: "Unanswered" }).click();

    await expect(page).toHaveURL(/[?&]answered=unanswered/);

    // Only the two stubs are visible.
    const list = page.getByRole("list");
    await expect(list.getByRole("link")).toHaveCount(2);
    await expect(list.getByRole("link", { name: /mission/i })).toHaveCount(0);

    // Chip is hidden inside the filtered view (tautological).
    await expect(list.getByText("Unanswered")).toHaveCount(0);

    // Compose with Beliefs theme tab: only beliefs/culture-fit remains.
    await page.getByRole("tab", { name: /Beliefs/i }).click();
    await expect(list.getByRole("link")).toHaveCount(1);
    await expect(list.getByRole("link", { name: /culture/i })).toBeVisible();
  });

  test("'Answered' filter narrows to filled entries only", async ({ page }) => {
    await setupMidPipeline();
    await page.goto("/answer-bank");

    await page.getByRole("tab", { name: "Answered", exact: true }).click();
    await expect(page).toHaveURL(/[?&]answered=answered/);

    const list = page.getByRole("list");
    await expect(list.getByRole("link")).toHaveCount(1);
    await expect(list.getByRole("link", { name: /mission/i })).toBeVisible();
  });

  test("direct-navigation to ?answered=unanswered renders the filtered view", async ({
    page,
  }) => {
    await setupMidPipeline();
    await page.goto("/answer-bank?answered=unanswered");

    const list = page.getByRole("list");
    await expect(list.getByRole("link")).toHaveCount(2);
    await expect(list.getByRole("link", { name: /mission/i })).toHaveCount(0);
    await expect(list.getByText("Unanswered")).toHaveCount(0);
  });
});

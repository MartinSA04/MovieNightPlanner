import { expect, test } from "@playwright/test";

test("renders the scaffold landing page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Settle the movie vote before the snacks get cold.")).toBeVisible();
  await expect(page.getByText("Monorepo scaffold ready")).toBeVisible();
});

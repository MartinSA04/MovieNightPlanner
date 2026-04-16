import { expect, test } from "@playwright/test";

test("renders the scaffold landing page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Plan movie nights.")).toBeVisible();
  await expect(page.getByText("Home")).toBeVisible();
});

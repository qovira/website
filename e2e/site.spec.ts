import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// One smoke + a11y test over the page we ship (prerendered `build/`, served by
// `preview` — see playwright.config.ts). It guards the four things that must
// hold on the holding page: the hero renders, the repo link is present and
// correct, the theme resolves to Evening under a dark color scheme, and axe
// finds nothing. Broader component-state coverage belongs in @qovira/ui, not
// here.
test.describe("placeholder site", () => {
  test.beforeEach(async ({ context }) => {
    // The prod build injects the Plausible beacon (QOV-31). Block it so the run
    // stays hermetic and never depends on a third-party network call.
    await context.route(/plausible\.io/, (route) => route.abort());
  });

  test("renders the hero, resolves the Evening theme, and is accessible", async ({ page }) => {
    await page.goto("/");

    // The single <h1> hero headline renders.
    await expect(
      page.getByRole("heading", { level: 1, name: "The assistant that never leaves the room." }),
    ).toBeVisible();

    // The quiet footer link to the product repo renders and points at GitHub.
    const repoLink = page.getByRole("link", { name: "github.com/qovira/qovira" });
    await expect(repoLink).toBeVisible();
    await expect(repoLink).toHaveAttribute("href", "https://github.com/qovira/qovira");

    // The pre-paint boot resolves Evening under the emulated dark
    // prefers-color-scheme (no stored choice, no toggle).
    await expect(page.locator("html")).toHaveAttribute("data-theme", "evening");

    // axe reports zero accessibility violations — the brand's non-negotiable bar.
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
});

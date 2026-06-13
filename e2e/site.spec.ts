import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
// Imported by relative path, not the `$lib` alias (Playwright runs outside the
// SvelteKit/Vite resolver). site.ts is plain data, so the specs assert against
// the same single source of truth the page renders from — a drift in site.ts
// fails the test instead of silently shipping mismatched copy/metadata.
import { site } from "../src/lib/site";

// The suite runs over the page we ship (prerendered `build/`, served by
// `preview` — see playwright.config.ts), i.e. the PROD output with the head boot
// and Plausible beacon baked in. It guards the holding page's real contract:
// the visible hero, the SEO/unfurl <head>, the JSON-LD product object, the
// production analytics splice, the sitemap, accessibility, and theme resolution.
// Broader component-state coverage belongs in @qovira/ui, not here.
test.describe("placeholder site", () => {
  test.beforeEach(async ({ context }) => {
    // The prod build injects the Plausible beacon (QOV-31). Block the network
    // call so the run stays hermetic — the <script> tag still ships in the HTML,
    // which is what the analytics test below asserts.
    await context.route(/plausible\.io/, (route) => route.abort());
  });

  test("renders the hero, resolves the Evening theme, and is accessible", async ({ page }) => {
    await page.goto("/");

    // The single <h1> hero headline renders (asserted against the shared source).
    await expect(page.getByRole("heading", { level: 1, name: site.headline })).toBeVisible();

    // The quiet footer link to the product repo renders and points at GitHub.
    const repoLink = page.getByRole("link", { name: "github.com/qovira/qovira" });
    await expect(repoLink).toBeVisible();
    await expect(repoLink).toHaveAttribute("href", site.github);

    // The pre-paint boot resolves Evening under the emulated dark
    // prefers-color-scheme (no stored choice, no toggle).
    await expect(page.locator("html")).toHaveAttribute("data-theme", "evening");

    // axe reports zero accessibility violations — the brand's non-negotiable bar.
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });

  test("carries the canonical SEO + unfurl metadata, all from site.ts", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(site.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", site.url);

    // The meta description is the deliberate ≤155-char trim, not the descriptor.
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", site.metaDescription);
    expect(site.metaDescription.length).toBeLessThanOrEqual(155);

    // Open Graph — drives the social / LLM-chat unfurl.
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", site.title);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", site.descriptor);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", site.url);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", site.ogImage);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", site.ogImageAlt);

    // Twitter / X.
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute("content", site.descriptor);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", site.ogImage);
  });

  test("emits a parseable JSON-LD @graph mirroring site.ts", async ({ page }) => {
    await page.goto("/");

    // Reading and JSON.parse-ing the block proves the split-</script> concat
    // didn't corrupt it (the fragile invariant CLAUDE.md flags).
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    expect(raw, "JSON-LD script element is present and non-empty").toBeTruthy();

    interface GraphNode {
      "@type": string;
      name?: string;
      url?: string;
      description?: string;
      sameAs?: string[];
    }
    const parsed = JSON.parse(raw ?? "{}") as { "@graph"?: GraphNode[] };
    const graph = parsed["@graph"] ?? [];

    const org = graph.find((n) => n["@type"] === "Organization");
    const app = graph.find((n) => n["@type"] === "SoftwareApplication");

    // Schema-accuracy rule: the structured data must mirror the visible page.
    expect(org?.name).toBe(site.name);
    expect(org?.sameAs).toContain(site.github);
    expect(app?.url).toBe(site.url);
    expect(app?.description).toBe(site.descriptor);
  });

  test("bakes the Plausible beacon into the production build", async ({ page }) => {
    await page.goto("/");

    // The PROD-only splice (import.meta.env.PROD in hooks.server.ts) must have
    // fired: the beacon <script> is in the shipped HTML. It resolves to "" under
    // dev, so this also proves the suite tests the real prerendered output.
    await expect(page.locator('script[src*="plausible.io"]')).toHaveCount(1);
  });

  test("serves a well-formed sitemap.xml mirroring site.url", async ({ request }) => {
    const res = await request.get("/sitemap.xml");

    expect(res.status()).toBe(200);
    // Bunny serves `application/xml; charset=utf-8` in prod (see bunny-deploy.sh);
    // the static preview server reports `application/xml`. Assert the family.
    expect(res.headers()["content-type"]).toContain("xml");

    const body = await res.text();
    expect(body).toContain(`<loc>${site.url}</loc>`);
    expect(body).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });
});

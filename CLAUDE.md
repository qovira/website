# CLAUDE.md

Authority for the `website` repo's internals. Cross-repo rules live in the parent directory's `CLAUDE.md`. This is the furthest-downstream **leaf**: it consumes the **published** `@qovira/theme` and `@qovira/ui` from npm (not workspace-linked), so an upstream change reaches it only once published.

## What this is

The static "under construction" page for **qovira.ai**: a single, fully prerendered SvelteKit route (SvelteKit 2 / Svelte 5 on `@sveltejs/adapter-static`). `pnpm build` emits a content-baked `build/index.html` that crawlers and LLM fetchers read without running JS. It is the first real-world consumer of `@qovira/theme` + `@qovira/ui`, and deploys as static files to Bunny Storage behind Bunny CDN.

## Commands

```sh
pnpm dev                       # vite dev server (--open to launch a browser)
pnpm build                     # prerender to build/
pnpm preview                   # serve the production build locally
pnpm check                     # svelte-check — types + a11y (this IS the typecheck; no separate tsc)
pnpm check:bundle              # assert the JS bundle-size budget against build/ (run after pnpm build)
pnpm lint                      # prettier --check . && eslint .
pnpm format                    # prettier --write .
pnpm test                      # Playwright e2e: hero, head/SEO + JSON-LD, sitemap, analytics splice, a11y (see note below)
pnpm exec playwright test e2e/site.spec.ts --grep "renders the hero"   # single test by title
pnpm assets                    # regenerate committed brand assets (maintenance only — see below)
```

- **`pnpm test` builds first** — its `webServer` runs `pnpm build && pnpm preview` and tests the real prerendered `build/`, never the dev server. We test what ships (PROD head boot + Plausible beacon baked in), not an SSR/HMR approximation. Browsers aren't auto-installed: run `pnpm exec playwright install --with-deps chromium` first.
- **`pnpm check` (svelte-check) is the typecheck.** A bare `tsc --noEmit` can't parse `.svelte`; svelte-check covers the `.ts` too. Do **not** add a separate tsc step.

## Architecture

One route, `src/routes/+page.svelte`, rendered once at build time. `+layout.ts` sets `prerender = true`, `ssr = true`, `csr = false`, no SPA fallback — there are no dynamic routes, so a fallback would only mask 404s. `csr = false` ships the page as pure prerendered HTML/CSS (zero interactivity → no client hydration runtime, best LCP/CLS); the inline theme boot and Plausible beacon live in `<head>` and are independent of CSR. It also sidesteps the dev-only "removing comments in `transformPageChunk`" warning, which SvelteKit raises only under CSR when `hooks.server.ts` replaces the `<head>` placeholder comments (those aren't Svelte's body hydration markers, so hydration was never actually at risk).

**Edit copy in `src/lib/site.ts`, not the markup — it is the single source of truth for site metadata.** The hero headline, on-page lead, `og:description`, JSON-LD description, OG card alt, and `<meta name="description">` all derive from the one `site` object; that is what keeps them in sync (and lets the e2e suite assert the page against it). Preserve the deliberate split: `descriptor` (172 chars) is used verbatim everywhere _except_ `metaDescription`, a ≤155-char trim so the SERP snippet isn't clipped.

**`+page.svelte` carries all `<head>` SEO** via `<svelte:head>`: title, OG, Twitter, canonical, icons, and one JSON-LD `@graph` (Organization + WebSite + SoftwareApplication). Keep two invariants: the JSON-LD `</script>` tag stays split across a string concat so it can't prematurely close the component's own script element; and schema values must mirror the visible page (name, descriptor, GitHub link).

**`src/hooks.server.ts` splices two things into the static `<head>` at prerender time** via `transformPageChunk`, replacing placeholders in `src/app.html`. Replacers are functions so any `$`-sequence in the injected strings isn't read as a replacement pattern.

1. **`<!--qovira:head-->`** — the `@qovira/theme` pre-paint boot, imported verbatim from `@qovira/theme/boot`. **Never re-implement it.** It must sit _before_ the stylesheets so `data-theme` is on `<html>` before first paint (no flash), plus the media-scoped `theme-color` metas (Evening `#15100C` dark / Daylight `#F1E9DC` light).
2. **`<!--qovira:analytics-->`** — the Plausible beacon, injected **only** in production builds (`import.meta.env.PROD`); resolves to `""` under `vite dev`. Cookieless, no banner, default pageview only.

**`src/app.css`** imports Tailwind v4, then `@qovira/theme`, `@qovira/theme/fonts`, and `@qovira/ui`. **The `@qovira/ui` import is required and load-bearing:** the library ships uncompiled `.svelte` source, so this import (resolving via its `style` export) is what registers its components with Tailwind v4. `@source "@qovira/ui"` does **not** work — it resolves to the JS entry and components render unstyled. The theme styles tokens but leaves the page surface to the consumer, so `app.css` paints `html` with `--bg`/`--text`.

## Brand assets (maintenance only — not part of the build)

The OG card and favicon/app-icon set (the Keyhole-Q mark) under `static/` are **generated and committed**; CI does not run this. SVG masters live in `assets/brand/`; `pnpm assets` (`scripts/build-brand-assets.sh`) regenerates the raster outputs. The OG card is rendered with the theme's own self-hosted fonts (Fraunces + JetBrains Mono), instanced from `@qovira/theme`'s variable woff2, so it matches the live page's type. Workflow: edit a master, run `pnpm assets`, commit the regenerated files. Requires host tools (not npm deps): `woff2_decompress`, `fonttools`, `rsvg-convert` (librsvg), `magick` (ImageMagick 7), `fc-cache`.

## CI & deploy

`.github/workflows/ci.yml`: **verify** (every PR + push to main) → **deploy** (only on push to `main`, after verify passes). Verify runs `pnpm check`, `pnpm lint`, `pnpm build` + `pnpm check:bundle` (the JS bundle-size budget — a tripwire against a barrel import inlining a whole library), then `pnpm test` on a Blacksmith runner (house rule: every job runs on Blacksmith). Deploy uploads `build/` to Bunny Storage (`.github/scripts/bunny-deploy.sh`, native Storage HTTP API, one PUT per file), then purges the pull zone; deploys are serialized and non-cancelable. **Cache-Control is enforced by Bunny Pull Zone edge rules, not in code** — fingerprinted `_app/immutable/*` get a 1-year immutable TTL, everything else a short revalidate TTL (documented in `ci.yml`).

## Conventions

- **Keep `CLAUDE.md` and `README.md` current in the same change.** When a change alters something either file describes (commands, architecture, the head/SEO or deploy setup, conventions), update the affected doc as part of that change — never as a follow-up.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `ci:`, `chore:`, `test:`).
- **Branches:** `project/<name>` (e.g. `project/placeholder-site`); PRs target `main`.
- **Runes mode** is forced for project files (`svelte.config.js`); use Svelte 5 runes (`$props`, `$state`, …).
- **Icons: deep-import `phosphor-svelte/lib/<Icon>`, never the package barrel** — an ESLint rule enforces it (type imports exempt), and `pnpm check:bundle` is the catch-all guard. A barrel import inlines phosphor's whole ~3,000-icon set into the route chunk and wrecks LCP; the why is in `conventions:writing-svelte`.

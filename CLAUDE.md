# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> This repo is one of several sibling repos under the Qovira workspace. The
> parent directory's `CLAUDE.md` governs cross-repo rules; this file is the
> authority for the `website` repo's internals. This repo is the furthest
> downstream — the leaf — consuming the published `@qovira/theme` and
> `@qovira/ui` from npm (not workspace-linked).

## What this is

The static "under construction" page for **qovira.ai** — a single, fully
prerendered SvelteKit route. SvelteKit 2 / Svelte 5 on
`@sveltejs/adapter-static`: `pnpm build` emits a content-baked
`build/index.html` that crawlers and LLM fetchers read without running JS. It is
the first real-world consumer of `@qovira/theme` + `@qovira/ui`, and deploys as
static files to Bunny Storage behind Bunny CDN.

## Commands

```sh
pnpm dev                       # vite dev server (--open to launch a browser)
pnpm build                     # prerender to build/
pnpm preview                   # serve the production build locally
pnpm check                     # svelte-check — types + a11y (this IS the typecheck; no separate tsc)
pnpm lint                      # prettier --check . && eslint .
pnpm format                    # prettier --write .
pnpm test                      # Playwright smoke + accessibility (see note below)
pnpm exec playwright test e2e/site.spec.ts --grep "renders the hero"   # single test by title
pnpm assets                    # regenerate committed brand assets (maintenance only — see below)
```

- **`pnpm test` builds first.** Playwright's `webServer` runs `pnpm build && pnpm preview`
  and tests the real prerendered `build/` — never the dev server. We test what
  ships (PROD head boot + Plausible beacon baked in), not an SSR/HMR
  approximation. Browsers aren't auto-installed: `pnpm exec playwright install --with-deps chromium`.
- **`svelte-check` is the typecheck.** A bare `tsc --noEmit` can't parse
  `.svelte`; svelte-check covers the `.ts` too. Don't add a separate tsc step.

## Architecture

The page is one route (`src/routes/+page.svelte`) rendered once at build time
(`+layout.ts`: `prerender = true`, `ssr = true`, no SPA fallback — there are no
dynamic routes, so a fallback would only mask 404s).

**`src/lib/site.ts` is the single source of truth for site metadata.** The
on-page lead, `og:description`, JSON-LD description, and `<meta name="description">`
all derive from one `site` descriptor object, which is what keeps them in sync.
Note the deliberate split: `descriptor` (172 chars) is used verbatim everywhere
_except_ `metaDescription`, a ≤155-char trim so the SERP snippet isn't clipped.
If you touch copy, edit `site.ts`, not the markup.

**`+page.svelte` carries all `<head>` SEO** via `<svelte:head>`: title, OG,
Twitter, canonical, icons, and one JSON-LD `@graph` (Organization + WebSite +
SoftwareApplication). The JSON-LD `</script>` tag is split across a string
concat so it can't prematurely close the component's own script element — keep
that pattern if you edit it. Schema values must mirror the visible page (name,
descriptor, GitHub link).

**`src/hooks.server.ts` splices two things into the static `<head>` at prerender
time**, via `transformPageChunk` replacing placeholders in `src/app.html`:

1. The `@qovira/theme` pre-paint boot (`<!--qovira:head-->`) — imported verbatim
   from `@qovira/theme/boot`, **never re-implemented**. It must sit _before_ the
   stylesheets so `data-theme` is on `<html>` before first paint (no flash),
   plus media-scoped `theme-color` metas (Evening `#15100C` dark / Daylight
   `#F1E9DC` light).
2. The Plausible beacon (`<!--qovira:analytics-->`) — injected **only** in
   production builds (`import.meta.env.PROD`); resolves to `""` under `vite dev`.
   Cookieless, no banner, default pageview only. Replacers are functions so any
   `$`-sequence in the injected strings isn't read as a replacement pattern.

**CSS (`src/app.css`)** imports Tailwind v4, then `@qovira/theme`,
`@qovira/theme/fonts`, and `@qovira/ui`. The `@qovira/ui` import is **required**
and load-bearing: the library ships uncompiled `.svelte` source, so this import
(resolving via its `style` export) is what registers its components with
Tailwind v4 — `@source "@qovira/ui"` does **not** work (resolves to the JS
entry, components render unstyled). The theme styles tokens but leaves the page
surface to the consumer, so `app.css` paints `html` with `--bg`/`--text`.

## Brand assets (maintenance only — not part of the build)

The OG card and favicon/app-icon set (the Keyhole-Q mark) under `static/` are
**generated and committed**; CI does not run this. SVG masters live in
`assets/brand/`; `pnpm assets` (`scripts/build-brand-assets.sh`) regenerates the
raster outputs. The OG card is rendered with the theme's own self-hosted fonts
(Fraunces + JetBrains Mono), instanced from `@qovira/theme`'s variable woff2, so
it matches the live page's type. Edit a master, run `pnpm assets`, commit the
regenerated files. Requires host tools (not npm deps): `woff2_decompress`,
`fonttools`, `rsvg-convert` (librsvg), `magick` (ImageMagick 7), `fc-cache`.

## CI & deploy

`.github/workflows/ci.yml`: **verify** (on every PR + push to main) →
**deploy** (only on push to `main`, after verify passes). Verify runs
`pnpm check`, `pnpm lint`, `pnpm test` on a Blacksmith runner (house rule: every
job runs on Blacksmith). Deploy uploads `build/` to Bunny Storage
(`.github/scripts/bunny-deploy.sh`, native Storage HTTP API, one PUT per file)
then purges the pull zone. Deploys are serialized and non-cancelable.
**Cache-Control is enforced by Bunny Pull Zone edge rules, not in code** —
fingerprinted `_app/immutable/*` get a 1-year immutable TTL, everything else a
short revalidate TTL (documented in `ci.yml`).

## Conventions

- **Keep `CLAUDE.md` and `README.md` current.** Both are documentation that must
  track reality: when a change alters something either file describes (commands,
  architecture, the head/SEO or deploy setup, conventions), update the affected
  doc automatically in the **same** change — never leave it as a follow-up. Stale
  docs silently mislead every future reader and session.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `ci:`, `chore:`, `test:`).
- **Branches:** `project/<name>` (e.g. `project/placeholder-site`); PRs target `main`.
- **Runes mode** is forced for project files (`svelte.config.js`); use Svelte 5
  runes (`$props`, `$state`, …).
- Work items are tracked in Linear (codes like `QOV-29` appear in comments).

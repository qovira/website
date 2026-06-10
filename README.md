# qovira.ai — placeholder site

The static "under construction" page for [**qovira.ai**](https://qovira.ai) — a single,
fully prerendered SvelteKit route that announces Qovira before the product ships. It is
dressed entirely in [`@qovira/theme`](https://www.npmjs.com/package/@qovira/theme) +
[`@qovira/ui`](https://www.npmjs.com/package/@qovira/ui) (its first real-world consumer)
and deploys as static files to Bunny Storage behind Bunny CDN.

Built with SvelteKit 2 / Svelte 5 on `@sveltejs/adapter-static` — `pnpm build` emits a
content-baked `build/index.html` that crawlers and LLM fetchers read without running JS.

## Prerequisites

- Node `>=24`
- pnpm `11.3.0` (pinned via `packageManager`)

## Develop

```sh
pnpm install
pnpm dev        # start the dev server (add --open to launch a browser)
```

## Build

```sh
pnpm build      # prerender to build/
pnpm preview    # serve the production build locally
```

## Verify

```sh
pnpm check      # svelte-check (types + a11y)
pnpm lint       # prettier --check + eslint
pnpm test       # Playwright smoke + accessibility
```

`pnpm test` runs against the real prerendered build (it builds and previews
`build/`, not the dev server). The browser isn't auto-installed — once per
machine:

```sh
pnpm exec playwright install --with-deps chromium
```

## Brand assets

The OG/social card and the favicon/app-icon set (the Keyhole-Q mark) are
committed under `static/` and served as-is. They are **generated**, not
hand-edited: the SVG masters live in `assets/brand/` and the raster outputs are
rebuilt by

```sh
pnpm assets     # scripts/build-brand-assets.sh
```

The OG card is rendered with the theme's own self-hosted fonts — Fraunces and
JetBrains Mono are instanced from `@qovira/theme`'s variable woff2 to the brand's
display/mono weights — so the card always matches the live page's type. Edit a
master in `assets/brand/`, run `pnpm assets`, and commit the regenerated files.

Requires these host tools (not npm deps): `woff2_decompress`, `fonttools`,
`rsvg-convert` (librsvg), `magick` (ImageMagick 7), `fc-cache`.

## Deploy

Deploys itself — there's nothing to run by hand. On a green push to `main`, CI
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the full gate on
Blacksmith, then ships the prerendered `build/` to Bunny Storage behind the Bunny
CDN pull zone serving qovira.ai and purges the zone so the change is live
immediately. It's deployed, not versioned — a marketing page, so no releases or
changelog. Rollback is re-running the deploy on a prior commit.

## Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md)
for the workflow and scope, and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). In
short: the page defines no visual values of its own — everything comes from
`@qovira/theme` through `@qovira/ui` — and it must stay accessible (the test
fails on any axe violation).

## License

[AGPL-3.0-only](./LICENSE).

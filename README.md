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

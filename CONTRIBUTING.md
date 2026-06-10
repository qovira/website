# Contributing to the Qovira website

Thanks for your interest in **qovira.ai** — the static placeholder site for
[Qovira](https://github.com/qovira/qovira). It's a single, fully prerendered
SvelteKit page, dressed entirely in [`@qovira/theme`](https://github.com/qovira/theme)
and [`@qovira/ui`](https://github.com/qovira/ui), and shipped as static files to
Bunny CDN. It's a small, focused surface — but we're glad to have help keeping it
sharp.

## Ground rules

- **Open an issue first.** Before sending a pull request — especially anything
  that changes copy, layout, the `<head>`/SEO, or the build — open an issue so we
  can agree on the approach. Typo fixes and obviously correct documentation
  tweaks can skip straight to a PR.
- **Be kind.** This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).
  By participating you're expected to uphold it; please report unacceptable
  behavior to the address listed there.
- **Licensing.** The project is [AGPL-3.0-only](./LICENSE). Any contribution you
  submit for inclusion is licensed under those same terms (inbound = outbound) —
  opening a pull request is all the agreement we need. There's no CLA and no
  per-commit sign-off to remember.

## What belongs here

This is a **marketing holding page**, not a product or a component library. It
**defines no visual values of its own**: every color, font, radius, shadow, and
motion comes from `@qovira/theme`, composed through `@qovira/ui` components.
Keeping that boundary tight is what lets the page always match the rest of the
brand.

**In scope** — contributions we welcome:

- Copy, SEO, and metadata fixes (the page's text, `<head>` tags, JSON-LD,
  `llms.txt`, `robots.txt`, `sitemap.xml`).
- Accessibility fixes — keyboard interaction, ARIA, focus management, anything
  that improves an axe result.
- Bug fixes (a rendering edge case, a broken link, a theme-flash regression).
- Documentation, build, and tooling improvements.

**Out of scope** — please don't open a PR for these:

- **Hard-coded visual values.** A raw hex color, a magic `px` radius, a bespoke
  shadow — none of these belong here. A surface that needs a token the theme
  doesn't expose is a signal to **extend `@qovira/theme`**, not to hard-code the
  value here; see [Cross-repo changes](#cross-repo-changes) below.
- **A component that belongs upstream.** Anything reusable belongs in
  `@qovira/ui`, not inlined into this one page.
- **A second styling system.** No CSS-in-JS, no competing token set. The theme's
  utilities (composed via `@qovira/ui`) are the only styling vocabulary.
- **Turning the holding page into the product.** This repo is, by design, one
  prerendered page until the product ships.

## Getting set up

You'll need **Node ≥ 24** and **pnpm** — pnpm is the only supported package
manager (npm and yarn are not used here). The pnpm version is pinned in
`package.json`; the easiest way to match it is [Corepack](https://nodejs.org/api/corepack.html),
which ships with Node:

```sh
corepack enable          # one-time; activates the pinned pnpm
pnpm install
```

The end-to-end test renders the real build in a browser, so install it once:

```sh
pnpm exec playwright install --with-deps chromium
```

The scripts that cover the workflow:

```sh
pnpm dev          # vite dev server (--open to launch a browser)
pnpm build        # prerender the static site to build/
pnpm preview      # serve the production build locally
pnpm check        # svelte-check — types + a11y (this IS the typecheck)
pnpm lint         # prettier --check . && eslint .
pnpm test         # Playwright smoke + accessibility, against the real build/
```

Run `pnpm format` to apply Prettier. Before you open a PR, the full gate below
should pass — that's exactly what CI runs.

## How the codebase is organized

It's one prerendered SvelteKit route. A few files carry most of the weight:

| Path                            | What it is                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/routes/+page.svelte`       | The page itself, plus all `<head>` SEO (OG/Twitter/canonical/icons) and the JSON-LD `@graph`.    |
| `src/lib/site.ts`               | **Single source of truth** for site metadata — name, descriptor, URLs. Edit copy here, not inline. |
| `src/hooks.server.ts`           | Splices the theme pre-paint boot and the prod-only Plausible beacon into the static `<head>`.     |
| `src/app.css`                   | Imports Tailwind v4, `@qovira/theme`, its fonts, and `@qovira/ui` (the UI import is load-bearing).|
| `static/`                       | Generated brand assets + `llms.txt`, `robots.txt`, `sitemap.xml`, icons, manifest.               |
| `assets/brand/`                 | SVG masters for the brand assets; outputs rebuilt by `pnpm assets`.                               |

The page is rendered once at build time (`+layout.ts`: `prerender = true`). More
architecture detail lives in `CLAUDE.md`.

## A few load-bearing conventions

- **Edit copy in `src/lib/site.ts`**, not in the markup — the on-page lead,
  `og:description`, JSON-LD, and meta description all derive from it, and that's
  what keeps them in sync.
- **Theme utilities only**, composed through `@qovira/ui` components. No raw
  colors or off-grid values (see [What belongs here](#what-belongs-here)).
- **Keep accessibility green.** The page must pass axe with zero violations —
  that's enforced by the test, not aspirational.
- **The theme boot is imported verbatim** from `@qovira/theme/boot`, never
  re-implemented; it must stay ahead of the stylesheets so there's no theme
  flash.

## Brand assets

The OG card and favicon/app-icon set under `static/` are **generated and
committed** — CI does not rebuild them. If a brand master or the theme fonts
change, edit the SVG in `assets/brand/`, run `pnpm assets`
(`scripts/build-brand-assets.sh`), and commit the regenerated files. This needs
host tools that aren't npm dependencies (`woff2_decompress`, `fonttools`,
`rsvg-convert`, `magick`, `fc-cache`); see the README for details. Most
contributions won't touch these.

## Cross-repo changes

This site consumes the **published** `@qovira/theme` and `@qovira/ui` from npm —
it is the furthest-downstream consumer. If your change needs a token or a
component the upstream packages don't expose, **don't hard-code it here** — the
fix belongs upstream:

1. Open an issue (here and/or on the relevant upstream repo) describing the gap.
2. The token/component lands and is released in `@qovira/theme` or `@qovira/ui`.
3. This repo bumps its dependency and consumes the new release.

A contributor PR can't span repos, so note the dependency in your issue and a
maintainer will help sequence the upstream release.

## Opening a pull request

Once there's an issue and your change is ready:

1. **Branch** off `main` and make your change there.
2. **Keep it scoped.** One logical change per PR. A focused diff is reviewed
   faster than a sweeping one.
3. **Run the full gate locally** — `pnpm check && pnpm lint && pnpm test` —
   before you push. CI runs exactly these, and they must be green to merge.
4. **Write a clear PR description.** Say what changed and why, and link the issue
   it resolves.

### Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) on `main`,
but **you don't have to**. PRs are squash-merged, and a maintainer writes the
final Conventional Commit message on merge. So:

- Give the **PR** a clear, descriptive title and a useful description — that's
  what we work from.
- Your individual commits can be whatever helps you; they won't survive the
  squash.
- You may notice `QOV-…` identifiers in our commit history. Those are internal
  Linear references and are **maintainer-only** — please don't add them, and
  never put them in source, comments, or docs. The codebase stands on its own.

### Review

A maintainer will review for correctness, scope, accessibility (does it pass
axe?), and fit with the theme-utilities-only boundary. Expect a conversation —
it's how we keep the surface coherent. Once it's approved and green, we squash
and merge.

## Publishing

Publishing is **maintainers only** — there's nothing for a contributor to do
here, but it's documented so the process isn't a mystery. This site is published
by being **deployed live**, not as a versioned package: it's a marketing site,
so there are **no Changesets, no semver, and no changelog** — a change to the
holding page isn't a release users track or depend on. (It's also not an npm
package and is not meant to be self-hosted.)

On a green push to `main`, CI runs the full gate on Blacksmith and then ships the
prerendered `build/` to Bunny Storage behind the Bunny CDN pull zone serving
qovira.ai, purging the zone so the change is live immediately. Rollback is
re-running the deploy on a prior commit.

---

Thanks again for contributing. Questions that aren't a bug report are welcome as
issues too — if something here is unclear, that's worth an issue of its own.

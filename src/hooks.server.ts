import type { Handle } from "@sveltejs/kit";
import { boot } from "@qovira/theme/boot";

// The pre-paint theme boot must sit in <head> before any stylesheet so
// `data-theme` is on <html> before first paint (no flash). app.html is static
// and `%sveltekit.head%` is injected too late, so we splice the boot — taken
// verbatim from @qovira/theme, never re-implemented — into a placeholder ahead
// of it. This runs during prerender, so it's baked into the static HTML.
//
// Per-theme `theme-color` metas are media-scoped: with no stored choice the
// boot resolves to `prefers-color-scheme`, so the browser chrome matches the
// resolved theme (Evening #15100C on dark, Daylight #F1E9DC on light).
const themeHead = [
  `<script>${boot}</script>`,
  `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#15100C" />`,
  `<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F1E9DC" />`,
].join("\n    ");

// Plausible — a cookieless, no-banner analytics beacon, injected only in
// production builds (`import.meta.env.PROD`); under `vite dev` it resolves to ""
// so nothing loads. Default pageview only, no custom events. The standard
// first-party-able script; serving it behind qovira.ai via the Bunny edge is a
// deploy-time refinement (QOV-33), not required here. This is a marketing
// surface, so it doesn't touch the self-hosted product's "nothing phones home".
const analytics = import.meta.env.PROD ? `<script defer data-domain="qovira.ai" src="https://plausible.io/js/script.js"></script>` : "";

export const handle: Handle = ({ event, resolve }) =>
  resolve(event, {
    // Function replacers: the injected strings are opaque, so never let any
    // `$`-sequence in them be read as a replacement pattern.
    transformPageChunk: ({ html }) => html.replace("<!--qovira:head-->", () => themeHead).replace("<!--qovira:analytics-->", () => analytics),
  });

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

export const handle: Handle = ({ event, resolve }) =>
  resolve(event, {
    // Function replacer: `themeHead` is a black-box string from the package, so
    // never let `$`-sequences in it be interpreted as replacement patterns.
    transformPageChunk: ({ html }) => html.replace("<!--qovira:head-->", () => themeHead),
  });

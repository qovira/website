// The placeholder is a single, fully-prerendered static route: SSR on, no SPA
// fallback (there are no dynamic routes, so a fallback would only mask 404s).
// CSR off — the page has zero interactivity, so it ships as pure HTML/CSS with
// no client hydration runtime (best LCP/CLS). The inline theme boot and the
// Plausible beacon live in <head> and are independent of CSR. This also avoids
// the dev-only "removing comments in transformPageChunk" warning, which fires
// only under CSR when hooks.server.ts replaces the <head> placeholder comments.
export const prerender = true;
export const ssr = true;
export const csr = false;
export const trailingSlash = "never";

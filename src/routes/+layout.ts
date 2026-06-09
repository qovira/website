// The placeholder is a single, fully-prerendered static route: SSR on, no SPA
// fallback (there are no dynamic routes, so a fallback would only mask 404s).
export const prerender = true;
export const ssr = true;
export const trailingSlash = "never";

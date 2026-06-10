import { site } from "$lib/site";

// Prerendered to build/sitemap.xml. `lastmod` is stamped at build time so it
// tracks each deploy instead of drifting stale, which a hand-edited static file
// did. The single URL mirrors site.ts (the root is the only page).
export const prerender = true;

export function GET() {
  // YYYY-MM-DD of the build — the moment this placeholder was last republished.
  const lastmod = new Date().toISOString().slice(0, 10);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml" },
  });
}

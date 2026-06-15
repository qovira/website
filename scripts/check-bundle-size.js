// Bundle-size budget — a deterministic tripwire against JS-bloat regressions.
//
// The kind this guards against: a barrel import of an icon/utility library that
// lacks `sideEffects: false` inlines the WHOLE library into a route chunk. That
// is exactly what tanked LCP here once — phosphor-svelte's entire ~3,000-icon set
// landed in one node chunk (8.4 MB raw / ~1 MB brotli), invisible in dev and on
// fast networks, only surfacing as a wrecked LCP under throttled Lighthouse.
//
// This is NOT a tight budget that churns on every refactor — it's a generous
// ceiling (~4x current) that fails CI only on catastrophic growth, which the
// regression above blows past by 20-40x. Sizes are RAW (uncompressed) bytes: the
// CDN serves these brotli'd, but raw is what's deterministic at build time and
// what a barrel-import regression inflates hugely regardless of compression.
// Tighten the caps as the site's real budget firms up.

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIR = "build/_app/immutable";
const PER_FILE_MAX_KB = 200;
const TOTAL_MAX_KB = 400;

/** All `.js` chunks under the immutable build dir, recursively. */
function collectChunks(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    console.error(`✗ ${dir} not found — run \`pnpm build\` before the bundle-size check.`);
    process.exit(1);
  }
  const chunks = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) chunks.push(...collectChunks(full));
    else if (entry.name.endsWith(".js")) chunks.push({ path: full, kb: statSync(full).size / 1024 });
  }
  return chunks;
}

const chunks = collectChunks(DIR).sort((a, b) => b.kb - a.kb);
const totalKb = chunks.reduce((sum, c) => sum + c.kb, 0);
const overweight = chunks.filter((c) => c.kb > PER_FILE_MAX_KB);
const overTotal = totalKb > TOTAL_MAX_KB;

console.log(`Bundle-size budget (raw JS under ${DIR})`);
for (const c of chunks) {
  const flag = c.kb > PER_FILE_MAX_KB ? "  ✗ over per-file cap" : "";
  console.log(`  ${c.kb.toFixed(1).padStart(8)} KB  ${c.path}${flag}`);
}
console.log(`  ${"—".repeat(8)}`);
console.log(
  `  ${totalKb.toFixed(1).padStart(8)} KB  total (${chunks.length} files)${overTotal ? "  ✗ over total cap" : ""}`,
);

if (overweight.length || overTotal) {
  console.error("");
  if (overweight.length)
    console.error(`✗ ${overweight.length} chunk(s) exceed the ${PER_FILE_MAX_KB} KB per-file cap.`);
  if (overTotal) console.error(`✗ total JS ${totalKb.toFixed(1)} KB exceeds the ${TOTAL_MAX_KB} KB cap.`);
  console.error("  A common cause is a barrel import dragging a whole library in — deep-import instead.");
  process.exit(1);
}

console.log(
  `\n✓ Within budget (largest ${chunks[0]?.kb.toFixed(1) ?? 0} KB ≤ ${PER_FILE_MAX_KB} KB/file, total ≤ ${TOTAL_MAX_KB} KB).`,
);

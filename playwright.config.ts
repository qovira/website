/// <reference types="node" />
import { defineConfig, devices } from "@playwright/test";

// The site is one fully-static page, so the suite is one spec. It runs against
// the real prerendered output: `webServer` builds (`vite build`, which is PROD —
// the head boot and Plausible beacon are baked in) then serves `build/` via
// `vite preview`, and the tests hit that. Never the dev server — we test what
// ships, not an SSR/HMR approximation.
const PORT = 4173;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Sharded CI merges blob reports into one HTML report (writing-playwright);
  // a readable list locally.
  reporter: process.env.CI ? "blob" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      // Evening is the brand's marketing default; emulate a dark
      // `prefers-color-scheme` so the pre-paint boot resolves to it (QOV-27).
      use: { ...devices["Desktop Chrome"], colorScheme: "dark" },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

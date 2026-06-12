// Canonical site metadata — the single source of truth shared by the visible
// page and the <head>. Keeping the descriptor here (rather than inline in the
// markup) is what keeps the on-page lead, og:description, JSON-LD, and the meta
// description in sync. Immutable static config — safe at module scope.

export const site = {
  /** Canonical origin (trailing slash; the root is the only URL). */
  url: "https://qovira.ai/",
  name: "Qovira",
  /** Brand SERP title — name first. */
  title: "Qovira — Your assistant. Yours alone.",
  /**
   * The brand's canonical descriptor, used verbatim: on-page lead,
   * og:description, and JSON-LD description (Brand & Design — Tagline & Boilerplate).
   */
  descriptor:
    "Qovira is a private, self-hostable personal assistant — reminders, notes, calendar, and quick answers, organized by AI that runs on a server you own and a model you choose.",
  /**
   * A ≤155-char trim of the descriptor for <meta name="description"> only, so
   * the SERP snippet renders in full (the descriptor itself is 172 chars and
   * would be clipped). Faithful to the descriptor — drops only "personal" and
   * "that runs". See the approved note on QOV-29.
   */
  metaDescription:
    "Qovira is a private, self-hostable assistant — reminders, notes, calendar, and quick answers, organized by AI on a server you own and a model you choose.",
  /**
   * Absolute URL of the 1200×630 OG card (QOV-28). JPEG, not WebP: LinkedIn and
   * several unfurl scrapers don't render WebP previews. See build-brand-assets.sh.
   */
  ogImage: "https://qovira.ai/og-card.jpg",
  /** The Keyhole-Q logo, absolute, for Organization JSON-LD. */
  logo: "https://qovira.ai/icon-512.png",
  /** The one outbound link, also the Organization sameAs. */
  github: "https://github.com/qovira/qovira",
} as const;

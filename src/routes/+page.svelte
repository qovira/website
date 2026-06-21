<script lang="ts">
  import { Container, Stack, Heading, Text, Badge, Icon } from "@qovira/ui";
  import GithubLogoIcon from "phosphor-svelte/lib/GithubLogoIcon";
  import { site } from "$lib/site";

  // One JSON-LD @graph — Organization + WebSite + SoftwareApplication. Values
  // mirror the visible page (schema accuracy rule): name, the descriptor, and
  // the GitHub link all match what's rendered below. The SoftwareApplication
  // node hands an AI agent Qovira's product shape in one parseable object.
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.url}#organization`,
        name: site.name,
        url: site.url,
        logo: site.logo,
        sameAs: [site.github],
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}#website`,
        name: site.name,
        url: site.url,
        publisher: { "@id": `${site.url}#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${site.url}#app`,
        name: site.name,
        applicationCategory: "ProductivityApplication",
        operatingSystem: "Self-hosted (Linux/Docker)",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: site.descriptor,
        url: site.url,
        publisher: { "@id": `${site.url}#organization` },
      },
    ],
  });
  // Built here (not in the template); the closing tag is split across a string
  // concat so it can't prematurely close this component's own script element.
  const jsonLdScript = `<script type="application/ld+json">${jsonLd}</scr` + `ipt>`;
</script>

<svelte:head>
  <title>{site.title}</title>
  <meta name="description" content={site.metaDescription} />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href={site.url} />

  <!-- Favicons & app icons (served from the static root) -->
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />

  <!-- Open Graph — drives the social / LLM-chat unfurl -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={site.name} />
  <meta property="og:title" content={site.title} />
  <meta property="og:description" content={site.descriptor} />
  <meta property="og:url" content={site.url} />
  <meta property="og:image" content={site.ogImage} />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={site.ogImageAlt} />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={site.title} />
  <meta name="twitter:description" content={site.descriptor} />
  <meta name="twitter:image" content={site.ogImage} />
  <meta name="twitter:image:alt" content={site.ogImageAlt} />

  <!-- Structured data. Safe: jsonLdScript is fully static, developer-authored
       JSON-LD with no user input (the XSS concern the rule guards against). -->
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html jsonLdScript}
</svelte:head>

<main class="hero relative grid min-h-svh place-items-center overflow-hidden px-4 py-16">
  <!-- The room's edges fall to shadow so the single lamp reads as the only light
       source. Decorative; darkens only the empty margins, never behind text, so
       contrast is untouched. -->
  <div aria-hidden="true" class="vignette"></div>

  <Container width="prose">
    <div class="content relative isolate">
      <!-- The lamp — hung above the wordmark, its warmth pooling down over the
           headline. The signature lamp-glow motif (Brand & Design): a soft honey
           radial, breathing slowly like a real flame. The reduced-motion guard
           freezes it to a still glow (the resting state below is the lit one). -->
      <div aria-hidden="true" class="lamp">
        <div class="lamp-halo"></div>
        <div class="lamp-core"></div>
      </div>

      <Stack gap={6} align="center" class="text-center">
        <!-- Wordmark — capital Q, the i lit honey, glowing like the room's pilot light -->
        <p class="wordmark font-display text-h3 tracking-tight">Qov<span class="pilot text-accent">i</span>ra</p>

        <!-- Hero headline, lit by the lamp above -->
        <Heading level={1} size="display" class="headline">{site.headline}</Heading>

        <!-- Descriptor — the plain definition (doubles as the AEO answer + meta description) -->
        <Text variant="lead">{site.descriptor}</Text>

        <!-- Status tag — the honey dot breathes with the lamp: quietly on -->
        <Badge variant="neutral" class="gap-2 font-mono">
          <span aria-hidden="true" class="pilot text-accent">●</span>
          COMING SOON · OPEN SOURCE
        </Badge>

        <!-- One quiet footer link to the product repo -->
        <Text variant="small" as="p">
          <!-- External absolute URL, not SvelteKit navigation — resolve() does not apply. -->
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
          <a href={site.github} class="repo-link focus-ring text-link hover:underline">
            <Icon icon={GithubLogoIcon} decorative />
            github.com/qovira/qovira
          </a>
        </Text>
      </Stack>
    </div>
  </Container>
</main>

<style>
  /* ───────────────────────────────────────────────────────────────────────
   * "The warm sanctuary, lamplit." One light source: a honey lamp pooling over
   * the hero, the room's edges falling to shadow. Everything here is the
   * lamp-glow motif (Brand & Design) — decorative, accent-as-light only. Ambient
   * motion is gated behind `prefers-reduced-motion: no-preference`; the resting
   * state is the lit one, so the still fallback already looks finished.
   * ─────────────────────────────────────────────────────────────────────── */

  .hero {
    /* One stacking context for the scene: vignette (0) < lamp (-1, raised by
       .content) < content (1). */
    isolation: isolate;
  }

  /* The room's shadowed edges, framing the lamplit centre. `farthest-corner`
     anchors the dark end-stop AT the corners — a sized ellipse (e.g. 120%) puts
     its radius well past the viewport, so the corners only reach a fraction of
     the ramp and the falloff washes out (especially on cream). */
  .vignette {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    /* Evening (default): edges fall to black — the brand's evening shadow.
       Espresso (#1e1712) reads *lighter* than the #15100c field, so black is what
       actually darkens here. */
    background: radial-gradient(ellipse farthest-corner at 50% 42%, transparent 32%, rgba(0, 0, 0, 0.62) 100%);
  }
  /* Daylight: a warm (espresso-tinted) edge shadow on cream. */
  :global([data-theme="daylight"]) .vignette {
    background: radial-gradient(
      ellipse farthest-corner at 50% 42%,
      transparent 32%,
      color-mix(in srgb, #1e1712 38%, transparent) 100%
    );
  }

  .content {
    z-index: 1; /* lifts the scene (and its lamp) above the vignette */
  }

  /* The lamp: hung above the wordmark, pooling down over the headline. */
  .lamp {
    position: absolute;
    left: 50%;
    top: 0;
    z-index: -1; /* behind the text, above the vignette (within .content) */
    width: 132%;
    aspect-ratio: 7 / 4;
    pointer-events: none;
    transform: translate(-50%, -10%);
  }

  .lamp-halo,
  .lamp-core {
    position: absolute;
    border-radius: var(--radius-full);
  }

  /* Wide soft halo — the warmth filling the room. */
  .lamp-halo {
    inset: 0;
    background: radial-gradient(circle, color-mix(in srgb, var(--color-honey-500) 30%, transparent), transparent 70%);
    filter: blur(26px);
  }

  /* Tighter brighter core — the bulb itself, centred over the headline. */
  .lamp-core {
    inset: 14% 18%;
    background: radial-gradient(circle, color-mix(in srgb, var(--color-honey-500) 46%, transparent), transparent 62%);
    filter: blur(12px);
  }
  /* On cream the honey reads softer, so the pool is warmed up a touch to stay legible. */
  :global([data-theme="daylight"]) .lamp-core {
    background: radial-gradient(circle, color-mix(in srgb, var(--color-honey-500) 52%, transparent), transparent 64%);
  }

  /* The lit honey letters — the wordmark i and the status dot — carry a soft
     halo so they read as actually lamplit, not merely coloured. */
  .pilot {
    text-shadow: 0 0 12px color-mix(in srgb, var(--color-honey-500) 55%, transparent);
  }

  /* Warm display type — the brand's gentle SOFT axis for rounded warmth, WONK
     off (calm, not quirky), opsz pinned to the display optical cut. */
  .wordmark,
  :global(.headline) {
    font-variation-settings:
      "opsz" 144,
      "SOFT" 30,
      "WONK" 0;
  }

  /* The one quiet link, warming on hover — clay, AA in both themes (clay-700 on
     cream, clay-400 on espresso). */
  .repo-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem; /* gap-1.5 */
    border-radius: var(--radius-sm);
    transition: color var(--duration-base) var(--ease-qovira);
  }
  .repo-link:hover {
    color: var(--accent-clay);
  }

  /* Ambient life — gated so the resting state above is the still fallback the
     reduced-motion guard keeps. */
  @media (prefers-reduced-motion: no-preference) {
    /* The room lights up once on load… */
    .content {
      animation: warm-up 800ms var(--ease-qovira) both;
    }
    /* …then the lamp breathes slowly, like a real flame settling in. */
    .lamp {
      animation:
        lamp-in 900ms var(--ease-qovira) both,
        lamp-breathe 7s ease-in-out 900ms infinite;
    }
    .pilot {
      animation: pilot-breathe 7s ease-in-out 900ms infinite;
    }
  }

  @keyframes warm-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes lamp-in {
    from {
      opacity: 0;
      transform: translate(-50%, -10%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -10%) scale(1);
    }
  }

  @keyframes lamp-breathe {
    0%,
    100% {
      opacity: 0.88;
      transform: translate(-50%, -10%) scale(0.99);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -10%) scale(1.03);
    }
  }

  @keyframes pilot-breathe {
    0%,
    100% {
      text-shadow: 0 0 9px color-mix(in srgb, var(--color-honey-500) 45%, transparent);
    }
    50% {
      text-shadow: 0 0 16px color-mix(in srgb, var(--color-honey-500) 70%, transparent);
    }
  }
</style>

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

  <!-- Favicons & app icons (assets produced in QOV-28, served from the static root) -->
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

<main class="grid min-h-svh place-items-center px-4 py-16">
  <Container width="prose">
    <Stack gap={6} align="center" class="text-center">
      <!-- Wordmark — capital Q, the i lit honey -->
      <p class="font-display text-h3 tracking-tight">Qov<span class="text-accent">i</span>ra</p>

      <!-- Hero headline, with the signature lamp-glow behind it -->
      <div class="relative isolate">
        <div aria-hidden="true" class="glow-wrap">
          <div class="glow lamp-glow-pulse"></div>
        </div>
        <Heading level={1} size="display">{site.headline}</Heading>
      </div>

      <!-- Descriptor — the plain definition (doubles as the AEO answer + meta description) -->
      <Text variant="lead">{site.descriptor}</Text>

      <!-- Status tag -->
      <Badge variant="neutral" class="gap-2 font-mono">
        <span aria-hidden="true" class="text-accent">●</span>
        COMING SOON · OPEN SOURCE
      </Badge>

      <!-- One quiet footer link to the product repo -->
      <Text variant="small" as="p">
        <!-- External absolute URL, not SvelteKit navigation — resolve() does not apply. -->
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a href={site.github} class="focus-ring inline-flex items-center gap-1.5 rounded-sm text-link hover:underline">
          <Icon icon={GithubLogoIcon} decorative />
          github.com/qovira/qovira
        </a>
      </Text>
    </Stack>
  </Container>
</main>

<style>
  /* The lamp-glow: a soft honey radial behind the headline. The wrapper holds
     the centering; the inner element carries the theme's `lamp-glow-pulse`
     (its keyframe drives transform: scale, which must not fight the centering
     translate). The theme's global reduced-motion guard freezes the pulse, so
     a static glow remains as the still fallback. */
  .glow-wrap {
    position: absolute;
    inset: 0;
    z-index: -1;
    display: grid;
    place-items: center;
    pointer-events: none;
  }

  .glow {
    width: 140%;
    aspect-ratio: 7 / 5;
    border-radius: 9999px;
    background: radial-gradient(circle, color-mix(in srgb, var(--color-honey-500) 42%, transparent), transparent 68%);
    filter: blur(12px);
  }
</style>

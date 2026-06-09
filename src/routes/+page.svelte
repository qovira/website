<script lang="ts">
  import { Container, Stack, Heading, Text, Badge, Icon } from "@qovira/ui";
  import { GithubLogo } from "phosphor-svelte";
</script>

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
        <Heading level={1} size="display">The assistant that never leaves the room.</Heading>
      </div>

      <!-- Descriptor — the plain definition (doubles as the AEO answer + meta description) -->
      <Text variant="lead">
        Qovira is a private, self-hostable personal assistant — reminders, notes, calendar, and quick answers, organized by AI that runs on a server you own and a model you choose.
      </Text>

      <!-- Status tag -->
      <Badge variant="neutral" class="gap-2 font-mono">
        <span aria-hidden="true" class="text-accent">●</span>
        COMING SOON · OPEN SOURCE
      </Badge>

      <!-- One quiet footer link to the product repo -->
      <Text variant="small" as="p">
        <a href="https://github.com/qovira/qovira" class="focus-ring inline-flex items-center gap-1.5 rounded-sm text-link hover:underline">
          <Icon icon={GithubLogo} decorative />
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

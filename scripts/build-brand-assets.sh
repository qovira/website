#!/usr/bin/env bash
# Regenerate the committed brand assets (OG card + favicon/app-icon set) from
# the SVG masters in assets/brand/, writing the served files into static/.
#
# The outputs are committed — CI does not run this; it's a maintenance tool, run
# by hand when a master or the brand fonts change. The OG card is rendered with
# the theme's OWN self-hosted fonts (Fraunces + JetBrains Mono), instanced from
# @qovira/theme's variable woff2 to the brand's display/mono weights, so the
# card always matches the live site's type.
#
# Host tools required: woff2_decompress, fonttools, rsvg-convert (librsvg),
# magick (ImageMagick 7), fc-cache. See README "Brand assets".
set -euo pipefail
cd "$(dirname "$0")/.."

# Fail loud and early if a required host tool is missing.
for tool in woff2_decompress fonttools rsvg-convert magick fc-cache; do
  command -v "$tool" >/dev/null 2>&1 || { echo "✗ missing required host tool: $tool" >&2; exit 1; }
done

SRC=assets/brand
OUT=static
WORK=.asset-build
THEME_FONTS=node_modules/@qovira/theme/dist/fonts
FONTROOT="$WORK/fontroot"

echo "› preparing fonts from @qovira/theme"
rm -rf "$WORK"
mkdir -p "$WORK/fonts" "$FONTROOT/.fonts"
cp "$THEME_FONTS/fraunces-variable.woff2" "$THEME_FONTS/jetbrains-mono-variable.woff2" "$WORK/fonts/"
# woff2_decompress writes a sibling <name>.ttf (status line on stdout); assert it.
( cd "$WORK/fonts" && woff2_decompress fraunces-variable.woff2 >/dev/null && woff2_decompress jetbrains-mono-variable.woff2 >/dev/null )
for ttf in fraunces-variable jetbrains-mono-variable; do
  [ -s "$WORK/fonts/$ttf.ttf" ] || { echo "✗ woff2_decompress produced no $ttf.ttf" >&2; exit 1; }
done
# Instance the variable fonts to the brand's display/mono settings.
fonttools varLib.instancer -q "$WORK/fonts/fraunces-variable.ttf" \
  opsz=144 wght=500 SOFT=50 WONK=0 -o "$FONTROOT/.fonts/fraunces-display.ttf" >/dev/null
fonttools varLib.instancer -q "$WORK/fonts/jetbrains-mono-variable.ttf" \
  wght=400 -o "$FONTROOT/.fonts/jbmono.ttf" >/dev/null
HOME="$PWD/$FONTROOT" fc-cache -f "$PWD/$FONTROOT/.fonts" >/dev/null 2>&1

render() { HOME="$PWD/$FONTROOT" rsvg-convert "$@"; }

echo "› OG card (1200x630)"
render -w 1200 -h 630 "$SRC/og-card.svg" -o "$WORK/og-card.png"
# JPEG, not WebP: LinkedIn, Facebook, and several other unfurl scrapers don't
# render WebP link previews (they'd show a card with no image). JPEG is rendered
# everywhere and compresses the card's film-grain glow far better than a lossless
# PNG (which ballooned to ~660KB). 4:4:4 (no chroma subsampling) keeps the radial
# gradient banding-free; at ~66KB the larger-than-WebP file is irrelevant to a
# one-time unfurl fetch.
magick "$WORK/og-card.png" -strip -interlace JPEG -quality 88 -sampling-factor 4:4:4 "$OUT/og-card.jpg"

echo "› favicon / app-icon set (Keyhole Q)"
render -w 512 -h 512 "$SRC/icon.svg" -o "$OUT/icon-512.png"
render -w 192 -h 192 "$SRC/icon.svg" -o "$OUT/icon-192.png"
render -w 180 -h 180 "$SRC/icon.svg" -o "$OUT/apple-touch-icon.png"
render -w 400 -h 400 "$SRC/icon.svg" -o "$OUT/avatar.png"
render -w 32  -h 32  "$SRC/icon.svg" -o "$WORK/favicon-32.png"
render -w 16  -h 16  "$SRC/icon.svg" -o "$WORK/favicon-16.png"
cp "$WORK/favicon-32.png" "$OUT/favicon-32.png"
cp "$WORK/favicon-16.png" "$OUT/favicon-16.png"
# Multi-resolution .ico (16 + 32 + 48) for legacy /favicon.ico requests
render -w 48 -h 48 "$SRC/icon.svg" -o "$WORK/favicon-48.png"
magick "$WORK/favicon-16.png" "$WORK/favicon-32.png" "$WORK/favicon-48.png" "$OUT/favicon.ico"
# Scalable favicon
cp "$SRC/icon.svg" "$OUT/favicon.svg"

echo "✓ brand assets written to $OUT/"

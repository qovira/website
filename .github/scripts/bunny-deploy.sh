#!/usr/bin/env bash
#
# Mirrors the prerendered build/ to the Bunny Storage Zone via Bunny's native
# Storage HTTP API (NOT the S3-compat preview API). One PUT per file; the remote
# path mirrors the path under build/, and Bunny creates intermediate folders.
# After uploading, it PRUNES remote files that no longer exist in build/ so the
# zone is a true mirror — otherwise removed assets (and every superseded
# fingerprinted _app/immutable/* chunk) accumulate forever in storage.
#
# Per-path Cache-Control is deliberately NOT set here: Bunny Storage can't carry
# per-object cache headers, so caching is enforced by Pull Zone edge rules (see
# the policy documented in ci.yml and provisioned per the deploy runbook). Every
# deploy purges the pull zone afterwards, so a release is live regardless of TTL.
set -euo pipefail

: "${BUNNY_STORAGE_ENDPOINT:?need the storage region host, e.g. storage.bunnycdn.com}"
: "${BUNNY_STORAGE_ZONE:?need the storage zone name}"
: "${BUNNY_STORAGE_PASSWORD:?need the storage zone password (AccessKey)}"
command -v jq >/dev/null 2>&1 || { echo "✗ jq is required (used to walk the remote listing for pruning)" >&2; exit 1; }

# Bunny serves the Content-Type stored on upload, so set a correct web MIME per
# extension (curl --data-binary would otherwise send form-urlencoded).
mime() {
	case "${1##*.}" in
	html) echo "text/html; charset=utf-8" ;;
	js) echo "text/javascript; charset=utf-8" ;;
	css) echo "text/css; charset=utf-8" ;;
	json) echo "application/json; charset=utf-8" ;;
	webmanifest) echo "application/manifest+json; charset=utf-8" ;;
	svg) echo "image/svg+xml" ;;
	ico) echo "image/x-icon" ;;
	png) echo "image/png" ;;
	jpg | jpeg) echo "image/jpeg" ;;
	webp) echo "image/webp" ;;
	woff2) echo "font/woff2" ;;
	txt) echo "text/plain; charset=utf-8" ;;
	xml) echo "application/xml; charset=utf-8" ;;
	*) echo "application/octet-stream" ;;
	esac
}

base="https://${BUNNY_STORAGE_ENDPOINT}/${BUNNY_STORAGE_ZONE}"

# The set of paths we just shipped (relative to build/, e.g. "og-card.jpg"),
# sorted — consulted by the prune pass to decide what's stale. Cleaned up on exit.
manifest="$(mktemp)"
trap 'rm -f "$manifest"' EXIT

# ── Upload: one PUT per file under build/ ────────────────────────────────────
count=0
while IFS= read -r -d '' f; do
	rel="${f#build/}"
	curl --fail-with-body -sS -X PUT \
		-H "AccessKey: ${BUNNY_STORAGE_PASSWORD}" \
		-H "Content-Type: $(mime "$f")" \
		--data-binary @"${f}" \
		"${base}/${rel}"
	printf '%s\n' "$rel" >>"$manifest"
	count=$((count + 1))
done < <(find build -type f -print0)
sort -o "$manifest" "$manifest"

echo "Uploaded ${count} files to Bunny Storage zone '${BUNNY_STORAGE_ZONE}'."

# Safety: an empty manifest means the build produced nothing — never let that
# turn the prune below into "delete the entire live zone".
[ -s "$manifest" ] || { echo "✗ refusing to prune: build produced no files" >&2; exit 1; }

# ── Prune: delete remote files absent from the manifest ──────────────────────
# Recursively list a storage directory (prefix is "" for the zone root, else
# ends in "/"), emitting each contained file's full path relative to the root.
list_remote_files() {
	local prefix="$1" json isdir name
	json="$(curl --fail-with-body -sS -H "AccessKey: ${BUNNY_STORAGE_PASSWORD}" "${base}/${prefix}")"
	while IFS=$'\t' read -r isdir name; do
		[ -n "$name" ] || continue
		if [ "$isdir" = "true" ]; then
			list_remote_files "${prefix}${name}/"
		else
			printf '%s\n' "${prefix}${name}"
		fi
	done < <(printf '%s' "$json" | jq -r '.[] | "\(.IsDirectory)\t\(.ObjectName)"')
}

pruned=0
while IFS= read -r rel; do
	if ! grep -qxF -- "$rel" "$manifest"; then
		curl --fail-with-body -sS -X DELETE \
			-H "AccessKey: ${BUNNY_STORAGE_PASSWORD}" \
			"${base}/${rel}"
		echo "Pruned stale ${rel}"
		pruned=$((pruned + 1))
	fi
done < <(list_remote_files "")

echo "Pruned ${pruned} stale file(s)."

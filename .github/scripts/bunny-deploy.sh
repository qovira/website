#!/usr/bin/env bash
#
# Uploads the prerendered build/ to the Bunny Storage Zone via Bunny's native
# Storage HTTP API (NOT the S3-compat preview API). One PUT per file; the remote
# path mirrors the path under build/, and Bunny creates intermediate folders.
#
# Per-path Cache-Control is deliberately NOT set here: Bunny Storage can't carry
# per-object cache headers, so caching is enforced by Pull Zone edge rules (see
# the policy documented in ci.yml and provisioned per the deploy runbook). Every
# deploy purges the pull zone afterwards, so a release is live regardless of TTL.
set -euo pipefail

: "${BUNNY_STORAGE_ENDPOINT:?need the storage region host, e.g. storage.bunnycdn.com}"
: "${BUNNY_STORAGE_ZONE:?need the storage zone name}"
: "${BUNNY_STORAGE_PASSWORD:?need the storage zone password (AccessKey)}"

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
	webp) echo "image/webp" ;;
	woff2) echo "font/woff2" ;;
	txt) echo "text/plain; charset=utf-8" ;;
	xml) echo "application/xml; charset=utf-8" ;;
	*) echo "application/octet-stream" ;;
	esac
}

base="https://${BUNNY_STORAGE_ENDPOINT}/${BUNNY_STORAGE_ZONE}"
count=0
while IFS= read -r -d '' f; do
	rel="${f#build/}"
	curl --fail-with-body -sS -X PUT \
		-H "AccessKey: ${BUNNY_STORAGE_PASSWORD}" \
		-H "Content-Type: $(mime "$f")" \
		--data-binary @"${f}" \
		"${base}/${rel}"
	count=$((count + 1))
done < <(find build -type f -print0)

echo "Uploaded ${count} files to Bunny Storage zone '${BUNNY_STORAGE_ZONE}'."

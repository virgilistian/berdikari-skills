#!/usr/bin/env bash
# Regenerates the downloadable .zip served from the in-app install guide
# (berdikari-web/app/pages/pajak/panduan-ekstensi.vue). Run this after any
# change under extensions/sipadi-autofill/ before it ships — the zip is a
# committed static asset, not built automatically.
set -euo pipefail
cd "$(dirname "$0")"

mkdir -p ../berdikari-web/public/downloads
rm -f ../berdikari-web/public/downloads/sipadi-autofill-extension.zip
zip -r -q ../berdikari-web/public/downloads/sipadi-autofill-extension.zip sipadi-autofill \
  -x "*.DS_Store"

echo "Wrote berdikari-web/public/downloads/sipadi-autofill-extension.zip"

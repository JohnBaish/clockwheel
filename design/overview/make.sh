#!/usr/bin/env bash
# Rebuilds the baish.net overview PDF (README.md here explains when and how).
#   bash design/overview/make.sh           — builds each site from its repo's main and serves it locally
#   LIVE=1 bash design/overview/make.sh    — photographs the live sites instead (needs *.baish.net allowed)
# Expects flowcharter and hindcaster checked out beside clockwheel (override with FC_REPO / HC_REPO),
# each with `npm ci` done. Writes img/ (ignored by git) and baish-net-overview-<today>.pdf here.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
CW="$(cd "$HERE/../.." && pwd)"
FC_REPO="${FC_REPO:-$CW/../flowcharter}"
HC_REPO="${HC_REPO:-$CW/../hindcaster}"
WORK="$(mktemp -d)"
PIDS=()
stop() { for p in "${PIDS[@]:-}"; do [ -n "$p" ] && kill "$p" 2>/dev/null || true; done; }
trap stop EXIT

if [ -z "${LIVE:-}" ]; then
  port=4301
  for repo in "$CW" "$FC_REPO" "$HC_REPO"; do
    name="$(basename "$repo")"
    (cd "$repo" && node node_modules/vite/bin/vite.js build --outDir "$WORK/dist/$name" --emptyOutDir >"$WORK/build-$name.log" 2>&1)
    (cd "$repo" && exec node node_modules/vite/bin/vite.js preview --outDir "$WORK/dist/$name" --port $port --strictPort >"$WORK/serve-$name.log" 2>&1) &
    PIDS+=($!)
    port=$((port + 1))
  done
  sleep 3
fi

mkdir -p "$WORK/shots" "$HERE/img"
node "$HERE/capture.mjs" "$WORK/shots" > "$WORK/capture.json"
node -e "for (const x of require('$WORK/capture.json')) if (x.errors.length || x.scrollWidth > (x.name.includes('phone') ? 390 : 1440)) console.log('CHECK', x.name, x.scrollWidth, x.errors)"
python3 -I "$HERE/prep.py" "$WORK/shots" "$HERE/img"
cp "$CW/public/favicon.svg" "$HERE/img/fav-clockmaker.svg"
cp "$CW/public/favicon-backtimer.svg" "$HERE/img/fav-backtimer.svg"
cp "$CW/public/favicon-baish.svg" "$HERE/img/fav-baish.svg"
cp "$FC_REPO/public/favicon.svg" "$HERE/img/fav-flowcharter.svg"
cp "$HC_REPO/public/favicon.svg" "$HERE/img/fav-hindcaster.svg"
cp "$CW/public/og-baish.png" "$CW/public/og-backtimer.png" "$CW/public/og-clockmaker.png" \
   "$FC_REPO/public/og-flowcharter.png" "$HC_REPO/public/og-hindcaster.png" "$HERE/img/"
node "$HERE/pdf.mjs" "$HERE/overview.html" "$HERE/baish-net-overview-$(date +%F).pdf"
echo "Done: $HERE/baish-net-overview-$(date +%F).pdf (working files in $WORK)"

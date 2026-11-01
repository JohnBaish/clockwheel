#!/usr/bin/env bash
# Rebuilds "baish.net in pictures", the pictures half of the overview (README.md here explains when and how).
#   LIVE=1 bash design/overview/make.sh   — photographs the live sites (needs baish.net and its subdomains allowed; preferred)
#   bash design/overview/make.sh          — builds each site from its repo's main and serves it locally
# Locally it expects flowcharter, hindcaster, lightreader and refueller checked out beside clockwheel (override with
# FC_REPO / HC_REPO / LR_REPO / RF_REPO), each with `npm ci` done. Writes img/ (ignored by git), pictures.html and
# baish-net-pictures-<today>.pdf here. The words are in baish-net-overview.md, written by hand.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
CW="$(cd "$HERE/../.." && pwd)"
FC_REPO="${FC_REPO:-$CW/../flowcharter}"
HC_REPO="${HC_REPO:-$CW/../hindcaster}"
LR_REPO="${LR_REPO:-$CW/../lightreader}"
RF_REPO="${RF_REPO:-$CW/../refueller}"
WORK="$(mktemp -d)"
PIDS=()
stop() { for p in "${PIDS[@]:-}"; do [ -n "$p" ] && kill "$p" 2>/dev/null || true; done; }
trap stop EXIT

if [ -z "${LIVE:-}" ]; then
  port=4301
  for repo in "$CW" "$FC_REPO" "$HC_REPO" "$LR_REPO" "$RF_REPO"; do
    name="$(basename "$repo")"
    (cd "$repo" && npm run build >"$WORK/build-$name.log" 2>&1 && rm -rf "$WORK/dist/$name" && mkdir -p "$WORK/dist" && cp -r dist "$WORK/dist/$name")
    (cd "$repo" && exec node node_modules/vite/bin/vite.js preview --outDir "$WORK/dist/$name" --port $port --strictPort >"$WORK/serve-$name.log" 2>&1) &
    PIDS+=($!)
    port=$((port + 1))
  done
  sleep 3
fi

mkdir -p "$WORK/shots"
rm -rf "$HERE/img" && mkdir -p "$HERE/img"
node "$HERE/capture.mjs" "$WORK/shots" > "$WORK/capture.json"
node -e "for (const x of require('$WORK/capture.json')) if (x.errors.length || x.scrollWidth > (/phone|dark/.test(x.name) ? 390 : 1440)) console.log('CHECK', x.name, x.scrollWidth, x.errors)"
python3 -I "$HERE/prep.py" "$WORK/shots" "$HERE/img"

# Favicons and link-preview pictures: from the live sites, or from each repo's public/ folder.
for pair in "baish:www:$CW/public/favicon-baish.svg:$CW/public/og-baish.png" \
            "backtimer:backtimer:$CW/public/favicon-backtimer.svg:$CW/public/og-backtimer.png" \
            "clockmaker:clockmaker:$CW/public/favicon.svg:$CW/public/og-clockmaker.png" \
            "flowcharter:flowcharter:$FC_REPO/public/favicon.svg:$FC_REPO/public/og-flowcharter.png" \
            "hindcaster:hindcaster:$HC_REPO/public/favicon.svg:$HC_REPO/public/og-hindcaster.png" \
            "lightreader:lightreader:$LR_REPO/public/favicon.svg:$LR_REPO/public/og-lightreader.png" \
            "refueller:refueller:$RF_REPO/public/favicon.svg:$RF_REPO/public/og-refueller.png"; do
  IFS=: read -r name host fav og <<<"$pair"
  if [ -n "${LIVE:-}" ]; then
    page="$(curl -s "https://$host.baish.net/")"
    icon="$(printf '%s' "$page" | grep -o 'rel="icon"[^>]*href="[^"]*"' | sed 's/.*href="//;s/"$//')"
    preview="$(printf '%s' "$page" | grep -o 'property="og:image" content="[^"]*"' | sed 's/.*content="//;s/"$//')"
    curl -s -o "$HERE/img/fav-$name.svg" "https://$host.baish.net$icon"
    curl -s -o "$HERE/img/og-$name.png" "$preview"
  else
    cp "$fav" "$HERE/img/fav-$name.svg"; cp "$og" "$HERE/img/og-$name.png"
  fi
done

python3 -I "$HERE/build-pictures.py"
node "$HERE/pdf.mjs" "$HERE/pictures.html" "$HERE/baish-net-pictures-$(date +%F).pdf"
echo "Done: $HERE/baish-net-pictures-$(date +%F).pdf (working files in $WORK)"

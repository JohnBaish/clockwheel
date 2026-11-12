#!/usr/bin/env bash
# Rebuilds "baish.net in pictures", the pictures half of the overview (README.md here explains when and how).
#   LIVE=1 bash design/overview/make.sh   — photographs the live sites (needs baish.net and its subdomains allowed; preferred)
#   bash design/overview/make.sh          — builds each site from its repo's main and serves it locally
# Locally it expects flowcharter, hindcaster, lightreader, refueller, riverwatcher (with riverwatcher-data beside it),
# nightreader and roadteller checked out beside clockwheel (override with FC_REPO / HC_REPO / LR_REPO / RF_REPO / RW_REPO / NR_REPO / RD_REPO), each with `npm ci` done.
# The two private sites, Tenniserver and Motoracer, are behind a sign-in, so they are always built from their repos and served
# locally, even with LIVE=1: tenniserver and motoracer beside clockwheel (TS_REPO / MR_REPO), each with `npm ci` done. Writes img/ (ignored by git), pictures.html and
# baish-net-pictures-<today>.pdf here. The words are in baish-net-overview.md, written by hand.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
CW="$(cd "$HERE/../.." && pwd)"
FC_REPO="${FC_REPO:-$CW/../flowcharter}"
HC_REPO="${HC_REPO:-$CW/../hindcaster}"
LR_REPO="${LR_REPO:-$CW/../lightreader}"
RF_REPO="${RF_REPO:-$CW/../refueller}"
RW_REPO="${RW_REPO:-$CW/../riverwatcher}"
NR_REPO="${NR_REPO:-$CW/../nightreader}"
RD_REPO="${RD_REPO:-$CW/../roadteller}"
TS_REPO="${TS_REPO:-$CW/../tenniserver}"
MR_REPO="${MR_REPO:-$CW/../motoracer}"
WORK="$(mktemp -d)"
PIDS=()
stop() { for p in "${PIDS[@]:-}"; do [ -n "$p" ] && kill "$p" 2>/dev/null || true; done; }
trap stop EXIT

if [ -z "${LIVE:-}" ]; then
  port=4301
  for repo in "$CW" "$FC_REPO" "$HC_REPO" "$LR_REPO" "$RF_REPO" "$RW_REPO" "$NR_REPO" "$RD_REPO"; do
    name="$(basename "$repo")"
    (cd "$repo" && npm run build >"$WORK/build-$name.log" 2>&1 && rm -rf "$WORK/dist/$name" && mkdir -p "$WORK/dist" && cp -r dist "$WORK/dist/$name")
    (cd "$repo" && exec node node_modules/vite/bin/vite.js preview --outDir "$WORK/dist/$name" --port $port --strictPort >"$WORK/serve-$name.log" 2>&1) &
    PIDS+=($!)
    port=$((port + 1))
  done
  sleep 3
fi

# The private sites, always local: Tenniserver on 4309, Motoracer on 4310, with the data saved in each repo.
port=4309
for repo in "$TS_REPO" "$MR_REPO"; do
  name="$(basename "$repo")"
  (cd "$repo" && npm run build >"$WORK/build-$name.log" 2>&1)
  python3 -m http.server $port --bind 127.0.0.1 --directory "$repo/dist" >"$WORK/serve-$name.log" 2>&1 &
  PIDS+=($!)
  port=$((port + 1))
done
sleep 2

mkdir -p "$WORK/shots"
rm -rf "$HERE/img" && mkdir -p "$HERE/img"
node "$HERE/capture.mjs" "$WORK/shots" > "$WORK/capture.json"
node "$HERE/capture-private.mjs" "$WORK/shots" > "$WORK/capture-private.json"
node -e "for (const x of [...require('$WORK/capture.json'), ...require('$WORK/capture-private.json')]) if (x.errors.length || x.scrollWidth > (/phone|dark/.test(x.name) ? 390 : 1440)) console.log('CHECK', x.name, x.scrollWidth, x.errors)"
python3 -I "$HERE/prep.py" "$WORK/shots" "$HERE/img"

# Favicons and link-preview pictures: from the live sites, or from each repo's public/ folder.
for pair in "baish:www:$CW/public/favicon-baish.svg:$CW/public/og-baish.png" \
            "backtimer:backtimer:$CW/public/favicon-backtimer.svg:$CW/public/og-backtimer.png" \
            "clockmaker:clockmaker:$CW/public/favicon.svg:$CW/public/og-clockmaker.png" \
            "flowcharter:flowcharter:$FC_REPO/public/favicon.svg:$FC_REPO/public/og-flowcharter.png" \
            "hindcaster:hindcaster:$HC_REPO/public/favicon.svg:$HC_REPO/public/og-hindcaster.png" \
            "lightreader:lightreader:$LR_REPO/public/favicon.svg:$LR_REPO/public/og-lightreader.png" \
            "refueller:refueller:$RF_REPO/public/favicon.svg:$RF_REPO/public/og-refueller.png" \
            "riverwatcher:riverwatcher:$RW_REPO/public/favicon.svg:$RW_REPO/public/og-riverwatcher.png" \
            "nightreader:nightreader:$NR_REPO/public/favicon.svg:$NR_REPO/public/og-nightreader.png" \
            "roadteller:roadteller:$RD_REPO/public/favicon.svg:$RD_REPO/public/og-roadteller.png"; do
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

# The private sites' icons, from their repos (Motoracer has no link-preview picture).
cp "$TS_REPO/site/favicon.svg" "$HERE/img/fav-tenniserver.svg"; cp "$TS_REPO/site/og-tenniserver.png" "$HERE/img/og-tenniserver.png"
cp "$MR_REPO/site/favicon.svg" "$HERE/img/fav-motoracer.svg"

python3 -I "$HERE/build-pictures.py"
node "$HERE/pdf.mjs" "$HERE/pictures.html" "$HERE/baish-net-pictures-$(date +%F).pdf"
echo "Done: $HERE/baish-net-pictures-$(date +%F).pdf (working files in $WORK)"

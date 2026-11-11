# Hub pictures drawn by hand

The baish.net page's pictures (`public/hub/*.webp`, 192px, shown as 96px circles) are cropped from each
site's link-preview picture, except these two, drawn for the page on November 11th 2026 (John chose them):

- `backtimer.svg`: a clock at 10:10 with an ink dot at 12 and a terracotta arrow running backwards from
  it to :35, the rest of the hour a faint line.
- `clockmaker.svg`: a clock wheel of segments in Clockmaker's own category colours, with a faint ring
  (ink at 40%, 4.5px, its inside edge on the wheel), as the faint part of Backtimer's ring but thinner.

To remake a `.webp`: render the SVG at 192 by 192 (for example with Playwright), then save it as WebP,
quality 90.

# secondscreen/assets — artist-supplied

Drop the composed 1080p artwork here. Until a file exists, the page falls back to a flat
per-habitat tint (no broken image), so the console is fully usable without these.

## Backgrounds (1920×1080 PNG)

The `bg` field in `../encyclopedia.js` points at these names — drop the file in and it shows:

- `bg_forest.png`
- `bg_wetland.png`
- `bg_lowland.png`
- `bg_alpine.png`

These are the full mockup scenes *minus* the plant stickers and the card (the page draws
those on top), or just the topographic texture — either works; the stickers are positioned
over the background by `encyclopedia.js` (`cx`, `cy`, `h`).

## Highlight loops (optional, alpha WebM)

Per-plant idle loops shown while a plant is highlighted (2–4 s, muted). Wire them in
`../encyclopedia.js` under `TM_PLANT_HIGHLIGHT`. Author with:

```
ffmpeg -i in.mov -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 30 highlight_totara.webm
```

Use alpha WebM, not GIF (256-colour banding, 1-bit alpha) and not JS-swapped PNG frames.
See `../../md/TEMANAWA_SECOND_SCREEN.md` §2.3.

# Cold cover: the hills open up in the glacials

26 ground-layer frames at 1920×1080, at the same glacial and interglacial peaks as
`../terrain_rivers_opiki/` (`TM_EXPORT.peaks()`), all from one page load (one seed, so the land
differs in detail from that set). Exported 2026-10-28, after the cold-cover bake.

**What changed.** Before, the forest bands (podocarp, montane) painted the same green in every
glacial stage, and only the frost wash said "cold". The live trees already retreated downhill
with `LEVEL_MECHANICS.forestBandByStage`, but the ground under them stayed forest. Now each
stage's bake opens the forest biomes above that stage's treeline into the glacial shrub–grassland
the LGM pollen records (`md/TEMANAWA_ECOLOGY_OPEN.md` §4): grey scrub just above the line, olive
tussock-scrub, tawny tussock toward the snow. Slopes facing SE, in the lee of the fixed NW wind,
hold dark beech instead.

| Stage | Treeline (`forestBandByStage.max`) | Forest ground opened |
|---|---:|---|
| interglacial | 0.80 | none (above every forest band) |
| cooling | 0.62 | almost none (the montane band tops out at 0.60) |
| glacial | 0.45 | the upper montane band |
| full glacial | 0.34 | almost all of it, with beech in the lee |

**Read the pairs.** Compare each glacial peak with the interglacial after it, e.g. `peak_14_450ka`
→ `peak_15_410ka`, or `peak_22_140ka` → `peak_23_122ka`. The hills swing from an open grey-green
mosaic to closed forest and back. Mid-window glacials with a weaker index (e.g. `peak_12_540ka`,
g 0.78) sit between the glacial and full-glacial bakes in the crossfade, so they open less.

**Authoring.** Colours: `coldCover` on the podocarp and montane entries in
`levels/level_temanawa_scaffold.js` (`habitatCols.glacialOpen`, `habitatCols.beechRefuge`).
Knobs: `LOOK.coldCover`, `coldCoverFade`, `coldCoverJitter`, `coldCoverLeeGain`,
`coldCoverLeeSpan` in `TeManawa_terrain.js`. Harness: the "cold cover" section of
`tools/bootcheck.js`.

**Still licence or unbuilt.**
- The forest below the treeline keeps its podocarp green in the glacials; the pollen says the
  few glacial trees were mostly beech.
- The lowland plain's colour is unchanged in both directions: it stays beige grass in the
  interglacials, where pre-human forest covered it.
- Frost is still one even wash, not pooled in the valley floors.
- The full-glacial snow cap still reads as an ice sheet; the LGM Tararua held only small cirque
  glaciers.
- **Look nit:** the paint grid carries two straight north–south elevation steps (measured at
  u ≈ 0.44 and 0.62), which the old uniform green hid. Where they cross a treeline they show as a
  short straight edge. The lee shelter is measured over two world units (`coldCoverLeeSpan`) so
  they no longer draw lines of beech; the steps themselves are a terrain issue.

**To regenerate:** serve with `node tools/serve.js 8093 --export`, open the page at 1920×1080,
load `/tools/export_frames.js`, then `TM_EXPORT.run(TM_EXPORT.peaks(), 'cold_cover/peak')`.

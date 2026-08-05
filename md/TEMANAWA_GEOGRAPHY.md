# Te Manawa — Geography skeleton (SVG-driven terrain)

Give the sim a **vector skeleton** — where the ranges sit and where the river
runs — and let procedure build the elevation *around* it. The features are
recognisable and consistent every run; the noise (and a per-run seed) varies
everything else. You tune the general look from a handful of knobs.

This **updates `TEMANAWA_PLAN_V2.md` §7 and revives `TEMANAWA_TERRAIN_PLAN.md`**
(§3–5), which were cut on the grounds that the 345→25 ka window barely moves the
topography. The run now opens at **~1 Ma** (`yearsStart` = 1.0 Ma; 1.1 Ma is the
eventual target — §7), over which the axial ranges rise from almost nothing to
full height — so the morph is re-earned, but with a *lighter* authoring model than
§7's two painted heightmaps: one SVG of lines and blobs, not grayscale rasters.

---

## 1. Pipeline

```
 geo/manawatu.svg  ──(author-time)──►  tools/svg2geo.js  ──►  geo/manawatu.geo.js
   ranges + river                        parse + flatten          normalised 0..1
   (vector, editable)                    + normalise              (classic script)
                                                                      │
                          generate():  build distance fields  ◄───────┘
                          river carve  +  range uplift  +  base plains noise
                                          │            │
                                    tIncision(yBP)   tUplift(yBP)     ← 1.1 Ma time ramp
                                          ▼
                                   ELEVATION field → biome bands → baked buffers
```

The kiosk **never parses SVG**. `svg2geo.js` runs at author-time and commits a
plain-JS data file; the sim loads it like a level. This keeps the runtime with
no DOM/parse dependency and honours "no network, no build step" on the wall.

---

## 2. SVG authoring convention

- `viewBox="0 0 W H"` sets the world extent and aspect. Author landscape (the
  play area is adaptive; 16:9 is the current target). Points are normalised to
  the viewBox, so absolute size doesn't matter — only proportions.
- Features are tagged by **`class` (or `id`)**; untagged elements (a frame,
  labels) are ignored:

  | class   | geometry            | drives                                   |
  |---------|---------------------|------------------------------------------|
  | `river` | open path/polyline  | a carved channel following the line      |
  | `range` | filled polygon/path | uplift inside/near the blob → alpine      |
  | `coast` | open path/polyline  | the coastline (future)                    |
  | `dune`  | filled polygon/path | dune-field relief (future)                |

- Optional per-feature knobs as `data-*` (else the converter's defaults):
  - river/coast: `data-width` (channel half-width, world frac), `data-depth`
  - range/dune: `data-height` (MATURE peak elevation 0..1), `data-spread` (falloff width)

Geometry supported: `<polyline>`/`<polygon>` `points`, and `<path d>` with
`M L H V C S Q T Z` (absolute + relative; curves flattened). Illustrator/Inkscape
exports work; so do hand-authored polylines.

---

## 3. Geo-data format (emitted)

```jsonc
const TE_MANAWA_GEO = {
  source: "manawatu.svg",
  viewBox: { w: 1600, h: 900 },        // aspect the features were drawn in
  rivers: [ { width: 0.05, depth: 1.0, pts: [[x,y], ...] } ],   // x,y normalised 0..1
  ranges: [ { height: 0.86, spread: 0.17, poly: [[x,y], ...] }, ... ],
  coasts: [], dunes: [ { height: 0.2, spread: 0.06, poly: [...] } ]
};
```

---

## 4. Terrain integration (the elevation seam)

`getElevation(x,y)` is where procedure lives today (fractal + ridge noise +
coastal falloff). The skeleton enters here as an **additive influence on top of
the base plains noise**, so the base still gives rolling detail everywhere:

1. **Map** world (x,y) → normalised (u,v) over the terrain footprint, then into
   viewBox space. (Fit mode changes aspect; features stretch to the footprint —
   authoring at the target aspect keeps them true.)
2. **River carve.** `dRiver` = distance to the nearest river segment, with a
   per-seed meander wobble added so the channel wanders off the exact SVG line.
   Inside `width`, pull elevation down to a **river bed below 0.10** (the `sea`
   band → reads as water). `depth`/`width` tune it.
3. **Range uplift.** For each range, `inRange`/`dRange` → a `0..1` mass that
   pulls elevation **up toward `height` (~0.85, under the 0.90 snow line so the
   ranges "don't get as snowy")**, textured by the existing `ridgeNoise` for
   crags. Multiple ranges take the max.
4. **Blend + clamp.** `e = base;  e = lerp(e, riverBed, riverMask);
   e = lerp(e, max(e, rangePeak), rangeMass);  clamp 0..1`. Biome bands then map
   high→subalpine/alpine, channel→water, automatically — no new biome table.

**Consistency vs. variation:** the SVG fixes *where*; the seed varies the
meander, the ridge texture and the plains. Every run differs; the river always
runs its course and the ranges always sit put.

Distance fields are built **once per `generate()`** (rasterise the river into the
grid + a cheap distance pass; point-in-polygon + edge distance for ranges) — not
per frame — so this rides the existing bake, not the draw.

---

## 5. Time axis — ~1.1 Ma (the morph)

The clock already runs `yearsStart` → `yearsEnd` (currently 1,000,000 →
25,500); bump `yearsStart` to **1,100,000**. `DeepTime.progress()` gives 0 at the
start → 1 at the end, driving two curves (the two-curve idea from §7, art of a
*skeleton* not a raster):

- **`tUplift(yBP)`** scales range `height`: ranges start near-flat at 1.1 Ma and
  grow to full height (ease-in — most uplift is late-Quaternary).
- **`tIncision(yBP)`** scales river carve depth, run **slightly ahead** of uplift
  so the gorge floor drops faster than the ridges rise — *the river outpaces the
  uplift* (the antecedence takeaway), visible where the river crosses a range.

The world re-bakes **on an interval** (Δ `yearsBP`, cross-faded like seasons) via
the buffers we already have — never per frame. This is also the hook for the
**secondary events** you'll add across the 1.1 Ma (coast curving north into
Whanganui, dune fields, and their dynamics).

---

## 6. Config knobs (level-authored, live-tunable)

Proposed `levelDef.geography` block, mirrored onto a `GEO` dev surface like
`LOOK`/`GEN` so it re-bakes in place on `B`:

| knob | default | effect |
|---|---|---|
| `riverWidth` | from SVG (0.05) | channel half-width |
| `riverDepth` | from SVG (1.0) | carve strength |
| `riverWobble` | 0.02 | per-seed meander off the SVG line |
| `rangeHeightMax` | from SVG (~0.85) | mature peak (keep <0.90 for less snow) |
| `rangeSpread` | from SVG (~0.15) | how far uplift reaches past the blob |
| `rangeCrag` | 0.25 | ridge-noise texture on the massif |
| `upliftEase` | 2.0 | ease-in exponent for tUplift |
| `incisionLead` | 0.1 | how far tIncision runs ahead of tUplift |
| `rebakeYears` | ~9000 (`morphIntervalYears`) | Δ yearsBP between morph re-bakes |

---

## 7. Build order & status

1. ✅ **Foundation:** this doc, `tools/svg2geo.js`, `geo/manawatu.svg`,
   `geo/manawatu.geo.js`.
2. ✅ **Static integration:** the geo data loads; river/range distance fields build
   once per bake and blend into `getElevation`; harness assertions in place. Terrain
   generates around the skeleton. *(Geo tuning landed in `LOOK` — `rangeRelief`,
   `riverWobble` — not a separate `GEO` surface; landform noise stays in `GEN`.)*
3. ✅ **Time ramp:** `tUplift`/`tIncision` off `yearsBP`; interval re-bake
   (`morphIntervalYears`, ~9 ky) cross-faded and amortised across frames.
   **`yearsStart` is still 1.0 Ma — the bump to 1.1 Ma is not yet made.**
4. ⬜ **Later:** coast curve to Whanganui; dune fields + dynamics; ranges' reduced
   snow; secondary events across the window.

---

## 8. Notes / limits

- `svg2geo.js` flattens curves at a fixed step and assumes well-formed path data;
  it's a dev tool, not a full SVG parser. Keep features to paths/polylines/polygons.
- A dedicated `river`/`riparian` biome is a later refinement; v1 carves the river
  into the `sea` band, so it reads as a water ribbon.
- Fit-mode aspect stretch: author at the target aspect (16:9 now) to avoid it.

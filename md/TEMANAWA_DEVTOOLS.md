# Te Manawa — Dev Console Tools

A console-first workflow for developing the piece **live, with no page reload**. Open the
browser dev console on the running install and tune the editable globals — `LOOK` (paint),
`GEN` (landform) and `GEO` (the ranges) — then press a key to re-bake in place. Same land,
same ecosystem, no reload.

Defined in `TeManawa_devtools.js` (loads after `TeManawa_terrain.js`). Authoring only: the
kiosk wall is locked to keys `1`–`4` and never reaches `B` / `G` / `N`.

> Type **`DEV.help()`** in the console for the built-in cheatsheet.

---

## The loop

```
edit a value  →  press a key  →  see it
LOOK.shadeSteps = 4      B      (re-bakes the paint)
GEN.octaves = 4          G      (regenerates the land with new noise)
—                        N      (a brand-new random land)
```

Every action re-runs the terrain bake in place (`Game.rebakeTerrain()`), which is fast and
never resets the animals or reseeds the land unless you ask it to.

---

## `LOOK` — paint / illustration

The cartoon look of the ground: cel tones, slope shading, biome ink, shoreline, haze,
relief outlines, bake resolution — plus the geo-skeleton shaping. The **data** lives at
the top of `TeManawa_terrain.js` (so the bake can read it); the **methods** below are added
in `TeManawa_devtools.js`.

**Toggles** (flip a move off to see what it does): `posterize`, `wobble`, `outlines`,
`shore`, `shade`, `haze`, `quiet`, `reliefEdge`, `smoothScale`.

**Amounts / colours** (a selection — `LOOK.dump()` prints them all): `shadeSteps`,
`shadeStrength`, `shadeShadow`, `shadeHigh`, `bakeScale`, `wobbleAmp`, `quietSat`,
`outlineJitter`, `hazeStrength`, `hazeHeight`, `hazeColor`, `outlineColor`, `shoreColor`,
`reliefEdgeColor`. **Geo-skeleton shaping** (regenerate to apply, key **G**/**N**):
`rangeRelief` (valley depth vs crest in the ranges), `riverWobble` (per-seed meander off
the SVG river line).

| Call | Does |
|---|---|
| `LOOK.dump()` | print the current settings |
| `LOOK.bake()` | apply the current `LOOK` and re-bake (same as pressing **B**) |
| `LOOK.set({shadeSteps:4, bakeScale:3})` | batch-edit several values, then bake |
| `LOOK.solo('shade')` | isolate one move — every other illustration toggle off |
| `LOOK.all(false)` / `LOOK.all(true)` | all moves off / on |
| `LOOK.reset()` | back to the authored (source) defaults |

Notes:

- **`bakeScale`** is the paint resolution over the sim grid. Default **`3`** (the sweet
  spot); `2` is the lightest, matching sim-grid memory. Higher is sharper but memory grows
  as N² and is **hard-capped by `bakeMaxPixels`** (~2.2 M px per buffer, ×4), so raising it
  may no-op. It only costs at bake time, never per frame.
- **`shadeStrength`** feeds the cel bands. High values saturate to the two extreme bands
  (hard light/shadow); for three distinct steps use ~`10`–`15` with `shadeSteps: 3`.

---

## `GEN` — landform generation (the noise)

The shape of the land: octave noise, ridges, coastline, lakes. `GEN` is a **live editor**
over the values the terrain runs on (mostly `CONFIG`, plus the effective `noiseScale` on
the terrain instance).

**Params:** `noiseScale` (feature size), `octaves`, `persistence` (roughness),
`lacunarity`, `ridgeInfluence` (sharper ranges), `elevationPower` (contrast), `useLakes`,
`lakeThreshold`, `lakeNoiseScale`.

| Call | Does |
|---|---|
| `GEN.sync()` | pull the values the game is running with into `GEN` (do this first) |
| `GEN.dump()` | print the current settings |
| `GEN.apply()` | write `GEN` → config + terrain, regenerate the **same** land, re-bake (key **G**) |
| `GEN.reseed()` | a **new** random landform with the current params (key **N**) |
| `GEN.reset()` | back to the level's authored terrain |

Notes:

- `GEN` is auto-synced from the live level at boot, so `GEN.dump()` shows the real values
  straight away. After a manual `CONFIG` edit, call `GEN.sync()` again.
- `noiseScale` here is the **effective** value the noise uses (fit mode has already rescaled
  the level's authored `noiseScale`). Tune it directly; when you settle on a value, put it
  back into `levels/level_temanawa_scaffold.js` as the authored source of truth.

---

## `GEO` — the ranges (the geo skeleton's shaping)

`GEN` authors the procedural noise; **`GEO` authors how the SVG skeleton
(`geo/manawatu.geo.js`) reshapes it into the ranges** — crest relief, the NE–SW spine, the
N/S edge ease, and each range's authored height / spread / footprint. Same loop as `GEN`:
edit → **G** (or `GEO.apply()`) regenerates the same land with the change.

**Params:** `relief` (→ `LOOK.rangeRelief`, valley depth vs crest), `spine`
(→ `LOOK.rangeSpine`, crest concentration on the range's long axis), `edgeMargin`
(→ `terrain._geoEdgeMargin`, how far the N/S edges ease down to plains).

| Call | Does |
|---|---|
| `GEO.show()` / `GEO.hide()` | overlay the range **footprints (gold) + spine axes (red)** on the map (key **R**) |
| `GEO.list()` | print each range — index, height, spread, centroid, spine angle |
| `GEO.set({spine:0.6, relief:0.4})` | batch-edit the shaping params + regenerate |
| `GEO.height(i, v)` / `GEO.spread(i, v)` | edit one range's crest height / reach (by `list()` index) |
| `GEO.uplift(v)` | preview the ranges at maturity `v` (0..1) **without moving the clock**; `GEO.uplift(null)` restores date-driven |
| `GEO.dump()` | print the current shaping |
| `GEO.reset()` | back to the authored range shaping |

Notes:

- The **overlay** draws in the terrain transform, so the footprints and spine axes sit on
  the lifted ground. Toggle it (**R**) while you tune `spine` or a range's `poly` to see what
  each range affects and which way its crest runs.
- `GEO.height` / `GEO.spread` write the geo **source** (`geo.ranges[i]`) so the change
  survives the regenerate. When you settle, put it back into `geo/manawatu.svg` (the authored
  source) and re-emit with `tools/svg2geo.js`.
- `GEO.uplift(1)` is the quickest way to judge the **mature** ranges regardless of the
  current date; it isolates uplift, so the river/emergence stay where the date puts them.
- The river shares the skeleton but its knobs live in `LOOK` (`riverIncise`, `riverWaterT`,
  `riverBankT`, `riverWobble`, `riverFrontJitter`); `GEO.list()` reports the river count.

---

## `DEV` — umbrella

| Call | Does |
|---|---|
| `DEV.help()` | print the cheatsheet |
| `DEV.dump()` | dump `LOOK`, `GEN` and `GEO` |
| `DEV.reset()` | reset all three to their defaults |

---

## Keys

| Key | Action |
|---|---|
| **B** | re-bake the paint with current `LOOK` |
| **G** | apply `GEN` — regenerate the land + re-bake |
| **N** | new random landform (new seed) |
| **R** | toggle the range-authoring overlay (`GEO.show()`) |
| **D** / **SHIFT+D** | cycle the debug overlay / dump state |
| **SHIFT+F** | toggle terrain footprint (`square` / `fit`) — full rebuild |

---

## Extending this

- **A new paint knob:** add the field to `LOOK` (in `TeManawa_terrain.js`), read it in
  `_computePaintGrid()` / `_bakeSeasonBuffer()`, and — if it is a toggle — add its name to
  `LOOK._toggles` in `TeManawa_devtools.js` so `solo()`/`all()` pick it up. Press **B**.
- **A new landform param:** add it to `GEN` and to `GEN._keys` (if it is `CONFIG`-backed),
  read it wherever `getElevation()` needs it. Press **G**.
- **A new tool object** (e.g. `FAUNA` for behaviour tuning): follow the `GEN` shape — a few
  data fields plus `sync()` / `apply()` / `dump()`, wired to `Game.rebakeTerrain()` or its
  own live-apply path, and a hotkey in `Game.handleKey`.

The headless harness (`node tools/bootcheck.js`) exercises this API — extend the **dev
tools** section there when you add to it.

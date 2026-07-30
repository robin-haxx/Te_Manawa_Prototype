# Te Manawa — Dev Console Tools

A console-first workflow for developing the piece **live, with no page reload**. Open the
browser dev console on the running install and tune two editable globals — `LOOK` (paint)
and `GEN` (landform) — then press a key to re-bake in place. Same land, same ecosystem,
no reload.

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
relief outlines, bake resolution. The **data** lives at the top of `TeManawa_terrain.js`
(so the bake can read it); the **methods** below are added in `TeManawa_devtools.js`.

**Toggles** (flip a move off to see what it does): `posterize`, `wobble`, `outlines`,
`shore`, `shade`, `haze`, `quiet`, `reliefEdge`.

**Amounts / colours** (a selection — `LOOK.dump()` prints them all): `shadeSteps`,
`shadeStrength`, `shadeShadow`, `shadeHigh`, `bakeScale`, `wobbleAmp`, `quietSat`,
`outlineJitter`, `hazeStrength`, `hazeHeight`, `hazeColor`, `outlineColor`, `shoreColor`,
`reliefEdgeColor`.

| Call | Does |
|---|---|
| `LOOK.dump()` | print the current settings |
| `LOOK.bake()` | apply the current `LOOK` and re-bake (same as pressing **B**) |
| `LOOK.set({shadeSteps:4, bakeScale:3})` | batch-edit several values, then bake |
| `LOOK.solo('shade')` | isolate one move — every other illustration toggle off |
| `LOOK.all(false)` / `LOOK.all(true)` | all moves off / on |
| `LOOK.reset()` | back to the authored (source) defaults |

Notes:

- **`bakeScale`** is the paint resolution over the sim grid. `2` is the default and free
  (same memory); `3`–`4` are sharper but the bake is slower and uses more memory. It only
  costs at bake time, never per frame.
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

## `DEV` — umbrella

| Call | Does |
|---|---|
| `DEV.help()` | print the cheatsheet |
| `DEV.dump()` | dump both `LOOK` and `GEN` |
| `DEV.reset()` | reset both to their defaults |

---

## Keys

| Key | Action |
|---|---|
| **B** | re-bake the paint with current `LOOK` |
| **G** | apply `GEN` — regenerate the land + re-bake |
| **N** | new random landform (new seed) |
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

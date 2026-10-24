# Terrain at each boost stop

> **For the visitor flow, not geology review.** Every stop sits mid-swing, which hides the coast's
> breathing. For geology use `../terrain_geology_timeline/` (frames at the glacial and interglacial
> peaks). These frames also predate the second-order detail of 2026-10-19 (rugged ranges, migrating
> meanders, the Te Āpiti saddle).

1920×1080 frames of the ground layer only: the baked terrain, water decals, the frost wash and the
north haze. There is no UI, no sprites (plants, birds, eels, fish) and no eruption ash. Health
saturation is held at full. Exported 2026-10-19 from the browser build, one seed, the wall's cover-fit
view (map u 0.163–0.837). **Re-exported the same day after step 8** (`md/TEMANAWA_NATURAL_HISTORY.md` §I):
the east is land at 1 Ma, the Woodville lake has its own clock, and the tributaries are fans of hill
streams from 1 Ma that draw into one channel by ~0.3 Ma. **Re-exported again after the sea-level fixes**
(`md/TEMANAWA_COAST_PLAN.md` §5b): relative sea level now counts the plain's uplift across the whole
window, highstands flood by contour, and the positional floods are retired except the Levin–Foxton
depocentre. Each export is a different seed, so the noise relief differs between sets.

**What a stop is.** A second-screen boost runs a time-lapse to the next glacial/interglacial
crossing (`Climate.nextRegimeBoundary`, glacial index 0.5). It stops 300 years short of an unfired
eruption and resumes after it. So the stops are: the 1 Ma opening, each crossing, the two eruption
holds, and the window end. Kidnappers fires at the opening; Oruanui falls on the window end.

**Columns.** *g*: glacial index. *Eustatic*: `Climate.seaLevelAt`. *Relative*: eustatic plus the
plain's uplift since then (`TerrainGenerator.relativeSeaLevel`). This is what moves the coast:
positive means the sea stood inland of today's coast.

| # | File | Date | Stop | g | Eustatic | Relative | MIS |
|---|---|---:|---|---:|---:|---:|---|
| 1 | `terrain_01_1000p0ka_start.png` | 1,000,000 | opening | 0.30 | −20 m | +50 m | 25 |
| 2 | `terrain_02_969p3ka_glacial.png` | 969,347 | → glacial | 0.50 | −53 m | +17 m | 25 |
| 3 | `terrain_03_937p3ka_interglacial.png` | 937,325 | → interglacial | 0.50 | −53 m | +17 m | 24 |
| 4 | `terrain_04_902p1ka_glacial.png` | 902,113 | → glacial | 0.50 | −52 m | +18 m | 23 |
| 5 | `terrain_05_900p3ka_before-Kaukatea.png` | 900,300 | eruption hold | 0.53 | −57 m | +13 m | 23 |
| 6 | `terrain_06_859p3ka_interglacial.png` | 859,302 | → interglacial | 0.50 | −57 m | +13 m | 21 |
| 7 | `terrain_07_818p3ka_glacial.png` | 818,277 | → glacial | 0.50 | −51 m | +19 m | 21 |
| 8 | `terrain_08_793p7ka_interglacial.png` | 793,693 | → interglacial | 0.50 | −52 m | +18 m | 20 |
| 9 | `terrain_09_764p1ka_glacial.png` | 764,143 | → glacial | 0.50 | −47 m | +23 m | 19 |
| 10 | `terrain_10_713p0ka_interglacial.png` | 713,034 | → interglacial | 0.50 | −48 m | +21 m | 18 |
| 11 | `terrain_11_672p7ka_glacial.png` | 672,682 | → glacial | 0.50 | −56 m | +14 m | 16 |
| 12 | `terrain_12_617p5ka_interglacial.png` | 617,493 | → interglacial | 0.50 | −56 m | +13 m | 15 |
| 13 | `terrain_13_563p1ka_glacial.png` | 563,144 | → glacial | 0.50 | −39 m | +30 m | 15 |
| 14 | `terrain_14_519p2ka_interglacial.png` | 519,244 | → interglacial | 0.50 | −38 m | +31 m | 13 |
| 15 | `terrain_15_480p7ka_glacial.png` | 480,651 | → glacial | 0.50 | −51 m | +17 m | 13 |
| 16 | `terrain_16_428p8ka_interglacial.png` | 428,838 | → interglacial | 0.50 | −49 m | +17 m | 12 |
| 17 | `terrain_17_382p1ka_glacial.png` | 382,086 | → glacial | 0.50 | −35 m | +30 m | 11 |
| 18 | `terrain_18_349p3ka_before-Whakamaru.png` | 349,300 | eruption hold | 0.85 | −96 m | −33 m | 10 |
| 19 | `terrain_19_342p5ka_interglacial.png` | 342,499 | → interglacial | 0.50 | −50 m | +12 m | 10 |
| 20 | `terrain_20_314p3ka_glacial.png` | 314,256 | → glacial | 0.50 | −25 m | +37 m | 9 |
| 21 | `terrain_21_255p6ka_interglacial.png` | 255,560 | → interglacial | 0.50 | −49 m | +7 m | 8 |
| 22 | `terrain_22_188p2ka_glacial.png` | 188,216 | → glacial | 0.50 | −36 m | +10 m | 6 |
| 23 | `terrain_23_133p6ka_interglacial.png` | 133,553 | → interglacial | 0.50 | −61 m | −24 m | 6 |
| 24 | `terrain_24_70p8ka_glacial.png` | 70,803 | → glacial | 0.50 | −64 m | −43 m | 4 |
| 25 | `terrain_25_25p5ka_end.png` | 25,500 | window end | 0.90 | −122 m | −114 m | 2 |

**Reading them.**

- **Every crossing sits at g 0.5, mid-swing,** so the stops show the coast halfway between its
  extremes. The deepest lowstand and the highest highstand of each cycle play out inside the
  time-lapses, not at the stops.
- **The stops sit mid-swing, so they cannot show the breathing.** Every crossing is at g 0.5, where
  the sea stands ~+15 to +35 m against today's land, and the coast sits partway across the plain at
  most stops. The interglacial floods to the plain's inland edge and the glacial retreats far to the
  west happen inside the time-lapses between stops. `../terrain_geology_timeline/` samples those
  extremes. A sequence of these frames alone reads as a slow westward drift; that is the sampling,
  not the history.
- **The slow layer still shows.** The mid-swing sea falls from ~+15–30 m early to +7–10 m by
  255–188 ka and below today's in the last cycles, as the land offset shrinks toward the present.
- **At the window end (LGM) the coast is off the wall to the west.** The visible sea has become a sand
  plain, and the river runs across it to the edge (`md/TEMANAWA_COAST_PLAN.md` §5, "The frame edge").
- **The tributaries draw together.** At 1 Ma (01) each is a fan of thin hill streams running down to
  its trunk, and the Pohangina's streams reach the coast on their own. Mid-window (12–15) they are
  braided bundles closing in; by ~340 ka (19) each is one channel. They are there throughout because
  the east-side flow is what cut the gorge (Trewick & Bland 2012).
- **The Woodville lake** widens the main east of the gap only, filling from ~1 Ma to a peak around
  0.9 Ma (04–07) and drained by ~0.6 Ma. The rest of the east is land from the opening (Fig. 4D).
- **Known look nits:**
  - **A strip of land along the top-left edge,** across the drowned sea (most stops). The north-edge
    falloff (`_nsEdgeFalloff`) lifts the far row toward plain height after the flood. It was faint
    before; the deeper flood makes it obvious. At 255 ka (21) a river stub on it reads as a straight
    channel along the edge.
  - (The sheer highstand cliffs of the first sea-level export are gone: the plain is now lowered with
    the sea, and these frames are re-exported with that.) (The faint threads that marked the eastern tributary's course before it emerged are gone:
  the tributaries are present from 1 Ma.)

To regenerate: serve the build with the export endpoint (`node tools/serve.js 8093 --export`, or the
`temanawa-export` launch config), emulate 1920×1080, set `Kiosk.watchdogSeconds = 1e9` and `noLoop()`
(a synchronous morph otherwise trips the watchdog's hard reload), then for each stop year: set
`DeepTime.yearsBP`, clear `terrain._morphFade`, `terrain.morphTo(y)`, `seasonManager.update(0)`,
`water.reconcile(terrain, y)`, and call `Game._composeTerrainLayer` into a 1920×1080 buffer at
`pixelDensity(1)` (the live terrain layer runs at half density). POST the buffer's PNG blob to
`/__export?path=terrain_boost_stops/<file>.png`. Each stop takes ~3 s with the pane visible, far
longer hidden, so run the list in the background and watch the folder.

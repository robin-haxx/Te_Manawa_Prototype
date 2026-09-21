# Te Manawa — Build Plan v3

**The design spine.** Where anything disagrees with this document, this wins; where this
describes the running build it defers to the code.

**Window: ~1 Ma → ~25.5 ka**, opening as a marine embayment and closing on the **Ōruanui**
eruption. The run takes in the axial ranges rising from almost nothing, the antecedent river
holding its line, ~eleven glacial cycles, and four TVZ super-eruptions.

> **Governing principle** (unchanged since v2, §0.1): **this is a cartoon seen from above, not a
> survey of the Manawatū.** Every asset and mechanic is judged on whether it is *legible and
> engaging at a glance from directly overhead in forty seconds, with no reading required* — not
> on whether it is a complete account of the ecology. The research decides what is true; this
> principle decides what gets drawn.

**Technical companion:** `TEMANAWA_BUILD_V3.md` (architecture, budgets, the 158-asset manifest).
**Feeder docs, all still live:** `TEMANAWA_GEOGRAPHY.md` (the land morph), `TEMANAWA_34VIEW_PLAN.md`
(the 3/4 look), `TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md` (climate + eruptions), `TEMANAWA_INTERACTION_HEALTH_PLAN.md`
(the five buttons + health), `TEMANAWA_FAUNA_IMPL.md` (the cast in code), `TEMANAWA_PEDAGOGY.md`
(what it teaches + the road ahead).

---

## 0. Design history

Eight things changed materially during the build, and this section records them:

| # | Change | Now |
|---|---|---|
| 1 | **Window pushed back to ~1 Ma** | ~1 Ma → 25.5 ka, so the ranges *rise* on-screen and the basin *emerges* from the sea (§2, §3) |
| 2 | **Terrain is an SVG geography skeleton** | one authored vector of ranges + river; elevation built around it; deep-time uplift/incision/emergence morph (§2) |
| 3 | **The 3/4 illustrated view is built** | plan-oblique relief bake + cel illustration look + animated water layer (§2) |
| 4 | **"Seasons" are the glacial cycle** | `SeasonManager` rebound to `glacialIndex(yearsBP)`; four buffers = four glacial stages (§3) |
| 5 | **Five buttons** | Deep Time · **FOREST** · **TUSSOCK** · Storm · Eruption; Growth split by climate (§6) |
| 6 | **Habitat health surfaced as scene colour** | a derived scalar `H` desaturates the ground when the land is mismanaged (§7) |
| 7 | **Kererū + a real seed-dispersal loop** | the one runtime mechanic that *grows* the forest; couples Storm to forest health (§5, §7) |
| 8 | **Four eruptions as year-bound skip-targets** | four dated events; the button navigates between them (tap = revert, hold = skip) (§8) |

The **frontier** is four specific things: the **fauna cast**, the **flora art**, the **disturbance
clocks**, and the **back half of the interaction loop** (§13).

---

## 1. The filter — what reaches the visitor

The research produced ~forty findings. Most are invisible on one screen at arm's length in under a
minute. Each candidate got one test: **would a visitor *see* it and *feel* it, without reading
anything?** The survivors, and where they now live:

| # | Finding | Status |
|---|---|---|
| 1 | **The wind never changes direction** — every dune and shadow leans the same way, all eras | Art-direction constraint (§10); not yet drawn |
| 2 | **Tree ferns vanish when it turns cold** | **Half-live** — glacial dormancy suppresses the fern; the era-signal sprite is Phase 5 art |
| 3 | **The moa cast changes with the climate** — the cast *is* the legend for the vegetation | **Authored, not operational** — only one moa species spawns (§5) |
| 4 | **Ash makes the swamps bloom** | **Deferred** — needs a wetland biome; a hook is left in the eruption code (§8) |
| 5 | **Storms bury the dune plants — and they grow into it** | **Not yet** — needs `disturb()` + `warp` (§9) |
| 6 | **Growth does something different everywhere — and the *wrong* growth harms** | **Live** — the FOREST/TUSSOCK split + habitat health (§6, §7) |
| 7 | **The gorge deepens while the river stays put** | **Live** — incision runs ahead of uplift (§2) |
| + | **The basin was once sea; land assembled out of it** | **Live** — emergence, new in v3 (§2, §3) |
| + | **Your management helps or harms the land** | **Live** — scene saturation, new in v3 (§7) |

The one sentence the whole piece exists to land is the geological takeaway: **the river is older
than the mountains.** It is entirely implicit, and it is the strongest teaching in the build today.

---

## 2. The land — geography skeleton and the deep-time morph

*(The built model is `TEMANAWA_GEOGRAPHY.md` + `TEMANAWA_34VIEW_PLAN.md`.)*

**An SVG skeleton, not raster heightmaps.** `geo/manawatu.svg` traces the real Manawatū — one main
river with tributaries, the Ruahine and Tararua ranges — and `tools/svg2geo.js` flattens it at
author-time to `geo/manawatu.geo.js`, a plain data file the kiosk loads like a level (no runtime SVG
parse, honouring "no build step on the wall"). `getElevation()` builds distance fields once per bake:
ranges lift the land toward alpine, the river carves a channel to the water band, noise and a per-run
seed vary the rest. **The river is authored once**, so antecedence falls out of the art for free.

**The morph — three deep-time factors over `yearsBP`** (`geoTimeFactors`, applied in the shared
static `_combineGeo` so the sliced and synchronous bake stay bit-identical):

- **Uplift** — the ranges rise from near-flat at 1 Ma to full height, eased (most uplift is late).
- **Incision** — the gorge deepens, run **slightly ahead of uplift**, so the river visibly outpaces
  the rising ranges. *This is the takeaway.*
- **Emergence / submergence** — a slow monotonic sea-plane lift that leaves **~1/3 of the frame as
  sea/coast at 1 Ma**, retreating to the present shoreline by ~0.5 Ma (`LOOK.seaRise`, dev-tunable).
  The run **opens as a bay** and grows land out of the sea over the first few breaths, distinct from
  the fast glacial coastline ripple (§3).

**The 3/4 illustrated look** (`TeManawa_projection.js`, `LOOK` in `TeManawa_terrain.js`). The
*simulation stays top-down*; only the paint is plan-oblique. The relief bake displaces each row by
`K` (pitch squash, 0.76) and `LIFT`, paints back-to-front, and applies a cel-quantised illustration
pass — flat toon tones, wobbly ink boundaries, slope shading, relief edges, atmospheric haze, a
"quiet" desaturated ground so the outlined sprites pop. Snow and frost are live tints on top. An
**animated water layer** (`TeManawa_water.js`) stamps looping flow decals, eels and sea shimmer over
the baked water so the river reads as flowing rather than a blue ribbon.

**Framing knobs** (level-authored, live-tunable via `GEN`/`B`): `geoBaseCeil` (how much the plains
roll vs the ranges owning the highs), `geoEdgeMargin`/`geoTopMargin` (ease terrain down to plains at
the frame edges so a range truncated at the map edge does not smear vertically in the 3/4 bake),
`viewAreaGain` (zoom the generated world out to show more area at the same cost), and
`Projection.reliefCropBottomFrac` (push the near apron off-frame). The morph re-bakes on an interval
(`morphIntervalYears`), sliced across frames against a millisecond budget so fast-forward never
hitches.

`[NOTE]` The **bottom/edge smear** that dogged the early 3/4 bake is fixed by the edge falloff +
bottom crop above; the ranges are contained within the frame and descend to plains at the edges.

---

## 3. The climate — a glacial cycle keyed to deep time

*(Built per `TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md`, steps 1–4.)*

**There are no seasons in Te Manawa. There is only the glacial cycle, and it is keyed to `yearsBP`.**
`SeasonManager` keeps its name (renaming the buffer keys the harness asserts was judged risky churn)
but its **driver changed from a 2100-frame timer to `Climate.glacialIndexAt(yearsBP)`**:

- **`winterness` *is* the glacial index** — the smooth 0..1 "how cold does it look/behave" scalar
  every cold-keyed behaviour already read (frost tint, moa stress, breeding cooldown, forest
  competition). Re-sourcing it from `glacialIndex` made all of them track deep time for free.
- **The four buffers are four glacial stages**, not seasons — `interglacial / cooling / glacial /
  fullGlacial` (`Climate.stageOf`), blended by `glacialIndex`. Snow line spans warm 0.92 → cold 0.55.
- The season timer is retired; `economy.seasonDuration` is vestigial.

**`Climate.at(yearsBP)`** is one pure, LR04-anchored function returning `glacialIndex`, `seaLevel`,
`snowLine`, `stage`, `MIS`, `tempBias`. The anchor table now runs the **full window back to 1 Ma**,
MPT-aware: full-amplitude ~100-kyr cycles after the Mid-Pleistocene Transition, damped lower-amplitude
~41-kyr cycles before ~0.9 Ma — the change in the *character* of the cold is itself legible. All the
numbers (stage, MIS, sea level) are **debug-only by design**; the visitor reads cold off the land.

**Forest contraction is the single most legible climate signal** (`LEVEL_MECHANICS.forestContraction`,
`forestBandByStage`). The canopy band shrinks from **0.12–0.80** of the slope in the interglacial to
**0.18–0.34** at full glacial — forest visibly retreats downhill as the cold deepens and climbs back
as it eases, tree ferns pushed dormant on the way down. Frost haze, snow line, plant dormancy and the
ambient audio phase-shift all move with it. **Cold is a *different* world, not an empty one** — the
intended read (§5.3 of v2.1) is a busier assemblage of open-country grazers, which waits on the cast
turning on (§5). *Deferred: a per-phase baked treeline in the painted ground; today the ground colour
still reads the static elevation bands while the live cast follows the moving band.*

---

## 4. The plants

*(The table now lives in `TeManawa_plant_defs.js`, keyed by
`coldTolerance` 0 = tree-fern-sensitive → 1 = tussock-hardy.)*

Ten drawn species and seven palette entries, chosen for **read from above** first: every sprite has a
crown, fan or rosette legible from directly overhead (mamaku/tree-fern — **the era signal** — kahikatea,
tōtara, tawa, tī kōuka, harakeke, nīkau, mānuka, black beech, kōwhai). The seven palette species
(spinifex, pīngao, toetoe, raupō, bracken, short tussock, grey scrub) are a **ground colour + tiling
micro-texture**, never entities — from above, ground cover *is* colour, and a whole-field colour change
reads better than a change in the density of small objects. Totara, kawakawa and rewarewa are cut (§15).

**`coldTolerance` does the era work.** Warm/forest types have low tolerance; open-country types have
high tolerance. The glacial dormancy path suppresses low-tolerance plants as `winterness` climbs, and
the same axis classifies the two growth buttons (§6). The plant table drives spawning today: habitats
carry populated `plantTypes` (lowland = tussock/flax/cabbage-tree/mānuka/kōwhai/**grey-scrub**;
**wetland/riverbank = harakeke/tussock/tī-kōuka/kahikatea/mānuka/nīkau/grey-scrub**, at high density so the
corridor reads lush; podocarp = Totara/kahikatea/tawa/fern/nīkau/kōwhai; **montane = tawa/Totara/fern +
scattered beech**; **subalpine = tussock/grey-scrub/dracophyllum/mānuka**), so the cast of *plants* is
live. The era-signal sprites (mamaku, nīkau) are still to draw.

`[ART 2026-08-17]` **Glacial/open-country shrubs are now sprited and placed.** `coprosma` is the code key
for a **visual grey-scrub umbrella** — its variant sprites are the grey-scrub guild (coprosma, pōhuehue/
*Muehlenbeckia*, …) under `sprites/Shrub/`; **dracophyllum** is drawn and placed in the subalpine (it
appears once the ranges rise). **Tussock** now renders 6 mature-size variants. A new `variantFiles` sprite
loader handles the non-standard/umbrella filenames. *Matagouri* stays a defined-but-unplaced spare (a
South-Island shrub, off the Manawatū glacial record).

`[REVIEW 2026-08-17]` **Placement reconciled with the ecology docs.** Two corrections landed: montane is
now **podocarp-broadleaf, not beech forest** — black beech is famously *absent* from the Manawatū (the
"beech gap"; tawa grows in every forest type except beech, and the only beech in Esler's survey is the
~526 ha Aokautere anomaly — `TEMANAWA_ECOLOGY.md` §3.3), so beech is a scattered minority now; and the
riverbank wetland got a per-biome density lift. **Open follow-up (needs a decision):** beech's *true*
role is the **glacial refugium tree** (dominates LGM tree pollen, holds in sheltered pockets), but the
code puts it in `FOREST_TREES`, so the glacial forest-contraction *suppresses* it like a warm tree —
backwards. Making beech hold (or gain) through the cold is the more interesting teaching fix; it touches
the contraction machinery and a bootcheck assertion, so it is flagged, not yet done.

**Cover changes two ways, and they teach two different things.** *Browsing prunes; it never clears.* A
grazer's bite takes a slice of a plant's foliage — the plant gets a little smaller and regrows in place —
so moa crop the bush without ever clear-felling it (`Plant.consume`; knobs `browseBite`/`browseFloor`).
What makes trees *disappear* is *unsuitable habitat*: a canopy tree the glacial pushes outside the
contracting forest band **dies back**, shrinking away to open ground rather than standing as a wilted
sprite, so the forest visibly **retreats** in the cold and **sprouts back** in the interglacial
(`forestDieback`/`forestRecoverRate`; the tree survives in place as rootstock, so the cycle is reversible
without waiting on re-dispersal — the unattended kiosk never ratchets the forest away). Herbivory and
climate are thus legible as *separate* forces: the first shapes plants, the second decides where the
forest can live. Health stays decoupled from live cover — grazing must never desaturate a healthy map
(`MISTAKES.md`).

**~45 plant assets** (41 sprites + 4 shared micro-textures). Tōtara, black beech and harakeke already
have usable art.

---

## 5. The fauna cast

*(The built cast is `TeManawa_fauna_impl` → `TEMANAWA_FAUNA_IMPL.md`.)*

Every animal is a `Boid` subclass on a **two-clock split**: `behave(sim, season, dt)` runs life
(aging, hunger, breeding, feeding, dispersal) on the **deep-time-warped** clock, while `update(rdt)`
runs motion/animation on the **real** frame clock — so a 10× fast-forward morphs the world without
turning the animals into a sped-up cartoon. Reproduction goes through one `Egg` type tagged with
`offspringType`. Per-entity UI (bars, hearts, glyphs) is debug-only.

**Three classes are in the code:**

- **Moa** — the browser and core prey loop: a full state machine (idle/forage/feed/flee/migrate/seek-
  mate/mate), hunger- and threat-driven, migrating up/down the preferred-elevation band with the
  glacial cycle, breeding sexually behind a security timer. **Nine species are fully defined** in
  `MOA_SPECIES` with size, speed, elevation preference and traits (eagle resistance, camouflage, the
  bush-moa `spriteSet`) — **but the scaffold spawns only Upland Moa.** *There is no species turnover
  to read yet; turning it on is the highest-leverage teaching work left (§13, §14).*
- **The apex raptor** — patrol/hunt/rest/relocate/distract, prey prediction, a catch radius, and a
  Storm distraction that breaks off the hunt (the moa reprieve). Two demography models: top-down
  prey-coupled, or emergent (fixed nests, energy budgets, sexual breeding toward an eagle:moa ratio,
  Lotka-Volterra hunting restraint).
- **Kererū** — the frugivore and **the one runtime mechanic that grows the forest** (§7). Short hops
  between fruiting warm/large-fruited trees, perch, feed to fill a crop, then **drop one seed per leg
  *away* from the source** (`disperseSeed`, cap-guarded) — dispersal earned by eating. Abundant in the
  forested interglacial, thinning in the glacial when the canopy contracts and the birds can't feed;
  a live storm grounds the flock. Emergent sexual breeding; a population floor keeps a disperser alive.

`[RESOLVED]` **The raptor identity is now Eyles' harrier / kērangi throughout** (*Circus teauteensis*) —
a giant harrier that quartered low over open country and forest edge, the North Island apex avian
predator (Haast's eagle was South-Island-only). Reconciled in **data** (`EAGLE_SPECIES.eyles_harrier`,
`young_eyles_harrier`), **class** (`EylesHarrier`), **text** (notifications now say *kērangi*, not
*Pouākai*) and **art** (already `sprites/EylesHarrier/`). The internal base-type key stays `'eagle'` — a
mechanical list name, not visitor-facing. *Flight style now retuned:* `patrol()` flies quartering
BURSTS — a fast committed dash, then a slow glide, sweeping low back and forth over the territory —
instead of circling a `patrolCenter`, and cruise altitude is lower (the low-quartering read). The
hunt/catch/breeding **balance** is still the inherited Haast's-scaled model and was deliberately left
untouched (the delicate area — see the memory `ecology-feedback-model`); patrol only runs when the bird
is calm, so the flight change does not touch predation.

Caps live in `LEVEL_MECHANICS`: moa 60, eagle 12, kererū 16 (floor 2). Coastal *Euryapteryx* is the
conditional eighth species (+5 assets) if the coast earns a distinct band.

---

## 6. The controls

> **Being overhauled — see `TEMANAWA_SECOND_SCREEN.md`.** The single-screen five-button model
> below is the *built* baseline and still runs the diorama from keys `1`–`5`. It is being
> replaced by a **two-screen** install: a 1080p **touchscreen** beside the 4K diorama drives a
> three-station model (habitat switch → per-species encyclopedia/boost-select → activate),
> talking to the sim over `BroadcastChannel`. The two load-bearing changes: **geology is
> paused** until a timelapse is spent, and the boost is **per-species** and always runs to the
> **next glacial/interglacial** on a 500→5000 yr/s ramp. Storm and eruption survive as-is. That
> document is authoritative for the interaction model; this section is retained as the baseline
> it grows out of.

### 6.1 The five buttons (baseline)

*(Built per `TEMANAWA_INTERACTION_HEALTH_PLAN.md`. Kiosk input widens to `1`–`5`.)*

The wall is five buttons — a flag-plus-per-frame-read pattern on `Game`, no event bus.

| Key | Label | Does | Teaches |
|---|---|---|---|
| **①** | **50,000 YEARS** | Eases into a **10× fast-forward** (~46–50 ky/press); the whole deep-time morph runs | Deep time is a clock you can *drive*, not just watch |
| **②** | **FOREST** | Matures warm/low-`coldTolerance` cover toward `growth=1`; boosts kererū forage | The **right** growth for the **interglacial** — forest thickens, health rises |
| **③** | **TUSSOCK** | Matures cold-hardy/high-`coldTolerance` open cover | The **right** growth for the **glacial** — tussock/scrub spread, health rises |
| **④** | **STORM** | Distracts hunting eagles (moa reprieve) **and** grounds the kererū (dispersal stops) | Double-edged: a shelter that, **overused**, starves the forest of seed (§7) |
| **⑤** | **ERUPTION** | Navigates between the four dated eruptions: **tap → revert** to the previous (older) event and replay its recovery; **hold → skip** to the next (younger) event and fire its clearing | Eruptions reset the forest, then it returns; the deep-time volcanic record (§8) |

The load-bearing pair is **FOREST / TUSSOCK**: the same gesture does opposite things at opposite ends
of the climate cycle, so pressing the *wrong* one for the current climate visibly harms the land. The
climate gate is `getWinterness() ≥ 0.5` (glacial); mid-tolerance plants like flax are neutral to both,
so there is no universal-win press.

---

## 7. Habitat health — the readout

*(`TEMANAWA_INTERACTION_HEALTH_PLAN.md` steps 1–4 built, step 5 (tune) open.)*

A single scalar **`H ∈ [0,1]`** is surfaced as the **saturation of the ground**: full colour when the
land is tended, a slow desaturation toward a **tired floor (`SAT_FLOOR ≈ 0.35`, never full grey)** when
it is mismanaged. `H` is **not a score the buttons move directly** — it is *derived from the sim*, so the
colour on the wall is an honest diagnostic of the world's state. The buttons act on the ecology; `H`
follows, on a long ease so cause and effect read as a visible drift.

```
H_target = F × R          // either one sick drains the scene
```

- **`F` — regime fit.** Is the standing cover the right type for the current climate? A climate-matched
  growth press raises `F`; a mismatched press drains it (mostly emergent from the existing dormancy/
  forest-contraction machinery, plus a small authored notch so the colour answers within a 40-second
  visit).
- **`R` — recruitment.** Can the forest regenerate? Driven by the kererū loop: in the interglacial the
  forest should be recruiting; **zero live kererū, or storm-grounded kererū, stalls it and `R` falls.**
  In the glacial the forest isn't recruiting anyway, so `R` is dormant and the cold is not punished.

**Storm's hidden cost** is a decaying **storm-pressure accumulator**: each press adds pressure (τ ≈ 17 s
decay); above an overuse line the kererū stay grounded *between* storms too, so **spamming Storm →
dispersal stalls → the forest thins → the scene drains of colour.** A single press stays below the line.

Saturation is applied as a `saturate()` filter around the **ground blit only** (cheaper on a 4K panel and
on-brand with the "quiet ground" look), gated off entirely when healthy (zero cost in the steady state).
It rides a **photosensitivity slew cap** (≥500 ms / ≤3 luminance transitions per second) and is kept
**orthogonal to the glacial frost** — a cold-but-healthy scene stays colourful-under-blue; only a *sick*
scene drains. All weights live in one `HEALTH` block. *Step 5 (tune SAT_FLOOR, ease/slew, the mismatch
notch; on-panel photosensitivity sign-off) is the remaining interaction work.*

---

## 8. The four eruptions

*(`TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md` §2–3, steps 5–7 built.)*

Four **year-bound TVZ super-eruptions** bookend and punctuate the run. Each is a **skip-target**; the
drama differs by **magnitude × the habitat standing when it hits**, which is truer and more watchable
than four copies of one flash.

| # | Event | yearsBP | Landscape then | Clearing tier |
|---|---|---|---|---|
| 1 | **Kidnappers / Potaka** (Mangakino) | 1,000,000 | marine basin, land just emerging | Major — but masked by sea; spectacle is pumice over water |
| 2 | **Kaukatea** (TVZ) | 900,000 | still marginal-marine | Minor — "it barely happened" |
| 3 | **Rangitawa / Whakamaru** | 349,000 | fully emergent, glacial (MIS 10) | **Catastrophic** — near-total clearing, the set-piece |
| 4 | **Kawakawa / Ōruanui** (Taupō) | 25,500 | near-LGM, sparse cover | Severe on sparse cover; the run/skip **wraps** here |

One field, **`ashCover`** (0→1 at the event, decaying over a sim-year window), does three legible things:
the seizure-safe ash **fall** flash + a grey ground tint; a **clear** that knocks back plants weighted by
severity (canopy hardest); and a **soft regrow** as the ash decays and the map repopulates from the
existing spawn/regrowth timers. Three severity tiers (`ERUPTIONS[i].tier`: minor/major/catastrophic), one
code path. **Wetland bloom** (finding #4) — the **wetland biome now exists** (§14.5, a riparian swamp
classified by river proximity), so the deferred bloom finally has a habitat to attach to; it rides on
the `warp` disturbance clock still to be built (§9).

Button ⑤ navigates the events: **tap → `prevEruption`** (revert + replay recovery), **hold →
`nextEruption`** (skip + clearing), both seeks on `yearsBP` with an immediate terrain morph under the
charge-ramp flash. **Ōruanui is the terminal/wrap point** — a forward skip past Rangitawa wraps to 1 Ma
(its fallout is too close to the present to show, and the wrap doubles as the natural restart). The
events also **auto-fire as the clock crosses each date** in normal play, so the ambient timeline shows
them without the button.

`[NOTE]` **The eruption-checkpoint reset costs the "reset is nearly free" invariant.** The attract/idle
reset now returns to the *previous eruption* and morphs the terrain (~1.2 s, crossfaded) rather than the
bare ~17–31 ms ecosystem swap. It is infrequent, but it is above the old soft-reset budget — an open
decision (§16).

---

## 9. Disturbance and the aftermath that teaches

*(**`warp` clock + wetland bloom BUILT** 2026-08-17; the `wet`/`open`/`bare` fields + kahikatea river-
recruitment remain — see the tail. Memory: `warp-disturbance-clock`.)*

The best teaching structure in the research is invisible at kiosk speed: three of the four measured
recovery times are instantaneous at 500 sim-years/second. The fix — now built — is the **`warp` local
clock**: `Simulation.disturb(x, y, radius, kind, strength)` stamps a warp bump that **decays on REAL
time** (`updateDisturbance(rdt)`), so a disturbed cell recovers over a fixed ~2 s wall-time beat even
under 10× fast-forward, and `Plant.handleGrowth` reads `warpAt(pos)` to accelerate local regrowth. It is
a small **list of active disturbances**, not the four `Float32Array` fields originally sketched — same
`warpAt` query, allocation-free and deterministic (nothing to tear across the sliced morph). Wired:

- **Storm** — each windthrown/knocked plant fires `disturb('gale')`, so the gap **grows back into the
  storm** over the beat (finding #5; the `sand`/`flood` habitat-split of the original sketch is folded
  into the existing dune sand-flux + the forest gale).
- **Eruption** — `applyAsh` now **spares the wetland** from the clearing (tephra fertilises, not clears —
  `wetlandAshSpare`) and calls **`bloomWetland`** (seeds swamp growth on the standing wetland + warps it),
  so the **wetland bloom** (finding #4) finally fires: verified live, a catastrophic eruption clears the
  forest (93→26 plants) while the swamps **bloom** (98→104). "The forest clears, but the swamps grow."

**Kahikatea now requires river disturbance to recruit** (wetland doc §4.1, built 2026-08-17): it is a
disturbance coloniser, not a climax tree — `disturbanceRecruit` takes it out of the free kererū/FOREST-
button paths, so it establishes only on raw alluvium (storm flood, eruption sediment pulse, or the deep-
time channel shift), and a stand with no fresh disturbance **ages out** (`Plant` senescence). This is the
rule that finally couples the moving river to the swamp forest. Verified: FOREST press → 0 kahikatea,
storm → +8, eruption → +6, a static river declines to nothing. Memory: `warp-disturbance-clock`.

**Still deferred here:** only the per-cell `wet`/`open`/`bare` substrate remains unbuilt (the `warp` list
covers the actual usage). Today `ashCover`, the glacial `forestBand`, the sand-flux, the `warp` clock
**and** the kahikatea–river coupling move the cast.

---

## 10. Art direction doing the work mechanics can't

*(The brief is `TEMANAWA_SPRITE_BRIEF.md`.)*

Four rules constrain every asset before it is drawn: (1) **silhouette from above beats silhouette from
the side** — a cabbage tree is a starburst, a nīkau a radial crown, a rewarewa a dot; (2) **two-layer
canopy** — scattered emergents (`h4`, ~234×500, `anchor:'base'`) sort above a continuous canopy (`h3`,
96²) at roughly double the footprint; (3) **dune shape follows the plant** — spinifex builds smooth 6 m
dunes, pīngao low convex ones, so the coast reads correctly with no extra system; (4) **the wind never
changes direction** (finding #1) — every asymmetric silhouette, shadow and dune leans the same way, in
all eras. **Buried logs** (sand-buried, drowned-in-peat, ash-killed) make the *history* of a cell visible
and recur in every dive. Cel-quantised palettes (2–3 tones + an outline colour per biome) keep the ground
on-brand with the illustrated look (§2).

---

## 11. Architecture and the numbers

*(Full detail in `TEMANAWA_BUILD_V3.md`; this is the current shape and the constraints that decide it.)*

**Vanilla JS on p5.js, classic scripts, no build step, one screen, unattended kiosk, no network.** 31
hand-ordered scripts (`index.html`); the order is load-bearing and the harness (`tools/bootcheck.js`)
enforces it. Modules new since v2.1: `TeManawa_projection.js` (pure 3/4 projection), `geo/manawatu.geo.js`
+ `tools/svg2geo.js` (the skeleton), `TeManawa_water.js` (animated water), `TeManawa_atlas.js` (sprite-
strip loader — one `loadImage` per animation), `TeManawa_plant_defs.js` (the flora table), `TeManawa_kereru.js`,
`TeManawa_devtools.js` (`LOOK`/`GEN` live tuning).

**Split-resolution rendering** (`CONFIG.spriteSupersample`, default 2): the backing canvas is `SS×` the
logical 1080 and one `scale(SS)` renders sprites + HUD at that resolution, while the **terrain opts out**
into a 1080 offscreen buffer — the ground stays cheap, the cast stays crisp. `pixelDensity` stays **1**.

| Limit | Value |
|---|---|
| Sim grid | **256²** target; **currently 512²** (`CONFIG.mapGrid`) — the sliced-rebake precondition to drop it has landed |
| Live plants / fauna | ≤ 1,000 (dispersal cap 900) / ≤ 300 |
| `image()` per frame | ≤ 1,500 · `pixelDensity` = 1 |
| Soft reset | 17–31 ms — **except** the eruption-checkpoint reset, now ~1.2 s (§8, §16) |
| Photosensitivity | ≤ 3 luminance transitions/sec; changes ramped ≥ 500 ms |

**`init()` costs several seconds** (~6.8 s in the harness — the terrain bake is heavy: supersampled
paint, geography fields, 3/4 relief). Nothing on the visitor path may call it: the soft
`resetEcosystem()` keeps the terrain — **except** the eruption-checkpoint attract reset, which
re-morphs and costs ~1.2 s (§8, §16). `createGraphics` buffers must be `remove()`d when replaced; never
allocate in `draw()` or a reset. Terrain colours are baked into the four glacial-stage buffers — a colour
change needs a re-bake (`B`), not a per-frame read.

---

## 12. The asset manifest

**~113 new assets** (`TEMANAWA_BUILD_V3.md` §4: 158 total, 45 in hand — plants 45, fauna 64, terrain/
landform 21, disturbance FX 12, UI 16). `TEMANAWA_SPRITE_BRIEF.md` counts **132 with terrain illustration
stamps** — the two need reconciling into one figure behind the asset manifest (§13.G). **All three fauna
classes currently run on placeholder/partial art** (a drawn glyph or a single frame); the finished cast —
the seven species, the *Dinornis* dimorphism pair, the kererū flight set, the era-signal plants — is the
critical path, because nothing can *teach* until it can be *drawn*. The atlas loader exists; **no frame map
does yet**. Start the art now, in parallel with everything else, behind the manifest.

---

## 13. Build status — where we actually are

The prototype does **not** map onto the v2.1 §8 phase ledger — it runs ahead in some places and behind in
others. Honest current state:

| Phase | Intent | Status |
|---|---|---|
| **0–2** | fork cleanup, deep-time clock, timeline | ✅ Done |
| **3 — Terrain** | landform + look | ✅ **Built** — SVG skeleton, uplift/incision/**emergence** morph, 3/4 relief bake, cel look, water layer |
| **4 — Climate/fields** | glacial cycle + per-cell fields | **Partial** — glacial rebind, climate to 1 Ma, forest contraction **built**; the four `disturb()` fields + `warp` **not built** (§9) |
| **5 — Flora** | plant table + art | **Partial** — table + spawning **built** (`plant_defs`, populated `plantTypes`); **cover dynamics reworked** so grazing *prunes* (a plant gets smaller, never removed) and *unsuitable habitat* is what makes trees disappear — the glacial forest band die-back now retreats and regrows the forest (§4); **art is placeholder** |
| **6 — Disturbance** | `disturb()` + `warp`, wire buttons | **Mostly built** — eruption clear/regrow (`ashCover`) + the **`warp` clock** (`disturb`/`warpAt`, real-time-paced recovery) + storm windthrow aftermath + the **wetland bloom** all built (§9). Remaining: `wet`/`open`/`bare` per-cell fields, kahikatea river-recruitment |
| **7 — Fauna** | seven-species cast, predator corrections | **Mostly built** — the founder mix now spawns **7 grazers** (5 moa + North Island goose + mōho/NI takahē) **+ 3 flyers** (kererū, kōkako, huia) with a no-extinction feedback model; **raptor identity resolved** (Eyles' harrier); **per-species cold adaptation now live** (`seasonalModifiers` re-keyed by glacial phase). Remaining: harrier flight behaviour, the *Dinornis* dimorphism pair |
| **+ Interaction** | five buttons, health, kererū | ✅ **Built** (steps 1–4); tuning (step 5) open — *new track, not in the v2.1 ledger* |
| **+ Second screen** | 1080p touchscreen, three-station model, per-species boost | ✅ **Built** — spec + touchscreen page + `BroadcastChannel` bus (`TEMANAWA_SECOND_SCREEN.md`, `secondscreen/`, `TeManawa_bus.js`), **and the sim overhaul (§7)**: geology **paused by default**, `DeepTime.beginTimelapse` 500→5000 yr/s ramp, `Climate.nextRegimeBoundary`, `Simulation.seedSpecies`, the real regime-fit boost + eruption-aware ending, live telemetry. Bootcheck extended & green; browser-verified end-to-end. Remaining: the **tuning pass** (ramp feel, seeding strength, fauna coupling) |
| **8 — Kiosk** | hardening, audio, lockdown | **Not started** — audio still preloads 6.5 MB; `mapGrid` still 512 |

The true frontier is narrow and specific: **the fauna cast turning on, the flora art, the disturbance
clocks, the back half of the interaction loop, and the second-screen sim overhaul.**

---

## 14. The road to a finished installation

Ordered by **teaching leverage**, not phase number (expanded in `TEMANAWA_PEDAGOGY.md` §5–6). The
through-line is a single shift: moving natural-history facts out of the **authored-but-mute** column and
into the **land and the cast**, where a visitor reads them in forty seconds without being asked to read.

1. ~~**Resolve the raptor identity** (§5)~~ — ✅ **done.** Eyles' harrier / kērangi in data, class, text and
   art. Behaviour tuning (low quartering flight) remains, deferred to the next predator-balance pass.
2. **Lock the asset manifest + naming convention** (`REORG.md` §8 step 1) — unblocks every sprite and the
   atlas; reconcile the 158-vs-132 count.
3. **Start the art** on the seven-species cast and the two era-signal plants (mamaku, nīkau) — the assets
   that carry findings #2 and #3.
4. ~~**Spawn the fauna cast** (§5)~~ — ✅ **largely done.** The founder mix spawns 7 grazers + 3 flyers with
   a no-extinction feedback model (`ecology-feedback-model`), and the `seasonalModifiers` are now correctly
   keyed by glacial phase so **per-species cold adaptation is live** (`seasonal-modifiers-key-mismatch`,
   resolved) — open-country/subalpine grazers innately hold in the cold while forest moa retreat, so the
   cold-vs-warm turnover reads from the animals, not just the visitor's TUSSOCK press.
5. ~~**Build the disturbance clocks** (§9)~~ — ✅ **built.** `disturb()` + `warpAt` (a real-time-decaying
   warp that paces each aftermath to a visible beat), read by plant recovery; wired to the storm
   (windthrow gaps grow back in) and the eruption, which now **spares + blooms the wetland** — the
   deferred finding #4 finally fires ("the forest clears, but the swamps grow"), and **kahikatea now
   requires river disturbance to recruit** (wetland doc §4.1 — the last big ecology loop, coupling the
   moving river to the swamp forest). Remaining §9 tail: only the `wet`/`open`/`bare` per-cell fields. See
   `warp-disturbance-clock`.
6. **Finish the interaction loop** (§7 step 5): tune the health feel and the photosensitivity slew, and
   the browse/die-back feel (§4) — how far a bite crops (`browseBite`/`browseFloor`) and how fast the
   glacial forest retreats and regrows (`forestDiebackRate`/`forestRecoverRate`), watched over a full
   unattended climate cycle so the forest reads as *cycling*, not declining.
7. **The second-screen sim overhaul** (`TEMANAWA_SECOND_SCREEN.md` §7): ✅ **built & verified** — the
   geology is **paused by default** (`DeepTime` holds `yearsBP`, the terrain with it; the ambient world
   keeps living at 1×), the boost runs the **500→5000 yr/s ramp to the next glacial/interglacial**
   (`Climate.nextRegimeBoundary` + `DeepTime.beginTimelapse`), seeds the **chosen species**
   (`Simulation.seedSpecies`) behind a per-species regime-fit gate, and is **eruption-aware** (stops
   short, fires the ash beat a moment later). What's left is the **load-bearing tuning pass** — the
   ramp feel and photosensitivity slew, seeding strength, and the fauna coupling (a plant boost lifting
   its linked birds, §9.3) — the paused clock's ripples into climate, the morph and the short-dwell
   pedagogy are now settled in code and green in the harness.
8. **Kiosk hardening + audio** (Phase 8): preload only the ambient bed and lazy-load the rest (the biggest
   cold-boot fix outstanding), drop `mapGrid` 512 → 256, photosensitivity and touch-target sign-off.
9. **Interpretation + mana whenua co-design** (§16): the mute layer — nine moa and twelve plants carry
   `displayName`/`scientificName`/`description` with Māori names, plus phase and migration narration, all
   authored and none rendering — waits on a curatorial decision about whether and how the piece names things.

Steps 1–2 are days, not weeks, and they unblock the rest.

---

## 15. What we are deliberately not building

Fertility as a second axis; the light-at-
ground-level field; five wetland classes (collapsed to a single `wet` axis, itself deferred); the 1.8 m
zonation; the dune-phase chronology as a mechanic; the divaricate/moa-browse debate (browse is modelled
only as simple pruning — §4 — not the co-evolutionary arms race in plant architecture); ~20 plant species
indistinguishable from above (including Totara, kawakawa, rewarewa); then-and-now framing. **Fire is a
correction, not a cut** — no ignition source in this window, volcanic only. **The wetland bloom** (finding
#4) is deferred, not cut — it waits on a wetland biome, with a hook left in the eruption code (§8).

---

## 16. Open decisions

Resolved: window end (25.5 ka, Ōruanui); huia, kererū and the *Dinornis* pair all in; five buttons;
seasons are glacial periods; sea ≈ 1/3 of the frame at 1 Ma; no wetland bloom this pass; health is global
and derived. Still open, gating the work they touch:

1. **Timeline arrow-vs-wave** — a first pass draws both (uplift wedge + climate wave); deciding it unblocks
   the UI art.
2. ~~**The raptor identity** (§5)~~ — ✅ **resolved** to Eyles' harrier / kērangi in data, class, text and art.
3. **The eruption-checkpoint reset cost** (~1.2 s, §8) against the old "reset is nearly free" invariant —
   accept the heavier attract reset, or find a cheaper checkpoint path.
4. **Coastal moa** — build the conditional eighth species (+5 assets)?
5. **`mapGrid` 512 → 256** — the precondition has landed; do the drop and retune plant/spawn density.
6. **Saturation scope** (§7) — ground-only (shipped) vs whole-scene, from a real 4K profile.
7. ~~**Hardware / input path**~~ — **resolved** to a **two-screen** install: a 4K diorama plus a 1080p
   **touchscreen** control surface driving the sim over `BroadcastChannel` (`TEMANAWA_SECOND_SCREEN.md`).
   The physical controls (habitat switch, plant-select, storm, boost, eruption) hang off the touchscreen.
8. ~~**A sibling landform screen**~~ — **resolved**: the second screen is the encyclopedia/control surface,
   not a landform view; the geology stays on the 4K diorama but is now **paused until a timelapse**
   (`TEMANAWA_SECOND_SCREEN.md` §0).
9. **Acknowledge the absences** — a single quiet end-card carrying the strongest material in the research
   (97% of the wetland gone, under 5% of the plains vegetation)?
10. **Mana whenua co-design** — naming, narration, story framing, and any use of the Te Ahu a Tūranga bone
    story. This is the track that would finally let the mute interpretive layer speak.

---

**Reference:** `TEMANAWA_BUILD_V3.md` (architecture, budgets, manifest) · `TEMANAWA_PEDAGOGY.md` (what it
teaches, the road ahead) · `TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md` · `TEMANAWA_INTERACTION_HEALTH_PLAN.md` ·
`TEMANAWA_FAUNA_IMPL.md` · `TEMANAWA_GEOGRAPHY.md` · `TEMANAWA_34VIEW_PLAN.md` · the ecology deep dives
and `research/*.pdf` (the evidence base the filter draws from).

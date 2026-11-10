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

**Technical companion:** `TEMANAWA_BUILD_V3.md` (architecture, budgets, the asset manifest).
**Live feeder docs:** `TEMANAWA_SECOND_SCREEN.md` (the interaction model, authoritative for it),
`TEMANAWA_GEOGRAPHY.md` and `TEMANAWA_COAST_PLAN.md` (the land morph and the sea),
`TEMANAWA_PALAEO_ATTRACT.md` (the attract sequence), `TEMANAWA_FAUNA_IMPL.md` (the cast in code),
`TEMANAWA_GOALS.md` (the plant goals) and `TEMANAWA_OPERATIONS.md` (running the install). The built
plans behind §2–§7 (the 3/4 view, the deep-time ecology, interaction and health) are in `md/archive/`.

> **Status reconciled 2026-11-02** against the code and the harness, ahead of final testing and
> handoff. §13 is the honest state; §14 is what is left.

---

## 0. Design history

Ten things changed materially during the build, and this section records them:

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
| 9 | **A touchscreen console drives the wall** | a 1080p console over `BroadcastChannel`: habitat switch → per-species boost → a ramped time-lapse to the next glacial/interglacial; geology paused until then; plus a time dial (§6, `TEMANAWA_SECOND_SCREEN.md`) |
| 10 | **The attract is the live 1 Ma land; a press plays an intro over today's map** | *(revised 2026-11-08; was the land before the window, now the dev `P` key only)* idle shows the fresh 1 Ma world with no UI and the clock held; a press fades to black, then the present-day map (the sim's own land at 0 BP) with an orientation, back into the live land, one line, then the UI; the end of the window plays an outro over the same map (habitats, species, the river today) and returns to the attract (`TeManawa_attract.js`) |

Since this table began, the fauna cast, the disturbance clocks, the console, the plant goals and the
attract sequence have all been built. What is left is **pre-handoff hardening, two visitor-facing
changes, and the tuning and co-design passes** (§13–§14).

---

## 1. The filter — what reaches the visitor

The research produced ~forty findings. Most are invisible on one screen at arm's length in under a
minute. Each candidate got one test: **would a visitor *see* it and *feel* it, without reading
anything?** The survivors, and where they now live:

| # | Finding | Status |
|---|---|---|
| 1 | **The wind never changes direction** — every dune and shadow leans the same way, all eras | **Partly drawn** — the wind gusts blow one way across the frame (`TM_WIND`); the dune and shadow lean is still an art-direction rule (§10) |
| 2 | **Tree ferns vanish when it turns cold** | **Half-live** — the fern is drawn and goes dormant in the cold, but the drop is not yet large enough to see (`TEMANAWA_GOALS.md` §5, gap 6) |
| 3 | **The moa cast changes with the climate** — the cast *is* the legend for the vegetation | **Live** — eight grazers with per-species cold adaptation: the open-country birds hold the cold, the forest birds the warm (§5) |
| 4 | **Ash makes the swamps bloom** | **Live** — an eruption spares and blooms the wetland while the forest clears (§9) |
| 5 | **Storms bury the dune plants — and they grow into it** | **Live** — a storm buries and burns the seaward margin and snaps the emergents; the gaps grow back on the `warp` clock (§9) |
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
- **The sea** — the coast is **relative sea level in metres** (`Climate.SEA_ANCHORS`, net of a slow
  tectonic offset) flooding a baked shelf by contour, so every glacial cycle sweeps the coast across
  the plain and the run **opens as a bay** at 1 Ma (`TEMANAWA_COAST_PLAN.md` §5 and §5b). The old
  positional stand-ins (`LOOK.seaRise`, the SW strait) are retired; the south strait stays as the
  depocentre.

**Before the window**, the attract sequence drives the same morph from 4 Ma to the 1 Ma opening at
dated pre-window anchors (`GEO_EPOCHS.palaeo*`, `TEMANAWA_PALAEO_ATTRACT.md`). The river names are
lettered along the channels (`TeManawa_rivernames.js`): the main stem from the opening, each
tributary only once its deep-time fan has closed into one channel (≈ 395 ka, `tribNameSpread`).

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
intended read (§5.3 of v2.1) is a busier assemblage of open-country grazers, which the founded cast
now delivers (§5). **The painted ground now follows the band too (cold cover, 2026-10-28):** each
glacial stage's bake opens the forest biomes above that stage's treeline (`forestBandByStage[stage].max`)
into an authored shrub–grassland ramp (`levelDef.biomes[*].coldCover`), with dark beech held on slopes
in the lee of the NW wind — about two-thirds open at full glacial, as the LGM pollen has it
(`TEMANAWA_ECOLOGY_OPEN.md` §4). The interglacial treeline clears every forest band, so the warm ground
is unchanged. Knobs: `LOOK.coldCover*`; harness section "cold cover"; frames in `exports/cold_cover/`.

---

## 4. The plants

*(The table now lives in `TeManawa_plant_defs.js`, keyed by
`coldTolerance` 0 = tree-fern-sensitive → 1 = tussock-hardy.)*

Ten drawn species and seven palette entries, chosen for **read from above** first: every sprite has a
crown, fan or rosette legible from directly overhead (mamaku/tree-fern — **the era signal** — kahikatea,
tōtara, tawa, tī kōuka, harakeke, nīkau, mānuka, black beech, kōwhai). The seven palette species
(spinifex, pīngao, toetoe, raupō, bracken, short tussock, grey scrub) are a **ground colour + tiling
micro-texture**, never entities — from above, ground cover *is* colour, and a whole-field colour change
reads better than a change in the density of small objects. Rimu, kawakawa and rewarewa are cut (§15).

**`coldTolerance` does the era work.** Warm/forest types have low tolerance; open-country types have
high tolerance. The glacial dormancy path suppresses low-tolerance plants as `winterness` climbs, and
the same axis classifies the two growth buttons (§6). The plant table drives spawning today: habitats
carry populated `plantTypes` (lowland = tussock/flax/cabbage-tree/mānuka/kōwhai/**grey-scrub**;
**wetland/riverbank = harakeke/tussock/tī-kōuka/kahikatea/mānuka/nīkau/grey-scrub**, at high density so the
corridor reads lush; podocarp = Totara/kahikatea/tawa/fern/nīkau/kōwhai; **montane = tawa/Totara/fern +
scattered beech**; **subalpine = tussock/grey-scrub/dracophyllum/mānuka**), so the cast of *plants* is
live. The era-signal plants are drawn (`sprites/TreeFern/`, `sprites/Nikau/`).

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

`[ENCYCLOPEDIA 2026-10-13]` **The second-screen roster is era-framed and the sim now agrees with
it** (`TEMANAWA_ENCYCLOPEDIA_FLORA.md`). Black beech is a cold species (coldTolerance 0.8, and its
glacial-stage modifier rises into the cold), which closes the follow-up above. Kōwhai and tī kōuka
are neutral (0.7), since each sits on one warm and one cold screen. Two **art-sharing types** were
added: `sedge` (pūrei, *Carex secta*, wetland, on the tussock art) and `wharariki` (mountain flax,
subalpine, on the flax art). The doc's §5 ranks the remaining omissions: rimu first, then a glacial
conifer shrub (~26% of southern North Island LGM pollen), then raupō.

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

**Art:** every one of the 15 plant types the habitats place has a sprite set (`PLANT_SPRITE_SETS`;
`sedge` and `wharariki` share the tussock and flax art). See §12 for the asset count.

---

## 5. The fauna cast

*(The built cast is `TeManawa_fauna_impl` → `TEMANAWA_FAUNA_IMPL.md`.)*

Every animal is a `Boid` subclass on a **two-clock split**: `behave(sim, season, dt)` runs life
(aging, breeding, dispersal) on the **deep-time-warped** clock, while `update(rdt)` runs
motion/animation on the **real** frame clock — so a 10× fast-forward morphs the world without
turning the animals into a sped-up cartoon. Metabolism (hunger, starvation) also runs on the real
clock, since feeding is motion; on the life clock every time-lapse starved the grazers (`MISTAKES.md`). Reproduction goes through one `Egg` type tagged with
`offspringType`. Per-entity UI (bars, rings, glyphs) is debug-only; the mating heart and the kōkako's
song note are the two visitor-facing marks.

**The cast as built** — thirteen North Island birds, each on dedicated multi-state art:

- **Eight grazers, one guild (`Moa` and its subclasses)** — four North Island moa (the giant
  *Dinornis*, the little bush *Anomalopteryx*, Mantell's *Pachyornis* and the stout-legged
  *Euryapteryx*, on three moa sprites), the North Island goose *Cnemiornis*, the mōho / North Island
  takahē, the North Island brown kiwi and Finsch's duck. A full state machine (idle/forage/feed/flee/
  migrate/seek-mate/mate), hunger- and threat-driven, migrating with the glacial band, breeding
  sexually behind a security timer. Per-species `seasonalModifiers` are keyed by glacial phase, so the
  open-country grazers hold the cold and the forest moa and kiwi hold the warm. The kiwi turns the
  forest floor (a small regrowth warp). The South Island upland and heavy-footed moa stay defined in
  `MOA_SPECIES` but are not founded.
- **The apex raptor** — patrol/hunt/rest/relocate/distract, prey prediction, a catch radius, and a
  Storm distraction that breaks off the hunt (the moa reprieve). Two demography models: top-down
  prey-coupled, or emergent (fixed nests, energy budgets, sexual breeding toward an eagle:moa ratio,
  Lotka-Volterra hunting restraint).
- **Kererū** — the frugivore and **the one runtime mechanic that grows the forest** (§7). Short hops
  between fruiting warm/large-fruited trees, perch, feed to fill a crop, then **drop one seed per leg
  *away* from the source** (`disperseSeed`, cap-guarded) — dispersal earned by eating. Abundant in the
  forested interglacial, thinning in the glacial when the canopy contracts and the birds can't feed;
  a live storm grounds the flock. Emergent sexual breeding; a population floor keeps a disperser alive.
- **Three more flighted forest birds** extend the kererū's engine: the **kōkako** (song and territory,
  weak flight), the **huia** (male–female pairs) and the **tūī** (a strong, wide-ranging nectar feeder
  on the kōkako's song machinery). All disperse less than the kererū.

**One bird per plant.** Every second-screen plant adds one bird, and every founded bird sits on one or
two plants (`TEMANAWA_ENCYCLOPEDIA_FLORA.md` §2.6). A no-extinction feedback model (surplus-only
predation, per-species floors and breeding tapers, Allee aid) keeps the unattended cast alive; the
harness section "fauna stability" runs it for 16,000 ticks at 1 Ma and at 300 ka.

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

Caps live in the level (`levels/level_temanawa_scaffold.js`): the grazer guild shares
`economy.maxPopulation` (60), the kererū flock caps at `kereruMaxPopulation` (16), and the harrier
takes no prey over 40 kg (harness "harrier prey ceiling").

---

## 6. The controls

> **Superseded on the wall — see `TEMANAWA_SECOND_SCREEN.md` (built).** The install is **two
> screens**: a 1080p **touchscreen** console beside the 4K diorama drives a three-station model
> (habitat switch → per-species encyclopedia/boost-select → activate) over `BroadcastChannel`.
> **Geology is paused** until a time-lapse is spent, and the boost is **per-species** and always
> runs to the **next glacial/interglacial** on a 500→5000 yr/s ramp. Storm and eruption survive
> as-is. A **time dial** on the macro pad (`]` / `[` / `\`, or the wheel) is a standing
> fast-forward, 0 → 5,000 yr/s over 30 detents. The five keys below still drive the diorama and
> the harness presses them; they are the baseline the console grew out of.

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
it is mismanaged. The buttons act on the ecology; `H` follows, on a long ease so cause and effect read as
a visible drift.

```
H_target = (1 − ash) × F × R × L          // any one sick drains the scene
```

- **`L` — the ledger, and the bar on the wall.** *(Built 2026-11-05: `Simulation.ecoHealth`, knobs under
  ECOSYSTEM HEALTH in the scaffold.)* One number, moved by what the visitor does, and it is the top band's
  health bar. `L` reads 1 at a new visitor's level and above, so the default look is untouched, and drains
  below it. The birds and the plants read the same number (below), so the bar, the land and the colour
  cannot disagree. A new visitor stands at 0.5; it holds until the visitor changes it, and the attract
  landing starts it again.

  | What the visitor does | The bar |
  |---|---|
  | The live goal's **answer** | Up. **Four in a row fill it, from any level**. **Only an answer takes it past 75 %.** At 100 % the year, the tallies and the gauge go the climate's bright green or blue |
  | The right climate, not the answer | Below 75 %, a smaller gain that stops at 75 %. Above it, **down a notch (0.0625) toward 75 %**, never past it |
  | **Totally wrong** (wrong plant, wrong climate) | Down. **Four in a row leave it poor (≤ 0.2), from any level** |
  | The right plant in the wrong climate | Half of that |
  | A **first** storm | Up a little, to 75 % at most: the land is better for one. Above 75 % it changes nothing |
  | Each storm after it in succession | Down. **The fifth in a row leaves it poor.** A boost, or 40 s without a storm, ends the run |
  | An **eruption** | Down **by its tier** (2026-11-08: minor 0.04, major 0.10, catastrophic 0.16, and 0/1/2 steps of every banked lift), never under 0.32 on its own, so an eruption alone never brings on the 25 % warning. The same on every path: the button's rebuild carries the land's lifts, birds and flags across (§8). The goal line moves to a post-eruption goal (`requires.eruption`), and answering it counts **double**: health, habitat lift, seedlings and birds |

  A step's size is set when a run begins, from where the land stands then. That is what makes "four
  wrong goals" true from a full bar and from a half one. The rest of the living world follows: **above**
  the start every bird target rises toward its authored level and every habitat holds at least half the
  maximum lift; **below** it the bird targets fall to `faunaShockFloor` and the habitats' base to
  `homeoPoorFrac` in the poor state, and each wrong boost or overused storm takes a step of banked lift
  back, with the census running fast for a while so the crash is plain to see. The numbers are events,
  never a census of the land, which jittered and stepped with every morph (`MISTAKES.md`).

  **The two milestones** *(built 2026-11-08, `TeManawa_milestone.js`)*. When the bar reaches **full**, the
  wall fades to white (1.2 s) and back onto the land with **every piece of UI gone**: the clock held, the
  land grown in to what the ledger holds under the white, playing in real time for **15 s**, with a
  congratulations and the count of each bird kind fading in and out; then the UI fades back. At **25 %**
  the same through black onto a **desaturated** land, with a warning and the counts. Each waits for the
  land to be at rest (a boost's time-lapse landed, no eruption or storm running), plays once per climb
  (full again only after falling back to 75 %, the warning again only after climbing back to 50 %), and
  takes the visitor's input as presence only while it plays.

  **In the cold the healthy land is open country** *(built 2026-11-08)*. The forest habitats turn over to
  their `glacialPlantTypes` in a glacial (tussock, scrub, beech; `Simulation._homeoTurnover`): the warm
  trees fall back to a low refugial remnant and the cold cover replaces them, and the reverse in the
  interglacial. Health raises whatever the climate's palette is, so a full bar in a glacial is dense
  tussock-shrubland, not a forest the ledger kept standing (md/ecology/TEMANAWA_ECOLOGY_OPEN.md §4).

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
This is the quick, behavioural half of overuse; the ledger above is the half that lasts.

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
code path. **Wetland bloom** (finding #4) is built: the eruption spares and blooms the riparian
wetland while the forest clears (§9).

**The aftermath covers one boost/goal cycle** (decided and built 2026-11-02, `DeepTime.AFTERMATH`).
Keyed to sim-years alone, the ash never cleared while geology was paused (the default), so a visitor's
eruption left the ground grey at the saturation floor until somebody boosted. Now its span is the real
time one boost from the eruption year takes to the next glacial/interglacial (clamped to 15–60 s): a
boost begun in the aftermath runs the rest of the ash out exactly as its time-lapse lands, an
unattended wall clears over the same span, and the dial still clears it on `decayYears` if that is
sooner. `AFTERMATH.idleClears = false` holds the ash until a boost lands instead. The staged beats of
`TEMANAWA_ERUPTION_AFTERMATH_PLAN.md` (bare canopy, bracken flush, the cohort) are still to come.

Button ⑤ navigates the events: **tap → `prevEruption`** (revert + replay recovery), **hold →
`nextEruption`** (skip + clearing), both seeks on `yearsBP` with an immediate terrain morph under the
charge-ramp flash. **Ōruanui is the terminal/wrap point** — a forward skip past Rangitawa wraps to 1 Ma
(its fallout is too close to the present to show, and the wrap doubles as the natural restart). The
events also **auto-fire as the clock crosses each date** in normal play, so the ambient timeline shows
them without the button.

`[NOTE]` **The eruption-checkpoint reset is now only the recovery path.** `Kiosk.resetToAttract()`
replays a random eruption checkpoint and morphs the terrain (~1.2 s in the browser; 3.2–4.1 s in the
harness on 2026-11-02). Since 2026-11-01 idle and end-of-window play the attract sequence instead, which
lands on the bare `resetEcosystem()` swap, so the checkpoint reset runs only on error recovery and with
`TM_PALAEO.enabled = false`. Whether a recovery should take the cheapest path is §16.3.

---

## 9. Disturbance and the aftermath that teaches

*(**Built:** the `warp` clock, the wetland bloom and kahikatea river recruitment. Only the per-cell
`wet`/`open`/`bare` fields remain, deferred — see the tail.)*

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
While deep time is MOVING (a boost's time-lapse, a deep burst) the river works its whole floodplain,
so wetland kahikatea don't age; a kahikatea boost seeds only on the wetland, as a fresh flood. Without
this every boosted stand aged out inside its own time-lapse (2026-10-14,
`TEMANAWA_ENCYCLOPEDIA_CARDS.md` gap 2).

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

**Vanilla JS on p5.js, classic scripts, no build step, two screens, unattended kiosk, no network.**
45 hand-ordered project scripts in `index.html` (plus p5 and p5.sound); the order is load-bearing and
the harness (`tools/bootcheck.js`) enforces it. The module list is in `CLAUDE.md` (Layout). The
console is a separate static page, `secondscreen/`, on the same local server.

**Split-resolution rendering** (`CONFIG.spriteSupersample`, default 2): the backing canvas is `SS×` the
logical 1080 and one `scale(SS)` renders sprites + HUD at that resolution, while the **terrain opts out**
into a 1080 offscreen buffer — the ground stays cheap, the cast stays crisp. `pixelDensity` stays **1**.
The cast draws through a DOM-stacked **WebGL** layer by default (`TeManawa_glbatch.js`, from a runtime
sprite atlas), falling back to 2D when WebGL is missing, lost or software-rendered; `?render=2d` opts out.

| Limit | Value |
|---|---|
| Sim grid | **256²** target; **currently 512²** (`CONFIG.mapGrid`) — the sliced-rebake precondition to drop it has landed |
| Live plants / fauna | ≤ 1,000 (dispersal cap 900) / ≤ 300 |
| `image()` per frame | ≤ 1,500 · `pixelDensity` = 1 |
| Soft reset | the attract landing (`resetEcosystem()`): 17–31 ms when last measured, before the cast grew · `resetToAttract()` re-morphs to an eruption: ~1.2 s browser, 3.2–4.1 s harness (§8) |
| Photosensitivity | ≤ 3 luminance transitions/sec; changes ramped ≥ 500 ms |

**`init()` costs several seconds** (7.6–8.5 s in the harness on 2026-11-02 — the terrain bake is
heavy: supersampled paint, geography fields, 3/4 relief). Nothing on the visitor path may call it: the
soft `resetEcosystem()` keeps the terrain, and the every-12th reseed runs under the attract sequence's
opening dark with the heartbeat stamped. `createGraphics` buffers must be `remove()`d when replaced; never
allocate in `draw()` or a reset. Terrain colours are baked into the four glacial-stage buffers — a colour
change needs a re-bake (`B`), not a per-frame read.

---

## 12. The asset manifest

**The cast is drawn.** Every founded bird runs on dedicated multi-state art (`sprites/Moa/`,
`sprites/Flighted/`, `sprites/EylesHarrier/`), every placed plant type has a sprite set (§4), and the
eruption cover, storm, wind, water and timeline have their own art (`sprites/Environmental/`,
`sprites/UI/`). A runtime atlas packs it all at setup (`TeManawa_spriteatlas.js`; 482 frames in one page
at 0.5× in the harness), so there is no hand-made frame map to maintain.

The manifest in `TEMANAWA_BUILD_V3.md` §4 (158) and the count in `TEMANAWA_SPRITE_BRIEF.md` (132) both
predate the art that arrived. Re-count them against the folders before commissioning anything more. The
unused art still in `sprites/` is listed in §14.4.

---

## 13. Build status — where we actually are

The prototype does **not** map onto the v2.1 §8 phase ledger — it ran ahead of it. Honest state on
2026-11-02:

| Phase | Intent | Status |
|---|---|---|
| **0–2** | fork cleanup, deep-time clock, timeline | ✅ Done (the timeline now draws from `sprites/UI/`) |
| **3 — Terrain** | landform + look | ✅ **Built** — SVG skeleton, uplift/incision morph, the sea-level coast, 3/4 relief bake, cel look, water layer, river names along the channels |
| **4 — Climate/fields** | glacial cycle + per-cell fields | ✅ **Built** — glacial rebind, climate to 1 Ma, forest contraction, cold cover (the painted ground opens above each stage's treeline). The per-cell `wet`/`open`/`bare` fields are deferred; the `warp` list covers their use (§9) |
| **5 — Flora** | plant table + art | ✅ **Built** — table and spawning, browse-prunes / habitat-removes cover dynamics, plant homeostasis, every placed plant drawn (§4). Open: rimu, a glacial conifer shrub, raupō (`TEMANAWA_ENCYCLOPEDIA_FLORA.md` §5) |
| **6 — Disturbance** | `disturb()` + `warp`, wire buttons | ✅ **Built** — `ashCover` with an aftermath that covers one boost/goal cycle (§8), the `warp` clock, storm windthrow, the wetland bloom, kahikatea river recruitment. Open: the aftermath plan's staged beats |
| **7 — Fauna** | the cast, predator corrections | ✅ **Built** — 8 grazers, Eyles' harrier and 4 flyers (§5), the no-extinction feedback model, the 40 kg prey ceiling, per-species cold adaptation, the harrier's quartering flight. Open: the *Dinornis* dimorphism pair |
| **+ Interaction** | five buttons, health, kererū | ✅ **Built** — now driven from the console on the wall (row below). Tuning (step 5) open |
| **+ Second screen** | 1080p touchscreen, three-station model, per-species boost | ✅ **Built** — the console page, the `BroadcastChannel` bus, geology paused by default, the 500→5000 yr/s ramp to the next regime boundary, `Simulation.seedSpecies`, the regime-fit gate, eruption-aware endings, live telemetry (`TEMANAWA_SECOND_SCREEN.md`). Open: the boost-feel tuning pass |
| **+ Plant goals** | a question a plant answers | ✅ **Built** — the line above the timeline, drawn from the live goals along the moa → harrier → lowland → forest-bird sequence, judged on each boost, with a fresh goal when the dial or a deep burst carries the clock across a glacial turn (`TeManawa_goals.js`, `TEMANAWA_GOALS.md`) |
| **+ Time dial** | a standing fast-forward on the macro pad | ✅ **Built** — 0 → 5,000 yr/s over 30 detents, eased, kept across resets, relayed over the bus (`DeepTime.dialStep`) |
| **+ The attract, intro and outro** | the idle wall, a visitor's way in and the window's end | ✅ **Built** (2026-11-08, `TeManawa_attract.js`) — the live 1 Ma land with no UI while idle; a press: black, the present-day map (`TerrainGenerator.snapshotYear(0)`, lined up with the sim's rivers, named) and an orientation, the live land, one line, the UI; the end of the window: the outro over the same map, then the attract. Harness "attract". Open: the copy (§16), the map's look |
| **+ The land before the window** | the attract as a palaeogeography sequence | ✅ **Built** (2026-11-01), **off the wall since 2026-11-08** (dev `P` key only) — idle and end-of-window played a land-only 4 Ma → 1 Ma sequence through the terrain's dated geology extended before the window (`GEO_EPOCHS.palaeo*`: the Whanganui Basin's shelf, the basement finger, the Manawatū Strait narrow at 3 Ma / widest at 2.4 Ma / closed from 1.63 Ma, the Ruataniwha shelf closing with Mount Bruce — Trewick & Bland 2012 Fig. 4A–D), its own clock, the names of the time, every swap crossfaded, then the fresh 1 Ma world (`TEMANAWA_PALAEO_ATTRACT.md`). Open: the co-design pass on pacing and holds |
| **8 — Kiosk** | hardening, audio, lockdown | ✅ **Built** — watchdog, error ring buffer, nightly reload, idle attract, the key lockdown (`?dev` unlocks), `draw()` error recovery, the console page's own layer, the software-WebGL guard, audio not loaded (§14.1). Open: commissioning on the install hardware (`TEMANAWA_OPERATIONS.md` §8) |

**Harness, 2026-11-02:** the plant-goals failure (the Dracophyllum goal at 30 ka, failing on every run
since at least 2026-11-01, `main` included) was the harness's white-noise terrain, whose ranges barely
rise (peak ~0.65 at every date); the real build reaches ~0.88. The test now stages the subalpine belt,
and the "ranges rise with deep time" probe compares the crests instead of a count above 0.6. Some
checks stay seed-dependent (fauna stability's refound count once read 23 against a limit of 20, where
other runs read 12–17): re-run before treating one of those as real.

What stands between here and opening is §14: the kiosk fixes, two visitor-facing changes, then the
tuning and co-design passes.

---

## 14. The road to a finished installation

Reset on 2026-11-02 for final testing and handoff. The items finished since the last version of this
list (the raptor identity, the fauna cast, the disturbance clocks, the second-screen sim overhaul) are
in §13.

### 14.1 Before final testing — kiosk defects

Found in the 2026-11-02 audit; items 1–6 **fixed the same day** (harness section "kiosk hardening";
`MISTAKES.md` has the three that were worth a rule).

1. ✅ **The nightly reload repeated through the 03:00 minute** — a freshly booted page has
   `lastResetMs = 0`, so every boot inside that minute reloaded again. The page must now also have
   been up two minutes (`Kiosk._bootAt`).
2. ✅ **There was no software key lockdown**, though `TEMANAWA_BUILD_V3.md` §3 said there was. Now
   `Kiosk.keyAllowed`: without `?dev` on the URL only `1`–`5` and the time dial reach the game; any
   other key is presence only. The console's own keys (`d` plant-next, `r` the Alpine detent) no longer
   act on the wall when its window has focus, and the hold-`D` gallery asks the same gate.
3. ✅ **A `draw()` exception ended the p5 loop**, so the soft recovery recovered nothing and the
   watchdog reloaded 10 s later. `draw()` now catches: on the wall `Kiosk.frameError` logs, unwinds the
   push stack and recovers, and past `frameErrorMax` (3) errors inside 30 s it hard-reloads; with `?dev`
   it rethrows. `Kiosk.recover()` aborts a running attract sequence first, and a long reset stamps the
   heartbeat.
4. ✅ **The console page had no kiosk layer.** `secondscreen/kiosk.js` (loads first): an error ring
   buffer (`TMConsoleKiosk.getErrorLog()`), a reload on a burst of errors, and the 03:00 reload with the
   same boot guard. It still does not return to its landing card between visitors (§16.13).
5. ✅ **`tools/serve.js` crashed on a malformed URL.** It now answers 400; the path check also requires
   the separator (a sibling folder no longer passes), and a taken port exits with a clear message.
6. ✅ **Audio is not loaded** (decided 2026-11-02; **superseded 2026-11-10**: audio is on again, rebuilt on Web Audio with room limits, see `TEMANAWA_BUILD_V3.md` §3 and `audio/CREDITS.md`): `AudioManager.enabled` (false) now gates loading as
   well as playback, so `preload()` decodes none of the 6.5 MB. Five of the clips were never played
   (`win`, `loss`, `tutorial_tip`, `moa_milestone`, `bolt_strike`).
7. ✅ **The plant-goals harness failure** was the harness's terrain, not the gate (§13): the test now
   stages the subalpine belt one cell short of the threshold, then at it. The geography probe "ranges
   rise with deep time" now compares the mean of the highest 1% of cells, not a count above 0.6 that
   was often `0 -> 0`.

### 14.2 Visitor-facing changes (decided and built 2026-11-02)

1. ✅ **The eruption aftermath covers one boost/goal cycle** (§8, `DeepTime.AFTERMATH`). Its span is
   the real time one boost from the eruption year takes to the next glacial/interglacial, clamped to
   15–60 s. A boost begun in the aftermath runs the rest of the ash out as its time-lapse lands; with
   nobody boosting, it clears over the same span, so the wall is never left grey; the dial still clears
   it on `decayYears` if that is sooner. `AFTERMATH.idleClears = false` makes the ash wait for a boost
   instead (the idle attract still resets an unattended wall). The staged beats in
   `TEMANAWA_ERUPTION_AFTERMATH_PLAN.md` §3 can follow on this clock.
2. ✅ **A fresh goal when the timeline is sped past a glacial turn** (`TMGoals._fastForwarding`). When
   the time dial or a deep burst carries the clock across a glacial/interglacial turn, a new goal is
   drawn instead of holding the old one across the swing. A boost's own time-lapse is left alone: it
   lands on the turn by design, and its verdict already decides (a solve draws anew).

### 14.3 Tuning and co-design

1. **Interaction feel:** habitat health (`SAT_FLOOR`, ease and slew, the mismatch notch), the
   photosensitivity sign-off on the real panel, and the browse/die-back feel (`browseBite`,
   `browseFloor`, `forestDiebackRate`, `forestRecoverRate`) watched over a full unattended cycle so the
   forest reads as *cycling*, not declining.
2. **Boost feel:** the ramp, seeding strength, and how many birds a matched boost recruits
   (`TM_BOOST.faunaRecruit`, `TEMANAWA_SECOND_SCREEN.md` §9.3).
3. **The attract's words:** the intro's orientation, the line over the 1 Ma land and the outro
   (`TM_ATTRACT.copy`), and which places the present-day map names (`TM_ATTRACT.labels`). The older
   sequence's open notes (`TEMANAWA_PALAEO_ATTRACT.md` §8) apply only if it comes back to the wall.
4. **Interpretation and mana whenua co-design** (§16.10): naming, narration, which stories are told.
   The encyclopedia cards on screen are draft copy; `TEMANAWA_ENCYCLOPEDIA_CARDS.md` holds a longer
   three-part draft that needs a layout decision.
5. **The *Dinornis* dimorphism pair** (females far larger), still unmodelled.

### 14.4 Cleanup — optional, harness-verified

- **The dead placeable path.** `Simulation.addPlaceable` is never called, yet `PlaceableObject`, the
  `PLACEABLES` table (with costs and emoji) and the placeable grid every moa and harrier queries each
  frame are all still wired; the storm now distracts the harrier straight from the HUD. Only
  `placeableSprites` (clouds, lightning, wind) is live. With it, the rest of the economy residue in
  `CONFIG`, `GAME_STATE` and the level format (`archive/TEMANAWA_REORG.md` §5).
- ✅ **Unused assets (cleared 2026-11-06).** Retired to `sprites/_retired/`: `Environmental/AshCloud/` (86 frames,
  222 MB — the cover plays `VolcanicAsh/`), `VolcanicAshCloud_Sprite_00001.png` and the 45 superseded sprites
  at the top of `sprites/` (`eagle_*`, `moa_*`, `LB_moa_*`, the old plant state sets, `mantis_talk`,
  `Kereru_Perched`). Deleted: the unloaded fonts (FreckleFace-Regular, GroceryRounded, the OpenDyslexic `.otf`
  set; the HUD's `FreckleFace` is NF Nadira), the August `geo/manawatu_0…5.svg` drafts and the duplicate
  `exports/terrain_geology_timeline - Copy*` folders. The history still carries them.
- **Ship a deploy copy, not a clone** (`TEMANAWA_OPERATIONS.md` §5): the wall needs about 95 MB; the git
  history alone is about 500 MB.

---

## 15. What we are deliberately not building

Fertility as a second axis; the light-at-
ground-level field; five wetland classes (collapsed to a single `wet` axis, itself deferred); the 1.8 m
zonation; the dune-phase chronology as a mechanic; the divaricate/moa-browse debate (browse is modelled
only as simple pruning — §4 — not the co-evolutionary arms race in plant architecture); ~20 plant species
indistinguishable from above (including rimu, kawakawa, rewarewa); then-and-now framing. **Fire is a
correction, not a cut** — no ignition source in this window, volcanic only.

---

## 16. Open decisions

Resolved: window end (25.5 ka, Ōruanui); huia, kererū and the *Dinornis* pair all in; five buttons, then
the touchscreen console (7, 8 below); seasons are glacial periods; health is global and derived; the
wetland bloom (built, §9); coastal moa (the stout-legged *Euryapteryx* is founded); **audio off for
opening, and not loaded** (2026-11-02); **the eruption aftermath covers one boost/goal cycle**
(2026-11-02); **a fresh goal after a fast-forward through a glacial turn** (2026-11-02). Still open:

1. **Timeline arrow-vs-wave** — the timeline now draws from `sprites/UI/` art; confirm that closes it.
2. ~~**The raptor identity** (§5)~~ — ✅ **resolved** to Eyles' harrier / kērangi in data, class, text and art.
3. **The recovery path's cost** — the eruption-checkpoint reset (~1.2 s, §8) now runs only on error
   recovery. Keep it, or let a recovery take the cheap `resetEcosystem()` swap?
4. ~~**Coastal moa**~~ — resolved: the stout-legged moa is in the founder mix.
5. **`mapGrid` 512 → 256** — the precondition has landed; do the drop and retune plant/spawn density, or
   record 512 as final.
6. **Saturation scope** (§7) — ground-only (shipped) vs whole-scene, from a real 4K profile.
7. ~~**Hardware / input path**~~ — **resolved** to a **two-screen** install: a 4K diorama plus a 1080p
   **touchscreen** control surface driving the sim over `BroadcastChannel` (`TEMANAWA_SECOND_SCREEN.md`).
   The physical controls (habitat switch, plant-select, storm, boost, eruption) and the time dial hang
   off the console. Still to fix: the switch mode and key map in `secondscreen/input.js` (its temporary
   3-key macro-pad overload; in absolute mode the `e` detent shadows the eruption key).
8. ~~**A sibling landform screen**~~ — **resolved**: the second screen is the encyclopedia/control surface,
   not a landform view; the geology stays on the 4K diorama but is now **paused until a timelapse**
   (`TEMANAWA_SECOND_SCREEN.md` §0).
9. **Acknowledge the absences** — a single quiet end-card carrying the strongest material in the research
   (97% of the wetland gone, under 5% of the plains vegetation)?
10. **Mana whenua co-design** — naming, narration, story framing, and any use of the Te Ahu a Tūranga bone
    story. This is the track that would finally let the mute interpretive layer speak.
11. **The live fauna outline** — on for the bush moa and kererū only (a prototype, `TeManawa_outline.js`).
    Extend it to the cast (masks baked offline) or switch it off for opening.
12. **The title** — the page says *Avian Age: Te Manawa*; the blog says *A River Older Than Mountains*.
13. **The console between visitors** — should it return to its landing card when the wall goes to attract?
14. ~~**Subalpine tops at 1 Ma.**~~ — ✅ **decided 2026-11-02: a date window.** The real build's 1 Ma
    land already carries a subalpine belt (568 and 3,522 cells on the two seeds sampled, against the
    200-cell gate; 8,000+ by 600 ka), so the habitat gate alone opened the Dracophyllum and wharariki
    goals from the start. The three goals answered only from the tops (`most-kinds-here`,
    `wind-seeds`, `flax-cousin`) now carry `fromYearsBP: 500000`, "ranges well risen"
    (`TEMANAWA_NATURAL_HISTORY.md`): the two wharariki goals open at 500 ka, the cold Dracophyllum one in
    the MIS 12 glacial (480 ka). Goals where a
    subalpine plant is one answer among several are unchanged, and the subalpine palette can still
    place Dracophyllum on the 1 Ma tops. Harness: "plant goals" §3a.

---

**Reference:** `TEMANAWA_BUILD_V3.md` (architecture, budgets, manifest) · `TEMANAWA_SECOND_SCREEN.md` ·
`TEMANAWA_OPERATIONS.md` · `TEMANAWA_FAUNA_IMPL.md` · `TEMANAWA_GEOGRAPHY.md` · `TEMANAWA_COAST_PLAN.md` ·
`TEMANAWA_PALAEO_ATTRACT.md` · `TEMANAWA_NATURAL_HISTORY.md` · the built plans in `md/archive/`, the ecology
deep dives in `md/ecology/`, and `research/*.pdf` (the evidence base the filter draws from).

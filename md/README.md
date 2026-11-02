# Te Manawa — document index

Reorganised 2026-11-02 for final testing and handoff. **Live** documents sit in `md/`; the ecology
research is in `md/ecology/`; plans that are built or superseded are in `md/archive/`. File names
are unique, so a bare name in any document (`TEMANAWA_REORG.md`) still finds its file.

**Where documents disagree, the order of the spine below is the order of precedence**, and where a
document describes the running build, the code wins.

**Current state:** the run opens ~1 Ma (as a marine embayment) and closes on Ōruanui (~25.5 ka). The
idle attract and every end-of-window reset first replay **the land before the window**, a land-only
sequence from 4 Ma, and land on a fresh 1 Ma world. A 1080p touchscreen console drives the 4K wall over
`BroadcastChannel`: geology is paused until a visitor boosts a plant, which runs a ramped time-lapse to
the next glacial or interglacial. Thirteen North Island birds are founded on dedicated art. What is left
before opening is in `TEMANAWA_PLAN_V3.md` §14.

**New here?** Read `TEMANAWA_PLAN_V3.md` (the spine: design, honest status, the road ahead). Installing
or running it: `TEMANAWA_OPERATIONS.md`. The natural history the piece is built on:
`TEMANAWA_NATURAL_HISTORY.md`.

---

## The spine — build from these

| # | Document | Role |
|--:|---|---|
| 1 | **`TEMANAWA_PLAN_V3.md`** | **The design spine.** Current design, honest phase status (§13), the road to installation (§14), open decisions (§16). Anything that disagrees with this loses, except on interaction |
| 1b | **`TEMANAWA_SECOND_SCREEN.md`** | **The interaction model.** The touchscreen, the three stations, the paused-geology time model, the bus vocabulary, the boost. Wins over the spine on interaction |
| 2 | **`TEMANAWA_BUILD_V3.md`** | Architecture, kiosk self-run, the asset manifest, performance and load budgets. The technical companion: it makes no design decisions |
| 3 | **`TEMANAWA_GEOGRAPHY.md`** | The terrain: the SVG skeleton, elevation built around it, the deep-time morph, the rivers |

If you are about to write code, read `BUILD_V3.md` §5 (the budgets) and `../CLAUDE.md` as well.

---

## Running the install

| Document | |
|---|---|
| **`TEMANAWA_OPERATIONS.md`** | **The operator guide.** What to deploy, the two windows, the browser flags, what the kiosk layer does on its own, how to recover and read the error log, and the known gaps before opening |
| `TEMANAWA_DEVTOOLS.md` | The console dev workflow: `LOOK` (paint), `GEN` (landform), `GEO` (ranges), the `B` / `G` / `N` keys. Read before tuning the look |

---

## Systems — how the built pieces work

| Document | |
|---|---|
| `TEMANAWA_COAST_PLAN.md` | **The sea.** Relative sea level in metres over a baked shelf; why the popular LGM maps mislead; the measured coast positions. Built 2026-10-19 (§5, §5b) |
| `TEMANAWA_PALAEO_ATTRACT.md` | **The land before the window.** The 4 Ma → 1 Ma attract sequence (Trewick & Bland 2012, Fig. 4A–D), its conflicts with the other systems and how each was resolved (§5), the open co-design items (§8). Built 2026-11-01 |
| `TEMANAWA_FAUNA_IMPL.md` | **The cast in code.** What each animal is, how it behaves, breeds and draws, and where it is wired |
| `TEMANAWA_GOALS.md` | **The plant goals.** How a goal is chosen, every goal and when it appears, the encyclopedia entries fact-checked, the sim gaps, words to explain for 8–14-year-olds |
| `TEMANAWA_HABITATS.md` | Quick reference for the four sim habitats: plants on screen and in the sim, linked birds, goals by climate |

---

## Plans not yet built

| Document | |
|---|---|
| `TEMANAWA_ERUPTION_AFTERMATH_PLAN.md` | **Post-eruption regrowth.** A research-grounded staged aftermath. Step 0 is built (2026-11-02) as "the aftermath covers **one boost/goal cycle**" (`DeepTime.AFTERMATH`), so the wall no longer stays grey while geology is paused; the staged beats (steps 1–8) are not built |

---

## Content, interpretation and art

| Document | |
|---|---|
| **`TEMANAWA_NATURAL_HISTORY.md`** | **The synthesis.** What makes the Manawatū's deep past unusual: a river older than mountains, the lost hunter, the shifting forest. Maps each onto the code and says where the build takes licence |
| `TEMANAWA_ENCYCLOPEDIA_FLORA.md` | **The console's plant roster, checked.** The era verdict on each habitat's plants, the boost-gate conflicts, the plant–bird pairing (§2.6), and the write-ups behind `secondscreen/encyclopedia.js` |
| `TEMANAWA_ENCYCLOPEDIA_CARDS.md` | **Draft three-part cards** (fun facts · role · what a boost does) for every plant, with measured boost trials. Longer than the cards on screen; needs a layout decision. Draft, not on screen |
| `TEMANAWA_SPRITE_BRIEF.md` | **The art brief.** Footprint rules, tiers, states. Its asset count (132) predates the art that arrived; re-count before commissioning more (`PLAN_V3.md` §12) |
| `blog/` | Blog drafts: `post1_land_draft.md` (the long version) and `post1_land_tidied.md` |

All visitor copy is draft until the mana whenua co-design (`PLAN_V3.md` §16.10).

---

## `ecology/` — research, not instruction

The evidence base the plan filters. `PLAN_V3.md` §1 ("the filter") decides how much of it reaches the
screen, which is deliberately not much. Primary sources are the PDFs in `../research/`.

| Document | |
|---|---|
| `ecology/TEMANAWA_ECOLOGY.md` | Overview. Overlaps the five regional files below |
| `ecology/TEMANAWA_ECOLOGY_COAST.md` | Dunes, lagoons, pīngao and spinifex; the sand-flux model's source (§10) |
| `ecology/TEMANAWA_ECOLOGY_LOWLAND.md` | Lowland forest |
| `ecology/TEMANAWA_ECOLOGY_WETLAND.md` | Swamp, peat, drowned forest; the eruption sequence (§6) |
| `ecology/TEMANAWA_ECOLOGY_OPEN.md` | Open country, downland, loess; the LGM cover the cold-cover bake follows (§4) |
| `ecology/TEMANAWA_ECOLOGY_FAUNA.md` | Fauna in ecological context |
| `ecology/TEMANAWA_FAUNA.md` | The scored native-fauna longlist |
| `ecology/TEMANAWA_FAUNA_POOL.md` | The candidate pool and visual hooks, for the illustrator. Overlaps `FAUNA.md` |
| `ecology/TEMANAWA_SPECIES_KERANGI.md` | Kērangi / Eyles' harrier in depth, and why it is not Haast's eagle |
| `ecology/TEMANAWA_RESEARCH.md` | Sources and reading notes; cultural grounding |

`ECOLOGY.md` against the regional files, and `FAUNA.md` against `FAUNA_POOL.md`, are genuine
duplication. Consolidating research risks losing detail for tidiness, so **leave the text as it is.**

---

## `archive/` — built or superseded

Kept as the design record. Each carries a banner saying what changed; the current state is
`PLAN_V3.md` and the code.

| Document | Why it is here |
|---|---|
| `archive/TEMANAWA_34VIEW_PLAN.md` | The 3/4 view and cel restyle — built |
| `archive/TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md` | The glacial rebind, climate to 1 Ma, forest contraction, the four eruptions — built (its emergence and bloom notes are out of date) |
| `archive/TEMANAWA_INTERACTION_HEALTH_PLAN.md` | FOREST/TUSSOCK, habitat health, the kererū loop, storm overuse — built; the console now drives it |
| `archive/TEMANAWA_TERRAIN_PLAN.md` | The raster-keyframe terrain plan — superseded by `GEOGRAPHY.md` |
| `archive/TEMANAWA_REORG.md` | A structural proposal from August, mostly not acted on. §5 (the economy residue) is still accurate |
| `archive/TEMANAWA_PEDAGOGY.md` | What the wall teaches and the road ahead, as of 2026-09-20 — before the console and the cast |
| `archive/TEMANAWA_SPECIES_SUMMARY.md` | A planning summary of the intended cast; the built cast differs |

---

## Also in the repo

- `../CLAUDE.md` — practical working notes: running and testing, load order, conventions, the
  constraining numbers, authoring keys
- `../MISTAKES.md` — the incident log behind the rules (newest first)
- `../secondscreen/README.md` — the console page: files, input bindings, content still to supply
- `../exports/*/README.md` — how each terrain snapshot set was made
- `../Avian_Age_TeManawa_Proposal.docx` — the proposal as sent
- `../research/*.pdf` — primary sources

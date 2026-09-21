# Te Manawa — document index

26 documents. This says which ones are live, which are superseded, and which are
research to draw on rather than build from.

**Where documents disagree, the order below is the order of precedence.**

**Current state:** the run opens ~1 Ma (as a marine embayment) and closes on Ōruanui (~25.5 ka).
The land morph, the glacial-cycle climate, five buttons, habitat health and the kererū dispersal
loop are all running, as is the **second-screen overhaul** — a 1080p touchscreen console over a
`BroadcastChannel` bus, with the sim side built (paused geology, per-species boost, ramped
timelapse to the next glacial/interglacial), harness-green (`TEMANAWA_SECOND_SCREEN.md`). The
frontier now is the flora art, the disturbance clocks, and the tuning passes (interaction health;
the second-screen boost feel — ramp, seeding, fauna coupling).

**New here?** Read `TEMANAWA_PLAN_V3.md` (the spine — current design, honest phase status, and the
road ahead), or `TEMANAWA_PEDAGOGY.md` for the visitor's-eye view of *what the wall teaches today*.
Then use the precedence order below for the build detail.

---

## The spine — build from these

| # | Document | Lines | Role |
|--:|---|--:|---|
| 1 | **`TEMANAWA_PLAN_V3.md`** | 472 | **The design spine.** Current design — five buttons, habitat health, the deep-time glacial ecology, the geography morph, the implemented fauna cast — plus an honest phase status and the road ahead. Anything that disagrees with this loses |
| 1b | **`TEMANAWA_SECOND_SCREEN.md`** | — | **The interaction overhaul.** The 1080p touchscreen, the three-station model (habitat switch → per-species boost-select → activate), the paused-geology time model, the `BroadcastChannel` bus vocabulary, and the sim work it needs. Authoritative for the *interaction model* — where it disagrees with §6 of the spine on interaction, it wins |
| 2 | **`TEMANAWA_BUILD_V3.md`** | 567 | Architecture, kiosk self-run, the **sprite manifest** (~160 core + ~19 stamps), performance and load budgets. The technical companion — it makes no design decisions, it costs the plan's |
| 3 | **`TEMANAWA_TERRAIN_PLAN.md`** | 296 | Terrain background. Its keyframe pipeline was cut, then partly **revived by `TEMANAWA_GEOGRAPHY.md`** as the SVG skeleton. §1, §6 and §7 are still live |
| 4 | **`TEMANAWA_REORG.md`** | — | Structural proposal: the asset pipeline, splitting `sketch.js`, economy residue, and the adaptive terrain mode as built. Ordered so each step is harness-verifiable |

Start at 1. If you are about to write code, read 2 §5 (the budgets) as well.

---

## Species and art briefs — live

| Document | Lines | |
|---|--:|---|
| `TEMANAWA_SPRITE_BRIEF.md` | 370 | **The art brief.** Footprint rules, tiers, states. The naming convention in `TEMANAWA_REORG.md` §3.2 belongs here and should be folded in |
| `TEMANAWA_SPECIES_SUMMARY.md` | 155 | Quick reference across the cast |
| `TEMANAWA_SPECIES_KERANGI.md` | 230 | Kērangi (Eyles' harrier) in depth. The only fauna with finished art |
| `TEMANAWA_FAUNA_POOL.md` | 206 | The candidate pool and visual hooks. **`BUILD_V3.md` §4.2 leans on this** — but flags that its hooks are written from a field-guide viewpoint and need bird's-eye equivalents |
| `TEMANAWA_FAUNA.md` | 246 | Broader fauna notes. Overlaps `FAUNA_POOL`; the pool is the one the manifest cites |
| `TEMANAWA_FAUNA_IMPL.md` | 229 | **The implemented cast, in code.** What each animal (moa · eagle · kererū) *is*, how it behaves/breeds/draws, and where it's wired. Build reference, not research |

---

## Ecology research — reference, not instruction

2,700 lines of regional ecology. This is the evidence base the plan filters, not a
specification. `TEMANAWA_PLAN_V3.md` §1 ("the filter") is what decides how much of it
reaches the screen — which is deliberately not much.

| Document | Lines | |
|---|--:|---|
| `TEMANAWA_ECOLOGY.md` | 536 | Overview. Overlaps the five regional files below |
| `TEMANAWA_ECOLOGY_COAST.md` | 434 | Dunes, lagoons, pīngao and spinifex |
| `TEMANAWA_ECOLOGY_LOWLAND.md` | 445 | Lowland forest |
| `TEMANAWA_ECOLOGY_WETLAND.md` | 418 | Swamp, peat, drowned forest |
| `TEMANAWA_ECOLOGY_OPEN.md` | 413 | Open country, downland, loess |
| `TEMANAWA_ECOLOGY_FAUNA.md` | 326 | Fauna in ecological context |
| `TEMANAWA_RESEARCH.md` | 86 | Sources and reading notes. Points at `research/*.pdf` |

Primary sources are the five PDFs in `research/`.

---

## Process — the terrain restyle, the geography skeleton, the dev workflow

| Document | |
|---|---|
| `TEMANAWA_34VIEW_PLAN.md` | The plan-oblique 3/4 view + illustration restyle. Reshaped Phase 3. **Built** through the relief bake, entity y-sort and cel look |
| `TEMANAWA_GEOGRAPHY.md` | **The SVG geography skeleton** — ranges and river authored as vectors, elevation built around them, with the deep-time uplift/incision morph. Revives `TERRAIN_PLAN.md` §3–5. Static integration and the morph are built |
| `TEMANAWA_DEVTOOLS.md` | **The console dev workflow.** `LOOK` (paint) and `GEN` (landform) live-editable globals, the `B` / `G` / `N` keys, and how to extend them. Read this before tuning the look |
| `TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md` | **The deep-time ecology build.** Season→glacial rebind, the climate table to 1 Ma, forest contraction, emergence sea level, and the four-eruption clear/regen + button seek/revert. **Implemented and harness-green** (see its §4) |
| `TEMANAWA_INTERACTION_HEALTH_PLAN.md` | **Interaction plan.** Split Growth into glacial/interglacial buttons, a derived habitat-health scalar surfaced as scene saturation, and a kererū seed-dispersal loop coupled to Storm overuse. Builds on `DEEPTIME_ECOLOGY_PLAN.md`. **Steps 1–3 built and harness-green** (health/saturation readout, five-button split FOREST/TUSSOCK growth, kererū seed dispersal); step 4 (Storm-overuse coupling) and step 5 (tuning) still to come |
| `TEMANAWA_PEDAGOGY.md` | **What it teaches + the road to installation.** The visitor-facing pedagogy of the running build and the prioritised next steps |

---

## Also in the repo

- `../CLAUDE.md` — practical working notes: how to run and test, load-order constraints,
  code conventions, the constraining numbers, authoring keys
- `../Avian_Age_TeManawa_Proposal.docx` — the proposal as sent
- `../research/*.pdf` — primary sources (forests, grasslands and dunes, cultivated flora,
  history and context)

---

## Housekeeping

`TEMANAWA_ECOLOGY.md` against the five `ECOLOGY_*` files, and `FAUNA.md` against
`FAUNA_POOL.md`, are genuine duplication — but consolidating research documents risks
losing detail for tidiness, and the plan's filter means most of it will never be built
anyway. **Leave them and rely on this index.** If they are ever consolidated, do it by
moving the regional files under an `md/ecology/` folder rather than by merging text.

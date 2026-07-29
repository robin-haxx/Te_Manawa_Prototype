# Te Manawa — document index

17 documents, ~6,000 lines. This says which ones are live, which are superseded, and
which are research to draw on rather than build from.

**Where documents disagree, the order below is the order of precedence.**

---

## The spine — build from these

| # | Document | Lines | Role |
|--:|---|--:|---|
| 1 | **`TEMANAWA_PLAN_V2.md`** | 596 | **The design spine.** v2.1. The filter, the plants, the mechanical core, the four buttons, the fauna cast, the build phases. Anything that disagrees with this loses |
| 2 | **`TEMANAWA_BUILD_V3.md`** | 535 | Architecture, kiosk self-run, the **158-asset manifest**, performance and load budgets. Makes no design decisions — it costs the plan's |
| 3 | **`TEMANAWA_TERRAIN_PLAN.md`** | 296 | Terrain: keyframe morph pipeline, square play area, one-buffer rendering, procedural plants. Feeds Phase 3 |
| 4 | **`TEMANAWA_REORG.md`** | — | Structural proposal: the asset pipeline, splitting `sketch.js`, economy residue, and the adaptive terrain mode as built. Ordered so each step is harness-verifiable |

Start at 1. If you are about to write code, read 2 §5 (the budgets) as well.

---

## Superseded — read for history, do not build from

| Document | Lines | Superseded by |
|---|--:|---|
| `TEMANAWA_PLAN.md` | 281 | **`TEMANAWA_PLAN_V2.md`.** The v1 plan. Its §2 accessibility rule ("nothing essential conveyed by audio alone") is still quoted by `BUILD_V3.md` §3 and still holds |
| `TEMANAWA_CONCEPT_ECOLOGY_FIRST.md` | 278 | `TEMANAWA_PLAN_V2.md` §0.1. The pitch that argued for ecology-first framing. It won; the argument is now the plan's governing principle |

Neither should be deleted — they record *why* decisions went the way they did, which the
current documents state as conclusions.

---

## Species and art briefs — live

| Document | Lines | |
|---|--:|---|
| `TEMANAWA_SPRITE_BRIEF.md` | 312 | **The art brief.** Footprint rules, tiers, states. The naming convention in `TEMANAWA_REORG.md` §3.2 belongs here and should be folded in |
| `TEMANAWA_SPECIES_SUMMARY.md` | 155 | Quick reference across the cast |
| `TEMANAWA_SPECIES_KERANGI.md` | 230 | Kērangi (Eyles' harrier) in depth. The only fauna with finished art |
| `TEMANAWA_FAUNA_POOL.md` | 206 | The candidate pool and visual hooks. **`BUILD_V3.md` §4.2 leans on this** — but flags that its hooks are written from a field-guide viewpoint and need bird's-eye equivalents |
| `TEMANAWA_FAUNA.md` | 246 | Broader fauna notes. Overlaps `FAUNA_POOL`; the pool is the one the manifest cites |

---

## Ecology research — reference, not instruction

2,700 lines of regional ecology. This is the evidence base the plan filters, not a
specification. `TEMANAWA_PLAN_V2.md` §1 ("the filter") is what decides how much of it
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

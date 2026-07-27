# Avian Age: Te Manawa — Build Plan

A standalone, self-running installation for **Te Manawa** museum's *Te Awa – The
River* gallery: the interactive, deep-time companion to the existing portrait
landform screen. It forks the *Mauri* engine but strips it to an **ambient
diorama** — no economy, no goals, no win/loss, no tutorial, no toolbar. The screen
is a **deep-time timeline** and **four buttons**; the moa/predator ecosystem runs
and self-balances. The visitor nudges the *world*, not individual creatures.

**Setting:** the Manawatū, **~345 ka → <50 ka**. Ranges rise, the antecedent
Manawatū River saws its gorge across them, glacials come and go, the coast and
dunefields creep — and moa live through it all.

**The one takeaway:** *the river is older than the mountains; it carved the gorge
by outpacing the uplift, while ice and eruptions repeatedly reset the forest.*

> Research is captured separately and kept deliberately light — see
> **TEMANAWA_RESEARCH.md**.

---

## 0. Current status (what runs today)

The fork **boots into a placeholder "scaffold" scene** — proof the systems are
ready. Done so far:

- 17 engine files copied + renamed `mauri_*.js → TeManawa_*.js` (CRLF preserved,
  all pass `node --check`); assets/libs copied.
- `TeManawa_shims.js` — inert no-op stand-ins for the four dropped subsystems
  (tutorial, menu_art, progress, benchmark) so the copied `sketch.js` boots
  unmodified. **Temporary; deleted in Phase 1.**
- `levels/level_temanawa_scaffold.js` — a minimal valid ambient level (reused
  species/biomes, one never-true goal so it never "wins", empty-ish toolbar).
- One CRLF-safe edit to `TeManawa_sketch.js`: autoload the scene in `setup()` and
  skip the menu/level-select.
- `index.html` wired: shims first → engine → scaffold level → sketch last.

**Phase 1 is now in** (`TeManawa_install.js` — a self-contained layer that
monkey-patches `Game`/`GameUI` rather than editing the big files): full-bleed
fullscreen map, **no sidebar**, the Mauri HUD replaced by the **deep-time timeline
+ four buttons**, no win/lose/pause, and the time model (500 yr/s baseline;
Deep-time = 10× for 10 s = 50 ky). Buttons work by touch **and keys 1–4** (map
physical buttons to those later). Deep-time, Storm (stalls predators via each
eagle's `distractedTimer`), Growth (pushes `plant.growth`), and Eruption (ramped
ashfall → `loadLevel` reset) are all wired. The **square play-area footprint** is
deferred to Phase 3 with the real terrain; for now the map is full-bleed as you
asked. The shim stays for now (patching, not gutting, `sketch.js`) — a later
cleanup removes both.

**To see it:** open `index.html` locally. Statically verified (all 20 JS pass
`node --check`, no duplicate globals, hooks confirmed present); a live browser open
is the final confirm.

---

## 1. How Te Manawa differs from Mauri

| Mauri (the game) | Te Manawa (the installation) |
|---|---|
| Spends **Mauri** currency | No economy (the "Boost Mauri" note is struck out — it's just plant growth) |
| **Goals / phases**, win & loss | None — runs indefinitely, loops via the attract cycle |
| **Toolbar** of paid placeables | Gone — four fixed buttons |
| **Tutorial** tips + guide | Gone |
| Top bar = Mauri / Season / Timer | Top bar = **deep-time timeline** |
| Static terrain | **Terrain morphs over deep time** (uplift, incision, coast/dunes) |
| Haast's eagle, "lose if a sex dies" | **Eyles' harrier (kērangi)**; predator + moa float freely, no fail state |
| Landscape/menu, level select | Auto-loads one scene; **attract loop** when idle |
| 16:9, rectangular map | **Portrait screen; square play area** (for now) |

Reused as-is: boids, foraging, the seasonal climate machine, the emergent
predator loop, spatial grids, sprite animation.

---

## 2. Screen, hardware & museum-hardening

Portrait screen (sibling to the existing landform screen). Three stacked zones:

```
┌───────────────────────────┐
│  TIMELINE   345ka ─●─ <50ka│  deep-time overlay + playhead + era band
├───────────────────────────┤
│                           │
│      PLAY AREA (square)    │  the living map; pop-ups surface here
│                           │
├───────────────────────────┤
│  [▶▶] [🌱] [⛈] [🌋]        │  four buttons (icon-first, bilingual labels)
└───────────────────────────┘
```

- **Square play area for now** (user decision) — simplest correct base; the final
  portrait framing (and a truer Manawatū footprint) comes later.
- **Attract loop:** when idle, auto-run the cycle (uplift → glaciation → eruption
  reset) to pull people in; hand control over on first touch. This is what makes
  an unattended kiosk work.
- **Zero-reading legible:** every button's effect obvious the instant it's pressed;
  icon-driven, te reo/English labels secondary. Reading is always supplementary.
- **Toy, not test:** no win/lose. Meaning comes from the takeaway, not a score.
- **Photosensitivity:** the Whakamaru flash (Button 4) must **ramp**, no hard white
  strobe — this is a real seizure-safety sign-off item.
- **Accessibility:** reachable button height (child + wheelchair), one-finger
  operation, colourblind-safe palette, nothing essential conveyed by audio alone.
- **Robustness:** kiosk lockdown, auto-restart on power cycle; if physical buttons,
  arcade-style microswitches. Input assumption: touchscreen + up to ~2–3 viewers.

---

## 3. Cultural framing (build the system, not the story)

The river is the ancestral relationship of **Rangitāne o Manawatū**; **Te Āpiti**
(the gorge) is an ancestral passage; moa are **taonga**. Naming, narration, and
which stories are told are for **co-design with mana whenua — not hard-coded by
us.** So this build keeps all names/labels/narration/pop-up text as **replaceable
content hooks** and focuses on the neutral system: geology, ecology, buttons,
timeline. Nothing in the code should bake in a story that isn't ours to tell.

---

## 4. Deep-time model (timeline + Button 1)

The engine is fully **delta-time driven**: `draw()` computes `deltaMultiplier` and
calls `game.update(deltaMultiplier)`; `playTime += dt`; every system scales by
`dt`. Fast-forward is therefore almost free.

- Add `game.timeScale` (default 1); change the one call to
  `game.update(deltaMultiplier * game.timeScale)`.
- Map `playTime → yearsBP` so the **whole run spans ~345 ka → <50 ka**.
- **Button 1 compresses ~50,000 years into ~10 seconds** (a large `timeScale`
  burst), then eases back. So the full window is ~6 such bursts end to end.
- Geology is keyed to **`yearsBP`, not wall-clock**, so events land correctly at
  any speed.

**Timeline markers / pop-ups** (content is a co-design hook): ~349 ka Whakamaru
ash · interglacial highstands MIS 11/9/**5e ~125 ka** (terraces, dunefields inland,
ponded wetlands) · glacial lowstands (coast far out in the South Taranaki Bight) ·
optional ~25.5 ka Ōruanui ash if the window extends · optional **Te Ahu a Turanga
moa-bone bracket (180–345 ka)** as a local "where the bones came from" beat.

---

## 5. The four buttons

Each is a transient *world* nudge — no cost, no placement, no target select.

**① Deep time ( ▶▶ ).** Ramps `timeScale` to cover ~50 ky in ~10 s: continuous
uplift of the Ruahine/Tararua block + antecedent river incision, with glacial/
interglacial cycling. Staged glaciation and smaller eruptions thin the forest as
it runs. This is the button that "shows the land being made."

**② Growth ( 🌱 ).** A temporary surge of plant productivity. Hook:
`SeasonManager` already emits per-biome/per-plant growth modifiers that `Plant`
reads each frame — add a transient `growthBoost` that decays over N seconds,
weighted so riverine and montane bands bloom hardest. (No currency; the struck-out
"Boost Mauri" note confirms this is purely ecological.)

**③ Storm / Tāwhirimātea ( ⛈ ).** Stalls the predator for ~20 s (a few hundred
sim-years) so prey rebounds. Reuse the **existing storm** in
`TeManawa_placeable.js` (it already scatters/distracts the raptor) — convert it
from a paid placeable into a button-triggered weather cell. While it holds, the
kērangi can't hunt and moa numbers tick up. Optional secondary: knock/wilt a few
trees via the existing forest-suppression path.

**④ Reset ( 🌋 ).** The spectacle beat: a **Whakamaru ashfall** sweeps from the
north and restarts the scene at ~345 ka. `Game.loadLevel()/init()` already
re-inits terrain/seasons/simulation and zeroes `playTime`. Sequence: ramped ash
sweep (no strobe) → reset → **pioneer-succession opening** (bare/ash ground →
fast pioneer plants → canopy → moa/predator densities ramp up). Also the
**attract-loop reset** (auto-fires at end-of-window or on idle).

---

## 6. Moa & predator balance (no interaction, no win/loss)

Keep the emergent model, drop every *game* hook.

- **Keep:** emergent predator (holds a nest, feeds/starves on an energy budget,
  breeds toward a predator:prey **ratio**), Lotka–Volterra restraint (surplus
  predators starve off rather than crop the last herd), habitat/forest competition
  so species sort into niches.
- **Reskin the eagle → Eyles' harrier (kērangi):** NI forest apex predator (Haast's
  eagle is SI-only). It took **smaller/juvenile moa** and other birds, so weight
  its predation toward small/young moa rather than adult giants.
- **Remove:** the "a sex is lost ⇒ game over" coupling, all phases/goals/fail/
  survive/score, highlight rings, hard per-species caps as *win* logic.
- **Densities float with habitat, not caps:** as terrain morphs, biome areas
  change — let carrying capacity track biome area. Warm interglacial + big forest
  ⇒ more browsers; cold glacial ⇒ crash and rebound. The rise/fall *is* the show.

---

## 7. Climate: glacial cycles

`SeasonManager` already lerps snowline, forest band, growth and hunger. Layer a
slow **glacial index** (a low-frequency oscillator over `yearsBP`, or scripted cold
pulses) that biases those modifiers colder/warmer, and drives sea level (§8). Cold
⇒ snowline down, forest contracts, sea level falls, dunes expand, breeding slows;
warm ⇒ the reverse, forest climbs the newly-uplifted flanks. Mostly coefficients on
an existing system.

---

## 8. Terrain & geology (the hard, new part)

`TerrainGenerator` currently bakes a static heightmap. Te Manawa needs it to
**evolve** on a **square map**:

- **Schematic Manawatū base** (visual-first, not a DEM for now): axial Ruahine/
  Tararua ranges to the E/NE, the lowland + river, the gorge water-gap between the
  ranges, the west coast and dune belt.
- **Uplift field:** `h(x,y,t) = h0 + uplift(x,y)·f(t)`, `f(t)` growing across the
  run — ranges rise, lowland barely moves.
- **Antecedent incision:** a fixed river-corridor mask with a deepening channel, so
  the gorge cuts *down* through the rising ranges (the signature visual).
- **Coast + dunes from sea level:** a `seaLevel(t)` driven by the glacial index
  progrades/retreats the coastal and dune biomes (and ponds Horowhenua-type
  wetlands).
- **Performance:** don't re-bake full-res season images every tick — update on an
  interval (every few sim-years) and lerp biome bands like the snowline (no
  reclassification stutter). Matters most under Button 1. (Temporarily re-fork
  `benchmark` to profile fast-forward.)

---

## 9. Ecology & species (research-led; content is a co-design hook)

- **Four North Island moa** in `TeManawa_species_data.js` — relatives of
  *Euryapteryx curtus* (coastal/dune), *Anomalopteryx didiformis* (closed forest),
  *Pachyornis geranoides* (forest-edge/scrub), and probably *Dinornis
  novaezealandiae* (lowland browser). Give each a Manawatū niche (`preferredElevation`),
  tint, seasonal modifiers, favoured plant. IDs are provisional at <350 ka.
- **Predator:** Eyles' harrier / kērangi (see §6).
- **Plants / biomes:** podocarp–broadleaf lowland forest, beech on the ranges,
  riparian margins, dune/coastal communities (e.g. pīngao/spinifex on the new
  dunefields), plus a **pioneer set** (fast, light-demanding colonisers) tagged to
  lead the Button-4 succession, canopy following.
- **Optional ambient fauna:** the extinct North Island goose (background only) —
  echoes the Te Ahu a Turanga assemblage.

---

## 10. Build phases

**Phase 0 — Boot the fork. ✅ Done** (shims + scaffold + autoload; boots green).

**Phase 1 — Ambient mode + layout. ✅ Done** (`TeManawa_install.js`): full-bleed
map, no sidebar, deep-time timeline + four working buttons, keys 1–4, no
win/lose/pause, the 500 yr/s + 10×/10 s time model. Deferred: square terrain
footprint (→ Phase 3), portrait tuning, and a proper HUD-side removal of the
economy so the shim can go (harmless until then).

**Phase 2 — Deep time.** `timeScale` + `yearsBP` mapping; wire Button 1; timeline
playhead + era bands (~50 ky / ~10 s).

**Phase 3 — Terrain morph.** Uplift field + antecedent incision + sea-level coast/
dunes on the square map; interval re-bake for performance (§8).

**Phase 4 — Climate.** Glacial index over `SeasonManager`; couple snowline/forest/
sea level/dunes (§7).

**Phase 5 — Ecology.** Four NI moa + kērangi + Manawatū plants/biomes; tune the
emergent balance so densities track habitat, not caps (§6, §9).

**Phase 6 — Buttons 2–4.** Growth pulse; storm-stalls-predator; Whakamaru
ashfall + ramped flash + pioneer-succession opening + attract-loop auto-reset.

**Phase 7 — Kiosk hardening.** Photosensitivity sign-off, accessibility, touch
targets, kiosk lockdown/auto-restart, sustained + fast-forward performance, audio
ambience. Content/label hooks handed to mana whenua co-design.

---

## 11. Open decisions

1. **Window end:** stop at ~50 ka, or extend to ~25 ka to include the Ōruanui
   eruption as a second, smaller reset marker? (One-line config either way.)
2. **Hardware:** touchscreen only, or touchscreen + physical arcade buttons? Final
   portrait resolution? (Affects button zone + input handling.)
3. **Pop-up depth:** how much on-screen text at all, given "visual-first, reading
   supplementary"? (Kept as content hooks regardless.)
4. **Mana whenua co-design** (external, not ours to decide): naming, narration,
   story framing, and any use of the Te Ahu a Turanga bone story.

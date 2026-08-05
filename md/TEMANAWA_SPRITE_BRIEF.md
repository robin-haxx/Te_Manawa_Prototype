# Te Manawa — Sprite Brief

**For the illustrator.** Everything to be drawn, at what size, under what name, in what
order. This is the commissioning document; `TEMANAWA_BUILD_V3.md` §4 is the internal
accounting behind it and `TEMANAWA_PLAN_V2.md` is why each asset exists.

**132 new assets** (was 113; +19 terrain illustration stamps, §3.3). 45 already exist and
are marked so. **The view is now a high 3/4 angle, not straight-down — see §1.**

---

## 1. The one thing that governs everything

> ## This is a cartoon of the Manawatū at a high 3/4 angle — a hair off straight down.

Not a field guide. Not a diorama in deep perspective. **A near-overhead, stylised
bird's-eye view of a stretch of the Manawatū, on a LANDSCAPE screen a visitor looks at
for forty seconds.** The camera is tipped forward only slightly — a *plan-oblique* tilt,
much closer to top-down than an isometric game. The ground now has real relief (the
Ruahine and Tararua ranges and the gorge stand up toward the top of the screen) and
sprites stand **upright** on it.

Two things this changes from a pure top-down brief:

- **Sprites are upright billboards, anchored at the base, drawn undistorted.** Design a
  plant or bird crown-first (below), but you may let a little of the *side and height*
  show — it sits on the ground at its feet, not centred on a point. No baked perspective
  and no vanishing point; just a slight forward lean in how much side is visible.
- **The ground carries relief and linework now** (§3.3). The engine bakes the slope
  shading, cliff faces and biome-boundary ink. Your ground job is flat cel tones and a
  few tiling textures/stamps — not a rendered landscape.

Three consequences from the near-overhead angle, and they still overturn some instincts:

**A plant is a crown, not a profile.** From above, a cabbage tree is a starburst of
strap leaves, a nīkau is a radial palm crown, a tree fern is a frond star, a tōtara is a
dark fluted dome. A narrow upright tree — however distinctive from the side — is a dot.
Design the top-down shape first and let the rest follow.

**A sprite stands for a group, not an individual.** One moa sprite represents moa in
that area. Nothing is to scale. This is why heavy stylisation is correct rather than a
compromise.

**One clear thing beats three accurate things.** Several ecologically important plants
were cut precisely because they don't read from above. That's the right trade.

### 1.1 The wind never changes direction

The prevailing north-westerly held for the entire 320,000 years the piece covers, and
it's one of the seven ideas the whole installation rests on.

**Every asymmetric silhouette, every shadow, every dune form leans the same way, in
every era.** Light from the north-west, shadows cast to the south-east. This is a
constraint on the whole set, so please fix it before drawing anything.

### 1.2 Palette

The honest palette is brown, green and grey. Colour is scarce, so it has to be spent
deliberately — a colour accent is an event, not decoration.

| Colour | Comes from | Notes |
|---|---|---|
| **Gold / orange** | pīngao (coast), kōwhai flowers | the two warm accents in the piece |
| **Straw / pale** | short tussock | reads as *cold* — it's the glacial ground layer |
| **Blue-green** | harakeke fans | the wetland accent |
| **Grey-green** | mānuka, grey scrub | shrubland |
| **Near-black green** | tōtara, kahikatea, black beech | the dark conifer mass |

Palette must be **colourblind-safe**: nothing essential distinguished by red-vs-green
alone. The cold/warm read is carried by *lightness and saturation* (pale straw vs
saturated green), which survives any form of colour blindness.

### 1.3 Delivery

- **PNG, transparent background, no baked drop shadow** (the engine applies its own).
- **No padding** — trim to the artwork. The engine anchors and scales.
- **Named exactly as specified below.** The loader builds filenames from these strings;
  a mismatched capital breaks the load, and it fails silently.
- Source files welcome (`.pxo`, `.ase`, `.psd`) but keep them out of `sprites/` — put
  them in `art_source/`.
- **Deliver in the priority order in §7.** The build is blocked on some of these and
  not on others.

---

## 2. Plants — 41 sprites

Ten species get drawn. Seven more are ground colour rather than sprites (§3), and three
were cut.

### 2.1 Sizes, by height class

| Class | Canvas | What it is | Anchor |
|---|---|---|---|
| **h2** shrub | **64 × 64** | shrub layer, rosettes | centre |
| **h3** canopy | **96 × 96** | continuous canopy at 9–15 m | centre |
| **h4** emergent | **234 × 500** | scattered giants above 30 m | **base** |

The emergent canvas is tall because those sprites sit *above* the canopy and are drawn
from their base — `Totara/` in the repo is the reference for the format and it's already
correct.

**h4 emergents draw at roughly double the footprint of h3 canopy.** That size difference
is the whole "two-layer canopy" idea — scattered giants over a much lower continuous
roof — and it's the single most distinctive fact about this forest.

### 2.2 States

| Tier | States needed | Count |
|---|---|:--:|
| **S** | `Mature`, `Thriving`, `Wilting`, `Growing_01`, `Growing_02` | 5 |
| **M** | `Mature`, `Thriving`, `Wilting` | 3 |
| **K** | `Mature`, `Thriving`, `Wilting`, `Flowering` | 4 |

- **Mature** — the default, healthy, unremarkable.
- **Thriving** — fuller, more saturated, slightly larger crown. Reads as *good*.
- **Wilting** — thinner, greyer, sparser. **This state does the most work in the whole
  set**: it's what the visitor sees when the climate turns cold or a disturbance hits.
  Make the difference from Mature unmistakable at a glance.
- **Growing_01 / _02** — a sapling and a half-grown stage, for plants seen establishing
  after a disturbance.
- **Flowering** — kōwhai only, and the reason kōwhai is in the set at all.

### 2.3 The ten

Filename pattern: **`<Prefix>_<State>.png`**, e.g. `Mamaku_Thriving.png`.

| Prefix | Species | h | Tier | New | From above it must read as |
|---|---|:--:|:--:|:--:|---|
| **`Mamaku`** | mamaku / tree fern | 3 | S | **5** | **A frond star** — radiating fronds, dark centre. ⭐ The single most important sprite in the project: its presence or absence is how a visitor knows the climate changed. Make it unmistakable |
| **`Kahikatea`** | kahikatea | 4 | S | **5** | A tight, tall, narrow dark spire — a compact dense point. It *is* the swamp forest |
| **`Totara`** | tōtara | 4 | S | ✅ have | Massive dark fluted dome. **Already drawn** (234×500, 4 states + 4 growing) |
| **`Tawa`** | tawa | 3 | S | **5** | A plain rounded canopy — the *default* forest. It will cover more of the screen than anything else, so it must tile and repeat without becoming noisy |
| **`TiKouka`** | tī kōuka / cabbage tree | 3 | S | **5** | **A starburst of strap leaves.** The most readable native silhouette there is, and the one plant a non-expert can name |
| **`Harakeke`** | harakeke / flax | 2 | M | ✅ have | A stiff blue-green fan rosette. **Already drawn as `Flax_*`** (64², 4 states) — a redraw to the bird's-eye rule would be welcome but is not blocking |
| **`Nikau`** | nīkau | 2 | M | **3** | **A radial palm crown** — even, symmetrical fronds. Second era signal; disappears with mamaku when it turns cold |
| **`Manuka`** | mānuka | 2 | M | **3** | A fine grey-green mound flecked white with flowers. The shrubland state |
| **`Beech`** | black beech | 3 | M | ✅ have | Dark, dense, small-leaved, tight texture. **Already drawn** (96², 4 states). Survives the cold — it's the sheltered-refuge marker |
| **`Kowhai`** | kōwhai | 3 | K | **4** | Open, airy crown — and in `Kowhai_Flowering`, **a patch of gold**. The only seasonal colour beat in the piece |

**New plant sprites: 30.** (Mamaku 5, Kahikatea 5, Tawa 5, TiKouka 5, Nikau 3, Manuka 3,
Kowhai 4.)

### 2.4 Not being drawn, and why — so nobody re-adds them

| Cut | Reason |
|---|---|
| **Rimu** | From above it's the same dark conifer mass as tōtara, and tōtara is already drawn |
| **Kawakawa** | A shrub under a closed canopy — occluded almost everywhere it occurs |
| **Rewarewa** | The most distinctive shape in the forest *from the side*. From above, a dot |

---

## 3. Ground palette — 4 textures + 7 colour swatches

These seven plants are **not sprites**. They are a colour laid into the ground, because
from a bird's eye that is exactly what ground cover looks like — and because it costs
nothing to draw thousands of them.

**What's needed from you: 7 colour values and 4 tiling micro-textures.**

### 3.1 Colours

For each, a **Mature** and a **Wilting** colour (the engine blends between them):

| Species | What it should read as |
|---|---|
| **Spinifex** | silver-green wash creeping over grey sand |
| **Pīngao** | **golden-orange** — the coast's only warm accent |
| **Toetoe** | pale cream stipple on wet ground |
| **Raupō** | dark green-brown reed mass at the water's edge |
| **Bracken** | a mid-green flush on raw ground |
| **Short tussock** | **pale straw** — cold-only, and the visual signature of a glacial |
| **Grey scrub** | grey-green tangle (absorbs mingimingi and tauhinu) |

### 3.2 Textures

Four **seamlessly tiling 128 × 128** micro-textures, greyscale or near-greyscale so the
engine can tint them:

`Tex_Mat.png` · `Tex_Reed.png` · `Tex_Tussock.png` · `Tex_Scrub.png`

They're seen small and repeated over large areas, so: subtle, no strong directional
pattern, no visible tile seam, no feature that reads as an object.

### 3.3 Illustration-pass linework and stamps — 19 new + palette values

The ground is now baked as a **cartoon illustration**, not a topo map. Most of that is
procedural and already running (flat cel tones, wobbly biome-boundary ink, slope shading,
cliff faces, a shoreline stroke, and muted ground so your sprites pop). Two things want
art or values from you.

**Per-biome palette + ink — colour values, no files.** For each of the ~8 ground bands
(sea, coast, lowland, podocarp, montane, subalpine, alpine, snow): **2–3 flat tones**
(low→high within the band) and **one dark `outlineColor`** — the ink stroked along that
band's edges, which replaces contour lines. Colourblind-safe per §1.2 (cold/warm read
carried by lightness and saturation, never red-vs-green). Authored straight into the
level file — **no PNGs**.

**Terrain texture stamps — new PNGs.** Small marks scattered into the ground to break up
the flat tones (the koru / scrub / tussock flecks on the concept sheet). Transparent PNG,
no baked shadow, trimmed, **~32 × 32** (a few up to 64²). Lit from the **north-west** like
everything else (§1.1). Named by the sprite rule:
`sprites/terrain/<biome>/<biome>_stamp_<nn>.png` — e.g. `terrain/grassland/grassland_stamp_01.png`.

| Biome | Stamp reads as | Count |
|---|---|:--:|
| **grassland / lowland** | short tussock ticks, sparse | 3 |
| **subalpine** | speargrass / scrub dots | 3 |
| **podocarp** | leaf-litter fleck, dark | 2 |
| **montane** | leaf-litter fleck, dark | 2 |
| **coast** | pīngao tuft — the one warm accent | 2 |
| **sea (shallows)** | koru / kōwhaiwhai water swirl | 3 |
| **alpine / snow** | wind-scour streak, faint | 4 |

**19 stamps.** All *optional to start*: the engine renders fine on procedural tones alone
and picks the PNGs up automatically when they appear (silent fallback), so deliver them
whenever. Per-biome scatter density is tuned in code, not by you.

**Optional — one paper-grain texture.** Seamless **512 × 512**, near-white greyscale, very
subtle; laid as a multiply over the finished ground. The engine can fake this
procedurally, so it's a nicety, not a blocker.

---

## 4. Fauna — 33 new

Same rule: **seen from directly overhead.** A bird from above is wing shape, back and
crown markings, and the shape it makes as it moves — not a profile. Where a species'
famous feature is a bill or a wattle, find the bird's-eye equivalent.

Walk cycles are **4 frames**. Canvas **72 × 72** for moa, **64 × 64** for smaller birds,
**256 × 256** for the harrier.

| Files | Animal | New | Notes |
|---|---|:--:|---|
| `moa_walk_1..4.png`, `moa_idle.png` | **NI giant moa — female** | ✅ have | Existing generic moa art serves. A bird's-eye redraw would be welcome later |
| `moa_male_walk_1..4.png`, `moa_male_idle.png` | **NI giant moa — male** | **5** | ⭐ **The dimorphism pair.** Females stood to 3.6 m and were *vastly* larger — the sexes were first described as separate species. **Must be a different build, not a scaled copy**, or the fact doesn't land. A towering female beside a much smaller male needs no caption |
| `LB_moa_walk_01..05.png`, `LB_moa_idle.png` | **Little bush moa** | ✅ have | Small, rounded, low-slung. The **warm-phase** marker |
| `Mantell_walk_1..4.png`, `Mantell_idle.png` | **Mantell's moa** | **5** | Smallest NI moa, stocky. The **cold-phase** marker — it should look like a *different animal* from the little bush moa, not a recolour |
| `moa_juvenile_walk_1..4.png` | **Juvenile moa** | ✅ have | |
| `EylesHarrier_HiRes/EylesHarrier_State_00000..00015.png` | **Kērangi — flight** | ✅ have | 16 frames at 500² |
| `EylesHarrier_Perched_1..2.png` | **Kērangi — perched** | **2** | It nested at rock shelters and cave entrances. There is currently no perched pose |
| `EylesHarrier_Dash_1..2.png` | **Kērangi — dash** | **2** | **Goshawk, not soaring harrier** — compact wings pulled in, fast forward dash through forest. The existing set only has a wingbeat cycle |
| `Goose_walk_1..4.png`, `Goose_idle.png` | **North Island goose** | **5** | Heavy flightless grazer. **These bones are in Te Manawa's own collection.** Abundant in cold phases — it's what makes the glacial map *busier*, not emptier |
| `Kereru_fly_1..4.png`, `Kereru_perched.png` | **Kererū** | **5** | The one animal every visitor already knows. Iridescent green-bronze; from above, the white waistcoat won't show — find the top-down equivalent |
| `Huia_female_1..3.png`, `Huia_male_1..3.png` | **Huia** | **6** | ⭐ **The Manawatū's own bird.** The second free dimorphism: female's long thin curved bill, male's short chisel. Black with a white tail tip, orange wattles, ivory bill. 646 skins were taken from the forest between the Manawatū Gorge and Akitio in 1883 |
| `Egg_1.png`, `Nest_1.png` | **Egg / nest** | **2** | Currently drawn procedurally |

**Optional eighth:** coastal moa *Euryapteryx* (+5) — worth building now that sea level
gives the coast a distinct band.

### 4.1 Cold is busier, not emptier

This is worth stating on its own because it's counter-intuitive and the art has to
support it. **The glacial map should carry more large grazing birds than the
interglacial one** — Mantell's moa, the goose, more open ground with more animals on it.
Cold is not death; it's a different cast. If the cold-phase art reads as *emptier*, the
piece teaches the wrong thing.

The **warm set** (little bush moa, kererū, huia) and the **cold set** (Mantell's moa, NI
goose) should feel like different casts, not the same birds recoloured — because that
difference is how a visitor reads the vegetation.

---

## 5. Terrain and landform — 21 new

| Files | Count | Notes |
|---|:--:|---|
| `height_young.png`, `height_old.png` | 2 | **Greyscale heightmaps, 512 × 512, square.** Black = deep sea, white = highest peak. Young: ranges low, gorge shallow. Old: ranges high, gorge deep. **The river must sit in exactly the same place in both** — that's the whole takeaway (*the river is older than the mountains*) and it falls out of the art for free |
| `Dune_Spinifex_1..3.png` | 3 | Smooth, even, regular. ~6 m, 14–16° seaward slope. Three sizes so the dune grows |
| `Dune_Pingao_1..3.png` | 3 | Low, convex face, level top. Seldom over 3 m, 8–14°. **Each sand-binder builds a measurably different dune** — that's a real finding, not decoration |
| `Log_Sand.png`, `Log_Peat.png`, `Log_Snag.png` | 3 | Buried logs — sand-buried trunk, drowned stumps in peat, ash-killed snag. **The recurring motif in every piece of the research**: this landscape repeatedly buried and drowned its own forest, and the dead trunks are what's left |
| `Shingle_1..2.png` | 2 | River braid bars. Go bare and grey under Storm |
| `Ash_Mantle.png` | 1 | Tiling grey overlay for post-eruption ground |
| `Water_Edge.png`, `Lagoon.png` | 2 | Dune-dammed lakes appear and vanish as the dunefield advances |
| `Ground_Sand/Peat/Alluvium/Loess/Ash.png` | 5 | Tiling 128², like §3.2 |

---

## 6. Effects and UI — 25 new

### 6.1 Disturbance FX — 9 new

| Files | Count | Notes |
|---|:--:|---|
| `Ash_Fall_1..3.png` | 3 | **Must ramp, never strobe.** Photosensitivity is a real sign-off item |
| `Sand_Drift_1..2.png` | 2 | Always drifting **east-south-east**. The fixed wind |
| `Flood_Silt_1..2.png` | 2 | |
| `Fallen_Emergent_1..2.png` | 2 | Windthrow. Doubles as a buried-log asset |
| storm cloud, bolt | ✅ have | |

### 6.2 UI — 16 new

| Files | Count | Notes |
|---|:--:|---|
| `Btn_Deep/Growth/Storm/Eruption_{off,on}.png` | 8 | **Drawn glyphs, not emoji** — emoji render differently per platform and carry no colourblind guarantee. Icon-first: the meaning must survive with the label covered |
| `Timeline_Playhead.png` | 1 | |
| `Era_Band_{warm,cold,transition}.png` | 3 | |
| `Marker_Whakamaru.png`, `Marker_Oruanui.png` | 2 | The run opens and closes on the same kind of event — an eruption |
| `Attract_Hand_1..2.png` | 2 | Touch prompt, animated, for the idle loop |

**Accessibility.** Buttons are pressed by children and wheelchair users, one-fingered.
Icons must be legible at arm's length from a standing adult and a seated child, and
nothing essential may be carried by colour alone.

**Labels are not art.** All on-screen text is a content hook for co-design with mana
whenua and will be supplied separately. Please leave room rather than setting type.

---

## 7. Priority order

The build is blocked on some of these and not on others. Roughly in this order:

**1 — Unblocks the ecology work (Phase 5).**
`Mamaku` (5) · `Tawa` (5) · `TiKouka` (5) · `Kahikatea` (5) · the 4 ground textures · the
7 palette colours. **~20 assets.** Mamaku first: it's the era signal and everything
about the climate read depends on it.

**2 — Unblocks the cast (Phase 7).**
NI giant moa male (5) · Mantell's moa (5) · NI goose (5) · kērangi perched + dash (4).
**19 assets.** The dimorphism pair is the highest value-per-asset item in the project.

**3 — The geography skeleton (Phase 3).**
`geo/manawatu.svg` — ranges and river as authored vectors, not raster heightmaps.
**1 source asset**: small in count but it *is* the landform system, so it needs a
conversation before it's drawn. See `TEMANAWA_GEOGRAPHY.md`.

**4 — Completes the set.**
`Nikau` (3) · `Manuka` (3) · `Kowhai` (4) · kererū (5) · huia (6) · egg/nest (2).
**23 assets.**

**5 — Terrain furniture and FX.**
Dunes (6) · buried logs (3) · shingle, ash, water, ground textures (10) · FX (9).
**28 assets.**

**6 — UI.**
**16 assets.** *Deliberately last* — one design question is still open (whether the
timeline reads as an arrow or a wave), and it changes the era band art. Don't start
these until that's settled.

---

## 8. Summary

| Group | Total | Have | **To draw** |
|---|:--:|:--:|:--:|
| Plants | 45 | 11 | **34** |
| Fauna | 64 | 31 | **33** |
| Terrain / landform | 21 | 0 | **21** |
| Terrain illustration stamps (§3.3) | 19 | 0 | **19** |
| Disturbance FX | 12 | 3 | **9** |
| UI | 16 | 0 | **16** |
| **Total** | **177** | **45** | **132** |

Plus, not counted as files: **per-biome palette values** (2–3 tones + `outlineColor`) and
an optional paper-grain texture (§3.3). The 3/4 view (§1) does not add assets, but it does
change how plants and fauna are posed — upright, base-anchored, a little side showing.

The four starred items — **Mamaku**, the **NI giant moa dimorphism pair**, **huia**, and
the **geography SVG** — carry more of the installation than their count suggests. If
anything gets extra attention, those.

---

**Background reading, if wanted:** `TEMANAWA_PLAN_V2.md` (what the piece is and why each
asset exists) · `TEMANAWA_FAUNA_POOL.md` §4 (notes for the illustrator on the animals,
including the palette and the dimorphism pairs) · the four habitat deep dives for what
each plant community is actually made of.

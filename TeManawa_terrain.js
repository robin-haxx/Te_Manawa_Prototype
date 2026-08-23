// ============================================================================
// LOOK — the terrain look-development control surface (bake-time)
// md/TEMANAWA_34VIEW_PLAN.md §7
// ============================================================================
// Every knob for the "pixel topo map → cartoon illustration" ground, in ONE place.
// All of it is applied during the season bake, never per frame.
//
const LOOK = {
  // ---- on / off — flip a move off to see what it does ----
  posterize: true,   // flat cel tones (vs a smooth gradient ramp)
  wobble:    true,   // biome borders wander like a brush (vs clean elevation bands)
  outlines:  true,   // ink stroke along biome boundaries (replaces contour lines)
  shore:     true,   // pale stroke at the water's edge
  shade:     true,   // slope shading of the lit tops
  facet:     true,   // break the flat cel bands along an organic noise contour so the toon
                     //   shading reads as ROCK FACETS, not grid-aligned steps (domain-warped
                     //   posterize; bake-time, press B / reload). Off = the old grid-locked bands.
  haze:      true,   // atmospheric fade in the sky above the far ridge
  quiet:     true,   // desaturate the ground so the outlined sprites read first
  reliefEdge: true,  // bold dark outline along relief steps/cliff tops (like the sprite outlines)
  smoothScale: true, // display-time: anti-alias the baked ground as it scales to the panel.
                     //   true  = the supersampled bake is minified WITH smoothing, so ink AND
                     //           fill anti-alias together into edges that follow curves
                     //   false = crisp nearest-neighbour = the chunky pixel look (pair w/ bakeScale 2)

  // ---- amounts (used only when the matching toggle is on) ----
  wobbleAmp:     0.05,  // border wander, in elevation units
  wobbleFreq:    0.12,   // spatial frequency of the wander
  quietSat:      0.2,   // 0 = full colour ground, 1 = greyscale
  quietContrast: 0.92,   // <1 compresses ground contrast toward mid-grey
  shadeStrength: 10.0,   // slope-shading gain (feeds the cel bands below)
  shadeSteps:    4,      // CEL bands: 0/1 = smooth gradient, 2–4 = flat toon steps (match the sprites)
  shadeShadow:   0.3,   // darkest cel band (shadow side) — multiplier on the ground colour
  shadeHigh:     1.32,   // lightest cel band (NW-lit highlight) — multiplier
  facetAmp:      1.2,  // FACET break-up: how far a cel-band boundary may wander, in BAND-WIDTHS
                        //   (0 = grid-locked steps; ~0.5 = edges roam half a band into organic rock
                        //   facets; >1 can skip a band). Nudges the quantizer threshold, bake-time.
  facetFreq:     0.2,   // FACET: spatial frequency of the LARGE facets (the flat rock planes).
                        //   Lower = broader facets; higher = busier. World units, like wobbleFreq.
  facetDetail:   0.3,   // FACET: weight of a 2nd (high-freq) octave that frays facet edges into
                        //   cracks (0 = smooth wander; ~0.4 = ragged rock edges). Fraction of octave 1.
  facetDetailFreq: 5.0, // FACET: frequency multiple of that crack octave over facetFreq.
  bakeScale:     3,      // SUPERSAMPLE factor: bake the ground at N× the sim grid. render() draws
                         //   it under the 2.5× camera, so N>2.5 MINIFIES it — that downsample is
                         //   what anti-aliases ink+fill into curves (needs smoothScale). 3 is the
                         //   sweet spot. Higher is sharper but memory grows as N² and is HARD-CAPPED
                         //   by bakeMaxPixels below (a kiosk must never OOM), so raising it may no-op.
  bakeMaxPixels: 2200000,// per-season-buffer pixel cap: bakeScale auto-reduces so a bake buffer never
                         //   exceeds this (there are 4 of them). Guards the OOM at large grids / high
                         //   bakeScale — esp. Firefox, which is stricter than the Chrome kiosk. Press B.
  hazeStrength:  1,         // north-atmosphere overlay opacity at the top edge (0..1) — tune live, press B
  hazeHeight:    0.45,   // how far down the map the atmosphere fades (fraction of height)
  outlineJitter: .35,   // hand-inked lineweight variation on the boundary ink (0 = uniform)
  rangeRelief:   1.0,  // geo ranges: valley depth vs crest (0 = flat plateau; ~0.5 = deep forested valleys = mountain variation). Regenerate to apply.
  rangeSpine:    0.95,  // geo ranges: crest concentration along the range's long (NE–SW) axis (0 = flat poly plateau; 1 = sharp central spine, flanks fall to foothills). Regenerate to apply.
  rangeGain:     2.6,   // geo ranges: how hard uplift MULTIPLIES the existing ground (0 = no lift; higher = taller, more base-driven peaks). The ranges scale the plains' own spurs/valleys up into mountains rather than imposing a smooth crest template. Regenerate to apply.
  rangeCeil:     0.25,  // geo ranges: where the soft height ceiling starts, as a fraction of the per-cell crest rH (lower = flatter tops / more compression, preserves more base shape; higher = peaks reach closer to the authored height). Regenerate to apply.
  flipRangeAxis: true,  // geo ranges: mirror each range about its OWN centroid so its long (spine) axis leans along the OPPOSITE diagonal — the ranges run the other way without moving off their footprint. Centroid-preserving (nothing relocates). false = authored orientation. Regenerate to apply.
  riverWobble:   0.02,  // geo river: per-seed lateral meander off the SVG path (0 = follow it exactly)
  riverIncise:   0.05,  // geo river: bed sits this far below the LOCAL ground (0..1 elevation), not down to sea level. Bounds the plunge crossing it. Lower = gentler gorge. Regenerate (G/N) to apply.
  riverValleyWiden: 1.6,  // geo river: the INCISION valley is this many times wider than the water ribbon, with smooth shoulders — so the carved gorge is a gentle valley, not a jagged slot tracing the ragged (edge-noised) waterline. The water/bank PAINT stays narrow; only the terrain carve widens. Regenerate to apply.
  riverSeaLevel: 0.3,  // geo river: the bed only sinks to this (the sea band) where the land is already near it — the coast. Upstream it rides the terrain. Regenerate to apply.
  riverWaterT:   0.5,  // geo river: mask ≥ this reads as open WATER — the (narrow) blue thread. Raise = narrower water. Regenerate to apply (paint + walkability).
  riverBankT:    0.32,  // geo river: mask in [riverBankT, riverWaterT) reads as exposed RIVERBED / bank (sandy shingle, walkable) framing the water. Lower = wider bed. Raised from 0.22 to trim the wide sand bands that pooled where tributaries meet the main (the confluence seam-fallback bank keys off this too). Only affects river banks — sea beaches are elevation-classified (coastal band). Regenerate to apply.
  mainRiverWidthMult: 1.2,  // geo river: scales the MAIN stem's authored base width (geo width 0.05) at PRESENT — a thicker main riverbed. Multiplies the whole channel (water + shingle bed), and the early strait scales off it too. Independent of the tributary width below. Regenerate (G/N) to apply.
  tribWidthMult:  0.8,   // geo river: scales every TRIBUTARY's authored base width (geo width 0.02) — thinner side-streams. The thread is still floored by tribThinCap so it never beads to bare gully. Lower = thinner tributaries; keep ≥ ~0.6 so a few-cell-wide channel stays continuous. Regenerate to apply.
  riverWetlandT: 0.20,  // WETLAND: mask ≥ this (and BELOW riverWaterT), on LOW ground (< riverWetlandElevMax), reads as WETLAND (swamp margin) instead of bare sand — so the lower river's banks + a modest back-swamp margin are Manawatū raupō/harakeke/kahikatea, not beach. Set BELOW riverBankT so the wet zone is wider than the old sand bank. The gorge reaches (above the elev cap) keep shingle; the open sea beach (far from any river) keeps sand. Robust to land re-tuning: it keys off the live river-proximity field, so it tracks the channel wherever it morphs. Regenerate to apply.
  riverWetlandElevMax: 0.30,  // WETLAND: only the low reaches turn to swamp — a near-river cell above this normalised elevation stays shingle bank (the incised gorge in the hills has no back-swamp). ≈ the lowland/grassland ceiling. Regenerate to apply.
  coastEase:     1,   // coast FALLOFF: land-rise exponent off the shore (>1 = gentle shelf/beach; <1 = the old steep cliff). This is knob (a) — how gently the land falls to the sea. Higher is gentler but widens the near-sea-level zone (softer waterline); pull toward ~1.1 if the coastline reads mushy. Regenerate to apply.
  coastInland:   0.14,  // coast POSITION (knob b, uniform): how far inland (east, as a fraction of screen X) the FINAL western shoreline sits — raise to bring the coast inland / expose more sea. 0.02 = the original tight coast; useful range ~0.2–0.7. Added to the per-row meander, so the actual waterline sits a little east of this. The SEVERE early southern strait is the marine submergence (seaSWReach), which recedes by ~0.5 Ma to leave this final coast. Regenerate to apply.
  coastInlandSouth: 0.1,  // coast POSITION (knob b, south bias): EXTRA inland reach added toward the south (v→1), 0 at the north edge → this many X-fractions at the south edge — so the southern/SW coast curves further in while the north stays put. This is the PERMANENT (present) curve; the strait's harsher early curve flattens onto it by ~0.5 Ma as seaSWReach recedes. Regenerate to apply.
  coastSmooth:   3,     // coast: light smoothing passes over the low-elevation shelf ONLY (0 = off) — clears waterline speckle and blocky relief steps without touching plains or ranges. Regenerate to apply.
  coastRampWidth: 0.06,  // coast: WIDTH (in shore-distance units, 0..1) of a clean monotonic RAMP either side of the waterline where the shelf-relief noise is suppressed to 0 — so the shoreline crosses the sea band once, cleanly, instead of the noise straddling it and shattering the emerging shelf into floaty bits. Relief resumes just beyond the ramp. 0 = off (noise right up to the waterline, the old fragmented look). Regenerate to apply.
  coastShelfRelief: 0.06,  // coast: AMPLITUDE of the undulating shelf/coastal-plain relief (0..1 elevation). This is the fractal detail on the emerging shore. Kept WELL BELOW the offshore base gradient so the shelf deepens MONOTONICALLY — the coast reads as a gradual elevation gain, not scattered noise patches (bars that independently poke through the eustatic waterline as the shelf emerges). Was 0.11 (nearly the base gradient → local reversals → the fragmented look). Raise for more sandbars/inlets, lower for a smoother shelf. Regenerate to apply.
  coastShelfDetail: 0.3,   // coast: weight of the HIGH-frequency 2nd shelf octave, as a fraction of the low octave — the fine speckle on the shelf relief. Lower = broader, more coherent shelf undulation (fewer isolated specks); higher = busier. Was 0.5. Regenerate to apply.
  cliffSmooth:   0.16,  // DE-CLIFF: after the carve/uplift, ease any elevation step to a neighbour STEEPER than this (0..1 per cell) — kills the extremely harsh vertical "jumps" the 3/4 relief bake would otherwise paint as a tall dark wall (e.g. a bank against the strait, a channel edge drifted off the new ground mid-morph). Gentle relief — plains, range flanks — sits below the threshold and is untouched. 0 = off. Regenerate (G/N) to apply.
  cliffSmoothPasses: 2, // DE-CLIFF: how many smoothing passes (more = softer, wider blend). Runs on the sim heightMap, deterministically, so the sliced morph stays identical to the synchronous one.
  riverFrontJitter: 0.09, // geo river: low-freq wander of the emerging tip so the growing river tapers off naturally instead of ending on a straight line. Regenerate to apply.
  riverEdgeNoise: 0.015,  // geo river: HIGH-frequency wobble on the channel edge (world frac) — breaks the authored polyline's smooth banks into a natural ragged waterline. Cached with the distance field, so it costs nothing per frame. 0 = off. Regenerate to apply.
  riverEdgeFreq:  26,     // geo river: spatial frequency of the edge noise. Higher = choppier banks.
  riverEdgeNoisePow: 2,   // geo river: how the edge-noise amplitude scales DOWN for narrow channels — the wobble is multiplied by (channelWidth / mainWidth)^this. A thin tributary's water thread is only a few cells wide, so the main's full-amplitude wobble (linear scaling) beat it into disconnected pools; squaring the ratio (2) cuts the tributary wobble ~3× while leaving the wide main almost untouched. 1 = the old linear scaling. Regenerate to apply.
  tribHighlandThin: 0.45,  // tributaries: how fast the painted WATER/BED thins with elevation above the lowland (tribHighlandLo). This elevation-driven thinning is the main source of a tributary's WIDTH VARIANCE along its length (full near the low confluence, pinched where it climbs), so it is kept gentle for a more UNIFORM ribbon; the thread is still floored by tribThinCap so no perched band-water. High ground carries only a thin thread. Bounded by tribThinCap so the thread never starves. 0 = off (dead-uniform width).
  tribHighlandLo: 0.30,   // tributaries: elevation at which highland thinning STARTS. Below this the tributary keeps its full lowland water width; above it the thread narrows at tribHighlandThin per unit elevation. Regenerate to apply.
  tribThinCap: 0.12,      // tributaries: CAP on how much highland thinning may raise the water/bed threshold — floors the water thread so a tributary always keeps a small consistent ribbon of water (never beads to bare gully). The whole authored tributary sits near ~0.48 elevation, so without this the thinning starved the thread along its entire length. 0 = uncapped (old behaviour). Regenerate to apply.
  straitWidthMult: 6.0,   // main river is this many times wider at ~1 Ma (the Manawatū Strait). Narrows to 1× by straitCloseTo. Regenerate to apply.
  seaRise:       0.10,  // EMERGENCE (deep time): at ~1 Ma the basin is a shallow-marine embayment. The flood is water RISING (attenuated by elevation, see seaFloodCeil), not the ground sinking, scaled by submergence and easing to 0 (present shoreline) by GEO_EPOCHS.emergeTo (~0.5 Ma). Tune live (press B/G/N).
  seaFloodCeil:  1.,  // EMERGENCE reach: the flood's lowering fades to nothing at this elevation — ground above it never submerges, so the eastern uplands stay legible land at 1 Ma instead of the whole map reading as a grey flood. Lower = flood hugs the coast; higher = deeper inundation. Tune live (press B/G/N).
  seaFloodFlatten: 0.85,  // EMERGENCE de-speckle (0..1): the elevation-attenuated flood above LOWERS the basin but keeps its base-noise relief, so a deeply-drowned floor emerges as scattered shallow speckle / a shattered coast. This pulls drowned ground toward the mottled sea floor — full effect deep in the basin, ~0 at the waterline — so the open sea reads as coherent water while the immediate shore keeps its sandbar texture. Scaled by submergence, so it only bites during the emergence and is gone by the present coast. 0 = off (the old fragmented look). Tune live (press B/G/N).
  seaSWReach:    1.60,  // SW MARINE STRAIT (Axis A, positional): at ~1 Ma the Whanganui basin SW of the river is open sea — the strait. Regardless of elevation, the ground SW of a diagonal front (measured u+(1−v), so the lower-LEFT corner) is pulled fully under, then fills back into the normally-generated terrain by GEO_EPOCHS.emergeTo (~0.5 Ma). This is how far that full submergence reaches toward the NE; larger = more of the map starts drowned. Raised with seaSWFeather (1.25→1.60) so the WIDER taper still reaches the NE dry edge — the basin keeps its extent but shelves in gradually instead of dropping off. Tune live (press B/G/N).
  seaSWFeather:  3.0,  // SW MARINE STRAIT: softness of that diagonal front (0 = a hard shoreline). Its taper is what leaves the SE with intermittently more land — a basic 'land bridge'. Widened 0.7→1.40 so the basin's INNER (NE, landward) shore grades in over a broad shelf rather than the obvious early drop-off; paired with seaSWReach above so the deep SW core survives. Tune live (press B/G/N).

  // ---- GLACIAL EUSTATIC SEA (the fast ~100 ky ripple, from Climate.seaLevel) ----
  // Distinct from the slow TECTONIC emergence above (seaRise/submergence, a one-way flood that
  // recedes by ~0.5 Ma): this is the glacio-eustatic cycle, and it is SIGNED and oscillating.
  // A glacial LOWSTAND (−125 m at the LGM) raises the low western shelf so it emerges as land and
  // the coast marches SEAWARD (more land, but open/cold/dune country); an interglacial HIGHSTAND
  // (+6 m) sinks it so the sea creeps INLAND (less land, but forested). Driven by the glacial index
  // at the morph's yearsBP (TerrainGenerator.glacialSeaShift → Climate), so it breathes over the
  // cycle as the world re-bakes, crossfaded like everything else. Elevation-attenuated to the coast
  // and WEST-gated, so it never touches the trans-range eastern lowland. Set glacialSeaAmp 0 to disable.
  glacialSeaAmp:   0.09,  // peak coastal elevation shift at full glacial↔interglacial swing; higher = the coast moves further. 0 = off.
  glacialSeaMid:   0.05,  // glacial index at which the sea sits at PRESENT (no shift). Climate stands +6 m at g≈0 and 0 m at g≈0.05, so warmer than this floods, colder exposes.
  glacialSeaCeil:  0.30,  // only ground BELOW this elevation is moved (the coastal shelf/plain); higher ground is untouched, so the ranges never shift.
  glacialSeaEastU: 0.42,  // WEST gate: the eustatic shift fades to 0 by this screen-X fraction, so it moves only the WESTERN coast, never the eastern trans-range land.

  // ---- DROWNED-VALLEY ESTUARY (the interglacial highstand extreme) -------------
  // The far pole of the highstand (TEMANAWA_ECOLOGY_COAST.md §8): at a warm interglacial the sea
  // does not just nudge the coast inland — it BACKS UP THE RIVER VALLEY as an estuary reaching east
  // to Shannon and north to Opiki. So the "coast" stops being an edge strip and fingers into the
  // middle of the map. Positional (follows the cached MAIN stem, wMDist/wMPos) and gated on the
  // glacial index (fills only in warm interglacials, drains in glacials). Elevation-gated to the
  // valley FLOOR, so terraces and the ranges stay dry. Applied in _applyGeoToHeightMap after the
  // combine, like the dune relief. Distinct from the uniform glacialSea coastal shift above.
  estuaryOnsetG:   0.16,  // glacial index BELOW which the estuary starts filling (full at g=0, empty at g≥this). Only warm interglacials drown the valley.
  estuaryReach:    0.60,  // how far up the main stem (wMPos, 0 = SW mouth → 1 = NE source) the estuary reaches at FULL highstand; scales with the highstand strength.
  estuaryWidth:    0.11,  // half-width (world frac) of the drowned floodplain either side of the main channel — how far the estuary spreads off the river.
  estuaryCeil:     0.24,  // only valley-floor ground BELOW this elevation drowns; higher terraces stay dry (a soft shoreline up the valley walls).

  // ---- LOCALIZED SUBMERGENCE PATCH (deep time, Axis A, positional) -------------
  // A single elliptical spot that starts fully DROWNED at ~1 Ma and fills back into the
  // normally-generated terrain by ~0.5 Ma — the SAME emergence clock as the SW strait
  // (GEO_EPOCHS.emergeTo, via geoTimeFactors().submergence), just confined to one place the
  // SW diagonal front only half-covers. Use it to sink a stubborn island/shoal that should
  // read as open water early and rise on its own by mid-window. Drowns to the mottled sea
  // floor REGARDLESS of the generated elevation inside the core, easing out over the feather.
  // Positional in (u,v): u = screen-X fraction (0 W → 1 E), v = screen-Y fraction (0 N → 1 S).
  // Set patchSubRX (or patchSubRY) to 0 to disable. Tune live (press B/G/N).
  patchSubU:       0.58,  // patch centre, horizontal (0 = west edge, 1 = east edge)
  patchSubV:       0.72,  // patch centre, vertical (0 = north/top edge, 1 = south/bottom edge)
  patchSubRX:      0.17,  // patch radius in u (half-width). 0 = OFF.
  patchSubRY:      0.15,  // patch radius in v (half-height) — a touch larger than RX offsets the 3/4 vertical squash so the drowned area reads round on screen. 0 = OFF.
  patchSubFeather: 1.20,   // soft taper (as a fraction of the radius) from full drown at the core edge out to dry land, on the W/N/S sides. Wider = more gradual shoreline. 0 = a hard shoreline. Widened 0.9→1.20 with the strait feathers so the deep central pocket shelves in to match. (The moa beach north of the patch stays land up to ~1.1.)
  patchSubFeatherE: 3.0,  // EAST taper — separate, and much wider, because the patch's eastern edge runs UPHILL into the coast: a short taper there drops from sea floor straight to high land in a cell or two, which the 3/4 relief bake paints as a jagged cliff line. This lengthens the eastern grade so the land eases down into the water from further east (a beach slope, not a drop-off). Blended smoothly by direction (full east → patchSubFeather at N/S), so no seam. Keep ≥ patchSubFeather; too large starts eating the far-east hill. Tune live (press B/G/N).

  // ---- SOUTH-HALF STRAIT (deep time, Axis A) ----------------------------------
  // The SOUTHERN half of the map subsides into a marine strait, deepest at its pulse peak
  // (~0.5 Ma), then the land returns by ~0.3 Ma — leaving the axial ranges (Tararua + Ruahine)
  // as the N–S land bridge and the Manawatū a 'ghost' of the strait. The pulse TIMING is dated
  // in GEO_EPOCHS.southSink*; these knobs are its SHAPE on the map. Positional in v (latitude).
  southSinkLat:     0.38,  // where the strait's north shore begins, as a vertical fraction (0 = north edge, 1 = south). Ground south of this drowns; north of it is untouched. Lower = MORE of the south submerged. Tune live (press B/G/N).
  southSinkFeather: 0.50,  // width of that shore ramp (in v). WIDE = the land eases under gradually (the brief's "not a sharp drop off at all"); small = a crisp coastline. Widened 0.22→0.50 so the southern shore ramp reaches to v~0.88 — the "especially southward" part of the gentler basin. Tune live (press B/G/N).
  southSinkProtect: 1.0,   // how strongly the Tararua range mass RESISTS submergence (1 = the range footprint + foothills stay fully dry — the land bridge; 0 = the strait floods straight over it). Tune live (press B/G/N).
  southSinkWobble:  0.05,  // meander the strait's north SHORE off the straight latitude line (in v), so the drowned area is not a square-edged patch. Also mottles the sea floor so it reads as varied open water. 0 = a straight, latitude-aligned coast. Tune live (press B/G/N).
  southSinkEastU:      0.60,  // EAST→WEST FILL: fade the south strait out toward the east — full west of the taper, 0 by this screen-X fraction — so the eastern/SE ground (and the axial Tararua block) emerges FIRST and the southern land fills westward as the pulse drains, instead of a uniform latitude band whose north shore lifts all at once (the jarring "rising bank" in the SE). 0 = off (the old full-width band). Tune live (press B/G/N).
  southSinkEastFeather: 0.30,  // width (in screen-X) of that east taper, west of southSinkEastU. WIDE = the south strait thins gradually into the eastern land; narrow = a crisper east edge. Tune live (press B/G/N).

  // ---- NORTH UP-RAMP (the far/top edge) ---------------------------------------
  // Raise the top of the SCREEN so the far edge is genuinely-higher generated terrain instead of
  // a flat eased-plains smear. Pairs with the terrain's thinner TOP edge ease (config.geoTopMargin,
  // authored in the level) so the raised land actually reaches the top. Applied in getElevation.
  northLiftFrac:    0.22,  // fraction of the screen height (from the top) that ramps up. 0 = off.
  northLiftAmt:     0.13,  // how much elevation to add at the very top edge (smoothstep to 0 at northLiftFrac). "Slightly higher" ≈ 0.10–0.18. Tune live (press B/G/N).

  // ---- EAST DOWN-RAMP (the inland/east flank) ---------------------------------
  // The island falloff peaks at the EAST edge, so noise "throws alpine across the whole east".
  // This grades the eastern strip DOWN so the two ranges fall away into the inland / eastern
  // Manawatū lowland instead of climbing to a bright plateau on the far side. Screen-space in x,
  // uniform in latitude; applied in getElevation, so the range uplift (which MULTIPLIES this base)
  // tapers with it. Regenerate / re-bake (B) to apply.
  eastLowerFrac:    0.4,  // fraction of the screen WIDTH (from the right/east edge) that ramps down. 0 = off.
  eastLowerAmt:     0.2,  // how much elevation to SUBTRACT at the very east edge (smoothstep to 0 at eastLowerFrac inland). Keep modest so the flank grades to hill/forest, not sea. Tune live (press B/G/N).

  // ---- COASTAL DUNE FIELD (the Manawatū transgressive dunefield) ---------------
  // The one landform driver that never changes across the whole deep-time window: the NW
  // wind blows shelf/beach sand inland toward the ESE (md/TEMANAWA_ECOLOGY_COAST.md §1,§10).
  // Rendered here as a BAKE-TIME SAND TINT only (no elevation change yet): each western
  // coastal-plain cell's colour is blended toward duneColor by an intensity that is densest
  // just inland of the shore and thins inland to 0 at the REACH. The reach is a screen-X
  // fraction measured inland (east) from the present western shoreline, and is capped well
  // short of the range spine — so the belt can NEVER bleed east across the ranges onto the
  // trans-range eastern lowland (the real constraint: dunes are a west-coast feature). The
  // reach GROWS with the glacial index (duneReachByPhase) — the Koputaroa surge: a narrow
  // green-locked belt in the interglacial, reaching far inland at full glacial. Per-phase,
  // applied in the season bake and blended by the same glacial-index crossfade as snow.
  // Tune live (press B). Set dune:false or duneMaxAmt:0 to disable.
  dune:            true,     // master toggle for the dune sand tint
  duneColor:       '#d8c489',// pale gold dune sand the plain is tinted toward (spinifex/pīngao country)
  duneMaxAmt:      0.5,      // peak blend toward duneColor at the belt core (0 = off, 1 = pure sand)
  duneShoreOffset: 0.012,    // inland gap (screen-X frac) before the tint starts — leaves the bare beach/foredune toe
  duneElevLo:      0.16,     // no sand tint below this elevation (keeps it off the water + wet slack)
  duneElevHi:      0.42,     // sand tint fades out above this elevation (keeps it off the range flanks / hill forest)
  // REACH per glacial phase — inland extent as a screen-X fraction from the shoreline.
  // Ascending with cold: the dunefield surges inland as the climate cools (Koputaroa mode)
  // and contracts to a coastal belt in the interglacial. Keep the LARGEST well under the
  // shoreline→spine distance (~0.5+ at these latitudes) so the belt stops short of the ranges.
  duneReachByPhase: { interglacial: 0.11, cooling: 0.17, glacial: 0.25, fullGlacial: 0.33 },
  // DUNE RELIEF — low wind-aligned (NW→SE) sand ridges added to the coastal-plain ELEVATION
  // in the belt, so it reads as landform, not just a wash. Added ONCE at the GLACIAL (max)
  // reach — relict topography that persists across phases while the sand COLOUR (per-phase,
  // above) surges over and greens off it, exactly as the stabilised Koputaroa/Foxton belts do.
  // In the single heightMap (both sync + sliced morph share it), so entities ride the bumps too.
  duneRelief:      0.028,    // peak ridge height (0..1 elevation) at the belt core; 0 = colour only, no landform
  duneRidgeFreq:   52,       // spatial frequency of the ridges across the wind axis — more = finer streaks running NW→SE inland
  // FLUX → COLOUR REACH: the live sand flux (Game._duneSurge, the disturbance-driven wind×exposure,
  // mirrored onto terrain._duneSurge) extends the per-phase sand-colour reach INLAND toward the
  // fixed glacial (relict) reach — a mismanaged coast re-mobilises the old belt, the sand creeps
  // inland (and a storm advances it a step, §10B). Sampled per morph re-bake and crossfaded, so it
  // never outruns the relief and never lands as a cut. 0 = the reach ignores flux (per-phase only).
  duneSurgeGain:   0.9,      // how far full disturbance flux pushes the reach from the phase value toward the glacial reach (0..1)
  duneSurgeAmt:    0.6,      // how much the surge also BRIGHTENS the sand blend (bare mobile sand vs stabilised/vegetated dune): duneMaxAmt × (1 + surge·this), capped at 1. 0 = reach-only, no colour change
  duneCoastTrack:  1.0,      // how far the dune belt's shoreline FOLLOWS the glacial-eustatic sea (screen-X per elevation-shift unit ≈ 1/coast slope). So in a glacial the dunes march seaward onto the bared shelf (true Koputaroa mode); 0 = belt pinned to the present coast
  // BLOW-OUTS (§10B(2)): where the belt is ACTIVE/mobile (high sand surge), the wind scours bare-sand
  // DEFLATION HOLLOWS down to the moist water-table plane; a stable, vegetated belt has none. Carved
  // into the dune relief in _applyGeoToHeightMap, surge-gated, so a storm (which spikes the surge)
  // opens them and they heal as the belt re-stabilises. Sparse, thresholded pattern in the belt.
  duneBlowout:      1.4,     // how fully an active belt deflates its hollows toward the water table at a blow-out centre (deflation is capped at a full scour to the floor; > 1 lets the centres bottom out before full surge)
  duneBlowoutFreq:  30,      // spatial frequency / count of the blow-out hollows across the belt
  duneBlowoutOnset: 0.25,    // sand SURGE above which blow-outs begin to open (a stable belt below this has none)
  duneWaterTable:   0.12,    // the deflation FLOOR — dry sand blows away down to the moist water-table plane (just above the sea band ~0.10, so a scoured hollow reads as a bare-sand / wet-slack bowl, not open lagoon). Raise it if the land re-tune sits the belt higher; lower it toward the sea band for deeper, wetter hollows

  // ---- EAST→WEST STRAIT RETREAT (deep time) ------------------------------------
  // The wide main-stem "strait" (straitWidthMult) closes two ways at once as the ranges rise:
  //   1. it THINS uniformly over time — the old behaviour — over GEO_EPOCHS.straitClose* dates
  //      (held full-wide before ~0.7 Ma, down to a plain river by ~0.25 Ma); and
  //   2. its EASTERN end DRAWS BACK to the west over GEO_EPOCHS.straitRetreat* (~0.7→0.5 Ma),
  //      revealing the narrow NORTHWARD river SOURCE (the stem's NE reach) as a river east of the
  //      front while the western part is still a strait.
  // The two multiply, so at ~0.7 Ma the strait stretches right across the screen, then narrows AND
  // retreats east→west into the ordinary river. The knobs below are the RETREAT (reveal) front; the
  // THINNING rate is straitWidthMult + the straitClose* dates. Governs the WATER paint + the carve,
  // not any elevation flood. Positional in u — a clean N–S front. Tune live (B/G/N).
  straitReachEarly:       1.00,  // eastern extent of the WIDE strait at/before straitRetreatFrom (~0.7 Ma), as a screen-X fraction from the WEST. 1.0 = wide right across the screen.
  straitReachLate:        0.70,  // eastern extent at/after straitRetreatTo (~0.5 Ma). 0.70 = the retreat has bared the eastern 30% as the narrow NE source; the strait west of it keeps thinning away on the straitClose* schedule. Lower = the source is revealed further west.
  straitRetreatFeather:   0.08,  // softness of the wide→narrow front (screen-X fraction). 0 = a hard step from strait to river.

  // ---- MAIN NE-ARM RECESSION (deep time, GEO_EPOCHS.mainArm*) ------------------
  // Early the main stem reaches inland to its NE source (flowing inland). Once the ranges rise the
  // drainage flips: the flow reverses seaward (~0.6 Ma) and the inland (NE) reach dries back to LAND,
  // gone by the narrow-river stage. Positional in downstream wPos (0 = SW mouth, 1 = NE source).
  mainArmKeep:    0.55,  // main river: the seaward reach with wPos BELOW this survives; the NE reach ABOVE it dries to land at full recession. Lower = more of the NE removed (river ends further seaward). The authored NE arm is the last polyline segment, ~wPos 0.69→1.
  mainArmFeather: 0.14,  // main river: width (in wPos) of the drying front's soft taper above mainArmKeep, so the arm fades to land instead of ending on a hard line.

  // ---- colours ----
  hazeColor:    '#20303a', // uniform tone the sky fades to (keeps the top streak-free)
  outlineColor: '#ffffff', // fallback boundary ink (a biome's own `outlineColor` wins)
  shoreColor:   '#eee9b9', // shoreline stroke
  reliefEdgeColor: '#ffffff', // bold dark outline on relief steps (matches the sprite ink)

  dump() { const o = {}; for (const k in this) if (typeof this[k] !== 'function') o[k] = this[k]; console.log('[LOOK]', o); return o; }
};

// ============================================
// TERRAIN GENERATOR - Pre-baked seasonal buffers
// Zero computation during season transitions
// ============================================
class TerrainGenerator {
  constructor(config, biomes) {
    this.config = config;
    this.biomes = biomes;
    this.biomeList = Object.values(biomes).sort((a, b) => a.minElevation - b.minElevation);
    this.seed = random(10000);

    // VIEW ZOOM-OUT (config.viewAreaGain). Show more terrain AREA on screen without touching
    // the camera or the cell budget: the generated world (base noise + coast + geo skeleton) is
    // scaled DOWN by the linear factor _viewF so a wider window fits the same grid. 1 = off.
    // Refreshed at generate() start so GEN live-edits + a G re-bake take effect. See getElevation
    // (coord remap), _prepGeo (skeleton inset) and Simulation.spawnPlants (density scales with it).
    this._viewGain = (config.viewAreaGain > 0) ? config.viewAreaGain : 1;
    this._viewF = Math.sqrt(this._viewGain);
    
    // Typed arrays
    this.heightMap = null;
    this.biomeIndexMap = null;
    this.biomeArray = null;
    
    // Pre-baked buffers, one per GLACIAL PHASE (created once at generation). These
    // are the four points the deep-time glacial index blends between — not seasons.
    this.seasonBuffers = {
      interglacial: null,
      cooling:      null,
      glacial:      null,
      fullGlacial:  null
    };

    // Snow line per glacial phase. Spans the full glacial range (Climate.snowLineWarm
    // 0.92 → snowLineCold 0.55): snow only caps the peaks in an interglacial and
    // reaches well down the ranges at full glacial.
    this.seasonSnowLines = {
      interglacial: 0.92,
      cooling:      0.80,
      glacial:      0.67,
      fullGlacial:  0.55
    };

    // Allow level-specific snow lines
    if (config.seasonSnowLines) {
      Object.assign(this.seasonSnowLines, config.seasonSnowLines);
    }
      
    // Season manager reference
    this.seasonManager = null;
    
    // Dimensions — see TerrainGenerator.gridFor(). Two modes:
    //   'square'  a fixed CONFIG.mapGrid square, letterboxed into the screen via
    //             CONFIG.viewX/viewY/viewZoom.
    //   'fit'     the grid takes the screen's aspect at a constant cell COUNT, so
    //             it fills the panel edge to edge and costs the same either way.
    // CONFIG.mapGrid is the one number that governs simulation cost — see
    // TEMANAWA_BUILD_V3.md §5.2 (hard limit: 256).
    const zoom = config.zoom || 1;
    const fit = TerrainGenerator.gridFor(config);

    this.mapWidth = fit.cols;
    this.mapHeight = fit.rows;
    this.worldWidth = fit.cols * zoom;
    this.worldHeight = fit.rows * zoom;
    this.zoom = zoom;

    // Effective noise frequency. Held on the instance rather than written back
    // to CONFIG so the authored value never drifts across regenerations — 'fit'
    // rescales it so a landform keeps the same apparent size on screen.
    this.noiseScale = fit.noiseScale;
    this.fitMode = fit.mode;
    this.fitAspect = fit.aspect;

    this.scale = config.pixelScale;
    this.invScale = 1 / config.pixelScale;
    this.gridCols = Math.ceil(this.mapWidth * this.invScale);
    this.gridRows = Math.ceil(this.mapHeight * this.invScale);

    // Geography skeleton (SVG-authored via tools/svg2geo.js). Optional: if present,
    // the base noise field is reshaped by it — ranges lift, the river carves — and
    // both scale with deep time. md/TEMANAWA_GEOGRAPHY.md.
    this.geo = config.geo || (typeof TE_MANAWA_GEO !== 'undefined' ? TE_MANAWA_GEO : null);
    this._geoRanges = []; this._geoRivers = [];
    this._geoT = { uplift: 1, incision: 1, emergence: 1, submergence: 0 };   // 1 = mature (present); set from yearsBP in generate()
    this._baseNoise = null;                     // seed field, cached so morphTo() need not re-run noise
    this._geoBaseCeil = (config.geoBaseCeil != null) ? config.geoBaseCeil : 0.5;  // with a skeleton, compress the procedural base below this so RANGES own the highs
    this._geoEdgeMargin = (config.geoEdgeMargin != null) ? config.geoEdgeMargin : 0.10;  // ease terrain down to plains within this fraction of the N/S edges (kills the 3/4 edge smear); 0 disables
    // TOP (far) edge ease, separate from the bottom so the north up-ramp (LOOK.northLift*) can fill
    // the far edge with real elevated terrain instead of a wide flat plains band. Thin by default;
    // defaults to _geoEdgeMargin when the level doesn't author it (old symmetric behaviour).
    this._geoTopMargin = (config.geoTopMargin != null) ? config.geoTopMargin : this._geoEdgeMargin;
    this._geoCache = null;                      // per-footprint distance/noise field; morphTo() re-applies only the time factors
    this._bakeScaleOverride = null;             // morph re-bakes use a reduced bakeScale (set transiently)

    // Incremental morph (see morphBegin/morphStep). The job spreads a morph
    // re-bake across frames so the visitor path never hitches; the pool holds
    // retired back buffers for reuse (created once, recycled every morph); the
    // fade crossfades the freshly baked land in over >=500 ms (photosensitivity
    // budget, TEMANAWA_BUILD_V3.md §5.2).
    this._morphJob = null;
    this._morphFade = null;
    this._bufPool = [];

    // Time-INDEPENDENT wobble noise fields (biome-border wander). The wobble
    // depends only on seed / frequency / footprint, never on yearsBP, so the
    // morph path re-reads these caches instead of re-running ~1M+ noise()
    // calls per re-bake for identical results.
    this._simWob = null;   this._simWobKey = '';
    this._paintWob = null; this._paintWobKey = '';
    
    this._initBiomeIndex();
    this._colorCache = new Map();
    this._snowColorsRGB = null;
  }

  // ============================================
  // GRID FOOTPRINT — 'square' | 'fit'
  // ============================================
  // Pure, static and p5-free, so tools/bootcheck.js can assert against it
  // directly without booting the sketch.
  //
  // 'square' is a CONFIG.mapGrid square letterboxed into whatever the panel
  // happens to be. On the 9:16 kiosk that throws away ~44% of the screen.
  //
  // 'fit' keeps the CELL COUNT constant and spends it on the screen's aspect
  // instead:
  //
  //     cols = grid·√a     rows = grid/√a      a = canvasWidth / canvasHeight
  //
  // so cols·rows ≈ grid² at every aspect. On 1080×1920 that is 384×682 =
  // 261,888 cells against 512² = 262,144 — the same simulation cost, no
  // letterbox. This matters because mapGrid is the number every per-cell
  // system scales on (the pixel bake now, the per-cell ecology fields next), so a
  // fill mode that grew the grid with the aspect would silently blow the §5.2
  // budget on a tall panel.
  //
  // Two consequences worth knowing:
  //   · Cells are smaller in screen terms on the short axis, so noiseScale is
  //     rescaled by the zoom ratio to hold apparent landform size constant.
  //     Without this, 'fit' looks like a different level rather than the same
  //     level shaped to the screen.
  //   · Beyond terrainFitMaxStretch the aspect is clamped and the remainder
  //     letterboxes again. A 3:1 video wall should not get a 3:1 world — the
  //     coastline banding in getIslandFalloff() runs along the X axis and
  //     stops reading past about 2:1.
  static gridFor(config) {
    const grid = config.mapGrid || 256;
    const ns = config.noiseScale;

    if (config.terrainFit !== 'fit') {
      return { cols: grid, rows: grid, noiseScale: ns, aspect: 1, mode: 'square' };
    }

    const cw = config.canvasWidth || grid;
    const ch = config.canvasHeight || grid;
    const maxStretch = config.terrainFitMaxStretch || 2.0;

    let aspect = cw / Math.max(1, ch);
    aspect = Math.max(1 / maxStretch, Math.min(maxStretch, aspect));

    // Even dimensions keep the pixel bake's row strides tidy.
    const r = Math.sqrt(aspect);
    const cols = Math.max(64, Math.round(grid * r / 2) * 2);
    const rows = Math.max(64, Math.round(grid / r / 2) * 2);

    // Hold apparent feature size on screen constant against the square
    // reference: featurePx = (1/noiseScale) · viewZoom, so noiseScale scales
    // by the ratio of the two view zooms.
    const zFit = Math.min(cw / cols, ch / rows);
    const zSquare = Math.min(cw, ch) / grid;
    const noiseScale = (zSquare > 0) ? ns * (zFit / zSquare) : ns;

    return { cols, rows, noiseScale, aspect, mode: 'fit' };
  }

  _initBiomeIndex() {
    this.biomeArray = this.biomeList.slice();
    this.biomeIndexByKey = {};
    for (let i = 0; i < this.biomeArray.length; i++) {
      this.biomeIndexByKey[this.biomeArray[i].key] = i;
    }
    
    // Cache commonly-needed biome roles by scanning properties
    // instead of assuming fixed keys exist
    this._waterBiome = null;
    this._snowBiome = null;
    this._fallbackBiome = null;
    this._bedBiome = null;
    this._wetlandBiome = null;   // riparian swamp, assigned by the river-proximity override (not elevation)

    for (const biome of this.biomeList) {
      // Wetland: matched by key — it has no elevation niche of its own (its band is
      // shadowed by grassland on purpose), so it is only ever placed by the classify override.
      if (biome.key === 'wetland') this._wetlandBiome = biome;
      // Water: the lowest non-walkable biome, or anything flagged isWater
      if (biome.isWater || (!biome.walkable && biome.maxElevation <= 0.15)) {
        if (!this._waterBiome || biome.minElevation < this._waterBiome.minElevation) {
          this._waterBiome = biome;
        }
      }
      // Riverbed / bank: the lowest WALKABLE band (the sandy coast) — reused to frame the
      // river with exposed shingle so the water reads narrower and sits in a bed.
      if (biome.walkable && (!this._bedBiome || biome.minElevation < this._bedBiome.minElevation)) {
        this._bedBiome = biome;
      }
      // Snow: highest biome
      if (biome.key === 'snow' || biome.minElevation >= 0.85) {
        this._snowBiome = biome;
      }
      // Fallback: first walkable biome with plants
      if (!this._fallbackBiome && biome.walkable && biome.canHavePlants) {
        this._fallbackBiome = biome;
      }
    }
    
    // If no water biome found, use the lowest biome
    if (!this._waterBiome) {
      this._waterBiome = this.biomeList[0];
    }
    // If no snow biome, disable snow features
    // _snowBiome can stay null — we'll check before using
    // If no fallback, use the middle biome
    if (!this._fallbackBiome) {
      this._fallbackBiome = this.biomeList[Math.floor(this.biomeList.length / 2)];
    }
  }
  
  setSeasonManager(manager) {
    this.seasonManager = manager;
  }
  
  _initSnowColors() {
    if (!this._snowBiome) return;
    this._snowColorsRGB = this._snowBiome.colors.map(hex => {
      const c = this._getCachedColor(hex);
      return [red(c), green(c), blue(c)];
    });
  }
  
  getSnowLineElevation() {
    if (!this._snowBiome) return 1.0; // No snow in this level
    if (!this.seasonManager) {
      return this._snowBiome.minElevation;
    }
    
    const currentLine = this.seasonSnowLines[this.seasonManager.currentKey];
    const progress = this.seasonManager.transitionProgress;
    
    if (progress > 0) {
      const nextLine = this.seasonSnowLines[this.seasonManager.nextKey];
      return lerp(currentLine, nextLine, progress);
    }
    
    return currentLine;
  }
  
  isSeasonalSnow(elevation) {
    return elevation >= this.getSnowLineElevation();
  }

  // ============================================
  // COORDINATE HELPERS
  // ============================================
  
  isInBounds(x, y) {
    return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
  }
  
  clampToBounds(x, y) {
    return {
      x: Math.max(0, Math.min(this.mapWidth - 1, x)),
      y: Math.max(0, Math.min(this.mapHeight - 1, y))
    };
  }
  
  getRandomPosition(padding = 0) {
    return {
      x: padding + random() * (this.mapWidth - padding * 2),
      y: padding + random() * (this.mapHeight - padding * 2)
    };
  }
  
  // ============================================
  // NOISE GENERATION (unchanged)
  // ============================================
  
  fractalNoise(x, y) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    
    // Instance value, not this.config.noiseScale — 'fit' mode rescales it.
    const noiseScale = this.noiseScale;
    const seed = this.seed;
    const persistence = this.config.persistence;
    const lacunarity = this.config.lacunarity;
    const octaves = this.config.octaves;
    
    for (let i = 0; i < octaves; i++) {
      total += noise(x * frequency * noiseScale + seed,
                     y * frequency * noiseScale + seed) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return total / maxValue;
  }
  
  ridgeNoise(x, y) {
    const n = this.fractalNoise(x * 0.5, y * 0.5);
    return 1 - Math.abs(n * 2 - 1);
  }
  
  getIslandFalloff(x, y) {
    const nx = x / this.mapWidth;
    const ny = y / this.mapHeight;
    
    const warpX = noise(x * 0.01 + this.seed, y * 0.01) * 0.2;
    const warpY = noise(x * 0.01 + this.seed * 2, y * 0.01 + this.seed) * 0.2;
    
    const warpedNx = nx + warpX - 0.1;
    const warpedNy = ny + warpY - 0.1;
    
    let coastNoise = 0;
    coastNoise += noise(warpedNy * 1.5 + this.seed, this.seed * 0.5) * 0.4;
    coastNoise += noise(warpedNy * 3 + this.seed * 1.5, warpedNx * 0.5) * 0.2;
    coastNoise += noise(x * 0.02 + this.seed * 2, y * 0.02 + this.seed * 2) * 0.1;

    // How far inland (east, screen-X fraction) the FINAL western shoreline sits: a uniform
    // base (coastInland) + an extra reach toward the south (coastInlandSouth·ny, 0 at the
    // north edge → full at the south), on top of the per-row meander. This is the present
    // coast; the strait's harsher early southern curve comes from the marine submergence
    // (seaSWReach) and flattens onto this by ~0.5 Ma. See LOOK.coastInland / coastInlandSouth.
    const inland = (typeof LOOK !== 'undefined' && LOOK.coastInland != null) ? LOOK.coastInland : 0.02;
    const inlandSouth = (typeof LOOK !== 'undefined' && LOOK.coastInlandSouth != null) ? LOOK.coastInlandSouth : 0;
    const coastlinePosition = inland + inlandSouth * ny + coastNoise * 0.4;
    
    // Clean-ramp width: within this shore-distance the shelf-relief noise is suppressed to 0, so the
    // waterline crosses the sea band once (a clear ramp) instead of the noise shattering it into bits.
    const rampW = (typeof LOOK !== 'undefined' && LOOK.coastRampWidth != null) ? LOOK.coastRampWidth : 0;
    // Shelf-relief amplitude / detail (LOOK): kept well below the offshore base gradient so the shelf
    // deepens monotonically (a gradual coast) instead of relief bars poking through the waterline.
    const shelfAmp = (typeof LOOK !== 'undefined' && LOOK.coastShelfRelief != null) ? LOOK.coastShelfRelief : 0.11;
    const shelfDetail = (typeof LOOK !== 'undefined' && LOOK.coastShelfDetail != null) ? LOOK.coastShelfDetail : 0.5;
    let falloff;
    if (warpedNx < coastlinePosition) {
      const seaDepth = (coastlinePosition - warpedNx) / coastlinePosition;   // 0 at shore → 1 deep offshore
      // Undulating shelf relief. Without it the submerged floor is a dead-flat ramp, so as
      // the marine embayment recedes over deep time it surfaces in uniform sheets ("patches").
      // Two octaves of relief, strongest in the shallows (squared taper) and fading to a
      // smooth deep floor, give the emerging shelf natural low undulation and the waterline
      // real slope — but capped (shelfAmp) below the base gradient so it never fragments.
      const shelf = ((noise(x * 0.018 + this.seed * 5, y * 0.018 + this.seed * 6) - 0.5)
                   + (noise(x * 0.045 + this.seed * 8, y * 0.045) - 0.5) * shelfDetail) * shelfAmp;
      // Fade the relief IN off the waterline (0 at the shore → full by rampW) as well as OUT into
      // the deep, so the immediate shoreline is a clean monotone ramp, not a shattered noisy edge.
      let shelfW = (rampW > 0) ? (seaDepth < rampW ? seaDepth / rampW : 1) : 1;
      shelfW *= (1 - seaDepth) * (1 - seaDepth);
      falloff = (1 - seaDepth) * 0.12 + shelf * shelfW;
      if (falloff < 0) falloff = 0;
    } else {
      const landProgress = (warpedNx - coastlinePosition) / (1 - coastlinePosition);
      // Ease the land UP off the shore. Exponent > 1 is convex — flat beach/shelf at the
      // waterline rising gradually inland — so the coast no longer drops as a cliff (the
      // old 0.7 was concave: a steep wall right at the shore). LOOK.coastEase tunes it.
      const coastEase = (typeof LOOK !== 'undefined' && LOOK.coastEase != null) ? LOOK.coastEase : 1.4;
      falloff = 0.13 + Math.pow(landProgress, coastEase) * 0.87;
      // Coastal-plain undulation near the shore (fading inland), so the just-emerged land
      // carries the same natural relief as the shelf it rose from — no flat monotone apron.
      const ridgeNoise = noise(x * 0.012 + this.seed * 4, y * 0.012) * 0.2;
      // Suppress the shelf noise across the clean-ramp band just inland of the waterline (0 at the
      // shore → full by rampW), then fade it out inland — so the shoreline itself stays a clear ramp.
      let shelfW = (rampW > 0) ? (landProgress < rampW ? landProgress / rampW : 1) : 1;
      shelfW *= Math.exp(-landProgress * 6);
      const shelf = ((noise(x * 0.018 + this.seed * 5, y * 0.018 + this.seed * 6) - 0.5)
                   + (noise(x * 0.045 + this.seed * 8, y * 0.045) - 0.5) * shelfDetail) * shelfAmp;
      falloff += ridgeNoise * landProgress + shelf * shelfW;
    }
    
    // Clamp ny to [0,1] here: the VIEW ZOOM-OUT can hand this function coords a little past the
    // map edge (ny slightly <0 or >1), and sin(ny·π) would then go negative → pow(neg,0.3)=NaN.
    // Clamping keeps the coast's edge-fade profile (0 at the top/bottom edges → 1 mid-map) intact.
    const nyE = ny < 0 ? 0 : ny > 1 ? 1 : ny;
    const edgeSoftness = Math.pow(Math.sin(nyE * Math.PI), 0.3);
    falloff *= 0.6 + edgeSoftness * 0.4;
    
    return Math.max(0, Math.min(1, falloff));
  }
  
  getElevation(x, y) {

    // North up-ramp / east down-ramp fractions are SCREEN-space (top / right of the frame), so
    // capture the grid fractions BEFORE the view remap below moves x,y into geography space.
    const gridNy = y / this.mapHeight;
    const gridNx = x / this.mapWidth;

    // VIEW ZOOM-OUT: sample the generated world at coords expanded about the map centre by
    // _viewF, so the same grid shows a wider window (the land reads smaller = more area on
    // screen). Everything downstream — fractalNoise, ridgeNoise, getIslandFalloff — inherits
    // it from these reassigned x,y. _viewF === 1 (off) is the identity, so this is a no-op then.
    const vf = this._viewF;
    if (vf !== 1) {
      const cx = this.mapWidth * 0.5, cy = this.mapHeight * 0.5;
      x = cx + (x - cx) * vf;
      y = cy + (y - cy) * vf;
    }

    // changing falloff
    const base = this.fractalNoise(x, y);
    const ridge = this.ridgeNoise(x, y);
    let elevation = base * (1 - this.config.ridgeInfluence) + ridge * this.config.ridgeInfluence;
    // ridgeInfluence > 1 EXTRAPOLATES (the scaffold authors 1.4), so this blend
    // can dip below zero where the ridge term is small — and pow(negative,
    // fractional) is NaN. The Math.max(0, Math.min(1, NaN)) clamp below stays
    // NaN, and a NaN cell silently falls through getBiomeFromElevation to the
    // LAST band. Clamp before the pow. (Found by the harness's morph identity
    // check: NaN !== NaN flagged the cells.)
    if (elevation < 0) elevation = 0;
    elevation = Math.pow(elevation, this.config.elevationPower);
      
    if (this.config.useLakes) {
      // Inland terrain: no coastal falloff
      // Instead, create lake basins by depressing low areas further
      elevation = this._applyLakeBasins(x, y, elevation);
    } else {
      // Original coastal island behavior
      const falloff = this.getIslandFalloff(x, y);
      elevation *= falloff;
    }
    // With a geography skeleton, the RANGES own the high ground: soft-compress the
    // procedural base above a lowland/forest ceiling so noise no longer throws
    // alpine across the whole east. Ranges lift above this in _applyGeo.
    if (this.geo) elevation = TerrainGenerator._compressBase(elevation, this._geoBaseCeil);
    // NORTH UP-RAMP: raise the top LOOK.northLiftFrac of the SCREEN smoothly by up to
    // LOOK.northLiftAmt (max at the very top edge → 0 at northLiftFrac). This fills the far
    // (north) edge with genuinely-higher generated terrain instead of a flat eased-plains band,
    // and pairs with the thinner top edge ease (_geoTopMargin) so it actually shows. Screen-space
    // via gridNy (captured pre-remap). Regenerate / re-bake (B) to apply.
    const nAmt = (typeof LOOK !== 'undefined' && LOOK.northLiftAmt != null) ? LOOK.northLiftAmt : 0;
    const nFrac = (typeof LOOK !== 'undefined' && LOOK.northLiftFrac != null) ? LOOK.northLiftFrac : 0;
    elevation += TerrainGenerator._northLift(gridNy, nFrac, nAmt, elevation);   // gated off sea/coast (no top-left smear)
    // EAST DOWN-RAMP: grade the right LOOK.eastLowerFrac of the SCREEN down by up to
    // LOOK.eastLowerAmt (max at the east edge → 0 at eastLowerFrac inland), so the ranges fall
    // away into the inland/eastern Manawatū instead of climbing to a bright plateau. Screen-space
    // via gridNx (captured pre-remap). Regenerate / re-bake (B) to apply.
    const eAmt = (typeof LOOK !== 'undefined' && LOOK.eastLowerAmt != null) ? LOOK.eastLowerAmt : 0;
    const eFrac = (typeof LOOK !== 'undefined' && LOOK.eastLowerFrac != null) ? LOOK.eastLowerFrac : 0;
    elevation -= TerrainGenerator._eastLower(gridNx, eFrac, eAmt);
    return Math.max(0, Math.min(1, elevation));
  }

  // One-time light smoothing of the coastal SHELF in the base field: blend each low cell
  // toward its 3×3 neighbourhood, strongest at sea level and fading to nothing by ~0.28
  // (grassland), so the waterline/beach loses its speckle and blocky relief steps while the
  // plains and ranges stay crisp. Runs once per generate on the CACHED base field, so it
  // never diverges the sync vs sliced morph. LOOK.coastSmooth = pass count (0 = off).
  _smoothCoast(arr, gc, gr) {
    const strength = (typeof LOOK !== 'undefined' && LOOK.coastSmooth != null) ? LOOK.coastSmooth : 0;
    if (!(strength > 0)) return;
    const hi = 0.28;
    if (!this._coastTmp || this._coastTmp.length !== arr.length) this._coastTmp = new Float32Array(arr.length);
    const tmp = this._coastTmp;
    const passes = Math.max(1, Math.round(strength));
    for (let p = 0; p < passes; p++) {
      tmp.set(arr);
      for (let row = 0; row < gr; row++) {
        for (let col = 0; col < gc; col++) {
          const i = row * gc + col, e = tmp[i];
          if (e >= hi) continue;                       // plains + ranges untouched
          let wgt = 1 - e / hi; if (wgt < 0) wgt = 0;  // full at the waterline, fading out by `hi`
          let sum = 0, n = 0;
          for (let dr = -1; dr <= 1; dr++) {
            const r = row + dr; if (r < 0 || r >= gr) continue;
            for (let dc = -1; dc <= 1; dc++) {
              const c = col + dc; if (c < 0 || c >= gc) continue;
              sum += tmp[r * gc + c]; n++;
            }
          }
          arr[i] = e + (sum / n - e) * wgt;
        }
      }
    }
  }

  // DE-CLIFF pass (LOOK.cliffSmooth): after the skeleton carve/uplift, ease ONLY the
  // extremely harsh steps — a cell whose steepest 4-neighbour drop exceeds `cliffSmooth`
  // (elevation per cell) — toward its neighbourhood. This is what the 3/4 relief bake would
  // otherwise render as a tall dark wall (a bank against the low strait, a channel edge that
  // has drifted off the new ground level mid-morph). The blend strength scales with how far
  // the step exceeds the threshold and is capped, so a genuine cliff is softened, not
  // flattened; gentler relief (plains, range flanks) sits under the threshold and is left
  // alone. Runs on the CACHED heightMap deterministically — no seed/noise — so a sliced
  // morph stays byte-identical to a synchronous one (the harness asserts this).
  _smoothCliffs(arr, gc, gr) {
    const thresh = (typeof LOOK !== 'undefined' && LOOK.cliffSmooth != null) ? LOOK.cliffSmooth : 0;
    if (!(thresh > 0)) return;
    const passes = Math.max(1, Math.round((typeof LOOK !== 'undefined' && LOOK.cliffSmoothPasses != null) ? LOOK.cliffSmoothPasses : 1));
    if (!this._cliffTmp || this._cliffTmp.length !== arr.length) this._cliffTmp = new Float32Array(arr.length);
    const tmp = this._cliffTmp;
    for (let p = 0; p < passes; p++) {
      tmp.set(arr);
      let i = 0;
      for (let row = 0; row < gr; row++) {
        for (let col = 0; col < gc; col++, i++) {
          const e = tmp[i];
          let maxd = 0, sum = 0, n = 0;
          if (row > 0)      { const ev = tmp[i - gc]; const d = e > ev ? e - ev : ev - e; if (d > maxd) maxd = d; sum += ev; n++; }
          if (row < gr - 1) { const ev = tmp[i + gc]; const d = e > ev ? e - ev : ev - e; if (d > maxd) maxd = d; sum += ev; n++; }
          if (col > 0)      { const ev = tmp[i - 1];  const d = e > ev ? e - ev : ev - e; if (d > maxd) maxd = d; sum += ev; n++; }
          if (col < gc - 1) { const ev = tmp[i + 1];  const d = e > ev ? e - ev : ev - e; if (d > maxd) maxd = d; sum += ev; n++; }
          if (maxd > thresh && n > 0) {
            let w = (maxd - thresh) / maxd;             // 0 at the threshold → 1 for an infinite wall
            if (w > 0.6) w = 0.6;                       // cap: soften, never fully flatten
            arr[i] = e + (sum / n - e) * w;
          }
        }
      }
    }
  }

  _applyLakeBasins(x, y, elevation) {
    const lakeNoiseScale = this.config.lakeNoiseScale || 0.008;
    const lakeThreshold = this.config.lakeThreshold || 0.12;
    
    // Secondary noise determines where lakes form
    const lakeNoise = noise(
      x * lakeNoiseScale + this.seed * 3,
      y * lakeNoiseScale + this.seed * 3.7
    );
    
    // Lakes form where both the terrain is low AND lake noise is high
    // This creates distinct basins rather than flooding all low ground
    if (elevation < 0.25 && lakeNoise > 0.5) {
      // How deep into the lake zone
      const basinStrength = (0.25 - elevation) * (lakeNoise - 0.5) * 4;
      elevation -= basinStrength * 0.3;
      
      // Clamp to create flat lake floors
      if (elevation < lakeThreshold * 0.5) {
        elevation = lakeThreshold * 0.3 + 
          noise(x * 0.05, y * 0.05) * lakeThreshold * 0.15;
      }
    }
    
    // Soft edge falloff at map borders (not ocean, just prevents
    // entities walking off the edge)
    const nx = x / this.mapWidth;
    const ny = y / this.mapHeight;
    const edgeDist = Math.min(nx, 1 - nx, ny, 1 - ny);
    const edgeFalloff = Math.min(1, edgeDist * 12);
    elevation *= 0.3 + edgeFalloff * 0.7;
    
    return elevation;
  }
  
  // ============================================
  // LOOKUPS
  // ============================================
  
  getElevationAt(x, y) {
    const col = (x * this.invScale) | 0;
    const row = (y * this.invScale) | 0;
    if (col < 0 || row < 0 || col >= this.gridCols || row >= this.gridRows) return 0.5;
    return this.heightMap[row * this.gridCols + col];
  }
  
  // Water class at a world point, read from the paint-resolution classification
  // the season bake produced: 0 land · 1 true sea (drawn flat) · 2 open river
  // water (rides the terrain). Used by the animated water overlay to decide where
  // to stamp flow/eel/shimmer decals. Returns 0 before the first bake.
  waterTypeAt(x, y) {
    const W = this._paintWater;
    if (!W) return 0;
    const S = this._paintScale, PW = this._paintW, PH = this._paintH;
    let pc = Math.round(x * S); if (pc < 0) pc = 0; else if (pc >= PW) pc = PW - 1;
    let pr = Math.round(y * S); if (pr < 0) pr = 0; else if (pr >= PH) pr = PH - 1;
    return W[pr * PW + pc];
  }

  // The authored river polylines (normalised 0..1 in the geo viewBox), each
  // { type, width, depth, pts }. The overlay maps pts to world via mapWidth/Height.
  getRivers() { return this._geoRivers || []; }

  // The main stem is authored SW-mouth → NE-source, so its overlay flow reads INLAND early. Once the
  // ranges rise and the NE arm begins to recede (mainArm > 0, ~0.6 Ma) the drainage flips: the flow
  // runs SEAWARD (toward the SW coast). The water overlay reads this to orient current/eel travel.
  mainFlowReversed() { return !!(this._geoT && this._geoT.mainArm > 0); }

  getBiomeFromElevation(elevation) {
    // Guard the floor: marine emergence (seaLift) clamps large areas to exactly 0, and the
    // biome-border wobble then pushes those cells NEGATIVE — which matches no band and fell
    // through to the LAST biome (snow), painting the submerged basin as a grey-white speckle
    // (the "grey screen at 1 Ma"). Negative or NaN reads as the lowest band (sea).
    if (!(elevation >= 0)) elevation = 0;
    for (let i = 0; i < this.biomeList.length; i++) {
      const biome = this.biomeList[i];
      if (elevation >= biome.minElevation && elevation < biome.maxElevation) {
        return biome;
      }
    }
    return this.biomeList[this.biomeList.length - 1];
  }
  

  getBiomeAt(x, y) {
    const col = (x * this.invScale) | 0;
    const row = (y * this.invScale) | 0;
    if (col < 0 || row < 0 || col >= this.gridCols || row >= this.gridRows) {
      return this._fallbackBiome;
    }
    return this.biomeArray[this.biomeIndexMap[row * this.gridCols + col]];
  }
  
  getEffectiveBiomeAt(x, y) {
    if (this._snowBiome) {
      const elevation = this.getElevationAt(x, y);
      if (this.isSeasonalSnow(elevation)) return this._snowBiome;
    }
    return this.getBiomeAt(x, y);
  }
  
  isWalkable(x, y) {
    // Two water tests, same reasoning as Simulation.cullSubmergedPlants(): animals walk
    // the PAINTED ground, not the coarse sim grid. The biome grid catches sea and ice —
    // but the RIVER (and its tributaries) rides THROUGH the walkable lowland at grassland
    // elevation, so it is not in the biome grid as water and animals used to path straight
    // onto it. waterTypeAt (paint resolution: 0 land · 1 sea · 2 river) is the authoritative
    // "is this pixel water", and it also fixes the coast-margin cells where the two
    // classifications disagree. Returns 0 before the first bake, so this is a no-op until
    // the ground is painted (biome test still applies).
    if (!this.getEffectiveBiomeAt(x, y).walkable) return false;
    return this.waterTypeAt(x, y) === 0;
  }
  
  canPlace(x, y) {
    if (!this.isInBounds(x, y)) return false;
    return this.getEffectiveBiomeAt(x, y).canPlace;
  }
  
  _getCachedColor(hexColor) {
    let c = this._colorCache.get(hexColor);
    if (!c) {
      c = color(hexColor);
      this._colorCache.set(hexColor, c);
    }
    return c;
  }
  
  getColor(elevation, biome) {
    const colors = biome.colors;
    const range = biome.maxElevation - biome.minElevation;
    const position = (elevation - biome.minElevation) / range;
    const clampedPos = Math.max(0, Math.min(1, position));

    // Cel look: snap to the nearest authored ramp stop → 2-3 flat tones per biome
    // instead of a smooth gradient (md/TEMANAWA_34VIEW_PLAN.md §7).
    if (LOOK.posterize) {
      return this._getCachedColor(colors[Math.round(clampedPos * (colors.length - 1))]);
    }

    const colorIndex = clampedPos * (colors.length - 1);
    const lowerIndex = colorIndex | 0;
    const upperIndex = Math.min(lowerIndex + 1, colors.length - 1);
    const t = colorIndex - lowerIndex;
    
    if (t < 0.01) return this._getCachedColor(colors[lowerIndex]);
    if (t > 0.99) return this._getCachedColor(colors[upperIndex]);
    
    return lerpColor(
      this._getCachedColor(colors[lowerIndex]),
      this._getCachedColor(colors[upperIndex]),
      t
    );
  }
  
  hasAdjacentWater(row, col) {
    if (!this._waterBiome) return false;
    const gridCols = this.gridCols;
    const gridRows = this.gridRows;
    const waterMax = this._waterBiome.maxElevation;
    
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < gridRows && nc >= 0 && nc < gridCols) {
          if (this.heightMap[nr * gridCols + nc] < waterMax) return true;
        }
      }
    }
    return false;
  }
  
  // ============================================
  // GENERATION
  // ============================================
  
  generate() {
    // Refresh the view zoom-out factor from config first — before the base-noise loop and
    // _prepGeo below both read it — so a live GEN.viewAreaGain edit + G re-bake takes effect.
    this._viewGain = (this.config.viewAreaGain > 0) ? this.config.viewAreaGain : 1;
    this._viewF = Math.sqrt(this._viewGain);

    // A full (re)generate supersedes any in-flight incremental morph: the job's
    // partial paint state is about to be rebuilt from scratch anyway. Its
    // half-painted back buffer goes back to the pool (or is freed) — not dropped.
    if (this._morphJob) {
      const st = this._morphJob.st;
      if (st && st.buf) this._releaseBakeBuffer(st.buf);
      this._morphJob = null;
    }

    const gridCols = this.gridCols;
    const gridRows = this.gridRows;
    const totalCells = gridCols * gridRows;
    const scale = this.scale;
    
    this.heightMap = new Float32Array(totalCells);
    this.biomeIndexMap = new Uint8Array(totalCells);

    // Base elevation field: seed-dependent noise + coastal falloff, INDEPENDENT of
    // deep time. Cached so morphTo() can reshape the land without re-running noise.
    if (!this._baseNoise || this._baseNoise.length !== totalCells) {
      this._baseNoise = new Float32Array(totalCells);
    }
    let idx = 0;
    for (let row = 0; row < gridRows; row++) {
      const y = row * scale;
      for (let col = 0; col < gridCols; col++) {
        this._baseNoise[idx] = this.getElevation(col * scale, y);
        idx++;
      }
    }
    this._smoothCoast(this._baseNoise, gridCols, gridRows);

    // Deep-time factors for the CURRENT yearsBP (ranges grow, gorge incises), then
    // reshape the base field with the geography skeleton and classify biomes.
    this._geoT = TerrainGenerator.geoTimeFactors(
      (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : null);
    this._geoT.glacialSea = TerrainGenerator.glacialSeaShift(   // fast eustatic ripple (Climate), onto the tectonic factors
      (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : null);
    this._geoT.estuary = TerrainGenerator.estuaryStrength(      // drowned-valley highstand (interglacial)
      (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : null);
    if (this._geoUpliftOverride != null) this._geoT.uplift = this._geoUpliftOverride;   // GEO.uplift() authoring preview
    this._prepGeo();
    this._buildGeoCache();
    this._applyGeoToHeightMap();
    this._rebuildBiomeMap();
    
    this._initSnowColors();
    
    // Build the high-resolution PAINT grid: the continuous elevation sampled at
    // LOOK.bakeScale× the sim grid, with biome, colour, water and edge per fine
    // cell. This is what the season bakes render from, decoupling PAINT resolution
    // from the sim's cell budget so the ground reads as smooth curves, not grid
    // cells. The sim's heightMap/biomeIndexMap (built above) are untouched.
    // md/TEMANAWA_34VIEW_PLAN.md §4.
    this._computePaintGrid();

    // Pre-bake all 4 seasonal buffers
    this._bakeAllSeasonBuffers();
  }

  // ============================================
  // GEOGRAPHY SKELETON (SVG-driven) — md/TEMANAWA_GEOGRAPHY.md
  // The base noise is reshaped by an optional vector skeleton: ranges lift the land
  // toward alpine, the river carves a channel to the water band, both scaling with
  // deep time (ranges grow; the gorge incises AHEAD of the uplift = antecedence).
  // ============================================

  // Dated anchors (yearsBP) for the geological state. The geology is keyed to ABSOLUTE
  // dates, NOT to progress through the DeepTime window — so you can resize the timeline
  // (DeepTime.yearsStart/yearsEnd) or jump yearsBP to any date and the ranges/river read
  // TRUE for that year, with no fast-forward. Move an event in time by editing its dates.
  //   Real geology: axial uplift began ~3 Ma, mostly late Quaternary; the Manawatū Strait
  //   closed to a through-flowing river ~1 Ma, assembling coast-first, continuous by the
  //   mid-Pleistocene; antecedent incision leads the uplift and deepens late.
  // (Defaults reproduce the original 1 Ma → 25.5 ka window look exactly.)
  static get GEO_EPOCHS() {
    return {
      upliftFrom:   1000000, upliftTo:    25000,   // ranges: nascent → mature
      incisionFrom: 1000000, incisionTo:  25000,   // river depth/banks: leads uplift, deepens late
      emergeFrom:   1000000, emergeTo:   500000,   // river: seaward strait → continuous source-to-sea
      straitCloseFrom: 700000, straitCloseTo: 250000,  // strait THINS to normal river width over this span (held full-wide before ~0.7 Ma, a river by ~0.25 Ma)
      straitRetreatFrom: 700000, straitRetreatTo: 500000,  // EAST→WEST strait: the wide water's eastern end draws back to straitReachLate over this span (the source reveal)
      tribEmergeFrom:   400000, tribEmergeTo:  200000,   // tributaries grow from their SOURCES (0.4 Ma) to reach the main channel (0.2 Ma) — no terrain effect before 0.4 Ma
      tribEmergeEarlyFrom: 500000, tribEmergeEarlyTo: 400000,   // EARLY schedule for the eastmost tributary: grows from its source at 0.5 Ma, connected to the main by 0.4 Ma (as the others begin)
      mainArmFrom:      600000, mainArmTo:     250000,   // main stem's NE INLAND arm recedes to land: flow flips inland→seaward at ~0.6 Ma, the arm gone by the narrow-river stage (~0.25 Ma). See LOOK.mainArmKeep.
      // SOUTH-HALF STRAIT (Axis A, a pulse). The southern half of the map subsides into a
      // marine strait — deepest at its peak, then the basin inverts and the land returns as
      // the axial ranges lift. The Tararua range footprint stays a dry peninsula throughout
      // (the N–S land bridge the piece illustrates). Four dates shape the pulse as a trapezoid,
      // so it can be a sharp peak (Full == Hold) or a held strait (Full older than Hold):
      //   From → Full   sink: 0 (normal land) → 1 (fully submerged)
      //   Full … Hold   plateau at full submergence (none by default — Full == Hold)
      //   Hold → To     rise: 1 → 0 (drains back to the normally-generated land)
      // Defaults reproduce the user's brief exactly: sink across 1 Ma → 0.5 Ma (peak at 0.5 Ma),
      // then rise back to normal by 0.3 Ma.
      southSinkFrom: 1000000, southSinkFull: 500000, southSinkHold: 500000, southSinkTo: 300000
    };
  }

  // Deep-time SHAPE factors for an absolute yearsBP. All 0..1; yearsBP null → mature
  // present (1,1,1). Pure — a function of yearsBP + GEO_EPOCHS only, independent of the
  // window, so a date always maps to the same geological state.
  //  · uplift    — range growth. The Ruahine/Tararua axial ranges rose mainly over the LAST
  //                ~1 Ma (rapid uplift commenced c. 1 Ma; Ruahine ~1.3 mm/yr), so this is only
  //                a GENTLE ease-in (pow 1.5) — the ranges climb steadily across the whole
  //                window, not a late-window jump. Onset (upliftFrom) sits at the window open.
  //  · incision  — river DEPTH + bank sharpness; leads uplift (antecedent down-cutting) and accelerates late.
  //  · emergence — the CONNECTION front: at the emergeFrom date the Manawatū is only a
  //                seaward embayment (the strait closing over); the channel assembles from
  //                the coast inland, continuous by emergeTo.
  static geoTimeFactors(yearsBP) {
    if (yearsBP == null) return { uplift: 1, incision: 1, emergence: 1, submergence: 0, southSink: 0, mainArm: 1 };
    const E = TerrainGenerator.GEO_EPOCHS;
    const ramp = (from, to) => {                                    // 0 at/older than `from` → 1 at/younger than `to`
      const t = (from - yearsBP) / ((from - to) || 1);
      return t < 0 ? 0 : t > 1 ? 1 : t;
    };
    const up = ramp(E.upliftFrom, E.upliftTo);
    const inc = ramp(E.incisionFrom, E.incisionTo);
    const emg = ramp(E.emergeFrom, E.emergeTo);
    const sub = 1 - emg;                                            // inverse of the emerge ramp
    const sc = ramp(E.straitCloseFrom, E.straitCloseTo);
    const srr = ramp(E.straitRetreatFrom, E.straitRetreatTo);   // 0 at/older than ~0.7 Ma → 1 at/younger than ~0.5 Ma
    const te = ramp(E.tribEmergeFrom, E.tribEmergeTo);
    const teE = ramp(E.tribEmergeEarlyFrom, E.tribEmergeEarlyTo);   // eastmost tributary: earlier schedule
    const ma = ramp(E.mainArmFrom, E.mainArmTo);                 // main NE arm recession: 0 at ~0.6 Ma → 1 by ~0.25 Ma
    // SOUTH-HALF STRAIT pulse: rise (sink) 1 Ma → ~0.5 Ma, fall (drain) ~0.5 Ma → ~0.3 Ma.
    const ssU = ramp(E.southSinkFrom, E.southSinkFull);         // 0 at 1 Ma → 1 by the full-submergence date
    const ssD = ramp(E.southSinkHold, E.southSinkTo);           // 0 until the hold date → 1 once risen back
    const ssUp = ssU * ssU * (3 - 2 * ssU);                     // smoothstep each leg so the shore eases, not jumps
    const ssDn = ssD * ssD * (3 - 2 * ssD);
    return {
      uplift:    Math.pow(up, 1.5),                                 // gentle ease-in: axial ranges rise across ~the whole last 1 Ma (steady late-Quaternary uplift), not a late-window jump
      incision:  Math.min(1, 0.2 + 0.8 * Math.pow(inc, 1.2)),       // leads uplift, accelerates late
      emergence: emg * emg * (3 - 2 * emg),                         // smoothstep connection front (coast → source)
      // MARINE EMERGENCE (Axis A): shallow-sea basin at 1 Ma → land by ~emergeTo. Smoothstep
      // 1 → 0 over the same epoch; scaled by LOOK.seaRise in _combineGeo to lower the ground
      // (raise the sea) early. Distinct from the fast glacio-eustatic ripple in Climate.seaLevel.
      submergence: sub * sub * (3 - 2 * sub),
      // STRAIT → RIVER: 1 at the old wide strait (1 Ma), 0 when closed to normal river width.
      // Scales the main stem's effective width via LOOK.straitWidthMult.
      straitFactor: 1 - sc * sc * (3 - 2 * sc),
      // TRIBUTARY emergence: 0 at tribEmergeFrom (0.4 Ma) → 1 at tribEmergeTo (0.2 Ma). Drives
      // the growth front in _combineGeo/classify/paint: at 0 the tributary is ENTIRELY absent
      // (no source nub — the land isn't affected yet), then it extends from its source (wPos 0)
      // to the confluence (wPos 1) over this ramp. Direction is normalised in _prepGeo so this
      // holds however the polyline was drawn.
      tribEmergence: te * te * (3 - 2 * te),
      // EARLY tributary emergence (the eastmost tributary, flagged rv.early in _prepGeo): same growth
      // front, but grown 0.5→0.4 Ma instead of 0.4→0.2 Ma. Per-cell selection via the cache's wTribEarly.
      tribEmergenceEarly: teE * teE * (3 - 2 * teE),
      // EAST→WEST STRAIT RETREAT: 0 while the seaway still reaches across (≥~0.7 Ma) → 1 once it
      // has pulled back to its held western reach (≤~0.5 Ma). Drives the reach lerp in the combine
      // caller (LOOK.straitReachEarly→straitReachLate); smoothstepped so the shoreline eases, not jumps.
      straitRetreat: srr * srr * (3 - 2 * srr),
      // SOUTH-HALF STRAIT (Axis A): 0 (dry) at 1 Ma → 1 (fully submerged) at ~0.5 Ma → 0 (land back)
      // by ~0.3 Ma. Scales the positional south-latitude mask in _combineGeo (via _southStrength),
      // with the Tararua range subtracted out so it stays a dry peninsula. See GEO_EPOCHS.southSink*.
      southSink: ssUp * (1 - ssDn),
      // MAIN NE-ARM RECESSION (Axis, positional in downstream wPos): 0 (full inland arm, flowing
      // inland) at ~0.6 Ma → 1 (the NE reach beyond LOOK.mainArmKeep dried to land, river flowing
      // seaward) by ~0.25 Ma. Drives _mainArmPresence in the carve + paint, and the flow flip in the
      // water overlay (reversed once mainArm > 0). Smoothstepped so the arm eases back, not jumps.
      mainArm: ma * ma * (3 - 2 * ma)
    };
  }

  // GLACIAL EUSTATIC sea shift for a morph year: a SIGNED coastal elevation offset from the
  // glacial index (Climate.seaLevel's driver). + when colder than present (glacial lowstand →
  // the shelf emerges, coast marches seaward) and − when warmer (highstand → the sea creeps in).
  // Reads Climate + LOOK, so it is NOT pure like geoTimeFactors — it is assigned onto _geoT where
  // the morph year is known, then read per cell in _applyGeoToHeightMap. 0 when disabled/unavailable.
  static glacialSeaShift(yearsBP) {
    if (yearsBP == null || typeof Climate === 'undefined') return 0;
    const amp = (typeof LOOK !== 'undefined' && LOOK.glacialSeaAmp != null) ? LOOK.glacialSeaAmp : 0;
    if (!(amp > 0)) return 0;
    const mid = (typeof LOOK !== 'undefined' && LOOK.glacialSeaMid != null) ? LOOK.glacialSeaMid : 0.05;
    const g = Climate.at(yearsBP).glacialIndex;
    return amp * (g - mid);   // colder than mid ⇒ + (expose land); warmer ⇒ − (flood coast)
  }

  // DROWNED-VALLEY ESTUARY strength (0..1) for a morph year: 1 at a peak interglacial highstand
  // (glacial index 0), easing to 0 by estuaryOnsetG — so the estuary fills the river valley in warm
  // spells and drains in the cold. Reads Climate + LOOK; assigned onto _geoT where the year is known.
  static estuaryStrength(yearsBP) {
    if (yearsBP == null || typeof Climate === 'undefined') return 0;
    const onset = (typeof LOOK !== 'undefined' && LOOK.estuaryOnsetG != null) ? LOOK.estuaryOnsetG : 0;
    if (!(onset > 0)) return 0;
    let h = (onset - Climate.at(yearsBP).glacialIndex) / onset;   // 1 at g=0 → 0 at g≥onset
    return h < 0 ? 0 : h > 1 ? 1 : h;
  }

  // Combine the geo field for one cell with the deep-time factors. Pure/static so
  // the cached morph path and the direct _applyGeo share it (no divergence), and
  // tools/bootcheck.js can assert it.
  static _combineGeo(e, rMask, rH, ridge, detail, wMask, wDepth, uplift, incision, relief, incise, sea, wPos, emergence, seaLift, floodCeil, rangeGain, rangeCeil, swSub, southSub, seaFloor, wMaskM, wDepthM, patchSub, glacialSea, glacialSeaCeil, floodFlat) {
    const e0 = e;                                  // pre-range LOCAL ground — the level the river follows
    if (rMask > 0 && uplift > 0 && rH > 0) {
      // RANGES scale the EXISTING ground instead of replacing it with a crest template.
      // A gain — ramping with time (uplift) and range-mass (rMask), carved by ridge noise
      // (relief) — MULTIPLIES the base elevation, so the plains' own spurs and valleys grow
      // up into the mountains rather than a smooth triangular tent. A soft ceiling then eases
      // the result toward the per-cell crest rH, so peaks approach — but never overshoot — the
      // authored range height (keeping the snow line meaningful). rH carries the spine falloff.
      const gain  = (rangeGain != null) ? rangeGain : 2.2;
      const ceilK = (rangeCeil != null) ? rangeCeil : 0.45;
      const carve = 1 - relief * (1 - ridge);      // 1 on ridge crests → deeper valleys as relief↑
      const amp   = gain * uplift * rMask * carve; // 0 at rest → full at a mature range core
      let lifted  = e * (1 + amp) + detail * rMask * uplift;
      const knee = rH * ceilK, head = rH - knee;   // soft-ceiling: approach rH, never blow past it
      if (head > 0 && lifted > knee) lifted = rH - head * Math.exp(-(lifted - knee) / head);
      if (lifted > e) e = lifted;                  // ranges only ever lift, never dig below the base
    }
    if (wMask > 0 || wMaskM > 0) {
      // Emergence: the channel connects from the coast (wPos 0) inland (wPos 1) as the
      // drainage assembles — at ~1.1 Ma only a seaward embayment reads as water and the
      // upstream is still land (the Manawatū Strait closing over), continuous by mid-window.
      // `conn` is the connection front; `incision` then deepens/sharpens the incised channel.
      const FEATHER = 0.15;                        // soft width of the advancing front, in downstream units
      // Growth front. emergence 0 → OFF everywhere (even wPos 0, the source): a tributary that
      // hasn't emerged yet leaves the land untouched — no persistent source nub. As emergence
      // ramps 0→1 the front sweeps from the source (wPos 0) to past the confluence (wPos 1), so
      // the channel grows source→main and is fully connected by emergence 1. Mains pass
      // emergence 1.0, so this is >=1 for all wPos ≤ 1 — identical to the old formula for them.
      let conn = (emergence * (1 + FEATHER) - wPos) / FEATHER;
      if (conn < 0) conn = 0; else if (conn > 1) conn = 1;
      conn = conn * conn * (3 - 2 * conn);
      // Bed strength for the SELECTED river, plus an optional MAIN-stem fallback (wMaskM). Where a
      // gated/thinned tributary OWNS this cell (nearest by margin) but the cell also sits inside the
      // wide main channel, the tributary's own carve may be off (conn 0, pre-emergence) or shallow —
      // leaving the cell standing proud of the carved main valley beside it, which the 3/4 relief bake
      // paints as a fault-line "seam". The main is always fully connected (emergence 1 → conn 1), so
      // bridge with its bed and take whichever carves DEEPER. This keeps the HEIGHT in step with the
      // water/bank PAINT, which already bridges the same seam (the wMDist fallback in
      // _rebuildBiomeMap / _paintGridPass1). wMaskM 0 (mains, and the harness's short call) = old path.
      let bed = (wMask > 0) ? Math.min(1, wMask * (1.35 + 0.35 * incision)) * conn : 0;
      let bedDepth = wDepth;
      if (wMaskM > 0) {
        const bedM = Math.min(1, wMaskM * (1.35 + 0.35 * incision));   // main stem: conn = 1
        if (bedM > bed) { bed = bedM; bedDepth = wDepthM; }             // deeper carve wins; use its incision depth
      }
      if (bed > 0) {
        // Bed rides the LOCAL ground: it sits `incise` (deepening with time) below the
        // pre-range ground, and only sinks to the sea band where the land is already near
        // it — the coast. The gorge's DEPTH comes from the flanking ranges rising around
        // this channel (antecedence), so a cell crossing the water drops at most ~incise.
        let surf = e0 - incise * bedDepth * (0.4 + 0.6 * incision);
        if (surf < sea) surf = sea;
        if (surf < e) e += (surf - e) * bed;       // only ever lower — cut through any range lift
      }
    }
    // MARINE EMERGENCE (Axis A): water RISING into the basin, not the ground sinking.
    // A uniform `e -= seaLift` drowned the whole map at 1 Ma — with the real p5 noise
    // distribution nearly all land sits below ~0.47, so subtracting 0.2 flat left a
    // grey, featureless flood (the "grey screen"). Instead the lowering attenuates
    // with elevation: full near the shore, fading to NOTHING by floodCeil
    // (LOOK.seaFloodCeil) — the low basin floods, the eastern uplands stay dry land.
    // Only ever lowers — never raises. Guarded so a caller that omits it
    // (older/harness paths) is a clean no-op.
    if (seaLift > 0) {
      const fc = (floodCeil > 0) ? floodCeil : 0.42;
      if (e < fc) {
        const f = 1 - e / fc;
        e -= seaLift * f * f * (3 - 2 * f);
        // FLOOD FLATTEN: the subtraction above lowers the basin but PRESERVES the base-noise
        // relief, so a deeply-drowned floor keeps its bumps and reads as scattered shallow
        // speckle / a shattered coast as it emerges. Pull the drowned ground toward the same
        // mottled sea floor the straits use, by an amount that grows with flood strength
        // (floodFlat = submergence·LOOK.seaFloodFlatten, from the caller) and with how far the
        // cell sits BELOW the sea/water band — so the open basin flattens to coherent water
        // while the immediate waterline (small depth) keeps its emerging-sandbar texture. Only
        // ever lowers; a caller that omits it (harness/older paths) passes undefined → no-op.
        if (floodFlat > 0) {
          const sfl = (seaFloor > 0) ? seaFloor : 0.04;
          const band = 0.12;                       // sea/water band top
          if (e < band && e > sfl) {
            let d = (band - e) / band;             // 0 at the waterline → 1 at the floor
            let pull = floodFlat * d * d;          // quadratic: gentle near shore, strong deep
            if (pull > 1) pull = 1;
            e += (sfl - e) * pull;
          }
        }
      }
    }
    // SW MARINE STRAIT (Axis A, positional). Distinct from the elevation-attenuated seaLift
    // above: this drowns the lower-LEFT quadrant (the Whanganui basin, SW of the river)
    // REGARDLESS of its generated elevation, so at ~1 Ma it reads as open sea — the strait.
    // `swSub` (spatial SW mask × temporal submergence, from the caller) blends the ground
    // into the sea band and eases back to 0 by ~0.5 Ma, so the quadrant fills out into the
    // normally-generated terrain. Only ever lowers. Guarded so callers omitting it no-op.
    // Drown TARGET: a per-cell mottled sea floor (from the caller, via the cached wobble field) so
    // the submerged ground reads as varied open water like the shelf sea around it, NOT a dead-flat
    // uniform slab. Clear of the sea/coast band (0.10) and the classify wobble so it stays sea; a
    // caller that omits it (harness/older paths) falls back to the old flat 0.04.
    const sf = (seaFloor > 0) ? seaFloor : 0.04;
    if (swSub > 0) {
      if (e > sf) e += (sf - e) * swSub;
    }
    // SOUTH-HALF STRAIT (Axis A, positional in v). The SOUTHERN half subsides into a marine
    // strait over deep time (t.southSink pulse), so at its peak the low southern ground reads as
    // open sea REGARDLESS of its generated elevation. `southSub` (south-latitude mask × the pulse
    // × (1 − Tararua range protection), from the caller) blends the ground into the sea band with
    // a wide, gradual shore — no sharp drop-off — and the protected Tararua footprint stays a dry
    // peninsula (the N–S land bridge). Only ever lowers. Guarded so callers omitting it no-op.
    if (southSub > 0) {
      if (e > sf) e += (sf - e) * southSub;         // same mottled sea floor as the SW strait
    }
    // LOCALIZED SUBMERGENCE PATCH (Axis A, positional). A single elliptical spot drowned toward
    // the same mottled sea floor as the straits above, on the emergence clock (LOOK.patchSub*).
    // Fills a place the SW diagonal front only half-covers. Only ever lowers; a caller omitting it
    // (harness/older paths) passes undefined → no-op.
    if (patchSub > 0) {
      if (e > sf) e += (sf - e) * patchSub;
    }
    // GLACIAL EUSTATIC sea (fast ripple, SIGNED). Unlike every term above it can RAISE as well as
    // lower: a glacial lowstand (glacialSea > 0) lifts the low western shelf so it emerges as land
    // and the coast marches seaward; an interglacial highstand (glacialSea < 0) sinks it so the sea
    // creeps inland. `glacialSea` arrives already WEST-gated from the caller; here it is attenuated
    // by elevation — full at the waterline, fading to 0 by glacialSeaCeil — so only the coastal
    // shelf/plain moves and the ranges never do. Composes additively on top of the tectonic terms.
    if (glacialSea !== 0 && glacialSea != null) {
      const gc = (glacialSeaCeil > 0) ? glacialSeaCeil : 0.30;
      if (e < gc) {
        const f = 1 - e / gc;                          // 1 at sea level → 0 at the ceiling
        e += glacialSea * f * f * (3 - 2 * f);
      }
    }
    return e < 0 ? 0 : e > 1 ? 1 : e;
  }

  // Positional SW submergence strength for a cell: the spatial SW mask (1 in the lower-left,
  // easing to 0 past a NE-ward diagonal front) × the temporal submergence (1 at ~1 Ma → 0 by
  // emergeTo). Pure/static so the cached and harness paths share it and bootcheck can assert.
  static _swStrength(u, v, sub, reach, feather) {
    if (!(sub > 0)) return 0;
    const dsw = u + (1 - v);                        // 0 at the SW corner (u=0,v=1) → 2 at the NE
    let sp = (reach - dsw) / (feather > 0 ? feather : 1e-6);
    sp = sp < 0 ? 0 : sp > 1 ? 1 : sp;
    return sp * sp * (3 - 2 * sp) * sub;
  }

  // SOUTH-HALF submergence strength for a cell: a smooth south-ward latitude ramp — 0 north of
  // `lat`, easing to 1 by `lat + feather` (a WIDE band, so the strait's north shore is a gradual
  // slope, never a sharp drop-off) — × the temporal pulse `sink` (0 at 1 Ma → 1 at ~0.5 Ma → 0 by
  // ~0.3 Ma). The caller then multiplies in the Tararua range protection. v is the vertical
  // fraction (0 = north edge, 1 = south edge). Pure/static so the cached, on-the-fly and harness
  // paths share it and tools/bootcheck.js can assert against it.
  static _southStrength(v, sink, lat, feather) {
    if (!(sink > 0)) return 0;
    let sp = (v - lat) / (feather > 0 ? feather : 1e-6);
    sp = sp < 0 ? 0 : sp > 1 ? 1 : sp;
    return sp * sp * (3 - 2 * sp) * sink;
  }

  // EAST→WEST fill factor for the south-half strait (0..1): 1 west of the taper, easing to 0 by
  // `eastU` (screen-X fraction). Multiplied into southSub so the south strait FADES toward the
  // east — the eastern / Tararua side emerges first and the southern land fills WESTWARD as the
  // pulse drains, instead of a uniform latitude band whose north shore lifts all at once (which
  // read as a jarring "rising bank" in the SE). eastU ≤ 0 disables it (a clean no-op → the old
  // full-width band). Pure/static so the cached and on-the-fly paths share it.
  static _southEastFade(u, eastU, feather) {
    if (!(eastU > 0)) return 1;
    const start = eastU - (feather > 0 ? feather : 1e-6);
    if (u <= start) return 1;
    let t = (u - start) / (eastU - start);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return 1 - t * t * (3 - 2 * t);
  }

  // LOCALIZED submergence strength for a cell: an elliptical mask centred at (cx,cy) with radii
  // (rx,ry) — full (1) inside the core, smoothstepping to 0 across a taper beyond it — × the temporal
  // submergence (1 at ~1 Ma → 0 by emergeTo). The taper width is DIRECTIONAL: `featherE` toward the
  // east (increasing u, where the patch runs uphill into the coast — a wide grade avoids a cliff),
  // blended smoothly to `feather` at N/S/W by the eastward cosine so there is no seam. featherE null/
  // ≤0 falls back to feather (a plain symmetric ellipse — the harness's 8-arg call). rx/ry ≤ 0 or a 0
  // pulse disables it (a clean no-op — the harness never sets submergence in its manual _geoT probes).
  // Pure/static so the cached, on-the-fly and harness paths share it and bootcheck can assert.
  static _patchStrength(u, v, sub, cx, cy, rx, ry, feather, featherE) {
    if (!(sub > 0) || !(rx > 0) || !(ry > 0)) return 0;
    const nx = (u - cx) / rx, ny = (v - cy) / ry;
    const r = Math.sqrt(nx * nx + ny * ny);        // 0 at the centre, 1 at the core edge
    if (r === 0) return sub;                        // dead centre — fully drowned, and avoids nx/r = 0/0
    const fW = feather > 0 ? feather : 1e-6;
    const fE = (featherE != null && featherE > fW) ? featherE : fW;
    let eastness = nx / r;                          // cos of the angle from +u (east); ∈ [-1,1]
    if (eastness < 0) eastness = 0;                 // bias only the east side
    const ft = fW + (fE - fW) * eastness * eastness;
    let sp = (1 + ft - r) / ft;                     // 1 inside the core → 0 by r = 1 + ft
    sp = sp < 0 ? 0 : sp > 1 ? 1 : sp;
    return sp * sp * (3 - 2 * sp) * sub;
  }

  // EAST→WEST STRAIT — the seaway's current eastward REACH (screen-X fraction from the west).
  // retreat (t.straitRetreat) is 0 while it still reaches across (≥~0.7 Ma) → 1 once pulled back
  // (≤~0.5 Ma), so reach eases from straitReachEarly to straitReachLate, then holds. Pure/static.
  static _straitReach(retreat) {
    const rE = (typeof LOOK !== 'undefined' && LOOK.straitReachEarly != null) ? LOOK.straitReachEarly : 1.0;
    const rL = (typeof LOOK !== 'undefined' && LOOK.straitReachLate != null) ? LOOK.straitReachLate : 0.70;
    const rt = (retreat > 0) ? (retreat > 1 ? 1 : retreat) : 0;
    return rL + (rE - rL) * (1 - rt);
  }

  // EAST→WEST STRAIT — how WIDE the main stem is at column-fraction u: 1 (full strait width) west
  // of the retreating front, smoothstepping to 0 (narrow river — the revealed NE source) at and
  // east of the front (u = reach). `retreat` is t.straitRetreat: null/undefined means present-day/
  // mature factors with no retreat in play (geoTimeFactors(null), and the harness's isolated
  // shaping context) → treat as fully retreated (held western reach), so the pure uplift/incision
  // tests are unaffected. Pure/static so the cached, on-the-fly and harness paths never diverge.
  static _straitWideMask(u, retreat, feather) {
    const reach = TerrainGenerator._straitReach(retreat == null ? 1 : retreat);
    if (u >= reach) return 0;
    let m = (feather > 0) ? (reach - u) / feather : 1;
    if (m > 1) m = 1;
    return m * m * (3 - 2 * m);
  }

  // EAST→WEST STRAIT — the main stem's combined open-water factor at column-fraction u (0 = a
  // narrow river, 1 = the full straitWidthMult strait). Two things close the strait, and BOTH
  // apply: `straitFactor` THINS it uniformly over time (the old behaviour — it "narrows like it
  // used to", straitClose* dates), and the retreat mask draws its EASTERN end back to the west
  // (revealing the NE source, straitReach*/straitRetreat* dates). 0 when the temporal factor is
  // absent (present/mature, harness) so the isolated shaping tests see the plain river. Pure/static.
  static _straitWide(u, straitFactor, retreat, feather) {
    const sf = (straitFactor > 0) ? straitFactor : 0;
    if (sf === 0) return 0;
    return sf * TerrainGenerator._straitWideMask(u, retreat, feather);
  }

  // N/S edge falloff: within `margin` of the top/bottom edge, ease high terrain DOWN to
  // plains (~0.22). The 3/4 relief bake paints the far row's side-face and the front
  // row's apron to the buffer edge, so a range truncated at the map edge (our ranges'
  // polys run off-frame to v<0 and v>1) smears vertically. Bringing the edge rows down
  // to plains gives those rows nothing tall to smear. Only ever lowers — plains and the
  // carved river channel pass through untouched. Pure/static; a 0 margin disables that edge.
  //
  // ASYMMETRIC: `topMargin` (v→0, the far edge) can differ from `margin` (v→1, the near/front
  // apron). A THIN top margin lets the north up-ramp fill the far edge with real elevated terrain
  // instead of a wide flat plains band, while the front still eases for the reliefCropBottom. A
  // 3-arg call keeps the old symmetric behaviour (topMargin defaults to margin), so the harness
  // and any other caller are unaffected.
  static _nsEdgeFalloff(e, v, margin, topMargin) {
    const bm = (margin > 0) ? margin : 0;
    const tm = (topMargin != null) ? (topMargin > 0 ? topMargin : 0) : bm;
    let out = e;
    // TOP (far) edge: ease TWO-WAY toward plains — raise a LOW far row UP so it meets the relief
    // crop (no empty-headroom streak) and lower a truncated range DOWN (no vertical smear). Safe
    // to raise here: no river reaches the north edge. This is what fills the far edge cleanly.
    if (tm > 0 && v < tm) {
      const f0 = 1 - v / tm, f = f0 * f0 * (3 - 2 * f0);
      out += (0.22 - out) * f;
    }
    // NEAR (bottom/front) edge: ease DOWN only — never raise the carved river channel / coast here.
    if (bm > 0) {
      const d = 1 - v;
      if (d < bm) {
        const f0 = 1 - d / bm, f = f0 * f0 * (3 - 2 * f0);
        const target = out < 0.22 ? out : 0.22;
        out += (target - out) * f;
      }
    }
    return out;
  }

  // NORTH UP-RAMP: extra elevation for the top `frac` of the SCREEN, smoothstepping from `amt` at
  // the very top edge (gridNy 0) to 0 at gridNy = frac. Fills the far edge with real, slightly
  // higher terrain (paired with a thin _geoTopMargin) instead of an eased-plains smear. Pure/static
  // (gridNy is screen-space, captured before the view remap) so bootcheck can assert the shape.
  static _northLift(gridNy, frac, amt, base) {
    if (!(amt > 0) || !(frac > 0) || gridNy >= frac) return 0;
    const tt = 1 - gridNy / frac;
    let lift = amt * tt * tt * (3 - 2 * tt);
    // Never manufacture raised land over the SEA/COAST at the far edge: fade the lift out for
    // low base ground (below the lowland). Without this, the top edge lifted the north-west
    // shoreline into a step the thin top-margin ease can't flatten, which the 3/4 relief bake
    // painted as a vertical smear at the top-left. Ranges/plains (base ≥ ~0.20) get the full
    // lift. A 3-arg call (base omitted, e.g. the harness) keeps the old unconditional behaviour.
    if (base != null && base < 0.20) lift *= (base > 0 ? base / 0.20 : 0);
    return lift;
  }

  // EAST DOWN-RAMP: lower the right `frac` of the SCREEN by up to `amt`, max at the east edge
  // (gridNx → 1) easing to 0 at (1 − frac) inland — the flank where the ranges grade off toward
  // the eastern Manawatū lowland. Mirror of _northLift on the x axis; the caller SUBTRACTS it.
  // Pure/static.
  static _eastLower(gridNx, frac, amt) {
    if (!(amt > 0) || !(frac > 0) || gridNx <= 1 - frac) return 0;
    const tt = (gridNx - (1 - frac)) / frac;   // 0 at the inland edge of the ramp → 1 at the east edge
    return amt * tt * tt * (3 - 2 * tt);
  }

  // COASTAL DUNE tint intensity (0..1) for a paint cell at screen fractions (nx, ny) and
  // elevation e — the Manawatū transgressive dunefield (TEMANAWA_ECOLOGY_COAST.md §1,§10).
  // A sand belt just inland of the present western shoreline (shoreX = coastX + coastXS·ny,
  // the same present-coast line getIslandFalloff uses), densest at the coast and thinning
  // inland toward the ESE to 0 at `reach` (an inland screen-X fraction that GROWS with the
  // glacial index — the Koputaroa surge — and is capped short of the range spine, so the
  // belt can never cross east onto the trans-range land). Windowed to the coastal-plain
  // elevation band [elevLo, elevHi] so it stays off the water/wet slack and off the range
  // flanks. Pure + p5-free so tools/bootcheck.js can assert placement (west-only, capped).
  static _duneIntensity(nx, ny, e, coastX, coastXS, reach, off, elevLo, elevHi) {
    if (!(reach > 0) || e <= elevLo || e >= elevHi) return 0;
    const shoreX = coastX + coastXS * ny;        // present shoreline at this latitude
    const inland = nx - shoreX;                   // 0 at the shore, + inland (east)
    const span = reach - off;
    if (inland <= off || span <= 0) return 0;
    let t = (inland - off) / span;                // 0 at the foredune toe → 1 at the reach
    if (t >= 1) return 0;
    let a = 1 - t;                                // densest near the coast, thinning inland
    a = a * a * (3 - 2 * a);                       // smooth inland tail
    // Coastal-plain elevation window: fade in off the wet beach, out onto the range flank.
    const mid = (elevLo + elevHi) * 0.5;
    let ew = e < mid ? (e - elevLo) / (mid - elevLo) : (elevHi - e) / (elevHi - mid);
    if (ew < 0) ew = 0; else if (ew > 1) ew = 1;
    ew = ew * ew * (3 - 2 * ew);
    return a * ew;
  }

  // COASTAL DUNE ridge pattern (0..1) — the wind-aligned sand corrugation. The fixed NW wind
  // blows NW→SE (TEMANAWA_ECOLOGY_COAST.md §1), so the parabolic-dune STREAKS run along that
  // axis: lines of constant b=(u−v) run from the top-left (NW) to the bottom-right (SE), and
  // the corrugation varies ACROSS them — bright/dark sand streaks pointing inland. A low-freq
  // amplitude wander keeps them from reading as a uniform sine grid. Pure (sines only) so it is
  // deterministic across the sliced morph and testable in tools/bootcheck.js.
  static _duneRidge(u, v, freq) {
    const a = u + v, b = u - v;                       // along-/cross-wind (NW→SE)
    const s1 = Math.sin(b * freq + a * 6);            // streaks running along the wind
    const s2 = Math.sin(a * (freq * 0.45));           // transverse breakup (foredune ripple)
    let r = 0.7 * s1 + 0.3 * s2;                       // −1..1
    r *= 0.6 + 0.4 * Math.sin(a * 3.3 + b * 2.1);      // low-freq amplitude wander
    r = 0.5 + 0.5 * r;                                 // → 0..1 ridge height
    return r < 0 ? 0 : r > 1 ? 1 : r;
  }

  // COASTAL DUNE BLOW-OUT mask (0..1) — sparse deflation-hollow locations across the belt. A product
  // of two skewed sines (mostly near 0, occasional crests) thresholded so only the crests read as
  // blow-outs, so the hollows are scattered bowls, not a uniform pitting. Pure/testable, like _duneRidge.
  static _duneBlowout(u, v, freq) {
    const a = u + v, b = u - v;
    let n = 0.5 + 0.5 * Math.sin(a * freq * 0.7 + 1.3) * Math.sin(b * freq * 0.9 - 0.7);
    n *= 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(a * freq * 1.9 + b * freq * 0.5));   // 2nd octave for irregularity
    const t = 0.6;                                     // threshold: only the high patches deflate
    let bo = (n - t) / (1 - t);
    return bo < 0 ? 0 : bo > 1 ? 1 : bo;
  }

  // COASTAL DUNE relief delta (>= 0) to ADD to a coastal-plain cell's elevation: the dune
  // intensity mask (densest at the coast, thinning to 0 at `reach`, windowed to the plain
  // elevation band) times the wind-aligned ridge pattern times the peak amplitude. Called at
  // the GLACIAL (max) reach so the ridges are relict landform that persists across phases.
  static _duneRelief(u, v, e, coastX, coastXS, reach, off, elevLo, elevHi, amp, freq) {
    if (!(amp > 0)) return 0;
    const m = TerrainGenerator._duneIntensity(u, v, e, coastX, coastXS, reach, off, elevLo, elevHi);
    if (m <= 0) return 0;
    return amp * m * TerrainGenerator._duneRidge(u, v, freq);
  }

  // EFFECTIVE dune-colour REACH for a phase, given the live sand SURGE (0..1, the disturbance-driven
  // wind×exposure). Lerps from the authored per-phase reach toward the glacial (relict) reach as the
  // surge rises, so a mismanaged coast / a storm re-mobilises the old belt and the sand creeps inland
  // — but never past the relief, and never below the authored reach (surge 0 ⇒ default look). Pure.
  static _duneEffReach(phaseReach, fullReach, surge, gain) {
    let s = surge * gain;
    if (s < 0) s = 0; else if (s > 1) s = 1;
    const r = phaseReach + (fullReach - phaseReach) * s;
    return r < phaseReach ? phaseReach : r;
  }

  // EFFECTIVE dune blend AMOUNT given the surge: a mobile, mismanaged belt reads as barer sand
  // than a stabilised/vegetated one, so the surge brightens the blend, capped at a full sand blend.
  // surge 0 ⇒ the authored duneMaxAmt (default look preserved). Pure.
  static _duneEffAmt(baseAmt, surge, boost) {
    let s = surge; if (s < 0) s = 0;
    let a = baseAmt * (1 + s * boost);
    return a > 1 ? 1 : a < 0 ? 0 : a;
  }

  // MAIN NE-ARM RECESSION presence multiplier (0..1) for a main-stem cell at downstream position
  // `wPos` (0 = SW mouth, 1 = NE source). 1 = channel fully present; multiply the main's water/carve
  // mask by it so the inland (high-wPos) reach fades to LAND as `mainArm` (deep time) ramps 0→1.
  // Below `keep` the seaward river always survives; above keep+feather it dries fully at mainArm 1.
  // Pure/static (a function of wPos + the time factor only) so the cached, on-the-fly and harness
  // paths never diverge and tools/bootcheck.js can assert the shape.
  static _mainArmPresence(wPos, mainArm, keep, feather) {
    if (!(mainArm > 0) || wPos <= keep) return 1;
    const span = (feather > 0) ? feather : 1e-6;
    let t = (wPos - keep) / span;
    if (t > 1) t = 1;
    t = t * t * (3 - 2 * t);
    return 1 - mainArm * t;
  }

  // Should the morph driver re-bake now? True once yearsBP has drifted past the
  // interval AND the real-time throttle has elapsed. Pure/static.
  static shouldMorphBake(yearsBP, bakedYearsBP, nowMs, lastMs, intervalYears, minMs) {
    return Math.abs(yearsBP - bakedYearsBP) >= intervalYears && (nowMs - lastMs) >= minMs;
  }

  // Precompute the time-INDEPENDENT geo field per cell (range mass + which range's
  // height, ridge/detail noise, river mask + depth) once per footprint. morphTo()
  // then only re-applies the deep-time factors over this — no distance/noise recompute.
  _buildGeoCache() {
    if (!this.geo || (this._geoRanges.length === 0 && this._geoRivers.length === 0)) { this._geoCache = null; return; }
    const gc = this.gridCols, gr = this.gridRows, n = gc * gr, scale = this.scale;
    const invc = 1 / gc, invr = 1 / gr;
    const rMask = new Float32Array(n), rH = new Float32Array(n), ridge = new Float32Array(n),
          detail = new Float32Array(n), wDist = new Float32Array(n), wBaseW = new Float32Array(n),
          wDepth = new Float32Array(n), wPos = new Float32Array(n);
    const wType = new Uint8Array(n);
    const wTribEarly = new Uint8Array(n);   // 1 where the owning tributary is on the EARLY emergence schedule
    // Second candidate: the nearest MAIN-stem river, regardless of which river won
    // the margin. Where a TRIBUTARY owns a cell but its paint is gated off (not yet
    // emerged / highland-thinned), the classify passes fall back to this so the
    // strait's water/banks aren't cut along the selection seam. ~3 extra MB at sim res.
    const wMDist = new Float32Array(n), wMBaseW = new Float32Array(n), wMPos = new Float32Array(n), wMDepth = new Float32Array(n);
    // Default wDist to Infinity so cells with no nearby river have no influence.
    wDist.fill(1e6);
    wMDist.fill(1e6);
    const R = this._geoRanges, Rv = this._geoRivers;
    const spine = (typeof LOOK !== 'undefined' && LOOK.rangeSpine != null) ? LOOK.rangeSpine : 0.45;
    const jitter = (typeof LOOK !== 'undefined' && LOOK.riverFrontJitter != null) ? LOOK.riverFrontJitter : 0.07;
    const wob = (typeof LOOK !== 'undefined' && LOOK.riverWobble != null) ? LOOK.riverWobble : 0.02;
    const eAmp = (typeof LOOK !== 'undefined' && LOOK.riverEdgeNoise != null) ? LOOK.riverEdgeNoise : 0;
    const eFreq = (typeof LOOK !== 'undefined' && LOOK.riverEdgeFreq != null) ? LOOK.riverEdgeFreq : 26;
    const ePow = (typeof LOOK !== 'undefined' && LOOK.riverEdgeNoisePow != null) ? LOOK.riverEdgeNoisePow : 2;
    let idx = 0;
    for (let row = 0; row < gr; row++) {
      const v = row * invr, wy = row * scale;
      for (let col = 0; col < gc; col++) {
        const u = col * invc, wx = col * scale;
        let bm = 0, bh = 0, br = null;
        for (let i = 0; i < R.length; i++) { const m = this._rangeMass(R[i], u, v); if (m > bm) { bm = m; bh = R[i].height; br = R[i]; } }
        rMask[idx] = bm;
        rH[idx] = (bm > 0 && br) ? bh * TerrainGenerator._spineHeight(br, u, v, spine) : bh;
        if (bm > 0) { ridge[idx] = this.ridgeNoise(wx, wy); detail[idx] = (this.fractalNoise(wx, wy) - 0.5) * 0.12; }
        // Rivers: find strongest by margin (dist / baseWidth). Stores raw distance
        // so the mask can be recomputed at combine time with a time-varying width
        // (strait → river narrowing). wPos is parametric position along the polyline
        // (0 = first authored point, 1 = last) so tributaries authored source-first
        // emerge correctly.
        let bestMargin = Infinity, bestMainMargin = Infinity;
        for (let i = 0; i < Rv.length; i++) {
          const rv = Rv[i], pts = rv.pts;
          // Distance + parametric position along the polyline (inline to avoid alloc)
          let md = Infinity, cumLen = 0, bestCumLen = 0;
          for (let s = 0; s + 1 < pts.length; s++) {
            const ax = pts[s][0], ay = pts[s][1], bx = pts[s+1][0], by = pts[s+1][1];
            const dx = bx - ax, dy = by - ay, segLen = Math.hypot(dx, dy);
            const sd = TerrainGenerator._distToSeg(u, v, ax, ay, bx, by);
            if (sd < md) {
              md = sd;
              const l2 = dx * dx + dy * dy;
              let t = l2 > 0 ? ((u - ax) * dx + (v - ay) * dy) / l2 : 0;
              if (t < 0) t = 0; else if (t > 1) t = 1;
              bestCumLen = cumLen + t * segLen;
            }
            cumLen += segLen;
          }
          let d = md;
          if (wob > 0) d += (noise(u * 7 + this.seed * 3, v * 7 + this.seed * 4) * 2 - 1) * wob;
          // High-frequency edge noise: rags the waterline so banks don't trace the authored
          // polyline as smooth curves. Cached — free at combine/paint time. Scaled by the
          // channel's width vs the main stem, so a thin tributary gets a proportionally small
          // wobble (a fixed 0.015 amplitude on a 0.02-wide trib shredded it into blocks).
          if (eAmp > 0) d += (noise(u * eFreq + this.seed * 17, v * eFreq + this.seed * 19) * 2 - 1) * eAmp * Math.pow(rv.width / this._mainRiverW, ePow);
          if (d < 0) d = 0;
          const w = rv.width || 0.045;
          const margin = d / w;
          const isTrib = (rv.type === 'tributary');
          if (margin < bestMargin) {
            bestMargin = margin;
            wDist[idx] = d;
            wBaseW[idx] = w;
            wType[idx] = isTrib ? 1 : 0;
            wTribEarly[idx] = (isTrib && rv.early) ? 1 : 0;
            wDepth[idx] = rv.depth != null ? rv.depth : 1;
            wPos[idx] = cumLen > 0 ? bestCumLen / cumLen : 0;
          }
          if (!isTrib && margin < bestMainMargin) {
            bestMainMargin = margin;
            wMDist[idx] = d;
            wMBaseW[idx] = w;
            wMPos[idx] = cumLen > 0 ? bestCumLen / cumLen : 0;
            wMDepth[idx] = rv.depth != null ? rv.depth : 1;   // for the carve seam fallback's incision target
          }
        }
        if (bestMargin < Infinity && jitter > 0) {
          let p = wPos[idx] + (noise(u * 4 + this.seed * 11, v * 4 + this.seed * 13) * 2 - 1) * jitter;
          wPos[idx] = p < 0 ? 0 : p > 1 ? 1 : p;
        }
        idx++;
      }
    }
    this._geoCache = { rMask, rH, ridge, detail, wDist, wBaseW, wType, wTribEarly, wDepth, wPos, wMDist, wMBaseW, wMPos, wMDepth };
  }

  // Normalise the geo data into the per-generate working form (filtered, defaulted).
  // Ranges also get a PCA-derived long axis (the spine); rivers get their u-range so a
  // cell's downstream position (0 = coast, 1 = source) is a cheap normalise of u.
  _prepGeo() {
    const g = this.geo;
    if (!g) { this._geoRanges = []; this._geoRivers = []; return; }
    // VIEW ZOOM-OUT: shrink the whole skeleton toward the map centre by 1/_viewF (the inverse
    // of getElevation's coord expansion, so the coast, river and ranges stay aligned), and scale
    // each range's `spread` and each river's `width` to match — so the geography reads SMALLER on
    // screen (more area) instead of stretching to refill it. _viewF === 1 makes `ins` the identity.
    const s = 1 / (this._viewF || 1);
    const ins = (p) => [0.5 + (p[0] - 0.5) * s, 0.5 + (p[1] - 0.5) * s];
    const flipAxis = (typeof LOOK !== 'undefined' && LOOK.flipRangeAxis);
    this._geoRanges = (g.ranges || []).filter(r => r.poly && r.poly.length >= 3)
      .map(r => {
        let poly = r.poly.map(ins);
        if (flipAxis) poly = TerrainGenerator._flipRangeAxis(poly);   // run the ranges along the opposite diagonal (LOOK.flipRangeAxis)
        return TerrainGenerator._prepRange(r.height != null ? r.height : 0.85, (r.spread || 0.14) * s, poly);
      });
    // Per-type width multipliers (LOOK): a thicker main riverbed, thinner tributaries. Applied to
    // the authored base width, so the strait scaling, edge-noise raggedness and carve all inherit it.
    const mainWMult = (typeof LOOK !== 'undefined' && LOOK.mainRiverWidthMult != null) ? LOOK.mainRiverWidthMult : 1;
    const tribWMult = (typeof LOOK !== 'undefined' && LOOK.tribWidthMult != null) ? LOOK.tribWidthMult : 1;
    this._geoRivers = (g.rivers || []).filter(rv => rv.pts && rv.pts.length >= 2)
      .map(rv => {
        const pts = rv.pts.map(ins);
        let u0 = Infinity, u1 = -Infinity;
        for (const p of pts) { if (p[0] < u0) u0 = p[0]; if (p[0] > u1) u1 = p[0]; }
        // Arc length for parametric position (wPos as distance along the polyline)
        let arcLen = 0;
        for (let i = 0; i + 1 < pts.length; i++) arcLen += Math.hypot(pts[i+1][0] - pts[i][0], pts[i+1][1] - pts[i][1]);
        const wMult = (rv.type === 'tributary') ? tribWMult : mainWMult;
        return { width: (rv.width || 0.045) * s * wMult, depth: rv.depth != null ? rv.depth : 1.0, pts,
                 type: rv.type || 'main', arcLen,
                 u0, uSpan: (u1 - u0) > 1e-6 ? (u1 - u0) : 1e-6 };
      });
    // Reference width (widest MAIN stem) so per-river edge raggedness scales with channel
    // size: a thin tributary gets proportionally gentle banks, not the main's full-amplitude
    // wobble (which shredded a 0.02-wide channel into blocky islands). Floored at 0.05.
    this._mainRiverW = 0.05;
    for (const rv of this._geoRivers) if (rv.type !== 'tributary' && rv.width > this._mainRiverW) this._mainRiverW = rv.width;

    // DIRECTION NORMALISE. Emergence grows a tributary from its SOURCE (wPos 0) toward its
    // confluence (wPos 1) — and the water overlay flows the same way. Both read the polyline in
    // authored order, so a tributary drawn from the river UPWARD (confluence-first) would grow
    // and flow backwards. Reverse any tributary whose first point is nearer a MAIN stem than its
    // last, so the source always leads regardless of draw direction. arcLen/u0/uSpan are
    // symmetric under reversal, so only pts flips. Deterministic → the sliced morph stays
    // identical to the synchronous one.
    const mains = this._geoRivers.filter(r => r.type !== 'tributary');
    if (mains.length) {
      for (const rv of this._geoRivers) {
        if (rv.type !== 'tributary' || rv.pts.length < 2) continue;
        const a = rv.pts[0], b = rv.pts[rv.pts.length - 1];
        let dA = Infinity, dB = Infinity;
        for (const m of mains) {
          const da = TerrainGenerator._distToPolyline(m.pts, a[0], a[1]); if (da < dA) dA = da;
          const db = TerrainGenerator._distToPolyline(m.pts, b[0], b[1]); if (db < dB) dB = db;
        }
        if (dA < dB) rv.pts.reverse();   // first point is the confluence → flip so the source leads
      }
    }

    // PER-TRIBUTARY EMERGENCE: tag the EASTMOST tributary (its source — pts[0] after the normalise
    // above — sits furthest east) so it grows on the EARLY schedule (GEO_EPOCHS.tribEmergeEarly*,
    // ~0.5→0.4 Ma) instead of the default 0.4→0.2 Ma. Flagged here on the prepped rivers so it
    // survives an svg2geo regen; carried per cell by _buildGeoCache (wTribEarly) and read as
    // tribEmergenceEarly in the carve/paint. To move it to a different tributary, change the rule.
    let eastTrib = null, eastX = -Infinity;
    for (const rv of this._geoRivers) {
      if (rv.type !== 'tributary' || rv.pts.length < 1) continue;
      const sx = rv.pts[0][0];                       // source x (0..1)
      if (sx > eastX) { eastX = sx; eastTrib = rv; }
    }
    if (eastTrib) eastTrib.early = true;
  }

  // Precompute a range's long axis via PCA over its polygon vertices. The principal
  // eigenvector of the vertex covariance IS the range's elongation (NE–SW here), so the
  // spine crest runs along it and height falls off across `perp` out to `halfW`. Pure/static.
  static _prepRange(height, spread, poly) {
    let cx = 0, cy = 0;
    for (const p of poly) { cx += p[0]; cy += p[1]; }
    cx /= poly.length; cy /= poly.length;
    let a = 0, b = 0, d = 0;
    for (const p of poly) { const dx = p[0] - cx, dy = p[1] - cy; a += dx * dx; b += dx * dy; d += dy * dy; }
    const tr = a + d, det = a * d - b * b;
    const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    const l1 = tr / 2 + disc;                       // larger eigenvalue → long axis
    let axX, axY;
    if (Math.abs(b) > 1e-9) { axX = l1 - d; axY = b; }
    else { axX = (a >= d) ? 1 : 0; axY = (a >= d) ? 0 : 1; }
    const al = Math.hypot(axX, axY) || 1; axX /= al; axY /= al;
    const perpX = -axY, perpY = axX;                // crest falls off along the perpendicular
    let halfW = 1e-6;
    for (const p of poly) { const t = Math.abs((p[0] - cx) * perpX + (p[1] - cy) * perpY); if (t > halfW) halfW = t; }
    return { height, spread, poly, cx, cy, perpX, perpY, halfW };
  }

  // Mirror a range polygon about the VERTICAL line through its own centroid. Reflection
  // negates the long-axis tilt (slope → −slope) while fixing the centroid, so the range's
  // spine runs along the OPPOSITE diagonal but the footprint stays put — "flip the axis the
  // ranges run along" without relocating them. Centroid-preserving, so every centroid-based
  // assertion (southSink land-bridge protection, view-zoom position) is invariant. Pure/static.
  static _flipRangeAxis(poly) {
    let cx = 0;
    for (const p of poly) cx += p[0];
    cx /= poly.length;
    return poly.map(p => [2 * cx - p[0], p[1]]);
  }

  // Crest height multiplier for a cell: 1 on the range's spine axis, falling to
  // (1 − spine) at the flanks (halfW away), so the range reads as a ridge, not a plateau.
  // spine 0 → flat plateau (old behaviour). Pure/static.
  static _spineHeight(r, u, v, spine) {
    if (!(spine > 0) || !(r.halfW > 0)) return 1;
    let t = ((u - r.cx) * r.perpX + (v - r.cy) * r.perpY) / r.halfW;
    if (t < 0) t = -t; if (t > 1) t = 1;
    const sp = 1 - t * t * (3 - 2 * t);             // 1 on the axis → 0 at the flank
    return 1 - spine * (1 - sp);
  }

  // heightMap = base noise reshaped by the skeleton at the current deep-time factors.
  // heightMap = base noise reshaped by the CACHED geo field at the current deep-time
  // factors. The hot morph path: no distance/noise recompute, just a cheap per-cell
  // combine — so morphTo() pays only the bake, not the field build.
  _applyGeoToHeightMap() {
    const base = this._baseNoise, hm = this.heightMap, c = this._geoCache;
    if (!c) { hm.set(base); return; }             // no skeleton → base field unchanged
    const t = this._geoT, up = t.uplift, inc = t.incision;
    const relief = (typeof LOOK !== 'undefined' && LOOK.rangeRelief != null) ? LOOK.rangeRelief : 0.45;
    const rangeGain = (typeof LOOK !== 'undefined' && LOOK.rangeGain != null) ? LOOK.rangeGain : 2.2;
    const rangeCeil = (typeof LOOK !== 'undefined' && LOOK.rangeCeil != null) ? LOOK.rangeCeil : 0.45;
    const incise = (typeof LOOK !== 'undefined' && LOOK.riverIncise != null) ? LOOK.riverIncise : 0.06;
    const sea = (typeof LOOK !== 'undefined' && LOOK.riverSeaLevel != null) ? LOOK.riverSeaLevel : 0.04;
    const seaRise = (typeof LOOK !== 'undefined' && LOOK.seaRise != null) ? LOOK.seaRise : 0;
    const seaLift = (t.submergence > 0 ? t.submergence : 0) * seaRise;   // Axis A: marine emergence
    const floodCeil = (typeof LOOK !== 'undefined' && LOOK.seaFloodCeil != null) ? LOOK.seaFloodCeil : 0.42;
    const floodFlatK = (typeof LOOK !== 'undefined' && LOOK.seaFloodFlatten != null) ? LOOK.seaFloodFlatten : 0;
    const floodFlat = (t.submergence > 0 ? t.submergence : 0) * floodFlatK;   // de-speckle: pull drowned ground to the sea floor, strongest at full submergence
    // Strait: the main stem is widened by straitWidthMult, but only WEST of the east→west retreat
    // front (LOOK.straitReach*, driven by t.straitRetreat); east of it the stem is narrow — the
    // revealed NE source. straitWide is a per-cell factor computed in the loop from u.
    const straitW = (typeof LOOK !== 'undefined' && LOOK.straitWidthMult != null) ? LOOK.straitWidthMult : 3.0;
    const srFeather = (typeof LOOK !== 'undefined' && LOOK.straitRetreatFeather != null) ? LOOK.straitRetreatFeather : 0.08;
    const straitRetreat = t.straitRetreat;
    const straitF = (t.straitFactor != null) ? t.straitFactor : 0;   // temporal thinning
    const tribEmg = (t.tribEmergence != null) ? t.tribEmergence : 1;
    const valleyWiden = (typeof LOOK !== 'undefined' && LOOK.riverValleyWiden != null) ? LOOK.riverValleyWiden : 2.4;
    const swReach = (typeof LOOK !== 'undefined' && LOOK.seaSWReach != null) ? LOOK.seaSWReach : 1.15;
    const swFeather = (typeof LOOK !== 'undefined' && LOOK.seaSWFeather != null) ? LOOK.seaSWFeather : 0.55;
    const sub = (t.submergence > 0) ? t.submergence : 0;   // SW strait: 1 at ~1 Ma → 0 by ~0.5 Ma
    // LOCALIZED SUBMERGENCE PATCH: a single elliptical spot on the same submergence clock (LOOK.patchSub*).
    const patchU = (typeof LOOK !== 'undefined' && LOOK.patchSubU != null) ? LOOK.patchSubU : 0.58;
    const patchV = (typeof LOOK !== 'undefined' && LOOK.patchSubV != null) ? LOOK.patchSubV : 0.72;
    const patchRX = (typeof LOOK !== 'undefined' && LOOK.patchSubRX != null) ? LOOK.patchSubRX : 0;
    const patchRY = (typeof LOOK !== 'undefined' && LOOK.patchSubRY != null) ? LOOK.patchSubRY : 0;
    const patchFeather = (typeof LOOK !== 'undefined' && LOOK.patchSubFeather != null) ? LOOK.patchSubFeather : 0.45;
    const patchFeatherE = (typeof LOOK !== 'undefined' && LOOK.patchSubFeatherE != null) ? LOOK.patchSubFeatherE : patchFeather;
    // SOUTH-HALF strait pulse (Axis A): 0 at 1 Ma → 1 at ~0.5 Ma → 0 by ~0.3 Ma. Positional in v,
    // with the Tararua range mass subtracted out (southProtect) so the range stays a dry peninsula.
    const southSink = (t.southSink > 0) ? t.southSink : 0;
    const southLat = (typeof LOOK !== 'undefined' && LOOK.southSinkLat != null) ? LOOK.southSinkLat : 0.45;
    const southFeather = (typeof LOOK !== 'undefined' && LOOK.southSinkFeather != null) ? LOOK.southSinkFeather : 0.22;
    const southProtect = (typeof LOOK !== 'undefined' && LOOK.southSinkProtect != null) ? LOOK.southSinkProtect : 1;
    const southWob = (typeof LOOK !== 'undefined' && LOOK.southSinkWobble != null) ? LOOK.southSinkWobble : 0.05;
    const southEastU = (typeof LOOK !== 'undefined' && LOOK.southSinkEastU != null) ? LOOK.southSinkEastU : 0;   // EAST→WEST fill taper
    const southEastF = (typeof LOOK !== 'undefined' && LOOK.southSinkEastFeather != null) ? LOOK.southSinkEastFeather : 0.3;
    // Mottle the drowned SEA FLOOR and MEANDER the strait's north shore with the cached wobble field,
    // so the submergence reads as varied open water with a natural (not latitude-straight) coast —
    // not a flat square slab. Cached (deterministic) → the sliced morph stays identical to the sync one.
    const seaWob = (southSink > 0 || sub > 0) ? this._simWobbleField() : null;
    const rMask = c.rMask, rH = c.rH, ridge = c.ridge, detail = c.detail;
    const wDistArr = c.wDist, wBaseWArr = c.wBaseW, wTypeArr = c.wType, wDepthArr = c.wDepth, wPosArr = c.wPos, wTribEarlyArr = c.wTribEarly;
    const wMDistArr = c.wMDist, wMBaseWArr = c.wMBaseW, wMDepthArr = c.wMDepth, wMPosArr = c.wMPos;   // nearest MAIN stem — the carve seam fallback
    const tribEmgE = (t.tribEmergenceEarly != null) ? t.tribEmergenceEarly : 1;   // eastmost tributary's early schedule
    // MAIN NE-ARM recession (deep time): fade the main channel's water/carve where the inland reach dries.
    const mainArm = (t.mainArm > 0) ? t.mainArm : 0;
    const mArmKeep = (typeof LOOK !== 'undefined' && LOOK.mainArmKeep != null) ? LOOK.mainArmKeep : 0.55;
    const mArmFeather = (typeof LOOK !== 'undefined' && LOOK.mainArmFeather != null) ? LOOK.mainArmFeather : 0.14;
    // COASTAL DUNE relief (relict ridges) — added at the GLACIAL (max) reach so the landform
    // persists across phases while the sand COLOUR surges over it. Off the river channel (wMask).
    const duneAmp = (typeof LOOK !== 'undefined' && LOOK.dune && LOOK.duneRelief != null) ? LOOK.duneRelief : 0;
    const dReach = (typeof LOOK !== 'undefined' && LOOK.duneReachByPhase) ? LOOK.duneReachByPhase.fullGlacial : 0;
    const dOff = (typeof LOOK !== 'undefined' && LOOK.duneShoreOffset != null) ? LOOK.duneShoreOffset : 0;
    const dELo = (typeof LOOK !== 'undefined' && LOOK.duneElevLo != null) ? LOOK.duneElevLo : 0.16;
    const dEHi = (typeof LOOK !== 'undefined' && LOOK.duneElevHi != null) ? LOOK.duneElevHi : 0.42;
    const dCoastXS = (typeof LOOK !== 'undefined' && LOOK.coastInlandSouth != null) ? LOOK.coastInlandSouth : 0;
    const dFreq = (typeof LOOK !== 'undefined' && LOOK.duneRidgeFreq != null) ? LOOK.duneRidgeFreq : 52;
    const duneOn = duneAmp > 0 && dReach > 0;
    // BLOW-OUTS: surge-gated deflation hollows. Snapshotted per morph (like the colour surge) so the
    // one-slice heightMap pass is deterministic. blowExcess ramps in above the onset surge.
    const duneSurge = this._morphJob ? (this._morphJob.duneSurge || 0) : (this._duneSurge || 0);
    const blowStrength = (typeof LOOK !== 'undefined' && LOOK.duneBlowout != null) ? LOOK.duneBlowout : 0;
    const blowOnset = (typeof LOOK !== 'undefined' && LOOK.duneBlowoutOnset != null) ? LOOK.duneBlowoutOnset : 0.25;
    const blowFreq = (typeof LOOK !== 'undefined' && LOOK.duneBlowoutFreq != null) ? LOOK.duneBlowoutFreq : 30;
    const waterTable = (typeof LOOK !== 'undefined' && LOOK.duneWaterTable != null) ? LOOK.duneWaterTable : 0.15;
    const blowExcess = (blowStrength > 0 && blowOnset < 1 && duneSurge > blowOnset)
      ? ((duneSurge - blowOnset) / (1 - blowOnset)) * blowStrength : 0;
    const blowOn = duneOn && blowExcess > 0;
    // GLACIAL EUSTATIC sea (signed, this morph year) + its WEST gate east extent + elevation ceiling.
    const glacialSea = (t.glacialSea != null) ? t.glacialSea : 0;
    // Dune shoreline tracks the moving coast: a glacial lowstand (glacialSea > 0) pulls the belt's
    // shore seaward (coastX down) so the dunes march onto the bared shelf (Koputaroa mode).
    const dTrack = (typeof LOOK !== 'undefined' && LOOK.duneCoastTrack != null) ? LOOK.duneCoastTrack : 0;
    const dCoastX = ((typeof LOOK !== 'undefined' && LOOK.coastInland != null) ? LOOK.coastInland : 0.02) - glacialSea * dTrack;
    const gSeaCeil = (typeof LOOK !== 'undefined' && LOOK.glacialSeaCeil != null) ? LOOK.glacialSeaCeil : 0.30;
    const gSeaEastU = (typeof LOOK !== 'undefined' && LOOK.glacialSeaEastU != null) ? LOOK.glacialSeaEastU : 0.42;
    const gSeaOn = glacialSea !== 0 && gSeaEastU > 0;
    // DROWNED-VALLEY ESTUARY (highstand, positional up the main stem). Follows wMDist/wMPos.
    const highstand = (t.estuary != null) ? t.estuary : 0;
    const estReach = (typeof LOOK !== 'undefined' && LOOK.estuaryReach != null) ? LOOK.estuaryReach : 0;
    const estWidth = (typeof LOOK !== 'undefined' && LOOK.estuaryWidth != null) ? LOOK.estuaryWidth : 0;
    const estCeil = (typeof LOOK !== 'undefined' && LOOK.estuaryCeil != null) ? LOOK.estuaryCeil : 0.24;
    const estOn = highstand > 0 && estReach > 0 && estWidth > 0 && !!wMDistArr && !!wMPosArr;
    const gr = this.gridRows, gc = this.gridCols, invr = 1 / gr, invc = 1 / gc, edgeMargin = this._geoEdgeMargin, topMargin = this._geoTopMargin;
    let i = 0;
    for (let row = 0; row < gr; row++) {
      const v = row * invr;
      for (let col = 0; col < gc; col++, i++) {
        const u = col * invc;
        const sWide = TerrainGenerator._straitWide(u, straitF, straitRetreat, srFeather);   // main-stem strait widening at this column
        // Compute time-varying river mask from cached distance
        const dist = wDistArr[i];
        let wMask = 0, cellEmg = 1;
        if (dist < 1) {                             // rough early-out (max baseW ~ 0.15 at strait)
          let effW = wBaseWArr[i];
          if (wTypeArr[i] === 0) effW *= (1 + (straitW - 1) * sWide);   // main stem → strait: thins over time, and only WEST of the retreat front
          // INCISION valley mask (drives _combineGeo's carve, NOT the water/bank paint):
          // wider than the water ribbon with a smooth taper, so the gorge reads as a gentle
          // valley with sloping shoulders instead of a jagged slot chasing the ragged
          // (edge-noised) waterline. Water classification stays narrow (_rebuildBiomeMap).
          const valleyW = effW * valleyWiden;
          if (dist < valleyW) { const tt = 1 - dist / valleyW; wMask = tt * tt * (3 - 2 * tt); }
          cellEmg = (wTypeArr[i] === 1) ? (wTribEarlyArr[i] ? tribEmgE : tribEmg) : 1.0;   // tributaries use their own emergence (early schedule for the eastmost)
          // MAIN NE-ARM recession: fade the main carve where its inland (high-wPos) reach dries to land.
          if (mainArm > 0 && wTypeArr[i] === 0 && wMask > 0) wMask *= TerrainGenerator._mainArmPresence(wPosArr[i], mainArm, mArmKeep, mArmFeather);
        }
        // MAIN-stem carve fallback: a tributary-owned cell that also lies inside the wide main valley
        // takes the main's (deeper) bed, so a gated/thinned tributary leaves no un-carved ribbon
        // standing proud of the strait beside it (the fault-line seam). Only for tributary cells (a
        // main-owned cell already IS its own nearest main → wMaskM == wMask, a no-op), and only where
        // the main valley reaches. Mirrors the water/bank seam fallback in _rebuildBiomeMap.
        let wMaskM = 0, wDepthM = 1;
        if (wTypeArr[i] === 1) {
          const dM = wMDistArr[i];
          const valleyWM = wMBaseWArr[i] * (1 + (straitW - 1) * sWide) * valleyWiden;
          if (dM < valleyWM) {
            const tt = 1 - dM / valleyWM; wMaskM = tt * tt * (3 - 2 * tt); wDepthM = wMDepthArr[i];
            if (mainArm > 0) wMaskM *= TerrainGenerator._mainArmPresence(wMPosArr[i], mainArm, mArmKeep, mArmFeather);   // fallback recedes with the arm too
          }
        }
        const wv = seaWob ? seaWob[i] : 0;
        const seaFloor = 0.02 + wv * 0.015;                   // mottled deep floor (~0.005–0.035, all sea)
        const swSub = TerrainGenerator._swStrength(u, v, sub, swReach, swFeather);
        let southSub = TerrainGenerator._southStrength(v + wv * southWob, southSink, southLat, southFeather);   // meander the shore off the straight latitude line
        if (southSub > 0) { const pr = 1 - southProtect * rMask[i]; southSub *= pr > 0 ? pr : 0; }   // Tararua stays a dry peninsula
        if (southSub > 0 && southEastU > 0) southSub *= TerrainGenerator._southEastFade(u, southEastU, southEastF);   // EAST→WEST fill: east emerges first
        const patchSub = TerrainGenerator._patchStrength(u + wv * southWob, v, sub, patchU, patchV, patchRX, patchRY, patchFeather, patchFeatherE);   // meander the patch shore off a straight ellipse too
        // GLACIAL EUSTATIC sea: WEST-gate the signed shift (full at the west edge → 0 by gSeaEastU),
        // so it moves only the western coast, never the trans-range eastern lowland.
        let gSea = 0;
        if (gSeaOn && u < gSeaEastU) { const wg = 1 - u / gSeaEastU; gSea = glacialSea * wg * wg * (3 - 2 * wg); }
        const e = TerrainGenerator._combineGeo(base[i], rMask[i], rH[i], ridge[i], detail[i], wMask, wDepthArr[i], up, inc, relief, incise, sea, wPosArr[i], cellEmg, seaLift, floodCeil, rangeGain, rangeCeil, swSub, southSub, seaFloor, wMaskM, wDepthM, patchSub, gSea, gSeaCeil, floodFlat);
        // DROWNED-VALLEY ESTUARY: at a warm highstand the sea backs up the main-stem valley. Drown
        // the low valley floor near the main channel (wMDist/wMPos) toward the sea floor, elevation-
        // gated so terraces stay dry, reaching further inland as the highstand strengthens.
        let eD = e;
        if (estOn && e < estCeil) {
          const reach = estReach * highstand;
          const dM = wMDistArr[i];
          if (reach > 0 && dM < estWidth && wMPosArr[i] < reach) {
            let prox = 1 - dM / estWidth; prox = prox * prox * (3 - 2 * prox);           // near the channel
            let rf = 1 - wMPosArr[i] / reach; rf = rf * rf * (3 - 2 * rf);                // fades up-valley (inland)
            let eg = 1 - e / estCeil; eg = eg * eg * (3 - 2 * eg);                        // valley floor drowns, terrace top stays dry
            const es = highstand * prox * rf * eg;
            if (es > 0) eD = e + (seaFloor - e) * es;
          }
        }
        // Add the relict dune ridges (masked to the coastal-plain belt; not on the river channel or drowned estuary).
        if (duneOn) {
          const wm = wMask > 1 ? 1 : wMask < 0 ? 0 : wMask;
          const dr = TerrainGenerator._duneRelief(u, v, eD, dCoastX, dCoastXS, dReach, dOff, dELo, dEHi, duneAmp, dFreq);
          if (dr > 0) eD = eD + dr * (1 - wm);
          // BLOW-OUTS (§10B(2)): where the belt is active/mobile (surge past the onset), scour sparse
          // bare-sand hollows down toward the water table; a stable belt leaves the ridges intact.
          // Intensity is a BELT-MEMBERSHIP gate here (not a depth scalar) — the sparse blow-out mask ×
          // surge drives the scour, so a hollow centre bottoms out at the floor instead of the two
          // sparse fields multiplying each other down to a shallow dimple.
          if (blowOn && eD > waterTable &&
              TerrainGenerator._duneIntensity(u, v, eD, dCoastX, dCoastXS, dReach, dOff, dELo, dEHi) > 0.12) {
            let deflate = TerrainGenerator._duneBlowout(u, v, blowFreq) * blowExcess * (1 - wm);
            if (deflate > 1) deflate = 1;
            if (deflate > 0) eD -= (eD - waterTable) * deflate;
          }
        }
        hm[i] = TerrainGenerator._nsEdgeFalloff(eD, v, edgeMargin, topMargin);
      }
    }
    // Ease the extremely harsh vertical steps the carve/uplift can leave (a bank against
    // the low strait, a channel edge that drifted off the new ground mid-morph) so the 3/4
    // relief bake doesn't paint them as a tall dark wall. Deterministic → morph stays sliced==sync.
    this._smoothCliffs(hm, gc, gr);
  }

  // Reshape one cell directly (samples the field on the fly, off the cache — e.g.
  // the harness). (u,v) normalised 0..1; (wx,wy) world for the ridge/detail noise.
  // Uses the same _combineGeo as the cached path, so the two never diverge.
  _applyGeo(e, u, v, wx, wy) {
    const t = this._geoT;
    const relief = (typeof LOOK !== 'undefined' && LOOK.rangeRelief != null) ? LOOK.rangeRelief : 0.45;
    const incise = (typeof LOOK !== 'undefined' && LOOK.riverIncise != null) ? LOOK.riverIncise : 0.06;
    const sea = (typeof LOOK !== 'undefined' && LOOK.riverSeaLevel != null) ? LOOK.riverSeaLevel : 0.04;
    const spine = (typeof LOOK !== 'undefined' && LOOK.rangeSpine != null) ? LOOK.rangeSpine : 0.45;
    const rangeGain = (typeof LOOK !== 'undefined' && LOOK.rangeGain != null) ? LOOK.rangeGain : 2.2;
    const rangeCeil = (typeof LOOK !== 'undefined' && LOOK.rangeCeil != null) ? LOOK.rangeCeil : 0.45;
    let rMask = 0, rH = 0;
    const R = this._geoRanges;
    for (let i = 0; i < R.length; i++) { const m = this._rangeMass(R[i], u, v); if (m > rMask) { rMask = m; rH = R[i].height * TerrainGenerator._spineHeight(R[i], u, v, spine); } }
    let ridge = 0, detail = 0;
    if (rMask > 0) { ridge = this.ridgeNoise(wx, wy); detail = (this.fractalNoise(wx, wy) - 0.5) * 0.12; }
    // Rivers: find strongest by margin, compute mask with time-varying width (matches _buildGeoCache path)
    const wob = (typeof LOOK !== 'undefined' && LOOK.riverWobble != null) ? LOOK.riverWobble : 0.02;
    const jitter = (typeof LOOK !== 'undefined' && LOOK.riverFrontJitter != null) ? LOOK.riverFrontJitter : 0.07;
    const straitW = (typeof LOOK !== 'undefined' && LOOK.straitWidthMult != null) ? LOOK.straitWidthMult : 3.0;
    const srFeather = (typeof LOOK !== 'undefined' && LOOK.straitRetreatFeather != null) ? LOOK.straitRetreatFeather : 0.08;
    const straitWide = TerrainGenerator._straitWide(u, (t.straitFactor != null ? t.straitFactor : 0), t.straitRetreat, srFeather);   // thins over time × (1 west of the retreat front → 0 east: revealed source)
    const tribEmg = (t.tribEmergence != null) ? t.tribEmergence : 1;
    const valleyWiden = (typeof LOOK !== 'undefined' && LOOK.riverValleyWiden != null) ? LOOK.riverValleyWiden : 2.4;
    const tribEmgE = (t.tribEmergenceEarly != null) ? t.tribEmergenceEarly : 1;   // eastmost tributary's early schedule
    const mainArm = (t.mainArm > 0) ? t.mainArm : 0;   // MAIN NE-ARM recession (deep time)
    const mArmKeep = (typeof LOOK !== 'undefined' && LOOK.mainArmKeep != null) ? LOOK.mainArmKeep : 0.55;
    const mArmFeather = (typeof LOOK !== 'undefined' && LOOK.mainArmFeather != null) ? LOOK.mainArmFeather : 0.14;
    let wMask = 0, wDepth = 0, wPos = 0, cellEmg = 1;
    const Rv = this._geoRivers;
    let bestMargin = Infinity, bestMainMargin = Infinity, mainD = Infinity, mainW = 0, mainDepth = 1, mainPos = 0, selIsTrib = false;
    for (let i = 0; i < Rv.length; i++) {
      const rv = Rv[i], pts = rv.pts;
      let md = Infinity, cumLen = 0, bestCumLen = 0;
      for (let s = 0; s + 1 < pts.length; s++) {
        const ax = pts[s][0], ay = pts[s][1], bx = pts[s+1][0], by = pts[s+1][1];
        const dx = bx - ax, dy = by - ay, segLen = Math.hypot(dx, dy);
        const sd = TerrainGenerator._distToSeg(u, v, ax, ay, bx, by);
        if (sd < md) { md = sd; const l2 = dx*dx+dy*dy; let tt = l2 > 0 ? ((u-ax)*dx+(v-ay)*dy)/l2 : 0; if (tt < 0) tt = 0; else if (tt > 1) tt = 1; bestCumLen = cumLen + tt * segLen; }
        cumLen += segLen;
      }
      let d = md;
      if (wob > 0) d += (noise(u * 7 + this.seed * 3, v * 7 + this.seed * 4) * 2 - 1) * wob;
      const eAmp = (typeof LOOK !== 'undefined' && LOOK.riverEdgeNoise != null) ? LOOK.riverEdgeNoise : 0;
      const eFreq = (typeof LOOK !== 'undefined' && LOOK.riverEdgeFreq != null) ? LOOK.riverEdgeFreq : 26;
      if (eAmp > 0) d += (noise(u * eFreq + this.seed * 17, v * eFreq + this.seed * 19) * 2 - 1) * eAmp * (rv.width / (this._mainRiverW || 0.05));
      if (d < 0) d = 0;
      const w = rv.width || 0.045, margin = d / w;
      const isTrib = (rv.type === 'tributary');
      if (margin < bestMargin) {
        bestMargin = margin;
        const effW = isTrib ? w : w * (1 + (straitW - 1) * straitWide);
        const valleyW = effW * valleyWiden;   // INCISION valley (wide, smooth) — matches _applyGeoToHeightMap
        wMask = d < valleyW ? (1 - d / valleyW) : 0;
        if (wMask > 0) wMask = wMask * wMask * (3 - 2 * wMask);
        wDepth = rv.depth != null ? rv.depth : 1;
        wPos = cumLen > 0 ? bestCumLen / cumLen : 0;
        if (jitter > 0) wPos += (noise(u * 4 + this.seed * 11, v * 4 + this.seed * 13) * 2 - 1) * jitter;
        if (wPos < 0) wPos = 0; else if (wPos > 1) wPos = 1;
        cellEmg = isTrib ? (rv.early ? tribEmgE : tribEmg) : 1.0;
        selIsTrib = isTrib;
      }
      if (!isTrib && margin < bestMainMargin) { bestMainMargin = margin; mainD = d; mainW = w; mainDepth = rv.depth != null ? rv.depth : 1; mainPos = cumLen > 0 ? bestCumLen / cumLen : 0; }
    }
    // MAIN NE-ARM recession: fade the selected main's own carve where its inland (high-wPos) reach dries.
    if (mainArm > 0 && !selIsTrib && wMask > 0) wMask *= TerrainGenerator._mainArmPresence(wPos, mainArm, mArmKeep, mArmFeather);
    // MAIN-stem carve fallback (mirrors _applyGeoToHeightMap): a tributary-SELECTED cell that also lies
    // inside the wide main valley takes the main's (deeper) bed too, so a gated/thinned tributary leaves
    // no un-carved ribbon standing proud of the strait beside it (the fault-line seam).
    let wMaskM = 0, wDepthM = 1;
    if (selIsTrib && mainD < Infinity) {
      const valleyWM = mainW * (1 + (straitW - 1) * straitWide) * valleyWiden;
      if (mainD < valleyWM) {
        let tt = 1 - mainD / valleyWM; wMaskM = tt * tt * (3 - 2 * tt); wDepthM = mainDepth;
        if (mainArm > 0) wMaskM *= TerrainGenerator._mainArmPresence(mainPos, mainArm, mArmKeep, mArmFeather);   // fallback recedes with the arm
      }
    }
    const seaRise = (typeof LOOK !== 'undefined' && LOOK.seaRise != null) ? LOOK.seaRise : 0;
    const seaLift = (t.submergence > 0 ? t.submergence : 0) * seaRise;
    const floodCeil = (typeof LOOK !== 'undefined' && LOOK.seaFloodCeil != null) ? LOOK.seaFloodCeil : 0.42;
    const floodFlatK = (typeof LOOK !== 'undefined' && LOOK.seaFloodFlatten != null) ? LOOK.seaFloodFlatten : 0;
    const floodFlat = (t.submergence > 0 ? t.submergence : 0) * floodFlatK;
    const swReach = (typeof LOOK !== 'undefined' && LOOK.seaSWReach != null) ? LOOK.seaSWReach : 1.15;
    const swFeather = (typeof LOOK !== 'undefined' && LOOK.seaSWFeather != null) ? LOOK.seaSWFeather : 0.55;
    const swSub = TerrainGenerator._swStrength(u, v, (t.submergence > 0 ? t.submergence : 0), swReach, swFeather);
    // SOUTH-HALF strait (Axis A): south-latitude mask × the pulse × (1 − Tararua range protection).
    const southLat = (typeof LOOK !== 'undefined' && LOOK.southSinkLat != null) ? LOOK.southSinkLat : 0.45;
    const southFeather = (typeof LOOK !== 'undefined' && LOOK.southSinkFeather != null) ? LOOK.southSinkFeather : 0.22;
    const southProtect = (typeof LOOK !== 'undefined' && LOOK.southSinkProtect != null) ? LOOK.southSinkProtect : 1;
    const southWob = (typeof LOOK !== 'undefined' && LOOK.southSinkWobble != null) ? LOOK.southSinkWobble : 0.05;
    const southEastU = (typeof LOOK !== 'undefined' && LOOK.southSinkEastU != null) ? LOOK.southSinkEastU : 0;   // EAST→WEST fill taper
    const southEastF = (typeof LOOK !== 'undefined' && LOOK.southSinkEastFeather != null) ? LOOK.southSinkEastFeather : 0.3;
    // Off-cache path (harness): a live-noise twin of the cached mottle/meander in _applyGeoToHeightMap.
    const wv = ((t.southSink > 0) || (t.submergence > 0)) ? (noise(u * 8 + this.seed * 5, v * 8 + this.seed * 7) * 2 - 1) : 0;
    const seaFloor = 0.02 + wv * 0.015;
    let southSub = TerrainGenerator._southStrength(v + wv * southWob, (t.southSink > 0 ? t.southSink : 0), southLat, southFeather);
    if (southSub > 0) { const pr = 1 - southProtect * rMask; southSub *= pr > 0 ? pr : 0; }   // Tararua stays a dry peninsula
    if (southSub > 0 && southEastU > 0) southSub *= TerrainGenerator._southEastFade(u, southEastU, southEastF);   // EAST→WEST fill: east emerges first
    // LOCALIZED SUBMERGENCE PATCH (Axis A): elliptical spot on the submergence clock (LOOK.patchSub*).
    const patchU = (typeof LOOK !== 'undefined' && LOOK.patchSubU != null) ? LOOK.patchSubU : 0.58;
    const patchV = (typeof LOOK !== 'undefined' && LOOK.patchSubV != null) ? LOOK.patchSubV : 0.72;
    const patchRX = (typeof LOOK !== 'undefined' && LOOK.patchSubRX != null) ? LOOK.patchSubRX : 0;
    const patchRY = (typeof LOOK !== 'undefined' && LOOK.patchSubRY != null) ? LOOK.patchSubRY : 0;
    const patchFeather = (typeof LOOK !== 'undefined' && LOOK.patchSubFeather != null) ? LOOK.patchSubFeather : 0.45;
    const patchFeatherE = (typeof LOOK !== 'undefined' && LOOK.patchSubFeatherE != null) ? LOOK.patchSubFeatherE : patchFeather;
    const patchSub = TerrainGenerator._patchStrength(u + wv * southWob, v, (t.submergence > 0 ? t.submergence : 0), patchU, patchV, patchRX, patchRY, patchFeather, patchFeatherE);
    const out = TerrainGenerator._combineGeo(e, rMask, rH, ridge, detail, wMask, wDepth, t.uplift, t.incision, relief, incise, sea, wPos, cellEmg, seaLift, floodCeil, rangeGain, rangeCeil, swSub, southSub, seaFloor, wMaskM, wDepthM, patchSub, undefined, undefined, floodFlat);
    return TerrainGenerator._nsEdgeFalloff(out, v, this._geoEdgeMargin, this._geoTopMargin);
  }

  // 1 inside a range, smooth falloff to 0 across `spread` outside it.
  _rangeMass(r, u, v) {
    if (TerrainGenerator._pointInPoly(r.poly, u, v)) return 1;
    const s = r.spread || 0.14;
    const d = TerrainGenerator._distToPolyEdges(r.poly, u, v);
    if (d >= s) return 0;
    const tt = 1 - d / s;
    return tt * tt * (3 - 2 * tt);
  }

  // 1 on the river line, smooth falloff to 0 at `width`; a per-seed wobble lets the
  // channel wander off the exact SVG path so it varies run to run.
  _riverMask(rv, u, v) {
    let d = TerrainGenerator._distToPolyline(rv.pts, u, v);
    const wob = (typeof LOOK !== 'undefined' && LOOK.riverWobble != null) ? LOOK.riverWobble : 0.02;
    if (wob > 0) d += (noise(u * 7 + this.seed * 3, v * 7 + this.seed * 4) * 2 - 1) * wob;
    const w = rv.width || 0.045;
    if (d >= w) return 0;
    const tt = 1 - d / w;
    return tt * tt * (3 - 2 * tt);
  }

  // ---- wobble caches -------------------------------------------------------
  // The biome-border wobble is noise over (cell position, seed, wobbleFreq) —
  // nothing in it moves with deep time — yet it used to be re-evaluated per cell
  // on every morph re-bake (262k calls at sim res + up to ~2M at paint res, for
  // byte-identical answers). Cache the centred field (noise·2−1) per footprint;
  // a seed / frequency / footprint change invalidates via the key. This is also
  // what makes a sliced morph bit-identical to a synchronous one — the harness
  // asserts exactly that.
  _simWobbleField() {
    const key = this.seed + '|' + LOOK.wobbleFreq + '|' + this.gridCols + 'x' + this.gridRows;
    if (this._simWobKey !== key) {
      const gc = this.gridCols, gr = this.gridRows, f = LOOK.wobbleFreq, s = this.seed;
      const arr = new Float32Array(gc * gr);
      let idx = 0;
      for (let row = 0; row < gr; row++)
        for (let col = 0; col < gc; col++, idx++)
          arr[idx] = noise(col * f + s * 5, row * f + s * 7) * 2 - 1;
      this._simWob = arr; this._simWobKey = key;
    }
    return this._simWob;
  }

  // Paint-resolution twin: sampled at fractional cell coords (pc/S, pr/S), so it
  // is keyed on the supersample factor too. One slot — init and morph both bake
  // at the capped S, so in practice the cache stays warm across every morph.
  _paintWobbleField(PW, PH, S) {
    const key = this.seed + '|' + LOOK.wobbleFreq + '|' + PW + 'x' + PH + '@' + S;
    if (this._paintWobKey !== key) {
      const f = LOOK.wobbleFreq, s = this.seed, invS = 1 / S;
      const arr = new Float32Array(PW * PH);
      let i = 0;
      for (let pr = 0; pr < PH; pr++) {
        const wy = pr * invS;
        for (let pc = 0; pc < PW; pc++, i++)
          arr[i] = noise((pc * invS) * f + s * 5, wy * f + s * 7) * 2 - 1;
      }
      this._paintWob = arr; this._paintWobKey = key;
    }
    return this._paintWob;
  }

  // FACET break-up field: two-octave value-noise in [-1,1] at PAINT resolution — a LOW octave
  // that sizes the big flat rock facets and a HIGH octave that frays their edges into cracks.
  // Added to the cel-band threshold in _bakeSeasonColumns so the toon steps break along an
  // organic contour instead of the sim grid (domain-warped posterize). Season-independent, so it
  // is sampled ONCE into a cached array (keyed by seed + freqs + size) and reused across all four
  // season bakes and every morph slice — the same determinism discipline as the wobble/river
  // fields: never call noise() live on the sliced bake path.
  _paintFacetField(PW, PH, S) {
    const f = LOOK.facetFreq, dw = LOOK.facetDetail, df = LOOK.facetFreq * LOOK.facetDetailFreq;
    const key = this.seed + '|' + f + '|' + df + '|' + dw + '|' + PW + 'x' + PH + '@' + S;
    if (this._paintFacetKey !== key) {
      const s = this.seed, invS = 1 / S, norm = 1 / (1 + dw);
      const arr = new Float32Array(PW * PH);
      let i = 0;
      for (let pr = 0; pr < PH; pr++) {
        const wy = pr * invS;
        for (let pc = 0; pc < PW; pc++, i++) {
          const wx = pc * invS;
          const lo = noise(wx * f  + s * 11, wy * f  + s * 13) * 2 - 1;   // big facets
          const hi = noise(wx * df + s * 17, wy * df + s * 19) * 2 - 1;   // edge cracks
          arr[i] = (lo + hi * dw) * norm;                                 // in [-1,1]
        }
      }
      this._paintFacet = arr; this._paintFacetKey = key;
    }
    return this._paintFacet;
  }

  // Paint-resolution river mask: the strongest _riverMask over the geo rivers at each
  // fine cell's (u,v) = (pc/PW, pr/PH). This is what makes the channel read as WATER at
  // any bed height — decoupled from elevation — so a river riding the plains (well above
  // the sea band) still paints blue. Time-independent (seed + width + wobble only), so it
  // is cached per footprint and reused across the 4 season bakes and every morph; that
  // also keeps a sliced morph bit-identical to a synchronous one (the wobble noise is
  // sampled once into the cache, never live on the bake path).
  _paintRiverField(PW, PH) {
    const Rv = this._geoRivers || [];
    const wob = (typeof LOOK !== 'undefined' && LOOK.riverWobble != null) ? LOOK.riverWobble : 0.02;
    const jitter = (typeof LOOK !== 'undefined' && LOOK.riverFrontJitter != null) ? LOOK.riverFrontJitter : 0.07;
    const key = this.seed + '|' + wob + '|' + jitter + '|' + Rv.length + '|' + PW + 'x' + PH;
    if (this._paintRiverKey !== key) {
      const arr = new Float32Array(PW * PH), pos = new Float32Array(PW * PH);
      if (Rv.length) {
        const invW = 1 / PW, invH = 1 / PH;
        let i = 0;
        for (let pr = 0; pr < PH; pr++) {
          const v = pr * invH;
          for (let pc = 0; pc < PW; pc++, i++) {
            const u = pc * invW;
            let m = 0, p = 0;
            for (let r = 0; r < Rv.length; r++) { const c = this._riverMask(Rv[r], u, v); if (c > m) { m = c; p = (u - Rv[r].u0) / Rv[r].uSpan; } }
            if (m > 0 && jitter > 0) p += (noise(u * 4 + this.seed * 11, v * 4 + this.seed * 13) * 2 - 1) * jitter;   // matches the sim cache
            arr[i] = m; pos[i] = p < 0 ? 0 : p > 1 ? 1 : p;   // downstream: 0 = coast, 1 = source
          }
        }
      }
      this._paintRiver = arr; this._paintRiverPos = pos; this._paintRiverKey = key;
    }
    return this._paintRiver;
  }

  // Classify biomes from the current heightMap (extracted so morphTo() can reuse it).
  _rebuildBiomeMap() {
    const gridCols = this.gridCols, gridRows = this.gridRows;
    // Wobble the band threshold so biome borders wander like a brush line.
    const w = LOOK.wobble ? LOOK.wobbleAmp : 0;
    const wob = w > 0 ? this._simWobbleField() : null;
    // River cells read as water in the SIM map too (via the geo mask, not elevation), so
    // walkability and entity queries match the painted channel at any bed height.
    const C = this._geoCache;
    const wDistArr = C ? C.wDist : null;
    const wBaseWArr = C ? C.wBaseW : null;
    const wTypeArr = C ? C.wType : null;
    const wPosArr = C ? C.wPos : null;
    const wMDistArr = C ? C.wMDist : null;
    const wMBaseWArr = C ? C.wMBaseW : null;
    const wMPosArr = C ? C.wMPos : null;
    const wTribEarlyArr = C ? C.wTribEarly : null;
    const riverT = (typeof LOOK !== 'undefined' && LOOK.riverWaterT != null) ? LOOK.riverWaterT : 0.55;
    const riverBankT = (typeof LOOK !== 'undefined' && LOOK.riverBankT != null) ? LOOK.riverBankT : 0.30;
    // WETLAND override: on LOW ground a near-river cell reads as swamp, not sand (see the wetland
    // biome header in the scaffold). wetT sits below riverBankT so the wet zone is a touch wider
    // than the old bank; wetElevMax caps it to the lowland so the gorge keeps shingle. Kept
    // IDENTICAL to the paint pass so the sliced/sync bake and the sim biome map agree.
    const wetT = (typeof LOOK !== 'undefined' && LOOK.riverWetlandT != null) ? LOOK.riverWetlandT : 0.20;
    const wetElevMax = (typeof LOOK !== 'undefined' && LOOK.riverWetlandElevMax != null) ? LOOK.riverWetlandElevMax : 0.30;
    const _gt = this._geoT || {};
    const riverTeff = riverT + (1 - (_gt.incision != null ? _gt.incision : 1)) * 0.25;
    const straitW = (typeof LOOK !== 'undefined' && LOOK.straitWidthMult != null) ? LOOK.straitWidthMult : 3.0;
    // Main-stem width tracks the east→west retreat front (matches the carve in _applyGeoToHeightMap):
    // wide west of the front, narrowing to the revealed river east of it.
    const straitRetreat = _gt.straitRetreat;
    const straitF = (_gt.straitFactor != null) ? _gt.straitFactor : 0;   // temporal thinning
    const srFeather = (typeof LOOK !== 'undefined' && LOOK.straitRetreatFeather != null) ? LOOK.straitRetreatFeather : 0.08;
    const invc = 1 / gridCols;
    const tribEmg = (_gt.tribEmergence != null) ? _gt.tribEmergence : 1;
    const tribEmgE = (_gt.tribEmergenceEarly != null) ? _gt.tribEmergenceEarly : 1;   // eastmost tributary's early schedule
    const thin = (typeof LOOK !== 'undefined' && LOOK.tribHighlandThin != null) ? LOOK.tribHighlandThin : 1.6;
    const tribLo = (typeof LOOK !== 'undefined' && LOOK.tribHighlandLo != null) ? LOOK.tribHighlandLo : 0.30;
    const thinCap = (typeof LOOK !== 'undefined' && LOOK.tribThinCap != null) ? LOOK.tribThinCap : 0.12;
    const mainArm = (_gt.mainArm > 0) ? _gt.mainArm : 0;   // MAIN NE-ARM recession (deep time)
    const mArmKeep = (typeof LOOK !== 'undefined' && LOOK.mainArmKeep != null) ? LOOK.mainArmKeep : 0.55;
    const mArmFeather = (typeof LOOK !== 'undefined' && LOOK.mainArmFeather != null) ? LOOK.mainArmFeather : 0.14;
    const R_FEATHER = 0.15;
    let idx = 0;
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const u = col * invc;
        const straitWide = TerrainGenerator._straitWide(u, straitF, straitRetreat, srFeather);
        const elevation = this.heightMap[idx];
        const eClass = wob ? elevation + wob[idx] * w : elevation;
        let biome = this.getBiomeFromElevation(eClass);
        let waterHit = false, bedHit = false, wetHit = false;
        const wetLow = eClass < wetElevMax;   // only the lowland river reaches turn to swamp
        if (wDistArr && this._waterBiome) {
          const dist = wDistArr[idx];
          let effW = wBaseWArr[idx];
          if (wTypeArr[idx] === 0) effW *= (1 + (straitW - 1) * straitWide);
          let m = 0;
          if (dist < effW) { const tt = 1 - dist / effW; m = tt * tt * (3 - 2 * tt); }
          if (mainArm > 0 && wTypeArr[idx] === 0 && m > 0) m *= TerrainGenerator._mainArmPresence(wPosArr ? wPosArr[idx] : 0, mainArm, mArmKeep, mArmFeather);   // NE arm dries to land
          if (m > 0) {
            const cellEmg = (wTypeArr[idx] === 1) ? (wTribEarlyArr && wTribEarlyArr[idx] ? tribEmgE : tribEmg) : 1.0;
            const d = wPosArr ? wPosArr[idx] : 0;
            const front = (cellEmg * (1 + R_FEATHER) - d) / R_FEATHER;   // grows source→confluence; 0 = absent (matches the carve)
            if (front > 0) {
              const fs = front >= 1 ? 1 : front * front * (3 - 2 * front);
              let wT = riverTeff + (1 - fs) * (1 - riverTeff);
              let bT = riverBankT + (1 - fs) * (1 - riverBankT);
              // Highland thinning: a tributary on high ground is a STREAM cutting a
              // gully, not band-water with beaches. Raise the thresholds with elevation
              // so water narrows to a thread (then bare gully) upslope — no perched
              // ponds or sand rings on ridge lines.
              if (wTypeArr[idx] === 1 && thin > 0 && eClass > tribLo) {
                let hi = (eClass - tribLo) * thin;
                if (hi > thinCap) hi = thinCap;   // floor the thread: thinning narrows the water but never starves it (a stream keeps a consistent minimum width)
                wT += hi; bT += hi;   // bank thins WITH the water (a gully stream), not a widening sand ring
              }
              if (m >= wT) waterHit = true; else if (m >= bT) bedHit = true;
              if (wetLow && m >= wetT) wetHit = true;   // low reaches: swamp margin, wider than the bank
            }
          }
          // Seam fallback: a TRIBUTARY-owned cell whose paint was gated off — OR that the
          // tributary classified only as its own thin BANK — may still sit inside the
          // (strait-widened) MAIN channel. Run whenever the cell isn't already water so the
          // main's wide water can UPGRADE a tributary bank to water at the confluence (it only
          // ever promotes: bed→water, never water→bed). Without this the tributary's own bank
          // ring walls its mouth off from the main behind a strip of sand.
          if (!waterHit && wTypeArr[idx] === 1 && wMDistArr) {
            const dM = wMDistArr[idx];
            const effWM = wMBaseWArr[idx] * (1 + (straitW - 1) * straitWide);
            if (dM < effWM) {
              const tt = 1 - dM / effWM;
              let mM = tt * tt * (3 - 2 * tt);
              if (mainArm > 0) mM *= TerrainGenerator._mainArmPresence(wMPosArr ? wMPosArr[idx] : 0, mainArm, mArmKeep, mArmFeather);   // fallback recedes with the arm
              if (mM >= riverTeff) waterHit = true; else if (mM >= riverBankT) bedHit = true;
              if (wetLow && mM >= wetT) wetHit = true;
            }
          }
        }
        if (waterHit) {
          biome = this._waterBiome;
        } else if (wetHit && this._wetlandBiome) {
          biome = this._wetlandBiome;   // low riparian swamp — overrides the sand bank + the plain margin
        } else if (bedHit && this._bedBiome) {
          biome = this._bedBiome;       // gorge reaches: exposed shingle
        } else if (biome === this.biomeList[1] && this._waterBiome) {
          if (!this.hasAdjacentWater(row, col)) biome = this._fallbackBiome;
        }
        this.biomeIndexMap[idx] = this.biomeIndexByKey[biome.key];
        idx++;
      }
    }
  }

  // Reshape the land for a new yearsBP WITHOUT re-seeding: reuse the cached base
  // noise, re-apply the geography at the new factors, re-classify, re-bake.
  // SYNCHRONOUS — the whole cost lands in one call. Dev/harness path; the
  // visitor path uses morphBegin()/morphStep() below, which produce an
  // identical result spread across frames (the harness asserts the identity).
  morphTo(yearsBP, bakeScaleOverride) {
    this.morphBegin(yearsBP, bakeScaleOverride, true);   // allPhases: a hard scene change re-bakes all four (hitch hidden)
    while (this._morphJob) this.morphStep(Infinity);
  }

  // ============================================
  // INCREMENTAL MORPH — the hitchless visitor path
  // ============================================
  // morphTo() above re-baked everything in one call: fine at authoring time,
  // but a 100+ ms stall every morphIntervalYears on the wall. morphBegin()
  // stages the same work as a resumable job; morphStep(budgetMs) runs slices
  // of it inside a per-frame budget (CONFIG.morphBudgetMs, ~3 ms):
  //
  //   phase 0  heightMap + biomes + snow ramp     (one slice — cheap, geo cache)
  //   phase 1  paint-grid allocation               (one slice)
  //   phase 2  paint pass 1 (elev/biome/colour)    (row bands)
  //   phase 3  paint pass 2 (boundary edges)       (row bands)
  //   phase 4  season bakes — only the VISIBLE glacial-phase pair (current +
  //            next), current first (column bands — the pc loop in
  //            _bakeSeasonColumns is independent per column, so it slices
  //            cleanly), each into a BACK buffer that swaps in atomically when
  //            finished. The visible season's swap arms a >=500 ms crossfade
  //            (photosensitivity budget) in render().
  //
  // The sim-facing state (heightMap / biomeIndexMap) updates in phase 0, same
  // as the synchronous path; only the painted buffers lag by a few frames.
  // A generate()/reseed/refit cancels the job (the new land supersedes it).
  //
  // allPhases (morphTo only): re-bake all four phases in one job, for a HARD
  // scene change (eruption / authoring) where every buffer must be consistent
  // and the one-frame hitch is hidden (the ash flash). The incremental
  // visitor-path morph leaves it off — see _seasonBakeOrder.
  morphBegin(yearsBP, bakeScaleOverride, allPhases) {
    if (!this._baseNoise) return this.generate();   // parity with morphTo()
    this._morphJob = {
      yearsBP,
      bakeScale: (bakeScaleOverride != null) ? bakeScaleOverride : null,
      phase: 0, row: 0, col: 0,
      // Snapshot the live sand surge ONCE per morph, so every season buffer in this re-bake uses
      // the same value and the sliced bake can't tear across slices (sliced==sync invariant).
      duneSurge: this._duneSurge || 0,
      seasonIdx: 0, seasons: this._seasonBakeOrder(allPhases), st: null
    };
  }

  get morphInProgress() { return !!this._morphJob; }

  // Which glacial-phase buffers this morph re-bakes, current first (so the visible
  // land updates soonest). The incremental visitor-path morph re-bakes ONLY the
  // pair that render() can put on screen — currentKey (drawn full) + nextKey (the
  // crossfade target, always the next colder phase, drawn at transitionProgress).
  // The other two are left as they are and refresh when they next enter the visible
  // pair: a phase always ENTERS the pair at ~0 effective alpha (covered by its
  // neighbour) and is revealed gradually, so it has a full morph interval of grace
  // to be re-baked before it reads. Baking two buffers instead of four is the
  // per-morph cost cut — the per-season loadPixels/updatePixels transfers are the
  // machine-independent morph stutter. allPhases (morphTo, a hard scene change)
  // re-bakes all four; init/generate() also bakes all four.
  _seasonBakeOrder(allPhases) {
    const all = ['interglacial', 'cooling', 'glacial', 'fullGlacial'];
    const cur = this.seasonManager ? this.seasonManager.currentKey : 'interglacial';
    if (allPhases) return [cur, ...all.filter(s => s !== cur)];
    const nxt = this.seasonManager ? this.seasonManager.nextKey : cur;
    return (nxt && nxt !== cur) ? [cur, nxt] : [cur];
  }

  // Run the morph job for up to budgetMs. Returns true when the job is done
  // (or when there is none). Chunk sizes are small enough that the budget
  // overshoot is bounded by one chunk, not one phase.
  morphStep(budgetMs = 3) {
    const job = this._morphJob;
    if (!job) return true;
    const nowFn = (typeof performance !== 'undefined' && performance.now)
      ? () => performance.now() : () => Date.now();
    const deadline = nowFn() + budgetMs;
    const ROWS = 32, COLS = 48;   // per-slice chunk sizes (time re-checked between chunks)

    do {
      if (job.phase === 0) {
        // Reshape the sim-facing land: cheap per-cell combines over the geo
        // cache, biome classify off the cached wobble. Same calls as morphTo().
        this._geoT = TerrainGenerator.geoTimeFactors(job.yearsBP);
        this._geoT.glacialSea = TerrainGenerator.glacialSeaShift(job.yearsBP);   // fast eustatic ripple at the morph year
        this._geoT.estuary = TerrainGenerator.estuaryStrength(job.yearsBP);      // drowned-valley highstand at the morph year
        if (this._geoUpliftOverride != null) this._geoT.uplift = this._geoUpliftOverride;   // GEO.uplift() authoring preview
        if (!this._geoCache) { this._prepGeo(); this._buildGeoCache(); }
        this._applyGeoToHeightMap();
        this._rebuildBiomeMap();
        this._initSnowColors();
        job.phase = 1;
      } else if (job.phase === 1) {
        this._bakeScaleOverride = job.bakeScale;
        this._paintGridBegin();
        this._bakeScaleOverride = null;
        job.phase = 2; job.row = 0;
      } else if (job.phase === 2) {
        const r1 = Math.min(this._paintH, job.row + ROWS);
        this._paintGridPass1(job.row, r1);
        job.row = r1;
        if (job.row >= this._paintH) { job.phase = 3; job.row = 0; }
      } else if (job.phase === 3) {
        const r1 = Math.min(this._paintH, job.row + ROWS);
        this._paintGridPass2(job.row, r1);
        job.row = r1;
        if (job.row >= this._paintH) { job.phase = 4; job.col = 0; }
      } else if (job.phase === 4) {
        if (!job.st) {
          job.st = this._bakeSeasonBegin(job.seasons[job.seasonIdx]);
          job.col = 0;
        }
        const c1 = Math.min(this._paintW, job.col + COLS);
        this._bakeSeasonColumns(job.st, job.col, c1);
        job.col = c1;
        if (job.col >= this._paintW) {
          this._swapSeasonBuffer(job.seasons[job.seasonIdx], this._bakeSeasonEnd(job.st));
          job.st = null;
          job.seasonIdx++;
          if (job.seasonIdx >= job.seasons.length) {
            this._morphJob = null;
            return true;
          }
        }
      }
    } while (nowFn() < deadline);
    return !this._morphJob;
  }

  // Swap a finished back buffer in. If the outgoing buffer is the one on
  // screen, hand it to the render crossfade (released when the fade ends);
  // otherwise recycle it into the pool immediately.
  _swapSeasonBuffer(seasonKey, newBuf) {
    const old = this.seasonBuffers[seasonKey];
    this.seasonBuffers[seasonKey] = newBuf;
    if (!old) return;
    const sm = this.seasonManager;
    const visible = sm
      ? (seasonKey === sm.currentKey || seasonKey === sm.nextKey)
      : seasonKey === 'interglacial';
    if (visible && !this._morphFade) {
      const fadeMs = (typeof CONFIG !== 'undefined' && CONFIG.morphFadeMs) || 600;
      // Crossfade BASE = a frozen snapshot of the whole OLD on-screen composite: the old
      // current-phase land blended with the old next-phase land at the live glacial weight.
      // It has to be the full composite, not just this one old buffer — otherwise the freshly
      // re-baked NEXT-phase land (drawn on top at its phase weight during the fade) lays a
      // second, new-time shoreline over the old one for the length of the fade (the "ghost"
      // of a receded coast while the shore is meant to expand). The visible phases bake
      // CURRENT-first, so at this first swap seasonBuffers[nextKey] is still the OLD next
      // buffer — composite the two here, once, into a pooled buffer (cheaper than holding both
      // and re-blending every frame). old is captured into the snapshot, then recycled.
      const base = this._acquireBakeBuffer(old.width, old.height);
      const bdc = base.drawingContext;
      base.clear();
      bdc.globalAlpha = 1;
      base.image(old, 0, 0, base.width, base.height);
      const nextKey = sm ? sm.nextKey : null;
      const tp = sm ? sm.transitionProgress : 0;
      const oldNext = (nextKey && nextKey !== seasonKey) ? this.seasonBuffers[nextKey] : null;
      if (oldNext && tp > 0.01) {
        bdc.globalAlpha = tp;
        base.image(oldNext, 0, 0, base.width, base.height);
        bdc.globalAlpha = 1;
      }
      this._morphFade = {
        buf: base,
        // The glacial PHASE the snapshot was taken in. Deep time keeps moving during the
        // >=500 ms fade and the glacial index can oscillate across a phase boundary, so the
        // visible phase may step off this one mid-fade — then crossfading from a now-wrong-phase
        // frozen frame would flick the terrain. render() checks this key and retires early.
        key: seasonKey,
        t0: (typeof millis === 'function') ? millis() : Date.now(),
        ms: Math.max(500, fadeMs)   // photosensitivity: large changes ramp >= 500 ms
      };
      this._releaseBakeBuffer(old);   // captured into the snapshot; recycle it
    } else {
      this._releaseBakeBuffer(old);
    }
  }

  // ---- back-buffer pool ----------------------------------------------------
  // createGraphics is a real canvas: allocating one per morph churns GPU memory
  // and risks the §2.3 leak. Acquire an exact-size buffer from the pool or
  // create one; release returns it for the next season/morph. disposeBuffers()
  // drains the pool.
  _acquireBakeBuffer(w, h) {
    for (let i = 0; i < this._bufPool.length; i++) {
      const b = this._bufPool[i];
      if (b.width === w && b.height === h) { this._bufPool.splice(i, 1); return b; }
    }
    const buf = createGraphics(w, h);
    buf.pixelDensity(1);
    return buf;
  }

  _releaseBakeBuffer(buf) {
    if (!buf) return;
    // Pool only buffers that match the CURRENT bake size — anything else (e.g.
    // the higher-res init bakes retired by the first reduced-scale morph) is
    // freed, so the pool never hoards stale allocations.
    const S = this._paintScale || 1;
    const w = Math.max(1, Math.round(this.mapWidth * S));
    const h = Math.max(1, (this._paintWorldH || this.mapHeight) * S);
    if (buf.width === w && buf.height === h && this._bufPool.length < 2) {
      // Cap 2 (was 3): a morph releases each retired buffer just before acquiring
      // the next, so one pooled spare already gives a morph zero-alloc reuse; the
      // second covers the crossfade's retired buffer landing back. Dropping the
      // third reclaims ~8.8 MB of otherwise-idle GPU-backed canvas on the kiosk.
      this._bufPool.push(buf);
    } else if (typeof buf.remove === 'function') {
      buf.remove();
    }
  }

  // --- pure geometry helpers (static, p5-free → tools/bootcheck.js can assert) ----
  static _distToSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    let t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const cx = ax + t * dx, cy = ay + t * dy;
    return Math.hypot(px - cx, py - cy);
  }
  static _distToPolyline(pts, x, y) {
    let m = Infinity;
    for (let i = 0; i + 1 < pts.length; i++) {
      const d = this._distToSeg(x, y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      if (d < m) m = d;
    }
    return m;
  }
  static _distToPolyEdges(poly, x, y) {
    let m = Infinity; const n = poly.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const d = this._distToSeg(x, y, poly[i][0], poly[i][1], poly[j][0], poly[j][1]);
      if (d < m) m = d;
    }
    return m;
  }
  // With a skeleton present, soft-compress procedural base elevation above `ceil`
  // so the noise alone can't reach alpine — the ranges do. Pure/static.
  static _compressBase(e, ceil) {
    return e > ceil ? ceil + (e - ceil) * 0.2 : e;
  }

  static _pointInPoly(poly, x, y) {
    let inside = false; const n = poly.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi)) inside = !inside;
    }
    return inside;
  }

  /**
   * Pre-bake all 4 seasonal terrain buffers
   */
  _bakeAllSeasonBuffers() {
    const seasons = ['interglacial', 'cooling', 'glacial', 'fullGlacial'];

    // Free the previous bake FIRST. A createGraphics buffer is a real canvas
    // element with GPU-backed storage; dropping the reference does not release
    // it, so re-baking without remove() leaks ~4 MB at 512² every time.
    //
    // This is not theoretical: Kiosk.reseedEvery fires a full Game.init() every
    // 12th attract reset, and 'fit' mode adds one per screen resize. An
    // installation that runs for months will find it — TEMANAWA_BUILD_V3.md
    // §2.3 flags exactly this failure and it was live.
    this.disposeBuffers();

    for (const season of seasons) {
      this.seasonBuffers[season] = this._bakeSeasonBuffer(season);
    }

    if (CONFIG.debugMode) {
      console.log('Pre-baked all 4 seasonal terrain buffers');
    }
  }
  
  // High-resolution PAINT grid — see generate(). Samples the CONTINUOUS terrain
  // (getElevation) at LOOK.bakeScale× the sim grid, with biome, colour, water
  // flag and boundary-edge flag per fine cell. The season bakes render from this,
  // so PAINT resolution is decoupled from the sim's cell budget and the ground
  // reads as smooth curves rather than square grid cells. 34VIEW §4.
  // Largest integer supersample factor whose bake buffer (mapWidth·S × paintWorldH·S)
  // stays within maxPx. Pure + p5-free so tools/bootcheck.js can assert the OOM guard
  // (the harness can't allocate real pixels). Never returns < 1.
  static bakeScaleFor(cellW, cellH, requested, maxPx) {
    const req = Math.max(1, Math.round(requested || 1));
    const cells = Math.max(1, cellW * cellH);
    const maxS = Math.max(1, Math.floor(Math.sqrt(maxPx / cells)));
    return Math.min(req, maxS);
  }

  // The synchronous path (generate / rebake): allocate, then both passes in full.
  // The morph job calls the same three pieces in row bands — one implementation,
  // two schedules, so the sliced result cannot diverge from this one.
  _computePaintGrid() {
    this._paintGridBegin();
    this._paintGridPass1(0, this._paintH);
    this._paintGridPass2(0, this._paintH);
  }

  // Dimensions + allocation. Arrays are REUSED when the size is unchanged
  // (every steady-state morph), so a morph allocates nothing on the sim path.
  _paintGridBegin() {
    const _P = (typeof Projection !== 'undefined') ? Projection : null;
    this._paintK = _P ? _P.K : 1;
    this._paintLIFT = _P ? _P.LIFT : 0;
    this._paintWorldH = Math.max(1, Math.ceil(this.mapHeight * this._paintK + this._paintLIFT));

    // Choose the supersample factor, then HARD-CAP it so the bake buffer can never
    // exceed bakeMaxPixels — createGraphics(...).loadPixels() throws OOM otherwise
    // (Firefox: NS_ERROR_OUT_OF_MEMORY) and takes the whole sim down. A kiosk must not crash.
    const _req = (this._bakeScaleOverride != null) ? this._bakeScaleOverride : ((typeof LOOK !== 'undefined' ? LOOK.bakeScale : 2) || 2);
    const _maxPx = (typeof LOOK !== 'undefined' && LOOK.bakeMaxPixels) || 2200000;
    const S = TerrainGenerator.bakeScaleFor(this.mapWidth, this._paintWorldH, _req, _maxPx);
    if (S < Math.max(1, Math.round(_req))) {
      console.warn(`[terrain] bakeScale ${Math.round(_req)} -> ${S}: capped at ${_maxPx}px/buffer for the ${this.mapWidth}x${this._paintWorldH} grid`);
    }
    this._paintScale = S;
    const PW = this._paintW = Math.max(1, Math.round(this.mapWidth * S));
    const PH = this._paintH = Math.max(1, Math.round(this.mapHeight * S));

    const n = PW * PH;
    if (!this._paintElev || this._paintElev.length !== n) {
      this._paintElev  = new Float32Array(n);
      this._paintR     = new Uint8Array(n);
      this._paintG     = new Uint8Array(n);
      this._paintB     = new Uint8Array(n);
      this._paintWater = new Uint8Array(n);
      this._paintBiome = new Uint8Array(n);
      this._paintEdge  = new Uint8Array(n);
    }
  }

  // Pass 1 — interpolated elevation, biome, base colour (posterized + quieted),
  // water — for paint rows [r0, r1).
  //
  // Elevation is a smooth field the sim already sampled into heightMap. The
  // paint grid BILINEARLY INTERPOLATES that instead of re-evaluating getElevation
  // per fine cell — biome thresholds and relief then cross between samples as
  // smooth curves rather than grid-cell steps (the "higher resolution" win),
  // for a fraction of the cost. (Re-sampling getElevation here was ~10× slower
  // and blew the init budget.)
  _paintGridPass1(r0, r1) {
    const PW = this._paintW, PH = this._paintH, S = this._paintScale;
    const elevA = this._paintElev, colR = this._paintR, colG = this._paintG, colB = this._paintB;
    const waterA = this._paintWater, biomeA = this._paintBiome;

    const invS = 1 / S;
    const wob = LOOK.wobble ? LOOK.wobbleAmp : 0;
    const wobA = wob > 0 ? this._paintWobbleField(PW, PH, S) : null;
    const quiet = LOOK.quiet, qs = LOOK.quietSat, qc = LOOK.quietContrast;

    // River water is flagged by MASK, not elevation, so the channel reads as water at any
    // bed height. The mask is computed from the sim-resolution geo cache (wDist/wBaseW/wType)
    // via bilinear interpolation of distance — no paint-resolution river arrays, so morphs
    // allocate nothing extra and the time-varying strait width comes for free.
    const C = this._geoCache;
    const C_wDist = C ? C.wDist : null;
    const C_wBaseW = C ? C.wBaseW : null;
    const C_wType = C ? C.wType : null;
    const C_wPos = C ? C.wPos : null;
    const C_wMDist = C ? C.wMDist : null;
    const C_wMBaseW = C ? C.wMBaseW : null;
    const C_wMPos = C ? C.wMPos : null;
    const C_wTribEarly = C ? C.wTribEarly : null;
    const riverT = (typeof LOOK !== 'undefined' && LOOK.riverWaterT != null) ? LOOK.riverWaterT : 0.55;
    const riverBankT = (typeof LOOK !== 'undefined' && LOOK.riverBankT != null) ? LOOK.riverBankT : 0.30;
    const riverColorElev = this._waterBiome
      ? this._waterBiome.minElevation + (this._waterBiome.maxElevation - this._waterBiome.minElevation) * 0.5 : 0.05;
    const bedColorElev = this._bedBiome
      ? this._bedBiome.minElevation + (this._bedBiome.maxElevation - this._bedBiome.minElevation) * 0.5 : 0.12;
    // WETLAND override (paint) — MUST stay identical to _rebuildBiomeMap so the render matches the
    // sim biome map (and the sliced bake matches the synchronous one). See the wetland biome header.
    const wetT = (typeof LOOK !== 'undefined' && LOOK.riverWetlandT != null) ? LOOK.riverWetlandT : 0.20;
    const wetElevMax = (typeof LOOK !== 'undefined' && LOOK.riverWetlandElevMax != null) ? LOOK.riverWetlandElevMax : 0.30;
    const wetlandColorElev = this._wetlandBiome
      ? this._wetlandBiome.minElevation + (this._wetlandBiome.maxElevation - this._wetlandBiome.minElevation) * 0.5 : 0.22;
    const _gt = this._geoT || {};
    const riverTeff = riverT + (1 - (_gt.incision != null ? _gt.incision : 1)) * 0.25;
    const straitW = (typeof LOOK !== 'undefined' && LOOK.straitWidthMult != null) ? LOOK.straitWidthMult : 3.0;
    // Main-stem strait width: thins over time (straitFactor) and tracks the east→west retreat
    // front, matching the sim carve/classify.
    const straitRetreat = _gt.straitRetreat;
    const straitF = (_gt.straitFactor != null) ? _gt.straitFactor : 0;
    const srFeather = (typeof LOOK !== 'undefined' && LOOK.straitRetreatFeather != null) ? LOOK.straitRetreatFeather : 0.08;
    const tribEmg = (_gt.tribEmergence != null) ? _gt.tribEmergence : 1;
    const tribEmgE = (_gt.tribEmergenceEarly != null) ? _gt.tribEmergenceEarly : 1;   // eastmost tributary's early schedule
    const thin = (typeof LOOK !== 'undefined' && LOOK.tribHighlandThin != null) ? LOOK.tribHighlandThin : 1.6;
    const tribLo = (typeof LOOK !== 'undefined' && LOOK.tribHighlandLo != null) ? LOOK.tribHighlandLo : 0.30;
    const thinCap = (typeof LOOK !== 'undefined' && LOOK.tribThinCap != null) ? LOOK.tribThinCap : 0.12;
    const mainArm = (_gt.mainArm > 0) ? _gt.mainArm : 0;   // MAIN NE-ARM recession (deep time)
    const mArmKeep = (typeof LOOK !== 'undefined' && LOOK.mainArmKeep != null) ? LOOK.mainArmKeep : 0.55;
    const mArmFeather = (typeof LOOK !== 'undefined' && LOOK.mainArmFeather != null) ? LOOK.mainArmFeather : 0.14;
    const R_FEATHER = 0.15;

    const heightMap = this.heightMap;
    const GC = this.gridCols, GR = this.gridRows;
    const invGC = 1 / GC;

    for (let pr = r0; pr < r1; pr++) {
      const wy = pr * invS;
      let y0 = wy | 0; if (y0 > GR - 2) y0 = GR - 2 < 0 ? 0 : GR - 2; if (y0 < 0) y0 = 0;
      let fy = wy - y0; if (fy < 0) fy = 0; else if (fy > 1) fy = 1;
      const rowA = y0 * GC, rowB = (y0 + (GR > 1 ? 1 : 0)) * GC;
      for (let pc = 0; pc < PW; pc++) {
        const i = pr * PW + pc;
        const wx = pc * invS;
        const straitWide = TerrainGenerator._straitWide(wx * invGC, straitF, straitRetreat, srFeather);
        let x0 = wx | 0; if (x0 > GC - 2) x0 = GC - 2 < 0 ? 0 : GC - 2; if (x0 < 0) x0 = 0;
        let fx = wx - x0; if (fx < 0) fx = 0; else if (fx > 1) fx = 1;
        const x1 = x0 + (GC > 1 ? 1 : 0);
        const h00 = heightMap[rowA + x0], h10 = heightMap[rowA + x1];
        const h01 = heightMap[rowB + x0], h11 = heightMap[rowB + x1];
        const e = (h00 * (1 - fx) + h10 * fx) * (1 - fy) + (h01 * (1 - fx) + h11 * fx) * fy;
        elevA[i] = e;

        const eClass = wobA ? e + wobA[i] * wob : e;
        let biome = this.getBiomeFromElevation(eClass);
        let wa = (biome.isWater || biome === this._waterBiome) ? 1 : 0;   // true sea → rendered flat
        let colorElev = eClass;
        let wetHit = false;
        const wetLow = eClass < wetElevMax;   // only the lowland river reaches turn to swamp
        if (wa === 0 && C_wDist && this._waterBiome) {
          // Bilinear distance from sim-resolution geo cache
          const d00 = C_wDist[rowA + x0], d10 = C_wDist[rowA + x1];
          const d01 = C_wDist[rowB + x0], d11 = C_wDist[rowB + x1];
          const dist = (d00 * (1 - fx) + d10 * fx) * (1 - fy) + (d01 * (1 - fx) + d11 * fx) * fy;
          // Nearest-neighbor for discrete type / base width
          const ni = (fy < 0.5 ? rowA : rowB) + (fx < 0.5 ? x0 : x1);
          const wt = C_wType[ni];          // 0 = main, 1 = tributary
          let effW = C_wBaseW[ni];
          if (wt === 0) effW *= (1 + (straitW - 1) * straitWide);
          if (dist < effW) {
            const tt = 1 - dist / effW;
            let m = tt * tt * (3 - 2 * tt);                                  // smoothstep mask
            // Bilinear position along polyline
            const p00 = C_wPos[rowA + x0], p10 = C_wPos[rowA + x1];
            const p01 = C_wPos[rowB + x0], p11 = C_wPos[rowB + x1];
            const pos = (p00 * (1 - fx) + p10 * fx) * (1 - fy) + (p01 * (1 - fx) + p11 * fx) * fy;
            if (mainArm > 0 && wt === 0) m *= TerrainGenerator._mainArmPresence(pos, mainArm, mArmKeep, mArmFeather);   // NE arm dries to land
            const cellEmg = (wt === 1) ? (C_wTribEarly && C_wTribEarly[ni] ? tribEmgE : tribEmg) : 1.0;
            const front = (cellEmg * (1 + R_FEATHER) - pos) / R_FEATHER;   // matches the carve/classify front
            if (front > 0) {
              const fs = front >= 1 ? 1 : front * front * (3 - 2 * front);
              let wT = riverTeff + (1 - fs) * (1 - riverTeff);
              let bT = riverBankT + (1 - fs) * (1 - riverBankT);
              // Highland thinning — same rule as _rebuildBiomeMap: tributary water
              // narrows to a thread with elevation; no perched water/beach on ridges.
              if (wt === 1 && thin > 0 && eClass > tribLo) {
                let hi = (eClass - tribLo) * thin;
                if (hi > thinCap) hi = thinCap;   // floor the thread: thinning narrows the water but never starves it (a stream keeps a consistent minimum width)
                wT += hi; bT += hi;   // bank thins WITH the water (a gully stream), not a widening sand ring
              }
              if (m >= wT) { biome = this._waterBiome; colorElev = riverColorElev; wa = 2; }
              else if (m >= bT && this._bedBiome) { biome = this._bedBiome; colorElev = bedColorElev; }
              if (wetLow && m >= wetT) wetHit = true;   // low reaches: swamp margin, wider than the bank
            }
          }
          // Seam fallback (same rule as _rebuildBiomeMap): a tributary cell inside the
          // strait-widened MAIN channel takes the main's paint, so the strait's water/banks
          // don't cut off along the margin-selection seam. Runs even when the tributary already
          // painted the cell as its own thin BANK, so the main's wide water UPGRADES that bank
          // to water at the confluence (promotes bed→water only, never the reverse) — otherwise
          // the tributary's bank ring walls its mouth off from the main behind a strip of sand.
          if (wa === 0 && C_wType[ni] === 1 && C_wMDist) {
            const dM00 = C_wMDist[rowA + x0], dM10 = C_wMDist[rowA + x1];
            const dM01 = C_wMDist[rowB + x0], dM11 = C_wMDist[rowB + x1];
            const dM = (dM00 * (1 - fx) + dM10 * fx) * (1 - fy) + (dM01 * (1 - fx) + dM11 * fx) * fy;
            const effWM = C_wMBaseW[ni] * (1 + (straitW - 1) * straitWide);
            if (dM < effWM) {
              const tt2 = 1 - dM / effWM;
              let mM = tt2 * tt2 * (3 - 2 * tt2);
              if (mainArm > 0 && C_wMPos) {
                const pM00 = C_wMPos[rowA + x0], pM10 = C_wMPos[rowA + x1];
                const pM01 = C_wMPos[rowB + x0], pM11 = C_wMPos[rowB + x1];
                const posM = (pM00 * (1 - fx) + pM10 * fx) * (1 - fy) + (pM01 * (1 - fx) + pM11 * fx) * fy;
                mM *= TerrainGenerator._mainArmPresence(posM, mainArm, mArmKeep, mArmFeather);   // fallback recedes with the arm
              }
              if (mM >= riverTeff) { biome = this._waterBiome; colorElev = riverColorElev; wa = 2; }
              else if (mM >= riverBankT && this._bedBiome) { biome = this._bedBiome; colorElev = bedColorElev; }
              if (wetLow && mM >= wetT) wetHit = true;
            }
          }
        }
        // Low riparian swamp overrides the sand bank + the near-river plain margin (land cells only,
        // never actual water). Matches _rebuildBiomeMap's wetHit branch so sim biome == painted biome.
        if (wetHit && wa === 0 && this._wetlandBiome) { biome = this._wetlandBiome; colorElev = wetlandColorElev; }
        biomeA[i] = this.biomeIndexByKey[biome.key];
        waterA[i] = wa;

        const c = this.getColor(colorElev, biome);
        let cr = red(c), cg = green(c), cb = blue(c);
        if (quiet) {
          const gray = cr * 0.3 + cg * 0.59 + cb * 0.11;
          cr = 128 + ((cr + (gray - cr) * qs) - 128) * qc;
          cg = 128 + ((cg + (gray - cg) * qs) - 128) * qc;
          cb = 128 + ((cb + (gray - cb) * qs) - 128) * qc;
        }
        colR[i] = cr < 0 ? 0 : cr > 255 ? 255 : cr;
        colG[i] = cg < 0 ? 0 : cg > 255 ? 255 : cg;
        colB[i] = cb < 0 ? 0 : cb > 255 ? 255 : cb;
      }
    }
  }

  // Pass 2 — boundary edges: 0 none, 1 biome-ink, 2 shoreline (water≠land, wins)
  // — for paint rows [r0, r1). Reads one row above/below, so the morph job runs
  // it only after pass 1 has finished the WHOLE grid.
  _paintGridPass2(r0, r1) {
    const PW = this._paintW, PH = this._paintH;
    const biomeA = this._paintBiome, waterA = this._paintWater, edgeA = this._paintEdge;
    for (let pr = r0; pr < r1; pr++) {
      for (let pc = 0; pc < PW; pc++) {
        const i = pr * PW + pc;
        const bi = biomeA[i], wi = waterA[i];
        let edge = 0;
        if (pc > 0)                    { const j = i - 1;  if (biomeA[j] !== bi) edge = (waterA[j] !== wi) ? 2 : (edge || 1); }
        if (edge !== 2 && pc < PW - 1) { const j = i + 1;  if (biomeA[j] !== bi) edge = (waterA[j] !== wi) ? 2 : (edge || 1); }
        if (edge !== 2 && pr > 0)      { const j = i - PW; if (biomeA[j] !== bi) edge = (waterA[j] !== wi) ? 2 : (edge || 1); }
        if (edge !== 2 && pr < PH - 1) { const j = i + PW; if (biomeA[j] !== bi) edge = (waterA[j] !== wi) ? 2 : (edge || 1); }
        edgeA[i] = edge;
      }
    }
  }

  /**
   * Bake one season's terrain buffer at PAINT resolution (bakeScale×): one
   * physical pixel per paint cell, via a near-to-far ceiling painter that
   * projects the relief, blends snow, strokes ink/shore, shades slopes and fades
   * the sky. The buffer is S× the world footprint (drawn back down in render()),
   * so nothing per-frame changes.
   *
   * Split into begin / columns / end so the morph job can run it in column
   * bands (each pc column is independent). This synchronous wrapper is the
   * generate()/rebake path — same pieces, one schedule.
   */
  _bakeSeasonBuffer(seasonKey) {
    const st = this._bakeSeasonBegin(seasonKey);
    this._bakeSeasonColumns(st, 0, this._paintW);
    return this._bakeSeasonEnd(st);
  }

  // Snapshot every constant the column painter needs, acquire the target buffer
  // (pooled when a same-size one was retired), and open its pixel array.
  _bakeSeasonBegin(seasonKey) {
    const K = this._paintK, LIFT = this._paintLIFT, S = this._paintScale;
    const PW = this._paintW, PH = this._paintH;
    const bufWorldH = this._paintWorldH;

    const buf = this._acquireBakeBuffer(this.mapWidth * S, bufWorldH * S);
    buf.loadPixels();

    const snowColorsRGB = this._snowColorsRGB;
    const hasSnow = this._snowBiome && snowColorsRGB;

    const shoreC = this._getCachedColor(LOOK.shoreColor);
    const hazeC = this._getCachedColor(LOOK.hazeColor);
    const reC = this._getCachedColor(LOOK.reliefEdgeColor);

    // FACET break-up (domain-warped posterize) — only when cel steps are actually on. The field
    // is cached, so building it here (once) and reusing across all four season bakes is free.
    const facetOn = LOOK.shade && LOOK.facet && (LOOK.shadeSteps | 0) >= 2 && LOOK.facetAmp > 0;
    const facetA = facetOn ? this._paintFacetField(PW, PH, S) : null;

    // COASTAL DUNE tint — this phase's inland REACH (the Koputaroa surge is per-phase, so it
    // rides the same glacial-index crossfade as snow). The live sand SURGE (disturbance-driven
    // flux) extends the reach toward the glacial (relict) reach — snapshotted PER MORPH (off the
    // job, or live on the sync rebake) so it stays constant across the sliced bake. Cached once.
    const duneReachBase = (LOOK.duneReachByPhase && LOOK.duneReachByPhase[seasonKey]) || 0;
    const duneFullReach = (LOOK.duneReachByPhase && LOOK.duneReachByPhase.fullGlacial) || duneReachBase;
    const duneSurge = this._morphJob ? (this._morphJob.duneSurge || 0) : (this._duneSurge || 0);
    const duneSurgeGain = (LOOK.duneSurgeGain != null) ? LOOK.duneSurgeGain : 0;
    const duneReach = TerrainGenerator._duneEffReach(duneReachBase, duneFullReach, duneSurge, duneSurgeGain);
    // Surge also BRIGHTENS the blend — a mobile, mismanaged belt reads as barer sand than a
    // stabilised/vegetated one — capped at a full sand blend.
    const duneSurgeAmt = (LOOK.duneSurgeAmt != null) ? LOOK.duneSurgeAmt : 0;
    const duneAmt = TerrainGenerator._duneEffAmt((LOOK.duneMaxAmt != null) ? LOOK.duneMaxAmt : 0, duneSurge, duneSurgeAmt);
    const duneOn = !!LOOK.dune && duneAmt > 0 && duneReach > 0;
    const duneC = duneOn ? this._getCachedColor(LOOK.duneColor || '#d8c489') : null;
    // The belt's shoreline tracks the glacial-eustatic coast (this morph's shift), so the tint
    // follows the sea onto the bared glacial shelf. Same value the heightMap coast was baked with.
    const duneGlacialSea = (this._geoT && this._geoT.glacialSea != null) ? this._geoT.glacialSea : 0;
    const duneTrack = (LOOK.duneCoastTrack != null) ? LOOK.duneCoastTrack : 0;
    const duneCoastX = ((LOOK.coastInland != null) ? LOOK.coastInland : 0.02) - duneGlacialSea * duneTrack;

    return {
      seasonKey, buf, px: buf.pixels,
      K, LIFT, S, PW, PH,
      fullWidth: PW,
      fullHeight: bufWorldH * S,
      elevA: this._paintElev, colR: this._paintR, colG: this._paintG, colB: this._paintB,
      waterA: this._paintWater, edgeA: this._paintEdge, biomeA: this._paintBiome,
      snowColorsRGB, hasSnow,
      snowLine: this.seasonSnowLines[seasonKey],
      permanentSnowLine: hasSnow ? this._snowBiome.minElevation : 1.0,
      shoreR: red(shoreC), shoreG: green(shoreC), shoreB: blue(shoreC),
      hazeR: red(hazeC), hazeG: green(hazeC), hazeB: blue(hazeC),
      invS: 1 / S,
      SHADE: LOOK.shade ? LOOK.shadeStrength : 0,
      STEPS: LOOK.shade ? (LOOK.shadeSteps | 0) : 0,   // cel bands (>= 2 = flat toon steps)
      SHLO: LOOK.shadeShadow, SHHI: LOOK.shadeHigh,
      TOPBAND: Math.max(1, Math.round(1.5 * S)),       // lit top-surface thickness, px
      CLIFF: 3 * S,
      reliefEdgeOn: LOOK.reliefEdge,
      reR: red(reC), reG: green(reC), reB: blue(reC),
      EDGEW: Math.max(1, Math.round(1 * S)),         // relief outline thickness, px
      jit: LOOK.outlines ? LOOK.outlineJitter : 0,
      facetA, facetAmp: facetOn ? LOOK.facetAmp : 0,   // FACET break-up (domain-warped posterize)
      // COASTAL DUNE sand tint (per-phase reach; blended before snow/edges so outlines ink over it)
      duneOn, duneAmt,
      duneR: duneC ? red(duneC) : 0, duneG: duneC ? green(duneC) : 0, duneB: duneC ? blue(duneC) : 0,
      duneReach, duneOff: (LOOK.duneShoreOffset != null) ? LOOK.duneShoreOffset : 0,
      duneELo: (LOOK.duneElevLo != null) ? LOOK.duneElevLo : 0.16,
      duneEHi: (LOOK.duneElevHi != null) ? LOOK.duneElevHi : 0.42,
      duneCoastX,
      duneCoastXS: (LOOK.coastInlandSouth != null) ? LOOK.coastInlandSouth : 0
    };
  }

  _bakeSeasonEnd(st) {
    // The job painted into st.px — the pixels array snapshotted at begin. A sliced
    // bake holds it across MANY frames, and in real p5 any intervening loadPixels
    // (or canvas resize) on this graphics replaces buf.pixels with a fresh blank
    // snapshot; updatePixels would then push the blank one and the season swaps in
    // TRANSPARENT (seen in the browser as terrain vanishing after a morph). If the
    // array was swapped out from under us, copy the painted data back in first.
    if (st.buf.pixels !== st.px && st.buf.pixels && st.buf.pixels.length === st.px.length) {
      st.buf.pixels.set(st.px);
    }
    st.buf.updatePixels();
    return st.buf;
  }

  // Paint columns [c0, c1). Every pixel of a column is written exactly once
  // (terrain bands, then the sky above the far ridge), so a pooled buffer needs
  // no clearing and a resumed job leaves no seams.
  _bakeSeasonColumns(st, c0, c1) {
    const { K, LIFT, S, PW, PH, px, fullWidth, fullHeight,
            elevA, colR, colG, colB, waterA, edgeA, biomeA,
            snowColorsRGB, hasSnow, snowLine, permanentSnowLine,
            shoreR, shoreG, shoreB, hazeR, hazeG, hazeB,
            invS, SHADE, STEPS, SHLO, SHHI, TOPBAND, CLIFF,
            reliefEdgeOn, reR, reG, reB, EDGEW, jit, facetA, facetAmp,
            duneOn, duneAmt, duneR, duneG, duneB, duneReach, duneOff, duneELo, duneEHi,
            duneCoastX, duneCoastXS } = st;

    const invPW = 1 / PW, invPH = 1 / PH;
    // A wetland cell (river mouth / estuary / back-swamp) must not take the wind-blown dune
    // sand tint — swamp and dune are distinct neighbours. Gate the dune blend off it below.
    const wetIdx = this._wetlandBiome ? this.biomeIndexByKey[this._wetlandBiome.key] : -1;

    for (let pc = c0; pc < c1; pc++) {
      let ceiling = fullHeight;
      let farR = 0, farG = 0, farB = 0, painted = false;
      const nx = pc * invPW;   // screen-X fraction of this column (for the dune belt)

      for (let pr = PH - 1; pr >= 0; pr--) {             // near → far
        const i = pr * PW + pc;
        const e = elevA[i];
        let liftE = (waterA[i] === 1) ? 0 : e;   // only true sea is flat; river (2) rides the terrain so entities sit on it
        // Taper relief toward zero near the coast so the ceiling painter doesn't
        // render blocky cliff faces at the water's edge. Cells below COAST_LO get
        // no lift (flat like sea); cells above COAST_HI get full relief; between
        // them it ramps linearly. Paint-only — terrain shape / biomes unchanged.
        if (liftE > 0 && liftE < 0.25) {
          const ct = (liftE - 0.10) / 0.15;   // 0 at sea threshold, 1 at grassland
          liftE *= ct < 0 ? 0 : ct > 1 ? 1 : ct;
        }

        let yTop = ((pr * invS) * K - liftE * LIFT + LIFT) * S | 0;   // physical buffer px
        if (yTop < 0) yTop = 0;
        if (yTop >= ceiling) continue;                   // occluded by nearer terrain

        // ---- season colour for this paint cell ----
        let cr = colR[i], cg = colG[i], cb = colB[i];

        // COASTAL DUNE sand tint: blend toward the sand colour on the western coastal plain,
        // thinning inland to 0 at this phase's reach (the Koputaroa surge grows with cold).
        // Before snow (dunes sit below the snow line anyway) and before the edge ink, so biome
        // outlines + the shoreline stroke still draw over the sand. waterA 0 = land only.
        if (duneOn && waterA[i] === 0 && biomeA[i] !== wetIdx) {
          const di = TerrainGenerator._duneIntensity(nx, pr * invPH, e, duneCoastX, duneCoastXS, duneReach, duneOff, duneELo, duneEHi);
          if (di > 0) {
            const a = di * duneAmt;
            cr = cr + (duneR - cr) * a; cg = cg + (duneG - cg) * a; cb = cb + (duneB - cb) * a;
          }
        }

        if (hasSnow && e >= snowLine && waterA[i] !== 2) {   // no snow cap on a river riding high ground
          let cov;
          if (e >= permanentSnowLine) cov = 1.0;
          else { const range = permanentSnowLine - snowLine; cov = range > 0 ? 0.4 + ((e - snowLine) / range) * 0.6 : 1.0; }
          cov = Math.min(1, cov + (Math.sin(e * 847 + pc * invS * 0.13 + pr * invS * 0.17) * 0.5 + 0.5) * 0.12);
          const sRGB = snowColorsRGB[Math.min(snowColorsRGB.length - 1, (cov * snowColorsRGB.length) | 0)];
          cr = cr + (sRGB[0] - cr) * cov; cg = cg + (sRGB[1] - cg) * cov; cb = cb + (sRGB[2] - cb) * cov;
        }

        // Boundary ink: the SHORELINE (water's edge, edge === 2) draws; the biome-to-biome
        // habitat OUTLINES (edge === 1) are intentionally OFF. To bring outlines back, restore the
        // commented `edge === 1` branch below as the leading clause of this if / else-if.
        const edge = edgeA[i];
        // if (edge === 1 && LOOK.outlines) {
        //   const oc = this._getCachedColor(this.biomeArray[biomeA[i]].outlineColor || LOOK.outlineColor);
        //   let orr = red(oc), ogg = green(oc), obb = blue(oc);
        //   if (jit > 0) {// change outline width
        //     const ink = 3 - jit * (3 - noise(pc * invS * 0.5 + this.seed, pr * invS * 0.5 + this.seed));
        //     orr = cr + (orr - cr) * ink; ogg = cg + (ogg - cg) * ink; obb = cb + (obb - cb) * ink;
        //   }
        //   cr = orr; cg = ogg; cb = obb;
        // } else
        if (edge === 2 && LOOK.shore) {
          cr = shoreR; cg = shoreG; cb = shoreB;
        }

        // Cel / toon shading: a directional (NW-lit) slope term, QUANTIZED into a
        // few flat bands so the ground shades in light/mid/shadow STEPS like the
        // tree sprites — not a smooth gradient. Light from the NW (the fixed wind
        // and sprite light axis, SPRITE_BRIEF §1.1). Per world-unit slope (× S) so
        // it is bakeScale-independent.
        const eN = (pr > 0) ? elevA[i - PW] : e;
        const eW = (pc > 0) ? elevA[i - 1] : e;
        let sh = 1 - ((e - eN) + (e - eW)) * 0.5 * S * SHADE;
        if (sh < SHLO) sh = SHLO; else if (sh > SHHI) sh = SHHI;
        if (STEPS >= 2) {
          // Domain-warped posterize: nudge the band threshold by the facet noise so the step
          // lands on an organic contour, not the sim grid. facetAmp is in BAND-WIDTHS, added to
          // the fractional band index — still a HARD step, the boundary MOVES, it does not blur.
          let bf = (sh - SHLO) / (SHHI - SHLO) * STEPS;
          if (facetA) bf += facetA[i] * facetAmp;
          let b = bf | 0;
          if (b < 0) b = 0; else if (b > STEPS - 1) b = STEPS - 1;
          sh = SHLO + (SHHI - SHLO) * (b / (STEPS - 1));
        }
        let tr = (cr * sh) | 0, tg = (cg * sh) | 0, tb = (cb * sh) | 0;
        if (tr > 255) tr = 255; if (tg > 255) tg = 255; if (tb > 255) tb = 255;
        const fr = (tr * 0.6) | 0, fg = (tg * 0.6) | 0, fb = (tb * 0.6) | 0;   // side / cliff face

        const isFront = (pr === PH - 1);
        // A prominent rise (its top pokes well above the nearer terrain) gets a
        // bold dark OUTLINE along its top silhouette — the terrain equivalent of
        // the tree sprites' ink line, so relief forms read the same way.
        const isEdge = reliefEdgeOn && !isFront && (ceiling - yTop) > CLIFF;
        const lip = isEdge ? EDGEW : 0;

        for (let y = yTop; y < ceiling; y++) {
          const band = y - yTop;
          let rr, gg, bb;
          if (band < lip) { rr = reR; gg = reG; bb = reB; }        // bold dark relief outline (silhouette)
          else if (isFront) { rr = tr; gg = tg; bb = tb; }
          else if (band < TOPBAND) { rr = tr; gg = tg; bb = tb; }
          else { rr = fr; gg = fg; bb = fb; }
          const pi = (y * fullWidth + pc) * 4;
          px[pi] = rr; px[pi + 1] = gg; px[pi + 2] = bb; px[pi + 3] = 255;
        }
        ceiling = yTop;
        farR = tr; farG = tg; farB = tb; painted = true;
      }

      // Sky above the far ridge → blend the ridge colour up to a uniform haze.
      if (ceiling > 0) {
        for (let y = 0; y < ceiling; y++) {
          let rr, gg, bb;
          if (LOOK.haze && painted) {
            const t = y / ceiling, tt = t * t, inv = 1 - tt;
            rr = (hazeR * inv + farR * tt) | 0;
            gg = (hazeG * inv + farG * tt) | 0;
            bb = (hazeB * inv + farB * tt) | 0;
          } else { rr = hazeR; gg = hazeG; bb = hazeB; }
          const pi = (y * fullWidth + pc) * 4;
          px[pi] = rr; px[pi + 1] = gg; px[pi + 2] = bb; px[pi + 3] = 255;
        }
      }
    }
  }

  regenerate() {
    this.seed = random(10000);
    this._colorCache.clear();
    this.generate();
  }

  // Release every GPU-backed buffer this generator owns. Safe to call twice.
  // _bakeAllSeasonBuffers() calls it before re-baking; Game.refitTerrain()
  // calls it before throwing the whole generator away.
  disposeBuffers() {
    for (const key in this.seasonBuffers) {
      const buf = this.seasonBuffers[key];
      if (buf && typeof buf.remove === 'function') buf.remove();
      this.seasonBuffers[key] = null;
    }
    // The morph machinery's canvases are just as GPU-backed as the fronts:
    // drain the back-buffer pool, drop the crossfade's retired buffer, and
    // cancel any job mid-bake (its unfinished back buffer is in job.st).
    for (const b of this._bufPool) {
      if (b && typeof b.remove === 'function') b.remove();
    }
    this._bufPool.length = 0;
    if (this._morphFade) {
      const fb = this._morphFade.buf;
      if (fb && typeof fb.remove === 'function') fb.remove();
      this._morphFade = null;
    }
    if (this._morphJob) {
      const st = this._morphJob.st;
      if (st && st.buf && typeof st.buf.remove === 'function') st.buf.remove();
      this._morphJob = null;
    }
  }
  
  /**
   * Render terrain - just draws pre-baked buffers with crossfade
   * This is EXTREMELY fast - no computation, just image drawing
   */
  render(g) {
    // Split pipeline: draw the ground into the target buffer `g` (Game._terrainLayer,
    // a 1080 offscreen) rather than the live canvas, so the season-buffer blit and the
    // saturate() health filter stay pinned at 1080 while the main canvas is
    // supersampled for sprites. R = g || window, so an omitted target falls back to the
    // global canvas and any legacy caller keeps working.
    const R = g || (typeof window !== 'undefined' ? window : this);
    // Anti-alias the baked ground as it scales to the panel. The buffer is baked
    // at bakeScale× and drawn under the 2.5× camera, so bakeScale>2.5 minifies it;
    // with smoothing that downsample turns the raster ink+fill into curved edges.
    // smoothScale=false → crisp nearest-neighbour (the pixel look). Saved/restored
    // so sprites and HUD keep whatever the frame set.
    const _dc = R.drawingContext, _ps = _dc.imageSmoothingEnabled, _pq = _dc.imageSmoothingQuality;
    // Smooth a buffer ONLY while it is being MINIFIED (baked LARGER than its on-screen
    // size) — that anti-aliased downsample is the resting look (LOOK.bakeScale 3 bakes
    // above the ~2.5x camera zoom). A buffer baked BELOW the camera zoom — a cheap morph
    // re-bake at CONFIG.morphBakeScale — is MAGNIFIED, and smoothing a magnified raster is
    // exactly what turned it BLURRY after the first morph; draw those NEAREST-NEIGHBOUR
    // (crisp) instead. So the resting ground stays smooth and the post-morph land stays
    // sharp. Set inline before each draw below (no per-frame closure — CLAUDE.md).
    // LOOK.smoothScale=false still forces nearest everywhere (the chunky pixel look).
    const _sm = (typeof LOOK === 'undefined') ? true : LOOK.smoothScale !== false;
    const _screenW = this.mapWidth * ((typeof CONFIG !== 'undefined' && CONFIG.viewZoom) || 1);
    if ('imageSmoothingQuality' in _dc) _dc.imageSmoothingQuality = 'high';

    // Morph crossfade: when the incremental morph swapped the on-screen bake,
    // draw the retired buffer underneath and ease the fresh land in on top over
    // >= 500 ms (smoothstepped), so a whole-frame luminance change never lands
    // as a cut — the photosensitivity budget, TEMANAWA_BUILD_V3.md §5.2. When
    // the fade ends the retired buffer is recycled into the bake pool.
    const drawW = this.mapWidth, drawH = this._paintWorldH || this.mapHeight;
    const _ga = _dc.globalAlpha;
    let fadeAlpha = 1;
    const mf = this._morphFade;
    if (mf) {
      const nowMs = (typeof millis === 'function') ? millis() : Date.now();
      // Retire early if the visible glacial phase has stepped off the one this snapshot was
      // taken in (a boundary crossed / the index oscillated during the fade): crossfading from
      // a now-wrong-phase frozen frame would flick the terrain. Dropping to the live composite
      // is correct, and per-morph land change is small, so no hard cut reads.
      const stalePhase = this.seasonManager && mf.key != null && this.seasonManager.currentKey !== mf.key;
      const t = stalePhase ? 1 : (nowMs - mf.t0) / mf.ms;
      if (t >= 1) {
        this._releaseBakeBuffer(mf.buf);
        this._morphFade = null;
      } else {
        _dc.imageSmoothingEnabled = _sm && mf.buf.width >= _screenW;
        _dc.globalAlpha = 1;                    // the frozen OLD composite is the opaque crossfade base
        R.image(mf.buf, 0, 0, drawW, drawH);
        const tt = t < 0 ? 0 : t;
        fadeAlpha = tt * tt * (3 - 2 * tt);   // eased ramp, no step
      }
    }
    if (fadeAlpha < 1) _dc.globalAlpha = fadeAlpha;

    if (!this.seasonManager) {
      // No phase manager - just draw the interglacial. The buffer is bakeScale× the world
      // footprint, so draw it at (mapWidth × paintWorldH) — p5 downsamples the S×
      // detail into the footprint, then the view zoom scales it up (higher-res).
      const _bi = this.seasonBuffers.interglacial;
      _dc.imageSmoothingEnabled = _sm && !!_bi && _bi.width >= _screenW;
      R.image(_bi, 0, 0, drawW, drawH);
      _dc.globalAlpha = _ga;
      _dc.imageSmoothingEnabled = _ps; if ('imageSmoothingQuality' in _dc) _dc.imageSmoothingQuality = _pq;
      return;
    }

    const currentKey = this.seasonManager.currentKey;
    const transitionProgress = this.seasonManager.transitionProgress;

    if (transitionProgress < 0.01) {
      // No transition - just draw current season
      const _bc = this.seasonBuffers[currentKey];
      _dc.imageSmoothingEnabled = _sm && !!_bc && _bc.width >= _screenW;
      R.image(_bc, 0, 0, drawW, drawH);
    } else {
      // Crossfade between current and next season
      const nextKey = this.seasonManager.nextKey;

      // Draw current season
      const _bc = this.seasonBuffers[currentKey];
      _dc.imageSmoothingEnabled = _sm && !!_bc && _bc.width >= _screenW;
      R.image(_bc, 0, 0, drawW, drawH);

      // Draw next season with alpha — globalAlpha, not tint(), so p5 skips the per-call
      // tinted-canvas composite (#7). The buffers are opaque, so the crossfade is identical at
      // a fraction of the cost.
      //
      // During a morph fade the whole NEW composite eases in on top of the frozen OLD-composite
      // snapshot (drawn full, above), so the next-phase layer scales by fadeAlpha as well as by
      // transitionProgress. At fadeAlpha 0 only the snapshot shows — seamless, and no new-time
      // shoreline ghosts over the old; at fadeAlpha 1 it is the full live current·(1−tp)+next·tp
      // blend. With no fade fadeAlpha is 1, so this is exactly that ordinary blend.
      _dc.globalAlpha = fadeAlpha * transitionProgress;
      const _bn = this.seasonBuffers[nextKey];
      _dc.imageSmoothingEnabled = _sm && !!_bn && _bn.width >= _screenW;
      R.image(_bn, 0, 0, drawW, drawH);
    }
    _dc.globalAlpha = _ga;
    _dc.imageSmoothingEnabled = _ps; if ('imageSmoothingQuality' in _dc) _dc.imageSmoothingQuality = _pq;
  }
  
  // ============================================
  // MINIMAP SUPPORT
  // ============================================
  
  getTerrainBuffer() {
    if (!this.seasonManager) return this.seasonBuffers.interglacial;
    return this.seasonBuffers[this.seasonManager.currentKey];
  }
  
  getDimensions() {
    return {
      width: this.mapWidth,
      height: this.mapHeight,
      worldWidth: this.worldWidth,
      worldHeight: this.worldHeight
    };
  }
}
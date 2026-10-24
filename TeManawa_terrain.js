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
  wobbleSeaFade: 0.04,  // the wobble fades to 0 within this much elevation of the WATERLINE (TerrainGenerator._seaWobbleFade), so a gentle shelf's coast follows its contour instead of speckling into islands; 0 = full wobble everywhere
  quietSat:      0.2,   // 0 = full colour ground, 1 = greyscale
  quietContrast: 0.92,   // <1 compresses ground contrast toward mid-grey
  shadeStrength: 10.0,   // slope-shading gain (feeds the cel bands below)
  shadeSteps:    10,      // CEL bands: 0/1 = smooth gradient, 2–4 = flat toon steps (match the sprites)
  shadeShadow:   0.3,   // darkest cel band (shadow side) — multiplier on the ground colour
  shadeHigh:     1.32,   // lightest cel band (NW-lit highlight) — multiplier
  facetAmp:      1.6,  // FACET break-up: how far a cel-band boundary may wander, in BAND-WIDTHS
                        //   (0 = grid-locked steps; ~0.5 = edges roam half a band into organic rock
                        //   facets; >1 can skip a band). Nudges the quantizer threshold, bake-time.
  facetFreq:     0.4,   // FACET: spatial frequency of the LARGE facets (the flat rock planes).
                        //   Lower = broader facets; higher = busier. World units, like wobbleFreq.
  facetDetail:   0.6,   // FACET: weight of a 2nd (high-freq) octave that frays facet edges into
                        //   cracks (0 = smooth wander; ~0.4 = ragged rock edges). Fraction of octave 1.
  facetDetailFreq: 2.0, // FACET: frequency multiple of that crack octave over facetFreq.
  bakeScale:     4,      // SUPERSAMPLE factor: bake the ground at N× the sim grid. render() draws
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
  rangeRelief:   1.5,  // geo ranges: valley depth vs crest (0 = flat plateau; ~0.5 = deep forested valleys = mountain variation). Regenerate to apply.
  rangeSpine:    0.95,  // geo ranges: crest concentration along the range's long (NE–SW) axis (0 = flat poly plateau; 1 = sharp central spine, flanks fall to foothills). Regenerate to apply.
  rangeGain:     1.6,   // geo ranges: how hard uplift MULTIPLIES the existing ground (0 = no lift; higher = taller, more base-driven peaks). The ranges scale the plains' own spurs/valleys up into mountains rather than imposing a smooth crest template. Regenerate to apply.
  rangeCeil:     0.75,  // geo ranges: where the soft height ceiling starts, as a fraction of the per-cell crest rH (lower = flatter tops / more compression, preserves more base shape; higher = peaks reach closer to the authored height). Regenerate to apply.
  // RANGE fBm (2026-10-19). The ranges' relief comes from a ridged fractional-Brownian-motion field
  // (Quilez, "fBM", 2019): octaves of noise, each twice the frequency (detuned 2.03) and rotated ~37°,
  // amplitude halved each time — gain G = 0.5, Hurst H = 1, the isotropic self-similarity measured on
  // real mountain profiles. Ridged (1 − |n|)², each octave weighted by the one before, so crests stay
  // sharp and valleys branch. Replaces the old 3-octave ridge at half the base frequency, which gave the
  // Ruahine a few broad swells under a uniform cap.
  rangeFbmOctaves: 5,    // octaves of the ridged field and the crest texture
  rangeFbmFreq:    5,    // base frequency, in cycles across the map width (octave k: × 2.03^k)
  rangeFbmGain:    0.7,  // amplitude per octave (G = 2^-H; 0.5 = H 1, mountain-like)
  rangeFbmDetail:  0.10, // PRE-ceiling fBm added to the lifted ground (was a flat 0.12-wide 3-octave term)
  rangeCrestTex:   0.08, // POST-ceiling fBm on the range tops: the soft ceiling (rangeCeil) compresses every crest toward the authored height, so without this the high ground reads as one smooth cap
  flipRangeAxis: true,  // geo ranges: mirror each range about its OWN centroid so its long (spine) axis leans along the OPPOSITE diagonal — the ranges run the other way without moving off their footprint. Centroid-preserving (nothing relocates). false = authored orientation. Regenerate to apply.
  riverWobble:   0.06,  // geo river: per-seed lateral meander off the SVG path (0 = follow it exactly)
  tribWobbleFrac: 0.2,  // tributaries: cap riverWobble at this fraction of the channel's own width. The wobble is a distance bias, so on a ~0.016-wide tributary the full 0.02 pushed the CENTRE LINE past the water threshold wherever the noise ran positive — the channel pinched shut into disconnected pools (and the fish/eels on it paced the pools). 0.2 keeps the centre line always wet. Regenerate to apply.
  riverIncise:   0.15,  // geo river: bed sits this far below the LOCAL ground (0..1 elevation), not down to sea level. Bounds the plunge crossing it. Lower = gentler gorge. Regenerate (G/N) to apply.
  riverValleyWiden: 2.4,  // geo river: the INCISION valley is this many times wider than the water ribbon, with smooth shoulders — so the carved gorge is a gentle valley, not a jagged slot tracing the ragged (edge-noised) waterline. The water/bank PAINT stays narrow; only the terrain carve widens. Regenerate to apply.
  riverSeaLevel: 0.3,  // geo river: the bed only sinks to this (the sea band) where the land is already near it — the coast. Upstream it rides the terrain. Regenerate to apply.
  riverWaterT:   0.5,  // geo river: mask ≥ this reads as open WATER — the (narrow) blue thread. Raise = narrower water. Regenerate to apply (paint + walkability).
  riverBankT:    0.32,  // geo river: mask in [riverBankT, riverWaterT) reads as exposed RIVERBED / bank (sandy shingle, walkable) framing the water. Lower = wider bed. Raised from 0.22 to trim the wide sand bands that pooled where tributaries meet the main (the confluence seam-fallback bank keys off this too). Only affects river banks — sea beaches are elevation-classified (coastal band). Regenerate to apply.
  mainRiverWidthMult: .8,  // geo river: scales the MAIN stem's authored base width (geo width 0.05) at PRESENT — a thicker main riverbed. Multiplies the whole channel (water + shingle bed), and the early strait scales off it too. Independent of the tributary width below. Regenerate (G/N) to apply.
  tribWidthMult:  0.7,   // (was 0.9; twelve tributaries at 0.9 read as a web of canals, 2026-10-20) geo river: scales every TRIBUTARY's authored base width (geo width 0.02) — thinner side-streams. The thread is still floored by tribThinCap so it never beads to bare gully. Lower = thinner tributaries; keep ≥ ~0.6 so a few-cell-wide channel stays continuous. Regenerate to apply.
  riverWetlandT: 0.20,  // WETLAND: mask ≥ this (and BELOW riverWaterT), on LOW ground (< riverWetlandElevMax), reads as WETLAND (swamp margin) instead of bare sand — so the lower river's banks + a modest back-swamp margin are Manawatū raupō/harakeke/kahikatea, not beach. Set BELOW riverBankT so the wet zone is wider than the old sand bank. The gorge reaches (above the elev cap) keep shingle; the open sea beach (far from any river) keeps sand. Robust to land re-tuning: it keys off the live river-proximity field, so it tracks the channel wherever it morphs. Regenerate to apply.
  riverWetlandElevMax: 0.30,  // WETLAND: only the low reaches turn to swamp — a near-river cell above this normalised elevation stays shingle bank (the incised gorge in the hills has no back-swamp). ≈ the lowland/grassland ceiling. Regenerate to apply.
  coastEase:     1,   // coast FALLOFF: land-rise exponent off the shore (>1 = gentle shelf/beach; <1 = the old steep cliff). This is knob (a) — how gently the land falls to the sea. Higher is gentler but widens the near-sea-level zone (softer waterline); pull toward ~1.1 if the coastline reads mushy. Regenerate to apply.
  coastInland:   0.14,  // coast POSITION (knob b, uniform): how far inland (east, as a fraction of screen X) the FINAL western shoreline sits — raise to bring the coast inland / expose more sea. 0.02 = the original tight coast; useful range ~0.2–0.7. Added to the per-row meander, so the actual waterline sits a little east of this. The SEVERE early southern strait is the marine submergence (seaSWReach), which recedes by ~0.5 Ma to leave this final coast. Regenerate to apply.
  coastInlandSouth: 0.1,  // coast POSITION (knob b, south bias): EXTRA inland reach added toward the south (v→1), 0 at the north edge → this many X-fractions at the south edge — so the southern/SW coast curves further in while the north stays put. This is the PERMANENT (present) curve; the strait's harsher early curve flattens onto it by ~0.5 Ma as seaSWReach recedes. Regenerate to apply.
  coastSmooth:   3,     // coast: light smoothing passes over the low-elevation shelf ONLY (0 = off) — clears waterline speckle and blocky relief steps without touching plains or ranges. Regenerate to apply.
  coastRampWidth: 0.06,  // coast: WIDTH (in shore-distance units, 0..1) of a clean monotonic RAMP either side of the waterline where the shelf-relief noise is suppressed to 0 — so the shoreline crosses the sea band once, cleanly, instead of the noise straddling it and shattering the emerging shelf into floaty bits. Relief resumes just beyond the ramp. 0 = off (noise right up to the waterline, the old fragmented look). Regenerate to apply.
  coastShelfRelief: 0.06,  // coast: AMPLITUDE of the undulating shelf/coastal-plain relief (0..1 elevation). This is the fractal detail on the emerging shore. Kept WELL BELOW the offshore base gradient so the shelf deepens MONOTONICALLY — the coast reads as a gradual elevation gain, not scattered noise patches (bars that independently poke through the eustatic waterline as the shelf emerges). Was 0.11 (nearly the base gradient → local reversals → the fragmented look). Raise for more sandbars/inlets, lower for a smoother shelf. Regenerate to apply.
  coastShelfDetail: 0.3,   // coast: weight of the HIGH-frequency 2nd shelf octave, as a fraction of the low octave — the fine speckle on the shelf relief. Lower = broader, more coherent shelf undulation (fewer isolated specks); higher = busier. Was 0.5. Regenerate to apply.
  cliffSmooth:   0.12,  // DE-CLIFF: after the carve/uplift, ease any elevation step to a neighbour STEEPER than this (0..1 per cell) — kills the extremely harsh vertical "jumps" the 3/4 relief bake would otherwise paint as a tall dark wall (e.g. a bank against the strait, a channel edge drifted off the new ground mid-morph). Gentle relief — plains, range flanks — sits below the threshold and is untouched. 0 = off. Regenerate (G/N) to apply.
  cliffSmoothPasses: 2, // DE-CLIFF: how many smoothing passes (more = softer, wider blend). Runs on the sim heightMap, deterministically, so the sliced morph stays identical to the synchronous one.
  riverFrontJitter: 0.09, // geo river: low-freq wander of the emerging tip so the growing river tapers off naturally instead of ending on a straight line. Regenerate to apply.
  riverEdgeNoise: 0.015,  // geo river: HIGH-frequency wobble on the channel edge (world frac) — breaks the authored polyline's smooth banks into a natural ragged waterline. Cached with the distance field, so it costs nothing per frame. 0 = off. Regenerate to apply.
  riverEdgeFreq:  32,     // geo river: spatial frequency of the edge noise. Higher = choppier banks.
  riverEdgeNoisePow: 2,   // geo river: how the edge-noise amplitude scales DOWN for narrow channels — the wobble is multiplied by (channelWidth / mainWidth)^this. A thin tributary's water thread is only a few cells wide, so the main's full-amplitude wobble (linear scaling) beat it into disconnected pools; squaring the ratio (2) cuts the tributary wobble ~3× while leaving the wide main almost untouched. 1 = the old linear scaling. Regenerate to apply.
  tribHighlandThin: 0.5,  // tributaries: how fast the painted WATER/BED thins with elevation above the lowland (tribHighlandLo). This elevation-driven thinning is the main source of a tributary's WIDTH VARIANCE along its length (full near the low confluence, pinched where it climbs), so it is kept gentle for a more UNIFORM ribbon; the thread is still floored by tribThinCap so no perched band-water. High ground carries only a thin thread. Bounded by tribThinCap so the thread never starves. 0 = off (dead-uniform width).
  tribHighlandLo: 0.30,   // tributaries: elevation at which highland thinning STARTS. Below this the tributary keeps its full lowland water width; above it the thread narrows at tribHighlandThin per unit elevation. Regenerate to apply.
  // TRIBUTARY FANS (deep time, GEO_EPOCHS.tribConverge*). A tributary is not grown from nothing: it
  // is there from 1 Ma, because the east-side catchment's flow is what cut the antecedent gorge
  // (Trewick & Bland 2012). It starts as a FAN of thin hill streams spread across the flank, each
  // running down to the trunk's lower reach, and they draw together into one defined channel as
  // the ranges steepen. Each stream is the trunk's centre line offset sideways, so the cache keeps
  // only the signed distance to the trunk and its position along it (TerrainGenerator._tribThreads).
  tribFanStreams:  3,     // streams per tributary, the trunk included (1 = trunk only, no fan). Was 5; with twelve tributaries the 1 Ma hills carried ~60 threads
  tribMinCells:    3.2,   // no tributary channel (trunk or fan thread) narrower than this many sim cells: thinner beads into dots (early in the window on high ground the water threshold reaches ~0.75, which keeps only ~a third of a channel's width as water)
  tribHeadWidth:   0.55,  // a tributary trunk's width at its source as a fraction of its width at the mouth: rivers widen downstream (was uniform, which read as canals)
  tribFanSpread:   0.03,  // spacing between neighbouring streams at full spread (map fraction); the outermost sit about twice this out
  tribFanMeander:  0.35,  // each stream's own wander, as a fraction of the spacing
  tribFanThread:   0.3,   // an early stream's width as a fraction of the trunk's final width; the trunk grows to full as the fan closes
  tribFanResidual: 0,     // how much of the spread is left at the present (0 = one channel)
  // MEANDERS (2026-10-19). Every channel's centre line is offset sideways by a 1D fBm along it that
  // drifts DOWNSTREAM with time, so bends grow, migrate and are replaced across the run (Knight: the
  // lower Manawatū's abandoned meanders and the youngest terraces "represent variations in the river
  // route"). Strongest on the low plain below the gorge; zero in the gorge and at every confluence (so
  // the network stays joined); straighter in glacials, when the river was a gravel braid plain.
  mainRiverWobble: 0,     // main stem: the old static distance wobble (riverWobble applies to tributaries only now — the meanders move the main; a ±0.02 bias swamped the narrow gorge channel into a flat-floored 26-row strait)
  meanderAmp:      0.05,  // main stem: peak sideways offset (map fraction) on the low plain. Was 0.034 (~2.5 km), which swept only a third of the floodplain; Hesp & Shepherd 1978 have the lower Manawatū's meanders cutting the Tokomaru terrace margin, i.e. the whole plain (2026-10-20)
  meanderLen:      0.075,  // wavelength of the largest bends along the channel (map fraction)
  meanderPeriod:   60,    // kyr for the bend pattern to travel one wavelength downstream
  meanderGlacial:  0.3,   // how much a full glacial straightens the channels (0 = no climate effect). Was 0.45; a glacial braid plain is straighter but still shifts (coalescing gravel fans, Hesp & Shepherd)
  tribMeanderAmp:  0.035, // tributaries: peak offset wherever they cross plain or basin (none inside a range, none at the mouth, which follows its parent instead). Was 0.02, lower half only
  // COURSE SHIFTS (avulsion, 2026-10-20). On top of the migrating bends, each channel's whole course
  // takes a new line at every glacial termination (the transgression re-sets the lower valleys; the
  // glacial gravel fans avulse): a long-wavelength offset, fixed through each glacial cycle, eased over
  // meanderBeltEase years at the termination. Same envelope and corridor as the bends.
  meanderBeltAmp:   0.03,  // main stem: peak course shift (map fraction)
  tribBeltAmp:      0.025, // tributaries: peak course shift
  meanderBeltLen:   0.3,   // wavelength of the course shift along the channel (map fraction): whole reaches move together
  meanderBeltEase:  3000,  // years the course takes to move to its new line after a termination
  // CORRIDOR: the bends and course shifts swing a channel across its plain but never into a range. Per
  // sample along each channel, the offset either side is soft-clamped (tanh) to the distance at which the
  // range mass first reaches corridorRangeT, less corridorMargin; corridorMax caps the search.
  corridorRangeT:   0.4,
  corridorMargin:   0.012,
  corridorMax:      0.12,
  // JUNCTIONS: a tributary's line runs on past its mouth by tribMouthStub (unseen), so when its parent
  // swings away the tributary lengthens to meet it, and when the parent swings toward it the tributary
  // ends at the parent's line. Its last tribMouthBlend (in p) slides sideways with the parent. So no
  // channel is pinned at a confluence any more (it was, until 2026-10-20) and the network stays joined.
  tribMouthStub:    0.09,
  tribMouthBlend:   0.18,
  tribFanTaper:    0.45,  // how far up the trunk (in p) a stream starts drawing in before it merges — longer = a gentler curve into the trunk, less of a parallel comb
  tribBankRim:     0.15,  // tributary banks: the sand/shingle rim spans at most this much mask below the water threshold, so a thin early stream is not mostly sand. The main keeps riverBankT
  mainTaper:       0.55,  // the main stem narrows upstream: at its authored source (wPos 1) it is this much narrower than at the mouth (smoothstep). Rivers widen downstream; without it the reach east of the gorge read as a lake after the lake had drained
  tribThinCap: 0.12,      // tributaries: CAP on how much highland thinning may raise the water/bed threshold — floors the water thread so a tributary always keeps a small consistent ribbon of water (never beads to bare gully). The whole authored tributary sits near ~0.48 elevation, so without this the thinning starved the thread along its entire length. 0 = uncapped (old behaviour). Regenerate to apply.
  straitWidthMult: 3.0,   // main river is this many times wider at ~1 Ma: the marginal-marine ESTUARY ARM west of the gorge and the Woodville LAKE east of it (pinched to river width in the gap, straitGorge*). Narrows to 1× by straitCloseTo. Was 6.0 — at 6× the half-width (~0.3 of the map) read as open sea across the whole opening, not "low land and estuaries" (step 6, 2026-10-18; md/TEMANAWA_NATURAL_HISTORY.md §I). Regenerate to apply.
  seaRise:       0,     // RETIRED 2026-10-19 (was 0.10): relative sea level now floods the early west by contour (relativeSeaLevel, _seaShift), so a positional flood on top would double it. Kept as a knob. EMERGENCE (deep time): at ~1 Ma the basin is a shallow-marine embayment. The flood is water RISING (attenuated by elevation, see seaFloodCeil), not the ground sinking, scaled by submergence and easing to 0 (present shoreline) by GEO_EPOCHS.emergeTo (~0.5 Ma). Tune live (press B/G/N).
  seaFloodCeil:  1.,  // EMERGENCE reach: the flood's lowering fades to nothing at this elevation — ground above it never submerges, so the eastern uplands stay legible land at 1 Ma instead of the whole map reading as a grey flood. Lower = flood hugs the coast; higher = deeper inundation. Tune live (press B/G/N).
  seaFloodFlatten: 0.85,  // EMERGENCE de-speckle (0..1): the elevation-attenuated flood above LOWERS the basin but keeps its base-noise relief, so a deeply-drowned floor emerges as scattered shallow speckle / a shattered coast. This pulls drowned ground toward the mottled sea floor — full effect deep in the basin, ~0 at the waterline — so the open sea reads as coherent water while the immediate shore keeps its sandbar texture. Scaled by submergence, so it only bites during the emergence and is gone by the present coast. 0 = off (the old fragmented look). Tune live (press B/G/N).
  seaSWReach:    0,     // RETIRED 2026-10-19 (was 1.60): the diagonal SW strait is replaced by relative sea level (see seaRise). Kept as a knob. SW MARINE STRAIT (Axis A, positional): at ~1 Ma the Whanganui basin SW of the river is open sea — the strait. Regardless of elevation, the ground SW of a diagonal front (measured u+(1−v), so the lower-LEFT corner) is pulled fully under, then fills back into the normally-generated terrain by GEO_EPOCHS.emergeTo (~0.5 Ma). This is how far that full submergence reaches toward the NE; larger = more of the map starts drowned. Raised with seaSWFeather (1.25→1.60) so the WIDER taper still reaches the NE dry edge — the basin keeps its extent but shelves in gradually instead of dropping off. Tune live (press B/G/N).
  seaRangeProtect: 1.0,  // how strongly the axial ranges RESIST the SW strait and the central patch (as southSinkProtect does for the south strait). 1 = the range footprints stay a low emergent finger of basement at ~1 Ma — the sea laps them, never drowns them (the strait across the axis had closed by ~1.6 Ma). 0 = the old flood straight over the future ranges. Tune live (press B/G/N).
  seaSWFeather:  3.0,  // SW MARINE STRAIT: softness of that diagonal front (0 = a hard shoreline). Its taper is what leaves the SE with intermittently more land — a basic 'land bridge'. Widened 0.7→1.40 so the basin's INNER (NE, landward) shore grades in over a broad shelf rather than the obvious early drop-off; paired with seaSWReach above so the deep SW core survives. Tune live (press B/G/N).

  // ---- GLACIAL EUSTATIC SEA (the fast ~100 ky ripple, from Climate.seaLevel) ----
  // Distinct from the slow TECTONIC emergence above (seaRise/submergence, a one-way flood that
  // recedes by ~0.5 Ma): this is the glacio-eustatic cycle, and it is SIGNED and oscillating.
  // A glacial LOWSTAND (−125 m at the LGM) raises the low western shelf so it emerges as land and
  // the coast marches SEAWARD (more land, but open/cold/dune country); an interglacial HIGHSTAND
  // (+6 m) sinks it so the sea creeps INLAND (less land, but forested). Driven by the glacial index
  // at the morph's yearsBP (TerrainGenerator.glacialSeaShift → Climate), so it breathes over the
  // cycle as the world re-bakes, crossfaded like everything else. Elevation-attenuated to the coast
  // and WEST-gated, so it never touches the trans-range eastern lowland. Set seaCoast false to disable.
  // 2026-10-19 (md/TEMANAWA_COAST_PLAN.md): the shift is now driven by RELATIVE SEA LEVEL IN METRES
  // (Climate.seaLevelAt + the plain's uplift since), not by the glacial index, and the western sea
  // floor is baked as a SHELF PROFILE in metres (_bakeShelf), so a sea level puts the coast at the
  // matching depth instead of the old hold-then-flip (the noise floor sat in a thin band under the
  // waterline, so a glacial bared it all at once).
  seaCoast:        true,  // false = the coast never moves with sea level (the old glacialSeaAmp 0)
  seaShelfK:       0.00075, // LOWSTAND: elevation lift per metre the sea falls. The shelf is baked against it (_shelfFloorE), so the coast lands exactly where the profile's depth equals the fall; keep ≤ ~0.10/130 so the LGM floor stays ≥ 0.
  seaLandK:        0.0016,  // HIGHSTAND: elevation per metre of relative sea above present (eustatic + uplift since) — the land's height scale (0.10 + 0.0016·h for a cell h metres up). Everything below the contour that height marks floods (_seaShift); the ranges sit far above any contour the run reaches.
  shelfInnerSlope: 8.7,   // m per km: inner–mid shelf ≈ 0.5° (NZJGG 1980, west-coast shelf)
  shelfInnerDepth: 50,    // m: where the inner shelf gives way to the flat outer shelf
  shelfOuterSlopeN: 3.0,  // m per km: outer shelf (<0.1°–0.2°) at the north edge …
  shelfOuterSlopeS: 4.5,  // … steepening to the south-west, toward the still-subsiding depocentre off Levin–Foxton and the Cook Strait gulf, so the LGM sea retreats to a sliver there rather than vanishing
  shelfMottle:     10,    // m: relief on the shelf (two octaves, fading in over 6 km from the shore), so a shifted coast has bays and headlands instead of running parallel to today's
  frameKm:         115,   // km the map's width spans (Foxton → the gorge ≈ 45 km ≈ 0.39 of the width); converts the profile to map units
  plainUplift:     0.3,   // m per kyr: the plain's PRESENT uplift rate at the modern coast (Pillans 1986: 0.3–0.5 m/ka there, 1–3 m/ka against the axial range; quoted in Rees, Palmer & Palmer 2019) — the slope of the land offset near the present, so the MIS 5e Tokomaru shore (now 30–90 m up) is reached
  plainOffsetMax:  70,    // m: the land offset SATURATES here (landOffsetM = max·tanh(R·age/max)). The offset is how far the sea of a date stood above TODAY's land: uplift since, NET of the sediment that kept filling the basin. Pure uplift-since (hundreds of metres by 1 Ma) assumes today's plain existed then; it didn't — the basin kept building its surface up to sea level, so the early coastal plain always sat near the sea and each glacial cycle swept the shore across it. Calibrated to the dated landmarks: early highstands reach the range foot (the c. 0.88 Ma transgression over Feilding–Halcombe, Rees et al. 2019; Onepuhi beds ~570 ka), early LOWSTANDS bare the plain (T&B Fig. 4D's pale band is land at lowstand; Rees et al.'s lowstand braid plains at the eastern margin), MIS 5e reaches the Tokomaru bench, the LGM coast is far west. Replaced plainUpliftOnset (a ramp to 120 m that kept even early glacials +30 m over the whole plain) on 2026-10-19
  seaHighstandHold: 0.40, // HIGHSTAND: the whole low plain is LOWERED by the rise up to this elevation (see _seaShift), so the new shore sits just above the water and climbs inland as the plain always did. Lowering only the drowned ground left a step the height of the whole rise at every highstand shore, which the relief bake drew as a cliff (2026-10-19)
  seaHighstandFade: 0.15, // … and the lowering fades out over this much elevation above the hold, on the range flanks, so the ranges themselves never sink. Wider = gentler flanks
  glacialSeaCeil:  0.30,  // LOWSTAND only: only ground BELOW this elevation is lifted (the coastal shelf/plain), so the ranges never shift. Highstands flood by contour instead (seaHighstandBand).
  glacialSeaFullU: 0.36,  // WEST gate: the shift is FULL west of this screen-X fraction (every present-sea cell, so the baked shelf lands the coast exactly) …
  glacialSeaEastU: 0.48,  // … and fades to 0 by this one, so it never touches the eastern trans-range land.

  // ---- DROWNED-VALLEY ESTUARY (the interglacial highstand extreme) -------------
  // The far pole of the highstand (TEMANAWA_ECOLOGY_COAST.md §8): at a warm interglacial the sea
  // does not just nudge the coast inland — it BACKS UP THE RIVER VALLEY as an estuary reaching east
  // to Shannon and north to Opiki. So the "coast" stops being an edge strip and fingers into the
  // middle of the map. Positional (follows the cached MAIN stem, wMDist/wMPos) and gated on the
  // glacial index (fills only in warm interglacials, drains in glacials). Elevation-gated to the
  // valley FLOOR, so terraces and the ranges stay dry. Applied in _applyGeoToHeightMap after the
  // combine, like the dune relief. Distinct from the uniform glacialSea coastal shift above.
  estuaryRslOn:    5,     // m of relative sea level above present at which the valley estuary starts filling …
  estuaryRslFull:  35,    // … full by this. Keyed to the same relative sea level as the coast (was the glacial index).
  estuaryReach:    0.60,  // how far up the main stem (wMPos, 0 = SW mouth → 1 = NE source) the estuary reaches at FULL highstand; scales with the highstand strength.
  estuaryWidth:    0.11,  // half-width (world frac) of the drowned floodplain either side of the main channel — how far the estuary spreads off the river.
  estuaryCeil:     0.24,  // only valley-floor ground BELOW this elevation drowns; higher terraces stay dry (a soft shoreline up the valley walls).
  // ---- THE OPIKI CYCLE (2026-10-20): drowned tributary valleys, then infill, swamp and forest --------
  // Hesp & Shepherd 1978: the rising sea drowned the lower Manawatū AND Ōroua valleys (and the valleys
  // cut in the Tokomaru terrace) into one estuary; once the sea stood still, estuarine then river
  // sediment filled it to a flat floodplain (the Holocene estuary reached Opiki ~6.5 ka and is now only
  // the Foxton mouth); levées, back-swamps and swamp forest followed (TEMANAWA_ECOLOGY_WETLAND.md §4–5).
  // Every highstand in the window runs the same sequence. The clock is the STILLSTAND AGE: years since
  // the relative sea level was last estuaryFillRiseM lower than now (TerrainGenerator.stillstandAge).
  estuaryTribWidth: 0.05,  // half-width (world frac) of a tributary's drowned valley (its estuary branch)
  estuaryTribReach: 0.45,  // how far up a tributary (fraction of its length from the mouth) its branch reaches at full strength
  estuaryFillRiseM: 8,     // m: the sea counts as still once it has risen less than this since the stillstand began
  estuaryFillYears: 7000,  // years for the fill to reach full: the margins and the valley heads fill first, the deep channel near the mouth last
  estuaryFillMax:   0.85,  // the fill never closes the deepest estuary (the river mouth stays open, like Foxton's)
  estuaryFillElev:  0.125, // the infilled floodplain's elevation: just above the waterline
  estuarySwampYears: 1500, // years a newly filled cell stays tidal flat / swamp before forest can take any of it
  estuaryForestYears: 4000,// years over which swamp forest spreads across the fill after that
  estuaryForestMax: 0.5,   // the forest's final share of the fill (about half: the mosaic noise clusters at its middle); the rest stays back-swamp (Makerua, Moutoa)
  estuaryForestBiome: 'podocarp',   // the level biome the forested fill takes (the swamp takes the wetland biome)
  estuaryMemoryYears: 15000,        // the fill's region is the largest estuary of this many years back, so the filled plain outlasts the sea's fall
  estuaryRegionMin: 0.25,           // the estuary envelope's edge (its strength without the elevation term): weaker cells were never estuary
  estuaryFlatsElev: 0.17,           // after the sea falls, envelope ground below this is the exposed estuary floor (swamp, then forest)

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
  patchSubRX:      0,     // patch radius in u (half-width). 0 = OFF. OFF since 2026-10-19: at 0.17 it drowned the Pahiatua–Woodville country east of the Tararua at 1 Ma, which Trewick & Bland Fig. 4D show as land (the uplift there is what turned the river west). Was 0.17.
  patchSubRY:      0.15,  // patch radius in v (half-height) — a touch larger than RX offsets the 3/4 vertical squash so the drowned area reads round on screen. 0 = OFF.
  patchSubFeather: 1.20,   // soft taper (as a fraction of the radius) from full drown at the core edge out to dry land, on the W/N/S sides. Wider = more gradual shoreline. 0 = a hard shoreline. Widened 0.9→1.20 with the strait feathers so the deep central pocket shelves in to match. (The moa beach north of the patch stays land up to ~1.1.)
  patchSubFeatherE: 1.2,  // (was 3.0 — that stretched the Woodville lake across most of the east at 1 Ma, when Hawke's Bay was largely land; tightened to the floor below in step 6, 2026-10-18. At 1.2 the east shore reads ragged with a few islets, not a cliff; raise toward ~1.6 for a gentler grade.) EAST taper — separate, and much wider, because the patch's eastern edge runs UPHILL into the coast: a short taper there drops from sea floor straight to high land in a cell or two, which the 3/4 relief bake paints as a jagged cliff line. This lengthens the eastern grade so the land eases down into the water from further east (a beach slope, not a drop-off). Blended smoothly by direction (full east → patchSubFeather at N/S), so no seam. Keep ≥ patchSubFeather; too large starts eating the far-east hill. Tune live (press B/G/N).

  // ---- SOUTH-HALF STRAIT (deep time, Axis A) ----------------------------------
  // The SOUTHERN half of the map subsides into a marine strait, deepest at the window open
  // (~1 Ma; the basin depocentre lay off Levin–Foxton), draining back to land by ~0.5 Ma — leaving the axial ranges (Tararua + Ruahine)
  // as the N–S land bridge and the Manawatū a 'ghost' of the strait. The pulse TIMING is dated
  // in GEO_EPOCHS.southSink*; these knobs are its SHAPE on the map. Positional in v (latitude).
  southSinkAmt:     1.0,   // strength of the south-half strait (0 = off). KEPT when seaRise/seaSWReach were retired (2026-10-19): it is the one term sea level cannot produce — T&B's still-subsiding depocentre off Levin–Foxton at ~1 Ma, draining one way by ~0.5 Ma
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
  duneCoastTrack:  1.0,      // how far the dune belt's shoreline FOLLOWS the moving coast (1 = fully, read off the shelf profile via coastShiftU). So in a glacial the dunes march seaward onto the bared shelf (true Koputaroa mode); 0 = belt pinned to the present coast
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
  // GORGE PINCH (_gorgeOpen): the wide water never crosses the axis. The real Manawatū Strait had
  // closed by ~1.6 Ma; at ~1 Ma the wide water is an ESTUARY ARM west of the gap and, east of it,
  // the LAKE ponded near Woodville by uplift on the Wellington Fault, draining west through the young
  // gorge (md/TEMANAWA_NATURAL_HISTORY.md §I). The stem stays river-width inside the gap throughout.
  straitGorgeU:           0.505, // centre of the range gap (screen-X fraction; measured: the main stem crosses between the ranges at u ≈ 0.48–0.53). Near the map centre, so it holds under the view zoom-out.
  straitGorgeHalfW:       0.04,  // half-width of the river-width gap. 0 = OFF (the old seaway straight across the axis).
  straitGorgeFeather:     0.05,  // softness either side, as the gap opens out into the estuary arm (W) and the lake (E).
  // TE ĀPITI, THE GORGE ITSELF (2026-10-19). The Ruahine and Tararua run down to meet at the river, which
  // has cut a steep, narrow V between them — not a lowland gap with sandy banks. A range SADDLE joins the
  // two masses across the gap (lifted by the same uplift, so it rises with them) and the antecedent river
  // incises it: a narrower valley and channel, shingle banks, no swamp.
  gorgeSaddle:     0.62,  // saddle crest as a fraction of the ranges' height (0 = off: the old open gap)
  gorgeReach:      0.09,  // how far either side of the river the saddle reaches (map fraction)
  gorgeTaper:      0.035,  // along the river, the saddle eases out over this much u beyond the gap's half-width
  gorgeValley:     0.4,   // the carved valley's width in the gorge, as a fraction of the plain's (steep walls)
  gorgeChannel:    0.45,  // the water channel's width in the gorge, as a fraction of the plain's
  gorgeIncise:     3.5,   // extra incision in the gorge (× riverIncise, on top of the plain's): the bed cuts down toward plain level while the saddle rises around it, and deepens with the incision clock — antecedence you can see
  // WOODVILLE LAKE (east of the gap). Its own body and clock, not the strait: uplift on the
  // Wellington Fault ponds it from ~1 Ma, and it drains west as the gorge cuts down
  // (GEO_EPOCHS.lake*). It is a widening of the main stem over a short reach east of the gap only,
  // so the rest of the east stays the land Fig. 4D shows (Hawke's Bay largely land by 1 Ma).
  lakeLenU:       0.14,  // how far east of the gap the lake reaches, as a screen-X fraction (≈ 16 km at frameKm 115)
  lakeFeather:    0.05,  // softness of the lake's eastern end, screen-X
  lakeWidthMult:  2.6,   // the main stem is this many times wider at the lake's peak

  // ---- MAIN NE-ARM RECESSION (deep time, GEO_EPOCHS.mainArm*) ------------------
  // Early the main stem reaches inland to its NE source (flowing inland). Once the ranges rise the
  // drainage flips: the flow reverses seaward (by the ~1 Ma opening) and the inland (NE) reach dries back to LAND,
  // gone by the narrow-river stage. Positional in downstream wPos (0 = SW mouth, 1 = NE source).
  mainArmKeep:    0.625, // main river: the seaward reach with wPos BELOW this survives; the NE reach ABOVE it dries to land at full recession. Set just past the EASTERN tributary's confluence (wPos 0.615, measured), so the main ends where that tributary takes over as the upper Manawatū: lower and the tributary is left ending in dry land; higher and the main runs on past the junction as a blunt dead-end blob. Read on the UN-jittered main position (wMPos) so the end is clean.
  mainArmFeather: 0.05,  // main river: width (in wPos) of the drying front's soft taper above mainArmKeep, so the arm fades to land instead of ending on a hard line.

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

  // The ranges' fBm at world (wx, wy), written into `out` (no allocation): ridge (0..1, the ridged
  // multifractal that carves the valleys), detail and crest (centred, about −1..1: plain fBm, the
  // second phase-shifted). See LOOK.rangeFbm*. Each octave doubles the frequency (×2.03, detuned so
  // peaks don't stack), rotates the domain ~37° and halves the amplitude (gain G).
  _rangeFbm(wx, wy, out) {
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const oct = Math.max(1, Math.round(L.rangeFbmOctaves != null ? L.rangeFbmOctaves : 5));
    const G = (L.rangeFbmGain > 0) ? L.rangeFbmGain : 0.5;
    const W = this.mapWidth || 1;
    let fq = ((L.rangeFbmFreq > 0) ? L.rangeFbmFreq : 5) / W;
    const c = 0.7986, sn = 0.6018;                    // cos/sin 37°
    let x = wx * fq + this.seed * 0.71, y = wy * fq + this.seed * 0.43;
    let a = 1, norm = 0, rs = 0, ds = 0, cs = 0, w = 1;
    for (let k = 0; k < oct; k++) {
      const n = noise(x, y) * 2 - 1;
      let r = 1 - Math.abs(n); r *= r; r *= w;       // ridged, weighted by the octave before
      w = r * 2; if (w > 1) w = 1;
      rs += a * r; ds += a * n;
      cs += a * (noise(x + 31.7, y - 17.3) * 2 - 1);
      norm += a;
      const nx = (x * c - y * sn) * 2.03, ny = (x * sn + y * c) * 2.03;
      x = nx + 3.1; y = ny - 1.7;
      a *= G;
    }
    out.ridge = rs / norm; out.detail = ds / norm; out.crest = cs / norm;
    return out;
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

  // SHELF BAKE (md/TEMANAWA_COAST_PLAN.md §3): rewrite the WESTERN sea floor of the cached base
  // field as a shelf profile in METRES, measured offshore from today's coast row by row. The noise
  // floor it replaces sat in a thin band just under the waterline, so any glacial lift bared all of
  // it at once (the sea held still to −73 m, then the whole west flipped to land at −125 m). Each
  // cell's floor is set so a sea fall of exactly its depth lifts it to the waterline through the
  // combine's shift (shelfFloorE), so the coast marches out with sea level: a few km at MIS 3,
  // most of the frame's sea at the LGM, a sliver left in the south-west. Islets off the coast are
  // folded into the shelf. Runs once per generate on the cached base (never on the morph path, so
  // the sliced and synchronous morphs stay identical); its mottle is the only noise it reads.
  _bakeShelf(arr, gc, gr) {
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    if (L.seaCoast === false) return;
    const seaE = (this._waterBiome && this._waterBiome.maxElevation != null) ? this._waterBiome.maxElevation : 0.10;
    const km = (L.frameKm > 0) ? L.frameKm : 115, kmPerCol = km / gc;
    const mot = (L.shelfMottle != null) ? L.shelfMottle : 0;
    // The coast on a row = the first cell where the next `span` cells are at least `landFrac` land.
    // A first-run-of-land rule stopped at offshore islet clusters, leaving the noisy lagoons behind
    // them as sea floor that flipped to land all at once (a speckled archipelago at MIS 3).
    const span = Math.max(10, Math.round(gc * 0.03)), landFrac = 0.85;
    const lutKey = seaE + '|' + L.seaShelfK + '|' + L.glacialSeaCeil;
    if (!this._shelfLut || this._shelfLutKey !== lutKey) {   // depth (m, 0.5 m steps to 200 m) → floor elevation
      this._shelfLut = new Float32Array(401);
      for (let k = 0; k <= 400; k++) this._shelfLut[k] = TerrainGenerator.shelfFloorE(k * 0.5, seaE);
      this._shelfLutKey = lutKey;
    }
    const lut = this._shelfLut;
    if (!this._shelfCoastCol || this._shelfCoastCol.length !== gr) this._shelfCoastCol = new Int16Array(gr);
    const raw = this._shelfCoastCol;
    const need = Math.ceil(span * landFrac);
    for (let row = 0; row < gr; row++) {
      const ro = row * gc;
      let coast = -1, land = 0;
      for (let k = 0; k < span && k < gc; k++) if (arr[ro + k] >= seaE) land++;
      for (let c = 0; c + span <= gc; c++) {          // sliding window [c, c+span)
        if (land >= need && arr[ro + c] >= seaE) { coast = c; break; }
        if (arr[ro + c] >= seaE) land--;
        if (c + span < gc && arr[ro + c + span] >= seaE) land++;
      }
      raw[row] = coast;
    }
    // A row that starts as LAND at the west edge (a headland, the top-edge ease) borrows the nearest
    // row's coast, so the shelf runs on under it instead of ending on a straight horizontal edge.
    for (let row = 0; row < gr; row++) {
      if (raw[row] > 0) continue;
      for (let k = 1; k < gr; k++) {
        if (row - k >= 0 && raw[row - k] > 0) { raw[row] = raw[row - k]; break; }
        if (row + k < gr && raw[row + k] > 0) { raw[row] = raw[row + k]; break; }
      }
    }
    // The depth is measured from a SMOOTHED reference coast, not each row's own: a bay or the river
    // mouth makes the raw coast jump tens of columns between neighbouring rows, and measuring from
    // it stepped the shelf there (a straight seam across the bared shelf). Median of 9 rows, then a
    // ±10-row mean (wider ironed the coast's shape out, and the shifted coasts ran ruler-straight). Cells inside a bay (east of the reference, west of the row's coast) get the
    // shallowest floor, so bays fill first as the sea falls.
    if (!this._shelfCoastRef || this._shelfCoastRef.length !== gr) this._shelfCoastRef = new Float32Array(gr);
    const ref = this._shelfCoastRef, med = new Float32Array(gr), win = [];
    for (let row = 0; row < gr; row++) {
      win.length = 0;
      for (let k = -4; k <= 4; k++) { const r = row + k; if (r >= 0 && r < gr && raw[r] > 0) win.push(raw[r]); }
      win.sort((a, b) => a - b);
      med[row] = win.length ? win[win.length >> 1] : 0;
    }
    for (let row = 0; row < gr; row++) {
      let s = 0, n = 0;
      for (let k = -10; k <= 10; k++) { const r = row + k; if (r >= 0 && r < gr && med[r] > 0) { s += med[r]; n++; } }
      ref[row] = n ? s / n : 0;
    }
    for (let row = 0; row < gr; row++) {
      const v = row / gr, ro = row * gc, coast = raw[row], cRef = ref[row];
      if (coast <= 0) continue;                           // no western sea on this row
      for (let c = 0; c < coast; c++) {
        let xKm = (cRef - c) * kmPerCol;
        if (xKm < 0) xKm = 0;
        let d = TerrainGenerator.shelfDepthM(xKm, v);
        if (mot > 0) {                                     // two octaves: broad bays and headlands + a finer ripple
          const fade = xKm < 6 ? xKm / 6 : 1;
          d += ((noise(c * 0.012 + this.seed * 9, row * 0.012 + this.seed * 3) - 0.5) * 2
              + (noise(c * 0.045 + this.seed * 13, row * 0.045 + this.seed * 7) - 0.5) * 0.6) * mot * fade;
        }
        if (d < 0.5) d = 0.5;
        const kf = d * 2, k0 = kf | 0;
        arr[ro + c] = k0 >= 400 ? lut[400] : lut[k0] + (lut[k0 + 1] - lut[k0]) * (kf - k0);
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
  getRivers() { return this._riverViews || this._geoRivers || []; }   // the channels as drawn at this date (meanders applied)

  // The main stem is authored SW-mouth → NE-source, so its overlay flow reads INLAND early. Once the
  // ranges rise and the NE arm begins to recede (mainArm > 0, from the ~1 Ma opening) the drainage flips: the flow
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
    this._bakeShelf(this._baseNoise, gridCols, gridRows);   // western sea floor → a shelf profile in metres

    // Deep-time factors for the CURRENT yearsBP (ranges grow, gorge incises), then
    // reshape the base field with the geography skeleton and classify biomes.
    this._geoT = TerrainGenerator.geoTimeFactors(
      (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : null);
    this._geoT.glacialSea = TerrainGenerator.glacialSeaShift(   // relative sea level (m) → coastal shift, onto the tectonic factors
      (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : null);
    this._geoT.coastShiftU = TerrainGenerator.coastShiftU(      // the coast's move, for the dune belt to follow
      (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : null);
    this._geoT.estuary = TerrainGenerator.estuaryStrength(      // drowned-valley highstand (interglacial)
      (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : null);
    this._geoT.estFillAge = TerrainGenerator.stillstandAge(     // the Opiki cycle's clock: estuary infill → swamp → forest
      (typeof DeepTime !== 'undefined') ? DeepTime.yearsBP : null);
    this._geoT.estMax = TerrainGenerator.estuaryMax(            // … and its memory: the episode's largest estuary
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
  //   Real geology (Trewick & Bland 2012; Rees, Palmer & Palmer 2017/2018 — md/TEMANAWA_NATURAL_HISTORY.md
  //   §I): the Manawatū Strait across the axis was widest ~2.4 Ma and CLOSED by ~1.6 Ma, before the
  //   window. At ~1 Ma the axis is a low emergent finger of basement; RAPID uplift of the Ruahine and
  //   Tararua begins ~1 Ma; the once east-flowing river turns west c. 1 Ma, a lake ponds near
  //   Woodville and drains west through the young gorge; the west is low land and estuaries with the
  //   basin deepest off Levin–Foxton, emerging north-first. Incision leads the uplift (antecedence).
  static get GEO_EPOCHS() {
    return {
      upliftFrom:   1000000, upliftTo:    25000,   // ranges: low basement hills → mature (rapid uplift from ~1 Ma)
      upliftStart:  0.15,                          // uplift AT the onset: the axis is already a low emergent finger (some uplift since ~1.5 Ma), not a flat plain. Keep below incision's 0.2 start so the gorge still leads
      incisionFrom: 1000000, incisionTo:  25000,   // river depth/banks: leads uplift, deepens late
      emergeFrom:   1000000, emergeTo:   500000,   // river: seaward strait → continuous source-to-sea
      straitCloseFrom: 700000, straitCloseTo: 250000,  // strait THINS to normal river width over this span (held full-wide before ~0.7 Ma, a river by ~0.25 Ma)
      straitRetreatFrom: 700000, straitRetreatTo: 500000,  // EAST→WEST strait: the wide water's eastern end draws back to straitReachLate over this span (the source reveal)
      tribConvergeFrom: 1000000, tribConvergeTo: 300000,  // tributaries: a fan of thin hill streams at 1 Ma draws together into one channel as the ranges steepen (LOOK.tribFan*). Present throughout: the east-side flow cut the gorge. Replaced tribEmerge* (0.4→0.2 Ma headward growth) on 2026-10-19
      lakeFrom: 1050000, lakeFull: 920000, lakeHold: 800000, lakeTo: 600000,   // Woodville lake: ponds as uplift starts on the Wellington Fault (~1 Ma), full by ~0.9 Ma, drained west through the gorge by ~0.6 Ma. T&B give the sequence, not the dates; these are authored
      mainArmFrom:     1250000, mainArmTo:    1000000,   // main stem's NE INLAND arm — the old EAST-flowing outlet — is already abandoned at the 1 Ma opening (T&B: the river was turned west in the Late Pliocene–Early Quaternary); the upper Manawatū is the eastern tributary. Was 1.02→0.6 Ma. See LOOK.mainArmKeep.
      // SOUTH-HALF STRAIT (Axis A). The southern half of the map opens as sea — the Whanganui Basin's
      // depocentre lay off Levin–Foxton at ~1 Ma — and DRAINS one way as the basin uplifts and
      // emerges north-first (east-first across the map, via LOOK.southSinkEastU). The Tararua range
      // footprint stays a dry peninsula throughout (the N–S land bridge). Four dates shape it:
      //   From → Full   sink: 0 (normal land) → 1 (fully submerged)
      //   Full … Hold   plateau at full submergence
      //   Hold → To     drain: 1 → 0 (back to the normally-generated land)
      // From sits just before the window so the run opens fully sunk; it drains 1 Ma → ~0.5 Ma, with
      // the marine emergence (emergeTo). Was a pulse peaking at 0.5 Ma (dry at 1 Ma), which no
      // source supports.
      southSinkFrom: 1100000, southSinkFull: 1000000, southSinkHold: 1000000, southSinkTo: 500000
    };
  }

  // Deep-time SHAPE factors for an absolute yearsBP. All 0..1; yearsBP null → mature
  // present (1,1,1). Pure — a function of yearsBP + GEO_EPOCHS only, independent of the
  // window, so a date always maps to the same geological state.
  //  · uplift    — range growth. The Ruahine/Tararua axial ranges rose mainly over the LAST
  //                ~1 Ma (rapid uplift commenced c. 1 Ma; Ruahine ~1.3 mm/yr), so this is only
  //                a GENTLE ease-in (pow 1.5) — the ranges climb steadily across the whole
  //                window, not a late-window jump. Onset (upliftFrom) sits at the window open,
  //                from upliftStart: the axis was already a low emergent finger, not a plain.
  //  · incision  — river DEPTH + bank sharpness; leads uplift (antecedent down-cutting) and accelerates late.
  //  · emergence — the CONNECTION front: at the emergeFrom date the Manawatū is only a
  //                seaward embayment (the strait closing over); the channel assembles from
  //                the coast inland, continuous by emergeTo.
  static geoTimeFactors(yearsBP) {
    if (yearsBP == null) return { uplift: 1, incision: 1, emergence: 1, submergence: 0, southSink: 0, mainArm: 1, tribSpread: 0, lake: 0, age: 0 };
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
    const tc = ramp(E.tribConvergeFrom, E.tribConvergeTo);
    const lkU = ramp(E.lakeFrom, E.lakeFull), lkD = ramp(E.lakeHold, E.lakeTo);
    const ma = ramp(E.mainArmFrom, E.mainArmTo);                // main NE arm recession: 0 at ~1.02 Ma → 1 by ~0.6 Ma
    // SOUTH-HALF STRAIT pulse: rise (sink) 1 Ma → ~0.5 Ma, fall (drain) ~0.5 Ma → ~0.3 Ma.
    const ssU = ramp(E.southSinkFrom, E.southSinkFull);         // 0 at 1 Ma → 1 by the full-submergence date
    const ssD = ramp(E.southSinkHold, E.southSinkTo);           // 0 until the hold date → 1 once risen back
    const ssUp = ssU * ssU * (3 - 2 * ssU);                     // smoothstep each leg so the shore eases, not jumps
    const ssDn = ssD * ssD * (3 - 2 * ssD);
    return {
      uplift:    E.upliftStart + (1 - E.upliftStart) * Math.pow(up, 1.5),   // low basement hills at the onset, then a gentle ease-in: the axial ranges rise across ~the whole last 1 Ma, not a late-window jump
      incision:  Math.min(1, 0.2 + 0.8 * Math.pow(inc, 1.2)),       // leads uplift, accelerates late
      emergence: emg * emg * (3 - 2 * emg),                         // smoothstep connection front (coast → source)
      // MARINE EMERGENCE (Axis A): shallow-sea basin at 1 Ma → land by ~emergeTo. Smoothstep
      // 1 → 0 over the same epoch; scaled by LOOK.seaRise in _combineGeo to lower the ground
      // (raise the sea) early. Distinct from the fast glacio-eustatic ripple in Climate.seaLevel.
      submergence: sub * sub * (3 - 2 * sub),
      // STRAIT → RIVER: 1 at the old wide strait (1 Ma), 0 when closed to normal river width.
      // Scales the main stem's effective width via LOOK.straitWidthMult.
      straitFactor: 1 - sc * sc * (3 - 2 * sc),
      // TRIBUTARY FAN spread: 1 at tribConvergeFrom (1 Ma, thin streams spread across the hills)
      // → 0 at tribConvergeTo (one defined channel). Drives _tribThreads in the carve, classify and paint.
      tribSpread: 1 - tc * tc * (3 - 2 * tc),
      // WOODVILLE LAKE: 0 → 1 (full) → 0 (drained) over GEO_EPOCHS.lake*. Widens the main stem over
      // a short reach east of the gorge (_straitWide).
      lake: (lkU * lkU * (3 - 2 * lkU)) * (1 - lkD * lkD * (3 - 2 * lkD)),
      // EAST→WEST STRAIT RETREAT: 0 while the seaway still reaches across (≥~0.7 Ma) → 1 once it
      // has pulled back to its held western reach (≤~0.5 Ma). Drives the reach lerp in the combine
      // caller (LOOK.straitReachEarly→straitReachLate); smoothstepped so the shoreline eases, not jumps.
      straitRetreat: srr * srr * (3 - 2 * srr),
      // SOUTH-HALF STRAIT (Axis A): 1 (fully submerged) at the 1 Ma open → 0 (land back) by ~0.5 Ma.
      // Scales the positional south-latitude mask in _combineGeo (via _southStrength),
      // with the Tararua range subtracted out so it stays a dry peninsula. See GEO_EPOCHS.southSink*.
      southSink: ssUp * (1 - ssDn),
      // MAIN NE-ARM RECESSION (Axis, positional in downstream wPos): 0 (full inland arm, flowing
      // inland) at ~1.02 Ma → 1 (the NE reach beyond LOOK.mainArmKeep dried to land, river flowing
      // seaward) by ~0.6 Ma. Drives _mainArmPresence in the carve + paint, and the flow flip in the
      // water overlay (reversed once mainArm > 0). Smoothstepped so the arm eases back, not jumps.
      mainArm: ma * ma * (3 - 2 * ma),
      // The date itself, for the processes that run on a clock rather than a ramp (river meanders).
      age: yearsBP
    };
  }

  // RELATIVE SEA LEVEL (m) the western coast sees at yearsBP, measured against TODAY's land: the
  // eustatic curve (Climate.seaLevelAt, its own anchors, not the glacial index) PLUS the land offset
  // (landOffsetM). The glacial swing rides on top of it, so the shore sweeps the coastal plain every
  // cycle, from the range foot at highstands to the shelf at lowstands, with the lowstands baring more
  // as the offset falls toward the present (Trewick & Bland's slow layer). One rule for the window.
  static relativeSeaLevel(yearsBP) {
    if (yearsBP == null || typeof Climate === 'undefined') return 0;
    const sl = Climate.seaLevelAt ? Climate.seaLevelAt(yearsBP) : Climate.at(yearsBP).seaLevel;
    return sl + TerrainGenerator.landOffsetM(yearsBP);
  }

  // How far (m) the sea of yearsBP stood above today's land, from the eustatic level: uplift since,
  // net of the sediment that kept building the basin's surface up to sea level. Near the present it is
  // the plain's uplift (slope LOOK.plainUplift m/kyr); further back it SATURATES at LOOK.plainOffsetMax,
  // because the older plain was not today's plain lowered — it was a younger surface the basin had
  // just built at sea level. max·tanh(R·age/max). Pure (reads LOOK).
  //   Two earlier versions failed against the sources: a 400 kyr cap faded out under a positional
  //   1 → 0.5 Ma flood ran the early window at eustatic (a static coast, the north-west dry at every
  //   sea level), and an uplift-since ramp to 120 m kept even the early glacials +30 m over the whole
  //   plain, so the early coast barely moved (~4 km) and the run read as a coast expanding west.
  static landOffsetM(yearsBP) {
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const R = (L.plainUplift != null) ? L.plainUplift : 0;
    const M = (L.plainOffsetMax > 0) ? L.plainOffsetMax : 70;
    const a = (yearsBP > 0 ? yearsBP : 0) / 1000;
    return M * Math.tanh(R * a / M);
  }

  // The SIGNED coastal elevation shift for a morph year, from relative sea level in metres.
  // + at a lowstand (the baked shelf emerges to the depth the sea fell to; the low plain lifts
  // with it, so the beach band follows the coast) and − at a highstand (the low plain floods).
  // Assigned onto _geoT where the morph year is known; read per cell in _applyGeoToHeightMap.
  static glacialSeaShift(yearsBP) {
    if (yearsBP == null || typeof Climate === 'undefined') return 0;
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    if (L.seaCoast === false) return 0;
    const rsl = TerrainGenerator.relativeSeaLevel(yearsBP);
    const kS = (L.seaShelfK != null) ? L.seaShelfK : 0.00075;
    const kL = (L.seaLandK != null) ? L.seaLandK : 0.0016;
    return rsl < 0 ? -rsl * kS : -rsl * kL;
  }

  // The SHELF profile: depth (m) at a distance offshore (km) from today's coast, at latitude v
  // (0 north → 1 south). A steep inner shelf (~0.5°) to shelfInnerDepth, then a flat outer shelf
  // that steepens toward the south-west. Pure.
  static shelfDepthM(xKm, v) {
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const sI = (L.shelfInnerSlope != null) ? L.shelfInnerSlope : 8.7;
    const dI = (L.shelfInnerDepth != null) ? L.shelfInnerDepth : 50;
    const sN = (L.shelfOuterSlopeN != null) ? L.shelfOuterSlopeN : 3.0;
    const sS = (L.shelfOuterSlopeS != null) ? L.shelfOuterSlopeS : 4.5;
    const vv = v < 0 ? 0 : v > 1 ? 1 : v;
    const xI = dI / sI;
    if (xKm <= xI) return xKm * sI;
    return dI + (xKm - xI) * (sN + (sS - sN) * vv);
  }

  // Its inverse: how far offshore (km) the profile reaches a given depth. Pure.
  static shelfDistKm(depthM, v) {
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const sI = (L.shelfInnerSlope != null) ? L.shelfInnerSlope : 8.7;
    const dI = (L.shelfInnerDepth != null) ? L.shelfInnerDepth : 50;
    const sN = (L.shelfOuterSlopeN != null) ? L.shelfOuterSlopeN : 3.0;
    const sS = (L.shelfOuterSlopeS != null) ? L.shelfOuterSlopeS : 4.5;
    const vv = v < 0 ? 0 : v > 1 ? 1 : v;
    if (depthM <= 0) return 0;
    if (depthM <= dI) return depthM / sI;
    return dI / sI + (depthM - dI) / (sN + (sS - sN) * vv);
  }

  // The baked sea-floor ELEVATION for a cell `depthM` below today's sea, chosen so that a lowstand
  // of exactly that depth lifts it to the waterline through the same attenuated shift the combine
  // applies: e + seaShelfK·depth·f(e) = seaE, f(e) = smoothstep(1 − e/glacialSeaCeil). Bisection.
  static shelfFloorE(depthM, seaE) {
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const kS = (L.seaShelfK != null) ? L.seaShelfK : 0.00075;
    const gc = (L.glacialSeaCeil != null) ? L.glacialSeaCeil : 0.30;
    const lift = kS * (depthM > 0 ? depthM : 0);
    const F = (e) => { const t = 1 - e / gc; const f = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); return e + lift * f - seaE; };
    if (F(0) >= 0) return 0;                     // deeper than any sea fall the curve reaches
    let lo = 0, hi = seaE;
    for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (F(m) < 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  // How far the western coast has moved from today's, in map-width units (− = seaward), for the
  // dune belt to follow. Lowstands read the shelf profile; highstands an approximate inland creep.
  static coastShiftU(yearsBP) {
    if (yearsBP == null || typeof Climate === 'undefined') return 0;
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    if (L.seaCoast === false) return 0;
    const rsl = TerrainGenerator.relativeSeaLevel(yearsBP);
    const km = (L.frameKm > 0) ? L.frameKm : 115;
    if (rsl < 0) return -TerrainGenerator.shelfDistKm(-rsl, 0.5) / km;
    const inland = rsl * 0.0006;
    return inland > 0.08 ? 0.08 : inland;
  }

  // DROWNED-VALLEY ESTUARY strength (0..1) for a morph year, from the same relative sea level:
  // empty below estuaryRslOn, full by estuaryRslFull, so it fills the valley at highstands (more
  // readily early in the run, when the plain stood lower) and drains in the cold.
  static estuaryStrength(yearsBP) {
    if (yearsBP == null || typeof Climate === 'undefined') return 0;
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const on = (L.estuaryRslOn != null) ? L.estuaryRslOn : 5;
    const full = (L.estuaryRslFull != null) ? L.estuaryRslFull : 35;
    if (!(full > on)) return 0;
    const h = (TerrainGenerator.relativeSeaLevel(yearsBP) - on) / (full - on);
    return h < 0 ? 0 : h > 1 ? 1 : h;
  }

  // The largest estuary strength over the last LOOK.estuaryMemoryYears before yearsBP (inclusive): the
  // extent of this highstand episode's estuary, which the fill keeps after the sea falls. Pure.
  static estuaryMax(yearsBP) {
    if (yearsBP == null) return 0;
    const mem = (typeof LOOK !== 'undefined' && LOOK.estuaryMemoryYears > 0) ? LOOK.estuaryMemoryYears : 15000;
    let m = 0;
    for (let a = 0; a <= mem; a += 500) { const h = TerrainGenerator.estuaryStrength(yearsBP + a); if (h > m) m = h; }
    return m;
  }

  // STILLSTAND AGE (years) at yearsBP: how long the sea has stood within LOOK.estuaryFillRiseM of its
  // present level, looking back to the last time it was that much lower. Small while a transgression
  // is still drowning the valleys; grows through the highstand and on through the regression (the sea
  // was never lower in between). Capped at 40 kyr. Drives the estuary infill. Pure, ~160 lookups.
  static stillstandAge(yearsBP) {
    if (yearsBP == null || typeof Climate === 'undefined') return 40000;
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const rise = (L.estuaryFillRiseM > 0) ? L.estuaryFillRiseM : 8;
    const lim = TerrainGenerator.relativeSeaLevel(yearsBP) - rise;
    for (let a = 250; a <= 40000; a += 250) if (TerrainGenerator.relativeSeaLevel(yearsBP + a) < lim) return a;
    return 40000;
  }

  // GLACIAL TERMINATIONS in the window (ages, oldest first): where the glacial index falls through
  // Climate.regimeThreshold going forward in time. Each one sets the channels on a new course
  // (LOOK.meanderBelt*). Computed once from the climate curve.
  static terminations() {
    if (TerrainGenerator._terms) return TerrainGenerator._terms;
    const out = [];
    if (typeof Climate !== 'undefined' && Climate.glacialIndexAt) {
      const thr = (Climate.regimeThreshold != null) ? Climate.regimeThreshold : 0.5;
      let prevCold = Climate.glacialIndexAt(1100000) >= thr;
      for (let y = 1099500; y >= 0; y -= 500) {
        const cold = Climate.glacialIndexAt(y) >= thr;
        if (prevCold && !cold) out.push(y);
        prevCold = cold;
      }
    }
    return (TerrainGenerator._terms = out);
  }

  // The course-shift phase at yearsBP: out.k = terminations at or before it (older), out.f = 0..1 how
  // far the course has eased from cycle k−1's line to cycle k's. Writes into `out`. Pure.
  static beltPhase(yearsBP, out) {
    const T = TerrainGenerator.terminations();
    const ease = (typeof LOOK !== 'undefined' && LOOK.meanderBeltEase > 0) ? LOOK.meanderBeltEase : 3000;
    let k = 0, last = null;
    for (let i = 0; i < T.length; i++) if (T[i] >= yearsBP) { k++; last = T[i]; }
    let f = 1;
    if (last != null) { const t = (last - yearsBP) / ease; f = t >= 1 ? 1 : t * t * (3 - 2 * t); }
    out.k = k; out.f = f;
    return out;
  }

  // Combine the geo field for one cell with the deep-time factors. Pure/static so
  // the cached morph path and the direct _applyGeo share it (no divergence), and
  // tools/bootcheck.js can assert it.
  static _combineGeo(e, rMask, rH, ridge, detail, wMask, wDepth, uplift, incision, relief, incise, sea, wPos, emergence, seaLift, floodCeil, rangeGain, rangeCeil, swSub, southSub, seaFloor, wMaskM, wDepthM, patchSub, glacialSea, glacialSeaCeil, floodFlat, crest) {
    let e0 = e;                                    // pre-range LOCAL ground — the level the river follows (the relative-sea shift moves it too)
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
      // Crest texture (fBm) AFTER the ceiling, which otherwise squeezes every high cell toward rH into
      // one smooth cap. Scaled by mass and uplift, so it grows with the range.
      if (crest) lifted += crest * rMask * uplift;
      if (lifted > e) e = lifted;                  // ranges only ever lift, never dig below the base
    }
    // RELATIVE SEA (signed, in elevation units from metres — glacialSeaShift). Applied AFTER the range
    // lift (the gate's ceiling keeps ranges out anyway) and BEFORE the river carve, with the river's
    // local ground e0 shifted too, so on a shelf a lowstand has bared the river cuts its channel
    // across it to the new coast. + lifts the low western shelf/plain (the baked shelf emerges to
    // the depth the sea fell to); − sinks it (a highstand floods the low plain). Arrives WEST-gated
    // from the caller; attenuated here to 0 by glacialSeaCeil so only the coastal band moves.
    if (glacialSea !== 0 && glacialSea != null) {
      e = TerrainGenerator._seaShift(e, glacialSea, glacialSeaCeil);
      e0 = TerrainGenerator._seaShift(e0, glacialSea, glacialSeaCeil);
    }
    if (wMask > 0 || wMaskM > 0) {
      // Emergence: the channel connects from the coast (wPos 0) inland (wPos 1) as the
      // drainage assembles — at ~1.1 Ma only a seaward embayment reads as water and the
      // upstream is still land (the Manawatū Strait closing over), continuous by mid-window.
      // `conn` is the connection front; `incision` then deepens/sharpens the incised channel.
      const FEATHER = 0.15;                        // soft width of the advancing front, in downstream units
      // Growth front, HEADWARD. emergence 0 → OFF everywhere: a tributary that hasn't emerged
      // leaves the land untouched. As emergence ramps 0→1 the front sweeps from the CONFLUENCE
      // (wPos 1) up to the source (wPos 0): a stream lengthens by cutting back into the rising
      // range, so it is joined to the main at every moment (it used to grow source→main, which
      // left a stub draining into dry land until it arrived). Mains pass emergence 1.0, so this
      // is >= 1 for every wPos — unchanged for them. See TerrainGenerator._headwardPos.
      let conn = (emergence * (1 + FEATHER) - TerrainGenerator._headwardPos(wPos)) / FEATHER;
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
    // (The relative-sea shift is applied above, before the river carve.)
    return e < 0 ? 0 : e > 1 ? 1 : e;
  }

  // The relative-sea shift for one cell (elevation units; + = lowstand lift, − = highstand drop).
  //  · LOWSTAND (+): lift the low shelf/plain, attenuated to 0 by `ceil` (LOOK.glacialSeaCeil), which is
  //    what the baked shelf (_bakeShelf/shelfFloorE) solves against — so the coast lands at the depth the
  //    sea fell to.
  //  · HIGHSTAND (−): the sea rises over the land surface, so LOWER the plain by the rise.
  //    - Everything below top = seaE + depth (the height the relative sea reaches, LOOK.seaLandK per
  //      metre) drowns. It is squashed into a shallow floor [floor, seaE], keeping its order but not
  //      its relief, or the relief bake paints drowned hills as ghost cliffs under the water.
  //    - Above the contour the land drops by the full depth up to LOOK.seaHighstandHold, so the shore
  //      sits at the waterline and climbs inland at the plain's own slope.
  //    - The drop fades out over LOOK.seaHighstandFade on the range flanks; the ranges never move.
  //    Continuous and monotonic in e. Two earlier rules failed: attenuating the drop by elevation capped
  //    any highstand at ~+60 m of flooding, and dropping only the drowned ground left a cliff the
  //    height of the whole rise at every highstand shore. Pure.
  static _seaShift(e, shift, ceil) {
    if (shift > 0) {
      const gc = (ceil > 0) ? ceil : 0.30;
      if (e >= gc) return e;
      const f = 1 - e / gc;
      return e + shift * f * f * (3 - 2 * f);
    }
    if (!(shift < 0)) return e;
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const seaE = (L.seaContourE != null) ? L.seaContourE : 0.10;
    const depth = -shift, top = seaE + depth;
    const floor = 0.03;                               // shallow drowned shelf floor
    if (e <= top) return floor + (seaE - floor) * (e / top);
    let hold = (L.seaHighstandHold != null) ? L.seaHighstandHold : 0.40;
    if (hold < top) hold = top;
    if (e <= hold) return e - depth;
    const fade = (L.seaHighstandFade > 0) ? L.seaHighstandFade : 0.15;
    if (e >= hold + fade) return e;
    let g = (e - hold) / fade;
    g = g * g * (3 - 2 * g);
    return e - depth * (1 - g);
  }

  // Where a channel's growth front measures from. wPos runs 0 = source → 1 = confluence (for a
  // tributary, after the _prepGeo normalise), and the front advances HEADWARD from the
  // confluence, so the position fed to it is 1 − wPos. Mains always pass emergence 1, so the
  // flip leaves them fully present. Shared by the carve, the classify and the paint.
  static _headwardPos(wPos) { return 1 - wPos; }

  // How much of the biome-border wobble a cell gets: none at the WATERLINE, full by `width` away
  // from it. The wobble (LOOK.wobbleAmp ±0.05) brushes biome borders, but on a gentle shelf many
  // cells sit within that much of sea level, so it scattered sea and land into a speckled
  // archipelago tens of cells wide. Fading it at the sea band leaves the coast on the shelf's own
  // contour (with its mottle) while inland borders keep their brush. Pure.
  static _seaWobbleFade(e, seaE, width) {
    if (!(width > 0)) return 1;
    const d = e > seaE ? e - seaE : seaE - e;
    return d >= width ? 1 : d / width;
  }

  // A cell's parametric position along a polyline, measured from the AUTHORED first point: the
  // offshore reach (extLen, prepended in _prepGeo) sits before 0 and clamps to it. Pure.
  static _authoredPos(cum, total, extLen, endExt) {
    const ext = extLen > 0 ? extLen : 0, span = total - ext - (endExt > 0 ? endExt : 0);
    if (!(span > 0)) return 0;
    const p = (cum - ext) / span;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  }

  // The per-seed meander wobble for one river. It is added to the DISTANCE, so a wobble wider
  // than a narrow channel lifts the centre line itself past the water threshold and pinches
  // the channel shut; tributaries cap it at LOOK.tribWobbleFrac of their own width.
  static _riverWobbleFor(rv, wob) {
    if (!(wob > 0) || !rv || rv.type !== 'tributary') return wob;
    const f = (typeof LOOK !== 'undefined' && LOOK.tribWobbleFrac != null) ? LOOK.tribWobbleFrac : 0.2;
    const cap = f * (rv.width || 0.02);
    return wob < cap ? wob : cap;
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

  // RANGE PROTECTION for a positional marine term: scale `sub` by (1 − k·rMask), floored at 0, so
  // the sea laps the axial ranges instead of drowning them. At ~1 Ma the Ruahine–Tararua axis was
  // already a low emergent finger of greywacke basement (the Manawatū Strait across it had closed by
  // ~1.6 Ma; Trewick & Bland 2012, md/TEMANAWA_NATURAL_HISTORY.md §I) — so the SW strait and the
  // central patch keep off the range footprints, as the south strait always has. Pure/static.
  static _rangeProtect(sub, rMask, k) {
    if (!(sub > 0) || !(rMask > 0) || !(k > 0)) return sub;
    const pr = 1 - k * rMask;
    return pr > 0 ? sub * pr : 0;
  }

  // SOUTH-HALF submergence strength for a cell: a smooth south-ward latitude ramp — 0 north of
  // `lat`, easing to 1 by `lat + feather` (a WIDE band, so the strait's north shore is a gradual
  // slope, never a sharp drop-off) — × the temporal drain `sink` (1 at the 1 Ma open → 0 by
  // ~0.5 Ma). The caller then multiplies in the Tararua range protection. v is the vertical
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
  //
  // EAST of the gap the wide water is the Woodville LAKE instead, on its own clock (`lake`, t.lake)
  // and confined to LOOK.lakeLenU east of the gap (_lakeWindow), so the strait factor no longer
  // widens the stem across the eastern land. `lake` absent (present/mature, harness) → 0.
  static _straitWide(u, straitFactor, retreat, feather, lake) {
    const gu = (typeof LOOK !== 'undefined' && LOOK.straitGorgeU != null) ? LOOK.straitGorgeU : 0.50;
    if (u >= gu) {
      const lk = (lake > 0) ? lake : 0;
      if (lk === 0) return 0;
      return lk * TerrainGenerator._lakeWindow(u) * TerrainGenerator._gorgeOpen(u);
    }
    const sf = (straitFactor > 0) ? straitFactor : 0;
    if (sf === 0) return 0;
    return sf * TerrainGenerator._straitWideMask(u, retreat, feather) * TerrainGenerator._gorgeOpen(u);
  }

  // The main stem's width multiplier at column-fraction u: the estuary arm's straitWidthMult west of
  // the gap, the lake's lakeWidthMult east of it, each scaled by its openness (_straitWide). Every
  // site that widens the main (carve, classify, paint) goes through here so they cannot disagree.
  static _mainWidthMult(u, straitFactor, retreat, feather, lake) {
    const w = TerrainGenerator._straitWide(u, straitFactor, retreat, feather, lake);
    if (w === 0) return 1;
    const gu = (typeof LOOK !== 'undefined' && LOOK.straitGorgeU != null) ? LOOK.straitGorgeU : 0.50;
    const k = (u >= gu)
      ? ((typeof LOOK !== 'undefined' && LOOK.lakeWidthMult != null) ? LOOK.lakeWidthMult : 2.6)
      : ((typeof LOOK !== 'undefined' && LOOK.straitWidthMult != null) ? LOOK.straitWidthMult : 3.0);
    return 1 + (k - 1) * w;
  }

  // The main stem narrows upstream: 1 at the mouth (wPos 0) → 1 − LOOK.mainTaper at the authored
  // source (wPos 1), smoothstepped. Pure/static; every site that sizes the main multiplies it in.
  static _mainTaper(wPos) {
    const k = (typeof LOOK !== 'undefined' && LOOK.mainTaper > 0) ? LOOK.mainTaper : 0;
    if (k === 0) return 1;
    const p = wPos < 0 ? 0 : wPos > 1 ? 1 : wPos;
    return 1 - k * p * p * (3 - 2 * p);
  }

  // The lake's extent east of the gap (0..1 at column-fraction u): full from the gap to LOOK.lakeLenU
  // east of it, easing out over LOOK.lakeFeather. The gap side is shaped by _gorgeOpen. Pure/static.
  static _lakeWindow(u) {
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const gu = (L.straitGorgeU != null) ? L.straitGorgeU : 0.50;
    const hw = (L.straitGorgeHalfW != null) ? L.straitGorgeHalfW : 0;
    const len = (L.lakeLenU != null) ? L.lakeLenU : 0.14;
    const fw = (L.lakeFeather != null) ? L.lakeFeather : 0.05;
    const d = u - (gu + hw) - len;                     // ≤ 0 inside the lake reach
    if (d <= 0) return 1;
    if (!(fw > 0) || d >= fw) return 0;
    const t = 1 - d / fw;
    return t * t * (3 - 2 * t);
  }

  // GORGE PINCH (0..1) at column-fraction u: 0 in the gap between the ranges (the main stem stays
  // river-width there from the start), easing to 1 either side. So the wide early water is TWO
  // bodies, not a seaway across the axis: a marginal-marine ESTUARY ARM west of the gap, and to its
  // east the LAKE that uplift on the Wellington Fault ponded near Woodville from ~1 Ma, whose outlet
  // was the young gorge (Trewick & Bland 2012; Rees, Palmer & Palmer 2018). LOOK.straitGorgeU/HalfW/
  // Feather place it; halfW ≤ 0 disables (→ 1). The gap sits near the map centre, so u is robust to
  // the view zoom-out. Pure/static so all four _straitWide sites (carve, classify, paint) agree.
  // How far into Te Āpiti a column is (1 in the gap → 0 beyond LOOK.gorgeTaper). Pure.
  static _gorgeAlong(u) {
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const gu = (L.straitGorgeU != null) ? L.straitGorgeU : 0.50;
    const hw = (L.straitGorgeHalfW != null) ? L.straitGorgeHalfW : 0.04;
    const tp = (L.gorgeTaper > 0) ? L.gorgeTaper : 0.07;
    const d = Math.abs(u - gu) - hw;
    if (d <= 0) return 1;
    if (d >= tp) return 0;
    const t = 1 - d / tp;
    return t * t * (3 - 2 * t);
  }
  // The saddle's range mass at a cell: along the gap × falling off with distance from the main
  // stem's line (raw, un-noised). Joins the two ranges so they slope down to meet at the river. Pure.
  static _gorgeSaddle(u, dist) {
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    if (!(L.gorgeSaddle > 0)) return 0;
    const a = TerrainGenerator._gorgeAlong(u);
    if (a === 0) return 0;
    const r = (L.gorgeReach > 0) ? L.gorgeReach : 0.11;
    if (dist >= r) return 0;
    const t = 1 - dist / r;
    return a * t * t * (3 - 2 * t);
  }
  // Width factors in the gorge: the carved valley and the water channel narrow there. Pure.
  static _gorgeValley(u) {
    const k = (typeof LOOK !== 'undefined' && LOOK.gorgeValley != null) ? LOOK.gorgeValley : 1;
    return 1 - (1 - k) * TerrainGenerator._gorgeAlong(u);
  }
  static _gorgeDepth(u) {
    const k = (typeof LOOK !== 'undefined' && LOOK.gorgeIncise > 0) ? LOOK.gorgeIncise : 0;
    return 1 + k * TerrainGenerator._gorgeAlong(u);
  }
  static _gorgeChannel(u) {
    const k = (typeof LOOK !== 'undefined' && LOOK.gorgeChannel != null) ? LOOK.gorgeChannel : 1;
    return 1 - (1 - k) * TerrainGenerator._gorgeAlong(u);
  }

  static _gorgeOpen(u) {
    const gu = (typeof LOOK !== 'undefined' && LOOK.straitGorgeU != null) ? LOOK.straitGorgeU : 0.50;
    const hw = (typeof LOOK !== 'undefined' && LOOK.straitGorgeHalfW != null) ? LOOK.straitGorgeHalfW : 0;
    if (!(hw > 0)) return 1;
    const fw = (typeof LOOK !== 'undefined' && LOOK.straitGorgeFeather != null) ? LOOK.straitGorgeFeather : 0.05;
    const d = Math.abs(u - gu) - hw;                  // ≤ 0 inside the gap
    if (d <= 0) return 0;
    if (!(fw > 0) || d >= fw) return 1;
    const t = d / fw;
    return t * t * (3 - 2 * t);
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
  // height, ridge/detail noise, river distances) once per footprint. morphTo()
  // then only re-applies the deep-time factors over this — no distance/noise recompute.
  //
  // Rivers are two LAYERS, unioned wherever they are used (carve, classify, paint):
  //   MAIN  wMDist/wMBaseW/wMPos/wMDepth — the nearest main stem, every cell.
  //   TRIB  tJ/tS/tP/tE — the nearest tributary trunk within the fan band (tJ 255 = none): its
  //         index into _geoTribs, the cell's SIGNED distance from the trunk line, its position
  //         along it (0 source → 1 confluence) and its bank noise. _tribThreads turns these into
  //         the fan of hill streams at any deep-time spread.
  // (Until 2026-10-19 each cell kept ONE river chosen by margin, with tributary emergence and an
  // NE-arm hand-over patched on top; the fan's off-trunk streams cannot live in that selection.)
  _buildGeoCache() {
    if (!this.geo || (this._geoRanges.length === 0 && this._geoRivers.length === 0)) { this._geoCache = null; return; }
    const gc = this.gridCols, gr = this.gridRows, n = gc * gr, scale = this.scale;
    const invc = 1 / gc, invr = 1 / gr;
    const rMask = new Float32Array(n), rH = new Float32Array(n), ridge = new Float32Array(n),
          detail = new Float32Array(n), crest = new Float32Array(n);
    const rf = this._rangeFbmOut || (this._rangeFbmOut = { ridge: 0, detail: 0, crest: 0 });
    const fbmD = (typeof LOOK !== 'undefined' && LOOK.rangeFbmDetail != null) ? LOOK.rangeFbmDetail : 0.10;
    const fbmC = (typeof LOOK !== 'undefined' && LOOK.rangeCrestTex != null) ? LOOK.rangeCrestTex : 0.07;
    const wMDist = new Float32Array(n), wMBaseW = new Float32Array(n), wMPos = new Float32Array(n), wMDepth = new Float32Array(n);
    const wMS = new Float32Array(n), wME = new Float32Array(n);   // main's signed centre-line distance + bank noise (meanders)
    wMS.fill(1e6);
    const tJ = new Uint8Array(n), tS = new Float32Array(n), tP = new Float32Array(n), tE = new Float32Array(n);
    const tJ2 = new Uint8Array(n), tS2 = new Float32Array(n), tP2 = new Float32Array(n), tE2 = new Float32Array(n);   // the runner-up trunk (_tribField)
    wMDist.fill(1e6);
    tJ.fill(255); tJ2.fill(255);
    const R = this._geoRanges;
    const spine = (typeof LOOK !== 'undefined' && LOOK.rangeSpine != null) ? LOOK.rangeSpine : 0.45;
    const tf = this._tribFieldOut || (this._tribFieldOut = { j: -1, s: 0, p: 0, e: 0, j2: -1, s2: 0, p2: 0, e2: 0 });
    const gSad = (typeof LOOK !== 'undefined' && LOOK.gorgeSaddle > 0) ? LOOK.gorgeSaddle : 0;
    let gSadH = 0; for (const r of R) if (r.height > gSadH) gSadH = r.height;
    gSadH *= gSad;
    let idx = 0;
    for (let row = 0; row < gr; row++) {
      const v = row * invr, wy = row * scale;
      for (let col = 0; col < gc; col++) {
        const u = col * invc, wx = col * scale;
        let bm = 0, bh = 0, br = null;
        for (let i = 0; i < R.length; i++) { const m = this._rangeMass(R[i], u, v); if (m > bm) { bm = m; bh = R[i].height; br = R[i]; } }
        const mf = this._mainField(u, v);
        if (mf && gSad > 0) { const sm = TerrainGenerator._gorgeSaddle(u, Math.abs(mf.s)); if (sm > bm) { bm = sm; bh = gSadH; br = null; } }   // Te Āpiti: the ranges meet at the river
        rMask[idx] = bm;
        rH[idx] = (bm > 0 && br) ? bh * TerrainGenerator._spineHeight(br, u, v, spine) : bh;
        if (bm > 0) { this._rangeFbm(wx, wy, rf); ridge[idx] = rf.ridge; detail[idx] = rf.detail * fbmD; crest[idx] = rf.crest * fbmC; }
        if (mf) { wMDist[idx] = mf.d; wMBaseW[idx] = mf.w; wMPos[idx] = mf.p; wMDepth[idx] = mf.depth; wMS[idx] = mf.s; wME[idx] = mf.e; }
        if (this._tribField(u, v, tf) >= 0) {
          tJ[idx] = tf.j; tS[idx] = tf.s; tP[idx] = tf.p; tE[idx] = tf.e;
          if (tf.j2 >= 0) { tJ2[idx] = tf.j2; tS2[idx] = tf.s2; tP2[idx] = tf.p2; tE2[idx] = tf.e2; }
        }
        idx++;
      }
    }
    this._geoCache = { rMask, rH, ridge, detail, crest, wMDist, wMBaseW, wMPos, wMDepth, wMS, wME, tJ, tS, tS0: tS.slice(), tP, tE,
                       tJ2, tS2, tS02: tS2.slice(), tP2, tE2 };
    this._meanderKey = null;   // a fresh cache holds the un-meandered lines: re-apply on the next combine
  }

  // Distance + position of the nearest MAIN stem at (u,v), with the per-seed meander wobble and
  // bank noise added to the distance, as the cache stores it. Returns a reused object, or null with
  // no main stem. Shared by the cache build and the off-cache _applyGeo so they cannot diverge.
  _mainField(u, v) {
    const Rv = this._geoRivers;
    const wob = (typeof LOOK !== 'undefined' && LOOK.mainRiverWobble != null) ? LOOK.mainRiverWobble : 0;
    const eAmp = (typeof LOOK !== 'undefined' && LOOK.riverEdgeNoise != null) ? LOOK.riverEdgeNoise : 0;
    const eFreq = (typeof LOOK !== 'undefined' && LOOK.riverEdgeFreq != null) ? LOOK.riverEdgeFreq : 26;
    const ePow = (typeof LOOK !== 'undefined' && LOOK.riverEdgeNoisePow != null) ? LOOK.riverEdgeNoisePow : 2;
    const out = this._mainFieldOut || (this._mainFieldOut = { d: 0, w: 0, p: 0, depth: 1, s: 0, e: 0 });
    let best = Infinity, found = false;
    for (let i = 0; i < Rv.length; i++) {
      const rv = Rv[i];
      if (rv.type === 'tributary') continue;
      const pts = rv.pts;
      let md = Infinity, cumLen = 0, bestCumLen = 0, sgn = 1;
      for (let s = 0; s + 1 < pts.length; s++) {
        const ax = pts[s][0], ay = pts[s][1], bx = pts[s + 1][0], by = pts[s + 1][1];
        const dx = bx - ax, dy = by - ay, segLen = Math.hypot(dx, dy);
        const sd = TerrainGenerator._distToSeg(u, v, ax, ay, bx, by);
        if (sd < md) {
          md = sd;
          const l2 = dx * dx + dy * dy;
          let t = l2 > 0 ? ((u - ax) * dx + (v - ay) * dy) / l2 : 0;
          if (t < 0) t = 0; else if (t > 1) t = 1;
          bestCumLen = cumLen + t * segLen;
          sgn = (dx * (v - ay) - dy * (u - ax)) >= 0 ? 1 : -1;
        }
        cumLen += segLen;
      }
      let e = 0;
      if (wob > 0) e += (noise(u * 7 + this.seed * 3, v * 7 + this.seed * 4) * 2 - 1) * wob;
      // High-frequency bank noise: rags the waterline so banks don't trace the authored polyline.
      if (eAmp > 0) {
        const pA = TerrainGenerator._authoredPos(bestCumLen, cumLen, rv.extLen);   // bank noise scales with the channel's local width (narrower upstream and in the gorge)
        e += (noise(u * eFreq + this.seed * 17, v * eFreq + this.seed * 19) * 2 - 1) * eAmp * Math.pow(rv.width / this._mainRiverW, ePow) * TerrainGenerator._mainTaper(pA) * TerrainGenerator._gorgeChannel(u);
      }
      let d = md + e;
      if (d < 0) d = 0;
      const w = rv.width || 0.045;
      if (d / w < best) {
        best = d / w; found = true;
        out.d = d; out.w = w; out.depth = rv.depth != null ? rv.depth : 1;
        out.s = sgn * md; out.e = e;   // signed centre-line distance + bank noise, so a meander offset can move the line (_applyMeanders)
        out.p = TerrainGenerator._authoredPos(bestCumLen, cumLen, rv.extLen);
      }
    }
    return found ? out : null;
  }

  // The two nearest TRIBUTARY trunks at (u,v), each within its own band (_tribBands). For the nearer:
  // its index into _geoTribs (out.j), the SIGNED distance from its centre line (out.s; + on the left
  // of the source→mouth direction), the position along it (out.p, 0 source → 1 mouth, above 1 in the
  // mouth stub) and the bank noise (out.e: the capped wobble + the width-scaled edge noise). The same
  // for the runner-up in out.j2/s2/p2/e2 (−1 when none). TWO slots, unioned wherever a tributary is
  // drawn or carved, because channels now swing and their mouths slide (2026-10-20): a cell nearest one
  // trunk's AUTHORED line can hold another's moved water, and one slot clipped it (a parent's channel
  // gapped where a child's stub crossed it). Returns out.j, −1 outside every band. No allocation.
  _tribField(u, v, out) {
    const Tr = this._geoTribs || [];
    out.j = -1; out.j2 = -1;
    if (!Tr.length) return -1;
    if (this._tribBandV == null) this._tribBandV = this._tribBands();
    const bins = this._tribBins || this._buildTribBins();
    // Only the segments registered in this cell's bin (_buildTribBins); per tributary, the nearest of them.
    const B = bins.B;
    let bx = (u * B) | 0, by = (v * B) | 0;
    bx = bx < 0 ? 0 : bx >= B ? B - 1 : bx; by = by < 0 ? 0 : by >= B ? B - 1 : by;
    const b = by * B + bx, items = bins.items, md = bins.md, cum = bins.cum, sg = bins.sg, touched = bins.touched;
    let nT = 0;
    for (let k = bins.start[b], k1 = bins.start[b + 1]; k < k1; k++) {
      const it = items[k], j = it >>> 16, s = it & 0xffff, rv = Tr[j], pts = rv.pts;
      const ax = pts[s][0], ay = pts[s][1], ex = pts[s + 1][0], ey = pts[s + 1][1];
      const dx = ex - ax, dy = ey - ay, l2 = dx * dx + dy * dy;
      let t = l2 > 0 ? ((u - ax) * dx + (v - ay) * dy) / l2 : 0;
      if (t < 0) t = 0; else if (t > 1) t = 1;
      const qx = u - ax - dx * t, qy = v - ay - dy * t, sd = Math.sqrt(qx * qx + qy * qy);
      if (md[j] === Infinity) touched[nT++] = j;
      if (sd < md[j]) { md[j] = sd; cum[j] = rv.segCum[s] + t * rv.segLen[s]; sg[j] = (dx * (v - ay) - dy * (u - ax)) >= 0 ? 1 : -1; }
    }
    let d1 = Infinity, d2 = Infinity;
    for (let q = 0; q < nT; q++) {
      const j = touched[q], rv = Tr[j], d = md[j];
      md[j] = Infinity;                                   // reset for the next cell
      if (d >= rv.band) continue;
      // p is NOT clamped above 1: the mouth stub runs on past the mouth (p > 1), and the end gate cuts it.
      const sp = (rv.arcLen || 0) - (rv.endExt || 0), p = sp > 0 ? cum[j] / sp : 0;
      if (d < d1) {
        d2 = d1; out.j2 = out.j; out.s2 = out.s; out.p2 = out.p;
        d1 = d; out.j = j; out.s = sg[j] * d; out.p = p;
      } else if (d < d2) {
        d2 = d; out.j2 = j; out.s2 = sg[j] * d; out.p2 = p;
      }
    }
    if (out.j < 0) return -1;
    out.e = this._tribEdge(Tr[out.j], u, v);
    if (out.j2 >= 0) out.e2 = this._tribEdge(Tr[out.j2], u, v);
    return out.j;
  }

  // A spatial index for _tribField: the map in B×B bins, each listing (tributary << 16 | segment) for
  // every segment whose band reaches into it, plus per-tributary scratch for one cell's search. With a
  // dozen tributaries and swing-wide bands, testing every segment per cell cost ~8× (2026-10-20). Built
  // once per prep (after the bands), so the field is unchanged, only faster.
  _buildTribBins() {
    const Tr = this._geoTribs || [], B = 48, lists = [];
    for (let i = 0; i < B * B; i++) lists.push([]);
    for (let j = 0; j < Tr.length && j < 255; j++) {
      const rv = Tr[j], pts = rv.pts, band = rv.band;
      rv.segCum = new Float32Array(Math.max(0, pts.length - 1));
      let c = 0;
      for (let s = 0; s + 1 < pts.length; s++) {
        rv.segCum[s] = c; c += rv.segLen[s];
        const x0 = Math.min(pts[s][0], pts[s + 1][0]) - band, x1 = Math.max(pts[s][0], pts[s + 1][0]) + band;
        const y0 = Math.min(pts[s][1], pts[s + 1][1]) - band, y1 = Math.max(pts[s][1], pts[s + 1][1]) + band;
        const bx0 = Math.max(0, Math.floor(x0 * B)), bx1 = Math.min(B - 1, Math.floor(x1 * B));
        const by0 = Math.max(0, Math.floor(y0 * B)), by1 = Math.min(B - 1, Math.floor(y1 * B));
        for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) lists[by * B + bx].push((j << 16) | s);
      }
    }
    const start = new Uint32Array(B * B + 1);
    let n = 0; for (let i = 0; i < B * B; i++) { start[i] = n; n += lists[i].length; }
    start[B * B] = n;
    const items = new Uint32Array(n);
    for (let i = 0, k = 0; i < B * B; i++) for (const it of lists[i]) items[k++] = it;
    const nT = Math.max(1, Tr.length);
    return (this._tribBins = { B, start, items, md: new Float32Array(nT).fill(Infinity), cum: new Float32Array(nT), sg: new Float32Array(nT), touched: new Uint8Array(nT) });
  }

  // A tributary's bank noise at (u,v): the meander wobble capped to its width plus the edge noise
  // scaled to its width (a thin channel gets gentle banks). Added to its distance.
  _tribEdge(rv, u, v) {
    const wob = (typeof LOOK !== 'undefined' && LOOK.riverWobble != null) ? LOOK.riverWobble : 0.02;
    const eAmp = (typeof LOOK !== 'undefined' && LOOK.riverEdgeNoise != null) ? LOOK.riverEdgeNoise : 0;
    const eFreq = (typeof LOOK !== 'undefined' && LOOK.riverEdgeFreq != null) ? LOOK.riverEdgeFreq : 26;
    const ePow = (typeof LOOK !== 'undefined' && LOOK.riverEdgeNoisePow != null) ? LOOK.riverEdgeNoisePow : 2;
    let e = 0;
    const wobR = TerrainGenerator._riverWobbleFor(rv, wob);   // capped to a fraction of the width
    if (wobR > 0) e += (noise(u * 7 + this.seed * 3, v * 7 + this.seed * 4) * 2 - 1) * wobR;
    if (eAmp > 0) e += (noise(u * eFreq + this.seed * 17, v * eFreq + this.seed * 19) * 2 - 1) * eAmp * Math.pow(rv.width / this._mainRiverW, ePow);
    return e;
  }

  // Per tributary, how far from its trunk a cell can still hold one of its streams' valleys (rv.band):
  // the outermost fan stream (rank spacings plus jitter and meander), its valley, its own swing (bends
  // + course shift, within the corridor) and its parent's swing, which its mouth follows. Returns the
  // widest, for a caller that wants one number.
  _tribBands() {
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const K = Math.max(1, Math.round(L.tribFanStreams != null ? L.tribFanStreams : 5));
    const sp = (L.tribFanSpread != null) ? L.tribFanSpread : 0.034;
    const mf = (L.tribFanMeander != null) ? L.tribFanMeander : 0.3;
    const vw = (L.riverValleyWiden != null) ? L.riverValleyWiden : 1.6;
    const cMax = (L.corridorMax > 0) ? L.corridorMax : 0.12;
    const swing = (main) => Math.min(cMax, main
      ? ((L.meanderAmp != null) ? L.meanderAmp : 0.022) + ((L.meanderBeltAmp != null) ? L.meanderBeltAmp : 0)
      : ((L.tribMeanderAmp != null) ? L.tribMeanderAmp : 0.012) + ((L.tribBeltAmp != null) ? L.tribBeltAmp : 0));
    const rank = K >> 1;                                 // the outermost stream's rank
    const fan = K > 1 ? (rank + 0.25 + mf) * sp : 0;
    let widest = 0;
    for (const rv of (this._geoTribs || [])) {
      const par = rv.parent ? swing(rv.parent.type !== 'tributary') : 0;
      rv.band = fan + rv.width * vw + Math.max(swing(false), par) + 0.01;
      if (rv.band > widest) widest = rv.band;
    }
    return widest;
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
        // OFFSHORE REACH (md/TEMANAWA_COAST_PLAN.md §3.4): carry a MAIN stem's mouth on across the
        // shelf to the west edge, along its last authored heading, so at a lowstand the river runs
        // over the bared shelf to the new coast instead of stopping at today's. At today's sea level
        // the reach lies on sea floor, where the carve can only lower ground already below water, so
        // it changes nothing. wPos is measured from the AUTHORED mouth (extLen is subtracted), so
        // every wPos-keyed rule (NE-arm recession, estuary reach) is unchanged.
        let extLen = 0;
        const offU = (typeof LOOK !== 'undefined' && LOOK.riverOffshoreU != null) ? LOOK.riverOffshoreU : -0.03;
        if (rv.type !== 'tributary' && pts.length >= 2 && pts[0][0] > offU) {
          const a = pts[0], b = pts[1], dx = a[0] - b[0], dy = a[1] - b[1];
          if (dx < -1e-6) {                                // heading west at the mouth
            const t = (offU - a[0]) / dx;
            const p = [a[0] + dx * t, a[1] + dy * t];
            extLen = Math.hypot(p[0] - a[0], p[1] - a[1]);
            pts.unshift(p);
          }
        }
        return { width: (rv.width || 0.045) * s * wMult, depth: rv.depth != null ? rv.depth : 1.0, pts,
                 type: rv.type || 'main', name: rv.name || null, arcLen, extLen, endExt: 0,
                 u0, uSpan: (u1 - u0) > 1e-6 ? (u1 - u0) : 1e-6 };
      });
    // Reference width (widest MAIN stem) so per-river edge raggedness scales with channel
    // size: a thin tributary gets proportionally gentle banks, not the main's full-amplitude
    // wobble (which shredded a 0.02-wide channel into blocky islands). Floored at 0.05.
    this._mainRiverW = 0.05;
    for (const rv of this._geoRivers) if (rv.type !== 'tributary' && rv.width > this._mainRiverW) this._mainRiverW = rv.width;

    // DIRECTION NORMALISE. wPos must run from a tributary's SOURCE (0) to its confluence (1): the
    // fan streams, the meander envelope and the water overlay's flow all read the polyline in that
    // order, so a tributary drawn confluence-first would run backwards. Its confluence is the end
    // nearer ANOTHER river (the main, or for a tributary of a tributary, its parent), so reverse any
    // tributary whose first point is the nearer one. arcLen/u0/uSpan are symmetric under reversal, so
    // only pts flips. Deterministic → the sliced morph stays identical to the synchronous one.
    if (this._geoRivers.length > 1) {
      for (const rv of this._geoRivers) {
        if (rv.type !== 'tributary' || rv.pts.length < 2) continue;
        const a = rv.pts[0], b = rv.pts[rv.pts.length - 1];
        let dA = Infinity, dB = Infinity;
        for (const o of this._geoRivers) {
          if (o === rv) continue;
          const da = TerrainGenerator._distToPolyline(o.pts, a[0], a[1]); if (da < dA) dA = da;
          const db = TerrainGenerator._distToPolyline(o.pts, b[0], b[1]); if (db < dB) dB = db;
        }
        if (dA < dB) rv.pts.reverse();   // first point is the confluence → flip so the source leads
      }
    }

    // TRIBUTARY FANS: each tributary gets its stream set (_tribThreads reads it). Built here, from
    // the seed, so it survives an svg2geo regen and is identical for the sliced and synchronous morph.
    // The trunks are rounded first (Chaikin, ends kept): a stream is the trunk line offset sideways,
    // and an offset wider than a corner's radius folds back across the trunk at a sharp SVG vertex.
    this._geoTribs = this._geoRivers.filter(rv => rv.type === 'tributary');
    this._tribBandV = null;                          // _tribField's band, recomputed for these tributaries
    this._tribBins = null;                           // … and its spatial index
    const stub = (typeof LOOK !== 'undefined' && LOOK.tribMouthStub > 0) ? LOOK.tribMouthStub : 0;
    for (let j = 0; j < this._geoTribs.length; j++) {
      const rv = this._geoTribs[j];
      rv.pts = TerrainGenerator._simplifyDP(TerrainGenerator._chaikin(rv.pts, 3), 0.0006);   // round the corners, then drop the near-collinear points (a quarter-cell off at most) — _tribField walks every segment
      // MOUTH STUB: run the line on past the mouth along its last heading, so the tributary can
      // lengthen to meet a parent that has swung away (LOOK.tribMouthStub). p > 1 there; the end gate
      // (_tribEndJ) hides whatever lies beyond the parent's line.
      if (stub > 0 && rv.pts.length >= 2) {
        const a = rv.pts[rv.pts.length - 2], b = rv.pts[rv.pts.length - 1];
        const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
        rv.pts.push([b[0] + dx / l * stub, b[1] + dy / l * stub]);
        rv.endExt = stub;
      }
      let len = 0; for (let i = 0; i + 1 < rv.pts.length; i++) len += Math.hypot(rv.pts[i + 1][0] - rv.pts[i][0], rv.pts[i + 1][1] - rv.pts[i][1]);
      rv.arcLen = len;
      // Per-segment lengths and a bounding box: _tribField runs per cell over every segment, and
      // the rounding quadruples the segment count, so it skips a whole tributary outside its box
      // and never recomputes a length.
      rv.segLen = new Float32Array(Math.max(0, rv.pts.length - 1));
      let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
      for (let i = 0; i < rv.pts.length; i++) {
        const q = rv.pts[i];
        if (q[0] < u0) u0 = q[0]; if (q[0] > u1) u1 = q[0]; if (q[1] < v0) v0 = q[1]; if (q[1] > v1) v1 = q[1];
        if (i + 1 < rv.pts.length) rv.segLen[i] = Math.hypot(rv.pts[i + 1][0] - q[0], rv.pts[i + 1][1] - q[1]);
      }
      rv.box = [u0, u1, v0, v1];
    }
    this._prepJunctions();
    for (let j = 0; j < this._geoTribs.length; j++) this._geoTribs[j].threads = this._makeThreads(j);
    this._tribEndJ = new Float32Array(Math.max(1, this._geoTribs.length)).fill(1);   // per tributary: where its line ends at this date (junction)
    this._tribEndW = new Float32Array(Math.max(1, this._geoTribs.length)).fill(1);   // … and where its WATER ends (the junction, or the sea, whichever first)
    this._prepMeanders();
  }

  // JUNCTIONS: each tributary's parent is the river nearest its mouth (the main, or another tributary),
  // with the parent's position there (parentP), the parent's normal and the tributary's own tangent and
  // normal at the mouth, and its depth in the network (main 0). _meanderLUT works parents first and
  // moves each mouth with its parent. Deterministic, once per prep.
  _prepJunctions() {
    const Rv = this._geoRivers || [];
    for (const rv of Rv) { rv.parent = null; rv.netDepth = (rv.type === 'tributary') ? -1 : 0; }
    for (const rv of this._geoTribs || []) {
      const n = rv.pts.length, mi = n - (rv.endExt > 0 ? 2 : 1);   // the authored mouth (before the stub)
      if (mi < 1) continue;
      const q = rv.pts[mi], q0 = rv.pts[mi - 1];
      let best = Infinity, par = null, parCum = 0, parTot = 0, sx = 1, sy = 0;
      for (const o of Rv) {
        if (o === rv) continue;
        const P = o.pts; let cum = 0;
        const lastSeg = P.length - 1 - (o.endExt > 0 ? 1 : 0);    // never join a parent's stub
        for (let s = 0; s < lastSeg; s++) {
          const ax = P[s][0], ay = P[s][1], bx = P[s + 1][0], by = P[s + 1][1];
          const dx = bx - ax, dy = by - ay, sl = Math.hypot(dx, dy), l2 = dx * dx + dy * dy;
          let t = l2 > 0 ? ((q[0] - ax) * dx + (q[1] - ay) * dy) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
          const d = Math.hypot(q[0] - ax - dx * t, q[1] - ay - dy * t);
          if (d < best) { best = d; par = o; parCum = cum + t * sl; sx = dx / (sl || 1); sy = dy / (sl || 1); }
          cum += sl;
        }
        if (par === o) { parTot = 0; for (let s = 0; s + 1 < P.length; s++) parTot += Math.hypot(P[s + 1][0] - P[s][0], P[s + 1][1] - P[s][1]); }
      }
      if (!par) continue;
      const tl = Math.hypot(q[0] - q0[0], q[1] - q0[1]) || 1;
      rv.parent = par;
      rv.parentP = TerrainGenerator._authoredPos(parCum, parTot, par.extLen, par.endExt);
      rv.jNp = [-sy, sx];                                         // the parent's normal (its positive side)
      rv.jTc = [(q[0] - q0[0]) / tl, (q[1] - q0[1]) / tl];         // the tributary's heading into the mouth
      rv.jNc = [-rv.jTc[1], rv.jTc[0]];                            // … and its normal
      rv.span = (rv.arcLen || 1) - (rv.endExt || 0);
    }
    // Network depth (main 0, its tributaries 1, theirs 2 …) so the meander tables run parents first.
    for (let pass = 0; pass < 8; pass++)
      for (const rv of this._geoTribs || []) if (rv.netDepth < 0 && rv.parent && rv.parent.netDepth >= 0) rv.netDepth = rv.parent.netDepth + 1;
    for (const rv of this._geoTribs || []) if (rv.netDepth < 0) rv.netDepth = 1;
    this._riverOrder = Rv.map((rv, i) => i).sort((a, b) => Rv[a].netDepth - Rv[b].netDepth);
  }

  // MEANDERS — per-river envelopes and vertex frames, built once per prep. Every river gets: mEnv
  // (257 samples over its authored position p: 0..1 how freely it may wander there), cPos/cNeg (the
  // CORRIDOR: how far it may swing to either side there before it meets a range), ptP/ptN (each
  // vertex's p and unit normal, to draw the moved line for the water layer) and mOff (the live offset
  // LUT, filled per morph by _meanderLUT). Main: free on the low plain, still in the gorge, damped east
  // of it. Tributaries: still inside a range (incised), free on plain and basin, zero at the mouth (the
  // mouth follows its parent instead). No channel is pinned at a confluence (_prepJunctions).
  _prepMeanders() {
    const Rv = this._geoRivers || [];
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const gu = (L.straitGorgeU != null) ? L.straitGorgeU : 0.505;
    const hw = (L.straitGorgeHalfW != null) ? L.straitGorgeHalfW : 0.04;
    const ss = (a, b, x) => { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
    const R = this._geoRanges || [];
    const rangeAt = (u, v) => { let m = 0; for (let i = 0; i < R.length; i++) { const q = this._rangeMass(R[i], u, v); if (q > m) m = q; } return m; };
    const cT = (L.corridorRangeT > 0) ? L.corridorRangeT : 0.4;
    const cM = (L.corridorMargin != null) ? L.corridorMargin : 0.012;
    const cMax = (L.corridorMax > 0) ? L.corridorMax : 0.12;
    this._geoMain = Rv.find(r => r.type !== 'tributary') || null;
    for (const rv of Rv) {
      const isMain = rv.type !== 'tributary';
      const pts = rv.pts, n = pts.length;
      let tot = 0; const cum = [0];
      for (let i = 0; i + 1 < n; i++) { tot += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); cum.push(tot); }
      // Position along the line: the main's is clamped 0..1 past its offshore reach; a tributary's runs
      // on above 1 through its mouth stub, so the drawn line's stub can be told apart.
      const posOf = isMain ? (d) => TerrainGenerator._authoredPos(d, tot, rv.extLen)
                           : (d) => d / ((tot - (rv.endExt || 0)) || 1);
      rv.ptP = new Float32Array(n); rv.ptN = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        rv.ptP[i] = posOf(cum[i]);
        const a = pts[i > 0 ? i - 1 : i], b = pts[i + 1 < n ? i + 1 : i];
        const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
        rv.ptN[i * 2] = -dy / l; rv.ptN[i * 2 + 1] = dx / l;   // the side a positive signed distance lies on
      }
      // Dense samples for the drawn line (every ~0.006 of the map), so it follows the meanders between
      // the authored vertices: base point, authored position and unit normal per sample.
      const ns = Math.max(2, Math.ceil(tot / 0.006) + 1);
      rv.vB = new Float32Array(ns * 2); rv.vP = new Float32Array(ns); rv.vN = new Float32Array(ns * 2);
      for (let k = 0, i = 0; k < ns; k++) {
        const d = tot * k / (ns - 1);
        while (i + 2 < n && cum[i + 1] < d) i++;
        const sl = (cum[i + 1] - cum[i]) || 1, tt = (d - cum[i]) / sl;
        const ax = pts[i][0], ay = pts[i][1], bx = pts[i + 1][0], by = pts[i + 1][1];
        rv.vB[k * 2] = ax + (bx - ax) * tt; rv.vB[k * 2 + 1] = ay + (by - ay) * tt;
        rv.vP[k] = posOf(d);
        const l = Math.hypot(bx - ax, by - ay) || 1;
        rv.vN[k * 2] = -(by - ay) / l; rv.vN[k * 2 + 1] = (bx - ax) / l;
      }
      rv.mEnv = new Float32Array(257);
      rv.mOff = new Float32Array(257);
      rv.cPos = new Float32Array(257); rv.cNeg = new Float32Array(257);
      const span = tot - (rv.extLen || 0) - (rv.endExt || 0);
      for (let k = 0; k <= 256; k++) {
        const p = k / 256;
        // the authored line at p: point and unit normal
        let d = (rv.extLen || 0) + p * span, i = 0;
        while (i + 2 < n && cum[i + 1] < d) i++;
        const sl = (cum[i + 1] - cum[i]) || 1, t = (d - cum[i]) / sl;
        const u = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, v = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
        const nx = -(pts[i + 1][1] - pts[i][1]) / sl, ny = (pts[i + 1][0] - pts[i][0]) / sl;
        let env;
        if (isMain) {
          env = 1 - ss(gu - 0.14, gu - hw - 0.02, u);                     // low plain → still at the gorge
          if (u > gu) env = 0.6 * ss(gu + hw + 0.02, gu + 0.15, u);       // the Woodville basin east of it, damped
        } else {
          env = (1 - ss(0.7, 0.97, rangeAt(u, v))) * ss(0, 0.08, 1 - p);  // still inside a range proper (flanks swing); zero at the mouth
        }
        rv.mEnv[k] = env;
        // CORRIDOR: march out along each side until the ground climbs into range — past corridorRangeT,
        // or a clear rise on a channel that already runs along a flank (the Pohangina, the Tokomaru).
        // (Every 4th sample; the ones between are interpolated after the loop.)
        if (k % 4 !== 0) continue;
        const m0 = rangeAt(u, v), thr = Math.min(0.95, Math.max(cT, m0 + 0.25));
        for (let side = 0; side < 2; side++) {
          const sg = side === 0 ? 1 : -1;
          let lim = cMax;
          for (let q = 0.01; q <= cMax; q += 0.01) {
            if (rangeAt(u + nx * q * sg, v + ny * q * sg) >= thr) { lim = q - cM; break; }
          }
          if (lim < 0) lim = 0;
          if (side === 0) rv.cPos[k] = lim; else rv.cNeg[k] = lim;
        }
      }
      for (let k = 0; k <= 256; k++) {
        if (k % 4 === 0) continue;
        const k0 = k - (k % 4), k1 = k0 + 4 > 256 ? 256 : k0 + 4, f = (k - k0) / 4;
        rv.cPos[k] = rv.cPos[k0] + (rv.cPos[k1] - rv.cPos[k0]) * f;
        rv.cNeg[k] = rv.cNeg[k0] + (rv.cNeg[k1] - rv.cNeg[k0]) * f;
      }
    }
    this._riverViews = Rv.map(rv => { const m = rv.vP.length, p = new Array(m); for (let k = 0; k < m; k++) p[k] = [rv.vB[k * 2], rv.vB[k * 2 + 1]]; return { type: rv.type, width: rv.width, depth: rv.depth, src: rv, pts: p }; });
    this._meanderKey = null;
  }

  // Deterministic 1D value noise in −1..1 (an integer hash, not p5's noise): the meander LUTs are
  // rebuilt every morph, and must come out identical for the sliced and synchronous morph. Pure.
  static _vn1(x, salt) {
    const i = Math.floor(x), fx = x - i;
    const h = (k) => {
      let v = Math.imul((k | 0) ^ Math.imul(salt | 0, 0x27d4eb2d), 0x9e3779b1) >>> 0;
      v ^= v >>> 15; v = Math.imul(v, 0x85ebca6b) >>> 0; v ^= v >>> 13;
      return (v >>> 0) / 4294967295 * 2 - 1;
    };
    const t = fx * fx * (3 - 2 * fx);
    const a = h(i);
    return a + (h(i + 1) - a) * t;
  }

  // The sideways offset at authored position p (0..1) from a river's live LUT. Pure.
  static _meanderAt(lut, p) {
    if (!lut) return 0;
    const q = (p < 0 ? 0 : p > 1 ? 1 : p) * 256, i = q | 0, j = i < 256 ? i + 1 : 256;
    return lut[i] + (lut[j] - lut[i]) * (q - i);
  }

  // Fill every river's mOff for the current date (this._geoT.age), parents before their tributaries:
  //   · BENDS: a 2-octave fBm along the channel (gain 0.35, ×2.03; a third octave read as jitter on
  //     the short tributaries) whose phase drifts downstream one wavelength per LOOK.meanderPeriod kyr;
  //   · COURSE SHIFT: a long-wavelength offset, fresh for each glacial cycle, eased in after each
  //     termination (LOOK.meanderBelt*, TerrainGenerator.beltPhase);
  // both times the envelope, and the bends times the climate (glacials straighter), soft-clamped to the
  // corridor (tanh). Then each tributary's last LOOK.tribMouthBlend slides sideways with its parent's
  // offset at the junction, and its line is cut (_tribEndJ) where it meets the parent's moved line.
  // Also moves the river views the water layer draws. Returns true when the offsets changed.
  _meanderLUT() {
    const Rv = this._geoRivers || [];
    if (!Rv.length || !Rv[0].mOff) return false;
    const t = this._geoT || {};
    const age = (t.age > 0) ? t.age : 0;
    const g = (age > 0 && typeof Climate !== 'undefined' && Climate.at) ? Climate.at(age).glacialIndex : 0;
    const key = Math.round(age) + '|' + this.seed;
    if (key === this._meanderKey) return false;
    this._meanderKey = key;
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const len = (L.meanderLen > 0) ? L.meanderLen : 0.09;
    const per = (L.meanderPeriod > 0) ? L.meanderPeriod : 60;
    const climate = 1 - ((L.meanderGlacial != null) ? L.meanderGlacial : 0.45) * (g > 0 ? g : 0);
    const seedSalt = Math.floor((this.seed || 0) * 1000) | 0;
    const beltLen = (L.meanderBeltLen > 0) ? L.meanderBeltLen : 0.3;
    const bp = TerrainGenerator.beltPhase(age > 0 ? age : 0, this._beltOut || (this._beltOut = { k: 0, f: 1 }));
    const blend = (L.tribMouthBlend > 0) ? L.tribMouthBlend : 0.18;
    const order = this._riverOrder || Rv.map((_, i) => i);
    for (let oi = 0; oi < order.length; oi++) {
      const r = order[oi], rv = Rv[r], isMain = rv.type !== 'tributary';
      const A = (isMain ? ((L.meanderAmp != null) ? L.meanderAmp : 0.022) : ((L.tribMeanderAmp != null) ? L.tribMeanderAmp : 0.012)) * climate;
      const Ab = isMain ? ((L.meanderBeltAmp != null) ? L.meanderBeltAmp : 0) : ((L.tribBeltAmp != null) ? L.tribBeltAmp : 0);
      const span = (rv.arcLen || 1) - (rv.extLen || 0) - (rv.endExt || 0);
      const cyc = span / len, bcyc = span / beltLen;
      const salt = seedSalt + r * 7919;
      for (let k = 0; k <= 256; k++) {
        const x = (k / 256) * cyc - age / 1000 / per;
        let sum = 0, a = 1, fq = 1;
        for (let o = 0; o < 2; o++) { sum += a * TerrainGenerator._vn1(x * fq + o * 13.7, salt + o * 31); a *= 0.35; fq *= 2.03; }   // two smooth octaves: meanders are loops, not jitter
        let off = A * (sum / 1.35);
        if (Ab > 0) {
          const xb = (k / 256) * bcyc;
          const b0 = TerrainGenerator._vn1(xb + bp.k * 3.17 - 3.17, salt + 7777 + (bp.k - 1) * 131);
          const b1 = TerrainGenerator._vn1(xb + bp.k * 3.17, salt + 7777 + bp.k * 131);
          off += Ab * (b0 + (b1 - b0) * bp.f);
        }
        off *= rv.mEnv[k];
        const lim = off > 0 ? rv.cPos[k] : rv.cNeg[k];            // the corridor: never into a range
        off = lim > 1e-6 ? lim * Math.tanh(off / lim) : 0;
        rv.mOff[k] = off;
      }
      // JUNCTION: slide the mouth with the parent, and end the line at the parent's moved line.
      const j = this._geoTribs ? this._geoTribs.indexOf(rv) : -1;
      if (j >= 0 && rv.parent && rv.parent.mOff) {
        const op = TerrainGenerator._meanderAt(rv.parent.mOff, rv.parentP);
        const Jx = rv.jNp[0] * op, Jy = rv.jNp[1] * op;
        const nu = Jx * rv.jNc[0] + Jy * rv.jNc[1], tau = Jx * rv.jTc[0] + Jy * rv.jTc[1];
        for (let k = 0; k <= 256; k++) {
          let w = (k / 256 - (1 - blend)) / blend; if (w <= 0) continue; if (w > 1) w = 1;
          rv.mOff[k] += nu * w * w * (3 - 2 * w);
        }
        // First-order end (the parent's tangential move); refined to the true crossing below.
        if (this._tribEndJ && j < this._tribEndJ.length) this._tribEndJ[j] = 1 + tau / ((rv.span > 0) ? rv.span : 1);
      }
    }
    // The drawn lines (water decals, eels, fish) follow the moved channels.
    const V = this._riverViews;
    if (V) for (let r = 0; r < Rv.length; r++) {
      const rv = Rv[r], vp = V[r].pts;
      for (let k = 0; k < vp.length; k++) {
        const o = TerrainGenerator._meanderAt(rv.mOff, rv.vP[k]);
        vp[k][0] = rv.vB[k * 2] + rv.vN[k * 2] * o;
        vp[k][1] = rv.vB[k * 2 + 1] + rv.vN[k * 2 + 1] * o;
      }
    }
    if (V) this._refineJunctionEnds(V, blend);
    this._meanderRev = (this._meanderRev || 0) + 1;
    return true;
  }

  // Each tributary's line ENDS where its moved line first crosses its parent's moved line, searched
  // from its last 2·tribMouthBlend through the mouth stub against the parent's line near the junction.
  // A parent's bends are tight, so the first-order end (_meanderLUT) can miss by a channel width; this
  // finds the real crossing. Keeps the first-order end when the lines do not cross. No allocation.
  _refineJunctionEnds(V, blend) {
    const Rv = this._geoRivers, Tr = this._geoTribs || [], endJ = this._tribEndJ;
    if (!endJ) return;
    for (let j = 0; j < Tr.length && j < endJ.length; j++) {
      const rv = Tr[j], par = rv.parent;
      if (!par) continue;
      const cv = V[Rv.indexOf(rv)].pts, cP = rv.vP, pv = V[Rv.indexOf(par)].pts, pP = par.vP;
      let found = false;
      for (let k = 0; k + 1 < cv.length && !found; k++) {
        if (cP[k + 1] < 1 - 2 * blend) continue;
        const ax = cv[k][0], ay = cv[k][1], bx = cv[k + 1][0], by = cv[k + 1][1];
        for (let m = 0; m + 1 < pv.length; m++) {
          if (Math.abs(pP[m] - rv.parentP) > 0.3) continue;
          const cx = pv[m][0], cy = pv[m][1], dx = pv[m + 1][0], dy = pv[m + 1][1];
          const den = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
          if (Math.abs(den) < 1e-12) continue;
          const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / den;
          const s = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / den;
          if (t >= 0 && t <= 1 && s >= 0 && s <= 1) { endJ[j] = cP[k] + (cP[k + 1] - cP[k]) * t; found = true; break; }
        }
      }
    }
  }

  // Move the cached channels to the current date's meanders: the main stem's distance field
  // (wMDist, from its signed distance wMS + bank noise wME) and the tributary trunks' signed distance
  // (tS, from the raw tS0). Everything downstream (carve, classify, paint, estuary) reads the moved
  // fields unchanged. ~n cheap cells per morph; no allocation.
  _applyMeanders() {
    const c = this._geoCache;
    if (!c || !c.wMS) return;
    this._meanderLUT();
    const M = this._geoMain, Tr = this._geoTribs || [];
    const wMS = c.wMS, wME = c.wME, wMP = c.wMPos, wMD = c.wMDist, tJ = c.tJ, tS = c.tS, tS0 = c.tS0, tP = c.tP;
    const tJ2 = c.tJ2, tS2 = c.tS2, tS02 = c.tS02, tP2 = c.tP2;
    const lutM = M ? M.mOff : null, n = wMD.length;
    for (let i = 0; i < n; i++) {
      const sm = wMS[i];
      if (lutM && sm > -0.4 && sm < 0.4) {
        const d = Math.abs(sm - TerrainGenerator._meanderAt(lutM, wMP[i])) + wME[i];
        wMD[i] = d < 0 ? 0 : d;
      }
      const j = tJ[i];
      if (j !== 255) tS[i] = tS0[i] - TerrainGenerator._meanderAt(Tr[j].mOff, tP[i]);
      const j2 = tJ2[i];
      if (j2 !== 255) tS2[i] = tS02[i] - TerrainGenerator._meanderAt(Tr[j2].mOff, tP2[i]);
    }
  }

  // Douglas–Peucker: the fewest points of a polyline that stay within eps of it, ends kept. Pure.
  static _simplifyDP(pts, eps) {
    if (pts.length < 3) return pts;
    const keep = new Uint8Array(pts.length); keep[0] = 1; keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop();
      let md = -1, mi = -1;
      for (let i = a + 1; i < b; i++) {
        const d = TerrainGenerator._distToSeg(pts[i][0], pts[i][1], pts[a][0], pts[a][1], pts[b][0], pts[b][1]);
        if (d > md) { md = d; mi = i; }
      }
      if (md > eps) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
    }
    return pts.filter((_, i) => keep[i]);
  }

  // Chaikin corner-cutting, `iter` passes, first and last points kept. Pure/static.
  static _chaikin(pts, iter) {
    let p = pts;
    for (let it = 0; it < iter && p.length > 2; it++) {
      const q = [p[0]];
      for (let i = 0; i + 1 < p.length; i++) {
        const a = p[i], b = p[i + 1];
        if (i > 0) q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
        if (i + 2 < p.length) q.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
      }
      q.push(p[p.length - 1]);
      p = q;
    }
    return p;
  }

  // A tributary's AUTHORED line at position p (0 source → 1 mouth): point and unit normal (the side a
  // positive signed distance lies on), written into out. No allocation.
  _lineAt(rv, p, out) {
    const pts = rv.pts, sl = rv.segLen, span = (rv.arcLen || 1) - (rv.endExt || 0);
    let d = (p > 0 ? p : 0) * span, i = 0;
    while (i + 2 < pts.length && d > sl[i]) { d -= sl[i]; i++; }
    const L = sl[i] || 1, t = d / L > 1 ? 1 : d / L;
    const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1];
    out.u = pts[i][0] + dx * t; out.v = pts[i][1] + dy * t;
    out.nx = -dy / L; out.ny = dx / L;
    return out;
  }

  // The stream set for tributary j: thread 0 is the trunk (the authored line); the rest are hill
  // streams set off to alternating sides at about 1, 1, 2, 2 … × LOOK.tribFanSpread, each starting
  // a little way down from the source (p0) and drawing in to the trunk by its own point (pc), so
  // they join at different places instead of one bird's foot. Each carries a meander table over
  // p (65 samples, −1..1). A stream's HEAD must lie off the map (its catchment beyond the frame) or on
  // range ground (range mass ≥ 0.5): a head that would land on the plain moves up toward the source
  // until it does, so no stream rises out of open sand (2026-10-20). Deterministic per seed.
  _makeThreads(j) {
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const K = Math.max(1, Math.round(L.tribFanStreams != null ? L.tribFanStreams : 5));
    const rv = this._geoTribs[j], R = this._geoRanges || [];
    const sp = (L.tribFanSpread != null) ? L.tribFanSpread : 0.03;
    const q = this._lineAtOut || (this._lineAtOut = { u: 0, v: 0, nx: 0, ny: 0 });
    const headOK = (p, off) => {
      this._lineAt(rv, p, q);
      const u = q.u + q.nx * off * sp, v = q.v + q.ny * off * sp;
      if (!(u >= 0 && u < 1 && v >= 0 && v < 1)) return true;
      for (let i = 0; i < R.length; i++) if (this._rangeMass(R[i], u, v) >= 0.5) return true;
      return false;
    };
    const hash = (a, b) => { let h = (Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(this.seed | 0, 83492791)) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; h ^= h >>> 15; return (h >>> 0) / 0xffffffff; };
    const threads = [];
    for (let k = 0; k < K; k++) {
      const mz = new Float32Array(65);
      for (let q = 0; q < 65; q++) mz[q] = noise(q * 0.09 + k * 13.7 + this.seed * 0.37, j * 7.1 + this.seed * 0.91) * 2 - 1;
      if (k === 0) { threads.push({ off: 0, p0: 0, pc: 1, mz }); continue; }
      const rank = (k + 1) >> 1, side = (k & 1) ? 1 : -1;
      const off = side * (rank + (hash(j * 31 + k, 1) - 0.5) * 0.7);   // in spacings, ±0.35
      let p0 = 0.04 + hash(j * 31 + k, 2) * 0.28;                     // starts a little below the source …
      while (p0 > 0 && !headOK(p0, off)) p0 -= 0.02;                   // … but never on the plain
      threads.push({
        off,
        p0: p0 > 0 ? p0 : 0,
        pc: 0.55 + hash(j * 31 + k, 3) * 0.35,                    // fully merged by here
        mz
      });
    }
    return threads;
  }

  // The paint pass's bilinear sample of tributary j's signed distance / position / bank noise over a
  // sim cell's four corners, reading whichever of the two slots holds j at each corner. Returns false
  // (out untouched) when a corner holds neither, so the caller falls back to the nearest corner. Pure.
  static _paintTribSample(C, j, a00, a10, a01, a11, w00, w10, w01, w11, out) {
    const J1 = C.tJ, J2 = C.tJ2;
    let s = 0, p = 0, e = 0;
    for (let c = 0; c < 4; c++) {
      const a = c === 0 ? a00 : c === 1 ? a10 : c === 2 ? a01 : a11;
      const w = c === 0 ? w00 : c === 1 ? w10 : c === 2 ? w01 : w11;
      if (J1[a] === j) { s += C.tS[a] * w; p += C.tP[a] * w; e += C.tE[a] * w; }
      else if (J2 && J2[a] === j) { s += C.tS2[a] * w; p += C.tP2[a] * w; e += C.tE2[a] * w; }
      else return false;
    }
    out.s = s; out.p = p; out.e = e;
    return true;
  }

  // The narrowest a tributary channel may be (map fraction): LOOK.tribMinCells sim cells. A minor
  // stream's headwaters and the 1 Ma fan threads fell under one cell once the tributaries were thinned
  // (2026-10-20), and a sub-cell channel beads into dots. Same floor for carve, classify and paint.
  _tribMinWidth() {
    const c = (typeof LOOK !== 'undefined' && LOOK.tribMinCells > 0) ? LOOK.tribMinCells : 0;
    const g = Math.min(this.gridCols || 0, this.gridRows || 0);
    return (c > 0 && g > 0) ? c / g : 0;
  }

  // The level biome the Opiki cycle's forested fill takes (LOOK.estuaryForestBiome), or null.
  _estForestBiome() {
    const key = (typeof LOOK !== 'undefined' && LOOK.estuaryForestBiome) || 'podocarp';
    if (this._estForestKey !== key || this._estForestList !== this.biomeList) {
      this._estForestKey = key; this._estForestList = this.biomeList;
      this._estForestB = (this.biomeList || []).find(b => b.key === key) || null;
    }
    return this._estForestB;
  }

  // Strongest water/valley mask (0..1) of a tributary's stream set at one cell. `s` is the cell's
  // signed distance from the trunk's centre line, `p` its position along the trunk (0 source → 1
  // confluence), `edge` its cached bank noise, sized for the trunk's FULL width `wRef` and scaled to
  // each stream's own width (the old single channel added it whole; a thin stream would pinch shut). Stream k sits at offset (off·spacing + meander)·spread·taper(p) and has width
  // `wThread`, except the trunk, which has `wTrunk`. taper eases to 0 approaching pc, so each stream
  // runs into the trunk; spread 0 puts every stream on the trunk, i.e. one channel. `pEnd` (optional)
  // ends the channel at that position: at its parent's moved line, or where the sea cut it (the mouth
  // stub beyond is never drawn). Pure/static.
  static _tribThreads(s, p, threads, spread, wTrunk, wThread, edge, wRef, pEnd, minW) {
    let gate = 1;
    if (pEnd != null) {
      if (p >= pEnd) return 0;
      if (p > pEnd - 0.012) gate = (pEnd - p) / 0.012;
    }
    const eK = (wRef > 0) ? 1 / wRef : 0;
    const L = (typeof LOOK !== 'undefined') ? LOOK : {};
    const sp = (L.tribFanSpread != null) ? L.tribFanSpread : 0.03;
    const mA = ((L.tribFanMeander != null) ? L.tribFanMeander : 0.3) * sp;
    const span = (L.tribFanTaper > 0) ? L.tribFanTaper : 0.45;
    let best = 0;
    const qf = (p < 0 ? 0 : p > 1 ? 1 : p) * 64, q0 = qf | 0, q1 = q0 < 64 ? q0 + 1 : 64, qt = qf - q0;
    const hw = (L.tribHeadWidth > 0) ? L.tribHeadWidth : 1, pc = p < 0 ? 0 : p > 1 ? 1 : p;
    const mw = minW > 0 ? minW : 0;                   // never narrower than the grid can hold (_tribMinWidth)
    let wTr = wTrunk * (hw + (1 - hw) * pc);         // the trunk widens downstream, source → mouth
    if (wTr < mw) wTr = mw;
    for (let k = 0; k < threads.length; k++) {
      const th = threads[k];
      let o = 0, pres = 1, w = wTr;
      if (k > 0) {
        if (!(spread > 0)) continue;                 // a closed fan is the trunk alone
        w = wThread < mw ? mw : wThread;
        if (p < th.p0) continue;
        let a = (p - th.p0) / 0.06; if (a < 1) pres = a * a * (3 - 2 * a);   // a soft head, not a cut end
        let tp = (th.pc - p) / span; tp = tp <= 0 ? 0 : tp >= 1 ? 1 : tp * tp * (3 - 2 * tp);
        const mz = th.mz[q0] + (th.mz[q1] - th.mz[q0]) * qt;
        o = (th.off * sp + mz * mA) * spread * tp;
      }
      if (!(w > 0)) continue;
      let d = s - o; if (d < 0) d = -d;
      d += eK > 0 ? edge * w * eK : edge; if (d < 0) d = 0;   // bank noise scaled to this stream's width, or it pinches a thin one shut
      if (d >= w) continue;
      const tt = 1 - d / w;
      const m = tt * tt * (3 - 2 * tt) * pres;
      if (m > best) best = m;
    }
    return best * gate;
  }

  // The fan's two widths at a deep-time spread: an early stream is LOOK.tribFanThread of the trunk's
  // final width; the trunk itself grows from that to its full width as the fan closes. `out` is a
  // reused [trunk, thread] pair (no allocation in the morph). `spread` is the effective spread
  // (residual included); `close` is 1 − the raw time factor, so a residual fan still lets the trunk
  // reach full width. Pure/static.
  static _tribWidths(baseW, close, out) {
    const f = (typeof LOOK !== 'undefined' && LOOK.tribFanThread != null) ? LOOK.tribFanThread : 0.5;
    const c = close < 0 ? 0 : close > 1 ? 1 : close;
    out[0] = baseW * (f + (1 - f) * c);
    out[1] = baseW * f;
    return out;
  }

  // The effective fan spread for the time factors: the raw t.tribSpread (1 at 1 Ma → 0) lifted by
  // LOOK.tribFanResidual so a residual fan can persist to the present. Pure/static.
  static _tribSpreadEff(t) {
    const raw = (t && t.tribSpread > 0) ? t.tribSpread : 0;
    const r = (typeof LOOK !== 'undefined' && LOOK.tribFanResidual > 0) ? LOOK.tribFanResidual : 0;
    return r + (1 - r) * raw;
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
    this._applyMeanders();                        // move the channels to this date's meanders first
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
    // The main stem widens into the estuary arm west of the gap and the lake east of it
    // (_mainWidthMult, per cell from u).
    const srFeather = (typeof LOOK !== 'undefined' && LOOK.straitRetreatFeather != null) ? LOOK.straitRetreatFeather : 0.08;
    const straitRetreat = t.straitRetreat;
    const straitF = (t.straitFactor != null) ? t.straitFactor : 0;   // temporal thinning
    const lake = (t.lake > 0) ? t.lake : 0;                           // Woodville lake, east of the gap
    const valleyWiden = (typeof LOOK !== 'undefined' && LOOK.riverValleyWiden != null) ? LOOK.riverValleyWiden : 2.4;
    // TRIBUTARY FANS: the deep-time spread and the two stream widths per tributary (valley scale).
    const tSpread = TerrainGenerator._tribSpreadEff(t);
    const tClose = 1 - ((t.tribSpread > 0) ? t.tribSpread : 0);
    const Tr = this._geoTribs || [], tW2 = this._tribW2 || (this._tribW2 = [0, 0]);
    const tWT = this._tribWT || (this._tribWT = new Float32Array(256)), tWB = this._tribWB || (this._tribWB = new Float32Array(256));
    for (let j = 0; j < Tr.length && j < 256; j++) { TerrainGenerator._tribWidths(Tr[j].width, tClose, tW2); tWT[j] = tW2[0]; tWB[j] = tW2[1]; }
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
    // SOUTH-HALF strait (Axis A): 1 (sunk) at the 1 Ma open → 0 (drained) by ~0.5 Ma. Positional in v,
    // with the Tararua range mass subtracted out (southProtect) so the range stays a dry peninsula.
    const southSink = ((t.southSink > 0) ? t.southSink : 0) * ((typeof LOOK !== 'undefined' && LOOK.southSinkAmt != null) ? LOOK.southSinkAmt : 1);   // LOOK.southSinkAmt: 0 retires the positional strait (relative sea level floods the south instead)
    const southLat = (typeof LOOK !== 'undefined' && LOOK.southSinkLat != null) ? LOOK.southSinkLat : 0.45;
    const southFeather = (typeof LOOK !== 'undefined' && LOOK.southSinkFeather != null) ? LOOK.southSinkFeather : 0.22;
    const southProtect = (typeof LOOK !== 'undefined' && LOOK.southSinkProtect != null) ? LOOK.southSinkProtect : 1;
    const seaProtect = (typeof LOOK !== 'undefined' && LOOK.seaRangeProtect != null) ? LOOK.seaRangeProtect : 1;   // SW strait + patch keep off the ranges too
    const southWob = (typeof LOOK !== 'undefined' && LOOK.southSinkWobble != null) ? LOOK.southSinkWobble : 0.05;
    const southEastU = (typeof LOOK !== 'undefined' && LOOK.southSinkEastU != null) ? LOOK.southSinkEastU : 0;   // EAST→WEST fill taper
    const southEastF = (typeof LOOK !== 'undefined' && LOOK.southSinkEastFeather != null) ? LOOK.southSinkEastFeather : 0.3;
    // Mottle the drowned SEA FLOOR and MEANDER the strait's north shore with the cached wobble field,
    // so the submergence reads as varied open water with a natural (not latitude-straight) coast —
    // not a flat square slab. Cached (deterministic) → the sliced morph stays identical to the sync one.
    const seaWob = (southSink > 0 || sub > 0) ? this._simWobbleField() : null;
    const rMask = c.rMask, rH = c.rH, ridge = c.ridge, detail = c.detail, crestArr = c.crest;
    const wMDistArr = c.wMDist, wMBaseWArr = c.wMBaseW, wMDepthArr = c.wMDepth, wMPosArr = c.wMPos;   // the MAIN layer
    const tJArr = c.tJ, tSArr = c.tS, tPArr = c.tP, tEArr = c.tE;                                       // the TRIBUTARY layer
    const tJ2Arr = c.tJ2, tS2Arr = c.tS2, tP2Arr = c.tP2, tE2Arr = c.tE2;                               // … its runner-up slot
    const endJ = this._tribEndJ;                                                                         // each tributary ends at its parent's moved line
    const minWV = this._tribMinWidth() * valleyWiden;                                                     // the channel-width floor, at valley scale
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
    // Dune shoreline tracks the moving coast: a lowstand pulls the belt's shore seaward (coastX down)
    // so the dunes march onto the bared shelf (Koputaroa mode). coastShiftU is that move in map
    // units, read off the same shelf profile the coast was baked with.
    const dTrack = (typeof LOOK !== 'undefined' && LOOK.duneCoastTrack != null) ? LOOK.duneCoastTrack : 0;
    const dCoastX = ((typeof LOOK !== 'undefined' && LOOK.coastInland != null) ? LOOK.coastInland : 0.02) + (t.coastShiftU || 0) * dTrack;
    const gSeaCeil = (typeof LOOK !== 'undefined' && LOOK.glacialSeaCeil != null) ? LOOK.glacialSeaCeil : 0.30;
    const gSeaEastU = (typeof LOOK !== 'undefined' && LOOK.glacialSeaEastU != null) ? LOOK.glacialSeaEastU : 0.48;
    const gSeaFullU = (typeof LOOK !== 'undefined' && LOOK.glacialSeaFullU != null) ? LOOK.glacialSeaFullU : 0.36;
    const gSeaOn = glacialSea !== 0 && gSeaEastU > 0;
    // DROWNED-VALLEY ESTUARY (highstand, positional up the main stem). Follows wMDist/wMPos.
    const highstand = (t.estuary != null) ? t.estuary : 0;
    const estReach = (typeof LOOK !== 'undefined' && LOOK.estuaryReach != null) ? LOOK.estuaryReach : 0;
    const estWidth = (typeof LOOK !== 'undefined' && LOOK.estuaryWidth != null) ? LOOK.estuaryWidth : 0;
    const estCeil = (typeof LOOK !== 'undefined' && LOOK.estuaryCeil != null) ? LOOK.estuaryCeil : 0.24;
    // THE OPIKI CYCLE (LOOK.estuaryTrib*, estuaryFill*, estuarySwamp*, estuaryForest*): a tributary that
    // joins the main within the drowned reach drowns its own lower valley as an estuary branch (estG:
    // its strength, from the main's at the junction); then, as the sea stands still (t.estFillAge), the
    // drowned floor fills from its shallow margins and heads toward the deep mouth, and each filled
    // cell is tidal flat / swamp, later a swamp + forest mosaic (_estState, read by the classify/paint).
    const LK = (typeof LOOK !== 'undefined') ? LOOK : {};
    const estTW = (LK.estuaryTribWidth > 0) ? LK.estuaryTribWidth : 0.05;
    const estTR = (LK.estuaryTribReach > 0) ? LK.estuaryTribReach : 0.45;
    // The fill keeps a MEMORY: its region is the largest estuary of the last estuaryMemoryYears (hsMax), so
    // when the sea falls after the peak the filled plain stays swamp and forest instead of reverting.
    const hsMax = Math.max(highstand, (t.estMax > 0) ? t.estMax : 0);
    const estAny = hsMax > 0 && estReach > 0 && estWidth > 0 && !!wMDistArr && !!wMPosArr;
    const estGN = this._estGN || (this._estGN = new Float32Array(256)), estGM = this._estGM || (this._estGM = new Float32Array(256));
    let estBranch = false;
    for (let j = 0; j < Tr.length && j < 256; j++) {
      estGN[j] = 0; estGM[j] = 0;
      const rv = Tr[j];
      if (!estAny || !rv.parent || rv.parent.type === 'tributary') continue;
      for (let h2 = 0; h2 < 2; h2++) {
        const h = h2 === 0 ? highstand : hsMax, reach = estReach * h;
        if (!(reach > 0) || rv.parentP >= reach) continue;
        let rf = 1 - rv.parentP / reach; rf = rf * rf * (3 - 2 * rf);
        if (h2 === 0) estGN[j] = h * rf; else estGM[j] = h * rf;
        if (h * rf > 0) estBranch = true;
      }
    }
    // How hard the estuary of strength h drowns cell i (main valley + tributary branches, G: the branch gates).
    const esAt = (h, G, i, eg, tj, tj2) => {
      let es = 0;
      const reach = estReach * h, dM = wMDistArr[i];
      if (reach > 0 && dM < estWidth && wMPosArr[i] < reach) {
        let prox = 1 - dM / estWidth; prox = prox * prox * (3 - 2 * prox);           // near the channel
        let rf = 1 - wMPosArr[i] / reach; rf = rf * rf * (3 - 2 * rf);                // fades up-valley (inland)
        es = h * prox * rf * eg;
      }
      // Estuary BRANCHES up the tributaries that join within the drowned reach (both slots).
      if (estBranch) for (let sl = 0; sl < 2; sl++) {
        const tb = sl === 0 ? tj : tj2;
        if (tb === 255 || !(G[tb] > 0)) continue;
        const sx = Math.abs(sl === 0 ? tSArr[i] : tS2Arr[i]);
        if (sx >= estTW) continue;
        const pb = sl === 0 ? tPArr[i] : tP2Arr[i];
        const up = (1 - (pb > 1 ? 1 : pb)) / estTR;                                   // 0 at the mouth → 1 at the branch head
        if (up >= 1) continue;
        let px = 1 - sx / estTW; px = px * px * (3 - 2 * px);
        let ru = 1 - up; ru = ru * ru * (3 - 2 * ru);
        const eb = G[tb] * px * ru * eg;
        if (eb > es) es = eb;
      }
      return es;
    };
    const fillA = (t.estFillAge > 0) ? t.estFillAge : 0;
    const fillYears = (LK.estuaryFillYears > 0) ? LK.estuaryFillYears : 7000;
    const fillMax = (LK.estuaryFillMax != null) ? LK.estuaryFillMax : 0.85;
    const fillF = Math.min(fillMax, fillA / fillYears);
    const fillElev = (LK.estuaryFillElev != null) ? LK.estuaryFillElev : 0.125;
    const swampY = (LK.estuarySwampYears != null) ? LK.estuarySwampYears : 1500;
    const forestY = (LK.estuaryForestYears > 0) ? LK.estuaryForestYears : 4000;
    const forestMax = (LK.estuaryForestMax != null) ? LK.estuaryForestMax : 0.6;
    const waterE = (this._waterBiome && this._waterBiome.maxElevation != null) ? this._waterBiome.maxElevation : 0.10;
    const fillOn = estAny && fillF > 0;
    const estRegionMin = (LK.estuaryRegionMin > 0) ? LK.estuaryRegionMin : 0.25;   // the envelope's edge
    const flatsElev = (LK.estuaryFlatsElev > 0) ? LK.estuaryFlatsElev : 0.17;        // exposed estuary floor lies below this
    const fallen = hsMax > highstand + 0.05;                                          // the sea has dropped from the episode's peak
    const fillWob = fillOn ? this._simWobbleField() : null;
    const nCells = this.gridRows * this.gridCols;
    if (!this._estState || this._estState.length !== nCells) this._estState = new Uint8Array(nCells); else this._estState.fill(0);
    const estState = this._estState;
    const gr = this.gridRows, gc = this.gridCols, invr = 1 / gr, invc = 1 / gc, edgeMargin = this._geoEdgeMargin, topMargin = this._geoTopMargin;
    let i = 0;
    for (let row = 0; row < gr; row++) {
      const v = row * invr;
      for (let col = 0; col < gc; col++, i++) {
        const u = col * invc;
        // INCISION valley masks (drive _combineGeo's carve, NOT the water/bank paint): wider than
        // the water ribbon with a smooth taper, so the gorge reads as a gentle valley with sloping
        // shoulders instead of a jagged slot chasing the ragged (edge-noised) waterline. Water
        // classification stays narrow (_rebuildBiomeMap). The two layers carve independently and
        // _combineGeo takes the deeper bed, so a tributary fan running into the main valley meets it.
        //   MAIN: widened by the estuary arm / lake, faded where the NE arm has dried.
        let wMaskM = 0, wDepthM = 1;
        const dM = wMDistArr[i];
        if (dM < 1) {
          const valleyWM = wMBaseWArr[i] * TerrainGenerator._gorgeValley(u) * TerrainGenerator._mainTaper(wMPosArr[i]) * TerrainGenerator._mainWidthMult(u, straitF, straitRetreat, srFeather, lake) * valleyWiden;
          if (dM < valleyWM) {
            const tt = 1 - dM / valleyWM; wMaskM = tt * tt * (3 - 2 * tt); wDepthM = wMDepthArr[i] * TerrainGenerator._gorgeDepth(u);
            if (mainArm > 0) wMaskM *= TerrainGenerator._mainArmPresence(wMPosArr[i], mainArm, mArmKeep, mArmFeather);   // un-jittered position: a clean end at the eastern confluence
          }
        }
        //   TRIBUTARY: the fan of hill streams at this date (one channel once it has closed).
        let wMask = 0;
        const tj = tJArr[i];
        if (tj !== 255) wMask = TerrainGenerator._tribThreads(tSArr[i], tPArr[i], Tr[tj].threads, tSpread, tWT[tj] * valleyWiden, tWB[tj] * valleyWiden, tEArr[i], Tr[tj].width * valleyWiden, endJ[tj], minWV);
        const tj2 = tJ2Arr ? tJ2Arr[i] : 255;
        if (tj2 !== 255) {
          const m2 = TerrainGenerator._tribThreads(tS2Arr[i], tP2Arr[i], Tr[tj2].threads, tSpread, tWT[tj2] * valleyWiden, tWB[tj2] * valleyWiden, tE2Arr[i], Tr[tj2].width * valleyWiden, endJ[tj2], minWV);
          if (m2 > wMask) wMask = m2;
        }
        const wv = seaWob ? seaWob[i] : 0;
        const seaFloor = 0.02 + wv * 0.015;                   // mottled deep floor (~0.005–0.035, all sea)
        const swSub = TerrainGenerator._rangeProtect(TerrainGenerator._swStrength(u, v, sub, swReach, swFeather), rMask[i], seaProtect);   // the axis stays a low emergent finger
        let southSub = TerrainGenerator._southStrength(v + wv * southWob, southSink, southLat, southFeather);   // meander the shore off the straight latitude line
        if (southSub > 0) { const pr = 1 - southProtect * rMask[i]; southSub *= pr > 0 ? pr : 0; }   // Tararua stays a dry peninsula
        if (southSub > 0 && southEastU > 0) southSub *= TerrainGenerator._southEastFade(u, southEastU, southEastF);   // EAST→WEST fill: east emerges first
        const patchSub = TerrainGenerator._rangeProtect(TerrainGenerator._patchStrength(u + wv * southWob, v, sub, patchU, patchV, patchRX, patchRY, patchFeather, patchFeatherE), rMask[i], seaProtect);   // meander the patch shore off a straight ellipse too; the lake laps the range, never floods it
        // GLACIAL EUSTATIC sea: WEST-gate the signed shift (full at the west edge → 0 by gSeaEastU),
        // so it moves only the western coast, never the trans-range eastern lowland.
        let gSea = 0;
        if (gSeaOn && u < gSeaEastU) {
          // Full west of glacialSeaFullU (every present-sea cell, so the baked shelf lands the coast
          // exactly), easing to 0 by glacialSeaEastU.
          let wg = (u <= gSeaFullU) ? 1 : 1 - (u - gSeaFullU) / (gSeaEastU - gSeaFullU);
          if (wg < 0) wg = 0;
          gSea = glacialSea * wg * wg * (3 - 2 * wg);
        }
        const e = TerrainGenerator._combineGeo(base[i], rMask[i], rH[i], ridge[i], detail[i], wMask, 1, up, inc, relief, incise, sea, 1, 1, seaLift, floodCeil, rangeGain, rangeCeil, swSub, southSub, seaFloor, wMaskM, wDepthM, patchSub, gSea, gSeaCeil, floodFlat, crestArr ? crestArr[i] : 0);
        // DROWNED-VALLEY ESTUARY: at a warm highstand the sea backs up the main-stem valley. Drown
        // the low valley floor near the main channel (wMDist/wMPos) toward the sea floor, elevation-
        // gated so terraces stay dry, reaching further inland as the highstand strengthens.
        let eD = e;
        if (estAny && e < estCeil) {
          let eg = 1 - e / estCeil; eg = eg * eg * (3 - 2 * eg);                          // valley floor drowns, terrace top stays dry
          const esN = highstand > 0 ? esAt(highstand, estGN, i, eg, tj, tj2) : 0;
          if (esN > 0) eD = e + (seaFloor - e) * esN;
          // INFILL, over the episode's estuary envelope esR (the valley shape at the episode's largest
          // estuary, without the elevation term, so it does not shrink as the plain stands higher after
          // the peak), on ground that was land before the estuary (e >= waterE: never the open sea the
          // coast's contour floods):
          //   · still under water: it fills once its envelope is shallow enough for this stillstand age
          //     (the margins and heads first, the core near the mouth last, never above fillMax), built
          //     back up to a flat floodplain just above the water;
          //   · after the sea has fallen from the peak: its low flats are the exposed estuary floor.
          // Its age since filling sets tidal flat / swamp (1) or, past estuarySwampYears, a swamp +
          // forest mosaic (2).
          if (fillOn && e >= waterE) {
            const esR = esAt(hsMax, estGM, i, 1, tj, tj2);
            const under = eD < waterE;
            if (esR >= estRegionMin && (under ? esR <= fillF : (fallen && e < flatsElev))) {
              const wo = fillWob[i];
              if (under) eD = fillElev + wo * 0.006;
              const age = fillA - esR * fillYears;
              let st = 1;
              if (age > swampY) {
                let fr = (age - swampY) / forestY; fr = fr >= 1 ? 1 : fr * fr * (3 - 2 * fr);
                if ((wo + 1) * 0.5 < fr * forestMax) st = 2;
              }
              estState[i] = st;
            }
          }
        }
        // Add the relict dune ridges (masked to the coastal-plain belt; not on the river channel or drowned estuary).
        if (duneOn) {
          const wmx = wMask > wMaskM ? wMask : wMaskM, wm = wmx > 1 ? 1 : wmx < 0 ? 0 : wmx;   // either layer's channel
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
    this._tribSeaCut();
  }

  // Where each tributary's WATER ends at this date (_tribEndW): at its junction (_tribEndJ), or earlier
  // where the sea has cut its course — the first point, walking down its moved line from the source,
  // with the ground on BOTH banks under the sea (the channel's own bed is never the test). Below that
  // its valley is drowned (estuary) or, past a drowned reach, dry: water cannot run from the sea back
  // onto land, so a tributary no longer seems to rise from a beach. Points off the map count as land
  // (the catchment beyond the frame). Reads the morphed heightMap. Deterministic, no allocation.
  _tribSeaCut() {
    const Tr = this._geoTribs || [], endJ = this._tribEndJ, endW = this._tribEndW;
    if (!endW || !endJ || !Tr.length || !this.heightMap) return;
    const hm = this.heightMap, gc = this.gridCols, gr = this.gridRows;
    const seaE = (this._waterBiome && this._waterBiome.maxElevation != null) ? this._waterBiome.maxElevation : 0.10;
    const vw = (typeof LOOK !== 'undefined' && LOOK.riverValleyWiden != null) ? LOOK.riverValleyWiden : 2.4;
    // A bank point is sea when its cell is below the waterline; off the map it counts as land.
    const sea = (x, y) => (x >= 0 && x < 1 && y >= 0 && y < 1) && hm[((y * gr) | 0) * gc + ((x * gc) | 0)] < seaE;
    for (let j = 0; j < Tr.length && j < endW.length; j++) {
      const rv = Tr[j], B = rv.vB, N = rv.vN, P = rv.vP;
      let end = endJ[j];
      if (B && N && P) {
        const off = rv.width * vw * 1.15;
        let run = 0;
        for (let k = 0; k < P.length; k++) {
          const p = P[k];
          if (p >= end) break;
          const o = TerrainGenerator._meanderAt(rv.mOff, p);
          const nx = N[k * 2], ny = N[k * 2 + 1];
          const u = B[k * 2] + nx * o, v = B[k * 2 + 1] + ny * o;
          // The line itself and at least two of four bank points (both sides, near and far) under the
          // sea, at two samples in a row: so the river ends IN the sea, and a speck of low ground (or the
          // harness's white noise) never ends one.
          const n = (sea(u + nx * off, v + ny * off) ? 1 : 0) + (sea(u - nx * off, v - ny * off) ? 1 : 0)
                  + (sea(u + nx * off * 1.6, v + ny * off * 1.6) ? 1 : 0) + (sea(u - nx * off * 1.6, v - ny * off * 1.6) ? 1 : 0);
          if (n >= 2 && sea(u, v)) { if (++run >= 2) { end = P[k - 1]; break; } } else run = 0;
        }
      }
      endW[j] = end;
      // The DRAWN line (water decals, eels, the harness walks) stops where the water does: rebuild it
      // from the moved channel and fold every sample past the end onto the end point (same array).
      const V = this._riverViews, r = this._geoRivers.indexOf(rv);
      if (V && r >= 0 && B && N && P) {
        const vp = V[r].pts;
        let ex = 0, ey = 0, folded = false;
        for (let k = 0; k < vp.length; k++) {
          const o = TerrainGenerator._meanderAt(rv.mOff, P[k]);
          const x = B[k * 2] + N[k * 2] * o, y = B[k * 2 + 1] + N[k * 2 + 1] * o;
          if (!folded && P[k] > end && k > 0) {
            const t = (end - P[k - 1]) / ((P[k] - P[k - 1]) || 1);
            ex = vp[k - 1][0] + (x - vp[k - 1][0]) * t; ey = vp[k - 1][1] + (y - vp[k - 1][1]) * t;
            folded = true;
          }
          if (folded) { vp[k][0] = ex; vp[k][1] = ey; } else { vp[k][0] = x; vp[k][1] = y; }
        }
      }
    }
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
    if (typeof LOOK !== 'undefined' && LOOK.gorgeSaddle > 0) {   // Te Āpiti saddle (matches _buildGeoCache)
      const mf0 = this._mainField(u, v);
      if (mf0) {
        const sm = TerrainGenerator._gorgeSaddle(u, Math.abs(mf0.s));
        if (sm > rMask) { let hMax = 0; for (const r of R) if (r.height > hMax) hMax = r.height; rMask = sm; rH = hMax * LOOK.gorgeSaddle; }
      }
    }
    let ridge = 0, detail = 0;
    let crest = 0;
    if (rMask > 0) {
      const rf = this._rangeFbm(wx, wy, this._rangeFbmOut || (this._rangeFbmOut = { ridge: 0, detail: 0, crest: 0 }));
      ridge = rf.ridge;
      detail = rf.detail * ((typeof LOOK !== 'undefined' && LOOK.rangeFbmDetail != null) ? LOOK.rangeFbmDetail : 0.10);
      crest = rf.crest * ((typeof LOOK !== 'undefined' && LOOK.rangeCrestTex != null) ? LOOK.rangeCrestTex : 0.07);
    }
    // Rivers: the MAIN and TRIBUTARY layers, each from the shared field helpers the cache uses
    // (_mainField / _tribField), so this twin cannot drift from _applyGeoToHeightMap.
    const srFeather = (typeof LOOK !== 'undefined' && LOOK.straitRetreatFeather != null) ? LOOK.straitRetreatFeather : 0.08;
    const valleyWiden = (typeof LOOK !== 'undefined' && LOOK.riverValleyWiden != null) ? LOOK.riverValleyWiden : 2.4;
    const mainArm = (t.mainArm > 0) ? t.mainArm : 0;   // MAIN NE-ARM recession (deep time)
    const mArmKeep = (typeof LOOK !== 'undefined' && LOOK.mainArmKeep != null) ? LOOK.mainArmKeep : 0.55;
    const mArmFeather = (typeof LOOK !== 'undefined' && LOOK.mainArmFeather != null) ? LOOK.mainArmFeather : 0.14;
    let wMaskM = 0, wDepthM = 1;
    this._meanderLUT();
    const mf = this._mainField(u, v);
    if (mf) {
      let dm = Math.abs(mf.s - TerrainGenerator._meanderAt(this._geoMain ? this._geoMain.mOff : null, mf.p)) + mf.e;
      if (dm < 0) dm = 0;
      mf.d = dm;   // this date's meandered line (matches _applyMeanders)
      const valleyWM = mf.w * TerrainGenerator._gorgeValley(u) * TerrainGenerator._mainTaper(mf.p) * TerrainGenerator._mainWidthMult(u, (t.straitFactor != null ? t.straitFactor : 0), t.straitRetreat, srFeather, t.lake) * valleyWiden;
      if (mf.d < valleyWM) {
        const tt = 1 - mf.d / valleyWM; wMaskM = tt * tt * (3 - 2 * tt); wDepthM = mf.depth * TerrainGenerator._gorgeDepth(u);
        if (mainArm > 0) wMaskM *= TerrainGenerator._mainArmPresence(mf.p, mainArm, mArmKeep, mArmFeather);
      }
    }
    let wMask = 0;
    const tf = this._tribFieldOut || (this._tribFieldOut = { j: -1, s: 0, p: 0, e: 0, j2: -1, s2: 0, p2: 0, e2: 0 });
    if (this._tribField(u, v, tf) >= 0) {
      for (let sl = 0; sl < 2; sl++) {                 // both slots, as the cache
        const j = sl === 0 ? tf.j : tf.j2;
        if (j < 0) continue;
        const rv = this._geoTribs[j], w2 = TerrainGenerator._tribWidths(rv.width, 1 - ((t.tribSpread > 0) ? t.tribSpread : 0), [0, 0]);
        const ts = sl === 0 ? tf.s : tf.s2, tp = sl === 0 ? tf.p : tf.p2, te = sl === 0 ? tf.e : tf.e2;
        const m = TerrainGenerator._tribThreads(ts - TerrainGenerator._meanderAt(rv.mOff, tp), tp, rv.threads, TerrainGenerator._tribSpreadEff(t), w2[0] * valleyWiden, w2[1] * valleyWiden, te, rv.width * valleyWiden, this._tribEndJ ? this._tribEndJ[j] : null, this._tribMinWidth() * valleyWiden);
        if (m > wMask) wMask = m;
      }
    }
    const seaRise = (typeof LOOK !== 'undefined' && LOOK.seaRise != null) ? LOOK.seaRise : 0;
    const seaLift = (t.submergence > 0 ? t.submergence : 0) * seaRise;
    const floodCeil = (typeof LOOK !== 'undefined' && LOOK.seaFloodCeil != null) ? LOOK.seaFloodCeil : 0.42;
    const floodFlatK = (typeof LOOK !== 'undefined' && LOOK.seaFloodFlatten != null) ? LOOK.seaFloodFlatten : 0;
    const floodFlat = (t.submergence > 0 ? t.submergence : 0) * floodFlatK;
    const swReach = (typeof LOOK !== 'undefined' && LOOK.seaSWReach != null) ? LOOK.seaSWReach : 1.15;
    const swFeather = (typeof LOOK !== 'undefined' && LOOK.seaSWFeather != null) ? LOOK.seaSWFeather : 0.55;
    const seaProtect = (typeof LOOK !== 'undefined' && LOOK.seaRangeProtect != null) ? LOOK.seaRangeProtect : 1;   // SW strait + patch keep off the ranges
    const swSub = TerrainGenerator._rangeProtect(TerrainGenerator._swStrength(u, v, (t.submergence > 0 ? t.submergence : 0), swReach, swFeather), rMask, seaProtect);
    // SOUTH-HALF strait (Axis A): south-latitude mask × the drain × (1 − Tararua range protection).
    const southLat = (typeof LOOK !== 'undefined' && LOOK.southSinkLat != null) ? LOOK.southSinkLat : 0.45;
    const southFeather = (typeof LOOK !== 'undefined' && LOOK.southSinkFeather != null) ? LOOK.southSinkFeather : 0.22;
    const southProtect = (typeof LOOK !== 'undefined' && LOOK.southSinkProtect != null) ? LOOK.southSinkProtect : 1;
    const southWob = (typeof LOOK !== 'undefined' && LOOK.southSinkWobble != null) ? LOOK.southSinkWobble : 0.05;
    const southEastU = (typeof LOOK !== 'undefined' && LOOK.southSinkEastU != null) ? LOOK.southSinkEastU : 0;   // EAST→WEST fill taper
    const southEastF = (typeof LOOK !== 'undefined' && LOOK.southSinkEastFeather != null) ? LOOK.southSinkEastFeather : 0.3;
    // Off-cache path (harness): a live-noise twin of the cached mottle/meander in _applyGeoToHeightMap.
    const wv = ((t.southSink > 0) || (t.submergence > 0)) ? (noise(u * 8 + this.seed * 5, v * 8 + this.seed * 7) * 2 - 1) : 0;
    const seaFloor = 0.02 + wv * 0.015;
    let southSub = TerrainGenerator._southStrength(v + wv * southWob, (t.southSink > 0 ? t.southSink : 0) * ((typeof LOOK !== 'undefined' && LOOK.southSinkAmt != null) ? LOOK.southSinkAmt : 1), southLat, southFeather);
    if (southSub > 0) { const pr = 1 - southProtect * rMask; southSub *= pr > 0 ? pr : 0; }   // Tararua stays a dry peninsula
    if (southSub > 0 && southEastU > 0) southSub *= TerrainGenerator._southEastFade(u, southEastU, southEastF);   // EAST→WEST fill: east emerges first
    // LOCALIZED SUBMERGENCE PATCH (Axis A): elliptical spot on the submergence clock (LOOK.patchSub*).
    const patchU = (typeof LOOK !== 'undefined' && LOOK.patchSubU != null) ? LOOK.patchSubU : 0.58;
    const patchV = (typeof LOOK !== 'undefined' && LOOK.patchSubV != null) ? LOOK.patchSubV : 0.72;
    const patchRX = (typeof LOOK !== 'undefined' && LOOK.patchSubRX != null) ? LOOK.patchSubRX : 0;
    const patchRY = (typeof LOOK !== 'undefined' && LOOK.patchSubRY != null) ? LOOK.patchSubRY : 0;
    const patchFeather = (typeof LOOK !== 'undefined' && LOOK.patchSubFeather != null) ? LOOK.patchSubFeather : 0.45;
    const patchFeatherE = (typeof LOOK !== 'undefined' && LOOK.patchSubFeatherE != null) ? LOOK.patchSubFeatherE : patchFeather;
    const patchSub = TerrainGenerator._rangeProtect(TerrainGenerator._patchStrength(u + wv * southWob, v, (t.submergence > 0 ? t.submergence : 0), patchU, patchV, patchRX, patchRY, patchFeather, patchFeatherE), rMask, seaProtect);
    const out = TerrainGenerator._combineGeo(e, rMask, rH, ridge, detail, wMask, 1, t.uplift, t.incision, relief, incise, sea, 1, 1, seaLift, floodCeil, rangeGain, rangeCeil, swSub, southSub, seaFloor, wMaskM, wDepthM, patchSub, undefined, undefined, floodFlat, crest);
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
    // River cells read as water in the SIM map too (via the geo masks, not elevation), so
    // walkability and entity queries match the painted channel at any bed height. The MAIN layer
    // and the TRIBUTARY fan are classified independently and unioned (water > swamp > bed).
    const C = this._geoCache;
    const wMDistArr = C ? C.wMDist : null, wMBaseWArr = C ? C.wMBaseW : null, wMPosArr = C ? C.wMPos : null;
    const tJArr = C ? C.tJ : null, tSArr = C ? C.tS : null, tPArr = C ? C.tP : null, tEArr = C ? C.tE : null;
    const tJ2Arr = C ? C.tJ2 : null, tS2Arr = C ? C.tS2 : null, tP2Arr = C ? C.tP2 : null, tE2Arr = C ? C.tE2 : null;
    const endW = this._tribEndW;                       // each tributary's water ends at its junction or the sea
    const minW = this._tribMinWidth();                 // the channel-width floor
    const estState = this._estState;                   // the Opiki cycle's filled ground (1 swamp, 2 forest)
    const estForest = this._estForestBiome();
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
    // Main-stem width: the estuary arm west of the gap, the lake east of it (matches the carve).
    const straitRetreat = _gt.straitRetreat;
    const straitF = (_gt.straitFactor != null) ? _gt.straitFactor : 0;   // temporal thinning
    const lake = (_gt.lake > 0) ? _gt.lake : 0;
    const srFeather = (typeof LOOK !== 'undefined' && LOOK.straitRetreatFeather != null) ? LOOK.straitRetreatFeather : 0.08;
    const invc = 1 / gridCols;
    const thin = (typeof LOOK !== 'undefined' && LOOK.tribHighlandThin != null) ? LOOK.tribHighlandThin : 1.6;
    const tribLo = (typeof LOOK !== 'undefined' && LOOK.tribHighlandLo != null) ? LOOK.tribHighlandLo : 0.30;
    const thinCap = (typeof LOOK !== 'undefined' && LOOK.tribThinCap != null) ? LOOK.tribThinCap : 0.12;
    const bankRim = (typeof LOOK !== 'undefined' && LOOK.tribBankRim > 0) ? LOOK.tribBankRim : 1;
    const seaWobE = (this._waterBiome && this._waterBiome.maxElevation != null) ? this._waterBiome.maxElevation : 0.10;   // the waterline the border wobble fades to 0 at
    const seaWobW = (typeof LOOK !== 'undefined' && LOOK.wobbleSeaFade != null) ? LOOK.wobbleSeaFade : 0.04;
    const mainArm = (_gt.mainArm > 0) ? _gt.mainArm : 0;   // MAIN NE-ARM recession (deep time)
    const mArmKeep = (typeof LOOK !== 'undefined' && LOOK.mainArmKeep != null) ? LOOK.mainArmKeep : 0.55;
    const mArmFeather = (typeof LOOK !== 'undefined' && LOOK.mainArmFeather != null) ? LOOK.mainArmFeather : 0.14;
    // TRIBUTARY FANS at this date: spread + per-tributary stream widths (water scale).
    const tSpread = TerrainGenerator._tribSpreadEff(_gt);
    const tClose = 1 - ((_gt.tribSpread > 0) ? _gt.tribSpread : 0);
    const Tr = this._geoTribs || [], tW2 = this._tribW2 || (this._tribW2 = [0, 0]);
    const tWT = this._tribWT || (this._tribWT = new Float32Array(256)), tWB = this._tribWB || (this._tribWB = new Float32Array(256));
    for (let j = 0; j < Tr.length && j < 256; j++) { TerrainGenerator._tribWidths(Tr[j].width, tClose, tW2); tWT[j] = tW2[0]; tWB[j] = tW2[1]; }
    let idx = 0;
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const u = col * invc;
        const elevation = this.heightMap[idx];
        const eClass = wob ? elevation + wob[idx] * w * TerrainGenerator._seaWobbleFade(elevation, seaWobE, seaWobW) : elevation;
        let biome = this.getBiomeFromElevation(eClass);
        let waterHit = false, bedHit = false, wetHit = false;
        const wetLow = eClass < wetElevMax && TerrainGenerator._gorgeAlong(u) < 0.5;   // only the lowland river reaches turn to swamp; never in the gorge
        if (C && this._waterBiome) {
          // MAIN layer.
          const dM = wMDistArr[idx];
          if (dM < 1) {
            const effWM = wMBaseWArr[idx] * TerrainGenerator._gorgeChannel(u) * TerrainGenerator._mainTaper(wMPosArr[idx]) * TerrainGenerator._mainWidthMult(u, straitF, straitRetreat, srFeather, lake);
            if (dM < effWM) {
              const tt = 1 - dM / effWM;
              let mM = tt * tt * (3 - 2 * tt);
              if (mainArm > 0) mM *= TerrainGenerator._mainArmPresence(wMPosArr[idx], mainArm, mArmKeep, mArmFeather);   // NE arm dries to land
              if (mM >= riverTeff) waterHit = true; else if (mM >= riverBankT) bedHit = true;
              if (wetLow && mM >= wetT) wetHit = true;   // low reaches: swamp margin, wider than the bank
            }
          }
          // TRIBUTARY fan. Highland thinning: a tributary on high ground is a STREAM cutting a gully,
          // not band-water with beaches, so its thresholds rise with elevation (floored by
          // tribThinCap so the thread never starves), the bank thinning with the water.
          for (let sl = 0; sl < 2 && !waterHit; sl++) {
            const tj = sl === 0 ? tJArr[idx] : (tJ2Arr ? tJ2Arr[idx] : 255);
            if (tj === 255) continue;
            const mT = sl === 0
              ? TerrainGenerator._tribThreads(tSArr[idx], tPArr[idx], Tr[tj].threads, tSpread, tWT[tj], tWB[tj], tEArr[idx], Tr[tj].width, endW ? endW[tj] : null, minW)
              : TerrainGenerator._tribThreads(tS2Arr[idx], tP2Arr[idx], Tr[tj].threads, tSpread, tWT[tj], tWB[tj], tE2Arr[idx], Tr[tj].width, endW ? endW[tj] : null, minW);
            if (mT > 0) {
              let wT = riverTeff, bT = riverBankT;
              if (thin > 0 && eClass > tribLo) {
                let hi = (eClass - tribLo) * thin;
                if (hi > thinCap) hi = thinCap;
                wT += hi; bT += hi;
              }
              if (bT < wT - bankRim) bT = wT - bankRim;   // a thin rim, not a sand ribbon
              if (mT >= wT) waterHit = true; else if (mT >= bT) bedHit = true;
              if (wetLow && mT >= wetT) wetHit = true;
            }
          }
        }
        const est = estState ? estState[idx] : 0;   // filled ground is land, whatever the waterline wobble says
        if (waterHit) {
          biome = this._waterBiome;
        } else if (est === 2 && estForest) {
          biome = estForest;            // the Opiki cycle: swamp forest on the filled estuary
        } else if ((est === 1 || wetHit) && this._wetlandBiome) {
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
        this._geoT.glacialSea = TerrainGenerator.glacialSeaShift(job.yearsBP);   // relative sea level (m) → coastal shift at the morph year
        this._geoT.coastShiftU = TerrainGenerator.coastShiftU(job.yearsBP);      // the coast's move, for the dune belt
        this._geoT.estuary = TerrainGenerator.estuaryStrength(job.yearsBP);      // drowned-valley highstand at the morph year
        this._geoT.estFillAge = TerrainGenerator.stillstandAge(job.yearsBP);     // the Opiki cycle's clock
        this._geoT.estMax = TerrainGenerator.estuaryMax(job.yearsBP);            // … and its memory
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
    const ex = px - (ax + t * dx), ey = py - (ay + t * dy);
    return Math.sqrt(ex * ex + ey * ey);   // not Math.hypot: this runs per cell × per segment in the cache build, and hypot is several times slower
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
    // bed height. The masks come from the sim-resolution geo cache by bilinear interpolation —
    // the main stem's distance, and the tributary fan's signed distance + position along the
    // trunk — so morphs allocate nothing extra and the time-varying widths come for free. The two
    // layers are unioned exactly as in _rebuildBiomeMap.
    const C = this._geoCache;
    const C_wMDist = C ? C.wMDist : null, C_wMBaseW = C ? C.wMBaseW : null, C_wMPos = C ? C.wMPos : null;
    const C_tJ = C ? C.tJ : null, C_tS = C ? C.tS : null, C_tP = C ? C.tP : null, C_tE = C ? C.tE : null;
    const C_tJ2 = C ? C.tJ2 : null, C_tS2 = C ? C.tS2 : null, C_tP2 = C ? C.tP2 : null, C_tE2 = C ? C.tE2 : null;
    const endW = this._tribEndW, estState = this._estState, estForest = this._estForestBiome(), minW = this._tribMinWidth();
    const estForestColorElev = estForest ? estForest.minElevation + (estForest.maxElevation - estForest.minElevation) * 0.5 : 0.35;
    const tq = this._paintTribQ || (this._paintTribQ = { s: 0, p: 0, e: 0 });
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
    // Main-stem width: the estuary arm west of the gap, the lake east of it (matches the carve/classify).
    const straitRetreat = _gt.straitRetreat;
    const straitF = (_gt.straitFactor != null) ? _gt.straitFactor : 0;
    const lake = (_gt.lake > 0) ? _gt.lake : 0;
    const srFeather = (typeof LOOK !== 'undefined' && LOOK.straitRetreatFeather != null) ? LOOK.straitRetreatFeather : 0.08;
    const thin = (typeof LOOK !== 'undefined' && LOOK.tribHighlandThin != null) ? LOOK.tribHighlandThin : 1.6;
    const tribLo = (typeof LOOK !== 'undefined' && LOOK.tribHighlandLo != null) ? LOOK.tribHighlandLo : 0.30;
    const thinCap = (typeof LOOK !== 'undefined' && LOOK.tribThinCap != null) ? LOOK.tribThinCap : 0.12;
    const bankRim = (typeof LOOK !== 'undefined' && LOOK.tribBankRim > 0) ? LOOK.tribBankRim : 1;
    const seaWobE = (this._waterBiome && this._waterBiome.maxElevation != null) ? this._waterBiome.maxElevation : 0.10;   // the waterline the border wobble fades to 0 at
    const seaWobW = (typeof LOOK !== 'undefined' && LOOK.wobbleSeaFade != null) ? LOOK.wobbleSeaFade : 0.04;
    const mainArm = (_gt.mainArm > 0) ? _gt.mainArm : 0;   // MAIN NE-ARM recession (deep time)
    const mArmKeep = (typeof LOOK !== 'undefined' && LOOK.mainArmKeep != null) ? LOOK.mainArmKeep : 0.55;
    const mArmFeather = (typeof LOOK !== 'undefined' && LOOK.mainArmFeather != null) ? LOOK.mainArmFeather : 0.14;
    // TRIBUTARY FANS at this date (same as the classify).
    const tSpread = TerrainGenerator._tribSpreadEff(_gt);
    const tClose = 1 - ((_gt.tribSpread > 0) ? _gt.tribSpread : 0);
    const Tr = this._geoTribs || [], tW2 = this._tribW2 || (this._tribW2 = [0, 0]);
    const tWT = this._tribWT || (this._tribWT = new Float32Array(256)), tWB = this._tribWB || (this._tribWB = new Float32Array(256));
    for (let j = 0; j < Tr.length && j < 256; j++) { TerrainGenerator._tribWidths(Tr[j].width, tClose, tW2); tWT[j] = tW2[0]; tWB[j] = tW2[1]; }

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
        let x0 = wx | 0; if (x0 > GC - 2) x0 = GC - 2 < 0 ? 0 : GC - 2; if (x0 < 0) x0 = 0;
        let fx = wx - x0; if (fx < 0) fx = 0; else if (fx > 1) fx = 1;
        const x1 = x0 + (GC > 1 ? 1 : 0);
        const h00 = heightMap[rowA + x0], h10 = heightMap[rowA + x1];
        const h01 = heightMap[rowB + x0], h11 = heightMap[rowB + x1];
        const e = (h00 * (1 - fx) + h10 * fx) * (1 - fy) + (h01 * (1 - fx) + h11 * fx) * fy;
        elevA[i] = e;

        const eClass = wobA ? e + wobA[i] * wob * TerrainGenerator._seaWobbleFade(e, seaWobE, seaWobW) : e;
        let biome = this.getBiomeFromElevation(eClass);
        const estP = estState ? estState[(fy < 0.5 ? rowA : rowB) + (fx < 0.5 ? x0 : x1)] : 0;   // the Opiki cycle's filled ground (nearest sim cell) is land
        let wa = (estP === 0 && (biome.isWater || biome === this._waterBiome)) ? 1 : 0;   // true sea → rendered flat
        let colorElev = eClass;
        let wetHit = false, bedHit = false;
        const wetLow = eClass < wetElevMax && TerrainGenerator._gorgeAlong(wx * invGC) < 0.5;   // only the lowland river reaches turn to swamp; never in the gorge
        if (wa === 0 && C && this._waterBiome) {
          const a00 = rowA + x0, a10 = rowA + x1, a01 = rowB + x0, a11 = rowB + x1;
          const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
          // MAIN layer: bilinear distance + position.
          const dM = C_wMDist[a00] * w00 + C_wMDist[a10] * w10 + C_wMDist[a01] * w01 + C_wMDist[a11] * w11;
          if (dM < 1) {
            const ni = (fy < 0.5 ? rowA : rowB) + (fx < 0.5 ? x0 : x1);   // nearest neighbour for the base width
            const posM = C_wMPos[a00] * w00 + C_wMPos[a10] * w10 + C_wMPos[a01] * w01 + C_wMPos[a11] * w11;
            const effWM = C_wMBaseW[ni] * TerrainGenerator._gorgeChannel(wx * invGC) * TerrainGenerator._mainTaper(posM) * TerrainGenerator._mainWidthMult(wx * invGC, straitF, straitRetreat, srFeather, lake);
            if (dM < effWM) {
              const tt = 1 - dM / effWM;
              let mM = tt * tt * (3 - 2 * tt);
              if (mainArm > 0) mM *= TerrainGenerator._mainArmPresence(posM, mainArm, mArmKeep, mArmFeather);   // NE arm dries to land, ending cleanly at the eastern confluence
              if (mM >= riverTeff) wa = 2; else if (mM >= riverBankT) bedHit = true;
              if (wetLow && mM >= wetT) wetHit = true;
            }
          }
          // TRIBUTARY fan: bilinear signed distance / position / bank noise where all four corners
          // belong to the same tributary (both are smooth there); nearest neighbour across the
          // boundary between two tributaries' bands, where they are not.
          // TRIBUTARY fan, both slots of the nearest sim cell: each tributary bilinear in its signed
          // distance / position / bank noise where all four corners hold it (in either slot), nearest
          // neighbour where they do not.
          const niT = (fy < 0.5 ? rowA : rowB) + (fx < 0.5 ? x0 : x1);
          for (let sl = 0; sl < 2 && wa === 0; sl++) {
            const tj = sl === 0 ? C_tJ[niT] : (C_tJ2 ? C_tJ2[niT] : 255);
            if (tj === 255) continue;
            if (!TerrainGenerator._paintTribSample(C, tj, a00, a10, a01, a11, w00, w10, w01, w11, tq)) {
              if (sl === 0) { tq.s = C_tS[niT]; tq.p = C_tP[niT]; tq.e = C_tE[niT]; }
              else { tq.s = C_tS2[niT]; tq.p = C_tP2[niT]; tq.e = C_tE2[niT]; }
            }
            const s = tq.s, p = tq.p, en = tq.e;
            {
              const mT = TerrainGenerator._tribThreads(s, p, Tr[tj].threads, tSpread, tWT[tj], tWB[tj], en, Tr[tj].width, endW ? endW[tj] : null, minW);
              if (mT > 0) {
                // Highland thinning — same rule as _rebuildBiomeMap.
                let wT = riverTeff, bT = riverBankT;
                if (thin > 0 && eClass > tribLo) {
                  let hi = (eClass - tribLo) * thin;
                  if (hi > thinCap) hi = thinCap;
                  wT += hi; bT += hi;
                }
                if (bT < wT - bankRim) bT = wT - bankRim;   // a thin rim, not a sand ribbon
                if (mT >= wT) wa = 2; else if (mT >= bT) bedHit = true;
                if (wetLow && mT >= wetT) wetHit = true;
              }
            }
          }
          if (wa === 2) { biome = this._waterBiome; colorElev = riverColorElev; }
          else if (bedHit && this._bedBiome) { biome = this._bedBiome; colorElev = bedColorElev; }
        }
        // Low riparian swamp overrides the sand bank + the near-river plain margin (land cells only,
        // never actual water). Matches _rebuildBiomeMap's wetHit branch so sim biome == painted biome.
        // The Opiki cycle's filled estuary (nearest sim cell): swamp forest, else swamp. Matches the classify.
        const est = (wa === 0) ? estP : 0;
        if (est === 2 && estForest) { biome = estForest; colorElev = estForestColorElev; }
        else if ((est === 1 || wetHit) && wa === 0 && this._wetlandBiome) { biome = this._wetlandBiome; colorElev = wetlandColorElev; }
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
    const duneCoastShift = (this._geoT && this._geoT.coastShiftU != null) ? this._geoT.coastShiftU : 0;
    const duneTrack = (LOOK.duneCoastTrack != null) ? LOOK.duneCoastTrack : 0;
    const duneCoastX = ((LOOK.coastInland != null) ? LOOK.coastInland : 0.02) + duneCoastShift * duneTrack;

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
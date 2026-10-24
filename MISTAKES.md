# Te Manawa — mistakes worth not repeating

A plain record of things that were tried and went wrong, so the reasoning that
now looks arbitrary in the code has somewhere to live. **Newest first** — put new
entries at the top.

Each entry: what happened · root cause · consequence · the rule that prevents a
repeat. The rule is the part that also lives at the call site (as a short guard
comment) and, where general, in `CLAUDE.md`.

---

## The Ōroua was not where it was drawn

- **What happened.** The Ōroua in `geo/manawatu.svg` had been rotated 180° in the editor. The sim drew
  it un-rotated: entering from the north-west across the coastal plain, swinging east to the gorge and
  back. Its fan streams started at random distances down that line, so on the timeline frames the
  tributary seemed to rise out of open sand, and at every highstand its lower reach ran from the beach.
- **Root cause.** `tools/svg2geo.js` read point data only. The editor stored the turn as a `transform`
  attribute about a `transform-origin` in the style, which the converter never looked at. Its attribute
  lookup also matched `d="…"` inside `id="…"`.
- **Consequence.** Every frame since the SVG was edited showed a river nobody drew, and the review of
  the river's behaviour started from the wrong course.
- **Rule.** A converter applies everything the editor shows: element transforms, their origin, and
  enclosing `<g>` transforms (`svg2geo.js`, harness "svg2geo"). After an edit, overlay the converted
  lines on a frame before judging the geography (2026-10-20).

---

## The early coast ran on stand-ins, not on sea level

- **What happened.** Read against the dated maps, the 1.0–0.8 Ma coast never moved: the north-west
  plain was dry at every sea level, where T&B Fig. 4D shows ground flooded at highstands and the
  c. 0.88 Ma Waitapu map has the Feilding–Halcombe highs under shelf.
- **Root cause.** Relative sea level counted the plain's uplift back only 400 kyr and faded it out
  under a positional "marine emergence", so the early window ran at eustatic sea level as if the land
  already stood at today's height. The early sea came from regions drowned on fixed clocks instead.
  Separately, the highstand shift attenuated with elevation, so no highstand could flood more than
  ~+60 m however high the relative sea stood. The first fix then sank only the ground below the new
  contour. That left the land just above it at full height, so every highstand shore was a step the
  height of the whole rise, which the relief bake drew as sheer cliffs. And counting uplift-since all
  the way back (a ramp to 120 m) assumed today's plain existed then, lowered. The basin kept building its
  surface up to sea level, so the early glacials should bare the plain; instead the sea sat +30 m over it
  at every early lowstand, and the run read as a coast steadily expanding west.
- **Rule.** One rule for the whole window. If a physical driver (here relative sea level) explains
  an era, drive that era from it and calibrate against the sources' dated landmarks, rather than
  painting the era with a positional term on its own clock. Keep a positional term only for what the
  driver cannot produce (the Levin–Foxton depocentre). A rising sea moves the whole surface relative
  to the water; lower the land around the shore with the drowned part, never the drowned part alone.
  In a filling basin, back-calculate past sea level against the land that existed then: offset by
  uplift near the present, saturating further back. Check the coast's swing per cycle, not just its
  extremes.
  Harness: "geography" asserts the early coast breathes and that older highstands reach higher, and
  `_seaShift` has no step (monotonic, continuous at the contour).

## The tributaries arrived after the gorge they were meant to have cut

- **What happened.** Read against Trewick & Bland Fig. 4D, the deep-time snapshots had the river's
  layout right and its history backwards. The tributaries east of the ranges appeared only at
  0.5–0.2 Ma, so for the first half-million years nothing flowed into the gorge, although T&B's
  explanation for an antecedent gorge is exactly that flow. The east at 1 Ma was sea (the central
  patch, and the strait factor widening the main right across it) where the figure shows land.
- **Root cause.** Each piece was tuned for the look of its own era and checked against the text one
  claim at a time ("the river turned west", "a lake ponded") rather than against the map as a whole.
  "Tributaries assemble over deep time" read as plausible on its own. Then the river field kept one
  river per cell, chosen by margin, so every change to the tributaries needed another patch on that
  selection (emergence fronts, an early schedule, an NE-arm hand-over).
- **Rule.** Check a deep-time change against the source's figure at the dates it shows, not only its
  prose, and ask what each feature needs to have been there first (a gorge needs its river; a river
  needs its catchment). When a feature needs geometry the field cannot hold, rebuild the field into
  layers rather than patching the selection: the main stem and the tributary fan are now separate
  layers unioned in the carve, classify and paint. Harness: "land/water" asserts every tributary
  joins the main at 1 Ma, 600 and 300 ka and the end, and that the fans are open at 1 Ma and closed
  at the end; "geography" asserts the lake and fan clocks.

## A boost could stop one year short of the climate it promised

- **What happened.** Chaining boosts from 1 Ma, the stop at 519.2 ka came back twice: the first
  boost's time-lapse ended still in the glacial, and the next boost played one year.
- **Root cause.** `Climate.nextRegimeBoundary` bisects the crossing to a 1-year bracket, then
  returned `Math.round(lo)`. `lo` is the new-regime side, but rounding can move it up a year onto
  the old side (g 0.500002 at 519,245).
- **Rule.** When you round the result of a threshold bisection, round toward the side you promised
  (`Math.floor` here, since yearsBP falls forward in time), then check the rounded value against the
  threshold. Harness: "deep time" chains every boost stop the way back-to-back boosts do, and
  requires each to sit in its new regime and none to be a near no-op.

## The glacial coast held still, then flipped; the new shore came out speckled

- **What happened.** With sea level driving the coast in metres, the western shore barely moved
  through most of a glacial and then jumped kilometres in one morph step, with a horizontal seam
  where neighbouring rows jumped at different moments. Once the floor was rebuilt as a shelf, the
  MIS 3 shore came out as a speckled archipelago of islets. Later the eastern tributary was cut off
  two cells above its mouth.
- **Root cause.**
  1. The sea floor was free noise packed into a thin band just under the waterline, so a uniform
     lift carried the whole band across the line at once. The metres-to-elevation mapping was right;
     the floor it was applied to wasn't.
  2. The coast detector took the first land cell on a row. Offshore islet clusters counted as coast,
     so the lagoons behind them stayed noise floor and flipped together.
  3. The biome-border wobble (`wobbleAmp` 0.05) is sized for steep relief. On a gentle shelf the same
     wobble moves the land/sea line a long way sideways, so the shore broke up into specks.
  4. The NE arm's drying taper ran in cells owned by the main. The eastern tributary's last reach
     runs along the arm, and the wider main wins those cells on margin, so they dried with the arm.
- **Rule.** (1) If a slow shift moves a threshold across a field, the field must ramp through the
  threshold: `_bakeShelf` solves each floor cell (`shelfFloorE`) so a sea fall of its depth lifts it
  exactly to the waterline. (2) Find a coast as the first run that is mostly land (85% of the next
  `span` cells), and smooth it across rows before using it. (3) Noise sized for steep ground must fade
  where the ground is flat: `_seaWobbleFade`. (4) A taper that removes one channel must not remove
  cells another channel needs: `_tribTakesArmCell`. Harness: "geography" asserts the coast moves
  inland monotonically with relative sea level and the main runs unbroken from the lowstand sea;
  "land/water" (b3) asserts every tributary joins the main.

## Tributaries pinched into pools and floated free; swimmers stranded on land paced in place

- **What happened.** Sampled along their own polylines, tributaries were wet in 2–4 separate runs
  even at 30 ka, with dry stretches mid-channel. While emerging (0.4–0.2 Ma) they were a wet stub at
  the source with dry land between it and the main. The eastern tributary ended in dry ground on
  some seeds. Fish on the tributaries paced the pools. An eel that a morph left on dry land flipped
  direction every tick without moving.
- **Root cause.** Four separate bugs, all resting on the assumption that the water is continuous:
  1. `LOOK.riverWobble` (0.02) is added to the DISTANCE from the polyline, not as a sideways shift. On
     a ~0.016-wide tributary that lifted the centre line itself past the water threshold wherever the
     noise ran positive, so the channel pinched shut.
  2. The emergence front grew each tributary source → confluence, so until it arrived the stream
     drained into dry land. Real streams lengthen headward, cutting back from the river they feed.
  3. `LOOK.mainArmKeep` 0.55 started the NE arm's drying taper below the eastern tributary's
     confluence (~wPos 0.62), so with ±0.07 front jitter it was seed luck whether that tributary
     had a river to join.
  4. The swimmers' bounce reverts to the previous step and flips direction. That only escapes if
     the previous step was wet. `reconcile()` assumed "the main is always present, so an eel is never
     stranded", but a morph can dry the water under one (strait thinning, NE arm, coast), after which
     both directions are dry forever. The same bounce also turned a swimmer at the first dry cell, so
     two islets in the coastal sea a few px apart boxed it into a pocket to pace (seed-dependent: the
     harness caught it on one seed in four).
- **Rule.** (1) Any noise added to a channel's distance must stay below the channel's own width:
  `TerrainGenerator._riverWobbleFor` caps a tributary's wobble at `LOOK.tribWobbleFrac` (0.2) of its
  width. (2) Growth fronts run headward from the confluence (`_headwardPos`, shared by carve, classify
  and paint). (3) A drying taper must end above every confluence it can reach. (4) Anything that rides
  a moving surface must be re-checked after the surface moves: `WaterLayer._revalidateSwimmers` on
  every reconcile, and `_rescue` when a step finds both directions dry; and a dry speck shorter than
  `cfg.swimHop` (12 px) is hopped, not bounced off (`_hop`). Harness: "geography" asserts
  headward growth; "land/water discipline" asserts every tributary is one channel joined to the main
  at 300 ka and 25.5 ka, no swimmer strands or paces across a reconcile-only morph sequence, and a
  deliberately stranded eel recovers.

---

## Grazers starved beside food: a herd-mate held them off their plant, and they never re-picked

- **What happened.** The harness "fauna stability" sweep began failing about one run in six. The
  quiet refound top-up fired 10–22 times against a bound of 20. At 300 ka (≈70% land) about half the
  runs failed. The 1 Ma re-dating above only exposed it, because it gave the boot land more land.
  Almost every moa-guild species sat at its floor of 2, against targets of 5–8.
- **Root cause.** The deaths were starvation, not predation: 5–11 starved per species per sweep,
  against 0–2 taken by the harrier. Every one of ~450 starvation deaths was a FORAGING adult inside its
  elevation band, with 50+ edible plants within 100 px. Each starving bird held ONE target plant 17–68
  px away for 1,000–2,000 frames, standing still. Measured along the line to that plant, the forage
  seek (capped at 0.5–0.9× maxForce) was cancelled by the herd separation (50 px, about 0.84–1.6×
  maxForce by `flockTendency`), with the shore and edge steers making up the rest. `findPlant` only
  runs once the target stops being edible, so nothing ever told the bird to try another plant. About
  a quarter of all grazer time went into this standoff, on both lands.
- **Consequence.** The unattended cast hugged its floors and leaned on the top-up. More land made it
  worse, because the few survivors also spread apart and met less (nearest conspecific 125–300 px at
  300 ka, against 30–90 at 1 Ma).
- **Rule.** A seek toward a target must never be able to stall forever against another steering
  force. `Moa._forageStalled` gives a plant up after `forageGiveUpFrames` (180, scaffold ECOLOGY
  FEEDBACK) frames with no new closest approach. `findPlant` then skips the last four plants given up
  on, a list cleared on a bite. It is the grazer's version of the harrier's `eagleMaxChase`. Refounds
  fell to 5–14 at either land, with no breeding knob touched. Harness: "fauna stability" now sweeps
  1 Ma AND 300 ka, and stages the standoff (a herd-mate standing on the plant) to assert the give-up.
  General: when a population sits at its floor, find out what its deaths ARE before tuning breeding.
  Here it was a behaviour bug, not the ecology.

---

## The opening showed the wrong million years: a ~2.4 Ma seaway at 1 Ma

- **What happened.** For the first ~600,000 years of the run, the wall drew a broad sea straight
  across the axis, with flat ranges sitting under it. That is the Manawatū Strait at its widest, about
  2.4 Ma. But the strait had closed by ~1.6 Ma, and at 1 Ma the axis was a low emergent finger of
  greywacke with a lake ponded at the gorge (Trewick & Bland 2012; Rees, Palmer & Palmer 2017/2018).
  The research doc caught it by reading the geo factors live against the dated literature.
- **Root cause.** Each marine term was authored on its own and tuned by eye. The south strait carried
  range protection, but the SW strait and the central patch did not, so they drowned the Tararua. The
  ranges started at uplift 0. The 6× main-stem "strait" ran through the range gap. And a southern
  pulse was dated to a design brief, not a source. None of these was wrong alone; together they
  painted the earlier epoch.
- **Consequence.** A natural-history wall opened on the wrong geography. It also read like what
  visitors (and the team) half-expect: "the sea came in where the mountains are".
- **Rule.** Every deep-time term is dated against a source, and the opening state is checked as a
  whole against a palaeogeographic map of that date, not term by term. Marine terms never cover the
  range footprints unless a source says the axis was under water at that date. Harness: "geography"
  asserts the Tararua stands as land under the full 1 Ma flood. See `md/TEMANAWA_NATURAL_HISTORY.md` §I.
- **Also.** A harness test that probes a FIXED world position inherits whatever the terrain is there.
  The storm windthrow test silently became a forest-band die-back test when the 1 Ma land changed. Seat
  probes in the habitat the test is about.

---

## A time-lapse starved the grazers: hunger ran on the life clock, eating on the real one

- **What happened.** Every boost's time-lapse cut the grazer guild down to its protected floor of 2
  (Finsch's duck 5 → 7 → 2, Mantell's moa 4 → 6 → 2). The card's promise that "the birds answer the
  plant" ended with fewer birds than it began. At rest nothing died. Found by the headless encyclopedia
  boost trials (`md/TEMANAWA_ENCYCLOPEDIA_CARDS.md`, gap 5), not by reading the code.
- **Root cause.** The two-clock split (`Simulation.update(dt, rdt)`) put hunger on the warped LIFE
  clock with ageing and breeding. The search, walk and eating cadence that pays hunger back ran on the
  REAL clock. At 8–10× life speed a bird burned 8–10× the hunger per real second, but still found and
  ate food at walking pace. The first fix scaled each bite by `lifeScale`. It didn't hold: a bite is
  clipped at hunger 0, so the extra food was wasted, and the time spent searching doesn't shrink. A
  probe at a fixed year (no climate swing) showed an 8× life clock alone dropping the guild 29 → 21
  while edible plants held steady. The food was there; the birds couldn't reach it fast enough.
- **Consequence.** The climax of every boost read as a die-off.
- **Rule.** Metabolism is behaviour, not life history. Hunger, habitat stress and starvation run on
  the same real clock as the motion that answers them (`mdt = dt / sim.lifeScale` in `Moa.behave`,
  `Kereru.behave` and `EylesHarrier.behave`). Only ageing, breeding cooldowns and plant succession use
  the warped clock. General: anything that accrues on one clock and is paid back by an action on
  another drifts by the ratio of the two. Put the accrual on the clock of the thing that pays it back,
  rather than scaling the payment. Bootcheck "boost follow-through" asserts equal hunger per real
  frame at 1× and 10× life speed, for a moa, a kererū and a harrier, and that an 8× life clock doesn't
  thin the guild.

## The harrier re-picked its prey every frame, so it swerved instead of chasing

- **What happened.** Hunting harriers would "swoop towards something like the goose then rubber-band
  away pretty frequently" — a distracting jitter, made worse because the grazers flee cleanly and fast.
- **Root cause.** Three compounding things in `EylesHarrier.hunt`. (1) No target COMMITMENT: every
  frame it re-scanned all nearby prey and locked onto the current best-`eff` bird, so in a gaggle or
  herd the "best" flipped between near-equal targets frame to frame — the harrier swerved between
  them. The per-frame `random()` eagleResistance/camouflage rolls added flicker to the eligible set.
  (2) A fixed 12-frame velocity lead with no proximity scaling: at close range it aimed at a point
  well beyond a fleeing prey, so it sailed past and had to wheel back. (3) huntSpeed 0.6 only shades
  the goose (fleeSpeed 0.55) / takahē (0.5), so a stern chase trailed at parity — it could neither
  close nor pull away, and tiny prediction errors made the gap wobble until the chase timed out.
- **Consequence.** Chases read as a nervous back-and-forth swoop rather than a committed dive, and
  most ended in a fruitless break-off rather than a catch.
- **Rule.** Commit to one target until it is caught, dies, is floor-protected, reaches cover, or
  opens past `eagleLoseRange`; only THEN scan for a new one (so floor/surplus weighting and the
  resistance/camo rolls decide ACQUISITION, not every frame of the chase). Shorten the aim lead as
  the bird closes (`min(12, dist×0.35)`). Steer with extra turn authority (`eagleHuntTurn`, seek
  urgency — it clamps to `maxForce×urgency`, NOT to top speed, so it corners without going faster).
  And add a final STOOP (`eagleStoopSpeed`/`eagleStoopRange`) so the last stretch closes decisively
  instead of trailing at parity. `TeManawa_eagle.js` hunt(); knobs in the scaffold ECOLOGY FEEDBACK
  block. General: a steering agent that re-selects its goal every frame will chatter between
  near-equal goals — commit, and re-select only on a clear exit condition. (This is the same
  rubber-band class as the moa foraging deadband already documented in `TeManawa_moa.js`.) Verified:
  target-switches → 0, average chase-distance swing ~2 px, most hunts resolve in a catch, and
  bootcheck fauna-stability still shows no extinction and 0 refounds.

## The surplus-only predation gate starved the harrier — it hunted nothing

- **What happened.** The Eyles' harrier (kērangi) never caught anything. Hunger climbed past its
  hunt threshold, it went into search/relocate, but kills stayed at 0 indefinitely. (Probed
  headlessly: 0 kills across 2000 frames, three hungry eagles finding no prey.)
- **Root cause.** `EylesHarrier.hunt` had TWO stacked over-hunt guards: the FLOOR
  (`isPreyProtected` — never crop a species at/below its protected minimum) *and* a much stricter
  TARGET gate (`if (surplus <= 0) continue`, surplus = count − target). The intent of the target
  gate was "only ever crop a booming species". But the whole grazer/flyer cast breeds to a taper
  that brakes *at* its target, so every species equilibrates at or below target — `surplus` is
  essentially always ≤ 0. With the target gate on, `getHuntablePrey` yielded nothing edible on
  every frame, so the harrier could never feed. The probe showed TOTAL over-target prey = 0 for
  the entire run.
- **Consequence.** A functionally starving apex predator: it patrolled and searched forever but
  never hunted. The one guard meant to "stop over-hunting" stopped *all* hunting.
- **Rule.** The FLOOR is the anti-overhunt guarantee, not the target. The target now only *weights*
  prey selection: a prey animal is huntable whenever it is above its floor (`headroom = count −
  floor > 0`), and a species booming over target gets an extra `eagleSurplusBonus × surplus` pull
  so booms are still cropped first. Scarce-but-above-floor prey is taken only when nothing better
  is near. `TeManawa_eagle.js` hunt(). General: don't stack a second, stricter population guard on
  top of the floor when the breeding system already pins the population near the level that second
  guard keys off — they cancel and the behaviour vanishes. (Verified with a headless probe on the
  bootcheck bootstrap — three harriers feed across species over 8k frames, populations stay healthy
  and none is driven to its floor — and by the bootcheck fauna-stability section: no extinction over
  a 16k-tick warm↔cold sweep, refound backstop still 0.)

## Kahikatea answered to two habitat systems at once, so the river mouth fought itself

- **What happened.** A wetland kahikatea would "sprout up while a force simultaneously tried to
  shrink it" — the recruitment/warp system growing it while another force dragged it back down,
  most visibly at the low river reaches.
- **Root cause.** Kahikatea had TWO habitat models layered on the same tree. Its intended one is
  DISTURBANCE-driven: the wetland biome (assigned by river proximity, not elevation) places it, and
  `disturbanceRecruit` senescence/recruitment governs its lifecycle. But it was also in
  `FOREST_TREES`, so `Plant.update`'s forest-band CONTRACTION applied too — and that band is an
  ELEVATION mechanism whose `min` is ~0.14 even in the interglacial. The wetland reaches down to
  the river mouth at elevation < 0.14, so kahikatea recruited (and warp-grown) there were
  simultaneously judged "below the forest band" and SUPPRESSED → died back. The disturbance system
  kept planting/growing them; the band system kept killing them. Two systems, one tree, opposite
  verdicts. (The `_growPulse` button skip fixed earlier was a *different*, additive cause — the
  visitor's boost also pumping growth; this one bites with no button pressed at all.)
- **Consequence.** Kahikatea churning grow/shrink at the low wetland — recruited, warp-grown, then
  band-suppressed back to nothing.
- **Rule.** Kahikatea is now EXEMPT from forest-band contraction (`!this._kahikatea` in the gate,
  mirroring beech's `!this._coldRefuge`). One habitat model per tree: kahikatea answers to the
  RIVER (wetland biome + disturbance senescence), not the montane elevation band. It stays a
  `_forestTree` only for the fast recovery-growth rate; its climate response is the wetland seasonal
  modifier. `TeManawa_plant.js`. General: never let two independent habitat/suppression systems
  both own the same entity — pick one. (Verified: a river-mouth kahikatea at elev 0.087 now grows
  instead of dying back; 0 kahikatea suppressed or oscillating in a natural run.)

## The sprite flip was decided off raw velocity, so it flip-flapped

- **What happened.** A perched kōkako, and a grazer briefly rubber-banding at the river's sand
  band, flipped their sprite left/right many times a second — "an annoying continual sprite flip".
- **Root cause.** `Boid.updateFacing` committed the lateral facing `_faceDir` straight off the
  instantaneous `vel.x` (gate ±0.03). A perched bird's velocity jitter and a foraging grazer's
  few-frame back-and-forth both cross that gate repeatedly, and `_flip` animates THROUGH 0
  (edge-on) each time, so the sprite visibly flips. The flip commit also wasn't gated on the
  bird actually moving, so a near-stationary perched bird flipped on pure noise.
- **Consequence.** Constant sprite flipping on perched flyers (kōkako/huia/kererū) and on grazers
  jittering near water.
- **Rule.** The flip now decides off a LOW-PASSED horizontal velocity (`_flipVx`, τ≈16 frames)
  and only re-commits when that smoothed value clears a slightly wider gate AND the bird's speed
  is above the "moving" threshold. Sustained travel still turns the sprite within a fraction of a
  second; jitter and brief reversals hold the last facing. One place, so it covers moa/goose/
  takahē and every kererū-family flyer. `TeManawa_boid.js`. (Verified: kōkako perched flips 4→0,
  grazer-near-water flips 9→≤1 over 90 frames.)

## Moa fixated on food across the river and nosed into the shore chasing it

- **What happened.** Grazers on the sand/coast band around the river "weren't finding food" and
  rubber-banded — reported alongside the sprite flip above.
- **Root cause.** `Moa.findPlant` scored candidate plants by distance/nutrition with NO
  reachability test, so a moa on the bank would pick a plant on the FAR side of the river as its
  nearest food, seek toward it, hit the water, get turned back by `avoidUnwalkable`, re-seek the
  same plant, and oscillate — while its actual hunger climbed because it never reached anything.
- **Consequence.** Starving grazers stuck on the riverbank, oscillating instead of moving to
  reachable food.
- **Rule.** `findPlant` now samples the water type at the path MIDPOINT and applies a ×6 score
  penalty to any plant whose straight line to the moa crosses water — a soft deprioritisation, not
  a hard skip, so a moa in a genuine one-sided food desert can still fall back to it rather than
  starve. It prefers same-bank food, so it stops nosing into the shore. `TeManawa_moa.js`.
  (Verified: across-water targets among riverbank grazers dropped to a last-resort handful, and
  bootcheck fauna-stability still shows no extinction over 16000 ticks.)

## The growth button fought the habitat, so boosted trees flickered grown/ungrown

- **What happened.** Holding FOREST/TUSSOCK over a tree whose habitat was working AGAINST
  it — a kahikatea stand senescing for want of a river disturbance, a canopy tree dying back
  outside the (glacially shrinking) forest band, a cold-dormant plant — made it flicker
  grown/ungrown. Reported in "wetland / changing habitats".
- **Root cause.** `InstallHUD._growPulse` added to `growth` every frame the button was held,
  keyed ONLY on `coldTolerance`. `Plant.update` was subtracting from the SAME `growth` the same
  frame (die-back / senescence). The two nearly cancelled, so the plant's `growth` crossed the
  growing↔mature/wilting sprite thresholds frame to frame. Kahikatea was the worst offender: it
  is `disturbanceRecruit` (it establishes only on a river flood / eruption pulse / channel
  shift) and was never meant to grow on the FOREST button — `seedGrowth`/`disperseSeed` already
  gate it out, but `_growPulse` did not, so the button pumped growth into a stand `Plant.update`
  was actively senescing.
- **Consequence.** Visible sprite flicker on boosted trees along the river and at forest-band edges.
- **Rule.** `_growPulse` now skips any plant the habitat is already moving — `dormant ||
  suppressed || _senescent` — and any `def.disturbanceRecruit` type, the same gate the other
  grow paths use. Don't let a one-shot interaction write a field a per-frame system is
  simultaneously driving. `TeManawa_hud.js`.
- **Refinement (later).** Kahikatea (disturbanceRecruit) is not merely *skipped* by the button —
  the FOREST boost instead ACCELERATES its lifecycle (`g._kahiBoost` → `Plant.update`'s `accel`,
  scaling grow/age/senesce together). So a press hurries a kahikatea through whatever it is doing:
  a growing stand grows in faster, an aging one senesces sooner, a shrinking one dies out faster —
  never forcing growth onto a stand that is meant to shrink. `TeManawa_plant.js` /
  `TeManawa_simulation.js` / `TeManawa_hud.js`.

## Centre-anchored moa sorted behind trees they stood in front of

- **What happened.** A moa clearly in front of (south of) a tree rendered occluded by it, and
  near a tree the two flickered which-is-in-front ("moa z-fight … render behind trees they are
  in front of").
- **Root cause.** The 3/4 painter's pass (`Simulation.render`) sorts ground entities by `pos.y`
  (depth). Trees are BASE-anchored — their ground contact IS `pos.y` — but the moa was
  CENTRE-anchored: its sprite straddled `groundY(pos.y)`, so the body hung a half-sprite SOUTH
  of the sort key. A moa whose feet were in front of a tree still sorted by a `pos.y` that sat
  behind the tree's base, so it drew first (behind) while its body overlapped the trunk/canopy.
- **Consequence.** Systematic wrong occlusion, plus z-fighting at the crossover.
- **Rule.** The moa is now FOOT-anchored (image drawn with its base on `groundY(pos.y)`), the
  same convention trees use, so its depth sort key matches its drawn ground contact. The Moa/
  art fills its frame with no bottom padding, so the feet land exactly on the point.
  `TeManawa_moa.js`. General: at 3/4, an entity's depth sort key and its drawn ground-contact
  must be the SAME point.

## Shore avoidance was a step function, so grazers rubber-banded off the coast

- **What happened.** Ground birds "rubber-banded a lot" at the coast/water threshold — approach
  the shore, get flung inland, drift back, repeat.
- **Root cause.** `Boid.avoidUnwalkable` Case 2 was binary: nothing until water sat exactly
  `lookAhead` (12 px) ahead, then a full-strength swerve (`maxForce×2`, or a `×3` reversal when
  boxed in — the moa caller then doubled it again). The bird reached the brink carrying momentum,
  took a hard kick straight back, and its own drive (wander / home-range / migration) re-aimed it
  at the shore — so it oscillated across the threshold.
- **Consequence.** Visible rubber-banding of moa / goose / takahē along the water.
- **Rule.** Case 2 is now graduated: the detection distance scales with speed (it banks earlier),
  the steering RAMPS with proximity (gentle at range, firm only at the brink — no last-moment
  kick), and an outward push sized to cancel the least-turn diagonal brakes the into-water
  momentum, so the bird eases up to the edge and turns ALONG the shore instead of ramming it.
  Verified the force ramps 0→~0.03 and flips net-outward as it nears. `TeManawa_boid.js`.
  (Case 1 — the strong eject for a bird already ON water — is unchanged.)

## Animals walked onto the river because walkability was biome-band only

- **What happened.** `terrain.isWalkable(x,y)` returned only `getEffectiveBiomeAt(x,y).walkable`
  — the coarse, elevation-band biome grid. Animals ran out onto the water "quite a lot."
- **Root cause.** The RIVER (and its tributaries) rides THROUGH the walkable lowland at
  grassland elevation, so those cells classify as walkable grassland in the biome grid — the
  river is not represented there as water at all. It is only in the paint layer
  (`waterTypeAt`: 0 land · 1 sea · 2 river). So the boid avoidance (`avoidUnwalkable`), spawn
  placement and migration-target scoring, all of which key off `isWalkable`, treated the river
  as solid ground. `cullSubmergedPlants` had already hit the same coarse-grid gap and fixed it
  for PLANTS by adding a `waterTypeAt` test — but animal walkability was never given the same.
- **Consequence.** Grazers pathed straight onto the river and the sea-margin cells where the
  two classifications disagree; with the new coast-favouring goose it was very visible.
- **Rule.** `isWalkable` now also requires `waterTypeAt(x,y) === 0` (guarded: it returns 0
  before the first bake, so it is a no-op until the ground is painted). One walkability test,
  consulted by every animal path, so painted river/sea is off-limits uniformly — the same
  reasoning as `cullSubmergedPlants`. `TeManawa_terrain.js`; harness asserts no painted river
  cell is walkable. (Residual: the moving coastline can briefly flood a shore-hugging bird,
  which then self-ejects via `avoidUnwalkable` — measured ~0.5 of 25 at any instant.)

## Plants cached their site and never updated as the land morphed

- **What happened.** A plant read `elevation` and `biomeKey` once, in its constructor,
  from the terrain at its spawn point. The deep-time morph re-bakes the land but does
  not rebuild the living world, so those cached values went stale — a podocarp kept
  reading forest elevation while the Ruahine uplifted into the subalpine band under it,
  and so "survived fine" where it should have wilted.
- **Root cause.** Nothing refreshed the cached site after a morph. `cullSubmergedPlants`
  ran at morph-complete but only dropped plants that had gone under water / onto ice.
- **Consequence.** Forest contraction, dormancy and the biome modifier all keyed off the
  spawn-time ground, so cover did not track the changing landscape (uplift, moving coast).
  The harness measured 116 of 117 survivors carrying stale elevation after a full-window morph.
- **Rule.** `cullSubmergedPlants` now also REFRESHES each survivor's `elevation`/`biomeKey`
  from the current terrain (it already computes the biome per plant), so `Plant.update()`
  responds to where the plant now sits. Anything cached from the terrain at spawn must be
  refreshed at morph-complete. `TeManawa_simulation.js`; harness asserts no stale survivors.

## Habitat health as a living-cover ratio

- **What happened.** The habitat-health readout (which desaturates the scene when
  the ecosystem is unwell) was first driven by the ratio of living plant cover.
- **Root cause.** Moa grazing continuously lowers standing cover — that is normal
  churn, not ill health — so the ratio never sits at 1 on a healthy map.
- **Consequence.** A healthy, undisturbed map read as unwell and stayed visibly
  desaturated.
- **Rule.** Health is `ash disturbance × regime fit × recruitment`, all of which
  read exactly 1 on an undisturbed map. Don't reintroduce a raw living-cover term.
  `Game._updateHabitatHealth` in `TeManawa_sketch.js`.

## Climate as a sine wave

- **What happened.** The glacial cycle was first modelled as a generic ~100 kyr
  sinusoidal oscillator over `yearsBP`.
- **Root cause.** Real late-Quaternary cycles are ~100 kyr but strongly
  asymmetric and irregular (MIS 7 has three warm peaks, MIS 5 four substages,
  terminations are abrupt). No closed form reproduces that.
- **Consequence.** Two checkable facts came out wrong: MIS 5e (the last
  interglacial) landed mid-glacial, and the LGM at the end of the run was missed.
- **Rule.** The curve is anchor points from the LR04 benthic stack, smoothstepped
  between and auditable one line at a time. Don't replace it with a parametric
  wave. `Climate.ANCHORS` in `TeManawa_climate.js`.

## A second biome table that rendered nothing

- **What happened.** There was an engine-side biome table (in `sketch.js`)
  alongside the level's `levelDef.biomes`.
- **Root cause.** Only the level's biomes are read by the renderer; the second
  table was authoritative-looking but wired to nothing.
- **Consequence.** Editing it changed nothing on screen — silently — for as long
  as anyone tried.
- **Rule.** The ground look is authored in exactly one place: `levelDef.biomes`.
  There is no engine-side biome table. `Game.loadLevel()` registers the level's
  biomes so `REGISTRY` and `TerrainGenerator` cannot diverge.

## Biome bands read fine but don't draw

- **What happened.** A biome band was authored with a sensible elevation range
  but never appeared.
- **Root cause.** `getBiomeFromElevation` scans ascending by `minElevation` and
  takes the FIRST hit, so a lower band shadows an overlapping higher one; a fully
  shadowed band never draws. Invisible in the data — each band reads fine alone.
- **Consequence.** The second way a biome-colour edit can appear to do nothing.
- **Rule.** Bands are first-match, not blended. Check the console after editing
  bands: `validateBiomeBands()` reports declared vs. effective range at load.

## createGraphics buffers leaked ~4 MB per reseed

- **What happened.** Terrain reseed replaced its `createGraphics` season buffers
  without freeing the old ones.
- **Root cause.** p5 `createGraphics` allocates a GPU-backed buffer that is not
  garbage-collected on reference drop; it must be `remove()`d.
- **Consequence.** ~4 MB leaked per reseed — invisible per reset, fatal to an
  installation that runs for months.
- **Rule.** `remove()` a `createGraphics` buffer before replacing it. See the
  HUD eviction path and `TeManawa_terrain.js`.

## Per-run values written back to CONFIG compounded

- **What happened.** A per-run terrain adjustment (`noiseScale`) was written back
  onto `CONFIG`.
- **Root cause.** `CONFIG` holds authored level values; a run/screen adjustment
  that mutates it is not reset between regenerations.
- **Consequence.** The adjustment compounded every regeneration, drifting the
  terrain away from its authored look.
- **Rule.** Modulate on the instance, never write back to `CONFIG`. Same
  discipline in `TeManawa_projection.js` and `TeManawa_water.js`.

## Season lerp helper allocated ~1,400 closures/frame

- **What happened.** `SeasonManager`'s current→next blends routed through a
  `_lerpSeasonal(thunk, thunk)` helper.
- **Root cause.** Two arrow closures were allocated per call, and the getters run
  per entity per frame (moa hunger/migration, plant modifiers).
- **Consequence.** ~1,400 short-lived functions per frame — the sim's single
  largest GC source.
- **Rule.** Inline the current→next blend in the seasonal getters; don't route
  through a closure-taking helper. `TeManawa_seasons.js`.

## Sprite angle set straight from velocity snapped

- **What happened.** The renderer set a boid's facing angle directly from its
  velocity each frame.
- **Root cause.** Velocity direction can change abruptly; copying it to the
  sprite angle copies the discontinuity.
- **Consequence.** Birds whipped/popped around on direction change instead of
  turning.
- **Rule.** Ease heading toward the target and never rotate past it in a single
  step. Scalar-only, allocation-free. `TeManawa_boid.js`.

## A silent loadImage failure ran for months

- **What happened.** `loadImage` was given `() => {}` as its failure callback. A
  failed load of the moa-juvenile art was swallowed.
- **Root cause.** An empty failure callback turns a missing/failed asset into a
  no-op; the fallback then drew adult art.
- **Consequence.** Juveniles rendered as adults for months before anyone noticed.
- **Rule.** Never pass `() => {}` as a `loadImage` failure callback. Use a real
  handler that surfaces or logs the failure.

## A global guarded via window silently no-opped

- **What happened.** Code guarded a classic-script global through `window.X` /
  `typeof window.X`.
- **Root cause.** A `const`/`class` at the top of a classic script is a lexical
  global — it never becomes a property of `window`.
- **Consequence.** The guard was always false and the branch silently no-opped.
  Found by the headless boot harness, not by testing in a browser.
- **Rule.** Reference classic-script globals by bare name (with `typeof X`), not
  via `window`. `TeManawa_kiosk.js`; `tools/bootcheck.js` guards against it.

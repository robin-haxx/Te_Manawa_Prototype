# Geology across the timeline, at the glacial and interglacial peaks

26 frames of the ground layer at 1920×1080: terrain, water, frost and haze only; no sprites and no
ash. **Every frame sits at a peak of the glacial cycle**: a local extreme of relative sea level, from
`TM_EXPORT.peaks()` in `tools/export_frames.js`, which drops sub-stage wiggles that swing less than
30 m. Mid-swing frames, like the boost stops in `../terrain_boost_stops/`, hide the coast's breathing.
Each frame is stamped with its date, MIS, label, glacial index, eustatic and relative sea level, and
the deep-time factors. All 26 come from one page load (one seed) in the wall's cover-fit view.

**To regenerate:** serve with `node tools/serve.js 8093 --export` (the `temanawa-export` launch
config), open the page at 1920×1080 and load `/tools/export_frames.js` (see its header), then
`TM_EXPORT.run(TM_EXPORT.peaks(), 'terrain_geology_timeline/peak')`.

**Exported 2026-10-19** with, on top of the sea-level fixes (`md/TEMANAWA_COAST_PLAN.md` §5b), the
second-order terrain detail (`md/TEMANAWA_GEOGRAPHY.md` item 11):
- **Ranges:** a ridged fBm (5 octaves, gain 0.5 = H 1, rotated and detuned per octave), plus crest
  texture after the soft ceiling, so the Ruahine is no longer one smooth cap.
- **Meanders:** every channel's line is offset by an fBm that drifts downstream (one wavelength per
  60 kyr). It is free on the low plain, pinned in the gorge and at confluences, straighter in glacials.
  Compare the course at consecutive peaks.
- **Te Āpiti:** a range saddle joins the Ruahine and Tararua across the gap, so they slope down to meet
  the river. The river cuts a narrow, deepening, shingle-banked gorge through it.

| # | Date | MIS | Peak | g | Eustatic | Relative |
|---|---:|---|---|---:|---:|---:|
| 01 | 1,000 ka | 25 | opening; Kidnappers eruption | 0.30 | −20 m | +50 m |
| 02 | 950 ka | 24 | glacial peak | 0.60 | −70 m | 0 m |
| 03 | 920 ka | 23 | interglacial peak; Woodville lake full | 0.34 | −25 m | +45 m |
| 04 | 880 ka | 22 | glacial peak; the Waitapu map's cycle | 0.72 | −90 m | −20 m |
| 05 | 835 ka | 21 | interglacial peak | 0.22 | −15 m | +55 m |
| 06 | 800 ka | 20 | glacial peak | 0.82 | −92 m | −22 m |
| 07 | 787 ka | 19 | interglacial peak | 0.15 | −8 m | +62 m |
| 08 | 740 ka | 18 | glacial peak | 0.88 | −89 m | −19 m |
| 09 | 690 ka | 17 | interglacial peak | 0.20 | −16 m | +54 m |
| 10 | 650 ka | 16 | glacial peak | 0.95 | −115 m | −46 m |
| 11 | 590 ka | 15 | interglacial peak; lake drained | 0.15 | −10 m | +59 m |
| 12 | 540 ka | 14 | glacial peak (a weak glacial) | 0.78 | −62 m | +7 m |
| 13 | 500 ka | 13 | interglacial peak; south drained | 0.25 | −16 m | +52 m |
| 14 | 450 ka | 12 | glacial peak (severe) | 1.00 | −120 m | −53 m |
| 15 | 410 ka | 11 | interglacial peak (long, warm) | 0.08 | +10 m | +76 m |
| 16 | 350 ka | 10 | glacial peak; Whakamaru eruption | 0.85 | −97 m | −34 m |
| 17 | 335 ka | 9 | interglacial peak | 0.15 | −4 m | +58 m |
| 18 | 270 ka | 8 | glacial peak | 0.90 | −98 m | −41 m |
| 19 | 245 ka | 7e | interglacial peak | 0.25 | −18 m | +37 m |
| 20 | 230 ka | 7d | stadial (cool) peak | 0.50 | −59 m | −6 m |
| 21 | 215 ka | 7c | interglacial peak | 0.30 | −11 m | +40 m |
| 22 | 140 ka | 6 | glacial peak (penultimate glacial maximum) | 1.00 | −124 m | −86 m |
| 23 | 122 ka | 5e | interglacial peak; Tokomaru marine bench | 0.05 | +6 m | +40 m |
| 24 | 65 ka | 4 | glacial peak | 0.60 | −83 m | −64 m |
| 25 | 50 ka | 3 | interstadial (warm) peak | 0.55 | −45 m | −30 m |
| 26 | 25.5 ka | 2 | LGM; Ōruanui eruption; window end | 0.90 | −122 m | −114 m |

*Relative* = eustatic plus the land offset (`TerrainGenerator.relativeSeaLevel`). It is what moves
the western coast.

---

## Scorecard

Sources: Trewick & Bland 2012 (T&B, Fig. 4C/4D); Rees, Palmer & Palmer 2019, *Whanganui Basin, an
archive of prehistoric earthquakes? Waitapu Shell Conglomerate (c. 0.9 Ma)* (NZJGG,
doi:10.1080/00288306.2019.1587475; Fig. 10 is the c. 0.88 Ma map); *Plio-Pleistocene geology of the
Lower Pohangina Valley* (2.7 Ma map); Knight 2014, *Ravaged Beauty*; and
`md/TEMANAWA_NATURAL_HISTORY.md` §I.

| Narrative claim | Source | In the frames | Verdict |
|---|---|---|---|
| The east (Hawke's Bay, northern Wairarapa) is largely land by 1 Ma | T&B Fig. 4D | Land in every frame | **Holds** |
| The river already flows west through a gap between low ranges at 1 Ma | T&B | River west through the gap, estuary west (01) | **Holds** |
| Rapid uplift of the Ruahine and Tararua from ~1 Ma; the river keeps pace | T&B; Te Ara; Barney's Point ~1.5 mm/yr | Ranges rise steadily (0.15 → 1); the channel stays open | **Holds** |
| A lake ponds behind the gorge from ~1 Ma, then drains west | T&B (sequence); Rees et al. Fig. 10 ("infilling of lacustrine basin, bottleneck at gorge", c. 0.88 Ma) | Lake 01–09, gone by 590 ka (11) | **Holds.** The drain date is ours |
| West of the ranges was marginal marine at highstands and land at lowstands in the early window | T&B Fig. 4D (pale band); Rees et al. (lowstand braid plains at the eastern margin; Feilding and Halcombe highs under inner shelf during the MIS 22 transgression) | Highstands flood the plain (03, 05, 07, 09); lowstands bare it toward the west edge of the wall (04, 06, 08) | **Holds** |
| The c. 0.88 Ma map shows a **transgression** (rising sea, the Waitapu Shell Conglomerate as transgressive innermost-shelf gravel) | Rees et al. 2019 | The map's shoreline matches the sim as the sea rises out of the 880 ka low (04) toward the 835 ka high (05) | **Holds**, read at the right moment |
| The deepest sea lies off Levin–Foxton at 1 Ma; the south emerges last | T&B | South strait in the early frames, drained by 500 ka (13) | **Holds** (the one positional term kept) |
| The sea returns to the eastern margin by ~570 ka | Rees et al. (marine Mollusca absent from c. 1.19 Ma until the Onepuhi Fossil Beds, c. 570 ka, in the Rangitīkei–Ōroua sections) | MIS 15 floods to the range foot (11) | **Holds** |
| The coast breathes with each glacial cycle | Whanganui Basin record (47 cycles tied to MIS 100–3) | Every consecutive pair of frames, from the first (03 → 04 → 05) | **Holds.** Measured north of the river: highstand shore ~0.32 of the map width every interglacial, lowstand shore 0.26 (MIS 22) → 0.24 (MIS 16) → 0.23 (MIS 12) → 0.14 (MIS 6) → 0.08 (LGM). The first fix swung only 0.39 ↔ 0.42 early (~4 km), so the run read as a coast expanding west |
| Each interglacial returns the sea to the plain's inland edge, through MIS 5e | Rees et al. (c. 0.88 Ma transgression; Onepuhi beds ~570 ka); Knight (MIS 5e Tokomaru bench) | +45 to +76 m at every highstand, +40 m at MIS 5e | **Holds.** The net westward trend is in the lowstands, not the highstands |
| A later glacial bares more shelf than an earlier one | T&B; COAST_PLAN | MIS 22 −20 → MIS 16 −46 → MIS 12 −53 → MIS 6 −86 → LGM −114 m | **Holds** |
| At the LGM the coast lies far to the west across the shelf | T&B (120 m contour) | Off the wall (26) | **Holds** |
| Tributaries feed the gorge from the start and draw together as the ranges steepen | T&B | Fans in the early frames, braided by 650 ka (10), single by ~300 ka | **Holds.** Licence: convergence, not discrete captures |
| The MIS 5e sea lapped the Tokomaru marine bench at the Tararua foot | Knight Fig. 3; NATURAL_HISTORY §I.4 | The low plain floods and the valley estuary widens (23), but the sea stops short of the Tararua foot | **Under-drawn** (below) |
| The river migrates across its plain; meanders are abandoned and replaced | Knight p.20 (the youngest terraces "represent variations in the river route"); Rees et al. ("avulsion and migration of river channels") | The lower course and the tributaries' lower reaches shift between consecutive peaks; straighter in glacials | **Holds** (new). Licence: smooth migration, not discrete avulsions or cut-off oxbows |
| Te Āpiti: the ranges slope in to meet the river, which cuts a narrow gorge through them | Te Ara; the gorge itself | A saddle joins the ranges across the gap, and the river incises a narrow, steep, shingle-banked gorge that deepens with time | **Holds** (new) |
| The Ruahine and Tararua are rugged, dissected ranges | the DEM | Ridged fBm valleys and crest texture | **Holds** (new) |
| Terraces; anticlines | Knight p.20; NATURAL_HISTORY §I.4 | Not shown | **Not built** |

---

## What remains licence

- **One uniform land offset.**
  - Pillans (1986, quoted in Rees et al. 2019) gives 0.3–0.5 m/ka at the modern coast but 1–3 m/ka
    against the axial range. The sim uses 0.3 m/ka everywhere near the present, saturating at 70 m
    further back (`LOOK.plainUplift`, `plainOffsetMax`).
  - So the early highstands reach the range foot, but MIS 5e (+40 m) stays short of the Tokomaru
    bench, which faster uplift near the range would have lifted more.
  - The principled fix is a rate that rises toward the ranges, i.e. a per-cell uplift map. Raising
    the uniform rate instead would drown the early window too deeply.
- **Cartoon elevations.** The terrain is in elevation units, not metres (`seaLandK` maps 1 m to
  0.0016), so the uplift ramp was calibrated against landmarks:
  - the c. 0.88 Ma transgression floods Feilding–Halcombe;
  - the MIS 22 lowstand bares it;
  - MIS 15 reaches the range foot;
  - MIS 5e floods the low plain.

  It was not fitted to a measured shoreline height. Rees et al. don't give the present elevation of
  the Waitapu Shell Conglomerate.
- **The south strait's dates** are authored (1 → 0.5 Ma), as are the lake's.
- **Look nits:**
  - faint relief survives under the drowned estuary arm (05);
  - the steepest range faces (the Ruahine spur at the gorge) render as dense dark streaks: the 3/4
    relief bake drawing side faces on very steep ground;
  - a strip of land along the top-left edge across the drowned sea, from the north-edge falloff.

  The sheer cliffs that the first version of this fix drew along every highstand shore are gone: the
  plain is now lowered with the sea (`md/TEMANAWA_COAST_PLAN.md` §5b), and these frames are
  re-exported with that.
- **Eels.** The 500 ka gate is left over from an older, condensed timeline in which the river reversed
  at 500 ka; the reversal now precedes 1 Ma, so the gate has no reason left.

## A 3–1 Ma prologue

If the build plan takes this up:
- **Geology only.** Offline-rendered key frames played as a short captioned sequence before the
  1 Ma hand-off, not a live morph. This export pipeline already produces them.
- **Key frames:** ~3 Ma (narrow seaway, Tararua peninsula); 2.4 Ma (the Manawatū Strait at its
  widest); ~1.6 Ma (closure, the Mount Bruce divide, the river turning west); 1 Ma (hand-off).
- **Keeping it cheap:**
  - No flora or fauna.
  - Tectonic-scale states at a mean sea level, so no climate anchors are needed before 1 Ma.
  - The 1.6–1 Ma Mangakino eruptions as captions.

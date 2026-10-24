# Geology across the timeline, against the sources

18 frames of the ground layer at 1920×1080: terrain, water, frost and haze only; no sprites and no
ash. Unlike `../terrain_boost_stops/`, where every stop sits mid-swing (glacial index 0.5), these
dates are chosen for geology: each glacial/interglacial pair, each event, and the dates the sources
pin down. Each frame is stamped with its date, MIS, label, glacial index, eustatic and relative sea
level, and the deep-time factors. All 18 come from one page load (one seed) in the wall's cover-fit
view, exported with `node tools/serve.js 8093 --export`; recipe in `../terrain_boost_stops/README.md`.

**Re-exported 2026-10-19 after the sea-level fix** (`md/TEMANAWA_COAST_PLAN.md` §5b). The first set
showed the 1.0–0.8 Ma coast standing still. The fix:
- relative sea level now counts the plain's uplift across the whole window;
- highstands flood by contour;
- the positional stand-ins are retired, except the Levin–Foxton depocentre.

| # | Date | MIS | Label | g | Eustatic | Relative | Uplift | Fan spread | Lake |
|---|---:|---|---|---:|---:|---:|---:|---:|---:|
| 01 | 1,000 ka | 25 | opening; Kidnappers eruption | 0.30 | −20 m | +100 m | 0.15 | 1.00 | 0.33 |
| 02 | 950 ka | 24 | glacial lowstand | 0.60 | −70 m | +50 m | 0.16 | 0.99 | 0.86 |
| 03 | 920 ka | 23 | interglacial; Woodville lake full | 0.34 | −25 m | +95 m | 0.17 | 0.96 | 1.00 |
| 04 | 880 ka | 22 | glacial; the Waitapu map's date | 0.72 | −90 m | +30 m | 0.19 | 0.92 | 1.00 |
| 05 | 835 ka | 21 | interglacial; highest early highstand | 0.22 | −15 m | +105 m | 0.21 | 0.86 | 1.00 |
| 06 | 787 ka | 19 | interglacial | 0.15 | −8 m | +112 m | 0.24 | 0.78 | 0.99 |
| 07 | 650 ka | 16 | strong glacial | 0.95 | −115 m | +1 m | 0.33 | 0.50 | 0.16 |
| 08 | 590 ka | 15 | interglacial; lake drained | 0.15 | −10 m | +102 m | 0.38 | 0.37 | 0 |
| 09 | 500 ka | 13 | south drained; Cook Strait forms | 0.25 | −16 m | +87 m | 0.46 | 0.20 | 0 |
| 10 | 450 ka | 12 | severe glacial | 1.00 | −120 m | −23 m | 0.51 | 0.12 | 0 |
| 11 | 410 ka | 11 | long warm interglacial | 0.08 | +10 m | +101 m | 0.55 | 0.07 | 0 |
| 12 | 349 ka | 10 | Whakamaru eruption | 0.84 | −96 m | −14 m | 0.61 | 0.01 | 0 |
| 13 | 300 ka | 8 | tributary fans closed | 0.70 | −43 m | +30 m | 0.67 | 0 | 0 |
| 14 | 270 ka | 8 | glacial | 0.90 | −98 m | −31 m | 0.70 | 0 | 0 |
| 15 | 140 ka | 6 | penultimate glacial maximum | 1.00 | −124 m | −86 m | 0.85 | 0 | 0 |
| 16 | 122 ka | 5e | highstand; Tokomaru marine bench | 0.05 | +6 m | +40 m | 0.88 | 0 | 0 |
| 17 | 45 ka | 3 | MIS 3 | 0.57 | −50 m | −37 m | 0.97 | 0 | 0 |
| 18 | 25.5 ka | 2 | LGM; Ōruanui; window end | 0.90 | −122 m | −115 m | 1.00 | 0 | 0 |

*Relative* = eustatic plus the plain's uplift since that date (`TerrainGenerator.relativeSeaLevel`).
It is what moves the western coast.

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
| The river already flows west through a gap between low ranges at 1 Ma | T&B | Pinched gap, river east, estuary west (01) | **Holds** |
| Rapid uplift of the Ruahine and Tararua from ~1 Ma; the river keeps pace | T&B; Te Ara; Barney's Point ~1.5 mm/yr | Ranges rise steadily (0.15 → 1); the channel stays open | **Holds** |
| A lake ponds behind the gorge from ~1 Ma, then drains west | T&B (sequence); Rees et al. Fig. 10 ("infilling of lacustrine basin, bottleneck at gorge", c. 0.88 Ma) | Lake 01–06, gone by 590 ka (08) | **Holds.** The drain date is ours |
| West of the ranges was marginal marine at highstands and land at lowstands in the early window | T&B Fig. 4D (pale band); Rees et al. (Feilding and Halcombe highs under inner shelf during the MIS 22 transgression) | Highstands flood to the range foot (01, 03, 05, 06); lowstands bare the plain (02, 04) | **Holds** (new) |
| The c. 0.88 Ma map shows a **transgression** (rising sea, the Waitapu Shell Conglomerate as transgressive innermost-shelf gravel) | Rees et al. 2019 | The sim's sea rises from +30 m at 880 ka to +86 m at 850 ka, so the map's shoreline matches ~860–850 ka, not the 880 ka low point (04) | **Holds**, read at the right moment |
| The deepest sea lies off Levin–Foxton at 1 Ma; the south emerges last | T&B | South strait 01–06, drained by 500 ka (09) | **Holds** (the one positional term kept) |
| The sea returns to the eastern margin by ~570 ka | Rees et al. (marine Mollusca absent from c. 1.19 Ma until the Onepuhi Fossil Beds, c. 570 ka, in the Rangitīkei–Ōroua sections) | MIS 15 floods to the range foot (08) | **Holds** |
| The coast breathes with each glacial cycle | Whanganui Basin record (47 cycles tied to MIS 100–3) | Every frame pair, from the first | **Holds** (was: only after ~650 ka) |
| Older highstands reach further, as the plain stood lower | T&B; Pillans 1986 | MIS 21 +105 → MIS 11 +101 → MIS 5e +40 m | **Holds** |
| A later glacial bares more shelf than an earlier one | T&B; COAST_PLAN | MIS 16 +1 → MIS 12 −23 → MIS 6 −86 → LGM −115 m | **Holds** |
| At the LGM the coast lies far to the west across the shelf | T&B (120 m contour) | Off the wall (18) | **Holds** |
| Tributaries feed the gorge from the start and draw together as the ranges steepen | T&B | Fans 01–06, braided at 650 ka, single by 300 ka | **Holds.** Licence: convergence, not discrete captures |
| The MIS 5e sea lapped the Tokomaru marine bench at the Tararua foot | Knight Fig. 3; NATURAL_HISTORY §I.4 | The low plain floods and the valley estuary widens (16), but the sea stops short of the Tararua foot | **Under-drawn** (below) |
| Terraces; anticlines; avulsion and channel migration | Knight p.20; NATURAL_HISTORY §I.4; Rees et al. ("avulsion and migration of river channels") | Not shown | **Not built** |

---

## What remains licence

- **One uniform uplift rate.**
  - Pillans (1986, quoted in Rees et al. 2019) gives 0.3–0.5 m/ka at the modern coast but 1–3 m/ka
    against the axial range. The sim uses 0.3 m/ka everywhere, ramped in from 800 ka
    (`LOOK.plainUplift`, `plainUpliftOnset`).
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
  - near a highstand shore the steepened beach band can read as stepped terraces (01, 05, 11). That
    is arguably fitting (marine terraces), but not deliberate;
  - faint relief survives under the drowned estuary arm (05).
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

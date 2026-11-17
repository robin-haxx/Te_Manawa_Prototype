// ============================================================
// TE MANAWA: PARAMETRIC CLIMATE
// ------------------------------------------------------------
// One pure function of yearsBP, no dependencies, no p5. One knob of state: TRAVEL.blend (0 = the
// record), which the clock raises while the land races through the prologue, so what the wall SHOWS is
// the cycles' running mean there (glacialIndexAt / seaLevelAt). The record itself is always
// rawIndexAt / rawSeaLevelAt, and every decision (nextRegimeBoundary, the boost's verdict) reads that.
//
//     Climate.at(yearsBP) -> { glacialIndex, seaLevel, snowLine,
//                              tempBias, stage, stageName, mis }
//
// glacialIndex is a low-frequency oscillator over yearsBP; snow line and
// temperature are each a coefficient on it. Sea level has its OWN curve
// (SEA_ANCHORS), because a cold stage is not always a low sea. The sim reads
// glacialIndex for vegetation and cold, seaLevel for the coast.
//
// The curve is a table, not a sine: anchor points from the LR04 benthic
// stack, smoothstepped between and auditable one line at a time. Ages are
// rounded to the MIS; the shape and order are what matter. A parametric wave
// got MIS 5e and the LGM wrong; see MISTAKES.md and
// TEMANAWA_DEEPTIME_ECOLOGY_PLAN.md §2.
// ============================================================

const Climate = {
  // ---- anchors: [yearsBP, glacialIndex]  (0 = interglacial, 1 = full glacial)
  // Ordered oldest -> youngest, matching the direction the run plays.
  ANCHORS: [
    // ---- THE PROLOGUE: 2.1 Ma to 1 Ma, FROM THE RECORD (md/TEMANAWA_PROLOGUE.md §3) ---------
    // The 41-kyr world before the Mid-Pleistocene Transition: 26 glacials and 26 interglacials, one
    // anchor per Marine Isotope Stage at its LR04 δ18O extreme, inside LR04's own stage boundaries,
    // emitted by tools/lr04_prologue.js from research/lr04/ (the stack and boundaries, verbatim).
    // Weak glacials stay under the regime cut (MIS 76, 72, 68, 66, 56), as they did. A visitor's boost
    // crosses several cycles here (DeepTime.nextStop) and lands on a real turn; while the land races,
    // the wall shows their running mean (CYCLE_BLUR, below). Until 2026-11-17 this was one authored
    // 300-kyr cold spell, which the record does not have (MISTAKES.md).
    [2150000, 0.300],   // older than this table: held at the dev sequence's reference state (TEMANAWA_PALAEO_ATTRACT.md)
    // <lr04:anchors> emitted by tools/lr04_prologue.js --write; do not edit by hand
    [2100000, 0.157],   // MIS 79 interglacial, δ18O 3.44 ‰ at 2100 ka
    [2072500, 0.611],   // MIS 78 glacial, δ18O 4.28 ‰ at 2072.5 ka
    [2025000, 0.049],   // MIS 77 interglacial, δ18O 3.24 ‰ at 2025 ka
    [2005000, 0.416],   // MIS 76 glacial, δ18O 3.92 ‰ at 2005 ka
    [1980000, 0.097],   // MIS 75 interglacial, δ18O 3.33 ‰ at 1980 ka
    [1947500, 0.551],   // MIS 74 glacial, δ18O 4.17 ‰ at 1947.5 ka
    [1932500, 0.162],   // MIS 73 interglacial, δ18O 3.45 ‰ at 1932.5 ka
    [1900000, 0.470],   // MIS 72 glacial, δ18O 4.02 ‰ at 1900 ka
    [1887500, 0.238],   // MIS 71 interglacial, δ18O 3.59 ‰ at 1887.5 ka
    [1862500, 0.562],   // MIS 70 glacial, δ18O 4.19 ‰ at 1862.5 ka
    [1855000, 0.222],   // MIS 69 interglacial, δ18O 3.56 ‰ at 1855 ka
    [1847500, 0.351],   // MIS 68 glacial, δ18O 3.80 ‰ at 1847.5 ka
    [1830000, 0.146],   // MIS 67 interglacial, δ18O 3.42 ‰ at 1830 ka
    [1817500, 0.449],   // MIS 66 glacial, δ18O 3.98 ‰ at 1817.5 ka
    [1810000, 0.200],   // MIS 65 interglacial, δ18O 3.52 ‰ at 1810 ka
    [1795000, 0.508],   // MIS 64 glacial, δ18O 4.09 ‰ at 1795 ka
    [1772500, 0.124],   // MIS 63 interglacial, δ18O 3.38 ‰ at 1772.5 ka
    [1747500, 0.573],   // MIS 62 glacial, δ18O 4.21 ‰ at 1747.5 ka
    [1720000, 0.200],   // MIS 61 interglacial, δ18O 3.52 ‰ at 1720 ka
    [1707500, 0.551],   // MIS 60 glacial, δ18O 4.17 ‰ at 1707.5 ka
    [1675000, 0.216],   // MIS 59 interglacial, δ18O 3.55 ‰ at 1675 ka
    [1655000, 0.611],   // MIS 58 glacial, δ18O 4.28 ‰ at 1655 ka
    [1630000, 0.216],   // MIS 57 interglacial, δ18O 3.55 ‰ at 1630 ka
    [1627500, 0.465],   // MIS 56 glacial, δ18O 4.01 ‰ at 1627.5 ka
    [1602500, 0.119],   // MIS 55 interglacial, δ18O 3.37 ‰ at 1602.5 ka
    [1575000, 0.589],   // MIS 54 glacial, δ18O 4.24 ‰ at 1575 ka
    [1565000, 0.222],   // MIS 53 interglacial, δ18O 3.56 ‰ at 1565 ka
    [1535000, 0.681],   // MIS 52 glacial, δ18O 4.41 ‰ at 1535 ka
    [1520000, 0.265],   // MIS 51 interglacial, δ18O 3.64 ‰ at 1520 ka
    [1496000, 0.654],   // MIS 50 glacial, δ18O 4.36 ‰ at 1496 ka
    [1476000, 0.086],   // MIS 49 interglacial, δ18O 3.31 ‰ at 1476 ka
    [1456000, 0.627],   // MIS 48 glacial, δ18O 4.31 ‰ at 1456 ka
    [1436000, 0.049],   // MIS 47 interglacial, δ18O 3.24 ‰ at 1436 ka
    [1412000, 0.676],   // MIS 46 glacial, δ18O 4.40 ‰ at 1412 ka
    [1398000, 0.184],   // MIS 45 interglacial, δ18O 3.49 ‰ at 1398 ka
    [1372000, 0.600],   // MIS 44 glacial, δ18O 4.26 ‰ at 1372 ka
    [1354000, 0.141],   // MIS 43 interglacial, δ18O 3.41 ‰ at 1354 ka
    [1334000, 0.562],   // MIS 42 glacial, δ18O 4.19 ‰ at 1334 ka
    [1316000, 0.238],   // MIS 41 interglacial, δ18O 3.59 ‰ at 1316 ka
    [1290000, 0.649],   // MIS 40 glacial, δ18O 4.35 ‰ at 1290 ka
    [1280000, 0.222],   // MIS 39 interglacial, δ18O 3.56 ‰ at 1280 ka
    [1248000, 0.654],   // MIS 38 glacial, δ18O 4.36 ‰ at 1248 ka
    [1240000, 0.097],   // MIS 37 interglacial, δ18O 3.33 ‰ at 1240 ka
    [1198000, 0.692],   // MIS 36 glacial, δ18O 4.43 ‰ at 1198 ka
    [1166000, 0.205],   // MIS 35 interglacial, δ18O 3.53 ‰ at 1166 ka
    [1126000, 0.730],   // MIS 34 glacial, δ18O 4.50 ‰ at 1126 ka
    [1108000, 0.281],   // MIS 33 interglacial, δ18O 3.67 ‰ at 1108 ka
    [1098000, 0.616],   // MIS 32 glacial, δ18O 4.29 ‰ at 1098 ka
    [1072000, 0.032],   // MIS 31 interglacial, δ18O 3.21 ‰ at 1072 ka
    [1038000, 0.751],   // MIS 30 glacial, δ18O 4.54 ‰ at 1038 ka
    [1022000, 0.227],   // MIS 29 interglacial, δ18O 3.57 ‰ at 1022 ka
    [1004000, 0.611],   // MIS 28 glacial, δ18O 4.28 ‰ at 1004 ka
    // </lr04:anchors>
    // ---- deep window: 1 Ma to 350 ka -------------------------------------------
    // The Mid-Pleistocene Transition sits here: cycles before ~0.86 Ma (~MIS 22,
    // the "900-ka event") are ~41 kyr and lower-amplitude; after it they grow into
    // the strong ~100 kyr sawtooth the younger table carries. Glacials deepen and
    // interglacials warm toward the present. Ages rounded to the MIS. (Rounded hard at the start: LR04
    // puts MIS 28–26 between 1014 and 959 ka; this table joins the record's MIS 28 at 1 Ma and calls
    // that MIS 25. Kept, because every turn of the cycles below is tuned on it.)
    [1000000, 0.30],  // MIS 25: interglacial (pre-MPT, damped)
    [ 950000, 0.60],  // MIS 24: glacial (41-kyr world, modest)
    [ 920000, 0.34],  // MIS 23: interglacial
    [ 880000, 0.72],  // MIS 22: glacial; the ~900-ka intensification (MPT)
    [ 835000, 0.22],  // MIS 21: interglacial (amplitude growing)
    [ 800000, 0.82],  // MIS 20: glacial
    [ 787000, 0.15],  // MIS 19: interglacial (Matuyama-Brunhes; a Holocene analog)
    [ 740000, 0.88],  // MIS 18: glacial
    [ 690000, 0.20],  // MIS 17: interglacial
    [ 650000, 0.95],  // MIS 16: glacial (strong)
    [ 590000, 0.15],  // MIS 15: interglacial
    [ 540000, 0.78],  // MIS 14: glacial (weak to moderate)
    [ 500000, 0.25],  // MIS 13: interglacial (moderate)
    [ 450000, 1.00],  // MIS 12: glacial (one of the largest of the Quaternary)
    [ 410000, 0.08],  // MIS 11: interglacial (exceptionally warm and long)
    [ 375000, 0.55],  // MIS 11 to 10 cooling
    // ---- younger window: 350 ka to 18 ka --------------------------------------
    [350000, 0.85],   // MIS 10: glacial. Whakamaru erupts ~349 ka
    [335000, 0.15],   // MIS 9e: interglacial peak
    [320000, 0.45],
    [300000, 0.70],
    [270000, 0.90],   // MIS 8: glacial maximum
    [245000, 0.25],   // MIS 7e: interglacial
    [230000, 0.50],   // MIS 7d: stadial
    [215000, 0.30],   // MIS 7c
    [195000, 0.35],   // MIS 7a
    [180000, 0.70],
    [160000, 0.85],
    [140000, 1.00],   // MIS 6: Penultimate Glacial Maximum
    [128000, 0.10],   // Termination II, abrupt
    [122000, 0.05],   // MIS 5e: last interglacial, sea level ~+6 m
    [110000, 0.35],   // MIS 5d
    [100000, 0.25],   // MIS 5c
    [ 87000, 0.40],   // MIS 5b
    [ 80000, 0.30],   // MIS 5a
    [ 65000, 0.60],   // MIS 4
    [ 50000, 0.55],   // MIS 3: long, cool, unstable
    [ 40000, 0.60],
    [ 30000, 0.80],
    [ 21000, 1.00],   // MIS 2: Last Glacial Maximum
    [ 18000, 0.95],
    // ---- past the window: the Holocene, to today ---------------------------------
    // The clock stops at 25.5 ka; these are read only by the present-day map (TeManawa_attract.js,
    // TerrainGenerator.snapshotYear(0)), which must stand in today's interglacial.
    [ 11700, 0.30],   // the Holocene begins
    [  8000, 0.05],
    [     0, 0.05]    // today: an interglacial, like MIS 5e
  ],

  // Named intervals for the timeline and the debug overlay. The prologue's are LR04's own boundaries
  // (MIS 28 cut at 1 Ma, where the window's table takes over); from 1 Ma rounded to the nearest few kyr.
  MIS: [
    // <lr04:mis> emitted by tools/lr04_prologue.js --write; do not edit by hand
    [2103000, 2088000, 'MIS 79'], [2088000, 2043000, 'MIS 78'], [2043000, 2017000, 'MIS 77'],
    [2017000, 1990000, 'MIS 76'], [1990000, 1965000, 'MIS 75'], [1965000, 1941000, 'MIS 74'],
    [1941000, 1915000, 'MIS 73'], [1915000, 1898000, 'MIS 72'], [1898000, 1875000, 'MIS 71'],
    [1875000, 1859500, 'MIS 70'], [1859500, 1849000, 'MIS 69'], [1849000, 1832500, 'MIS 68'],
    [1832500, 1826000, 'MIS 67'], [1826000, 1816000, 'MIS 66'], [1816000, 1802500, 'MIS 65'],
    [1802500, 1782000, 'MIS 64'], [1782000, 1758000, 'MIS 63'], [1758000, 1743000, 'MIS 62'],
    [1743000, 1715000, 'MIS 61'], [1715000, 1697500, 'MIS 60'], [1697500, 1670000, 'MIS 59'],
    [1670000, 1642500, 'MIS 58'], [1642500, 1628500, 'MIS 57'], [1628500, 1608000, 'MIS 56'],
    [1608000, 1585000, 'MIS 55'], [1585000, 1570000, 'MIS 54'], [1570000, 1547500, 'MIS 53'],
    [1547500, 1530000, 'MIS 52'], [1530000, 1510000, 'MIS 51'], [1510000, 1492000, 'MIS 50'],
    [1492000, 1469000, 'MIS 49'], [1469000, 1452000, 'MIS 48'], [1452000, 1424000, 'MIS 47'],
    [1424000, 1405000, 'MIS 46'], [1405000, 1383000, 'MIS 45'], [1383000, 1362000, 'MIS 44'],
    [1362000, 1344000, 'MIS 43'], [1344000, 1320000, 'MIS 42'], [1320000, 1304000, 'MIS 41'],
    [1304000, 1286000, 'MIS 40'], [1286000, 1264000, 'MIS 39'], [1264000, 1244000, 'MIS 38'],
    [1244000, 1215000, 'MIS 37'], [1215000, 1190000, 'MIS 36'], [1190000, 1141000, 'MIS 35'],
    [1141000, 1114000, 'MIS 34'], [1114000, 1104000, 'MIS 33'], [1104000, 1081000, 'MIS 32'],
    [1081000, 1062000, 'MIS 31'], [1062000, 1031000, 'MIS 30'], [1031000, 1014000, 'MIS 29'],
    [1014000, 1000000, 'MIS 28'],
    // </lr04:mis>
    [1000000, 960000, 'MIS 25'], [960000, 936000, 'MIS 24'],
    [ 936000, 900000, 'MIS 23'], [900000, 866000, 'MIS 22'],
    [ 866000, 814000, 'MIS 21'], [814000, 790000, 'MIS 20'],
    [ 790000, 761000, 'MIS 19'], [761000, 712000, 'MIS 18'],
    [ 712000, 676000, 'MIS 17'], [676000, 621000, 'MIS 16'],
    [ 621000, 563000, 'MIS 15'], [563000, 533000, 'MIS 14'],
    [ 533000, 478000, 'MIS 13'], [478000, 424000, 'MIS 12'],
    [ 424000, 374000, 'MIS 11'],
    [374000, 340000, 'MIS 10'], [340000, 300000, 'MIS 9'],
    [300000, 245000, 'MIS 8'],  [245000, 190000, 'MIS 7'],
    [190000, 130000, 'MIS 6'],  [130000,  80000, 'MIS 5'],
    [ 80000,  57000, 'MIS 4'],  [ 57000,  29000, 'MIS 3'],
    [ 29000,  14000, 'MIS 2'],  [ 14000,      0, 'MIS 1']
  ],

  // ---- SEA LEVEL: its own curve, NOT a coefficient on glacialIndex ------------------------
  // Sea level and "how cold" are not one number: on the way into a glaciation the isotopes (and so
  // the index) lead sea level, and MIS 3 was cold yet stood far above the LGM. The old straight
  // line from glacialIndex put MIS 3 at −73 m and made every glacial bare the same land. So:
  // [yearsBP, metres rel. present], ON THE SAME DATES AS ANCHORS (sea is low exactly when the land
  // is cold), with magnitudes from the Spratt & Lisiecki (2016) sea-level stack (short stack to
  // 430 ka, long stack to 798 ka; NOAA noaa-ocean-19982), read at that stage's turning point.
  // Three deliberate departures, each from stronger evidence for that interval:
  //   · MIS 5e and MIS 11 from the isostatically adjusted corals (+6, +10), which the stack's scaling
  //     sits ~5–10 m under;
  //   · MIS 3 (50–40 ka) from the Manawatū field record (−25 to −50 m, Sloss 2006) and GIA modelling
  //     (peak ≈ −40 m, Pico et al. 2016/17), where the δ18O-based stack reads −68 to −86 m;
  //   · before 798 ka (no stack) the weak 41-kyr cycles are given modest values in its style;
  //   · in the prologue (2.1–1.0 Ma) LR04 δ18O scaled by its own glacial–interglacial range (today
  //     3.23 ‰ at 0 m, the LGM 5.02 ‰ at −126 m): a scaling, not a reconstruction (tools/lr04_prologue.js).
  // Ages rounded; shape and order are what's true. md/TEMANAWA_COAST_PLAN.md §2.1.
  SEA_ANCHORS: [
    [2150000,  -20],  // older than this table: held (as ANCHORS)
    // <lr04:sea> emitted by tools/lr04_prologue.js --write; do not edit by hand
    [2100000, -15 ],  // MIS 79
    [2072500, -74 ],  // MIS 78
    [2025000, -1  ],  // MIS 77
    [2005000, -49 ],  // MIS 76
    [1980000, -7  ],  // MIS 75
    [1947500, -66 ],  // MIS 74
    [1932500, -15 ],  // MIS 73
    [1900000, -56 ],  // MIS 72
    [1887500, -25 ],  // MIS 71
    [1862500, -68 ],  // MIS 70
    [1855000, -23 ],  // MIS 69
    [1847500, -40 ],  // MIS 68
    [1830000, -13 ],  // MIS 67
    [1817500, -53 ],  // MIS 66
    [1810000, -20 ],  // MIS 65
    [1795000, -61 ],  // MIS 64
    [1772500, -11 ],  // MIS 63
    [1747500, -69 ],  // MIS 62
    [1720000, -20 ],  // MIS 61
    [1707500, -66 ],  // MIS 60
    [1675000, -23 ],  // MIS 59
    [1655000, -74 ],  // MIS 58
    [1630000, -23 ],  // MIS 57
    [1627500, -55 ],  // MIS 56
    [1602500, -10 ],  // MIS 55
    [1575000, -71 ],  // MIS 54
    [1565000, -23 ],  // MIS 53
    [1535000, -83 ],  // MIS 52
    [1520000, -29 ],  // MIS 51
    [1496000, -80 ],  // MIS 50
    [1476000, -6  ],  // MIS 49
    [1456000, -76 ],  // MIS 48
    [1436000, -1  ],  // MIS 47
    [1412000, -82 ],  // MIS 46
    [1398000, -18 ],  // MIS 45
    [1372000, -73 ],  // MIS 44
    [1354000, -13 ],  // MIS 43
    [1334000, -68 ],  // MIS 42
    [1316000, -25 ],  // MIS 41
    [1290000, -79 ],  // MIS 40
    [1280000, -23 ],  // MIS 39
    [1248000, -80 ],  // MIS 38
    [1240000, -7  ],  // MIS 37
    [1198000, -84 ],  // MIS 36
    [1166000, -21 ],  // MIS 35
    [1126000, -89 ],  // MIS 34
    [1108000, -31 ],  // MIS 33
    [1098000, -75 ],  // MIS 32
    [1072000, 1   ],  // MIS 31
    [1038000, -92 ],  // MIS 30
    [1022000, -24 ],  // MIS 29
    [1004000, -74 ],  // MIS 28
    // </lr04:sea>
    [1000000,  -20],  // MIS 25: weak pre-MPT interglacial
    [ 950000,  -70],  // MIS 24
    [ 920000,  -25],  // MIS 23
    [ 880000,  -90],  // MIS 22: the ~900-ka intensification
    [ 835000,  -15],  // MIS 21
    [ 800000,  -92],  // MIS 20 (stack 798 ka: −92)
    [ 787000,   -8],  // MIS 19 (stack max −6 at 774 ka)
    [ 740000,  -89],  // MIS 18 (stack −89 at 720 ka)
    [ 690000,  -16],  // MIS 17
    [ 650000, -115],  // MIS 16 (stack min −115 at 627 ka)
    [ 590000,  -10],  // MIS 15 (stack −9 at 570 ka)
    [ 540000,  -62],  // MIS 14: a weak glacial
    [ 500000,  -16],  // MIS 13: a weak interglacial
    [ 450000, -120],  // MIS 12 (short stack −119 at 430 ka)
    [ 410000,   10],  // MIS 11: corals +6 to +13 (stack +15 to +19)
    [ 375000,  -40],
    [ 350000,  -97],  // MIS 10
    [ 335000,   -4],  // MIS 9e
    [ 320000,  -20],
    [ 300000,  -43],
    [ 270000,  -98],  // MIS 8
    [ 245000,  -18],  // MIS 7e
    [ 230000,  -59],  // MIS 7d
    [ 215000,  -11],  // MIS 7c
    [ 195000,  -15],  // MIS 7a
    [ 180000,  -65],
    [ 160000,  -87],
    [ 140000, -124],  // MIS 6 (stack −124 at 135 ka)
    [ 128000,  -10],  // Termination II, sea rising fast
    [ 122000,    6],  // MIS 5e: corals ~+6
    [ 110000,  -46],  // MIS 5d
    [ 100000,  -19],  // MIS 5c
    [  87000,  -40],  // MIS 5b
    [  80000,  -25],  // MIS 5a (Sloss: interstadials within ~30 m of present)
    [  65000,  -83],  // MIS 4
    [  50000,  -45],  // MIS 3 (field record, not the stack's −68)
    [  40000,  -55],  // MIS 3 (field record, not the stack's −86)
    [  30000, -100],  // the fall into the LGM: ~40 m in under 2 kyr around 30 ka (Lambeck et al. 2014)
    [  28000, -115],
    [  26000, -122],
    [  21000, -126],  // LGM
    [  18000, -113],
    // past the window (read only by the present-day map, as ANCHORS above): the post-glacial rise
    [  11500,  -60],
    [   9000,  -25],
    [   7000,    1],  // the mid-Holocene highstand: the sea reaches today's coast and stays
    [      0,    0]
  ],
  seaLevelWarm:   6,      // the curve's warm and cold ends, for anything still wanting the range
  seaLevelCold: -126,
  snowLineWarm:   0.92,   // normalised elevation, matches SeasonManager
  snowLineCold:   0.55,
  tempWarm:       0,      // degrees C rel. present
  tempCold:      -5,

  // ==========================================================
  // THE CURVE
  // ==========================================================
  // The record (the tables above, smoothstepped). Pure. Every decision reads this.
  rawIndexAt(yearsBP) {
    const a = this.ANCHORS;

    // Outside the table, hold the end values rather than extrapolating.
    if (yearsBP >= a[0][0]) return a[0][1];
    if (yearsBP <= a[a.length - 1][0]) return a[a.length - 1][1];

    for (let i = 0; i < a.length - 1; i++) {
      const [y0, g0] = a[i], [y1, g1] = a[i + 1];
      if (yearsBP <= y0 && yearsBP >= y1) {
        const t = (y0 - yearsBP) / (y0 - y1);
        const s = t * t * (3 - 2 * t);           // smoothstep
        return g0 + (g1 - g0) * s;
      }
    }
    return a[a.length - 1][1];
  },

  // BEFORE THE WINDOW (the attract sequence, md/TEMANAWA_PALAEO_ATTRACT.md): the table holds its first
  // anchor for older dates. The sequence can instead breathe a synthetic pre-MPT cycle — the 41-kyr
  // world, glacials shallower than the later 100-kyr ones (Lisiecki & Raymo 2005): sea = mean +
  // amp·cos(…), phased to join the first anchor continuously — scaled by `scale`, which the sequence
  // sets from its own rate (0 when the land is moving too fast for a cycle to read; 1 when it crawls).
  // The window (≤ the first anchor) never reads this.
  PRE_WINDOW_SEA: { period: 41000, mean: -30, amp: 30, scale: 0 },

  // Sea level (metres rel. present) at yearsBP, from SEA_ANCHORS, smoothstepped like the index.
  rawSeaLevelAt(yearsBP) {
    const a = this.SEA_ANCHORS;
    if (yearsBP >= a[0][0]) {
      const P = this.PRE_WINDOW_SEA, s0 = a[0][1];
      if (!P || !(P.scale > 0) || !(P.amp > 0) || !(P.period > 0)) return s0;
      // Phase so the cycle passes through s0 at the first anchor, rising into the older peak.
      const c0 = Math.max(-1, Math.min(1, (s0 - P.mean) / P.amp));
      const phi = -Math.acos(c0);
      const sea = P.mean + P.amp * Math.cos(2 * Math.PI * (yearsBP - a[0][0]) / P.period + phi);
      return s0 + (sea - s0) * Math.min(1, P.scale);
    }
    if (yearsBP <= a[a.length - 1][0]) return a[a.length - 1][1];
    for (let i = 0; i < a.length - 1; i++) {
      const [y0, s0] = a[i], [y1, s1] = a[i + 1];
      if (yearsBP <= y0 && yearsBP >= y1) {
        const t = (y0 - yearsBP) / (y0 - y1);
        return s0 + (s1 - s0) * t * t * (3 - 2 * t);
      }
    }
    return a[a.length - 1][1];
  },

  // ==========================================================
  // WHAT THE WALL SHOWS: THE CYCLES, BLURRED WHILE THE LAND RACES
  // ==========================================================
  // A boost in the prologue crosses 7–10 of the 41-kyr cycles in 24 s, and the land re-bakes about once
  // a second, so drawn as they are the coast and the ground would jump between whatever stage each bake
  // happened to land on. While the clock races (DeepTime raises TRAVEL.blend to 1; the dev P sequence
  // too), the land shows the cycles' running mean over one obliquity period (±half), which is what a
  // time-lapse that fast can honestly show; when the clock stops the blend eases back to 0 and the land
  // settles on the record (Game._morphTick re-bakes it). Only between `to` and `from`, tapered to the
  // record over `taper` at both ends, so the cycles after 1 Ma are never touched. Built once, lazily.
  CYCLE_BLUR: { from: 2150000, to: 1000000, taper: 40000, half: 20500, step: 500 },
  TRAVEL: { blend: 0 },
  _blur: null,

  _blurBuild() {
    const B = this.CYCLE_BLUR, lo = B.to - B.half - B.step, hi = B.from + B.half + B.step;
    const n = Math.ceil((hi - lo) / B.step) + 1, k = Math.round(B.half / B.step);
    const gr = new Float64Array(n), sr = new Float64Array(n);
    for (let i = 0; i < n; i++) { const y = lo + i * B.step; gr[i] = this.rawIndexAt(y); sr[i] = this.rawSeaLevelAt(y); }
    const gi = new Float32Array(n), sea = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - k), b = Math.min(n - 1, i + k);
      let g = 0, s = 0; for (let j = a; j <= b; j++) { g += gr[j]; s += sr[j]; }
      gi[i] = g / (b - a + 1); sea[i] = s / (b - a + 1);
    }
    return (this._blur = { lo, step: B.step, n, gi, sea });
  },
  // How much of the blur a date takes: 0 outside (to, from), 1 inside, smoothstepped over taper.
  _blurW(y) {
    const B = this.CYCLE_BLUR;
    if (!(y > B.to) || !(y < B.from)) return 0;
    let t = Math.min(y - B.to, B.from - y) / B.taper;
    if (t >= 1) return 1;
    return t * t * (3 - 2 * t);
  },
  _blurAt(y, arr) {
    const Bl = this._blur || this._blurBuild();
    let f = (y - Bl.lo) / Bl.step;
    f = f < 0 ? 0 : f > Bl.n - 1 ? Bl.n - 1 : f;
    const i = Math.floor(f), j = i + 1 < Bl.n ? i + 1 : i, t = f - i, A = Bl[arr];
    return A[i] + (A[j] - A[i]) * t;
  },
  // The running mean itself (fully blurred), for the harness and the docs.
  blurredIndexAt(y) { const r = this.rawIndexAt(y), w = this._blurW(y); return w > 0 ? r + (this._blurAt(y, 'gi') - r) * w : r; },
  blurredSeaLevelAt(y) { const r = this.rawSeaLevelAt(y), w = this._blurW(y); return w > 0 ? r + (this._blurAt(y, 'sea') - r) * w : r; },

  // What the wall shows: the record, blurred by TRAVEL.blend inside the prologue. The seasons, the
  // terrain's sea, the plants' palette and the console's clock read these.
  glacialIndexAt(yearsBP) {
    const r = this.rawIndexAt(yearsBP), b = this.TRAVEL.blend;
    if (!(b > 0)) return r;
    const w = this._blurW(yearsBP);
    return w > 0 ? r + (this._blurAt(yearsBP, 'gi') - r) * b * w : r;
  },
  seaLevelAt(yearsBP) {
    const r = this.rawSeaLevelAt(yearsBP), b = this.TRAVEL.blend;
    if (!(b > 0)) return r;
    const w = this._blurW(yearsBP);
    return w > 0 ? r + (this._blurAt(yearsBP, 'sea') - r) * b * w : r;
  },

  // ==========================================================
  // THE FULL STATE
  // ==========================================================
  at(yearsBP) {
    const g = this.glacialIndexAt(yearsBP);
    return {
      glacialIndex: g,
      seaLevel:  this.seaLevelAt(yearsBP),
      snowLine:  this.snowLineWarm + (this.snowLineCold - this.snowLineWarm) * g,
      tempBias:  this.tempWarm     + (this.tempCold     - this.tempWarm)     * g,
      stage:     this.stageOf(g),
      stageName: this.stageNameOf(g),
      mis:       this.misAt(yearsBP)
    };
  },

  // Four readable bands, used by the timeline shading and the debug overlay.
  // The sim reads glacialIndex directly, never these.
  stageOf(g) {
    if (g < 0.25) return 0;   // interglacial
    if (g < 0.50) return 1;   // cooling
    if (g < 0.75) return 2;   // glacial
    return 3;                 // full glacial
  },

  stageNameOf(g) {
    return ['interglacial', 'cooling', 'glacial', 'full glacial'][this.stageOf(g)];
  },

  misAt(yearsBP) {
    for (const [y0, y1, name] of this.MIS) {
      if (yearsBP <= y0 && yearsBP > y1) return name;
    }
    return '';
  },

  // ==========================================================
  // ANALYSIS: for the timeline and for tuning
  // ==========================================================
  // Samples the curve across the run so the timeline can draw the wave and
  // shade the cold bands. Call it once and keep the result: the curve is
  // fixed for the life of the page.
  sample(yearsStart, yearsEnd, n = 240) {
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      const yr = yearsStart + (yearsEnd - yearsStart) * (i / (n - 1));
      out[i] = { yearsBP: yr, g: this.rawIndexAt(yr) };
    }
    return out;
  },

  // The interglacial/glacial split. The sim's regime-fit machinery (SeasonManager.getWinterness,
  // InstallHUD._growMatches, the second-screen boost) all cut the glacial index here.
  regimeThreshold: 0.5,

  // ==========================================================
  // NEXT REGIME BOUNDARY — the second screen's goal (md/TEMANAWA_SECOND_SCREEN.md §6.2/§7.1)
  // ----------------------------------------------------------
  // Given a year, return the next year FORWARD in playback (younger, toward the present) at which
  // the glacial index crosses out of the current stage into its opposite — i.e. the START OF THE
  // NEXT interglacial/glacial. This is where a boost's timelapse (TeManawa_time.js) plays TO, and
  // it is the goal the console shows; a single pure helper both read, so they can never disagree.
  // Scans in `step`-year strides from yearsBP toward `endYearsBP`, then bisects the crossing to ~1 yr
  // for a clean date. Returns { yearsBP, glacialIndex, stage, stageName } for the boundary, or null
  // if the curve never crosses before the window end (the timelapse then runs to the terminal).
  nextRegimeBoundary(yearsBP, endYearsBP = 0, step = 500) {
    const thr = this.regimeThreshold;
    const cold0 = this.rawIndexAt(yearsBP) >= thr;          // the record, never the blur
    for (let y = yearsBP - step; y >= endYearsBP; y -= step) {
      const cold = this.rawIndexAt(y) >= thr;
      if (cold !== cold0) {
        // The crossing sits in (y, y+step): y is already the NEW regime, y+step still the old.
        let lo = y, hi = y + step;                          // lo = new-regime side, hi = old-regime side
        for (let k = 0; k < 24 && hi - lo > 1; k++) {
          const mid = (lo + hi) / 2;
          if ((this.rawIndexAt(mid) >= thr) === cold0) hi = mid; else lo = mid;
        }
        // floor, not round: lo is the NEW-regime side and yearsBP falls forward in time, so
        // flooring stays in the new regime. Math.round could land a year on the OLD side (519.2 ka:
        // g 0.500002), so a boost's time-lapse stopped still glacial and the next boost played 1 yr.
        const by = Math.floor(lo);
        const g = this.rawIndexAt(by);
        return { yearsBP: by, glacialIndex: g, stage: this.stageOf(g), stageName: cold ? 'glacial' : 'interglacial' };
      }
    }
    return null;
  }
};

// Node/bootcheck can require this file directly to test the curve without p5.
if (typeof module !== 'undefined' && module.exports) module.exports = { Climate };

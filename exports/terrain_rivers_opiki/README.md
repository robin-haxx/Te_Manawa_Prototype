# The whole catchment, rivers that move, and the Opiki cycle

32 ground-layer frames at 1920×1080, all from one page load (one seed), exported 2026-10-20 after the
river rework (`md/TEMANAWA_GEOGRAPHY.md` item 12, `md/TEMANAWA_NATURAL_HISTORY.md` step 11).

- `peak_01` … `peak_26`: every glacial and interglacial peak, as in `../terrain_geology_timeline/`
  (which predates this work and was drawn with the old three-tributary skeleton). Compare consecutive
  peaks for the course shifts.
- `opiki_1` … `opiki_6`: the MIS 5e cycle at the lower Manawatū, step by step:

| Frame | Date | What to look for |
|---|---:|---|
| opiki_1 | 135 ka | MIS 6 ending: rivers on the bared plain, no estuary |
| opiki_2 | 128 ka | The transgression drowns the lower Manawatū valley and the lower tributary valleys |
| opiki_3 | 125 ka | The estuary at its fullest |
| opiki_4 | 122 ka | The peak: the estuary's margins and heads begin to fill with swamp |
| opiki_5 | 118 ka | The sea has stood still for ~12 kyr: the fill has spread toward the mouth, and swamp forest has taken about half of it |
| opiki_6 | 110 ka | The sea has fallen: the filled plain stays, swamp and forest, until the glacial |

**To regenerate:** serve with `node tools/serve.js 8093 --export`, open the page at 1920×1080, load
`/tools/export_frames.js`, then run `TM_EXPORT.run(...)` with the peaks list (`TM_EXPORT.peaks()`) and
the six dates above, under `terrain_rivers_opiki/`.

## What changed

| | Before | Now |
|---|---|---|
| Tributaries | 3 unnamed lines; the Ōroua drawn un-rotated (svg2geo dropped the transform) | 12 named rivers in the real confluence order; svg2geo applies transforms |
| Sources | Fan streams started 4–32% down the line, often on open sand | Off the map or on range ground |
| Width | Uniform, about half the main | Thinner, widening from the source to the mouth |
| Bends | Main ±0.034 of the map; tributaries ±0.02 on their lower half only | Main ±0.05, tributaries ±0.035 wherever they leave the ranges; corridor-bounded |
| Course shifts | None | A new course at each glacial termination |
| Confluences | The main pinned still at each one | Free: a tributary's mouth slides with its parent |
| Sea | A drowned tributary's lower reach still drew as river from the beach | Its water ends at the shore |
| Estuary | Main valley only, never filled | Tributary valleys drown too; the estuary fills to swamp, then swamp + forest, and outlasts the sea's fall |

## Sources

- Hesp, P. A. & Shepherd, M. J. 1978. Some aspects of the late Quaternary geomorphology of the lower
  Manawatu Valley. *NZ J. Geology and Geophysics* 21: 403–412. (Estuaries in the lower Manawatū and
  Ōroua valleys behind the Himatangi anticline and Poroutawhao High; glacial coalescing gravel fans;
  former meanders cutting the Tokomaru terrace margin.)
- Jackson, J., Van Dissen, R. & Berryman, K. 1998. Tilting of active folds and faults in the Manawatu
  region. *NZ J. Geology and Geophysics* 41: 377–385. (Consequent streams heading on fold crests;
  capture consistently southward under a regional tilt.)
- Wikipedia, *Manawatū River*: the tributaries and their confluence order.

## Licence still taken

- A course shift is a smooth swing at each termination, not a discrete avulsion; abandoned channels
  are not left behind as swamp.
- The fill runs on a clock (the stillstand age), not a sediment budget.
- The coastal barriers that sheltered the estuary and the anticlines that deflect the rivers are not
  landforms.
- Twelve tributaries on a 512-cell grid: the minor streams are floored at ~3 cells wide, so they read
  wider than their real share of the catchment.

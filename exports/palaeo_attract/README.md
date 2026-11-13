# The land before the window — the attract sequence's dated maps

12 frames of the ground layer from the browser build: terrain, water and the names of the time, no
sprites, no HUD. One per keyframe of the attract sequence (`TM_PALAEO.keyframes`) and per turn of the
Manawatū Strait (`md/TEMANAWA_PALAEO_ATTRACT.md` §1), oldest first, each stamped with its date and the
deep-time factors. All from one page load (one seed) in the wall's cover-fit view, so the frame shows
map u ≈ 0.16 … 0.84, v ≈ 0.11 … 0.78.

**To regenerate:** serve with `node tools/serve.js 8093 --export`, open the page at 1920×1080
(`?render=2d` is fine), load `/tools/export_frames.js` (see its header), then
`TM_EXPORT.run(TM_EXPORT.palaeo(), 'palaeo_attract/palaeo', { palaeo: true })`.

| # | Date | What the frame shows | Source |
|---|---:|---|---|
| 01 | 4,000 ka | About half the frame low coastal plain round the axis, widest at the gorge's latitude (a beach fringe, then pale lowland grass); the Tararua the lasting land, as green hills; the Ruahine low plain; no seaway at the gorge (no river yet, the drainage develops from ~1.6 Ma); a shelf sea to the west, deep water off the south-east (the Ruataniwha side) | Trewick & Bland 2012 Fig. 4A, p. 160; Young-1, p. 170 |
| 02 | 3,450 ka | The sea onlaps the plain from both coasts toward the axis | p. 170 (Young-1: ~3.6 Ma west of the gorge) |
| 03 | 3,300 ka | The plain gone, the finger left; the first marine breach across the gorge area (late Waipipian) | p. 170 |
| 04 | 3,000 ka | A narrow seaway across the southern Ruahine, the Manawatū Strait: the Ruahine a finger of low land ending ~10 km north of the gorge, the Tararua's hills from near Palmerston North; the whole frame a shelf sea | Fig. 4B, p. 163 |
| 05 | 2,750 ka | The strait closed: the gorge area land, planed (Mangapanian) | p. 165 |
| 06 | 2,400 ka | The Manawatū Strait at its most extensive; the Ruahine a scatter of shoals north of it; the Tararua low green hills | Fig. 4C, p. 165 |
| 07 | 2,000 ka | The strait still open | — |
| 08 | 1,630 ka | The strait closes for good (Castlecliffian) | Rees, Palmer & Palmer 2017 |
| 09 | 1,500 ka | Mount Bruce uplift closes the Ruataniwha Strait: its coast sweeping east (1.75 → 1.3 Ma); the west a shallow, shelf to marginal-marine sea; the proto-ranges named | p. 166 |
| 10 | 1,300 ka | The east is land, the west still sea | — |
| 11 | 1,150 ka | The river turning west (the NE arm receding); the plain emerging; the sea darkening back to the window's | p. 167, p. 171 |
| 12 | 1,000 ka | The window opens: the sim's own 1 Ma (identical terms) | Fig. 4D |

The 4 Ma, 3 Ma, 2.4 Ma and 1 Ma frames are the four maps of Trewick & Bland's Fig. 4, read inside this
frame; the rest are the turns between them. Re-exported 2026-11-13 after the maps were registered on the
frame and the land re-drawn to them (`research/palaeogeography/`; `md/TEMANAWA_PALAEO_ATTRACT.md` §2: the
apron, the Tararua's hills, the shelf tone, the strait measured from the gap). The climate is held at the
window's first anchor (MIS 25) throughout, by design (§1 of the plan).

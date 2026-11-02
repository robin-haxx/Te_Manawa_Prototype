# The land before the window — the attract sequence's dated maps

11 frames of the ground layer from the browser build: terrain, water and the names of the time, no
sprites, no HUD. One per keyframe of the attract sequence (`TM_PALAEO.keyframes`) and per turn of the
Manawatū Strait (`md/TEMANAWA_PALAEO_ATTRACT.md` §1), oldest first, each stamped with its date and the
deep-time factors. All from one page load (one seed) in the wall's cover-fit view, so the frame shows
map u ≈ 0.16 … 0.9.

**To regenerate:** serve with `node tools/serve.js 8093 --export`, open the page at 1920×1080
(`?render=2d` is fine), load `/tools/export_frames.js` (see its header), then
`TM_EXPORT.run(TM_EXPORT.palaeo(), 'palaeo_attract/palaeo', { palaeo: true })`.

| # | Date | What the frame shows | Source |
|---|---:|---|---|
| 01 | 4,000 ka | Deep-marine Wanganui Basin over the plain; a low, continuous finger of basement along the axis; no seaway at the gorge (a low isthmus, the river cut into it); the Ruataniwha shelf in the east | Trewick & Bland 2012 Fig. 4A, p. 160 |
| 02 | 3,300 ka | The first marine breach across the gorge area (late Waipipian) | p. 170 |
| 03 | 3,000 ka | A narrow seaway, the Manawatū Strait; the Ruahine a finger of low land and shoals | Fig. 4B, p. 163 |
| 04 | 2,750 ka | The strait closed: the gorge area land, planed (Mangapanian) | p. 165 |
| 05 | 2,400 ka | The Manawatū Strait at its most extensive; the northern Tararua under it; the Ruahine a scatter of sandbanks | Fig. 4C, p. 165 |
| 06 | 2,000 ka | The strait still open | — |
| 07 | 1,630 ka | The strait closes for good (Castlecliffian) | Rees, Palmer & Palmer 2017 |
| 08 | 1,500 ka | Mount Bruce uplift closes the Ruataniwha Strait: its coast sweeping east (1.75 → 1.3 Ma); the basin shelf to marginal marine; the proto-ranges named | p. 166 |
| 09 | 1,300 ka | The east is land, the west still sea | — |
| 10 | 1,150 ka | The river turning west (the NE arm receding); the plain emerging | p. 167, p. 171 |
| 11 | 1,000 ka | The window opens: the sim's own 1 Ma (identical terms) | Fig. 4D |

The 4 Ma, 3 Ma, 2.4 Ma and 1 Ma frames are the four maps of Trewick & Bland's Fig. 4, read inside this
frame; the rest are the turns between them. Re-exported 2026-11-02 after the marine terms became ceilings
(the isthmus, the strait's shores, the east front; `md/TEMANAWA_PALAEO_ATTRACT.md` §5 rows 25–26). The climate is held at the window's first anchor (MIS 25)
throughout, by design (§1 of the plan).

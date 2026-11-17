# The prologue — proof frames (2026-11-17, on the record's climate)

Seven frames of the **running sim** (not terrain stills: the living world, the HUD, the names and the
captions), one visitor's first six boosts from the opening. Dev reference for `md/TEMANAWA_PROLOGUE.md`;
not needed on the wall.

| Frame | The clock | What it shows |
|---|---|---|
| `prologue_0_2000ka_a_sea_strait.jpg` | 2.0 Ma, MIS 76 (interglacial regime) | The opening: two low lands, the strait between them, its three names, the first chapter's caption |
| `prologue_0b_1800ka_the_strait_closing.jpg` | ~1.80 Ma | Mid time-lapse of boost 1 (16 s in, 25,000 yr/s): the strait shoaling shut, the land on the cycles' mean, the line "Ice ages come and go, every 41,000 years", the ribbon's prologue in thin stripes |
| `prologue_1_1583ka_the_strait_closes.jpg` | 1,582,655 BP, MIS 54, glacial | Boost 1 landed and settled on the record: one land north to south, no river; *proto-Ruahine Range* |
| `prologue_2_1286ka_a_river_crosses_the_land.jpg` | 1,286,020 BP, interglacial | Boost 2 landed: the east emerged, the *proto-Manawatū* on low land |
| `prologue_3_1000ka_kidnappers.jpg` | 1,000,300 BP | Boost 3 stopped short of Kidnappers; the eruption firing, with its caption |
| `prologue_4_969ka_the_ranges_start_to_rise.jpg` | 969 ka, glacial | Boost 4, the cycles' first turn (its caption had already faded when the frame was taken) |
| `prologue_5_902ka_older_than_the_mountains.jpg` | 902 ka, glacial | Boost 6 |

**How they were taken.** `node tools/serve.js 8093 --export`, the page at
`/?dev=1&render=2d&sprites=1` (the 2D path draws everything on one 1920×1080 canvas, so one `toBlob`
is the whole frame), frames stepped by hand at a fixed 60 fps (a virtual `millis`, `_drawFrame()` in a
loop, `TMBus.heartbeat()` every 15 frames), boosts sent with `TMBus.boost({ plantKey })`, each canvas
posted to `/__export?path=prologue/…` as PNG, then re-encoded as JPEG (quality 88) to keep the set under 4 MB. The land is one random seed; another page load draws another.

The pale box across the top of the land at 2 Ma and 1.6 Ma is the far edge's own treatment (the far rows
eased to plains and carried up to the buffer's edge) meeting a coast: inside the cycles the far rows are
land from side to side and it reads as haze.

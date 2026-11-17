# LR04 — the record the prologue's climate is built on

Two files, copied verbatim (rows unchanged, whitespace normalised) from the authors' site on 2026-11-17:

| File | From | What |
|---|---|---|
| `LR04stack_940-2160ka.txt` | https://lorraine-lisiecki.com/LR04stack.txt | the benthic δ¹⁸O stack, 940–2160 ka: age (ka), δ¹⁸O (‰), standard error. 2 kyr spacing to 1500 ka, 2.5 kyr beyond |
| `LR04_MISboundaries_900-2200ka.txt` | https://lorraine-lisiecki.com/LR04_MISboundaries.txt | Marine Isotope Stage boundaries, 900–2200 ka |

Lisiecki, L. E. & Raymo, M. E. 2005. A Pliocene–Pleistocene stack of 57 globally distributed benthic δ¹⁸O
records. *Paleoceanography* 20, PA1003. doi:10.1029/2004PA001071.

`node tools/lr04_prologue.js` turns them into the prologue's climate (one anchor per stage, MIS 79 → 28,
at the stage's δ¹⁸O extreme) and `--write` puts it into `TeManawa_climate.js`. How and why:
`md/TEMANAWA_PROLOGUE.md` §3. To extend the record (the window's own table, before 2.1 Ma), add the rows
here first, then widen the tool's stage range.

# Te Manawa — handoff plan

**The assessment before release, and the plan for handing the piece to the museum to run as a
kiosk.** Written 2026-11-05 against commit `2c5e67b` (`main`). For the author, who hands it over,
and for the museum's exhibitions and AV people, who receive it. How to run it day to day is
`TEMANAWA_OPERATIONS.md`; what is built and what is not is `TEMANAWA_PLAN_V3.md` §13–§14; the
one-page sheet that ships inside the package is `../deploy/OPERATOR_QUICKSTART.md`.

---

## 0. The short version

- **State.** Feature-complete and in final testing. Every phase in the plan is built; the harness
  passes (one seed-dependent check, §8); the kiosk layer has been hardened and exercised. It has
  **never run on the install hardware**, and all visitor-facing copy is draft pending co-design.
- **How to hand it over: as a package, not a repository.** The museum receives one folder,
  `TeManawa-win32-x64` (a zip), built by `node tools/make_deploy.js --electron --platform win32
  --smoke --zip`. In it: `TeManawa.exe` (the kiosk shell: server, wall window, console window, focus,
  crash recovery, nightly restart, log), the pages and art, `VERSION.txt`, a config file, the
  autostart scripts and a one-page operator sheet. The repository, tagged at the same commit, stays
  the source of truth and goes to the museum as escrow (§2.3).
- **Why a shell and not two Chrome windows.** The documented install (Chrome kiosk × 2 + `node
  tools/serve.js`) has two unverified points: a second `--kiosk` launch into a running profile does
  not take a window position, and only the focused window hears the macro pad. Two profiles fix the
  first and break the bus. The shell resolves both deterministically (§1.4). Chrome + server stays the
  fallback and the authoring path.
- **Before opening, six things must happen** (§4): the build is run on the real PC and its GPU
  renders WebGL at 60 fps on the 4K wall; the two windows land on their displays from a cold boot;
  the console drives the wall through a day; recovery works (renderer kill, process kill, power
  cycle); a 7-day soak reads clean; photosensitivity and content are signed off.
- **What the museum provides:** the PC and displays (§3), one named AV/IT contact, the decisions in
  §7, and the co-design outcome for the words on screen.

---

## 1. Assessment

### 1.1 What is built

The plan's phase table (`TEMANAWA_PLAN_V3.md` §13) is all ✅: the terrain (SVG skeleton, deep-time
morph, the sea-level coast, 3/4 cel look, water, river names), the glacial-cycle climate to 1 Ma,
the plants and their cover dynamics, the four eruptions and their aftermath, the thirteen-bird cast on
dedicated art, the touchscreen console and its bus, the plant goals, the time dial, the 4 Ma → 1 Ma
attract sequence, and the kiosk layer (watchdog, error ring buffer, nightly reload, idle attract, key
lockdown, `draw()` recovery, the console's own layer, the software-WebGL guard). The code is vanilla
JavaScript on p5 with no build step, 45 scripts hand-ordered in `index.html`, and the documentation
is unusually complete: a design spine, a technical companion, an operator guide, an incident log with
rules, and a working-notes file for whoever maintains it next.

### 1.2 What the harness proves, and what it cannot

`tools/bootcheck.js` loads every script in page order under a stubbed p5 and DOM, boots, draws 120
frames, presses every button, cycles the overlays, times resets, and asserts about sixty behaviours
from the climate curve to the attract sequence's geography. It has caught real bugs that reading the
code did not. On this commit it was run three times today:

| Run | Result |
|---|---|
| 1 | 1 failure: *the strait name sits on sea at 2.4 Ma* (palaeo attract) |
| 2 | clean |
| 3 | clean |

The failing check reads the painted surface under a label's anchor on the harness's **random-noise
terrain** (`noise` is `Math.random()` there, unseeded), where that anchor is marginal. It is a flake
of the harness, not a regression of the build (§8), and it belongs on the list of seed-dependent
checks the plan already names.

What the harness cannot see: it never opens a browser. No WebGL, no GPU, no real frame timing, no 4K,
no touch, no second window. `make_deploy.js --smoke` (built today) closes part of that gap: it serves
the **package** and boots both pages in one headless Chromium profile, failing on a page error, a 404,
an entry in the kiosk error log, or a bus that does not carry telemetry one way and a dial detent the
other. Headless GL is software, so the smoke exercises the 2D fallback renderer, not the WebGL
path the wall will use. The WebGL path is proven only on the real machine (§4, gate 3).

### 1.3 Risks, ranked

1. **It has never run on the target hardware.** The whole performance budget
   (`TEMANAWA_BUILD_V3.md` §5) is "estimates with the arithmetic shown", and the two Chrome
   measurements on record are at 1920×1080 on a dev machine. The 4K wall is the unknown: the sprite
   layer renders at 2× the 1080 logical size, the terrain at 1080, through the WebGL batch renderer
   that is ~7× faster than the 2D path. If the PC's GPU is on Chromium's blocklist, or its driver
   loses the context, the piece silently falls to 2D and will not hold 60 fps at 4K.
   *Mitigation:* the hardware spec in §3; gate 3 of the acceptance test; the shell's
   `ignoreGpuBlocklist` switch; the PERF panel reads the live render mode.
2. **Long-run stability is inferred, not observed.** The nightly reload and now the nightly process
   relaunch defeat slow leaks; a `createGraphics` leak has been found and fixed before; the reseed
   path's full `init()` was measured at 11–12 s in Chrome before the FES fix, against a 10 s
   watchdog (it stamps the heartbeat afterwards, so it does not trip, but a slow PC narrows margins
   everywhere). *Mitigation:* the 7-day soak (gate 6) with the shell log and the kiosk error log
   read daily.
3. **The physical input is not yet mapped.** `secondscreen/input.js` carries a *temporary* 3-key
   macro-pad overload (`B_LONG_PRESS_ERUPTS`: short B boosts, long B erupts) and, in absolute switch
   mode, the `e` detent shadows the eruption key. Until the real pad exists, the bindings are a
   guess. *Mitigation:* set `SWITCH_MODE` and `KEYS` at commissioning, with the pad on the bench.
4. **The words on screen are drafts.** Every name, card and goal line is placeholder copy pending
   co-design with Rangitāne o Manawatū (`PLAN_V3.md` §16.10; the proposal in the repo root says the
   same). This is a content dependency, not a code one: the console's copy is one file
   (`secondscreen/encyclopedia.js`), the goal book another (`TeManawa_goals.js`), both plain data,
   both checked by the harness ("encyclopedia roster", "plant goals"). *Mitigation:* §5.3, an edit
   path that does not need a developer for words.
5. **Photosensitivity has not been signed off on the real panel.** The rule (≤ 3 luminance
   transitions/s, large changes ramped ≥ 500 ms) is written down and the eruption flash is ramped,
   but the sign-off is a measurement on the installed display. Gate 5.
6. **One developer.** The documentation is the mitigation and it is strong, but the museum needs a
   named support contact with a response expectation (§5.1), and the repository in its own hands.
7. **Rights in the assets.** The code is MIT. The sprites are artist-supplied; the two display
   fonts are `OpenDyslexic` (open licence) and `NF Nadira Pro`, whose licence for a public
   installation must be confirmed; the 17 audio files are unused and not shipped; `research/`
   holds copyrighted papers that must not be redistributed. §2.4 is the checklist.
8. **Repository hygiene.** The repo is 1.1 GB: a 590 MB history, a 222 MB unused ash sequence,
   189 MB of terrain snapshot exports with two duplicate `- Copy` folders. None of it reaches the
   package (86 MB), but it bears on what is handed over as escrow (§9).
9. **Two performance decisions are still open:** `CONFIG.mapGrid` at 512 against a 256 long-term
   target (`PLAN_V3.md` §16.5), and the live fauna outline prototype on for two species (§16.11).
   Both are "profile on the real machine, then decide".

### 1.4 The decision: package it, as the kiosk shell

Three ways to hand it over were weighed:

| | Hand over | Museum needs | Two-display install | Macro pad focus | Verdict |
|---|---|---|---|---|---|
| A | the repository + `OPERATIONS.md` | Node.js, Chrome, a technician who reads the docs | unverified (`[verify]` in §2 of the operator guide) | "keep the console focused" by hand | the fallback, not the handoff |
| B | a deploy folder (`make_deploy.js`) + Chrome + Node + launch scripts | Node.js installed, Chrome managed, scripts maintained | same two unknowns as A | same | the folder is still built; it sits inside C |
| C | **the kiosk shell** (Electron) wrapping B's folder | nothing installed; one folder, one exe | each window is placed on its display by the program | the shell pins focus to the console | **chosen** |

What C costs: a packaging step (the pages themselves are unchanged and still have no build), about
450 MB on disk instead of 86 (a 230 MB zip; Electron's runtime is the difference), an unsigned executable (SmartScreen warns once on a downloaded zip;
"unblock" or a code-signing certificate fixes it), and a pinned Chromium that gets security patches
only when the shell is rebuilt. For an offline kiosk the pin is a virtue: nothing updates itself
under the museum's feet.

What C gives, beyond placement and focus: no Node.js on the museum PC and no port-collision
footgun (the shell falls back to a free port and both pages still find each other); renderer-crash
and hang recovery outside the page (the page's own watchdog cannot run while its thread is hung);
display-sleep blocking; a log file the AV team can send; a nightly process relaunch on top of the
pages' own 03:00 reload; `--dev` for diagnostics without touching the URL; and `--displays` so the
display mapping is a number in a config file rather than a guess.

Verified in this session (Linux, a virtual display, software GL, so the 2D renderer): `make_deploy.js
--smoke` boots the package's wall in 17 s headless with the kiosk layer armed, the bus carrying
telemetry one way and a dial detent the other, no page errors and no 404s; and the shell, driven by
Playwright, starts the server, opens both windows in kiosk mode (the wall booted 21 s from launch),
carries the bus both ways, holds focus on the console when the wall is focused, refuses a close
request on a kiosk window, reloads a crashed wall renderer (back and booted in 23 s), and writes the
log. `tools/shell_check.js` is that test, runnable on any dev machine with the Electron install. **Not verified here:** anything on
Windows (there is no Windows in this environment), the two-display placement on real displays, and
the PowerShell autostart scripts. Those are the first three items of the acceptance test.

---

## 2. What the museum receives

### 2.1 The package

`TeManawa-win32-x64.zip` (about 230 MB; 450 MB unpacked), unzipped to a folder of the museum's
choosing (for example `C:\TeManawa\`). Built here from this commit as a proof of the pipeline; the
museum's copy is built from the tagged release (§6). Inside:

| | |
|---|---|
| `TeManawa.exe` + Electron's runtime files | the shell (`electron/main.js`) |
| `resources/app/web/` | the deploy folder: `index.html`, p5, the 45 engine scripts, the level, the geography, the sprites (minus the unused ash set and retired art), the three fonts in use, the console page, `tools/serve.js`, `LICENSE` |
| `resources/app/web/manifest.json` | every shipped file with its size and sha256 |
| `VERSION.txt` | release, build date, commit, branch, engine version |
| `temanawa.config.json` | display mapping, port, nightly restart hour, GPU override; notes inside |
| `OPERATOR_QUICKSTART.md` | the one-page operator sheet |
| `install_autostart.ps1`, `run_temanawa.ps1` | start at logon, restart on exit, sleep timeouts off |

The deploy folder on its own (`dist/temanawa-web/`) is also a valid handover for the Chrome fallback.

### 2.2 The documents

Inside the repository, read in this order: `OPERATOR_QUICKSTART.md` (floor staff, AV),
`TEMANAWA_OPERATIONS.md` (AV/IT: what it does on its own, inputs, diagnosing, commissioning),
`TEMANAWA_PLAN_V3.md` §13–§16 (what it is and what is open), `CLAUDE.md` and `MISTAKES.md` (whoever
maintains the code), `md/README.md` (the index). The proposal (`Avian_Age_TeManawa_Proposal.docx`)
is the original brief and its open questions are still the open questions.

### 2.3 The source

Tag the commit the package was built from (recommended name `v1.0.0-rc.1`, then `v1.0.0` after
acceptance) and give the museum read access to the GitHub repository at that tag, or a zip of the
tree at the tag. `VERSION.txt` in every package names its commit, so a package can always be traced
to its source. The museum should hold the source whether or not it intends to edit it: it is the
only way the piece outlives any one developer.

### 2.4 Rights and licences — a checklist to clear before the handover letter

- [ ] **Code:** MIT (`LICENSE`, copyright the author). Say so in the handover letter.
- [ ] **Sprites and console art:** artist-supplied. A written licence or assignment to the museum for
      exhibition use, naming the artist(s). Retired art in `sprites/_retired/` is not shipped.
- [ ] **`NF Nadira Pro`** (the display face, both pages): confirm the licence covers an installation
      viewed by the public and ships inside the package.
- [ ] **`OpenDyslexic`**: open licence (SIL OFL / Bitstream Vera terms); include its licence text.
- [ ] **Audio:** off and not shipped. If audio returns, clear the 17 files' provenance first.
- [ ] **`research/`** (six PDFs of published papers): not in the package; do not include them in any
      escrow copy without checking their terms.
- [ ] **Place names, narratives, species stories:** the co-design outcome governs; nothing on screen
      is final until Rangitāne o Manawatū have seen it (`PLAN_V3.md` §16.10).
- [ ] **Third-party code:** p5.js 1.11.11 (LGPL), Electron (MIT) and Chromium (BSD and others;
      `LICENSES.chromium.html` ships in the package).

---

## 3. Hardware

Nothing has been measured on the install PC, so this is a specification that keeps the design's
budgets, not a tested bill of materials. The commissioning gates (§4) are where it is confirmed.

| | Requirement | Why |
|---|---|---|
| **PC** | Windows 11 Pro (or Windows 10/11 IoT Enterprise LTSC), 16 GB RAM, SSD, two display outputs | Task Scheduler and policy control; LTSC avoids feature updates |
| **GPU** | hardware WebGL at 3840×2160@60 with headroom: a current Intel Arc / Iris Xe-class integrated GPU or any modest discrete GPU (GTX 1650 / RX 6400 class or better); **not** a UHD-600-class Celeron NUC or a thin client | the WebGL batch renderer and the 4K fill rate are the whole frame budget; a blocklisted or software GPU drops to the 2D path |
| **Wall display** | 4K, 16:9, over HDMI 2.0 / DisplayPort 1.2 or better (4K60) | the diorama is designed at 16:9; other ratios letterbox (`?terrain=fit` adapts the footprint) |
| **Console display** | 1080p touchscreen, HID touch (no driver software), landscape | the console is a fixed 1920×1080 stage scaled to the panel |
| **Controls** | the habitat switch, plant select, storm, boost, eruption and the time dial as **one USB HID keyboard** (a macro pad / keyboard encoder), sending the keys in `secondscreen/input.js` | the console owns all physical input and relays it over the bus |
| **Network** | none; the PC should be off the network, or on one that cannot reach it | the piece never uses it; Windows Update is the only thing that would |
| **Service** | a USB keyboard in the cabinet | Ctrl+Shift+Q, `--dev`, the log |
| **Power** | mains, no UPS needed; on a timer or always on | the shell survives both; the nightly restart assumes the PC is on at 03:05 or power-cycled daily |

Display scaling: leave Windows at 100 % on the 4K wall if possible. The shell places windows by
display bounds, so scaling works, but a 150 % wall makes Chromium composite at a fractional ratio
for no gain.

---

## 4. Acceptance test — the gates before opening

On the install PC, with the package of record, in this order. Each gate has a pass condition; a
failed gate stops the sequence and goes back to the developer with `VERSION.txt` and the log.

| # | Gate | Pass when |
|---|---|---|
| 0 | **Build of record** | `VERSION.txt` names the tagged commit; `node tools/bootcheck.js`, `node tools/make_deploy.js --smoke` and `node tools/shell_check.js` passed on that commit on a dev machine; the museum has the zip's sha256 |
| 1 | **Cold boot, no hands** | power-cycle the PC: within two minutes both windows are full screen on the right displays (`TeManawa.exe --displays`, then `temanawa.config.json` if the largest-display guess is wrong), no desktop visible, no dialog |
| 2 | **The console drives the wall** | turn the dial: the console's clock changes. Boost a plant: the wall rings it and runs the time-lapse. Storm; eruption. The macro pad's keys all land (set `input.js` first) |
| 3 | **Performance on the wall** | the debug overlay (`--dev`, then `D`) PERF panel reads **WebGL**; 60 fps at rest; ≥ 50 fps through a boost time-lapse and an eruption; the reseed (`init()` on every 12th landing, under the attract's dark) stays under the 10 s watchdog |
| 4 | **The attract** | leave it 3 minutes: dip to dark, the land before the river for about 4 minutes, landing on a living world; any touch skips to the landing. Run the dial to the end of the window: the same |
| 5 | **Recovery** | end the wall's renderer in Task Manager: back within 15 s. End `TeManawa.exe`: the scheduled task brings it back within a minute. Pull the power: gate 1 again. The log shows each event |
| 6 | **Soak** | seven days of opening hours (or a continuous week) with the shell log and `Kiosk.getErrorLog()` read daily: no `[Kiosk] stall`, no `renderer gone` outside the ones you caused, memory flat across the nightly restarts, the console still focused each morning |
| 7 | **Photosensitivity** | measured on the installed wall: ≤ 3 luminance transitions/s and large changes ramped ≥ 500 ms through the eruption, storm and boost; signed by whoever holds that responsibility at the museum |
| 8 | **Content** | the names, cards and goal lines on screen are the co-design outcome, and the open decisions in §7 are made |

Gate 3 is where the hardware risk (§1.3, item 1) is paid: if it fails, the options are a better GPU,
`"ignoreGpuBlocklist": true`, `"query": "sprites=1"` on the wall (sprites at 1080 instead of 2×), or
the `mapGrid` drop the plan has been holding, in that order.

---

## 5. Support model

### 5.1 Who does what

| Tier | Who | Can | Has |
|---|---|---|---|
| Floor | gallery staff | restart it (power cycle, or Ctrl+Shift+Q and double-click), recognise the attract as normal, report a problem | `OPERATOR_QUICKSTART.md` |
| AV / IT | the museum's named contact | display mapping and config, the autostart task, Windows settings, read the log, replace the folder with a new build | `TEMANAWA_OPERATIONS.md`, the package |
| Developer | the author (or a successor with the repo) | code, content, rebuilds, the harness | the repository, `CLAUDE.md`, `MISTAKES.md` |

Agree a response expectation for the developer tier in writing (for example: acknowledgement in two
working days, a rebuilt package for a content change in a week) and a point at which the museum's
AV contact takes over routine operation entirely. A problem report is: `VERSION.txt`, the shell log
(`%APPDATA%\TeManawa\temanawa-shell.log`), what the visitor was doing.

### 5.2 Updating

Stop it, replace the folder (keep `temanawa.config.json`), start it. Every build carries its own
`VERSION.txt`; keep the previous folder beside the new one until the new one has run a day.

### 5.3 Changing the words without a developer

The console's cards and the plant goals are plain data in two files. A museum educator can edit them
with the repository, Node.js and the harness: edit `secondscreen/encyclopedia.js` (names, taxonomy,
descriptions, fauna links) or `TeManawa_goals.js` (the goal book), run `node tools/bootcheck.js`
(the "encyclopedia roster" and "plant goals" sections check that every card still fits its era and
every species and sprite still resolves), then `node tools/make_deploy.js --electron --platform win32
--smoke --zip` for a new package. If the museum does not want that path, the developer does it; it is
an hour's work either way.

---

## 6. Release procedure (the author)

1. `node tools/bootcheck.js` clean (re-run a seed-dependent failure before treating it as real; §8).
2. Set the release number in `electron/package.json` (`version`); it is stamped into `VERSION.txt`.
3. Commit; tag (`git tag -a v1.0.0-rc.1 -m "…"`; `git push --tags`).
4. Once per build machine: `cd electron && npm ci` (downloads Electron and the packager; behind a
   proxy that cuts long transfers, see `electron/README.md`).
5. `node tools/make_deploy.js --electron --platform win32 --smoke --zip`. It fails loudly on a
   missing asset reference, a page error, a 404, or a dead bus. Then `node tools/shell_check.js`
   drives the shell itself on the folder just built. Look at `dist/smoke/*.png` anyway.
6. Record the zip's sha256 and the `VERSION.txt` contents in the release note.
7. Deliver the zip; the museum runs gates 0–8.
8. After acceptance, tag `v1.0.0` on the same commit and write the gate results into
   `TEMANAWA_PLAN_V3.md` §13 (or a short `RELEASES.md`), so the next build has a baseline.

Building the Windows package from Linux or macOS works (the packager fetches the Windows Electron
zip) but skips the executable's icon and file-description metadata, which need Wine off Windows; a
build made on Windows gets them. Neither affects behaviour. Code-signing is optional and solves only
the one-time SmartScreen prompt on a zip downloaded from the web.

---

## 7. Decisions the museum must make

From `TEMANAWA_PLAN_V3.md` §16, the ones that change what visitors see:

1. **The console between visitors** (§16.13): return to its landing card when the wall goes to the
   attract, or hold the last habitat? (A small change; the shell does not decide it.)
2. **The title** (§16.12): *Avian Age: Te Manawa* on the page, *A River Older Than Mountains* in the
   blog. The package uses the page's.
3. **The end-card** (§16.9): acknowledge the absences (97 % of the wetland gone) or not.
4. **Audio** stays off for opening (decided); whether it returns later, and with what.
5. **Names, narration, which stories are told** (§16.10): the co-design track. The build treats
   every name and label as a replaceable hook.
6. **The physical controls**: momentary or absolute habitat switch, and the eruption key, so
   `input.js` can be set once and the temporary B-hold overload retired.

---

## 8. Known issues and flakes

- **Harness, seed-dependent:** *the strait name sits on sea at 2.4 Ma* (palaeo attract) failed on 1 of
  3 runs on 2026-11-05 on noise terrain; *fauna stability*'s refound count is already documented as
  seed-dependent. A harness fix (stage the strait's anchor on sea, or check the mechanism as the
  Tararua check does) is cheap and should land before the release tag so the gate-0 run is boring.
- **Headless smoke uses the 2D renderer** (software GL is refused by design). WebGL is proven only on
  hardware (gate 3).
- **Windows, two real displays and the PowerShell scripts are untested in this session.** The shell
  was verified under Linux on one virtual display (§1.4). Gate 1 and gate 5 cover them.
- **`input.js` is in its temporary 3-key state** until the real pad exists (§1.3, item 3).
- **Open plan items** that are not defects: the aftermath's staged beats, the *Dinornis* dimorphism
  pair, the attract's pacing and notes, the `mapGrid` drop, the outline prototype (§14.3–14.4, §16).

---

## 9. Before handing over the repository (optional hygiene)

`TEMANAWA_PLAN_V3.md` §14.4 lists the cleanup: move the unused 222 MB `sprites/Environmental/AshCloud/`
and the ~30 superseded top-level sprites to `_retired/` (or drop them), delete the duplicate
`exports/terrain_geology_timeline - Copy*` folders and the August `geo/manawatu_0…5.svg` drafts,
and the unused fonts. Separately, decide what to do about `research/` (§2.4). None of this changes the
package; it changes what a successor downloads, from 1.1 GB to a few hundred MB, and what the museum
is asked to hold.

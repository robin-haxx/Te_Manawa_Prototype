# Te Manawa — handoff plan

**The assessment before release, and the plan for handing the piece to the museum to run as a
kiosk.** Written 2026-11-05 against commit `2c5e67b` (`main`). Brought up to date on 2026-11-17, when
the kiosk shell, the audio rebuild, the prologue and the island inset were merged onto one branch, and
merged with the 2026-11-14 checklist of what is left (§10). Checked again on 2026-11-26 against the two
commits since: `3a05552` (the prologue's climate rebuilt on the LR04 record) and `7feef91` (shorter
intro and inset copy). Checked on 2026-11-27 with no code change since: the harness run on the author's
Windows machine (§8), the 2026-11-17 docs not yet on the release branch (§2.2, §10.1), and
`TEMANAWA_PLAN_V3.md` §0, §13, §14 and §16 brought up to this plan. For the author, who hands it over, and for
the museum's exhibitions and AV people, who receive it. How to run it day to day is
`TEMANAWA_OPERATIONS.md`; what is built and what is not is `TEMANAWA_PLAN_V3.md` §13–§14; the one-page
sheet that ships inside the package is `../deploy/OPERATOR_QUICKSTART.md`.

---

## 0. The short version

- **State.** Feature-complete and in final testing. Every phase in the plan is built; the harness
  passed on 2026-11-17 bar seed-dependent checks, but on the latest commit it prints three failures on
  Linux and on Windows alike: two from the 2026-11-25 copy cut, one a *prologue* check that fails on
  every machine tried (§8); the kiosk layer has been hardened and exercised. It has
  **never run on the install hardware**, and all visitor-facing copy is draft pending co-design. The
  Windows package has run once on a 4K display, from the author's Intel Iris Xe laptop (2026-11-27): wall
  and console on their own displays, WebGL, 60 fps at rest (§1.4).
  Since 2026-11-05: **audio is on** (2026-11-10), **the run opens at 2 Ma** on the Manawatū Strait (the
  prologue, 2026-11-13), the intro and outro carry **an island inset**, and the prologue's climate is
  **the LR04 record**, not an authored swing (2026-11-17).
- **Start now, because they depend on other people:** the RNZ / Te Papa clearance for the recreated
  bird calls (§2.4) and the mana whenua co-design (§10.3). Both take longer than any code change left.
- **How to hand it over: as a package, not a repository.** The museum receives one folder,
  `TeManawa-win32-x64` (a zip), built by `node tools/make_deploy.js --electron --platform win32
  --smoke --zip`. In it: `TeManawa.exe` (the kiosk shell: server, wall window, console window, focus,
  crash recovery, nightly restart, log), the pages, art and sound, `VERSION.txt`, a config file, the
  autostart scripts and a one-page operator sheet. The repository, tagged at the same commit, stays
  the source of truth and goes to the museum as escrow (§2.3).
- **Why a shell and not two Chrome windows.** The documented install (Chrome kiosk × 2 + `node
  tools/serve.js`) has two unverified points: a second `--kiosk` launch into a running profile does
  not take a window position, and only the focused window hears the macro pad. Two profiles fix the
  first and break the bus. The shell resolves both deterministically (§1.4). Chrome + server stays the
  fallback and the authoring path.
- **Before opening, these must happen** (§4): the build is run on the real PC and its GPU renders
  WebGL at 60 fps on the 4K wall; the two windows land on their displays from a cold boot; the console
  drives the wall through a day; recovery works (renderer kill, process kill, power cycle); a 7-day
  soak reads clean; photosensitivity, content, sound and the audio rights are signed off.
- **What the museum provides:** the PC, displays and speakers (§3), one named AV/IT contact, the
  decisions in §7, and the co-design outcome for the words on screen.

---

## 1. Assessment

### 1.1 What is built

The plan's phase table (`TEMANAWA_PLAN_V3.md` §13) is all ✅:

- the terrain (SVG skeleton, deep-time morph, the sea-level coast, 3/4 cel look, water, river names)
- the glacial-cycle climate to 1 Ma, and **the prologue** before it (the run opens at 2 Ma:
  `TEMANAWA_PROLOGUE.md`). Since 2026-11-17 the prologue's climate is LR04's 41-kyr cycles, emitted from
  `research/lr04/` by `tools/lr04_prologue.js`; a boost there crosses several cycles and lands on a real
  turn
- the plants and their cover dynamics, the four eruptions and their aftermath
- the thirteen-bird cast on dedicated art
- the touchscreen console and its bus, the plant goals, the time dial, the health milestones
- the attract (the live opening land), with its intro and outro over the present-day map and the
  island inset
- the audio: Web Audio, room limits, `audio/CREDITS.md`
- the kiosk layer: watchdog, error ring buffer, nightly reload, idle attract, key lockdown, `draw()`
  recovery, the console's own layer, the software-WebGL guard

The code is vanilla JavaScript on p5 with no build step, its scripts hand-ordered in `index.html`. The
documentation is unusually complete: a design spine, a technical companion, an operator guide, an
incident log with rules, and a working-notes file for whoever maintains it next.

### 1.2 What the harness proves, and what it cannot

`tools/bootcheck.js` loads every script in page order under a stubbed p5 and DOM, boots, draws 120
frames, presses every button, cycles the overlays, times resets, and asserts about sixty behaviours
from the climate curve to the attract's geography. It has caught real bugs that reading the code did
not. Since 2026-11-17 one check reads data outside the page: the prologue's climate must match what
`tools/lr04_prologue.js` emits from `research/lr04/`, so the harness needs that folder. The runs on
record are in §8.

What the harness cannot see: it never opens a browser. No WebGL, no GPU, no real frame timing, no 4K,
no touch, no second window, no sound. `make_deploy.js --smoke` closes part of that gap: it serves the
**package** and boots both pages in one headless Chromium profile, failing on a page error, a 404, an
entry in the kiosk error log, or a bus that does not carry telemetry one way and a dial detent the
other. Which renderer it exercises depends on the machine: where the browser has no GPU (a Linux
container) the guard refuses the software GL and the wall runs the 2D fallback; with the installed
Chrome on a machine with a GPU, the headless wall runs WebGL (the author's Windows laptop, 2026-11-27).
Until that day the smoke and `shell_check.js` read a flag that does not exist (`GLBatch.active`; the
engine's is `GLBatch.domStack`) and reported "2D" whatever ran, so the earlier records of a 2D smoke
say nothing about the renderer. Either way the smoke times nothing: 4K frame rate on the install PC is
gate 3.

### 1.3 Risks, ranked

1. **It has never run on the target hardware.** The whole performance budget
   (`TEMANAWA_BUILD_V3.md` §5) is "estimates with the arithmetic shown", and the Chrome measurements on
   record are at 1920×1080 on a dev machine. The 4K wall is the unknown: the sprite layer renders at 2×
   the 1080 logical size, the terrain at 1080, through the WebGL batch renderer that is ~7× faster than
   the 2D path. If the PC's GPU is on Chromium's blocklist, or its driver loses the context, the piece
   silently falls to 2D and will not hold 60 fps at 4K. One data point since: on an Intel Iris Xe laptop
   driving a 4K monitor, the package ran WebGL at 60 fps at rest and 53 fps with the dial at the top
   (2026-11-27, §1.4). That is the low end of §3's GPU class, so the class looks right; it is not the
   install PC.
   *Mitigation:* the hardware spec in §3; gate 3; the shell's `ignoreGpuBlocklist` switch; the PERF
   panel reads the live render mode.
2. **Long-run stability is inferred, not observed.** The nightly reload and the nightly process
   relaunch defeat slow leaks; a `createGraphics` leak has been found and fixed before; the reseed
   path's full `init()` stamps the heartbeat so it does not trip the 10 s watchdog, but a slow PC
   narrows margins everywhere. *Mitigation:* the 7-day soak (gate 6) with the shell log and the kiosk
   error log read daily.
3. **The audio rights are not cleared.** Most clips are CC0 or CC BY (DOC), two are CC BY-SA, and the
   moa, huia and Finsch's duck calls are **recreations owned by RNZ and Te Papa, not openly licensed**.
   They are used with the author's go-ahead but not yet agreed with either, and they are committed to
   the repository. *Mitigation:* §2.4; `TM_AUDIO.birdRecreated = false` silences them in one line.
4. **The physical input is not yet mapped.** `secondscreen/input.js` carries a *temporary* 3-key
   macro-pad overload (`B_LONG_PRESS_ERUPTS`: short B boosts, long B erupts) and, in absolute switch
   mode, the `e` detent shadows the eruption key. *Mitigation:* set `SWITCH_MODE` and `KEYS` at
   commissioning, with the pad on the bench.
5. **The words on screen are drafts.** Every name, card, caption and goal line is placeholder copy
   pending co-design with Rangitāne o Manawatū (`PLAN_V3.md` §16.10). This is a content dependency, not
   a code one: the console's copy is one file (`secondscreen/encyclopedia.js`), the goal book another
   (`TeManawa_goals.js`), the attract's and the inset's copy two objects (`TM_ATTRACT.copy`,
   `TM_ISLAND.copy`), all plain data, the first two checked by the harness. *Mitigation:* §5.3.
6. **The sound has not been heard in the room.** The clips were chosen and cut by measurement, not by
   ear. *Mitigation:* gate 8.
7. **Photosensitivity has not been signed off on the real panel.** The rule (≤ 3 luminance
   transitions/s, large changes ramped ≥ 500 ms) is written down and the eruption flash is ramped,
   but the sign-off is a measurement on the installed display. Gate 7.
8. **One developer.** The documentation is the mitigation and it is strong, but the museum needs a
   named support contact with a response expectation (§5.1), and the repository in its own hands.
9. **Other rights in the assets.** The code is MIT. The sprites are artist-supplied; the display
   fonts are `OpenDyslexic` (open licence) and `NF Nadira Pro`, whose licence for a public
   installation must be confirmed; the island inset's maps, shown to every visitor who presses, are
   redrawn from figures in a published paper (Trewick & Bland 2012); `research/` holds copyrighted
   papers that must not be redistributed. §2.4.
10. **Two performance decisions are still open:** `CONFIG.mapGrid` at 512 against a 256 long-term
    target (`PLAN_V3.md` §16.5), and the live fauna outline prototype on for two species (§16.11). Both
    are "profile on the real machine, then decide".

### 1.4 The decision: package it, as the kiosk shell

Three ways to hand it over were weighed:

| | Hand over | Museum needs | Two-display install | Macro pad focus | Verdict |
|---|---|---|---|---|---|
| A | the repository + `OPERATIONS.md` | Node.js, Chrome, a technician who reads the docs | unverified (`[verify]` in §2 of the operator guide) | "keep the console focused" by hand | the fallback, not the handoff |
| B | a deploy folder (`make_deploy.js`) + Chrome + Node + launch scripts | Node.js installed, Chrome managed, scripts maintained | same two unknowns as A | same | the folder is still built; it sits inside C |
| C | **the kiosk shell** (Electron) wrapping B's folder | nothing installed; one folder, one exe | each window is placed on its display by the program | the shell pins focus to the console | **chosen** |

What C costs: a packaging step (the pages themselves are unchanged and still have no build), about
460 MB on disk instead of ~94 (Electron's runtime is the difference), an unsigned executable
(SmartScreen warns once on a downloaded zip; "unblock" or a code-signing certificate fixes it), and a
pinned Chromium that gets security patches only when the shell is rebuilt. For an offline kiosk the pin
is a virtue: nothing updates itself under the museum's feet.

What C gives, beyond placement and focus: no Node.js on the museum PC and no port-collision footgun
(the shell falls back to a free port and both pages still find each other); renderer-crash and hang
recovery outside the page (the page's own watchdog cannot run while its thread is hung);
display-sleep blocking; a log file the AV team can send; a nightly process relaunch on top of the
pages' own 03:00 reload; `--dev` for diagnostics without touching the URL; and `--displays` so the
display mapping is a number in a config file rather than a guess.

Verified on 2026-11-05 (Linux, a virtual display, software GL, so the 2D renderer): `make_deploy.js
--smoke` booted the package's wall in 17 s headless with the kiosk layer armed and the bus working
both ways, no page errors and no 404s; and the shell, driven by Playwright (`tools/shell_check.js`),
started the server, opened both windows in kiosk mode, carried the bus both ways, held focus on the
console, refused a close request on a kiosk window, reloaded a crashed wall renderer (back in 23 s),
and wrote the log.

Verified on Windows on 2026-11-27, on the author's laptop (Windows 11 Pro, Intel Iris Xe, its own
1920×1200 panel at 125 % as display 0 and a 4K monitor at 150 % as display 1), with the package built
there (§10.4):

- `tools/shell_check.js` passed every check: both kiosk windows full screen, WebGL, the bus both ways,
  the console holding focus, a close refused, the crashed wall back in 11 s, the log written, no page
  errors. It needed two fixes to the check itself: its dial step predated the attract, where a
  console intent only starts the intro, and its render readout read a flag that does not exist (§1.2).
- `TeManawa.exe --displays` listed both displays, and the packaged `TeManawa.exe` with its shipped
  config (`largest` / `other`) put the wall on the 4K and the console on the laptop panel, both in
  kiosk full screen. The wall booted in 8.4 s on WebGL (ANGLE, Direct3D 11, the sprite layer at
  3840×2160) with an empty kiosk error log. Frame rate, counted in the page:

  | Wall state | fps | worst frame |
  |---|---|---|
  | the attract (the 2 Ma land, no UI) | 59.8 | 53 ms |
  | the intro (today's map, the inset) | 60.1 | 29 ms |
  | play, at rest | 59.7 | 61 ms |
  | the dial at the top (5,000 yr/s, the land morphing) | 53.0 | 276 ms |
  | a storm | 58.8 | 195 ms |

  Gate 3's thresholds hold on this machine. The single long frames in the dial run and the storm are
  hitches worth watching on the install PC (§8). Not measured: a boost's time-lapse, an eruption,
  the every-12th reseed, Windows at 100 % scaling.

**Still not verified:** the install PC itself, a cold boot, the touch panel, the macro pad and the
PowerShell autostart scripts. Those are gates 1, 2 and 5 of the acceptance test.

---

## 2. What the museum receives

### 2.1 The package

`TeManawa-win32-x64.zip` (about 460 MB unpacked, with audio), unzipped to a folder of the museum's
choosing (for example `C:\TeManawa\`). The museum's copy is built from the tagged release (§6). Inside:

| | |
|---|---|
| `TeManawa.exe` + Electron's runtime files | the shell (`electron/main.js`) |
| `resources/app/web/` | the deploy folder: `index.html`, p5, the engine scripts, the level, the geography (`geo/*.js`: the skeleton and the island maps), the sprites (minus retired art), the three fonts in use, the sound (`audio/birds`, `sfx`, `ui` and `CREDITS.md`, while `TM_AUDIO.enabled`), the console page, `tools/serve.js`, `LICENSE` |
| `resources/app/web/manifest.json` | every shipped file with its size and sha256 |
| `VERSION.txt` | release, build date, commit, branch, engine version |
| `temanawa.config.json` | display mapping, port, nightly restart hour, GPU override; notes inside |
| `OPERATOR_QUICKSTART.md` | the one-page operator sheet |
| `install_autostart.ps1`, `run_temanawa.ps1` | start at logon, restart on exit, sleep timeouts off |

The deploy folder on its own (`dist/temanawa-web/`) is also a valid handover for the Chrome fallback.

### 2.2 The documents

Inside the repository, read in this order: `OPERATOR_QUICKSTART.md` (floor staff, AV),
`TEMANAWA_OPERATIONS.md` (AV/IT: what it does on its own, inputs, diagnosing, commissioning),
`TEMANAWA_PLAN_V3.md` §13–§16 (what it is and what is open), `audio/CREDITS.md` (every clip's source
and licence), `CLAUDE.md` and `MISTAKES.md` (whoever maintains the code), `md/README.md` (the index).
The proposal (`Avian_Age_TeManawa_Proposal.docx`) is the original brief and its open questions are
still the open questions.

For the exhibitions and education team: `TEMANAWA_CONCEPT_DOC.md`, the final concept for a general
audience (how it plays, the birds, how the Manawatū formed, the places, the habitats and goals; written
for the 2 Ma opening, its photos and video still to add), and `TEMANAWA_HABITATS.md`, the four habitats
with the places people know. Both were written on 2026-11-17 and are **not yet on the release branch**:
they sit uncommitted in the author's checkout of `hud-wall-readability` (§10.1).

### 2.3 The source

Tag the commit the package was built from (recommended name `v1.0.0-rc.1`, then `v1.0.0` after
acceptance) and give the museum read access to the GitHub repository at that tag, or a zip of the
tree at the tag. `VERSION.txt` in every package names its commit, so a package can always be traced
to its source. The museum should hold the source whether or not it intends to edit it: it is the
only way the piece outlives any one developer.

The source copy must include `research/lr04/` and `research/palaeogeography/`. The harness and
`tools/lr04_prologue.js` read the first; `tools/island2geo.js` builds the island inset's maps
(`geo/island_maps.js`) from the second's `slices.json`. Without them the harness fails and neither the
prologue's climate nor the inset can be rebuilt. The PDFs beside them are a separate question (§2.4).

### 2.4 Rights and licences — a checklist to clear before the handover letter

- [ ] **Code:** MIT (`LICENSE`, copyright the author). Say so in the handover letter, and check it
      matches what the contract says the museum receives; it does not cover the sound or the fonts.
- [ ] **Sprites and console art:** artist-supplied. A written licence or assignment to the museum for
      exhibition use, naming the artist(s). Retired art in `sprites/_retired/` is not shipped.
- [ ] **`NF Nadira Pro`** (the display face, both pages): confirm the licence covers an installation
      viewed by the public and ships inside the package.
- [ ] **`OpenDyslexic`**: open licence (SIL OFL / Bitstream Vera terms); include its licence text.
- [ ] **Audio** (on, shipped; `audio/CREDITS.md` is the record):
  - [ ] written agreement from **RNZ** (the moa) and **Te Papa** (huia, Finsch's duck) for the
        recreated calls, and how each wants to be credited. Fallback: `TM_AUDIO.birdRecreated = false`
  - [ ] the recreated clips are in the repository: confirm the GitHub repository is private
  - [ ] the credit line in `audio/CREDITS.md` ("What must be shown to visitors") on a label or a
        screen. Nothing shows it today
  - [ ] the CC BY-SA clips (goose, harrier) stay under that licence if passed on
  - [ ] the 17 legacy `.mp3` directly under `audio/` have no licence record; `make_deploy.js` does not
        ship them
- [ ] **The island inset's maps** (`geo/island_maps.js`, in every intro and outro): redrawn from
      Trewick & Bland (2012) Figs 1, 3 and 4, registered to the Natural Earth coastline (public
      domain). Check whether the journal's terms need permission for a redrawn figure in an exhibit,
      and credit the source on a label either way. Nothing on screen credits it today
- [ ] **`research/`**: the six PDFs (published papers) are not in the package; do not include them in
      any escrow copy without checking their terms. `research/lr04/` (the LR04 stack, Lisiecki & Raymo
      2005, freely published data; cite it) and `research/palaeogeography/` are build inputs and go
      with the source (§2.3).
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
| **GPU** | hardware WebGL at 3840×2160@60 with headroom: a current Intel Arc / Iris Xe-class integrated GPU or any modest discrete GPU (GTX 1650 / RX 6400 class or better); **not** a UHD-600-class Celeron NUC or a thin client | the WebGL batch renderer and the 4K fill rate are the whole frame budget; a blocklisted or software GPU drops to the 2D path. An Iris Xe laptop held 60 fps at rest on a 4K monitor (2026-11-27, §1.4) |
| **Wall display** | 4K, 16:9, over HDMI 2.0 / DisplayPort 1.2 or better (4K60) | the diorama is designed at 16:9; other ratios letterbox (`?terrain=fit` adapts the footprint) |
| **Console display** | 1080p touchscreen, HID touch (no driver software), landscape | the console is a fixed 1920×1080 stage scaled to the panel |
| **Controls** | the habitat switch, plant select, storm, boost, eruption and the time dial as **one USB HID keyboard** (a macro pad / keyboard encoder), sending the keys in `secondscreen/input.js` | the console owns all physical input and relays it over the bus |
| **Speakers** | a powered pair (or the display's) on the PC's default audio output, with a physical volume control the AV team can reach | the piece plays through the default output; `TM_AUDIO.master` sets the level inside it |
| **Network** | none; the PC should be off the network, or on one that cannot reach it | the piece never uses it; Windows Update is the only thing that would |
| **Service** | a USB keyboard in the cabinet | Ctrl+Shift+Q, `--dev`, the log |
| **Power** | mains, no UPS needed; on a timer or always on | the shell survives both; the nightly restart assumes the PC is on at 03:05 or power-cycled daily |

Display scaling: leave Windows at 100 % on the 4K wall if possible. The shell places windows by
display bounds, so scaling works, but a 150 % wall makes Chromium composite at a fractional ratio
for no gain. (It works: the 2026-11-27 run in §1.4 was on a 4K monitor at 150 %, the wall window 2560×1440
at a device pixel ratio of 1.5, the sprite layer still 3840×2160.)

---

## 4. Acceptance test — the gates before opening

On the install PC, with the package of record, in this order. Each gate has a pass condition; a
failed gate stops the sequence and goes back to the developer with `VERSION.txt` and the log.

| # | Gate | Pass when |
|---|---|---|
| 0 | **Build of record** | `VERSION.txt` names the tagged commit; `node tools/bootcheck.js` (no section prints `FAILURES`: the exit code is 0 either way), `node tools/make_deploy.js --smoke` and `node tools/shell_check.js` passed on that commit on a dev machine; the museum has the zip's sha256 |
| 1 | **Cold boot, no hands** | power-cycle the PC: within two minutes both windows are full screen on the right displays (`TeManawa.exe --displays`, then `temanawa.config.json` if the largest-display guess is wrong), no desktop visible, no dialog |
| 2 | **The console drives the wall** | turn the dial: the console's clock changes. Boost a plant: the wall rings it and runs the time-lapse. Storm; eruption; `H`, the hint. The macro pad's keys all land (set `input.js` first) |
| 3 | **Performance on the wall** | the debug overlay (`--dev`, then `D`) PERF panel reads **WebGL**; 60 fps at rest; ≥ 50 fps through a boost time-lapse and an eruption; the reseed (`init()` on every 12th landing, under the attract's dark) stays under the 10 s watchdog |
| 4 | **The attract** | leave it 3 minutes: dip to dark, then the living opening land (2 Ma, the strait) with no UI. A touch plays the intro: today's map with the island inset, then the land, one line, the UI. Run the dial to the end of the window: the outro over today's map, then the attract |
| 5 | **Recovery** | end the wall's renderer in Task Manager: back within 15 s. End `TeManawa.exe`: the scheduled task brings it back within a minute. Pull the power: gate 1 again. The log shows each event |
| 6 | **Soak** | seven days of opening hours (or a continuous week) with the shell log and `Kiosk.getErrorLog()` read daily: no `[Kiosk] stall`, no `renderer gone` outside the ones you caused, memory flat across the nightly restarts, the console still focused each morning |
| 7 | **Photosensitivity** | measured on the installed wall: ≤ 3 luminance transitions/s and large changes ramped ≥ 500 ms through the eruption, storm and boost; signed by whoever holds that responsibility at the museum |
| 8 | **Content and sound** | the names, cards, captions and goal lines on screen are the co-design outcome; the open decisions in §7 are made; every clip has been heard on the install speakers and `TM_AUDIO.master` is set in the room, empty and full; the audio rights in §2.4 are cleared |

Gate 3 is where the hardware risk (§1.3, item 1) is paid: if it fails, the options are a better GPU,
`"ignoreGpuBlocklist": true`, `"query": "sprites=1"` on the wall (sprites at 1080 instead of 2×), or
the `mapGrid` drop the plan has been holding, in that order.

---

## 5. Support model

### 5.1 Who does what

| Tier | Who | Can | Has |
|---|---|---|---|
| Floor | gallery staff | restart it (power cycle, or Ctrl+Shift+Q and double-click), recognise the attract as normal, report a problem | `OPERATOR_QUICKSTART.md` |
| AV / IT | the museum's named contact | display mapping and config, the autostart task, Windows settings, the room level, read the log, replace the folder with a new build | `TEMANAWA_OPERATIONS.md`, the package |
| Developer | the author (or a successor with the repo) | code, content, rebuilds, the harness | the repository, `CLAUDE.md`, `MISTAKES.md` |

Agree a response expectation for the developer tier in writing (for example: acknowledgement in two
working days, a rebuilt package for a content change in a week), a defects period after opening, and a
point at which the museum's AV contact takes over routine operation entirely. A problem report is:
`VERSION.txt`, the shell log (`%APPDATA%\TeManawa\temanawa-shell.log`), what the visitor was doing.

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

1. `node tools/bootcheck.js` clean: no section prints `FAILURES` (re-run a seed-dependent failure
   before treating it as real; §8).
2. Set the release number in `electron/package.json` (`version`); it is stamped into `VERSION.txt`.
3. Commit; tag (`git tag -a v1.0.0-rc.1 -m "…"`; `git push --tags`).
4. Once per build machine: `cd electron && npm ci` (downloads Electron and the packager; behind a
   proxy that cuts long transfers, see `electron/README.md`), and Playwright for the smoke test
   (`npm i --no-save playwright && npx playwright install chromium` at the repo root).
5. `node tools/make_deploy.js --electron --platform win32 --smoke --zip`. It fails loudly on a
   missing asset reference, a page error, a 404, or a dead bus. Then `node tools/shell_check.js`
   drives the shell itself on the folder just built. Look at `dist/smoke/*.png` anyway.
6. Record the zip's sha256 and the `VERSION.txt` contents in the release note, with the credits and
   the clearances (§2.4).
7. Deliver the zip; the museum runs gates 0–8.
8. After acceptance, tag `v1.0.0` on the same commit and write the gate results into
   `TEMANAWA_PLAN_V3.md` §13 (or a short `RELEASES.md`), so the next build has a baseline. Take a
   backup image of the install PC.

Building the Windows package from Linux or macOS works (the packager fetches the Windows Electron
zip) but skips the executable's icon and file-description metadata, which need Wine off Windows; a
build made on Windows gets them. Neither affects behaviour. Code-signing is optional and solves only
the one-time SmartScreen prompt on a zip downloaded from the web.

---

## 7. Decisions the museum must make

From `TEMANAWA_PLAN_V3.md` §16, the ones that change what visitors see or hear:

1. **The console between visitors** (§16.13): return to its landing card when the wall goes to the
   attract, or hold the last habitat? (A small change; the shell does not decide it.)
2. **The title** (§16.12): *Avian Age: Te Manawa* on the page, *A River Older Than Mountains* in the
   blog and in the concept document (`TEMANAWA_CONCEPT_DOC.md`, 2026-11-17). The package uses the
   page's (`index.html`'s `<title>`).
3. **The end-card** (§16.9): acknowledge the absences (97 % of the wetland gone) or not.
4. **Audio** is on (2026-11-10). Whether a living relative's voice may stand in for the three extinct
   birds without a recording (takahē, goose, harrier: `TM_AUDIO.birdStandIns`), and whether the
   recreated calls stay if the clearance is slow (`TM_AUDIO.birdRecreated`).
5. **Names, narration, which stories are told** (§16.10): the co-design track. The build treats
   every name and label as a replaceable hook.
6. **The physical controls**: momentary or absolute habitat switch, and the eruption key, so
   `input.js` can be set once and the temporary B-hold overload retired.
7. **The island inset's opening map**: the intro shows the 2.4 Ma map (the strait open, as on the 2 Ma
   land beside it; there is no 2 Ma map). `TM_ATTRACT.inset.intro` switches it to 1.5 or 1 Ma in one
   word.
8. **The stage label at 1 Ma** (`TEMANAWA_PROLOGUE.md` §10). Since the prologue's climate became the
   record, the window's own table (1 Ma on) is the part still rounded. It calls 1 Ma "MIS 25" where
   LR04 has the end of MIS 28, so the console's clock reads MIS 28 at 1.005 Ma and MIS 25 at 1 Ma,
   skipping three stages. Rebuilding the window's table on LR04 would move every turn a visitor boosts
   through and every goal tuned on them; the other choices are to accept the seam or drop the label
   from the console.

---

## 8. Known issues and flakes

- **Harness, 2026-11-27, on the author's Windows machine** (Windows 11 Pro, Node 24.18.1; commit
  `bbc44d4`, whose code is `7feef91`'s): one run, 9 min 23 s, exit 0, **the same three failures as the
  Linux runs below and nothing else** (no tributary flake). The *prologue* check failed here too,
  baked 1,597,981 BP against a stop at about 1.583 Ma, so it is not a container artefact; the machine
  question in §10.1 is answered. The harness's timings read slower than on 2026-11-02: soft resets
  3.3–3.6 s (3.2–4.1 s then), and a full `init()` 24.9 s against 7.6–8.5 s. No browser preview was
  running; whether the 2 Ma opening made the bake dearer or the machine was busy is not known. The
  harness is not the browser (Chrome measured ~6.5 s on 2026-11-04), but gate 3's reseed time is now
  worth watching rather than assumed.
- **Harness, 2026-11-26 (`7feef91`): not clean.** Two runs in a Linux container
  (Node 22), both printing the same three failures, and both exiting 0:
  - *attract*: "every inset date has its caption" and "the inset copy: no emoji, Cook Strait and Nelson
    named, macrons kept". **Real, and caused by the 2026-11-25 copy cut** (`7feef91`): the present-day
    intro caption (`TM_ISLAND.copy.intro.m0000`) now has an empty body, and no caption names Nelson.
    Either the copy or the check has to change; that is a content call (§10.1).
  - *prologue*: "the land followed the clock: baked within a morph step of the stop" (baked 1,617,921
    and 1,604,473 BP against a stop at 1,582,655). Not caused by `7feef91`, which changed only copy
    strings; it passed on the author's runs of `3a05552`, which added it. The terrain's morph slices
    against the real clock (the harness's `performance.now` is `Date.now`) while the harness steps a
    fake 16 ms frame, so how far the land keeps up with a racing boost depends on the machine. Unresolved
    until it is run on the build machine (§10.1).
  - Run 2 also hit the known tributary flake (below).

  `make_deploy.js --smoke` passed on the same commit (Linux, Playwright's Chromium): 1,081 files and
  94 MB with the audio, every reference resolved, the wall booted in 12 s on the 2 Ma strait, a console
  intent broke the attract into the intro and the intro played out to the UI, a dial detent arrived, no
  page errors, no 404s.
- **Harness, 2026-11-17 (`3a05552`, the LR04 rebuild):** four runs, three clean; one hit the tributary
  flake, which also failed on the branch before the change (from the commit message).
- **Harness, 2026-11-17 (the merged branch):** three runs, two clean. One printed a failure in
  *geography*: "the course holds through a glacial cycle and shifts at the next termination" (the river
  did not move at the termination). Another seed-dependent check on the noise terrain; the merge touched
  no terrain code. The palaeo name checks passed on all three. `make_deploy.js --smoke` passed (with
  `--browser` pointing at the installed Chrome, since Playwright's own Chromium would not start on this
  Windows machine): the wall boots in ~35 s, a console intent breaks the attract into the intro, the
  intro ends on the UI, a dial detent arrives, no page errors, no 404s bar the browser's favicon.
- **The harness exits 0 even when a section prints `FAILURES`.** Gate 0 must read the output. This is
  how the 2026-11-25 copy cut landed with two failing checks.
- **Harness, seed-dependent:** *the strait name sits on sea at 2.4 Ma* (palaeo attract) failed on 1 of
  3 runs on 2026-11-05; *the basin and Ruataniwha names sit on sea at 2.4 Ma* and *at 140 ka the main
  runs unbroken from the lowstand sea* (geography) failed once each on 2026-11-14, clean on the re-run, and *the course holds through a glacial cycle* (geography) once on 2026-11-17.
  *At 1000 ka every tributary is joined to the main or the sea* (land/water discipline) is the
  tributary flake: once on 2026-11-17, once on 2026-11-26.
  All run on the harness's noise terrain. The island merge's five-point surface vote for the names may
  have settled the first two; *fauna stability*'s refound count is already documented as
  seed-dependent. A harness fix (stage the anchors, as the Tararua check does) is cheap and should land
  before the release tag so the gate-0 run is boring.
- **The headless smoke's renderer depends on the machine**: 2D where the browser has no GPU, WebGL
  with the installed Chrome on a GPU machine. Its render readout was wrong until 2026-11-27 and always
  said 2D (§1.2). The frame rate at 4K on the install PC is gate 3.
- **Two long frames on the 4K test (2026-11-27, §1.4):** 276 ms with the dial at the top (the land
  morphing at 5,000 yr/s) and 195 ms in a storm, on an Iris Xe laptop, against a 53–60 fps average.
  Not chased: one run, one machine, a laptop not the install PC. Watch for them at gate 3; the
  lightning flash had a stutter of this kind once before, from a per-frame tint.
- **The PowerShell autostart scripts are untested**, and so is a cold boot. Windows and two real
  displays were verified on 2026-11-27 (§1.4). Gates 1 and 5 cover the rest.
- **`input.js` is in its temporary 3-key state** until the real pad exists (§1.3, item 4).
- **Open plan items** that are not defects: the aftermath's staged beats, the *Dinornis* dimorphism
  pair, the prologue's copy and pacing, the `mapGrid` drop, the outline prototype (§14.3–14.4, §16).

---

## 9. Before handing over the repository (optional hygiene)

`TEMANAWA_PLAN_V3.md` §14.4 lists the cleanup. Done 2026-11-06: the unused ash sequence and superseded
sprites moved to `sprites/_retired/`; the duplicate exports, the August SVG drafts and the unused fonts
deleted. Left: whether `sprites/_retired/` (~224 MB), `exports/` (~160 MB) and `research/` (§2.4) go
with the escrow copy; the history (~700 MB) is still the bulk. None of this changes the package; it
changes what a successor downloads and what the museum is asked to hold.

---

## 10. The checklist of what is left (2026-11-14, updated 2026-11-27)

Tick-boxes for everything above that is still open, by stage. §4's gates are the acceptance test;
this is the work before them.

### 10.1 Freeze the build

- [x] One branch: the audio and prologue work, the island inset and the kiosk shell merged (2026-11-17),
      on `claude/sound-effects-bird-audio-52bb80`. Left: the PR to `main`. None is open on 2026-11-26,
      and `main` stops at 2026-11-10: it has the attract and the milestones, but not the audio, the
      prologue, the island inset or the kiosk shell. The 26 Nov edits to this plan were made on
      `claude/eloquent-franklin-gwxy01`, two commits ahead of the release branch with nothing else
      changed; on 2026-11-27 the release branch was fast-forwarded to them locally, not yet pushed
- [ ] Bring the author's three uncommitted docs onto the release branch: `TEMANAWA_CONCEPT_DOC.md`
      (new), the `TEMANAWA_HABITATS.md` rewrite and their two lines in `md/README.md`, all from
      2026-11-17, sitting in the `hud-wall-readability` checkout (§2.2). That branch has nothing else
      the release branch lacks
- [ ] Close the open decisions that change what ships (§7, and `TEMANAWA_PLAN_V3.md` §16.11 the outline
      prototype, §16.5 `mapGrid`, §16.3 the recovery path's cost, §16.6 saturation scope, §16.1 the
      timeline art; `TEMANAWA_PROLOGUE.md` §10 the opening date and the 1 Ma stage label)
- [ ] Set the real key map in `secondscreen/input.js` (`SWITCH_MODE`, `KEYS`); turn off
      `B_LONG_PRESS_ERUPTS` (still `true`) once the pad has its own eruption key
- [ ] Fix the two *attract* checks the 2026-11-25 copy cut broke (§8): give the present-day intro
      caption a body or let the check accept an empty one, and name Nelson again or retire that
      assertion. Copy or check, it is the author's call
- [ ] Fix the *prologue* check "the land followed the clock": it failed on both Linux runs of
      2026-11-26 and on the author's Windows machine on 2026-11-27 (§8), so it fails everywhere it has
      been run since `3a05552`. Make it independent of machine speed (step the morph's clock with the
      harness's frame), or find what changed between the author's passing runs of `3a05552` and now
- [ ] Make the seed-dependent harness checks deterministic, or record them as known noise (§8)
- [ ] Make `bootcheck.js` exit non-zero when a section prints `FAILURES` (it exited 0 on both
      failing runs of 2026-11-26)
- [ ] Harness clean three runs in a row on the release commit; tag `v1.0.0-rc.1` (§6)

### 10.2 Rights and credits

- [ ] Everything in §2.4, the audio first (it depends on RNZ and Te Papa)

### 10.3 Content sign-off

- [ ] The mana whenua co-design pass (`PLAN_V3.md` §16.10): naming, narration, which stories are told
- [ ] A curator's factual read of all visitor copy, all of it still draft:
  - [ ] the encyclopedia cards (`secondscreen/encyclopedia.js`); decide on `TEMANAWA_CARD_TRIMS.md`
        and the three-part layout in `TEMANAWA_ENCYCLOPEDIA_CARDS.md`
  - [ ] the intro, the line over the land and the outro (`TM_ATTRACT.copy`), and the map's place
        names (`TM_ATTRACT.labels`). The intro card was rewritten shorter on 2026-11-25; still draft
  - [ ] the island inset's captions (`TM_ISLAND.copy`), cut to a line each on 2026-11-25; the
        present-day caption has a title and no body
  - [ ] the climate line while the clock races the prologue (`InstallHUD.CLIMATE_TRAVEL`, "Ice ages come
        and go, every 41,000 years", 2026-11-17)
  - [ ] the prologue's captions and era names (`TEMANAWA_PROLOGUE.md` §10)
  - [ ] the goal lines and verdicts (`TeManawa_goals.js`)
  - [ ] the river names
- [ ] The stand-in voices decision (§7, item 4)
- [ ] Listen to every clip on the install speakers. They were cut by measurement, not by ear: check
      no moa clip carries a voice, and that `bird_kereru_01` is a call

### 10.4 The package

- [x] `tools/make_deploy.js` builds the copy and checks every reference (2026-11-05). Fixed 2026-11-17
      to ship `geo/island_maps.js`, to read audio's switch from `TM_AUDIO.enabled` (the old check would
      have shipped the piece silent), and to leave out the legacy `.mp3`
- [x] The kiosk shell and the autostart scripts (`electron/`, `deploy/`)
- [x] Build the Windows package on a Windows machine (2026-11-27, the author's Windows 11 machine,
      93 s): `make_deploy.js --electron --platform win32 --smoke --zip --browser` (the installed
      Chrome) built `dist/TeManawa-win32-x64` (451.2 MB, Electron 45.2.3) and its zip (238.7 MB) from
      `06a7cb2`, marked dirty only for this plan's uncommitted edits (`md/` does not ship). The copy
      held 1,083 files and 94.3 MB, and every reference resolved. The smoke booted the wall in 37 s on
      the 2 Ma strait (2D, as headless always is), carried the bus both ways, played the intro out to
      the UI, and logged no page errors and no 404s. Not the build of record: tag first (§6). On this
      machine `npm ci` left out Electron's own runtime (`electron/node_modules/electron/dist`), which
      the packager does not need but `npm start` and `shell_check.js` do;
      `node electron/node_modules/electron/install.js` fetched it
- [x] Run `tools/shell_check.js` on Windows (2026-11-27): passed after two fixes to the check (its
      dial step predated the attract; its render readout read `GLBatch.active`, which does not exist).
      The same readout fixed in `make_deploy.js --smoke`. It opens both kiosk windows full screen on
      display 0 for under a minute and holds focus on the console, so run it when nobody needs the screen
- [x] The packaged `TeManawa.exe` on two real displays, the wall on a 4K monitor: placed by the shipped
      config, WebGL, 60 fps at rest (2026-11-27, §1.4)
- [ ] Try the package from a clean folder on another machine

### 10.5 Commissioning

- [ ] §4's gates
- [ ] Every `[verify]` in `TEMANAWA_OPERATIONS.md` tried and the mark removed
- [ ] Windows locked down: updates, sleep, screensaver, notifications, touch edge-swipes

### 10.6 Handover and after

- [ ] `TEMANAWA_OPERATIONS.md` brought up to the final hardware
- [ ] The release note (§6, step 6) and a backup image of the install PC (step 8)
- [ ] A defects period and a support contact agreed (§5.1)
- [ ] Watch real visitors on the first day; read the logs after the first week

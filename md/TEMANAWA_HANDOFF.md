# Te Manawa — handoff checklist

**What stands between the build and delivery to the museum.** Written 2026-11-14. The software is
close; what is left is mostly rights, content sign-off, packaging and the hardware. The design status
is `TEMANAWA_PLAN_V3.md` §13–§16; running the install is `TEMANAWA_OPERATIONS.md`.

**Start now, because they depend on other people:** the RNZ / Te Papa clearance (stage 2) and the
mana whenua co-design (stage 3). **Blocked until the install hardware is fixed:** stage 5.

Not known from the repo: the opening date, the hardware, the contract terms, and whether the GitHub
repository is public.

---

## State on 2026-11-14

- **Harness:** two runs of `node tools/bootcheck.js` on `claude/sound-effects-bird-audio-52bb80`.
  The first printed 2 failures ("palaeo attract": the basin and Ruataniwha names sit on sea at
  2.4 Ma; "geography": at 140 ka the main runs unbroken from the lowstand sea). The second printed
  none. Both look seed-dependent.
- **The harness exits 0 even when it prints `FAILURES`.** A release gate must read the output, not
  the exit code.
- **Branch:** the audio work is 7 commits ahead of `main` and only on that branch.
- **Missing:** a script that builds the deploy copy; a startup / supervisor script; a credit line
  anywhere on screen.
- **Offline:** neither `index.html` nor `secondscreen/index.html` references an external URL.

---

## 1. Freeze the build

- [ ] Merge the audio branch to `main`.
- [ ] Close the open decisions that change what ships (`TEMANAWA_PLAN_V3.md` §16):
  - [ ] §16.13 the console returns to its landing card between visitors, or not
  - [ ] §16.11 the live outline prototype: extend it, or off for opening
  - [ ] §16.12 the title (*Avian Age: Te Manawa* / *A River Older Than Mountains*)
  - [ ] §16.5 `mapGrid`: drop to 256, or record 512 as final
  - [ ] §16.9 the end-card that acknowledges the absences
  - [ ] §16.3 the recovery path's cost; §16.6 saturation scope; §16.1 the timeline art
- [ ] Set the real key map in `secondscreen/input.js`: `SWITCH_MODE`, `KEYS`, and turn off
      `B_LONG_PRESS_ERUPTS` (still `true`) once the pad has its own eruption key. In absolute mode
      the `e` detent shadows the eruption key.
- [ ] Make the two seed-dependent harness checks deterministic, or record them as known noise.
- [ ] Make `bootcheck.js` exit non-zero on a failure.
- [ ] Harness clean three runs in a row on the release commit.
- [ ] Tag a release candidate.

## 2. Rights and credits

- [ ] Written agreement from **RNZ** (moa) and **Te Papa** (huia, Finsch's duck) for the recreated
      calls, and how each wants to be credited. Fallback: `TM_AUDIO.birdRecreated = false`.
- [ ] Those clips are committed and pushed: confirm the GitHub repository is private.
- [ ] Show the credit line from `audio/CREDITS.md` ("What must be shown to visitors") on a label or
      a screen. Nothing shows it today.
- [ ] CC BY-SA clips (goose, harrier): the edited clips stay under the same licence if passed on.
- [ ] Confirm the NF Nadira Pro licence covers a public installation.
- [ ] Confirm who owns the sprite art, and that the museum's use is covered.
- [ ] Check the MIT `LICENSE` matches what the contract says the museum receives; it does not
      cover the third-party audio or fonts.
- [ ] The 17 older `.mp3` files directly under `audio/` have no recorded licence. They are not
      loaded; keep them out of the deploy copy.

## 3. Content sign-off

- [ ] The mana whenua co-design pass (§16.10): naming, narration, which stories are told.
- [ ] A curator's factual read of all visitor copy, all of it still draft:
  - [ ] the encyclopedia cards (`secondscreen/encyclopedia.js`); decide on `TEMANAWA_CARD_TRIMS.md`
        and the three-part layout in `TEMANAWA_ENCYCLOPEDIA_CARDS.md`
  - [ ] the intro, the line over the land and the outro (`TM_ATTRACT.copy`), and the map's place
        names (`TM_ATTRACT.labels`)
  - [ ] the prologue's captions and era names (`TEMANAWA_PROLOGUE.md` §10)
  - [ ] the goal lines and verdicts (`TeManawa_goals.js`)
  - [ ] the river names
- [ ] The curatorial decision on the three stand-in voices (takahē, goose, harrier);
      `TM_AUDIO.birdStandIns = false` silences them.
- [ ] Listen to every clip on the install speakers. They were cut by measurement, not by ear; check
      no moa clip carries a voice, and that `bird_kereru_01` is a call.

## 4. Deploy package

- [ ] A script that builds the ~95 MB deploy copy from the list in `TEMANAWA_OPERATIONS.md` §5
      (no `sprites/_retired/`, no loose `audio/*.mp3`, no `md/`, `exports/`, `research/`, `.git/`).
- [ ] A startup script: the server, then the two browser windows from one profile, the console
      opened last so it holds focus; no `?dev=1`, no `--export`.
- [ ] A supervisor that restarts either if it exits (Task Scheduler or equivalent).
- [ ] Pin the Node.js version on the install PC (the dev machine runs 18.13.0).
- [ ] Stamp the package with the release tag; zip it with a checksum.
- [ ] Run the package from a clean folder on another machine. This is what catches a missing file.

## 5. Commissioning on the install hardware

- [ ] Every item in `TEMANAWA_OPERATIONS.md` §8.
- [ ] Every `[verify]` in that guide tried and the mark removed.
- [ ] Windows locked down: updates, sleep, screensaver, notifications, touch edge-swipes.
- [ ] `TM_AUDIO.master` set in the room, empty and full.
- [ ] Photosensitivity sign-off on the real panel, with eruption, storm and boost exercised.
- [ ] The debug overlay's PERF panel says WebGL, and 60 fps holds through a boost and an eruption.
- [ ] A 48–72 hour unattended soak, then read both error logs (`Kiosk.getErrorLog()`,
      `TMConsoleKiosk.getErrorLog()`).

## 6. Handover pack

- [ ] A one-page guide for floor staff: on, off, what to do if a screen is black, who to call.
- [ ] `TEMANAWA_OPERATIONS.md` brought up to the final hardware. Known drift: its header predates
      the audio; §3's input table omits the `H` hint key; §8 still says "attract sequence".
- [ ] `TEMANAWA_PLAN_V3.md` §16 still lists "audio off for opening" as resolved; correct it.
- [ ] The tagged source and the deploy package.
- [ ] The credits list and the clearances from stage 2.
- [ ] Known limitations, and how an update is applied (stop the browser, replace the folder, start).
- [ ] A backup image of the install PC.

## 7. Opening and after

- [ ] Watch real visitors on the first day.
- [ ] Read the error logs after the first week.
- [ ] Agree a defects period and a support contact.

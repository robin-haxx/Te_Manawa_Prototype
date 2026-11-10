# Te Manawa — operator guide

**For whoever installs, starts, checks and recovers the piece.** How it runs, what it does on its
own, what to deploy, and how to tell what went wrong. Written 2026-11-02, before the final testing
pass; the install hardware is not yet fixed, so anything marked **[verify]** has not been tried on
it. The design is `TEMANAWA_PLAN_V3.md`; the technical budgets are `TEMANAWA_BUILD_V3.md` §3 and §5.

---

## 1. What runs

- **One PC**, no network needed.
- **A local web server**, `node tools/serve.js`, on `127.0.0.1` only. Chrome will not load the
  sprites from `file://`, so the page must be served.
- **One browser profile, two windows:**
  - the **diorama** on the 4K wall: `http://127.0.0.1:8080/`
  - the **console** on the 1080p touchscreen: `http://127.0.0.1:8080/secondscreen/`
- The two windows talk over `BroadcastChannel('temanawa')`. That only connects pages of the **same
  origin in the same browser profile**. Two separate profiles (for example two `--user-data-dir`
  values) start fine and show nothing wrong, but the console then drives nothing.
- **The console's controls** — the habitat switch, plant select, storm, boost, eruption and the time
  dial — arrive as touches and as key presses from a USB macro pad (`secondscreen/input.js`).

The diorama runs on its own without the console: geology holds still, the living world keeps going,
and the idle attract still plays.

---

## 2. Starting it

1. **Server:** `node tools/serve.js` from the install folder (default port 8080; `node tools/serve.js
   8090` for another). Never use `--export` on the wall; it lets the page write files.
2. **Browser:** Chromium/Chrome in kiosk mode. The flags from `TEMANAWA_BUILD_V3.md` §3:

   ```
   --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble
   --disable-pinch --overscroll-history-navigation=0
   --autoplay-policy=no-user-gesture-required --check-for-update-interval=31536000
   ```

   `--incognito` is on that list too. It keeps the profile clean, but it also empties the error log
   (§6) whenever the browser itself closes; the log survives page reloads either way.
3. **Two windows, one profile, one per display.** Open the diorama on the 4K display and the console
   on the touchscreen, from the same profile, each full screen (`--window-position` to place them).
   **[verify]** that a second kiosk launch into a running profile lands on the right display, full
   screen. The check that matters: the console's clock line changes when the time dial is turned.
4. **Focus.** Keyboard input goes to whichever window has focus, and the macro pad is a keyboard. The
   **console must hold focus**: open it last, and a touch on it takes focus back. While the diorama
   has focus, the console's key presses land on the wall instead (§3).
5. **Supervisor.** Start the server and the browser at boot and restart either if it exits (Task
   Scheduler or a startup script on Windows). Turn off sleep, the screensaver, notifications and
   automatic updates. Assume the museum power-cycles the PC at close.

---

## 3. Inputs

| Input | Where | What it does |
|---|---|---|
| Touch, habitat switch, plant select, storm, boost, eruption | the console | the visitor controls (`TEMANAWA_SECOND_SCREEN.md`) |
| `]` / `[` / `\` (or the mouse wheel) | either window | the **time dial**: faster / slower / back to 0 (geology paused). During the attract sequence it drives the sequence instead (faster, slower, pause, reverse) |
| `1`–`5` | the diorama | the baseline five buttons (deep time, FOREST, TUSSOCK, storm, eruption) |
| `D`, `SHIFT+D`, hold `D` | the diorama, **`?dev=1` only** | debug overlay / JSON dump to the browser console / plant sprite gallery |
| `R`, `C`, `P` | the diorama, **`?dev=1` only** | range overlay / climate tint on the cast / play the attract sequence |

**Set the console's keys at install time** in `secondscreen/input.js`: `SWITCH_MODE` (`'momentary'`
up/down, or `'absolute'` five positions on `q w e r t`) and `KEYS`. Keep the dial keys in step with
`DeepTime.DIAL_KEYS`. Two things to know there:

- A **temporary 3-key macro pad mode** is on (`B_LONG_PRESS_ERUPTS`): a short `B` boosts and a hold
  erupts. Turn it off once the real pad has its own eruption key.
- In absolute mode the `e` position shadows the eruption key `e`. Rebind one of them.

**The diorama locks its keys** unless its URL carries `?dev=1`: only `1`–`5` and the time dial reach
it. Any other key (a stray keyboard, or the console's own keys when the diorama has focus) counts as a
visitor being present (it restarts the idle timer and skips a running attract) but does nothing else.
The console's keys still only *work* when the console has focus, so keep it focused (§2). Never put
`?dev=1` in the wall's launch URL: it unlocks the authoring keys and lets a `draw()` error stop the
frame loop (§4).

---

## 4. What it does on its own

| When | What happens | Cost |
|---|---|---|
| No input for **180 s** (`Kiosk.idleSeconds`) | **The attract sequence:** a dip to dark, the land from 4 Ma to 1 Ma (about 4 minutes, land only), then a fresh living world at 1 Ma. Any input skips to the landing | the landing is a cheap in-memory swap |
| The timeline reaches Ōruanui (25.5 ka) | the same attract sequence | — |
| Every 12th reset | the land is reseeded under the sequence's opening dark (a full rebuild, several seconds, hidden) | — |
| A script error, in the frame loop or out of it | logged, then a **soft recovery** (`Kiosk.resetToAttract`) that replays an eruption checkpoint (every 12th time, a reseed instead); a running attract sequence is stopped first | ~1.2 s; a reseed takes several seconds |
| More than 3 frame errors inside 30 s (`Kiosk.frameErrorMax`, `frameErrorWindowMs`) | a hard reload instead of another recovery | several seconds of loading |
| **No frame for 10 s** (`Kiosk.watchdogSeconds`) | **hard reload** of the page | as above |
| **03:00** (`Kiosk.nightlyReloadHour`) | a hard reload, to clear slow leaks, once (a page booted inside that minute does not reload again) | as above |

**The console page** (`secondscreen/kiosk.js`) logs its own errors, reloads itself after a burst of
more than 5 inside 30 s, and reloads at 03:00 too. It has no watchdog (it is a DOM page with no frame
loop to stall), and it does not return to its landing card between visitors (an open decision,
`TEMANAWA_PLAN_V3.md` §16.13).

---

## 5. What to deploy

Deploy a **copy of the files the wall needs**, not a git clone: about 95 MB against a git history of
about 500 MB.

| Needed | |
|---|---|
| `index.html`, `style.css`, `p5.min.js` | the page and p5 (`p5.sound.min.js` is no longer loaded) |
| `TeManawa_*.js`, `levels/`, `geo/manawatu.geo.js` | the engine, the level, the geography |
| `sprites/` | all of it except `sprites/Environmental/AshCloud/` (222 MB, unused) and `sprites/_retired/` |
| `typefaces/OpenDyslexic.ttf`, `typefaces/NF-Nadira-Pro-Regular.ttf`, `typefaces/NF-Nadira-Pro-Regular.otf` | the three fonts in use |
| `audio/birds/`, `audio/sfx/`, `audio/ui/`, `audio/CREDITS.md` | the sound (about 9 MB). The older `.mp3` files directly under `audio/` are not loaded and need not be deployed. Set the room level with `TM_AUDIO.master` in `TeManawa_audio.js`; `?audio=0` on the URL runs silent |
| `secondscreen/` | the console page and its assets |
| `tools/serve.js` | the server (Node.js must be installed) |

**Not needed on the wall:** `md/`, `exports/`, `research/`, `node_modules/`, the rest of `tools/`,
`p5.js` (the unminified debug copy), `geo/*.svg`, the proposal `.docx`, `.git/`.

To update: stop the browser, replace the folder, start again.

---

## 6. Diagnosing

- **Debug overlay:** press `D` on the diorama (it cycles six panels). The KIOSK rows show resets, the
  last reset time and the idle countdown; the PERF panel shows the live **render mode** — WebGL, or the
  2D fallback, which means the GPU path was refused (missing, lost, or a software renderer).
- **The error log:** in the diorama window's DevTools console, `Kiosk.getErrorLog()` returns the last
  20 script errors, watchdog stalls and failed resets, with timestamps (stored in `localStorage` as
  `tm_errors`); `Kiosk.clearErrorLog()` empties it. The nightly reload is not logged. The console
  keeps its own log: `TMConsoleKiosk.getErrorLog()` in the console window (`tm_console_errors`).
  **[verify]**
  whether DevTools opens in kiosk mode on the install browser; if not, attach a keyboard and start the
  browser outside kiosk mode to read it.
- **A state dump:** `SHIFT+D` prints the sim's state as JSON to the DevTools console.
- **Log lines worth knowing:** `[Kiosk] installed …`, `[Kiosk] attract landing …`, `[Kiosk] soft
  reset …`, `[Kiosk] hard reload: <reason>`, `[Palaeo] landed at 1000000 …`, `[Palaeo] aborted: …`.
- **The console's debug mode:** open `…/secondscreen/?debug=1`, or press the backtick key, to show its
  readout strip and on-screen test buttons.
- **Start-up flags on the diorama URL** (for testing, not the wall): `?dev=1` (authoring: every key
  live, frame errors throw), `?render=2d` (skip WebGL),
  `?sprites=1|2|3` (sprite supersampling, default 2), `?atlas=…` (atlas pack scale),
  `?terrain=square|fit`, `?art=low|high`.

---

## 7. Known gaps before opening

The full list, with causes and fixes, is `TEMANAWA_PLAN_V3.md` §14. The kiosk defects found on
2026-11-02 (the 03:00 reload loop, no key lockdown, frame errors stopping the loop, no console layer,
the server crash, audio loading) are fixed, and so are the grey wall after a visitor's eruption (the
aftermath now clears over one boost/goal cycle, 15–60 s) and the stale goal after a fast-forward. Still
open:

1. The console does not return to its landing card between visitors (a decision to make).

---

## 8. Commissioning checklist

On the install PC, once the fixes in §7 have landed:

- [ ] `node tools/bootcheck.js` passes on the build being deployed (run it on a dev machine; it needs
      the whole repo).
- [ ] Both windows open full screen on the right displays after a cold boot, with no clicks.
- [ ] The console drives the wall: turn the dial and boost a plant; the wall answers.
- [ ] The debug overlay's PERF panel says **WebGL**, and the frame rate holds at 60 during a boost
      time-lapse and an eruption.
- [ ] Leave it alone for 3 minutes: the attract sequence plays and lands on a living world.
- [ ] Kill the browser: the supervisor brings it back. Kill the server: the same.
- [ ] Power-cycle the PC: everything returns with no hands on it.
- [ ] Photosensitivity sign-off on the real panel (no more than 3 luminance transitions a second;
      large changes ramped over at least 500 ms), with the eruption, storm and boost all exercised.
- [ ] The console keeps focus through a day, with the macro pad's keys going to it.

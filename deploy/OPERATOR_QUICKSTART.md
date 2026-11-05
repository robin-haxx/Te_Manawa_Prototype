# Avian Age: Te Manawa — operator quick start

**For the person who installs, starts, checks and recovers the piece.** One PC, two displays, no
network, no operator. The longer guide is `md/TEMANAWA_OPERATIONS.md` in the source repository;
this page is what you need on the day.

## What is in this folder

| | |
|---|---|
| `TeManawa.exe` | the whole installation: it serves the pages to itself, opens the diorama on the 4K wall and the console on the touchscreen, keeps the console focused, restarts a crashed page, and restarts itself at 03:05 every night |
| `temanawa.config.json` | the settings: which display is which, the port, the nightly restart. Plain text; notes inside |
| `run_temanawa.ps1` / `install_autostart.ps1` | start at logon, and come back if it exits (Windows) |
| `VERSION.txt` | which build this is: the release, the date and the source commit. Quote it when reporting a problem |
| `resources/app/web/` | the pages and art themselves. `manifest.json` in there lists every file with a checksum |

## First start

1. Plug in: the 4K wall as one display, the 1080p touchscreen as the other (any order, any output),
   the macro pad / buttons as a USB keyboard.
2. Double-click `TeManawa.exe`. Within about ten seconds the wall shows the land and the console
   shows *Habitat Explorer*.
3. Turn the time dial on the console: the console's clock line changes. That is the two pages
   talking. If the console says *waiting for the diorama…* for more than 15 s, see *Trouble* below.
4. Leave it alone for 3 minutes: the wall dips to dark and plays the land before the river (about
   4 minutes), then lands on a living world. That is normal.

## Make it survive a power cycle (Windows)

Once, as an administrator, in this folder:

```
powershell -ExecutionPolicy Bypass -File install_autostart.ps1
```

It registers a scheduled task that starts the piece at logon and brings it back if it exits, and
turns off the display and standby timeouts. Still by hand, once:

- set the kiosk user to **log on automatically** (Settings → Accounts → Sign-in options, or
  Sysinternals *Autologon*);
- **notifications off** (Settings → System → Notifications), Focus Assist on;
- **Windows Update**: set active hours to the opening hours, or pause/defer updates, so it never
  restarts mid-day;
- hide the taskbar (it is covered anyway).

Then power-cycle the PC and watch it come back with no hands on it.

## Every day

Nothing. It runs itself. The pages reload at 03:00 and the program restarts at 03:05 to clear
slow leaks; power-cycling the PC at close is fine too.

## Stopping and starting by hand

- **Stop:** plug in a keyboard and press **Ctrl + Shift + Q** (the macro pad never sends this).
- **Start:** double-click `TeManawa.exe`, or log off and on (the scheduled task starts it).
- **Diagnostics:** from a command prompt in this folder, `TeManawa.exe --dev` opens both pages as
  ordinary windows with the authoring keys live: press **D** on the wall for the debug overlay (the
  PERF panel's *render mode* should read **WebGL**), **F12** for the browser console.
  `TeManawa.exe --displays` lists the displays with the index numbers the config file uses.

## Trouble

| Symptom | What to do |
|---|---|
| Wall and console on the wrong screens | `TeManawa.exe --displays`, then set `"wall": {"display": N}` and `"console": {"display": M}` in `temanawa.config.json`; restart |
| Console says *waiting for the diorama…* | the wall page has not started. Wait 30 s. If it stays, quit (Ctrl+Shift+Q) and start again; then check the log (below) |
| The wall is black | give it 15 s (a reload after a crash). If it stays black, restart; if it repeats, the log says why |
| Movement is jerky, or the debug overlay says *2D canvas* | the graphics driver is being refused. Update the GPU driver; or set `"ignoreGpuBlocklist": true` in the config and restart |
| Buttons on the console do nothing | the console window has lost keyboard focus: touch it once. If that does not fix it, restart |
| Nothing starts after a power cycle | log on by hand; if it starts then, automatic logon is not set (above) |

**The log:** `%APPDATA%\TeManawa\temanawa-shell.log` (Windows). It holds the shell's own events
(starts, display layout, crashes, the nightly restart) and the pages' own warnings and `[Kiosk]`
lines. The pages also keep their last 20 errors inside the browser storage: with `--dev`, press
F12 on the wall and type `Kiosk.getErrorLog()`; on the console, `TMConsoleKiosk.getErrorLog()`.

**Reporting a problem:** send `VERSION.txt`, the log file, and what the visitor was doing.

## Updating

Stop it, replace this whole folder with the new one (keep your `temanawa.config.json`), start it.
`VERSION.txt` tells you which build you have.

## The fallback: Chrome plus the server

If the shell cannot run, the pages still run in Chrome: install Node.js, open a command prompt in
`resources\app\web`, run `node tools\serve.js`, and open `http://127.0.0.1:8080/` (wall) and
`http://127.0.0.1:8080/secondscreen/` (console) in **one** Chrome profile in kiosk mode. Both windows
must share one profile or the console drives nothing. Details: `md/TEMANAWA_OPERATIONS.md` §2.

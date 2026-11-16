# electron/ — the kiosk shell

One executable for the museum: it starts `tools/serve.js` on 127.0.0.1, opens the diorama full
screen on the largest display and the console on the other, keeps the console focused (the macro pad
is a keyboard), reloads a crashed or hung page, blocks display sleep, writes a log, and relaunches
itself at 03:05. The pages do not know they are inside it; the same `web/` runs under Chrome plus
`node tools/serve.js`, which stays the authoring path and the documented fallback
(`md/TEMANAWA_OPERATIONS.md`).

```
cd electron && npm ci              # once: Electron + @electron/packager (a ~110 MB download per platform)
npm start                          # the shell on the repo itself, windowed, DevTools on F12 (= electron . --dev)
npm run kiosk                      # the shell on the repo itself, kiosk mode (Ctrl+Shift+Q quits)

node tools/make_deploy.js --electron --platform win32 --smoke --zip     # the museum build (from the repo root)
node tools/shell_check.js                                               # drive the shell on that build: windows, bus, focus, crash recovery
```

The build lands in `dist/TeManawa-win32-x64/` (and a zip of it): `TeManawa.exe`, the operator files
from `deploy/`, `VERSION.txt`, and `resources/app/web/`, which is the plain deploy folder
(`dist/temanawa-web/`) that `make_deploy.js` assembled and audited first.

- `main.js` — the shell. Settings come from `temanawa.config.json` beside the exe (sample and notes
  in `deploy/`); `--dev`, `--displays`, `--config`, `--web` on the command line.
- `package.json` — pins the Electron and packager versions. Its `version` is the **release
  number** stamped into `VERSION.txt`; bump it when cutting a build for the museum.
- Why Electron and not two Chrome windows: a second `--kiosk` launch into a running Chrome profile
  ignores its window position, so the two pages cannot be put on their displays reliably, and only
  the focused window gets the macro pad's keys. Two separate Chrome profiles fix placement but break
  the `BroadcastChannel` bus. The shell places each window on its display, pins focus to the console,
  and keeps one origin for both pages.
- The packager needs the Electron zip for the target platform; it caches it under the user's cache
  directory (`~/.cache/electron`, `%LOCALAPPDATA%\electron\Cache`). Behind a proxy that cuts long
  transfers, download the zip and `SHASUMS256.txt` with curl and drop them in that cache.

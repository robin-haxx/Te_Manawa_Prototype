# Te Manawa — the second screen (touchscreen console)

The 1080p touchscreen control surface that sits beside the 4K diorama. Static DOM, no build
step, no framework — same rule as the diorama. Full design: `../md/TEMANAWA_SECOND_SCREEN.md`.

## Run

```
node ../tools/serve.js        # from the repo root: node tools/serve.js
```

- diorama:     `http://127.0.0.1:8080/`
- touchscreen: `http://127.0.0.1:8080/secondscreen/`

Both are same-origin, so they talk over `BroadcastChannel('temanawa')` with no server, no
polling, no network. On the install PC, open both in one Chrome instance, one per display
(`--window-position` / `--kiosk`).

**Debug mode** shows the "extra stuff" — the timeline/goal readout strip **and** the on-screen
test buttons (for driving the page without the physical rig). It is **off by default** (a clean
kiosk screen). Turn it on with `…/secondscreen/?debug=1`, or toggle it live with the **backtick
(`` ` ``)** key.

## The three stations

1. **Habitat switch** (left) — top→bottom: Forest, Wetland, *(Select)*, Lowland, Alpine.
2. **Encyclopedia / boost-select** (centre) — highlight a plant to see its card and the fauna
   it supports; the **storm** button lives here.
3. **Activate** (right) — **boost** the highlighted species (runs the timelapse to the next
   glacial/interglacial), and **eruption** to skip ahead.

## Files

| File | What |
|---|---|
| `index.html` | the page shell (fixed 1920×1080 stage, scaled to the panel) |
| `secondscreen.css` | styling — matches the mockups |
| `encyclopedia.js` | **the content.** Habitats → plants → names, taxonomy, description, fauna links, positions. Edit this to add/rename/reposition; nothing in `app.js` changes |
| `input.js` | maps the physical keys / touch to named actions. **Set the switch mode + key bindings here at install time** |
| `bus.js` | `BroadcastChannel` wrapper + the message vocabulary |
| `app.js` | the state machine and renderer |
| `assets/` | per-habitat 1080p backgrounds + optional highlight loops — **artist-supplied** |

## Input bindings (edit `input.js`)

Default (dev): `ArrowUp`/`ArrowDown` = habitat switch; `←`/`→` = plant prev/next;
`Enter` = select; `s` = storm; `b` = boost; `e` = eruption (hold = skip). Switch mode is
`'momentary'` (up/down steps); set `'absolute'` for a 5-position switch (keys `q w e r t`).

## Content still to supply

- **Backgrounds** — `assets/Background_Base.png` is the shared background shown on every screen.
  For per-habitat art, drop e.g. `assets/bg_alpine.png` and point that habitat's `bg` at it in
  `encyclopedia.js` (it overrides the shared base).
- **Hand-touch glyph** — the "Select a Habitat" / "Select a Plant" cards show `assets/hand.png`
  (the `.hand` element). Drop the final art there; it's hidden until the file exists (no broken
  icon). A different name/format just needs the two `<img class="hand" src=…>` in `index.html`
  repointed. It replaced the old drawn SVG glyph.
- **Encyclopedia copy** — the four card species (Tōtara, Mānuka, Tī kōuka, Red beech) are
  real; every other plant's `desc`/`fauna` is a marked `TODO`. See `TEMANAWA_SECOND_SCREEN.md` §8.
- **Highlight loops** — optional alpha WebM per plant (`TM_PLANT_HIGHLIGHT`); stills are used
  until then.

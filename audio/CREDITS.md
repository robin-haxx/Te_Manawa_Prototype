# Audio credits and licences

Every clip `TeManawa_audio.js` plays, where it came from, and what it is licensed under.
`tools/bootcheck.js` fails if a clip in the cue tables is missing from this file.

All clips were cut, high-passed, faded and levelled from the sources below (mono 16-bit WAV;
the sources were MP3 or Ogg, so these are second-generation copies — see "Known limits").
Selection was done by measurement (level envelopes), **not by ear**. Listen to each one on the
install speakers before opening.

## What must be shown to visitors

The CC0 clips need no credit. These do, and a line on the credits panel or label covers them:

> Bird recordings: Department of Conservation (NZ), CC BY 4.0. Cape Barren goose: Beeld en Geluid,
> CC BY-SA 3.0. Hen harrier: Benoît Van Hecke (xeno-canto XC558933), CC BY-SA 4.0. Recordings edited.
> Recreated moa call: RNZ. Recreated huia and Finsch's duck calls: Te Papa. (Wording to be agreed with each.)

CC BY-SA also asks that the edited clips stay under the same licence if they are passed on.

## Birds — living species, field recordings

Source page for all Department of Conservation recordings:
https://www.doc.govt.nz/nature/native-animals/birds/bird-songs-and-calls/ — Crown copyright,
"may be reused, even commercially, as long as you credit the Department of Conservation (NZ)" (CC BY 4.0).

| Clip | Species in the cast | Source file | Cut (s) |
|---|---|---|---|
| `bird_kiwi_male_01` | North Island brown kiwi | DOC `male-ni-brown-kiwi.mp3` | 14.3–20.8 |
| `bird_kiwi_female_01` | North Island brown kiwi | DOC `female-ni-brown-kiwi.mp3` | 0.9–7.1 |
| `bird_kokako_01` `bird_kokako_02` `bird_kokako_03` | North Island kōkako | DOC `kokako-song.mp3` | 33.8–36.8, 40.8–43.7, 105.2–107.3 |
| `bird_kereru_01` | kererū | DOC `nz-pigeon-song.mp3` | 10.3–13.3 |
| `bird_tui_01` `bird_tui_02` `bird_tui_03` | tūī | DOC `tui-song-42.mp3` | 42.3–47.7, 67.3–70.2, 88.3–91.3 |
| `bird_tui_04` | tūī | DOC `tui-song-50.mp3` | 157.3–159.8 |

## Birds — extinct species voiced by a living relative ("stand-ins")

Marked `standIn: true` in `AUDIO_BIRD_VOICES`; `TM_AUDIO.birdStandIns = false` silences all three.
Whether a relative's voice is acceptable on the wall is a curatorial decision, not a technical one.

| Clip | Cast species (extinct) | What is actually heard | Source | Licence |
|---|---|---|---|---|
| `bird_takahe_01` | mōho / North Island takahē | South Island takahē | DOC `takahe-song-12.mp3`, 4.4–7.1 s | CC BY 4.0 |
| `bird_takahe_02` | mōho / North Island takahē | South Island takahē | DOC `takahe-song-10.mp3`, 16.4–20.0 s | CC BY 4.0 |
| `bird_goose_01` `bird_goose_02` | North Island goose (*Cnemiornis*) | Cape Barren goose (*Cereopsis*), a zoo recording (Artis, Amsterdam) | Wikimedia Commons, "Artis, hoendergans - SoundCloud - Beeld en Geluid.ogg", by Beeld en Geluid; 0.9–4.1 s and 10.4–13.6 s | CC BY-SA 3.0 |
| `bird_harrier_01` `bird_harrier_02` | Eyles' harrier (*Circus teauteensis*) | hen harrier (*Circus cyaneus*) — same genus, not the closest relative | Wikimedia Commons, "Circus cyaneus - Hen Harrier XC558933.mp3", by Benoît Van Hecke (xeno-canto XC558933); 7.3–8.8 s and 17.2–19.7 s | CC BY-SA 4.0 |

## Birds — extinct species, recreated calls (not openly licensed)

Marked `recreated: true` in `AUDIO_BIRD_VOICES`; `TM_AUDIO.birdRecreated = false` silences all three.
These are **copyright works, not open-licensed**. The source files were supplied by the project
(Robbie, 2026-11-10), who gave the go-ahead to cut them for this installation. Before opening,
confirm that RNZ and Te Papa have agreed to this use and how each wants to be credited, and note
that committing the clips puts copies in the repository (a concern if it is public).

| Clip | Cast species | Source | Owner | Cut (s) |
|---|---|---|---|---|
| `bird_moa_01` `bird_moa_02` `bird_moa_03` | all four founded moa (one shared voice; the recording does not say which species) | `birds-20210323-0859-moa-128.mp3` (RNZ bird-call slot, 23 March 2021) | RNZ | 0.0–2.3, 5.7–8.8, 15.7–18.3 |
| `bird_huia_01` `bird_huia_02` `bird_huia_03` `bird_huia_04` | huia | "Aotearoa's Recreated Extinct Bird Sounds - Huia.mp3" | Te Papa | 2.55–4.65, 14.45–16.15, 25.55–27.75, 32.85–34.45 |
| `bird_duck_01` `bird_duck_02` `bird_duck_03` `bird_duck_04` | Finsch's duck | "Aotearoa's Recreated Extinct Bird Sounds - Finsch's duck.mp3" | Te Papa | 23.15–24.25, 24.85–26.35, 27.35–28.75, 31.95–33.15 |

How the cuts were chosen (by measurement, not by ear):

- **Moa.** The file has five long, low calls (0–8.8 s and 15.7–21.7 s), a run of short low bursts
  between them (9–15.7 s), and a passage from 21.75 s whose energy sits in the speech band. The
  clips are three of the long calls. The passage from 21.75 s is taken to be the voiceover and is
  not used; the short bursts are not used either, because they could not be told apart from speech
  with confidence. Check by ear that no clip carries a voice.
- **Huia.** The first 35 s are separate whistles with silence between them; the clips are four of
  those. The continuous passage after 35 s is not used.
- **Finsch's duck.** The clips are four of the separate calls in the last 16 s. The continuous
  passage from 3.5 s to 22 s is not used.

A better harrier stand-in would be the swamp harrier / kāhu (*Circus approximans*); no openly
licensed recording was found either. xeno-canto has both species, but mostly under
non-commercial licences, and its site could not be searched from here.

## Effects — all CC0 (public domain), from Freesound

Cut from Freesound's high-quality MP3 previews (the originals need a login to download).

| Clip | Used for | Freesound sound | By |
|---|---|---|---|
| `sfx_thunder_01` | lightning strike | https://freesound.org/s/338091/ "Thunder Clap 1" | jzielke011 |
| `sfx_thunder_02` | lightning strike | https://freesound.org/s/338090/ "Thunder Clap 2" | jzielke011 |
| `sfx_thunder_03` | lightning strike | https://freesound.org/s/436790/ "Thunder Clap" | roboroo |
| `sfx_thunder_far_01` | the STORM press | https://freesound.org/s/581124/ "Distant Thunder 3" | Fission9 |
| `sfx_rain_loop` | rain while a storm is open | https://freesound.org/s/679176/ "rain_loop.wav" | Krokulator |
| `sfx_rumble_loop` | eruption charge and aftermath | https://freesound.org/s/719551/ "Earthquake rumble" | betostado99 |
| `sfx_eruption_01` | the eruption | https://freesound.org/s/675740/ "S35-11 Volcano explosion with debris; lava. rumble; 2 versions.wav" (second version) | craigsmith |
| `sfx_wind_a` | warm gust (FOREST, interglacial turn) | https://freesound.org/s/726317/ "wind 6" | ZIP.Creates |
| `sfx_wind_b` | cold gust (TUSSOCK, glacial turn) | https://freesound.org/s/146932/ "Wind Gust" | crashoverride6 |
| `sfx_whoosh_long` | a boost's time-lapse starting | https://freesound.org/s/738085/ "WindGust" | phuonglamb |
| `sfx_whoosh_deep` | the 50,000 YEARS press | https://freesound.org/s/877977/ "Whoosh Deep Heavy" | Qvantor |
| `sfx_rustle_01` | growth on a right FOREST/TUSSOCK press | https://freesound.org/s/106114/ "bushmovement.wav" | j1987 |
| `sfx_rustle_02` | growth | https://freesound.org/s/540278/ "tree shake.wav" | zepurple |
| `sfx_rustle_03` | growth | https://freesound.org/s/178615/ "The Rustle of a Bush" | Montacue |
| `sfx_wingflap_01` | the harrier's strike | https://freesound.org/s/414671/ "short pigeon wing flap" | zouzmusic |
| `ui_tick` | cards, the dial, a press inside another cue's cooldown | https://freesound.org/s/692828/ "Woodblock-soft.wav" | hollandm |
| `ui_note` | the boost verdicts (rising = right, low = wrong) | https://freesound.org/s/659909/ "Kalimba.wav" | PanPiper5 |

## Known limits

- **Not auditioned.** The clips were chosen and cut by their measured level over time. A cut may
  start mid-phrase, or carry another bird in the background. `bird_kereru_01` is the least certain:
  it is the loudest passage of DOC's kererū recording, which may be wingbeats rather than a call.
- **`bird_harrier_01` and `bird_harrier_02` are noisy.** The source is a quiet, distant recording raised by about
  20–28 dB.
- **Second-generation.** For the best quality, re-cut from the original WAVs: DOC's are on
  Wikimedia Commons (e.g. `Tui-song-42.wav`), Freesound's behind a free login.
- **The older files in `audio/`** (`background.mp3`, `season_*.mp3`, `win.mp3` and the rest) came
  with the parent engine. Nothing loads them now and their licences are not recorded here.

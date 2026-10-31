# Hand and face animations (PES 2021)

`build_hands.py` writes `assets/animations/hands.json` from a PES 2021 install: the game's 162 hand poses and,
for each `.gani` clip in `assets/animations/clips.json`, which pose each hand holds over which frames. It only
reads the game's files. Run it again after adding clips:

```sh
python -I build_hands.py "C:/Games/Pro Evolution Soccer 2021" ../../assets/animations
```

The viewer side is `withHands` and `handPose` in `js/animation/clip.js`. The record layouts and the GANI codec
come from `animation_tool.py`, a GANI editor that was reverse engineered from the game's own decoder.

## Reading the game files

- **CPK tables:** most `Data/*.cpk` have their `@UTF` tables masked with CRI's XOR. Start with `m = 0x655f`;
  for each byte, xor it with `m & 0xff`, then set `m = m * 0x4115` (32-bit). `dt00_x64.cpk` isn't masked.
  File offsets count from `min(TocOffset, ContentOffset)`. Compressed files are CRILAYLA. `build_hands.py`
  has a small read-only reader for all of this.
- **Exe name tables:** `PES2021.exe` isn't packed. Its name tables are arrays of 8-byte pointers to
  zero-terminated strings. `Exe.table_with(name)` finds the array that holds a given name. In this build:
  - the 4,161 motion file names, which contain `fk_runup_cristiano`
  - a separate list of 2,413 gameplay motion names, which the hand tables do *not* use
  - the 430 face, hand and eye motion names: face Base motions at 0–165, hand poses at 166–327, then
    `_eyes_target` motions and others
  - the 15 face Add motions
  - 277 entries of demo motions in no particular order (215 celebrations plus `match_*_face` and
    `_eyes_target` ones)

## Where the motions are

**`dt13_all.cpk`, `common/anime/`:**

| Path | What |
| --- | --- |
| `FoxAnim/Body/body_anime_file0-9.mtar` | Gameplay body motions (free kicks, penalties, runs…) |
| `FoxAnim/Body/CharacterAssets/` | `body_anim_skel.ask`, `body_skel.frig` |
| `FoxAnim/Hand/Animations/*.gani` | 162 hand poses, one frame each, left hand |
| `FoxAnim/Face/Animations/Base/*.gani` | 166 face motions (several frames each) |
| `FoxAnim/Face/Animations/Add/*.gani` | 15 additive face motions (blinks, mouth open…) |
| `FoxAnim/Eye/eye_anime_file0.mtar` | Eye motions |
| `FHSequence/bin/` | `Handlbase`, `Handrbase`, `Facebase`, `Faceadd`, `Sequenceinfo`, `Hitframes` (`.bin`) |

**`dt12_g4.cpk`, `common/demo/`:**

| Path | What |
| --- | --- |
| `anime/FoxAnim/FixDemo/Animations/` | Celebrations (`dml_goal_celebrate_*.gani`), each with an `_eyes_target.gani`; other cutscene motions |
| `anime/FoxAnim/Interface/` | Menu poses. These come with their own `_face`, `_Lhand` and `_Rhand` `.gani` files rather than going through FHSequence. |
| `fixdemo/goal/cut_data/*.fdc` | Per-celebration cut data. Names the body `.gani` and a `.seq` beside it. |
| `fixdemo/*/table_*.bin` | Demo tables (`table_goal.bin` …), not looked at |

**`.seq` files:** the `.seq` each celebration names doesn't exist in the cpks. Only
`FixDemo/Animations/dml_default.seq` (113 bytes) does, so the game presumably falls back to it. The
celebrations' hands come from FHSequence, as below.

**Clip header:** a body `.gani` has 27 channels (PES 2018–2021 layout, see `js/formats/gani.js`). Positions
are in centimeters. The arms start from a T-pose (the legs don't), so the viewer turns PES's A-pose arms
before applying the rotations.

## Hand tables (`Handlbase.bin` / `Handrbase.bin`)

**Record layout:** 12-byte records `d0, d1, d2`, as PES 2020/2021 lay them out:

- `id = (d0 & 0x1FFF) - 216` and `motion number = (d0 >> 13) & 0xFFF`
- `start = ((d1 >> 10) & 0x3FF) - 11` and `pose = (d1 >> 20) & 0xFF`
- `end = (d1 & 0x3FF) - 8` (left) or `- 9` (right)
- source start and end frames are also in there (see `animation_tool.py`). They aren't used, since every pose
  is one frame.

**How the records play:**

- A hand takes each pose from its start frame.
- Where two records' frames overlap, it blends from the earlier pose to the later one.
- After the last record ends, it holds that pose.
- Ends of 200, 280, 1000 or 1001 mean "to the end of the clip".

**Ids of 0 or more:** the id is the motion's position in the 4,161-entry motion file list. It was found by
trying both name lists at offsets from −400 to +400 and counting how often the last record ends on the clip's
last frame (within 2). The 4,161 list at offset 0 gave 13 of 37 clips, against about 4 for anything else.

**Pose numbers:** a pose is the record's pose number plus 166 in the 430-entry list. Alphabetical order gives
nonsense names such as `dummy14` and `Messi_makeup`; the exe's order gives `amanigiri`, `nigiri`, `fist_23push`
and so on.

**Negative ids (celebrations and some gameplay):** `Sequenceinfo.bin` is 8-byte records with
`id = (d0 & 0x1FFF) - 216` and `number = (d0 >> 13) & 0xFFF`. For ids −3 to −164 the numbers run 105–266.
Sort the FixDemo `dml_goal_celebrate*` names (without `_eyes_target`); `number - 85` indexes that list.

- **Ids −22 to −117** (celebrations 0045–0143): every record end matches the clip's length.
- **Ids −3 to −21** (0023–0044): the pose names fit (0023 gets `Ozil_m1`/`Ozil_m2`, 0034 gets
  `bale_hearts`), but the ends don't match the clips' lengths. They're kept.
- **Ids −118 to −164:** no fit. Many records end on round numbers (360, 450, 480, 540), so these may be other
  long demos. Left out.
- **Celebrations 0001–0022:** these would fall on numbers 85–104, which belong to ids of 0 or more, so they
  aren't reached this way. Their real ids are unknown. `table_goal.bin` or the `.fdc` files may say.
- **Ids −165 to −216:** numbers point at gameplay motions (689–712, 1251, 2097…). `animation_tool.py` calls
  these the "negative gameplay" ids, whose number is the positive id.

**Free kicks and penalties:** all 37 get hand poses. `pk_idle_ronaldinho_2` and `pk_runup_ronaldinho_2` aren't
in the exe's lists. The hunching runs (`run_*`, `dribblerun_*`, `parallel_*`) have no hand records.

**Checked:** in a numeric check on the skeleton, `nigiri` pulls the fingertips from 15 cm to 8–9 cm from the
wrist, curling the same way as the run cycle's hand-tuned fist. `open_full` stays at rest, and the mirrored
right hand matches the left.

## Face tables (not worked out)

**`Facebase.bin`:** 65,172 bytes, so 5,431 records of 12 bytes. `d0` reads like the hand tables:
`d0 = 0xd8 + id`, so `id = (d0 & 0x1FFF) - 216`, from −216 to 4388. The rest doesn't use the hand layout:
decoding it that way gives starts after ends and pose numbers up to 254, past the 166 Base motions.

**Pattern:** every id has the same five records (ids 0 and 1 shown):

```
d0=0xd8   d1=0x01b09c1f d2=0x0000fc00
d0=0xd8   d1=0x03020063 d2=0x00011c00
d0=0xd8   d1=0x08924825 d2=0x00012409
d0=0xd8   d1=0x09a2981f d2=0x0000fc00
d0=0xd8   d1=0x0ac3f063 d2=0x00011c00
d0=0x20d9 d1=0x01b09c1f d2=0x0000fc00   (id 1, same five again)
```

That looks like a pool of expressions the game picks from, not timings matched to each clip. With `d1 >> 20`
as the face motion number, the pool would be:

| `d1 >> 20` | Entry in the 430 list |
| --- | --- |
| 27 | `base_d_iki_karui` (light breathing) |
| 48 | `base_g_kp_kuisibari` (gritted teeth) |
| 137 | `pow_brwnit_wink_r` |
| 154 | `smil_smirk` |
| 172 | `belotti_crest2`, a hand pose |

The first four are plausible face motions, but 172 lands on a hand pose. So either the field isn't simply a
face motion number, or numbers past 165 index something else (the Add motions, say). `d2` (`0xfc00`,
`0x11c00`, `0x12409`) may hold weights or chances.

**`Faceadd.bin`:** 3,672 bytes, not looked at.

**Still to do for faces:**

1. Find the face record layout in the exe. `animation_tool.py` names `sub_141ED48F0` as the function that reads
   the PES 2020/2021 hand records (its cases 2 and 3); the face tables are probably other cases in it.
2. Decode the face `.gani` files. They use a 32-unit, 59-channel face rig with translations
   (`animation_tool.py` has the `skf_*` channel names).
3. Drive the `skf_*` bones in the viewer's rig. They already hang off `sk_head` in `assets/pes-skeleton.json`.

**Eyes:** `_eyes_target` motions (eye look-at targets) are separate again and not read.

# Personalized motion: how the spine and arm flags change a clip (PES 2021)

This is how `PES2021.exe` uses the `spine`, `leftarm` and `rightarm` flags from `PersonalizedData.bin`. The
flags let the player's hunching and arm movement settings turn bones on top of the clip. Everything here
comes from static disassembly. Nothing was checked against the running game. Addresses are virtual
addresses in this build, with image base `0x140000000`. Code lives in the `.trace` section.

## Loading the flags

- `0x1406b2150` loops over the 22 `Mbinfo/bin/*.bin` paths (pointer table at `0x14344dc40`) and loads each
  one with a loader object (vtable `0x1425dc588`). On load, `0x1406aef60` switches on the file's index.
  `PersonalizedData.bin` is index 8, parsed by `0x1406ae020`.
- The Mbinfo manager is a global (`0x1406b0ed0` returns it). Each animation has a 0x390-byte record:
  byte `+8` counts its personalized entries, and `+0x100` holds pointers to them. `0x1406afbc0(mgr, anim, 8)`
  returns the count.
- **Entry layout:** each entry is a 32-bit word.
  - Bits 0–11: animation id − 588 (`0x24c`). The id indexes the exe's 4,161-entry motion file list, the
    same list the hand tables use.
  - Bit 12: player id. 0 means −1, any player.
  - Bit 13: spine. Bit 14: left arm. Bit 15: right arm.
  - The accessors are `0x1406b1bd0` (bit 12), `0x1406b2030` (13), `0x1406b12f0` (14) and `0x1406b1c20` (15).
- The file has 71 entries. 13 have the three part bits set: the 12 Hunching clips in the viewer, plus
  `run_2_2`. `anim_infos.json` lists only 12.

## Per-frame decision: `0x1406f52c0`

This runs for a player each frame (it has one caller, `0x1406f67bf`).

1. It gets the playing animation id. It takes the last personalized entry whose player bit says "any player"
   (in some states it drops the entry when a value from `+0xac0` is below a threshold).
2. It reads `spine`, `leftarm` and `rightarm` from that entry.
3. It switches on the animation id. For some hardcoded ids, it forces the flags on and sets a mode of 1, 2 or
   3; otherwise the mode is 0. Every motion with flags in the file, our 12 included, takes the default path
   (mode 0).
4. It reads two setting bytes from the player's data block (`0x14124dad0` returns `player + 0x70`):
   - In states 4, 5, 7, 8, 9, 10 and 0x12, presumably dribbling: `+0x38` hunching and `+0x39` arm movement.
   - Otherwise: `+0x3a` hunching and `+0x3b` arm movement, presumably running.

   These are presumably the save's `mo_hunchd`/`mo_armd` and `mo_hunchr`/`mo_armr`. The copy chain back
   to the save wasn't followed, so it's not confirmed. Level 0 is "no change" in every table.
5. It calls:
   - spine `0x1406f6450(player, hunching, mode, 0)`
   - left arm `0x1406f0660(player, arm, mode, hunching, 0)`
   - right arm `0x1406f4e80(player, arm, mode, hunching, 0)`

   A part whose flag is off still gets a call, but with a level of 0 and the "target 0" argument set, so it
   eases back to nothing.

## The 25 angle slots

Each effect function sets target angles (in degrees) in a 25-float array at `obj + 0x84`, where
`obj = [[player + 0xa08] + 0x110]`. Byte `obj + 0x80` turns the array on. The setter is `0x1406efc20` and
the getter is `0x1406e73a0`; the setter multiplies by π/180.

Values aren't set at once. Each frame they move toward the target by a capped step: 27/54 per frame in
general, and 72 or 108 or 144 /54 in some states. Sharp changes are smoothed.

**Applying the angles:** the object's update method (vtable `0x142abeb48` slot 3, `0x141b17910`) runs only
while `+0x80` is set. It calls `0x141b17960`. For each nonzero slot `i`, that function:

1. Takes the slot's axis `a[i]` and turns it by the rotation `[obj + 0xe8][ref[i]]`. `ref[i]` indexes
   the bones of `body_anim_skel.ask` (0 `sk_root_hip`, 1 `dsk_hip`, 2–7 legs, 8 `sk_belly`, 9 `sk_chest`,
   10 `sk_neck`, 11 `sk_head`, 12–15 left shoulder, upper arm, forearm and hand, 16–19 the right ones).
2. Builds the quaternion for the slot's angle about that axis.
3. Multiplies it in front of the rotation of GANI unit `unit[i]` in the pose, using `0x14239bb60` and
   `0x1423abd10`. The arm chains (units 11 and 13) and the hip (unit 1) have their own code. The GANI units
   are 0 ROOT, 1 `sk_root_hip`, 2 `dsk_hip`, 3–6 legs, 7 belly, 8 chest, 9 neck, 10 head, 11 left arm chain,
   12 left hand, 13 right arm chain, 14 right hand.

**What the axes mean:** they make sense in the Fox bind frames (`assets/pes-bind-frames.json`), where a
bone's local X runs along the bone. For the spine bones and the forearm, local Z is the side-to-side axis.
So Z rotations on the spine bend it forward and back, and on the forearm they bend the elbow. So
`[obj+0xe8]` is presumably each bone's current frame including its bind orientation. That part wasn't
proven.

| Slot | Bone (ref) | Unit | Axis |
| --- | --- | --- | --- |
| 0, 1, 2 | `sk_root_hip` | 1 | −X, +Y, −Z |
| 3, 4, 5 | `sk_belly` | 7 | +Z, +X, +Y |
| 6, 7, 8 | `sk_chest` | 8 | +Z, +X, +Y |
| 9, 10, 11 | `sk_hand_l` | 12 | +X, +Z, +Y |
| 12 | `sk_forearm_l` | 11 | +Z |
| 13, 14, 15 | `sk_upperarm_l` | 11 | −X, +Z, +Y |
| 16, 17, 18 | `sk_hand_r` | 14 | −X, +Z, −Y |
| 19 | `sk_forearm_r` | 13 | +Z |
| 20, 21, 22 | `sk_upperarm_r` | 13 | +X, +Z, −Y |
| 23 | `sk_neck` | 9 | +Z |
| 24 | `sk_head` | 10 | +Z |

## Spine: `0x1406f6450`

- The function covers slots 0, 3, 6, 23 and 24 (list at `0x1425e3a68`): hip, belly, chest, neck and head,
  each about its Z axis (the hip's −Z).
- The level is the hunching byte, from 0 to 4 (5 or more counts as 0).
- Speed is `|Δposition per frame| × 54 × 3600 / 1000`, which is probably km/h. Above 22 it uses the "fast"
  table.

Table (degrees, rows are slots, columns are levels 0–4):

| Slot | Base (`0x1425e3810`) | Fast, over 22 (`0x1425e3880`) |
| --- | --- | --- |
| 0 hip | 0, 0, 0, 0, 0 | 0, 0, 0, 0, 0 |
| 3 belly | 0, −5, 6, −7, 0 | 0, −5, 6, −7, 0 |
| 6 chest | 0, −4, 4, 20, 0 | 0, −4, 4, 15, 0 |
| 23 neck | 0, 0, 0, 0, −22.5 | same |
| 24 head | 0, 0, 0, 0, 22.5 | same |

- Mode 1 (`0x1425e3920`): belly 1.5, −3, 3, −6, 0; chest 3, −2, 6, 15, 0; neck and head as base.
- Mode 2 (`0x1425e3990`) and mode 3 (`0x1425e3a00`) are small fixed tilts.
- In motion state `0x348` it uses per-slot values from `0x1425e38e8` and `0x1425e3900`.

## Arms: `0x1406f0660` (left) and `0x1406f4e80` (right)

- **Slots:** left 9, 10, 11, 12, 15, 13, 14 (list at `0x1425e4098`); right 16, 17, 18, 19, 22, 20, 21
  (`0x1425e46d8`). In table row order these are hand X, hand Z, hand Y, elbow, upper arm Y, upper arm X and
  upper arm Z.
- **Level:** the arm movement byte, from 0 to 9 (10 or more counts as 0). Below about 13.5 speed, level 4
  becomes 0.
- **Two table sets:** the code picks one from player byte `+0x34`, presumably the strong foot. The left arm
  uses set A when the byte is 1, and the right arm uses set A when it's 0, so set A is the arm on the
  strong-foot side. Each set has a slow table and a fast table (over 22 speed). The left and right tables
  hold the same numbers.

Set A, slow (left `0x1425e3a80`, right `0x1425e40c0`). Rows are table rows, columns are levels 0–9:

| Row | Values |
| --- | --- |
| hand X | 0, 0, 0, 0, 0, 20, 0, 0, 45, 0 |
| hand Z | 0, 0, 0, 0, 0, 0, 0, 0, −22.5, 0 |
| hand Y | 0, 25, −3, 3, 0, −3, 15, −5, 22.5, 0 |
| elbow | 0, −20, 15, −25, −5, 8, 5, 20, 0, 15 |
| upper arm Y | 0, −5, 5, −5, −8, −5, −10, 0, 0, −5 |
| upper arm X | 0, 0, −10, 0, 28, 30, 30, 12, −5, 15 |
| upper arm Z | 0, −20, −20, 5, 0, −15, −15, 0, −20, 20 |

- **Set A, fast** (`0x1425e3d00`, `0x1425e4340`): the same, except elbow level 7 is 12, upper arm X levels
  4, 6 and 9 are 15, 20 and 10, and upper arm Z level 9 is 0.
- **Set B, slow** (`0x1425e3ba0`, `0x1425e41e0`):
  - hand X: 0, 0, 0, 0, 0, 20, 0, 0, 90, 0
  - hand Z: 0, 0, 0, 0, 0, −20, 0, 0, −45, 0
  - hand Y: 0, 25, −3, 3, 0, 0, −12, −5, 22.5, 0
  - elbow: 0, −20, 15, −25, −5, −20, −5, −10, 0, 15
  - upper arm Y: 0, −5, 5, −5, −8, −5, −5, −3, 0, −5
  - upper arm X: 0, 0, −10, 0, 28, 0, 10, −8, −5, 15
  - upper arm Z: 0, −20, −20, 5, 0, 5, 0, −20, −20, 20
- **Set B, fast** (`0x1425e3e20`, `0x1425e4460`): upper arm X levels 4 and 9 are 15 and 10, and upper arm Z
  level 9 is 0.
- **Other modes:**
  - mode 1: `0x1425e3f40` / `0x1425e4580`
  - mode 2: `0x1425e4058` / `0x1425e4698`, per slot
  - mode 3: `0x1425e4078` / `0x1425e46b8`
  - state `0x348`: `0x1425e3cb8` / `0x1425e3cd8`

## What isn't confirmed

- **Settings to levels:** which edit-screen value gives which level. Level 0 does nothing; hunching has
  levels 1–4 and arm movement 1–9. The edit screen offers 3 and 8 choices, so the top level of each may
  be something else, but that's a guess.
- **Frame of `[obj + 0xe8]`:** whether it's the bone's current frame or only its bind frame. At rest
  they're the same.
- **Speed unit:** the factor 54 is the starting value of a global. It may change at run time.

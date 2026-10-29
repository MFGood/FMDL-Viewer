# How the viewer does PES 16's face edit and hair edit

This is how the viewer rebuilds PES 2016's editable face: the face sliders, the eye, mouth, neck and head models
that come with it, the textures painted on its skin, and the edit hair. It also covers how each setting is read from
and written to the save. Everything here was read out of `PES2016.orig.exe` (32-bit, base `0x400000`) and the game's
`Data/dt32_win.cpk`. Addresses are virtual addresses in that exe. The code is in `js/animation/face-shape.js`,
`js/export/face-layers.js`, `js/export/edit-hair.js`, `js/export/players.js`, `js/ui/face-editor.js` and
`js/scene/materials.js`. The data the viewer ships is in `assets/defaults/face/` and `assets/defaults/edithair/`.

## 1. When the editable face is used

- **Who gets it:** a Pre-Fox player (their models are `.model` files) gets the editable face when their face folder
  has no face model of their own, meaning no model whose `.xml` type is `face_neck` or `face`
  (`players.js` `defaultParts`).
- **What loads with it:** `faceHi.model` (the face), `eyeHi.model`, `mouthHi.model` (teeth, gums and tongue),
  `neckHi.model` and `headHi.model`. These are the high-detail versions of `face_config.xml`'s
  `eye` / `mouth` / `neck` / `head` models.
- **Own eyes or mouth:** the eye and mouth models are left out when the face folder lists its own `eye` or `mouth`
  type.
- **Edit hair:** added when the face folder has no hair model (no `.xml` type `hair`; a face folder's
  `hair_*.model` files count as type `hair`). The hair model's own head then replaces `headHi` (section 7.4).
- **Game files:** everything comes from `common/character1/model/character/face/` in `dt32_win.cpk`. The files are
  WESYS-compressed (a 16-byte header with `WESYS` at offset 3, then zlib).

## 2. The save

### 2.1 Where the appearance record is

The fields below are bit positions in the player's appearance record, counted from the player ID that starts it.

| Game | Where | Size |
|---|---|---|
| PES 15 | own records at payload `0x2AB9CC` | `0x44` each |
| PES 16 | own records at payload `0x2AB9CC` | `0x48` each |
| PES 17–21 | at player entry `+0x74` | — |

- The player count is the 16-bit value at payload `0x34` (PES 15/16).
- Records are matched to players by the 32-bit ID at their start.
- A field `[byte, bit, n]` is `n` bits starting at bit `bit` of byte `byte`, least significant first, and may cross
  bytes. `js/formats/pes_save.js` reads and writes them (`APPEARANCE`). Reading a save and writing it back leaves the
  PES 16, 17 and 21 test saves byte-identical.
- The face and hair positions were confirmed in PES 16 only; the same layout is assumed for the other versions.

### 2.2 The game's field table

- **Table:** at `0x2620e94`, 128 entries of `0x20` bytes. Each entry is `{ id, getter, setter, 0, default, max,
  bits, kind }` and starts at `0x2620eb0`.
- **Lookup:** `GetField` (`0x19c11b0`) finds an entry by `id`. The getter (`+4`) reads the packed record in save
  layout, with `this` = the record. `0x19c1450` returns a 6-bit field × 4, for colors.
- **Off-by-one warning:** the first dump of this table paired each `id` with the previous entry's getter. As a
  result, the keys of `face-shape.json`'s `fields` and the numbers in the research scripts are one more than the
  game's own ids. The save positions are correct everywhere.

### 2.3 The flags

| Field | Position | Meaning |
|---|---|---|
| `b_edit_face` | `[0x04, 0, 1]` | The face is edited. The viewer applies the sliders only when this is 1. |
| `b_edit_hair` | `[0x04, 1, 1]` | The hair is edited. The viewer sets it when hair settings are changed. |
| `skin_col` | `[0x2D, 0, 3]` | Skin color 1–6, 7 = custom. Picks the `head_color_*` textures and the `C<n>` layer textures. |

The hair, eyebrows, beard and skin details are applied whether or not `b_edit_face` is set.

### 2.4 Face sliders (4 bits each, 0–14, 7 = neutral; −7…+7 in the game's menu)

| Field | Position | | Field | Position |
|---|---|---|---|---|
| `cheek_wid` | `[0x16, 4]` | | `lid_bm_y` | `[0x23, 0]` |
| `cheek_hi` | `[0x17, 0]` | | `eye_x` | `[0x23, 4]` |
| `cheekbone_wid` | `[0x18, 0]` | | `eye_hi` | `[0x24, 0]` |
| `cheekbone_hi` | `[0x18, 4]` | | `nose_hi` | `[0x24, 4]` |
| `brow_in_x` | `[0x1A, 4]` | | `nose_dep` | `[0x25, 0]` |
| `brow_hi` | `[0x1B, 0]` | | `nose_wid` | `[0x25, 4]` |
| `brow_dep` | `[0x1B, 4]` | | `bridge_dep` | `[0x26, 4]` |
| `brow_out_x` | `[0x1C, 0]` | | `bridge_wid` | `[0x27, 0]` |
| `brow_out_hi` | `[0x1C, 4]` | | `mouth_hi` | `[0x28, 0]` |
| `eye_size` | `[0x1D, 4]` | | `mouth_dep` | `[0x28, 4]` |
| `eye_dep` | `[0x1E, 0]` | | `lip_thick` | `[0x29, 0]` |
| `lid_bi_x` | `[0x1E, 4]` | | `mouth_crnr` | `[0x2A, 0]` |
| `lid_bi_y` | `[0x1F, 0]` | | `mouth_wid` | `[0x2A, 4]` |
| `lid_bo_x` | `[0x1F, 4]` | | `chin_wid` | `[0x2B, 4]` |
| `lid_bo_y` | `[0x20, 0]` | | `chin_hi` | `[0x2C, 0]` |
| `lid_ui_x` | `[0x20, 4]` | | `chin_dep` | `[0x2C, 4]` |
| `lid_ui_y` | `[0x21, 0]` | | `face_size` | `[0x33, 0]` |
| `lid_uo_x` | `[0x21, 4]` | | `face_height` | `[0x33, 4]` |
| `lid_uo_y` | `[0x22, 0]` | | | |

- **Labels** (Face, Cheeks, Eyebrows, Eyes, Eyelids, Nose, Mouth, Chin) come from what each field moves (section 3);
  they're in `FACE_GROUPS`.
- **Unedited faces:** in a real save, players without `b_edit_face` hold non-neutral values here, so turning
  Edited face on uses whatever is stored.

### 2.5 Face textures (section 6)

| Field | Position | Range | Meaning |
|---|---|---|---|
| `forehead` | `[0x2E, 0, 3]` | 0–5 | `Forehead<n+1>` |
| `beard` | `[0x2E, 3, 5]` | 0–12 | `Beard<n>`, 0 = none |
| `lid_u_type` | `[0x2F, 3, 5]` | 0–6 | `EyelidU<n+1>` |
| `lid_l_type` | `[0x30, 0, 4]` | 0–2 | `EyelidL<n+1>` |
| `brow_shape` | `[0x32, 0, 5]` | 0–5 | eyebrow shape group |
| `brow_col_r` / `g` / `b` | `[0x39, 0, 6]` `[0x3A, 0, 6]` `[0x3B, 0, 6]` | 0–63 | eyebrow color (× 4) |
| `brow_thick` | `[0x39, 6, 2]` | 0–2 | Middle / Thick / Thin |
| `brow_alpha` | `[0x3A, 6, 2]` | 0–3 | alpha `0x3f` / `0x7f` / `0xbf` / `0xff` |
| `brow_var` | `[0x3B, 6, 2]` | 0–2 | eyebrow variant |
| `beard_col_r` / `g` / `b` | `[0x3D, 4, 6]` `[0x3E, 2, 6]` `[0x3F, 0, 6]` | 0–63 | beard color (× 4) |
| `beard_alpha` | `[0x3F, 6, 2]` | 0–3 | beard strength (the game stores it + 1) |

Not used: the wrinkle type `[0x2F, 0, 3]` (cheek type: `Wrinkles01` / `02`).

### 2.6 Edit hair (section 7)

| Field | Position | Values |
|---|---|---|
| `hair_col_r` / `g` / `b` | `[0x35, 6, 6]` `[0x36, 4, 6]` `[0x37, 2, 6]` | 0–63, × 4 |
| `hair_type` | `[0x38, 0, 4]` | 1 nr, 2 sg, 3 mh, 4 af, 5 dd, 6 cr, 7 sp |
| `hair_pt` | `[0x38, 4, 4]` | shell: 1 pt10, 2 pt05, 3 pt01, 4 pt91, 5 pt92, 6 pt93 |
| `hair_len` | `[0x3C, 0, 3]` | 1 sh, 2 vs, 3 st, 4 md, 5 lg |
| `hair_tex` | `[0x3C, 3, 3]` | 1 st1, 2 st2, 3 wa1, 4 wa2, 5 wa3, 6 cl1, 7 cl2 |
| `hair_acc` | `[0x3D, 0, 1]` | hairband (`_acc`) |
| `hair_acc_col` | `[0x3D, 1, 3]` | hairband color index (not drawn) |
| `hair_sp` | `[0x40, 4, 8]` | special style 1–29 |
| `hair_dir` | `[0x42, 0, 3]` | 1 up, 2 dw, 3 bk |
| `hair_line` | `[0x42, 3, 3]` | 1 00, 2 91, 3 73, 4 55, 5 37, 6 19 (shown as "Part") |
| `hair_sb` | `[0x42, 6, 3]` | strands: 1 sb0 … 4 sb3 |
| `hair_ovm` | `[0x43, 1, 3]` | 1 O, 2 V, 3 M |
| `hair_part` | `[0x43, 4, 2]` | 1 NW, 2 NM, 3 WD (shown as "Hairline") |

`iris_col` `[0x40, 0, 4]` shares byte `0x40` with `hair_sp`.

### 2.7 Without a save

A player not linked to the save (or with no save loaded) keeps their settings in the browser:
- `editFace` for Edited face;
- `face` for the slider values (absent = 7);
- `look` for the texture and hair fields, applied over the defaults.

The defaults are the game's default face buffer (`0x19c1200`, see 3.1):
- **Hair:** `vs_nr_up_NM`, strands `st1_sb3`, shell `S_st1_O_NM_pt10`. The color is the field table's default
  (11, 9, 3), as the buffer leaves it 0.
- **Face textures:** forehead, eyelids and eyebrow shape 0, Middle thickness, black eyebrows at full alpha, no beard.

## 3. Face sliders → face bones

### 3.1 The converter

- **Where:** `0x1ccc210(obj, buf)`, called from `0x19c6320` (← `0x1a4d190`).
- **Input:** `buf` is a 0x38-byte copy of the record from `+0x0C` (`0x19c12c0`), made over the game's default face
  buffer (`0x19c1200`): `0x77777777, 0x00777777, 0x77720000, 0x77777777 ×5, 0x00000177, 0x77007770, 0x00000040,
  0x00c00011, 0xc000000a, 0x23012000`. **All converter offsets are buffer-relative (record offset − 0xC).**
- **Output:** 76 values `{ float, set flag }` plus header floats.
- **Each value:** a lerp of a slider `n` (0–14) between a low, a neutral and a high value: `0x1ccbd30(n, a, b, lo,
  hi)` over 0…7 then 7…14. The low / neutral / high values come from editor box tables. Their seed data is at
  `0x22bb600…`, copied into BSS at `0x26b3c90` (−1), `0x26b4450` (0) and `0x26b4c40` (+1) by static initializers
  around `0x1e9b000`; rows are `0x30` bytes per bone, three vec4 in cm.
- **Game quirk:** the lerp returns 0 unless `lo < hi`. The outer brows' depth has its low value equal to neutral
  (15.909 cm), so brow depth below 7 sets their z to 0. The viewer returns the shared end instead.
- **Additive:** the converter adds up per slider. Each output = base + the sum over fields of `delta[field][n]`,
  checked to within 1e-5 on 40 random faces. So `face-shape.json` stores:
  - `base`: 78 values, the 76 outputs plus header floats h0 and h1;
  - `fields[key].outputs[i]`: 15 deltas per output a field moves;
  - `unset`: the outputs the game never sets (`[29, 39, 45, 48, 54, 75]`), which keep the preset's value.

  37 fields move outputs (the sliders in 2.4). Others in the face area move nothing here.
- **Output labels:** a metadata table at `0x22babe8` (76 × 8 bytes: name pointer, isScale, axis 0/1/2, node index)
  gives each output a FaceData bone and component. It's in `face-shape.json` as `outputs[i] = [bone, isScale, axis]`.
- **Header floats:** h0 (`face_height`) is a height offset in meters; h1 (`face_size`) is a face scale, 0.986 /
  1.036 / 1.05 at 0 / 7 / 14.

### 3.2 Into the preset (the save-slider path, `0x16e53f0`)

1. **Start pose:** start from `resetFaceData.bin`'s bone positions (`rest`) with scale (1, 1, 1).
2. **Write the outputs:** for each set output, write positions as they are and scales onto the bone's scale
   diagonal.
   - Output `0x2b` (lip width) also sets the lip's z scale.
   - Output `0x14` (eyeball scale) isn't written to a bone; it scales the eyeballs (section 4).
3. **Face size and height:**
   - `jawX` = (`bone_09.x` + `bone_22.x`) / 2.
   - For every bone except the jaw (`bone_09`, `bone_22`): x = (x − jawX)·h1, and y = (y − 1.587559312582016)·h1 +
     1.587559312582016 (the jaw line, `0x22b4088`).
   - Then y += h0 for every bone.
   - At neutral, h1 = 1.036 and h0 = −0.00086, so the neutral face isn't exactly the model (about 1.9 mm median).

The game's other route, `MontageSkullJob` (`0x1764920`, 11 constraint steps on 27 image points), is for building a
face from a photo. Save sliders don't use it.

FaceData format (`resetFaceData.bin`): `{12, 40, 8}` header, then `{name offset, data offset}` pairs. Per bone there
are 24 floats: a 3×4 matrix, then position, scale and euler angles, each padded to 4.

### 3.3 Skinning faceHi (a CPU skin)

- **The skull's bones:** `skull.bin` has 30 bones `bone_00…29` with 3×4 inverse binds at `0x200 + b·0x30`, which
  are in `face-shape.json` `skull`.
  - Bone matrix B = [diag(scale) | position], and the skinning matrix S_b = B · inverse bind.
  - `bone_02` (neck) has no FaceData bone, so it stays as is.
  - `bone_29`, the mouth's inside, binds at the lip's neutral place and takes the lip's (`bone_16`) final position
    with scale 1.
- **Per vertex:** `out = Σ w_k · S_bk · v + (1 − Σ w_k) · v`. faceHi's three meshes (1730 + 156 + 40 vertices) are
  numbered end to end; `weights[i] = [bone, weight, …]`, up to 8 pairs.
- **Where the weights come from:** skull.bin's 1548 weighted vertices map in order onto faceHi's joined meshes, with
  378 faceHi vertices inserted. The mapping was found by alignment and then repaired:
  - mirrored left/right with l/r bones swapped, center-line weights split;
  - vertices whose movement disagrees with their neighbors re-skinned from them;
  - mouth-area vertices on non-mouth bones re-skinned from good neighbors.

  The scripts are in `scripts/` (`align4.py`, `refine.py`, `fix.py`, `symfix.py`, `seamfix.py`, `mouthfix.py`,
  `buildface.py`).
- **Viewer specifics:** the modeled positions are kept in `vertices.restPosition` and positions change in place, so
  the rig's skinned copies follow.

## 4. Eyes, mouth, neck and head

### 4.1 Eyes (`eyeHi`)

- Each vertex goes from its bone's bind position (`skf_eye_l` / `_r`, which equals the reset eyeball position
  (±0.028, 1.69678, 0.13796)) to the final FaceData `eyeball_l` / `_r`, scaled about it by output `0x14`.
- **faceHi's lids and rim follow by distance from the rest eyeball:**
  - full weight within 14.5 mm, fading out by 18.5 mm;
  - move = the eyeball's move from neutral, minus the mean move of that side's skull eyelid bones (`bone_10–14` /
    `bone_23–27`);
  - pushed outward by (scale ratio − 1) × 13 mm.
- **Then a clearance pass:** each rim vertex that clears the eyeball at rest is kept outside the eyeball's actual
  surface, scaled by the eye size, by its rest clearance clamped to 0.1–0.5 mm. The eyeball's surface comes from
  `face-shape.json` `eyeball` (eyeHi's left-eye vertices about its bind; the right eye is mirrored), looked up by
  direction.
- This lid behavior is the viewer's approximation of the game placing its eyelid bones from the eyeballs.

### 4.2 Mouth (`mouthHi`)

The whole model moves by the lip's final position minus `bone_29`'s bind, as the game moves `skf_jaw` by the lip's
offset (`0x16e53f0` sets `skf_jaw`'s translation from the lip's preset position minus `0x22b3a90`).

### 4.3 Neck and head

`neckHi` and `headHi` don't move, as faceHi's outline doesn't. Their game `.mtl` files have no diffuse texture
(the game assigns the skin at runtime), so the viewer's copies add `DiffuseMap = head_color_w.dds`.

### 4.4 Skin textures

| Skin color | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Texture | `head_color_w` | `head_color_y` | `head_color_o` | `head_color_r` | `head_color_d` | `head_color_b` |

This follows `face_config.xml`. The viewer swaps the texture like the body's `skin_color` textures.

## 5. Materials and textures

- **Normal maps:** PES normal maps are DXT5nm (x in alpha, y in green); the viewer rebuilds z. They're DirectX-style
  (green down), so `normalScale` is (1, −1).
- **Specular and roughness maps:** gray (red channel), moved into alpha (three.js specular intensity) and green
  (roughness).
- **Layers (`LayerMap`)** are drawn over the base texture by alpha × the layer's own alpha. Each layer:
  - can take a tint;
  - can take a UV conversion `[s, x, y]`: layer UV = clamp((base UV − (x, y)) / s, 0, 1).
- **Tint:** gray textures are colored by an overlay in sRGB:
  `c < 0.5 ? 2·t·c : 1 − 2·(1 − t)·(1 − c)` (t = the tint, c = the texel).

## 6. Face textures (the montage layers)

- **The builder:** `0x16e2ed0` builds the face's texture from the face description that `0x19c6030` fills from the
  save.
- **Order, bottom first:**

| Layer | Texture | Color |
|---|---|---|
| Forehead | `Forehead<forehead+1>C<skin>` | as drawn |
| Upper eyelids | `EyelidU<lid_u_type+1>C<skin>` | as drawn |
| Lower eyelids | `EyelidL<lid_l_type+1>C<skin>` | as drawn |
| Eyebrow | n = 9·`brow_shape` + 3·`brow_var` + `brow_thick` → `Eyebrow<n/3+1, 3 digits>` + `['Middle','Thick','Thin'][n%3]` | (`brow_col` × 4), alpha (`brow_alpha` + 1) / 4 |
| Beard (if `beard` > 0) | `Beard<beard, 2 digits>` | (`beard_col` × 4), texture alpha × (`beard_alpha` + 1) |

- **Skin number:** `C<skin>` is the skin color 1–6; others use 1.
- **Beard strength is a guess:** the beard textures are faint stubble (alpha around 33/255), so reading the strength
  as a multiplier is my interpretation.
- **Files:** all are 512² in `montage/{forehead,eyelid,eyebrow,beard}/`, shipped as AVIF (quality 90, with alpha).
- **UV layout:** the layers are in the montage face's own UV layout (`facial.model`), which is **faceHi's second UV
  set**. faceHi's first set (the skin texture's) is a zoomed copy: uv0 = 0.704225 · uv1 + (0.147887, 0.151880),
  exact. So the layers are drawn on `face_mat` with the UV conversion [0.704225, 0.147887, 0.151880].
- **Repainting:** the layers are repainted whenever materials are rebuilt (skin color or setting changes).

## 7. Edit hair

### 7.1 Files

`face/edithair/` holds:
- `model/<style>/hair_high_win32.model` and `hair.mtl`: 806 folders, 518 styles plus `_acc` versions. The viewer
  keeps the models WESYS-compressed.
- `parts/*.dds`: strand textures.
- `shell/*.dds`: tube textures, gray RGBA.

The viewer ships the textures as AVIF (quality 90, with alpha), halved when 512 px or larger, without the `_spe`
specular textures. `edit-hair-styles.js` lists the folders and textures.

### 7.2 Names (`0x1ccd940(out, buf)`, same buffer as 3.1)

Reads d28 / d2c / d30 / d34 = u32 at buffer `+0x28` / `+0x2c` / `+0x30` / `+0x34`. The tables are in `.data` at
`0x2651cfc…`.

1. **Special styles (type 7):** if `hair_sp` is 0 there's no hair. Otherwise the style, parts texture and shell
   texture are all `sp_ty<NNN>` (shell `S_sp_ty<NNN>`).
2. **Form and texture adjustments:**
   - If length = vs: plain form, and strands = sb3. Else if strands is sb0–sb2: shell = pt10.
   - mh: plain form.
   - af or dd: texture = cl1, the parts texture is named by type, plain form.
   - cr: texture = cl2, parts named by type, plain form.
3. **Length sh:** the style is `sh_<part>`, with no parts texture. The shell is
   `S_sh_<texture>_<O/V/M>_<part>_<pt>`.
4. **Other lengths:** the style is `<len>_<type>_<dir>_<part>` in the plain form, else
   `<len>_<type>_<dir>_<hairline>_<part>`. Add `_acc` for md / lg with `hair_acc`.
   - parts = `<type or texture>_<sb>`;
   - shell = `S_<texture>_<O/V/M>_<part>_<pt>`.
5. **No match:** any missing piece, or a style the game doesn't have, means no hair. The viewer then keeps `headHi`.

### 7.3 Color

RGB = (`hair_col_r`, `g`, `b`) × 4, applied by overlay. The name builder also packs this color into its output at
`+0x14` (as bytes ×4, alpha 0xFF).

### 7.4 Which texture goes where

Hair `.mtl` files name no diffuse textures; the game assigns them.

| Material | Mesh | Texture |
|---|---|---|
| `hairTubeShader` | a blended layer about 1 mm over the scalp, with its own 0–1 UVs | the shell texture, tinted |
| `hairparts_htShader` and the other Hair / HairShaven materials | the cards; the parts texture is an atlas (cards on the left, a striped column around x 0.875–0.97) | the parts texture, tinted |
| `head_phong` | the hair model's head (341 or 249 vertices) | the skin texture only |

- `head_phong` stands in for `headHi`, which isn't loaded with edit hair. It's close to `headHi` but not identical
  (only 113 of 341 vertices match), so drawing both fights for depth.
- A material left without a texture (the cards of `sh` styles) is hidden.
- The `hair.mtl` normal map path (`model/character/face/common/head_normal_default.dds`) is pointed at the
  viewer's copy in `face/`.

## 8. The face editor UI

- **Face section:** shown with the editable face. It has the Edited face toggle (`b_edit_face`) and a Face editor
  button shown when it's on.
- **Face editor:** replaces the details pane with:
  - the 37 sliders in groups;
  - then selectors for the hair (all fields of 2.6; unset 0 shows "—"), eyebrows (shape 1–18 =
    3·`brow_shape` + `brow_var`, thickness, color, strength), beard (none / 1–12, color, strength) and skin details
    (forehead, upper / lower eyelids).
- **Where changes go:** linked players' changes go into the save object, with `b_edit_hair = 1` for hair changes,
  and are kept in the browser's copy of the save (Export downloads it). Other players' changes go into their browser
  settings.
- **Hair changes** reload the player's models, since the style may change. Other texture changes rebuild materials;
  slider changes reshape the meshes in place.
- **Camera:** opening the editor frames the face from the front, and framing aims at faceHi while it's open, so
  Period returns there.

## 9. Not done

- Wrinkles.
- The hairband's color.
- The photo-face path (MontageSkullJob and FaceParts morphs).
- The real face models' skf bone placement (eyelid bone angles, `h2` / `h3`).
- The eyes' iris color.
- Confirming the field layout in PES 15 and 17.

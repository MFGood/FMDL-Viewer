# FMDL Viewer

View PES / Fox Engine `.fmdl` models and whole aesthetics exports in the browser. Everything runs on
your machine; nothing you open is uploaded.

To access a static hosted version of the tool, go to <https://mfgood.github.io/FMDL-Viewer>.

## Features

- **Opening files:** load individual `.fmdl` models or an entire aesthetics export. Exports can be opened as a `.zip` without much trouble. Added `.rar` and `.7z` support but memory usage goes crazy once you drop one in. Opening a folder is the better way.
- **Team view:** shows the team name and logo, and a player list with names and portraits taken from the Faces, Boots and Gloves folders. Each player's textures are matched to the right folders automatically.
- **Reload:** press **R** to reload the export while keeping the current player, kit and camera, so you can preview changes as you make them.
- **Materials:** shaders follow the Fox Engine materials, including unlit, glass, metallic, two-sided and transparent ones. UV scroll and UV step materials animate, including timing textures, so you get a quick preview of animation changes.
- **Kits:** switch between outfield and GK kits (any `u0XXXp1` / `g1` / `dummy_kit` style texture). The kit you pick stays selected as you move between players.
- **Default models:** players with only a face model are shown with a default PES boots model and gloves. Skin color can be picked per player (a `skin_color.dds` next to the skin texture is offered as a 7th, custom color and picked by default), and the defaults can be turned off globally or per player. Players with their own boots model don't get the defaults unless they're turned on for that player.
- **Run animation:** a simple run animation Claude came up with after a bunch of trial and error. It drives the full PES skeleton, including the hem bones, so the shirt and shorts follow the legs.
- **Display options:**
  - Draw backfaces toggle
  - Bone overlay
  - Ground grid centered on the origin
  - PES-style weight scaling (vertices whose weights don't add up to 1 get scaled towards or away from origin)
  - Option to frame stray meshes within the viewport (useful for catching bits floating above/below the pitch)
- **Controls:**
  - **Mouse (Blender, the default):** middle-drag orbits, Shift+middle-drag pans, Ctrl+middle-drag
    (down = in) or the wheel zooms. Ctrl+wheel pans right / left, Shift+wheel pans up / down, and
    Ctrl+Shift+wheel rolls the view 15° (up = clockwise).
  - **Mouse (Classic, picked under Navigation):** left-drag orbits, right-drag or Shift+left-drag pans,
    the wheel or middle-drag zooms.
  - **View keys (numpad or number row):** **1** / **Ctrl+1** front / back, **3** / **Ctrl+3** right / left,
    **7** / **Ctrl+7** top / bottom, **5** perspective / orthographic, **9** turn 180° (top ↔ bottom from
    those views), **4** / **6** orbit 15° around, **8** / **2** orbit 15° over, **.** frame the model keeping
    the angle, **+** / **=** and **−** zoom.
  - **Arrows:** orbit. **Shift+↑/↓:** zoom. **Alt+arrows:** pan.
  - **Ctrl+↑/↓:** previous/next player. **Ctrl+←/→:** previous/next kit.
- **Textures:** reads DDS (including BC7), FTEX, PNG and JPG.

## Running it locally

The viewer is a static site. Browsers won't run JavaScript modules or workers from a page opened straight
from disk (`file://`), so serve the folder instead:

```sh
python -m http.server 8000
```

then open <http://localhost:8000>.

## Layout

```
index.html                 page structure
css/viewer.css             styles (light and dark themes)
js/
  main.js                  start-up: controls, keyboard, drag and drop, render loop
  viewer.js                loading models into the scene, rebuilding materials, what's shown
  core/
    dom.js                 DOM helpers
    files.js               virtual file system: every open file under a path, read on demand
    notices.js             status line and error box
    options.js             the Display checkboxes as an `options` object
    state.js               what's being shown right now (models, export, player, kit)
  formats/
    fmdl.js                .fmdl model parser (port of pes-fmdl-blender's FmdlFile.py)
    texture-files.js       .ftex / .dds readers (Ftex.py port)
    block-decode.js        DXT / BC4 / BC5 / BC7 decoding to RGBA
    aet.js                 aesthetics export layout: players, kits, texture lookup rules
  export/
    players.js             per-player rules: default models, skin colour, roster names
    texture-lookup.js      which file a texture reference resolves to; kit choice
  scene/
    stage.js               three.js renderer, scene, camera, lights, grid
    geometry.js            mesh geometry and PES weight scaling
    textures.js            texture decoding cache and GPU textures
    materials.js           Fox Engine shaders, UV scroll / step and timing textures
    overlays.js            bounding boxes and bone overlay
    navigation.js          the view, mouse / touch navigation (Blender and classic), smooth view moves
    framing.js             framing the model, stray meshes
    keyboard-camera.js     arrow keys and Blender-style view keys
  animation/
    quat.js                vector / quaternion helpers
    run-cycle.js           procedural run cycle on the PES skeleton
    hem.js                 shirt hem and shorts panels during the run
    rig.js                 skinned copies of the meshes, driven by the run cycle
  ui/
    details.js             right-hand panel: counts, kits, skin colour, model tree, materials
    team.js                left-hand panel: team, players, switching players
  open/
    gather.js              what was dropped or picked, as files
    archives.js            .zip (JSZip) and .7z / .rar (7-Zip) reading
    opening.js             opening exports, folders and loose files; reload
workers/sevenzip-worker.js 7-Zip extraction, off the main thread
vendor/7zip/               7-Zip compiled to WebAssembly (loaded only for .7z / .rar)
assets/
  pes-skeleton.json        full PES skeleton (loaded when the run animation is first turned on)
  defaults/                default body, hands and skin textures (loaded when a player needs them)
  sample/                  the example model shown at start-up
```

## Libraries and credits

- [three.js](https://threejs.org) 0.160 (MIT), loaded from jsDelivr.
- [JSZip](https://stuk.github.io/jszip/) 3.10 (MIT), loaded from cdnjs the first time a .zip is opened.
- 7-Zip 24.09 via [7z-wasm](https://github.com/use-strict/7z-wasm) (LGPL; RAR decoding under the unRAR
  licence restriction), in `vendor/7zip/`.
- The model and texture parsing and the PES skeleton data are ported from
  [pes-fmdl-blender](https://github.com/the4chancup/pes-fmdl-blender) by the4chancup; see that
  repository for its licence.
- Shader behaviour follows the Fox Engine section of the
  [implyingrigged.info Materials wiki](https://implyingrigged.info/wiki/Materials).

# FMDL Viewer

View PES / Fox Engine `.fmdl` models and whole aesthetics exports in the browser. Everything runs on
your machine; nothing you open is uploaded.

To access a static hosted version of the tool, go to <https://mfgood.github.io/FMDL-Viewer>.

## Features

- **Opening files:** load individual `.fmdl` models or an entire aesthetics export. Exports can be opened as a `.zip` without much trouble. Added `.rar` and `.7z` support but memory usage goes crazy once you drop one in. Opening a folder is the better way.
- **Pre-Fox models (PES 16 / 17):** `.model` files are read too, with their `.xml` and `.mtl`. Exports are loaded the way the game and the 4cc AET compiler would load them, so folders without an `.xml`, `.common` links and kit-numbered models all work.
- **Team view:** shows the team name and logo, and a player list with names and portraits taken from the Faces, Boots and Gloves folders. Each player's textures are matched to the right folders automatically.
- **Reload:** press **R** to reload the export while keeping the current player, kit and camera, so you can preview changes as you make them.
- **Materials:** shaders follow the Fox Engine materials, including unlit, glass, metallic, two-sided and transparent ones. UV scroll and UV step materials animate, including timing textures, so you get a quick preview of animation changes.
- **Kits:** switch between outfield and GK kits. The kit you pick stays selected as you move between players.
- **Default models:** players with only a face model are shown with a default PES 17 or PES 21 body and hands. Skin color can be picked per player, including the player's own custom skin textures, and the defaults can be turned off globally or per player.
- **Animation:** a simple procedural run cycle, or one of the bundled clips, picked by category under the details pane's Animation tab and played in place: idle, walk, sprint and dribble `.anim` clips, and PES 2021 free kick, penalty kick, hunching and goal celebration `.gani` motions. The `.gani` motions play the game's hand poses with them where the game has them (see `research/hand-animations`); the Hands list can swap in any of the game's poses, and marks what plays by default as the game's timing (default) or a guessed grip (guessed). The helper bones (shorts, sleeves, shoulders, collar…) move the way PES moves them, so kits deform as they do in game.
- **Body shape:** PES's 14 physique settings as sliders, scaling the skeleton the way PES 2016 does.
- **Face editor:** Pre-Fox players without a face model of their own get PES 16's editable face, with its eyes, mouth, neck and head, and the edit hair their save settings pick when their face folder has no hair. With Edited face on (`b_edit_face` in the save), the face editor frames the face and turns the details pane into the game's face sliders, shaping the face, eyes and mouth the way PES 2016 does, followed by selectors for the hair, eyebrows, beard and skin details that the game paints onto the face.
- **Settings:** the cog at the top right opens the global settings: display options, default models, a PES save file and navigation. They're remembered in the browser between visits.
- **Export check:** **Check export** looks the open export over for problems and lists them per player: models that don't read, textures that are missing or unreadable or aren't a power of two in size, vertex weights that don't add up to 1, stray geometry, model names the game won't load, gear IDs with no roster slot, and a missing note, logo or kit config. **Copy report** copies the list as text.
- **Capture:** the camera button saves a PNG of the player shown, a turntable GIF of them, or a team grid of every player with a first tile for the cup name (you type it in), the team's logo and name, and its colors (from the note's "Team Colours", else the save). Pictures take the view's angle and are framed to fit, at the size you pick, over a transparent, viewport, custom or team-color background.
- **Save files:** load a PES 15–21 save under Save file in the settings, or drop it on the window (a file without an extension is tried as a save first); it's kept in the browser. An open export is matched to its team in the save, and its players then use their names, body shapes and skin colors from the save (edits are written back to the copy kept in the browser, and **Export** downloads it). The default body also shows and hides pieces the way the game does for FPC setups. A PES 15–17 save goes with Pre-Fox exports and a PES 18–21 save with Fox ones.
- **Display options:**
  - Normal, specular and roughness maps, when a material names them
  - Draw backfaces toggle
  - Bone overlay
  - Ground grid centered on the origin
  - Control hints for players, kits and the view, which can be hidden
  - PES-style weight scaling (vertices whose weights don't add up to 1 get scaled towards or away from origin)
  - Option to frame stray meshes within the viewport (useful for catching bits floating above/below the pitch)
- **Controls:**
  - **Mouse (Blender, the default):** middle-drag orbits, Shift+middle-drag pans, Ctrl+middle-drag
    (down = in) or the wheel zooms. Ctrl+wheel pans right / left, Shift+wheel pans up / down, and
    Ctrl+Shift+wheel rolls the view 15° (up = clockwise).
  - **Mouse (Classic, picked under Navigation in the settings):** left-drag orbits, right-drag or Shift+left-drag pans,
    the wheel or middle-drag zooms.
  - **View keys (numpad or number row):** **1** / **Ctrl+1** front / back, **3** / **Ctrl+3** right / left,
    **7** / **Ctrl+7** top / bottom, **5** perspective / orthographic, **9** turn 180° (top ↔ bottom from
    those views), **4** / **6** orbit 15° around, **8** / **2** orbit 15° over, **.** frame the model keeping
    the angle (in the face editor, the face from the front), **+** / **=** and **−** zoom.
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
    state.js               what's being shown right now (models, export, player, kit, save file)
    save.js                the PES save file loaded in the settings, kept in IndexedDB
  formats/
    fmdl.js                .fmdl model parser (port of pes-fmdl-blender's FmdlFile.py)
    model.js               Pre-Fox .model parser (port of pes-model-blender's ModelFile.py)
    mtl.js                 Pre-Fox .xml model lists and .mtl materials
    texture-files.js       .ftex / .dds readers (Ftex.py port)
    block-decode.js        DXT / BC4 / BC5 / BC7 decoding to RGBA
    aet.js                 aesthetics export layout: players, kits, texture lookup rules
    gani.js                Fox Engine .gani body motions (PES 2018–2021)
    pes_save.js            PES 15–21 save files (EDIT.bin / EDIT00000000): read and write players and teams
  export/
    players.js             per-player rules: default models, skin color, roster names
    save-team.js           the open export's team in the save file, and its players there
    in-game.js             what the game shows of the default body for a player linked to the save (kit configs, FPC rules)
    texture-lookup.js      which file a texture reference resolves to; kit choice
    edit-hair.js           PES 16's edit hair: the style and textures a player's save settings name
    face-layers.js         what PES 16 paints onto the editable face (eyebrows, beard, forehead, eyelids)
    check.js               the export check: what's wrong with the open export, per player
  scene/
    stage.js               three.js renderer, scene, camera, lights, grid
    geometry.js            mesh geometry and PES weight scaling
    textures.js            texture decoding cache and GPU textures
    materials.js           Fox Engine shaders, UV scroll / step and timing textures
    overlays.js            bounding boxes and bone overlay
    navigation.js          the view, mouse / touch navigation (Blender and classic), smooth view moves
    framing.js             framing the model, stray meshes
    keyboard-camera.js     arrow keys and Blender-style view keys
    capture.js             pictures for saving: fitted to the view's angle at any size, turntables, GIFs (gifenc)
  animation/
    quat.js                vector / quaternion helpers
    run-cycle.js           procedural run cycle on the PES skeleton
    clip.js                .anim and .gani clips (assets/animations, listed in its clips.json) on the PES skeleton
    helper-bones.js        PES's helper-bone drivers (shorts, sleeves, shoulders, collar…), ported from the game
    body-shape.js          PES's physique settings as per-bone scales, from the game's tables
    face-shape.js          PES 16's face sliders on its editable face (faceHi), from the game's tables
    rig.js                 skinned copies of the meshes, driven by the run cycle or a clip and the body shape
  ui/
    details.js             right-hand panel: counts, kits, skin color, model tree, materials
    tabs.js                the right-hand panel's Player, Animation and Model tabs
    animation.js           the Animation tab's category and clip picker
    team.js                left-hand panel: team, players, switching players
    settings.js            settings panel (cog button): display options, default models, navigation
    body-shape.js          the Body shape sliders
    face-editor.js         the Face section and the face editor
    panels.js              the panels over the details pane (settings, capture, export check), one open at a time
    capture.js             the Capture panel: player PNG, turntable GIF, team grid
    team-grid.js           the team grid and its first tile (cup, logo, team name and colors)
    check.js               the Export check panel
  open/
    gather.js              what was dropped or picked, as files
    archives.js            .zip (JSZip) and .7z / .rar (7-Zip) reading
    opening.js             opening exports, folders and loose files; reload
workers/sevenzip-worker.js 7-Zip extraction, off the main thread
vendor/7zip/               7-Zip compiled to WebAssembly (loaded only for .7z / .rar)
assets/
  pes-skeleton.json        full PES skeleton (loaded when the run animation or a body shape is first turned on)
  pes-bind-frames.json     bind orientations of the PES bones, for the helper-bone drivers
  defaults/                default body, hands, editable face, edit hair and skin textures (loaded when needed)
  sample/                  the example model shown at start-up
research/face-sliders/     a check page for the face sliders, and the scripts that read them out of PES 2016
research/helper-bones/     the script that reads the helper-bone drivers out of PES 2016
```

## Libraries and credits

- [three.js](https://threejs.org) 0.160 (MIT), loaded from jsDelivr.
- [JSZip](https://stuk.github.io/jszip/) 3.10 (MIT), loaded from cdnjs the first time a .zip is opened.
- [gifenc](https://github.com/mattdesl/gifenc) 1.0.3 (MIT), loaded from jsDelivr the first time a turntable GIF is made.
- 7-Zip 24.09 via [7z-wasm](https://github.com/use-strict/7z-wasm) (LGPL; RAR decoding under the unRAR
  license restriction), in `vendor/7zip/`.
- The model and texture parsing and the PES skeleton data are ported from
  [pes-fmdl-blender](https://github.com/the4chancup/pes-fmdl-blender) by the4chancup; see that
  repository for its license. The `.model` parsing is ported from
  [pes-model-blender](https://github.com/the4chancup/pes-model-blender), also by the4chancup.
- Shader behavior follows the Fox Engine section of the
  [implyingrigged.info Materials wiki](https://implyingrigged.info/wiki/Materials).

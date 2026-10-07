# FMDL Viewer

View PES / Fox Engine `.fmdl` models and whole aesthetics exports in the browser. Everything runs on
your machine; nothing you open is uploaded.

## Running it

The viewer is a static site. Browsers won't run JavaScript modules or workers from a page opened straight
from disk (`file://`), so serve the folder instead:

```sh
python -m http.server 8000
```

then open <http://localhost:8000>.

To publish on GitHub Pages, push this folder to a repository and turn on Pages for its branch
(Settings → Pages → Deploy from a branch, root folder).

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
    framing.js             framing the model, stray meshes
    keyboard-camera.js     arrow-key camera
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

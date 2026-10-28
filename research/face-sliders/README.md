# Face sliders

`index.html` shows `js/animation/face-shape.js` on faceHi.model one slider at a time, colored by how far each
vertex moves. Serve the repository root and open `/research/face-sliders/`.

`scripts/` is the Python that read the chain out of `PES2016.orig.exe` (Unicorn and Capstone) and built
`assets/defaults/face/face-shape.json`. It expects the game's face files extracted from `dt32_win.cpk` and is
kept for reference, not to run as is. Order: `tables.py` (per-slider converter tables), `align4.py`,
`refine.py` and `fix.py` (skull.bin vertices onto faceHi), `symfix.py`, `seamfix.py` and `mouthfix.py`
(skinning repairs), then `buildface.py`.

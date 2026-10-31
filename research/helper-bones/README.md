# Helper bones (PES 2016)

`drivers.py` runs PES 2016's own helper-bone driver code in an emulator (Unicorn) and prints how a helper's
scale, rotation and offset change as a joint turns, which is where the formulas in
`js/animation/helper-bones.js` come from. It needs `PES2016.orig.exe` and the PE reader and emulator in
`../face-sliders/scripts`:

```sh
python drivers.py table
```

```sh
python drivers.py 27
```

The first lists the game's driver table, one row per helper. The second sweeps the angles of the joint that row
reads (here the left knee); `extra` sweeps the second joint, and `toe` sweeps the toe tip's height for the toe
rows. How the code is laid out is in the script's docstring.

What the drivers do, read this way:

- **Knee:** slides 0.01 cm per degree of knee bend (0.65 to 1.5 cm), and turns 0.8° per degree past 90°.
- **Foot:** shifts 0.1 cm per degree along the foot (up to 3 cm) and 0.05 cm per degree sideways.
- **Toe:** bends up when the foot's tip (before the toes bend) is below the ground: asin(depth / 10 cm), up to 35°.
- **Neckback:** turns 0.55° per degree the head nods (−15° to 35°) and rises 0.07 cm per degree.
- **Hair:** follows the chest, and turns and shifts with the head and neck angles added together.
- **Ears:** just follow the head, but the game rebuilds their rotation so an unevenly scaled head doesn't skew them.
- **Neck size:** the neck's scale across (z) goes to the collar drivers, which move out 5 cm per unit over 1.

`dsk_hair` isn't in PES 2016's or PES 2021's `body.skl`; its bind frame comes from the edit hair models, which
all agree: no rotation, at (0, 1.516, −0.071), behind the bottom of the head.

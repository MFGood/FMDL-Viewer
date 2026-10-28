const masterKeys = {}

// Empty master key for default usage.
masterKeys["0"] = new Uint8Array([
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

// PES 2015 header
/*masterKeys["15"] = new Uint8Array([
    0x32, 0x49, 0x12, 0xef, 0xbf, 0xbd, 0x4d, 0xef,
    0xbf, 0xbd, 0xc3, 0xb3, 0xef, 0xbf, 0xbd, 0xef,
    0xbf, 0xbd, 0x2d, 0xef, 0xbf, 0xbd, 0xef, 0xbf,
    0xbd, 0x16, 0x2f, 0xef, 0xbf, 0xbd, 0x4f, 0x1c,
    0x7e, 0x22, 0x2d, 0xe4, 0x8f, 0xa6, 0x22, 0xef,
    0xbf, 0xbd, 0x69, 0x3c, 0xef, 0xbf, 0xbd, 0xef,
]);*/

masterKeys["15"] = new Uint8Array([
    0x32, 0x49, 0x12, 0xf6, 0x4d, 0xeb, 0xc3, 0xb3,
    0xdc, 0xe1, 0x2d, 0x9e, 0xcc, 0x16, 0x2f, 0x5c,
    0xc1, 0x4f, 0x1c, 0x7e, 0x22, 0x2d, 0xe4, 0x8f,
    0xa6, 0x22, 0x89, 0x69, 0x3c, 0xad, 0xe1, 0xa7,
    //0xca, 0x74, 0xcc, 0xc1, 0x38, 0xeb, 0xe2, 0x85,
    //0x4f, 0xa7, 0xd5, 0x33, 0x1e, 0x55, 0xdb, 0x8f,
]);

// PES 2016 regular edition MasterKey.
masterKeys["16"] = new Uint8Array([
    0x4D, 0x55, 0x94, 0x66, 0xD9, 0x62, 0x5C, 0xEC,
    0xC1, 0x7C, 0x48, 0x36, 0x77, 0x31, 0x50, 0xE1,
    0x87, 0x1C, 0xB5, 0x6B, 0x41, 0xD4, 0x92, 0x4F,
    0x4A, 0x8C, 0x71, 0x27, 0x0A, 0x0D, 0x50, 0x63,
    0x94, 0x2B, 0x58, 0x5E, 0x99, 0x0B, 0x8B, 0x97,
    0x96, 0x66, 0xC0, 0x00, 0xB7, 0x1D, 0x72, 0x75,
    0xD6, 0xE8, 0x5B, 0x0E, 0xAF, 0xF1, 0x72, 0xD1,
    0xB1, 0xE3, 0x3C, 0x75, 0xDE, 0x9C, 0x13, 0x09,
]);

// PES 2016 myClub edition MasterKey.
masterKeys["16MyClub"] = new Uint8Array([
    0x85, 0x91, 0x1E, 0x0F, 0x32, 0xE4, 0xBA, 0xD7,
    0x45, 0x2C, 0xBC, 0xF1, 0x06, 0x16, 0x85, 0x94,
    0xCE, 0x43, 0x52, 0xF5, 0x41, 0x54, 0x87, 0x8B,
    0xCB, 0x88, 0x46, 0xC6, 0x15, 0xB7, 0xB3, 0xDC,
    0x36, 0x1F, 0x13, 0x62, 0xF9, 0x03, 0xD4, 0x00,
    0xAD, 0xD2, 0xE3, 0xC3, 0x91, 0xE6, 0x2F, 0x31,
    0x79, 0x66, 0xB5, 0x5A, 0x00, 0x9F, 0x93, 0x56,
    0xB0, 0xB7, 0x43, 0x7C, 0x2F, 0x4C, 0x97, 0xAB,
]);

// PES 2017 regular (PC DEMO) edition MasterKey.
masterKeys["17"] = new Uint8Array([
    0x9B, 0xC7, 0x13, 0x28, 0x2D, 0xE8, 0x47, 0x75,
    0x4D, 0x52, 0x9E, 0x35, 0x90, 0xAA, 0x6A, 0x7A,
    0x5C, 0xFA, 0x60, 0x9F, 0x6A, 0x32, 0x04, 0x57,
    0xB8, 0x9F, 0x59, 0xA5, 0x5F, 0xAC, 0x7D, 0x62,
    0xFE, 0x10, 0x2A, 0xD6, 0x95, 0xFA, 0xDF, 0xA0,
    0x68, 0xBD, 0x40, 0x95, 0x47, 0x9C, 0xBB, 0x40,
    0xF2, 0x94, 0x49, 0x3C, 0xC8, 0xE0, 0x94, 0x9D,
    0x7B, 0x01, 0x6F, 0xF2, 0xC5, 0x3A, 0x2C, 0xE5,
]);

// PES 2018 regular edition MasterKey.
masterKeys["18"] = new Uint8Array([
    0x47, 0x51, 0x83, 0x38, 0x83, 0x9E, 0x85, 0x3A,
    0xFA, 0x39, 0x08, 0xDC, 0x86, 0xAF, 0x0C, 0xB5,
    0xC4, 0x0E, 0xE4, 0xE4, 0x15, 0xE3, 0xCB, 0x64,
    0x1B, 0x8A, 0xF1, 0xE5, 0x2C, 0xBD, 0x4D, 0x1B,
    0xA4, 0xD6, 0xA1, 0x97, 0x2C, 0x4B, 0xD1, 0xDA,
    0xFA, 0xCD, 0x7E, 0xB4, 0x8A, 0x18, 0xC9, 0xE8,
    0xC5, 0x3E, 0x1A, 0x8B, 0x19, 0x45, 0x01, 0xF8,
    0x8B, 0x85, 0x97, 0x8B, 0x78, 0x7B, 0x3C, 0x2E,
]);

// PES 2019 regular edition MasterKey.
masterKeys["19"] = new Uint8Array([
    0xFD, 0x60, 0x4A, 0x3E, 0xFD, 0x69, 0x20, 0xD1,
    0x93, 0x92, 0x37, 0xD7, 0x60, 0xD8, 0x30, 0xEE,
    0x65, 0x66, 0xFD, 0x6C, 0xE6, 0x9E, 0x48, 0xF8,
    0x0A, 0x0D, 0xC1, 0x23, 0x7F, 0xAC, 0x89, 0x05,
    0x1D, 0xF8, 0x5A, 0x79, 0x10, 0x7E, 0xAD, 0x81,
    0xAC, 0xAE, 0x9A, 0x6A, 0xAB, 0x16, 0xA6, 0x81,
    0xC2, 0xD2, 0x18, 0xC0, 0xF4, 0xE6, 0x5C, 0x27,
    0x74, 0xF6, 0xC1, 0x9F, 0xF5, 0x01, 0x38, 0x72,
]);

// PES 2020 regular edition MasterKey.
masterKeys["20"] = new Uint8Array([
    0xE2, 0xBF, 0x51, 0x07, 0x54, 0xE6, 0x21, 0x78,
    0x2C, 0x5E, 0x8D, 0x33, 0x13, 0x7A, 0xC9, 0x15,
    0x99, 0x77, 0xD9, 0xA0, 0x1B, 0xC2, 0x95, 0xD9,
    0xBB, 0x9B, 0xB1, 0x00, 0x84, 0x1C, 0xB3, 0x62,
    0xE5, 0x40, 0xD9, 0x56, 0x45, 0x5B, 0x7C, 0x7C,
    0x4F, 0xF1, 0xDA, 0x26, 0xB4, 0x5A, 0x0C, 0x5C,
    0x4D, 0x6B, 0x9E, 0x98, 0x75, 0xA9, 0x39, 0x07,
    0x4C, 0x4B, 0x55, 0xBD, 0x8E, 0x01, 0xA9, 0x31,
]);

// PES 2021 regular edition MasterKey.
masterKeys["21"] = new Uint8Array([
    0x90, 0x61, 0xD8, 0x66, 0x43, 0x77, 0x24, 0xF8,
    0x92, 0xBA, 0xB8, 0x71, 0x21, 0xC7, 0x60, 0x63,
    0xF0, 0x91, 0x9A, 0x7D, 0xED, 0x47, 0x80, 0xDE,
    0x51, 0xF5, 0xDD, 0xD1, 0x08, 0xFE, 0x32, 0x84,
    0xF5, 0x09, 0x92, 0x00, 0xB2, 0x3E, 0x88, 0x9F,
    0xEB, 0x24, 0x43, 0x05, 0x58, 0x76, 0x00, 0x22,
    0x9B, 0xFE, 0xEC, 0xF6, 0x50, 0x00, 0x29, 0xD3,
    0x42, 0x75, 0x50, 0xB9, 0xEC, 0xD2, 0xF6, 0x75,
]);

let masterKey

// Effective master key: reverse each 8-byte block
let effectiveMasterKey

function setMasterKey(pes) {
    masterKey = masterKeys[pes+''];
    effectiveMasterKey = new Uint8Array(masterKey.length);
    for (let i = 0; i < masterKey.length; i++) {
        effectiveMasterKey[i] = masterKey[(i & ~7) + 7 - (i & 7)];
    }
}

class MersenneRNG {
  constructor(seed = 5489) {
    this.state = new Array(624).fill(0);
    this.index = 624;
    this.f = 1812433253;
    this.m = 397;
    this.u = 11;
    this.s = 7;
    this.b = 0x9D2C5680;
    this.t = 15;
    this.c = 0xEFC60000;
    this.l = 18;
    this.lowerMask = (1 << 31) - 1;
    this.upperMask = 1 << 31;

    if (Number.isInteger(seed)) {
      this.seed(seed);
    } else if (Array.isArray(seed)) {
      this.seedList(seed);
    } else {
      throw new Error("Unexpected seed type");
    }
  }

  seed(seed) {
    this.state[0] = seed >>> 0;
    const fBig = BigInt(this.f);
    const mask = 0xffffffffn;
    for (let i = 1; i < 624; i++) {
      const prev = BigInt(this.state[i - 1]);
      const xorVal = prev ^ (prev >> 30n);
      const mul = fBig * xorVal;
      const add = mul + BigInt(i);
      this.state[i] = Number(add & mask);
    }
  }

  seedList(data) {
    this.seed(19650218);
    let i = 1;
    let j = 0;
    const lenState = this.state.length;
    const lenData = data.length;
    const maxLen = Math.max(lenState, lenData);
    const mul1 = 1664525n;
    const mul2 = 1566083941n;
    const mask = 0xffffffffn;
    const two32 = 0x100000000n;
    for (let k = 0; k < maxLen; k++) {
      const prev = BigInt(this.state[i - 1]);
      const temp = (mul1 * (prev ^ (prev >> 30n))) & mask;
      const stateI = BigInt(this.state[i]);
      const newVal = (stateI ^ temp) + BigInt(data[j] >>> 0) + BigInt(j);
      this.state[i] = Number(newVal & mask);
      i++;
      if (i >= lenState) {
        this.state[0] = this.state[lenState - 1];
        i = 1;
      }
      j = (j + 1) % lenData;
    }
    for (let k = 0; k < lenState - 1; k++) {
      const prev = BigInt(this.state[i - 1]);
      const temp = (mul2 * (prev ^ (prev >> 30n))) & mask;
      const stateI = BigInt(this.state[i]);
      const newVal = (stateI ^ temp) + (two32 - BigInt(i));
      this.state[i] = Number(newVal & mask);
      i++;
      if (i >= lenState) {
        this.state[0] = this.state[lenState - 1];
        i = 1;
      }
    }
    this.state[0] = 0x80000000 >>> 0;
  }

  twist() {
    for (let i = 0; i < 624; i++) {
      const temp = (this.state[i] & this.upperMask) + (this.state[(i + 1) % 624] & this.lowerMask);
      let tempShift = temp >>> 1;
      if (temp % 2 !== 0) {
        tempShift ^= 0x9908b0df;
      }
      this.state[i] = this.state[(i + this.m) % 624] ^ tempShift;
    }
    this.index = 0;
  }

  getRandomNumber() {
    if (this.index >= 624) {
      this.twist();
    }
    let y = this.state[this.index];
    y ^= y >>> this.u;
    y ^= (y << this.s) & this.b;
    y ^= (y << this.t) & this.c;
    y ^= y >>> this.l;
    this.index++;
    return this.int32(y);
  }

  int32(number) {
    return number >>> 0;
  }
}

// Record layouts. A field is [name, byte, bit, bits] or [name, byte, bit, bits, count]: `bits` bits,
// lowest first, from bit `bit` (0 = lowest) of byte `byte` counted from the start of the record, running
// on into the bytes after it. 'play_skill.7' is element 7 of the play_skill array. With a count the field
// fills that many elements, each straight after the last, from the one named (element 0 without an index).
// A string is [name, byte, length, encoding, clean]: a null-terminated field of `length` bytes, with clean
// applied after the terminator is cut off.

const trim = (s) => s.trim();
const alnum = (s) => s.replace(/[^A-Z\d]/gi, '');

/**
 * Expands a layout's fields into the element path and bit position of each value
 * @param {{ size: number, fields: Array[], strings?: Array[], arrays?: Object<string, number> }} layout
 *        arrays gives the length of arrays the fields leave gaps in, which are filled with 0
 */
function record({ fields, strings = [], arrays = {}, ...rest }) {
    const values = [];
    for (const [name, byte, bit, bits, count] of fields) {
        const path = name.split('.').map((key) => /^\d+$/.test(key) ? +key : key);
        if (count != null && typeof path.at(-1) != 'number') path.push(0);
        for (let i = 0; i < (count ?? 1); i++) {
            const at = path.slice();
            if (count != null) at[at.length - 1] += i;
            values.push({ path: at, pos: byte * 8 + bit + i * bits, bits });
        }
    }
    return { ...rest, fields: values, strings, arrays };
}

// Player looks, from the player ID that starts the block: its own record in PES 15 and 16, the end
// of the player entry from PES 17
const APPEARANCE = [
    ['b_edit_face', 0x04, 0, 1], ['b_edit_hair', 0x04, 1, 1], ['b_edit_phys', 0x04, 2, 1], ['b_edit_strip', 0x04, 3, 1], ['boot_id', 0x04, 4, 14],
    ['glove_id', 0x06, 2, 14],
    ['copy_id', 0x08, 0, 32],
    ['neck_len', 0x0C, 0, 4], ['neck_size', 0x0C, 4, 4],
    ['shldr_hi', 0x0D, 0, 4], ['shldr_wid', 0x0D, 4, 4],
    ['chest', 0x0E, 0, 4], ['waist', 0x0E, 4, 4],
    ['arm_size', 0x0F, 0, 4], ['arm_len', 0x0F, 4, 4],
    ['thigh', 0x10, 0, 4], ['calf', 0x10, 4, 4],
    ['leg_len', 0x11, 0, 4], ['head_len', 0x11, 4, 4],
    ['head_wid', 0x12, 0, 4], ['head_dep', 0x12, 4, 4],
    ['wrist_col_l', 0x13, 0, 3], ['wrist_col_r', 0x13, 3, 3], ['wrist_tape', 0x13, 6, 2],
    ['spec_col', 0x14, 0, 3], ['spec_style', 0x14, 3, 3], ['sleeve', 0x14, 6, 2],
    ['inners', 0x15, 0, 2], ['socks', 0x15, 2, 2], ['undershorts', 0x15, 4, 2], ['untucked', 0x15, 6, 1], ['ankle_tape', 0x15, 7, 1],
    ['gloves', 0x16, 0, 1], ['gloves_col', 0x16, 1, 3],
    // Face sliders (0–14), as read in PES 16 (face-shape.js has what each one moves)
    ['cheek_wid', 0x16, 4, 4],
    ['cheek_hi', 0x17, 0, 4],
    ['cheekbone_wid', 0x18, 0, 4], ['cheekbone_hi', 0x18, 4, 4],
    ['brow_in_x', 0x1A, 4, 4],
    ['brow_hi', 0x1B, 0, 4], ['brow_dep', 0x1B, 4, 4],
    ['brow_out_x', 0x1C, 0, 4], ['brow_out_hi', 0x1C, 4, 4],
    ['eye_size', 0x1D, 4, 4],
    ['eye_dep', 0x1E, 0, 4], ['lid_bi_x', 0x1E, 4, 4],
    ['lid_bi_y', 0x1F, 0, 4], ['lid_bo_x', 0x1F, 4, 4],
    ['lid_bo_y', 0x20, 0, 4], ['lid_ui_x', 0x20, 4, 4],
    ['lid_ui_y', 0x21, 0, 4], ['lid_uo_x', 0x21, 4, 4],
    ['lid_uo_y', 0x22, 0, 4],
    ['lid_bm_y', 0x23, 0, 4], ['eye_x', 0x23, 4, 4],
    ['eye_hi', 0x24, 0, 4], ['nose_hi', 0x24, 4, 4],
    ['nose_dep', 0x25, 0, 4], ['nose_wid', 0x25, 4, 4],
    ['bridge_dep', 0x26, 4, 4],
    ['bridge_wid', 0x27, 0, 4],
    ['mouth_hi', 0x28, 0, 4], ['mouth_dep', 0x28, 4, 4],
    ['lip_thick', 0x29, 0, 4],
    ['mouth_crnr', 0x2A, 0, 4], ['mouth_wid', 0x2A, 4, 4],
    ['chin_wid', 0x2B, 4, 4],
    ['chin_hi', 0x2C, 0, 4], ['chin_dep', 0x2C, 4, 4],
    ['skin_col', 0x2D, 0, 3],
    // Edit hair (PES 16; edit-hair.js turns them into the game's hair model and textures)
    ['hair_col_r', 0x35, 6, 6], ['hair_col_g', 0x36, 4, 6], ['hair_col_b', 0x37, 2, 6],
    ['hair_type', 0x38, 0, 4], ['hair_pt', 0x38, 4, 4],
    ['hair_len', 0x3C, 0, 3], ['hair_tex', 0x3C, 3, 3], ['hair_acc', 0x3D, 0, 1], ['hair_acc_col', 0x3D, 1, 3],
    ['face_size', 0x33, 0, 4], ['face_height', 0x33, 4, 4],
    ['iris_col', 0x40, 0, 4], ['hair_sp', 0x40, 4, 8],
    ['hair_dir', 0x42, 0, 3], ['hair_line', 0x42, 3, 3], ['hair_sb', 0x42, 6, 3], ['hair_ovm', 0x43, 1, 3], ['hair_part', 0x43, 4, 2],
];
const appearanceAt = (start) => APPEARANCE.map(([name, byte, ...rest]) => [name, start + byte, ...rest]);

const PLAYER_15 = record({
    size: 0x70,
    arrays: { play_skill: 28 },
    strings: [['name', 0x30, 46, 'utf-8'], ['shirt_name', 0x5E, 18, 'ascii', trim]],
    fields: [
        ['id', 0x00, 0, 32],
        ['nation', 0x0A, 0, 16],
        ['height', 0x0C, 0, 8],
        ['weight', 0x0D, 0, 8],
        ['gc1', 0x0E, 0, 8],
        ['gc2', 0x0F, 0, 8],
        ['atk', 0x10, 0, 7], ['def', 0x10, 7, 7],
        ['gk', 0x11, 6, 7],
        ['mo_fk', 0x13, 4, 4],
        ['ball_ctrl', 0x14, 0, 7], ['finish', 0x14, 7, 7],
        ['lowpass', 0x15, 6, 7],
        ['loftpass', 0x16, 5, 7],
        ['weak_acc', 0x17, 4, 2], ['b_edit_player', 0x17, 7, 1],
        ['place_kick', 0x18, 0, 7], ['swerve', 0x18, 7, 7],
        ['catching', 0x19, 6, 7],
        ['speed', 0x1A, 5, 7],
        ['form', 0x1B, 4, 3],
        ['exp_pwr', 0x1C, 0, 7], ['jump', 0x1C, 7, 7],
        ['stamina', 0x1D, 6, 7],
        ['age', 0x1E, 5, 6],
        ['reg_pos', 0x1F, 3, 4],
        ['play_style', 0x20, 0, 5], ['drib', 0x20, 5, 7],
        ['header', 0x21, 4, 7],
        ['body_ctrl', 0x22, 3, 7],
        ['injury', 0x23, 2, 2], ['mo_armd', 0x23, 5, 3],
        ['mo_armr', 0x24, 0, 3], ['mo_ck', 0x24, 3, 3], ['weak_use', 0x24, 6, 2],
        ['play_pos', 0x25, 0, 2, 13],
        ['mo_hunchd', 0x28, 2, 2], ['mo_hunchr', 0x28, 4, 2], ['mo_pk', 0x28, 6, 2],
        ['ball_win', 0x29, 0, 7], ['kick_pwr', 0x29, 7, 7],
        ['b_base_copy', 0x2B, 2, 1], ['b_edit_basicset', 0x2B, 3, 1],
        ['strong_foot', 0x2C, 2, 1], ['com_style', 0x2C, 3, 1, 7],
        ['play_skill', 0x2D, 2, 1, 6],
        ['play_skill.7', 0x2E, 0, 1, 3], ['play_skill.11', 0x2E, 3, 1, 5],
        ['play_skill.18', 0x2F, 0, 1, 3], ['play_skill.22', 0x2F, 3, 1, 2], ['play_skill.25', 0x2F, 5, 1, 3],
    ],
});

const PLAYER_16 = record({
    size: 0x70,
    strings: [['name', 0x32, 46, 'utf-8'], ['shirt_name', 0x60, 16, 'ascii', trim]],
    fields: [
        ['id', 0x00, 0, 32],
        ['nation', 0x0A, 0, 16],
        ['height', 0x0C, 0, 8],
        ['weight', 0x0D, 0, 8],
        ['gc1', 0x0E, 0, 8],
        ['gc2', 0x0F, 0, 8],
        ['atk', 0x10, 0, 7], ['def', 0x10, 7, 7],
        ['gk', 0x11, 6, 7],
        ['drib', 0x12, 5, 7],
        ['mo_fk', 0x13, 4, 4],
        ['finish', 0x14, 0, 7], ['lowpass', 0x14, 7, 7],
        ['loftpass', 0x15, 6, 7],
        ['header', 0x16, 5, 7],
        ['form', 0x17, 4, 3], ['b_edit_player', 0x17, 7, 1],
        ['swerve', 0x18, 0, 7], ['catching', 0x18, 7, 7],
        ['clearing', 0x19, 6, 7],
        ['reflex', 0x1A, 5, 7],
        ['injury', 0x1B, 4, 2], ['b_edit_basicset', 0x1B, 7, 1],
        ['body_ctrl', 0x1C, 0, 7], ['kick_pwr', 0x1C, 7, 7],
        ['exp_pwr', 0x1D, 6, 7],
        ['jump', 0x1E, 5, 7],
        ['mo_armd', 0x1F, 4, 3], ['b_edit_regpos', 0x1F, 7, 1],
        ['reg_pos', 0x20, 0, 4], ['play_style', 0x20, 5, 5],
        ['ball_ctrl', 0x21, 2, 7],
        ['ball_win', 0x22, 1, 7],
        ['cover', 0x23, 0, 7], ['b_edit_playpos', 0x23, 7, 1],
        ['mo_armr', 0x24, 0, 3], ['mo_ck', 0x24, 3, 3], ['weak_acc', 0x24, 6, 2],
        ['weak_use', 0x25, 0, 2], ['play_pos', 0x25, 2, 2, 13],
        ['mo_hunchd', 0x28, 4, 2], ['mo_hunchr', 0x28, 6, 2],
        ['mo_pk', 0x29, 0, 2], ['place_kick', 0x29, 2, 7],
        ['speed', 0x2A, 1, 7],
        ['age', 0x2B, 0, 6], ['b_edit_ability', 0x2B, 6, 1], ['b_edit_skill', 0x2B, 7, 1],
        ['stamina', 0x2C, 0, 7], ['b_edit_style', 0x2C, 7, 1],
        ['b_edit_com', 0x2D, 0, 1], ['b_edit_motion', 0x2D, 1, 1], ['b_base_copy', 0x2D, 3, 1], ['strong_foot', 0x2D, 4, 1], ['com_style', 0x2D, 5, 1, 7],
        ['play_skill', 0x2E, 4, 1, 28],
    ],
});

const PLAYER_17 = record({
    size: 0xBC,
    strings: [['name', 0x34, 46, 'utf-8'], ['shirt_name', 0x62, 18, 'ascii', trim]],
    fields: [
        ['id', 0x00, 0, 32],
        ['nation', 0x0A, 0, 16],
        ['height', 0x0C, 0, 8],
        ['gc2', 0x0D, 0, 8],
        ['weight', 0x0E, 0, 8],
        ['gc1', 0x0F, 0, 8],
        ['atk', 0x10, 0, 7], ['def', 0x10, 7, 7],
        ['gk', 0x11, 6, 7],
        ['drib', 0x12, 5, 7],
        ['mo_fk', 0x13, 4, 4],
        ['finish', 0x14, 0, 7], ['lowpass', 0x14, 7, 7],
        ['loftpass', 0x15, 6, 7],
        ['header', 0x16, 5, 7],
        ['form', 0x17, 4, 3], ['b_edit_player', 0x17, 7, 1],
        ['swerve', 0x18, 0, 7], ['catching', 0x18, 7, 7],
        ['clearing', 0x19, 6, 7],
        ['reflex', 0x1A, 5, 7],
        ['injury', 0x1B, 4, 2], ['b_edit_basicset', 0x1B, 7, 1],
        ['body_ctrl', 0x1C, 0, 7], ['phys_cont', 0x1C, 7, 7],
        ['kick_pwr', 0x1D, 6, 7],
        ['exp_pwr', 0x1E, 5, 7],
        ['mo_armd', 0x1F, 4, 3], ['b_edit_regpos', 0x1F, 7, 1],
        ['age', 0x20, 0, 6], ['reg_pos', 0x20, 6, 4],
        ['play_style', 0x21, 3, 5],
        ['ball_ctrl', 0x22, 0, 7], ['ball_win', 0x22, 7, 7],
        ['weak_acc', 0x23, 6, 2],
        ['jump', 0x24, 0, 7], ['mo_armr', 0x24, 7, 3],
        ['mo_ck', 0x25, 2, 3], ['cover', 0x25, 5, 7],
        ['weak_use', 0x26, 4, 2], ['play_pos', 0x26, 6, 2, 13],
        ['mo_hunchd', 0x2A, 0, 2], ['mo_hunchr', 0x2A, 2, 2], ['mo_pk', 0x2A, 4, 2], ['place_kick', 0x2A, 6, 7],
        ['b_edit_playpos', 0x2B, 5, 1], ['b_edit_ability', 0x2B, 6, 1], ['b_edit_skill', 0x2B, 7, 1],
        ['stamina', 0x2C, 0, 7], ['speed', 0x2C, 7, 7],
        ['b_edit_style', 0x2D, 6, 1], ['b_edit_com', 0x2D, 7, 1],
        ['b_edit_motion', 0x2E, 0, 1], ['b_base_copy', 0x2E, 1, 1], ['strong_foot', 0x2E, 3, 1], ['com_style', 0x2E, 5, 1, 7],
        ['play_skill', 0x2F, 4, 1, 28],
        ...appearanceAt(0x74),
    ],
});

const PLAYER_18 = record({
    size: 0xBC,
    strings: [['name', 0x34, 46, 'utf-8'], ['shirt_name', 0x62, 18, 'ascii', trim]],
    fields: [
        ['id', 0x00, 0, 32],
        ['nation', 0x0A, 0, 16],
        ['height', 0x0C, 0, 8],
        ['weight', 0x0D, 0, 8],
        ['gc1', 0x0E, 0, 8],
        ['gc2', 0x0F, 0, 8],
        ['atk', 0x10, 0, 7], ['def', 0x10, 7, 7],
        ['gk', 0x11, 6, 7],
        ['drib', 0x12, 5, 7],
        ['mo_fk', 0x13, 4, 4],
        ['finish', 0x14, 0, 7], ['lowpass', 0x14, 7, 7],
        ['loftpass', 0x15, 6, 7],
        ['header', 0x16, 5, 7],
        ['form', 0x17, 4, 3], ['b_edit_player', 0x17, 7, 1],
        ['swerve', 0x18, 0, 7], ['catching', 0x18, 7, 7],
        ['clearing', 0x19, 6, 7],
        ['reflex', 0x1A, 5, 7],
        ['injury', 0x1B, 4, 2], ['b_edit_basicset', 0x1B, 7, 1],
        ['body_ctrl', 0x1C, 0, 7], ['phys_cont', 0x1C, 7, 7],
        ['kick_pwr', 0x1D, 6, 7],
        ['exp_pwr', 0x1E, 5, 7],
        ['b_edit_regpos', 0x1F, 7, 1],
        ['age', 0x20, 0, 6], ['reg_pos', 0x20, 6, 4],
        ['play_style', 0x21, 3, 5],
        ['ball_ctrl', 0x22, 0, 7], ['ball_win', 0x22, 7, 7],
        ['weak_acc', 0x23, 6, 2],
        ['jump', 0x24, 0, 7], ['mo_armd', 0x24, 7, 2],
        ['mo_armr', 0x25, 2, 3], ['mo_ck', 0x25, 5, 3],
        ['cover', 0x26, 0, 7], ['weak_use', 0x26, 7, 2],
        ['play_pos', 0x27, 1, 2, 3], ['b_edit_playpos', 0x27, 7, 1],
        ['play_pos.4', 0x28, 0, 2, 9],
        ['mo_hunchd', 0x2A, 2, 2], ['mo_hunchr', 0x2A, 4, 2], ['mo_pk', 0x2A, 6, 2],
        ['place_kick', 0x2B, 0, 7], ['b_edit_ability', 0x2B, 7, 1],
        ['stamina', 0x2C, 0, 7], ['play_pos.3', 0x2C, 7, 2],
        ['speed', 0x2D, 1, 7],
        ['b_edit_skill', 0x2E, 0, 1], ['b_edit_style', 0x2E, 1, 1], ['b_edit_com', 0x2E, 2, 1], ['b_edit_motion', 0x2E, 3, 1], ['b_base_copy', 0x2E, 4, 1], ['strong_foot', 0x2E, 6, 1],
        ['com_style', 0x2F, 0, 1, 7], ['play_skill', 0x2F, 7, 1, 28],
        ...appearanceAt(0x74),
    ],
});

const PLAYER_19 = record({
    size: 0xBC,
    arrays: { play_skill: 40 },
    strings: [['name', 0x34, 46, 'utf-8'], ['shirt_name', 0x62, 18, 'ascii', trim]],
    fields: [
        ['id', 0x00, 0, 32],
        ['nation', 0x08, 0, 16],
        ['height', 0x0A, 0, 8],
        ['weight', 0x0B, 0, 8],
        ['gc1', 0x0C, 0, 8],
        ['gc2', 0x0D, 0, 8],
        ['atk', 0x0E, 0, 7], ['ball_ctrl', 0x0E, 7, 7],
        ['weak_use', 0x0F, 6, 2],
        ['lowpass', 0x10, 0, 7], ['loftpass', 0x10, 7, 7],
        ['finish', 0x11, 6, 7],
        ['place_kick', 0x12, 5, 7],
        ['mo_armd', 0x13, 4, 3],
        ['header', 0x14, 0, 7], ['def', 0x14, 7, 7],
        ['ball_win', 0x15, 6, 7],
        ['kick_pwr', 0x16, 5, 7],
        ['mo_armr', 0x17, 4, 3],
        ['exp_pwr', 0x18, 0, 7], ['body_ctrl', 0x18, 7, 7],
        ['phys_cont', 0x19, 6, 7],
        ['jump', 0x1A, 5, 7],
        ['mo_ck', 0x1B, 4, 3],
        ['catching', 0x1C, 0, 7], ['clearing', 0x1C, 7, 7],
        ['reflex', 0x1D, 6, 7],
        ['cover', 0x1E, 5, 7],
        ['form', 0x1F, 4, 3], ['b_edit_player', 0x1F, 7, 1],
        ['reg_pos', 0x20, 0, 4], ['play_style', 0x20, 5, 5],
        ['mo_fk', 0x21, 2, 4], ['swerve', 0x21, 7, 7],
        ['speed', 0x22, 6, 7],
        ['star', 0x23, 5, 3],
        ['stamina', 0x24, 0, 7], ['gk', 0x24, 7, 7],
        ['mo_pk', 0x25, 6, 3],
        ['drib', 0x26, 1, 7],
        ['weak_acc', 0x27, 0, 2], ['injury', 0x27, 2, 2], ['play_pos.12', 0x27, 4, 2], ['play_pos.9', 0x27, 6, 2, 3],
        ['play_pos.5', 0x28, 4, 2, 4],
        ['play_pos.4', 0x29, 4, 2], ['play_pos.2', 0x29, 6, 2, 2],
        ['play_pos.1', 0x2A, 2, 2], ['play_pos.0', 0x2A, 4, 2], ['mo_hunchd', 0x2A, 6, 2],
        ['mo_hunchr', 0x2B, 0, 2], ['age', 0x2B, 2, 6],
        ['b_edit_basicset', 0x2C, 0, 1], ['b_edit_regpos', 0x2C, 1, 1], ['b_edit_playpos', 0x2C, 2, 1], ['b_edit_ability', 0x2C, 3, 1],
        ['b_edit_skill', 0x2C, 4, 1], ['b_edit_style', 0x2C, 5, 1], ['b_edit_com', 0x2C, 6, 1], ['b_edit_motion', 0x2C, 7, 1],
        ['strong_foot', 0x2D, 1, 1], ['com_style', 0x2D, 2, 1, 7],
        ['play_skill.0', 0x2E, 1, 1], ['play_skill.28', 0x2E, 2, 1], ['play_skill.1', 0x2E, 3, 1, 3], ['play_skill.29', 0x2E, 6, 1], ['play_skill.4', 0x2E, 7, 1, 2],
        ['play_skill.30', 0x2F, 1, 1], ['play_skill.6', 0x2F, 2, 1, 2], ['play_skill.31', 0x2F, 4, 1], ['play_skill.8', 0x2F, 5, 1], ['play_skill.32', 0x2F, 6, 1, 2],
        ['play_skill.9', 0x30, 0, 1, 8],
        ['play_skill.34', 0x31, 0, 1], ['play_skill.17', 0x31, 1, 1, 2], ['play_skill.35', 0x31, 3, 1], ['play_skill.19', 0x31, 4, 1, 2], ['play_skill.36', 0x31, 6, 1, 2],
        ['play_skill.21', 0x32, 0, 1, 3], ['play_skill.38', 0x32, 3, 1], ['play_skill.24', 0x32, 4, 1, 4],
        ...appearanceAt(0x74),
    ],
});

const PLAYER_20 = record({
    size: 0x138,
    arrays: { play_skill: 50 },
    strings: [['name', 0x36, 61, 'utf-8'], ['shirt_name', 0x73, 21, 'ascii']],
    fields: [
        ['id', 0x00, 0, 32],
        ['nation', 0x08, 0, 16],
        ['height', 0x0A, 0, 8],
        ['weight', 0x0B, 0, 8],
        ['gc1', 0x0C, 0, 8],
        ['gc2', 0x0D, 0, 8],
        ['atk', 0x0E, 0, 7], ['ball_ctrl', 0x0E, 7, 7],
        ['weak_use', 0x0F, 6, 2],
        ['tight_pos', 0x10, 0, 7], ['lowpass', 0x10, 7, 7],
        ['loftpass', 0x11, 6, 7],
        ['finish', 0x12, 5, 7],
        ['mo_armd', 0x13, 4, 4],
        ['place_kick', 0x14, 0, 7], ['swerve', 0x14, 7, 7],
        ['speed', 0x15, 6, 7],
        ['exp_pwr', 0x16, 5, 7],
        ['mo_armr', 0x17, 4, 4],
        ['jump', 0x18, 0, 7], ['phys_cont', 0x18, 7, 7],
        ['body_ctrl', 0x19, 6, 7],
        ['stamina', 0x1A, 5, 7],
        ['mo_ck', 0x1B, 4, 4],
        ['ball_win', 0x1C, 0, 7], ['aggres', 0x1C, 7, 7],
        ['gk', 0x1D, 6, 7],
        ['catching', 0x1E, 5, 7],
        ['form', 0x1F, 4, 3], ['b_edit_player', 0x1F, 7, 1],
        ['cover', 0x20, 0, 7], ['age', 0x20, 7, 6],
        ['reg_pos', 0x21, 5, 4],
        ['play_style', 0x22, 2, 5], ['mo_fk', 0x22, 7, 5],
        ['star', 0x23, 4, 3], ['b_edit_basicset', 0x23, 7, 1],
        ['def', 0x24, 0, 7], ['clearing', 0x24, 7, 7],
        ['header', 0x25, 6, 7],
        ['mo_hunchd', 0x26, 5, 3],
        ['mo_hunchr', 0x27, 0, 3], ['mo_pk', 0x27, 3, 3], ['weak_acc', 0x27, 6, 2],
        ['drib', 0x28, 0, 7], ['injury', 0x28, 7, 2],
        ['play_attit', 0x29, 1, 2], ['mo_drib', 0x29, 3, 2], ['play_pos.12', 0x29, 5, 2], ['play_pos.9', 0x29, 7, 2, 3],
        ['play_pos.5', 0x2A, 5, 2, 4],
        ['play_pos.4', 0x2B, 5, 2], ['b_edit_regpos', 0x2B, 7, 1],
        ['play_pos.3', 0x2C, 0, 2], ['play_pos.1', 0x2C, 2, 2], ['play_pos.0', 0x2C, 4, 2], ['reflex', 0x2C, 6, 7],
        ['kick_pwr', 0x2D, 5, 7],
        ['play_pos.2', 0x2E, 4, 2], ['b_edit_playpos', 0x2E, 6, 1], ['b_edit_ability', 0x2E, 7, 1],
        ['b_edit_skill', 0x2F, 0, 1], ['b_edit_style', 0x2F, 1, 1], ['b_edit_com', 0x2F, 2, 1], ['b_edit_motion', 0x2F, 3, 1],
        ['strong_foot', 0x2F, 5, 1], ['strong_hand', 0x2F, 6, 1], ['com_style', 0x2F, 7, 1, 7],
        ['play_skill.0', 0x30, 6, 1], ['play_skill.28', 0x30, 7, 1],
        ['play_skill.1', 0x31, 0, 1, 3], ['play_skill.29', 0x31, 3, 1], ['play_skill.4', 0x31, 4, 1, 2], ['play_skill.30', 0x31, 6, 1], ['play_skill.6', 0x31, 7, 1, 2],
        ['play_skill.31', 0x32, 1, 1], ['play_skill.39', 0x32, 2, 1], ['play_skill.8', 0x32, 3, 1], ['play_skill.32', 0x32, 4, 1, 2], ['play_skill.9', 0x32, 6, 1, 4],
        ['play_skill.40', 0x33, 2, 1], ['play_skill.13', 0x33, 3, 1, 4], ['play_skill.34', 0x33, 7, 1],
        ['play_skill.17', 0x34, 0, 1, 2], ['play_skill.35', 0x34, 2, 1], ['play_skill.19', 0x34, 3, 1, 2], ['play_skill.36', 0x34, 5, 1, 2], ['play_skill.21', 0x34, 7, 1, 3],
        ['play_skill.38', 0x35, 2, 1], ['play_skill.24', 0x35, 3, 1, 4],
        ...appearanceAt(0xF0),
    ],
});

const TEAM_15 = record({
    size: 0x1C8,
    strings: [['name', 0x94, 0x46, 'utf-8'], ['short_name', 0xDA, 4, 'ascii', alnum]],
    fields: [['id', 0x00, 0, 32], ['b_edit_name', 0x12, 0, 1], ['b_edit_shortname', 0x12, 1, 1]],
});

const TEAM_16 = record({
    size: 0x1C8,
    strings: [['name', 0x94, 0x46, 'utf-8'], ['short_name', 0xDA, 4, 'ascii', alnum]],
    fields: [['id', 0x00, 0, 32], ['b_edit_name', 0x12, 0, 1]],
});

const TEAM_COLORS_17 = [
    ['color1_red', 0x12, 0, 6], ['color1_green', 0x12, 6, 6],
    ['color2_red', 0x14, 0, 6], ['color2_green', 0x14, 6, 6],
    ['color2_blue', 0x15, 4, 6],
    ['color1_blue', 0x16, 2, 6],
];

const TEAM_17 = record({
    size: 0x1E0,
    strings: [['name', 0x98, 0x46, 'utf-8'], ['short_name', 0xDE, 4, 'ascii', alnum]],
    fields: [
        ['id', 0x00, 0, 32],
        ...TEAM_COLORS_17,
        ['b_edit_name', 0x19, 4, 1],
        ['b_edit_strip', 0x1A, 5, 1],
        ...Array.from({ length: 10 }, (_, i) => [
            [`stripBlock.${i}.stripNumber`, 0x1C + 4 * i, 0, 8], [`stripBlock.${i}.stripTeamId`, 0x1D + 4 * i, 0, 24],
        ]).flat(),
    ],
});

const TEAM_18 = record({
    size: 0x1E0,
    strings: [['name', 0x98, 0x46, 'utf-8'], ['short_name', 0xDE, 4, 'utf-8', alnum]],
    fields: [['id', 0x00, 0, 32], ...TEAM_COLORS_17, ['b_edit_name', 0x19, 4, 1]],
});

const TEAM_19 = record({
    size: 0x1A0,
    strings: [['name', 0x58, 0x46, 'utf-8'], ['short_name', 0x9E, 4, 'utf-8', alnum]],
    fields: [
        ['id', 0x00, 0, 32],
        ['manager_id', 0x04, 0, 32],
        ['stadium_id', 0x0A, 0, 16],
        ['color1_red', 0x16, 2, 6],
        ['color1_green', 0x17, 0, 6], ['b_edit_name', 0x17, 6, 1],
        ['color2_green', 0x18, 0, 6], ['color2_blue', 0x18, 6, 6],
        ['b_edit_stadium', 0x1B, 6, 1],
        ['color1_blue', 0x1C, 0, 6], ['color2_red', 0x1C, 6, 6],
    ],
});

const TEAM_21 = record({
    size: 0x24C,
    rivals: 0x58, // three rival team IDs, see readRivals
    strings: [['name', 0x68, 0x46, 'utf-8'], ['short_name', 0xAE, 4, 'ascii', alnum], ['stadium_name', 0xB2, 181, 'utf-8']],
    fields: [
        ['id', 0x00, 0, 32],
        ['manager_id', 0x04, 0, 32],
        ['stadium_id', 0x0A, 0, 16],
        ['color1_red', 0x16, 2, 6],
        ['color1_green', 0x17, 0, 6], ['b_edit_name', 0x17, 6, 1],
        ['color2_green', 0x18, 0, 6], ['color2_blue', 0x18, 6, 6],
        ['b_edit_stadium', 0x1B, 6, 1],
        ['color1_blue', 0x1E, 0, 6], ['color2_red', 0x1E, 6, 6],
    ],
});
// PES 20's team entries are 60 bytes shorter than PES 21's for some reason, with the same layout
const TEAM_20 = { ...TEAM_21, size: 0x210 };

// Rosters and tactics start with the team ID, which picks the team they fill
const ROSTER_15 = record({ size: 0xA4, fields: [['players', 0x04, 0, 32, 32], ['numbers', 0x84, 0, 8, 32]] });
const ROSTER_19 = record({ size: 0xF4, fields: [['players', 0x04, 0, 32, 40], ['numbers', 0xA4, 0, 16, 40]] });
const ROSTER_20 = { ...ROSTER_19, size: 0x11C };

const TACTICS_15 = record({ size: 0x204, fields: [['captain_ind', 0x1FA, 0, 8]] });
const TACTICS_16 = record({ size: 0x208, fields: [['captain_ind', 0x1FE, 0, 8]] });
const TACTICS_17 = record({ size: 0x274, fields: [['starting11', 0x1E4, 0, 8, 11], ['captain_ind', 0x20D, 0, 8]] });
const TACTICS_19 = record({ size: 0x274, fields: [['starting11', 0x1E4, 0, 8, 11], ['captain_ind', 0x215, 0, 8]] });

// Each PES version's player and team counts, and where each list of records starts in the payload with
// its layout. From PES 18 a custom skin color (7) loads as 0 with b_changed set.
const VERSIONS = {
    '15': {
        playerCount: 0x34, teamCount: 0x38,
        players: [0x4C, PLAYER_15], appearances: [0x2AB9CC, record({ size: 0x44, fields: APPEARANCE })],
        teams: [0x44AA6C, TEAM_15], rosters: [0x4E45CC, ROSTER_15], tactics: [0x507194, TACTICS_15],
    },
    '16': {
        playerCount: 0x34, teamCount: 0x38,
        players: [0x4C, PLAYER_16], appearances: [0x2AB9CC, record({ size: 0x48, fields: APPEARANCE })],
        teams: [0x46310C, TEAM_16], rosters: [0x4FCC6C, ROSTER_15], tactics: [0x51F814, TACTICS_16],
    },
    '17': {
        playerCount: 0x5C, teamCount: 0x60,
        players: [0x78, PLAYER_17],
        teams: [0x3C3E58, TEAM_17], rosters: [0x475A90, ROSTER_15], tactics: [0x490640, TACTICS_17],
    },
    '18': {
        playerCount: 0x60, teamCount: 0x64, noCustomSkin: true,
        players: [0x7C, PLAYER_18],
        teams: [0x3C3E5C, TEAM_18], rosters: [0x46FF54, ROSTER_15], tactics: [0x488B74, TACTICS_17],
    },
    '19': {
        playerCount: 0x60, teamCount: 0x64, noCustomSkin: true,
        players: [0x7C, PLAYER_19],
        teams: [0x5BCC7C, TEAM_19], rosters: [0x6773C4, ROSTER_19], tactics: [0x69EC8C, TACTICS_19],
    },
    '20': {
        playerCount: 0x60, teamCount: 0x64, noCustomSkin: true,
        players: [0x7C, PLAYER_20],
        teams: [0x8ED2FC, TEAM_20], rosters: [0x9CCC04, ROSTER_20], tactics: [0xA01E3C, TACTICS_19],
    },
    '21': {
        playerCount: 0x60, teamCount: 0x64, noCustomSkin: true,
        players: [0x7C, PLAYER_20],
        teams: [0x8ED2FC, TEAM_21], rosters: [0x9D4648, ROSTER_20], tactics: [0xA09880, TACTICS_19],
    },
};

const RIVAL_OFF = 262143; // a rival slot that's turned off

const decoders = { 'utf-8': new TextDecoder('utf-8'), ascii: new TextDecoder('ascii') };
const setPath = (obj, path, value) => {
    for (let i = 0; i < path.length - 1; i++)
        obj = obj[path[i]] ??= typeof path[i + 1] == 'number' ? [] : {};
    obj[path.at(-1)] = value;
};
const getPath = (obj, path) => path.reduce((o, key) => o?.[key], obj);

export class SaveFile {
    constructor() {
        this.identifier = null;
        this.description = null;
        this.logo = null;
        this.payload = null;
        this.serial = null;
        this.players = {};
        this.teams = {};
        this.pes = null;
        this.salt = null;       // PES 16-21: reused on save
        this.header15 = null;   // PES 15: raw 49-byte header, reused on save
    }

    static cryptStream(key, length) {
        const foo = new Uint32Array(key.buffer);
        const twister = new MersenneRNG(Array.from(foo));

        const output = new Uint8Array((length + 3) & ~3); // pad to multiple of 4
        let c0 = twister.getRandomNumber();
        let c1 = twister.getRandomNumber();
        let c2 = twister.getRandomNumber();
        let c3 = twister.getRandomNumber();

        const rol = (value, bits) => ((value << bits) >>> 0) | (value >>> (32 - bits));
        const ror = (value, bits) => rol(value, 32 - bits);

        const view = new DataView(output.buffer);
        for (let i = 0; i < length; i += 4) {
            const c4 = twister.getRandomNumber();
            const v = c4 ^ c3 ^ c2 ^ c1 ^ c0;
            c0 = ror(c1, 15);
            c1 = rol(c2, 11);
            c2 = rol(c3, 7);
            c3 = ror(c4, 13);
            view.setUint32(i, v, true); // little-endian
        }
        return output.slice(0, length);
    }

    static xor(data, key) {
        const result = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            result[i] = data[i] ^ key[i % key.length];
        }
        return result;
    }

    static cryptData(key, data) {
        return SaveFile.xor(data, SaveFile.cryptStream(key, data.length));
    }

    static decryptSalt(salt) {
        const headerKey = SaveFile.xor(effectiveMasterKey, salt.slice(256, 320));
        const decryptedSalt = new Uint8Array([
            ...SaveFile.cryptData(headerKey, salt.slice(0, 256)),
            ...salt.slice(256, 320),
        ]);

        // XOR the five 64-byte blocks together
        let key = decryptedSalt.slice(0, 64);
        for (let i = 64; i < 320; i += 64)
            key = SaveFile.xor(key, decryptedSalt.slice(i, i + 64));
        return key;
    }

    /**
     * Key for one section of a PES 16-21 save: 0-3 for the description, logo, payload and serial, or
     * the header size for the header
     */
    static sectionKey(key, section) {
        return SaveFile.xor(key, new Uint8Array([section, 0, 0, 0, 0, 0, 0, 0]));
    }

    /**
     * Loads data for PES 15: [49-byte header][384-byte identifier][logo length][logo][payload length][payload]
     * @param {Uint8Array} data
     * @returns {boolean} True if successful, false if not
     */
    load15(data) {
        if(!SaveFile.arraysEqual(data.subarray(1, masterKeys['15'].length + 1), masterKeys['15'])) {
            return false;
        }

        this.header15 = data.slice(0, 49);

        const view = new DataView(data.buffer, data.byteOffset);
        let pos = 49;
        const chunk = (length) => SaveFile.cryptChunk15(data[0], data.subarray(pos, pos += length));
        const length = () => view.getUint32((pos += 4) - 4, true);

        this.identifier = chunk(384);
        this.logo = chunk(length());
        this.payload = chunk(length());
        this.description = null;
        this.serial = null;
        this.pes = '15';

        return true;
    }

    /**
     * Loads data for PES 16-21
     * @param {Uint8Array} data
     * @returns {boolean} True if successful, false if not
     */
    load16_21(data) {
        const salt = data.slice(0, 320);
        let key, header;
        let offset = 320;

        this.pes = null;
        let headerSize
        for(const _pes of Object.keys(masterKeys)) {
            setMasterKey(_pes);
            key = SaveFile.decryptSalt(salt);

            headerSize = SaveFile.headerSize(_pes)

            header = SaveFile.cryptData(SaveFile.sectionKey(key, headerSize), data.slice(offset, offset + headerSize));

            if(SaveFile.arraysEqual(header.slice(0, 64), effectiveMasterKey)) {
                this.pes = _pes;
                break;
            }
        }

        if(!this.pes) return false;

        this.salt = salt;
        offset += headerSize;

        const view = new DataView(header.buffer, header.byteOffset + 64, 16);
        const payloadSize = view.getUint32(0, true);
        const logoSize = view.getUint32(4, true);
        const descriptionSize = view.getUint32(8, true);
        const serialSize = view.getUint32(12, true);

        this.identifier = header.slice(80);

        [this.description, this.logo, this.payload, this.serial] =
            [descriptionSize, logoSize, payloadSize, serialSize * 2].map((size, section) =>
                SaveFile.cryptData(SaveFile.sectionKey(key, section), data.slice(offset, offset += size)));

        return true
    }

    /**
     * Loads EDIT00000000 or EDIT.bin files into instanced members
     * @param {File|Blob|ArrayBuffer} file
     * @returns {boolean} True if successful, false if not
     */
    async load(file) {
        let data;
        if (file instanceof Blob || file instanceof File) {
            data = await file.bytes()//new Uint8Array(await file.arrayBuffer());
        } else if (file instanceof ArrayBuffer) {
            data = new Uint8Array(file);
        } else {
            console.error("Invalid file input");
            return false;
        }

        if(!this.load15(data) && !this.load16_21(data)) {
            return false;
        }
        if(!VERSIONS[this.pes])
            throw new Error(`Reading PES ${this.pes} saves isn't supported yet`);

        this.loadPlayers();
        this.loadTeams();

        return true
    }

    /**
     * Writes players and teams back into the payload, then encrypts identifier, description,
     * logo, payload and serial into a save file for the PES version it was loaded from
     * @returns {Uint8Array} Bytes of the EDIT00000000 or EDIT.bin file
     */
    save() {
        this.savePlayers();
        this.saveTeams();

        return this.header15 ? this.save15() : this.save16_21();
    }

    /**
     * Encrypts data for PES 15, the inverse of load15
     * @returns {Uint8Array}
     */
    save15() {
        if(this.identifier.length != 384)
            throw new Error(`PES 15 identifier must be 384 bytes, not ${this.identifier.length}`);

        const output = new Uint8Array(
            this.header15.length +
            this.identifier.length +
            4 + this.logo.length +
            4 + this.payload.length
        );
        const view = new DataView(output.buffer);

        output.set(this.header15);
        let pos = this.header15.length;
        for (const chunk of [this.identifier, this.logo, this.payload]) {
            if (chunk != this.identifier) {
                // Chunk lengths sit unencrypted before the logo and payload
                view.setUint32(pos, chunk.length, true);
                pos += 4;
            }
            output.set(SaveFile.cryptChunk15(this.header15[0], chunk), pos);
            pos += chunk.length;
        }

        return output;
    }

    /**
     * Encrypts or decrypts one PES 15 chunk; the stream restarts from startByte for each chunk
     * @param {number} startByte - first byte of the file
     * @param {Uint8Array} chunk
     * @returns {Uint8Array}
     */
    static cryptChunk15(startByte, chunk) {
        const output = new Uint8Array(chunk.length);
        let seed = startByte;
        for (let i = 0; i < chunk.length; i++) {
            seed = (seed * 21 + 7) % 32768;
            output[i] = chunk[i] ^ (seed % 255);
        }
        return output;
    }

    /**
     * Header size for PES 16-21 saves
     * @param {string} pes
     * @returns {number}
     */
    static headerSize(pes) {
        return pes == '16MyClub' || parseInt(pes) < 18 ? 176 : 208;
    }

    /**
     * Encrypts data for PES 16-21, the inverse of load16_21
     * @returns {Uint8Array}
     */
    save16_21() {
        setMasterKey(this.pes);
        const headerSize = SaveFile.headerSize(this.pes);
        if(this.identifier.length != headerSize - 80)
            throw new Error(`PES ${this.pes} identifier must be ${headerSize - 80} bytes, not ${this.identifier.length}`);

        // Reuse the loaded salt; any salt works, as the key is derived from it
        const salt = this.salt ?? crypto.getRandomValues(new Uint8Array(320));

        const key = SaveFile.decryptSalt(salt);

        const header = new Uint8Array(effectiveMasterKey.length + 16 + this.identifier.length);
        header.set(effectiveMasterKey);
        const view = new DataView(header.buffer, effectiveMasterKey.length);
        view.setUint32(0, this.payload.length, true);
        view.setUint32(4, this.logo.length, true);
        view.setUint32(8, this.description.length, true);
        view.setUint32(12, this.serial.length / 2, true);
        header.set(this.identifier, 16 + effectiveMasterKey.length);

        const sections = [
            [salt],
            [header, headerSize],
            [this.description, 0], [this.logo, 1], [this.payload, 2], [this.serial, 3],
        ];
        const output = new Uint8Array(sections.reduce((size, [bytes]) => size + bytes.length, 0));
        let pos = 0;
        for (const [bytes, section] of sections) {
            output.set(section == null ? bytes : SaveFile.cryptData(SaveFile.sectionKey(key, section), bytes), pos);
            pos += bytes.length;
        }

        return output;
    }

    // Helper function
    static arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    /**
     * Reads bits from a byte array, lowest bit first. 32 bits read as a signed number.
     * @param {Uint8Array} data
     * @param {number} pos - bit position: byte * 8 + bit, bit 0 being the lowest
     * @param {number} bits - how many bits to read
     * @returns {number}
     */
    static readBits(data, pos, bits) {
        let value = 0;
        for (let i = 0; i < bits; i++, pos++)
            value |= ((data[pos >> 3] >> (pos & 7)) & 1) << i;
        return value;
    }

    /**
     * Writes bits into a byte array, the inverse of readBits
     * @param {Uint8Array} data
     * @param {number} pos - bit position: byte * 8 + bit, bit 0 being the lowest
     * @param {number} bits - how many bits to write
     * @param {number|boolean} value
     */
    static writeBits(data, pos, bits, value) {
        for (let i = 0; i < bits; i++, pos++) {
            if ((value >>> i) & 1) data[pos >> 3] |= 1 << (pos & 7);
            else data[pos >> 3] &= ~(1 << (pos & 7));
        }
    }

    /**
     * Reads a record laid out as layout (see the tables at the top) from data at offset
     * @param {Object} layout
     * @param {Uint8Array} data
     * @param {number} offset - first byte of the record
     * @param {Object} [into] - object to fill, a new one if not given
     * @returns {Object} into
     */
    static readRecord(layout, data, offset, into = {}) {
        for (const [name, length] of Object.entries(layout.arrays))
            into[name] = new Array(length).fill(0);
        for (const { path, pos, bits } of layout.fields)
            setPath(into, path, SaveFile.readBits(data, offset * 8 + pos, bits));
        for (const [name, byte, length, encoding, clean = (s) => s] of layout.strings) {
            const text = decoders[encoding].decode(data.subarray(offset + byte, offset + byte + length));
            into[name] = clean(text.replace(/\0.*$/, ""));
        }
        return into;
    }

    /**
     * Writes from's values over the record at offset, the inverse of readRecord. Values from doesn't
     * have leave their bits as they are.
     * @param {Object} layout
     * @param {Uint8Array} data
     * @param {number} offset - first byte of the record
     * @param {Object} from
     */
    static writeRecord(layout, data, offset, from) {
        for (const { path, pos, bits } of layout.fields) {
            const value = getPath(from, path);
            if (value != null) SaveFile.writeBits(data, offset * 8 + pos, bits, value);
        }
        for (const [name, byte, length, encoding, clean] of layout.strings)
            SaveFile.writeString(data, offset + byte, length, from[name], encoding, clean);
    }

    // Byte for each character TextDecoder("ascii") (windows-1252) decodes
    static asciiBytes = new Map(
        Array.from({ length: 256 }, (_, b) => [new TextDecoder("ascii").decode(new Uint8Array([b])), b])
    );

    /**
     * Writes a null-terminated string into a fixed-size field. Leaves the field alone when it
     * already reads back as value, so bytes after the terminator survive an unchanged save.
     * @param {Uint8Array} data
     * @param {number} offset - first byte of the field
     * @param {number} length - field size in bytes, including the terminator
     * @param {string} value
     * @param {string} [encoding="utf-8"] - "utf-8" or "ascii", as passed to TextDecoder on load
     * @param {(s: string) => string} [clean] - the clean-up applied on load after the terminator is cut
     */
    static writeString(data, offset, length, value, encoding = "utf-8", clean = s => s) {
        if (value == null) return;

        const field = data.subarray(offset, offset + length);
        const current = decoders[encoding].decode(field).replace(/\0.*$/, "");
        if (clean(current) === value) return;

        const bytes = [];
        const encoder = new TextEncoder();
        for (const char of value) {
            const charBytes = encoding == "utf-8"
                ? encoder.encode(char)
                : [SaveFile.asciiBytes.get(char) ?? 0x3F]; // '?'
            if (bytes.length + charBytes.length > length - 1) break; // keep the null terminator
            bytes.push(...charBytes);
        }
        field.fill(0);
        field.set(bytes);
    }

    /**
     * Skin color as stored: PES 18+ loads a custom skin (7) as 0 and sets b_changed
     * @param {Object} player
     * @returns {number}
     */
    static storedSkinCol(player) {
        return player.b_changed && player.skin_col == 0 ? 7 : player.skin_col;
    }

    /**
     * Team IDs in the three rival slots of a PES 20/21 team entry, leaving out the slots that are off
     * @param {Uint8Array} data
     * @param {number} offset - first byte of the slots
     * @returns {number[]}
     */
    static readRivals(data, offset) {
        return [0, 1, 2].map((i) => SaveFile.readBits(data, (offset + 4 * i) * 8, 32)).filter((r) => r != RIVAL_OFF);
    }

    /**
     * Calls fn for each record in one of a version's lists, with its offset, the ID it starts with
     * and its layout
     * @param {[number, Object]} list - first byte and layout, as in VERSIONS
     * @param {number} countByte - where the number of records is stored
     * @param {(offset: number, id: number, layout: Object) => void} fn
     */
    eachRecord([start, layout], countByte, fn) {
        const count = SaveFile.readBits(this.payload, countByte * 8, 16);
        for (let i = 0; i < count; i++) {
            const offset = start + i * layout.size;
            fn(offset, SaveFile.readBits(this.payload, offset * 8, 32), layout);
        }
    }

    /**
     * Loads players, each also added to the roster of team Math.floor(id / 100)
     */
    loadPlayers() {
        const version = VERSIONS[this.pes];
        this.eachRecord(version.players, version.playerCount, (offset, id, layout) => {
            const player = SaveFile.readRecord(layout, this.payload, offset);
            if (version.noCustomSkin && player.skin_col === 7) {
                player.skin_col = 0;
                player.b_changed = true;
            }
            player.team_id = Math.floor(player.id/100);
            this.players[player.id] = player;
            (this.teams[player.team_id] ??= { roster: [] }).roster.push(player);
        });

        if (version.appearances) this.eachRecord(version.appearances, version.playerCount, (offset, id, layout) => {
            if (this.players[id]) SaveFile.readRecord(layout, this.payload, offset, this.players[id]);
        });
    }

    /**
     * Writes this.players back into the payload, the inverse of loadPlayers.
     * Entries are matched to players by the ID stored in each entry.
     */
    savePlayers() {
        const version = VERSIONS[this.pes];
        this.eachRecord(version.players, version.playerCount, (offset, id, layout) => {
            const player = this.players[id];
            if (player) SaveFile.writeRecord(layout, this.payload, offset,
                version.noCustomSkin ? { ...player, skin_col: SaveFile.storedSkinCol(player) } : player);
        });

        if (version.appearances) this.eachRecord(version.appearances, version.playerCount, (offset, id, layout) => {
            if (this.players[id]) SaveFile.writeRecord(layout, this.payload, offset, this.players[id]);
        });
    }

    /**
     * Loads the teams that have players, with their rosters and tactics
     */
    loadTeams() {
        const version = VERSIONS[this.pes];
        this.eachRecord(version.teams, version.teamCount, (offset, id, layout) => {
            if (!(id in this.teams)) return;
            const team = SaveFile.readRecord(layout, this.payload, offset);
            if (layout.rivals != null) team.rivals = SaveFile.readRivals(this.payload, offset + layout.rivals);
            this.teams[id] = Object.assign(team, this.teams[id]);
        });

        // Teams without players aren't loaded, so their rosters and tactics fill a throwaway object
        this.eachRecord(version.rosters, version.teamCount, (offset, id, layout) => {
            const team = SaveFile.readRecord(layout, this.payload, offset, this.teams[id] ?? { roster: [] });
            team.num_on_team = team.players.filter(Boolean).length;
            team.b_show = team.players[0] != 0; // hide teams with no players
            team.numbers.forEach((num, i) => { if (team.roster[i]) team.roster[i].num = num; });
        });

        this.eachRecord(version.tactics, version.teamCount, (offset, id, layout) => {
            const team = SaveFile.readRecord(layout, this.payload, offset, this.teams[id] ?? { roster: [] });
            if (team.roster[team.captain_ind]) team.roster[team.captain_ind].cap = true;
        });
    }

    /**
     * Writes this.teams back into the payload, the inverse of loadTeams.
     * Entries are matched to teams by the ID stored in each entry.
     */
    saveTeams() {
        const version = VERSIONS[this.pes];
        this.eachRecord(version.teams, version.teamCount, (offset, id, layout) => {
            const team = this.teams[id];
            if (!team) return;
            SaveFile.writeRecord(layout, this.payload, offset, team);

            // Slots that are off were left out on load, so only rewrite the rivals when they changed
            const rivals = offset + layout.rivals;
            if (layout.rivals != null && team.rivals && !SaveFile.arraysEqual(team.rivals, SaveFile.readRivals(this.payload, rivals))) {
                for (let i = 0; i < 3; i++)
                    SaveFile.writeBits(this.payload, (rivals + 4 * i) * 8, 32, team.rivals[i] ?? RIVAL_OFF);
            }
        });

        for (const list of [version.rosters, version.tactics]) this.eachRecord(list, version.teamCount, (offset, id, layout) => {
            if (this.teams[id]) SaveFile.writeRecord(layout, this.payload, offset, this.teams[id]);
        });
    }
}

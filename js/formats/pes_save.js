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

class ParseError extends Error {
    constructor(message) {
        super(message);
        this.name = "ParseError";
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

        const xorBlocks = (a, b) => SaveFile.xor(a, b);
        return xorBlocks(
            xorBlocks(
                xorBlocks(
                    xorBlocks(
                        decryptedSalt.slice(0, 64),
                        decryptedSalt.slice(64, 128)
                    ),
                    decryptedSalt.slice(128, 192)
                ),
                decryptedSalt.slice(192, 256)
            ),
            decryptedSalt.slice(256, 320)
        );
    }

    static playerCountByte = {
        '15': 0x34,
        '16': 0x34,
        '16MyClub': 0x34,
        '17': 0x5c,
        '18': 0x60,
        '19': 0x60,
        '20': 0x60,
        '21': 0x60
    }

    static teamCountByte = {
        '15': 0x38,
        '16': 0x38,
        '16MyClub': 0x38,
        '17': 0x60,
        '18': 0x64,
        '19': 0x64,
        '20': 0x64,
        '21': 0x64
    }

    /**
     * Decrypt 15 save file data from input and store it in SaveFile members
     * @param {Uint8Array} input 
     * @returns 
     */
    decryptFile15(input) {
        //First 49 bytes are the header section, so reduce length by that amount
        const tmpData = input.subarray(49)

        //Data is formatted in 3 chunks, get their sizes
        const chunkSizes = [];

        chunkSizes[0] = 384;
        chunkSizes[1] = SaveFile.readData(0, 4*8, chunkSizes[0], tmpData);
        chunkSizes[2] = SaveFile.readData(0, 4*8, chunkSizes[0] + chunkSizes[1] + 4, tmpData);

        //The decrypt/encrypt algo is initialized from input[0], so save that in descriptor
        const startByte = input[0];//BigInt(input[0]);
        
        //Then do the decryption operation on data, initialized from startByte

        let num = 0;
        let pos = 0;
        for (let chunk = 0; chunk < 3; chunk++) {
            let seed = startByte;
            for (let i = 0; i < chunkSizes[chunk]; i++) {
                num = seed * 21 + 7;
                seed = (num %= 32768);
                let d = tmpData[pos];
                num %= 255;
                d ^= num;
                tmpData[pos] = d;
                pos++;
            }
            pos += 4; //Skip 4 bytes between each chunk
        }

        //Allocate the necessary memory for the data array and copy it from input to the descriptor (starting from byte 49)
        //uint8_t chunk0[384]; //Fixed length "Edit file" string
        //uint8_t chunk1lenBytes[4]; //4 bytes that encode length of chunk 1
        //uint8_t chunk2lenBytes[4]; //4 bytes that encode length of chunk 2

        //Copy each portion of input data to the corresponding structure in descriptor
        let offset = 0;

        this.identifier = tmpData.subarray(offset, offset + chunkSizes[0]);
        offset += chunkSizes[0];

        // skip logo length (4 bytes)
        offset += 4;

        this.logo = tmpData.subarray(offset, offset + chunkSizes[1]);
        offset += chunkSizes[1];

        // skip payload length (4 bytes)
        offset += 4;

        this.payload = tmpData.subarray(offset, offset + chunkSizes[2]);

        this.description = null;
        this.serial = null;

        return true;
    }

    /**
     * Loads data for PES 15
     * @param {Uint8Array} data 
     * @returns {boolean} True if successful, false if not
     */
    load15(data) {
        const header = data.subarray(1, masterKeys["15"].length + 1)
        if(!SaveFile.arraysEqual(header, masterKeys['15'])) {
            return false;
        }

        this.header15 = data.slice(0, 49);

        if(!this.decryptFile15(data)) {
            return false;
        }

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

            header = SaveFile.cryptData(
                SaveFile.xor(key, new Uint8Array([headerSize, 0, 0, 0, 0, 0, 0, 0])),
                data.slice(offset, offset + headerSize)
            );
            
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

        this.description = SaveFile.cryptData(
            SaveFile.xor(key, new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])),
            data.slice(offset, offset + descriptionSize)
        );
        offset += descriptionSize;

        this.logo = SaveFile.cryptData(
            SaveFile.xor(key, new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0])),
            data.slice(offset, offset + logoSize)
        );
        offset += logoSize;

        this.payload = SaveFile.cryptData(
            SaveFile.xor(key, new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0])),
            data.slice(offset, offset + payloadSize)
        );
        offset += payloadSize;

        this.serial = SaveFile.cryptData(
            SaveFile.xor(key, new Uint8Array([3, 0, 0, 0, 0, 0, 0, 0])),
            data.slice(offset, offset + serialSize * 2)
        );

        return true
    }

    /**
     * Loads EDIT00000000 or EDIT.bin files into instanced members
     * @param {File|Blob} file 
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

        //const payloadView = new DataView(this.payload.buffer, this.payload.byteOffset);
        const playerCount = SaveFile.readData(0, 2*8, SaveFile.playerCountByte[this.pes], this.payload, false);//payloadView.getUint16(SaveFile.playerCountByte[this.pes], true);
        const teamCount = SaveFile.readData(0, 2*8, SaveFile.teamCountByte[this.pes], this.payload, false);

        this.loadPlayers(playerCount)
        this.loadTeams(teamCount)

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
     * Encrypts data for PES 15, the inverse of decryptFile15
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

        const output = new Uint8Array(
            salt.length +
            header.length +
            this.description.length +
            this.logo.length +
            this.payload.length +
            this.serial.length
        );

        let pos = 0;
        output.set(salt, pos); pos += salt.length;
        output.set(
            SaveFile.cryptData(
                SaveFile.xor(key, new Uint8Array([headerSize, 0, 0, 0, 0, 0, 0, 0])),
                header
            ),
            pos
        );
        pos += header.length;
        output.set(
            SaveFile.cryptData(
                SaveFile.xor(key, new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])),
                this.description
            ),
            pos
        );
        pos += this.description.length;
        output.set(
            SaveFile.cryptData(
                SaveFile.xor(key, new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0])),
                this.logo
            ),
            pos
        );
        pos += this.logo.length;
        output.set(
            SaveFile.cryptData(
                SaveFile.xor(key, new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0])),
                this.payload
            ),
            pos
        );
        pos += this.payload.length;
        output.set(
            SaveFile.cryptData(
                SaveFile.xor(key, new Uint8Array([3, 0, 0, 0, 0, 0, 0, 0])),
                this.serial
            ),
            pos
        );

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

    static mirrorEnds(input, bitsToRead) {
        const bytes = []
        const numBytes = Math.ceil(bitsToRead/8);
        for(let i = 0; i < numBytes; i++) {
            const shift = i*8;
            bytes.push((input & (0xff << shift)) >> shift);
        }
        let output = 0
        for(const byte of bytes) {
            output = output << 8;
            output |= byte;
        }
        let inStr = input.toString(16)
        const outStr = output.toString(16).padStart(inStr.length, '0')
        inStr = inStr.padStart(outStr.length, '0')
        console.log(`${inStr}\n${outStr}`)
        return output;
    }

    static mirrorBits(input, bitsToRead) {
        let output = 0
        const maxShift = Math.ceil(bitsToRead/2);
        for(let i = 0; i <= maxShift; i++) {
            const shift = bitsToRead - 1 - i
            output |= !!(input & (1 << shift)) << i
            output |= !!(input & (1 << i)) << shift
        }
        /*let inStr = input.toString(2)
        const outStr = output.toString(2).padStart(inStr.length, '0')
        inStr = inStr.padStart(outStr.length, '0')
        console.log(`${inStr}\n${outStr}`)*/
        return output
    }

    /**
     * Reads arbitrary bit fields from a byte array (Uint8Array)
     * @param {number} startBit - bit position in current byte (0-7)
     * @param {number} bitsToRead - how many bits we want to extract
     * @param {{ value: number }} currentByte - object containing current byte index (passed by reference simulation)
     * @param {Uint8Array} data - the raw data buffer
     * @param {boolean} [littleEndian=false] 
     * @returns {number} extracted value
     */
    static readData(startBit, bitsToRead, currentByte, data, littleEndian = false) {
        let output = 0;
        let bit = startBit;
        let bytesAdvanced = 0;

        if(typeof currentByte == 'number')
            currentByte = { value: currentByte }

        for (let i = 0; i < bitsToRead; i++) {
            if (bit === 8) {
                bit = 0;
                currentByte.value++;
            }

            const byteIndex = currentByte.value;
            const currentByteValue = data[byteIndex] ?? 0;

            // How many positions we need to shift right in current byte
            const shiftInByte = bit - (i % 8);

            let bitsFromThisByte;

            if (shiftInByte >= 0) {
                // Normal case - bits are still inside current byte
                bitsFromThisByte = (currentByteValue >> shiftInByte) & (1 << (i % 8));
            } else {
                // We need bits from next byte(s) - very rare in this format
                bitsFromThisByte = (currentByteValue << -shiftInByte) & (1 << (i % 8));
            }

            output |= bitsFromThisByte << (bytesAdvanced * 8);

            if ((i + 1) % 8 === 0 && i > 0) {
                bytesAdvanced++;
            }

            bit++;
        }

        if(littleEndian) {
            const temp = output;
            output = 0
            let maxShift = Math.ceil(bitsToRead/2);
            for(let i = 0; i <= maxShift; i++) {
                const shift = bitsToRead - 1 - i
                output |= !!(temp & (1 << shift)) << i
            }
            for(let i = 0; i < maxShift; i++) {
                const shift = bitsToRead - 1 - i
                output |= !!(temp & (1 << i)) << shift
            }
        }

        // Final alignment - move to next byte if we finished exactly at byte boundary
        if (bit === 8) {
            currentByte.value++;
        }

        return output;
    }

    /**
     * Writes arbitrary bit fields into a byte array (Uint8Array), the inverse of readData.
     * Moves through the data exactly like readData, so the same arguments land on the same bits.
     * @param {number} startBit - bit position in current byte (0-7)
     * @param {number} bitsToWrite - how many bits we want to store
     * @param {{ value: number }|number} currentByte - object containing current byte index (passed by reference simulation)
     * @param {Uint8Array} data - the raw data buffer
     * @param {number|boolean} value - value to store; null/undefined leaves the bits as they are
     * @param {boolean} [littleEndian=false]
     */
    static writeData(startBit, bitsToWrite, currentByte, data, value, littleEndian = false) {
        let bit = startBit;

        if(typeof currentByte == 'number')
            currentByte = { value: currentByte }

        if(value != null && littleEndian)
            value = SaveFile.mirrorBits(value, bitsToWrite)

        for (let i = 0; i < bitsToWrite; i++) {
            if (bit === 8) {
                bit = 0;
                currentByte.value++;
            }

            if (value != null) {
                if ((value >>> i) & 1)
                    data[currentByte.value] |= 1 << bit;
                else
                    data[currentByte.value] &= ~(1 << bit);
            }

            bit++;
        }

        // Final alignment - move to next byte if we finished exactly at byte boundary
        if (bit === 8) {
            currentByte.value++;
        }
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
        const current = new TextDecoder(encoding).decode(field).replace(/\0.*$/, "");
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
     * Skin colour as stored: PES 18+ loads a custom skin (7) as 0 and sets b_changed
     * @param {Object} player
     * @returns {number}
     */
    static storedSkinCol(player) {
        return player.b_changed && player.skin_col == 0 ? 7 : player.skin_col;
    }

    /**
     * Reads core player attributes and identification (PES 2015 format)
     * Total block size appears to be 0x70 bytes
     *
     * @param {{ value: number }} currentByte - mutable byte position
     * @param {Uint8Array} data - raw binary data buffer
     * @returns {Object} Player object
     */
    static readPlayerEntry15(currentByte, data) {
        const read = (startBit, bitCount) => SaveFile.readData(startBit, bitCount, currentByte, data);

        const player = {};

        player.id = read(0, 4*8);                // 0x00–0x03

        currentByte.value += 0x6;            // Commentary name + Unknown A

        player.nation = read(0, 2*8);            // 0x0A

        player.height = data[currentByte.value++]; // 0x0C (byte)
        player.weight = data[currentByte.value++]; // 0x0D (byte)
        player.gc1    = data[currentByte.value++]; // 0x0E (byte)
        player.gc2    = data[currentByte.value++]; // 0x0F (byte)

        player.atk       = read(0, 7);          // 0x10
        player.def       = read(7, 7);          // 0x10:7

        player.gk        = read(6, 7);          // 0x11:6
        currentByte.value++;                 // Unknown B (0x12:5 – 1 byte skip)

        player.mo_fk     = read(4, 4);          // 0x13:4
        player.ball_ctrl = read(0, 7);          // 0x14
        player.finish    = read(7, 7);          // 0x14:7
        player.lowpass   = read(6, 7);
        player.loftpass  = read(5, 7);          // 0x16:5
        player.weak_acc  = read(4, 2);          // 0x17:4

        player.b_edit_player = read(7, 1);      // 0x17:7

        player.place_kick = read(0, 7);         // 0x18
        player.swerve     = read(7, 7);         // Curl
        player.catching   = read(6, 7);         // Saving (GK)
        player.speed      = read(5, 7);
        player.form       = read(4, 3);         // 0x1B:4

        currentByte.value++;                 // Unknown D (0x1B:7 – 1 byte)

        player.exp_pwr   = read(0, 7);          // Acceleration 0x1C:0
        player.jump      = read(7, 7);          // 0x1C:7
        player.stamina   = read(6, 7);          // 0x1D:6
        player.age       = read(5, 6);          // 0x1E:5
        player.reg_pos   = read(3, 4);          // 0x1F:3

        currentByte.value++;                 // Unknown E (0x1F:7 – 1 byte)

        player.play_style = read(0, 5);         // 0x20:0
        player.drib       = read(5, 7);         // 0x20:5
        player.header     = read(4, 7);         // 0x21:4
        player.body_ctrl  = read(3, 7);         // Balance 0x22:3
        player.injury     = read(2, 2);         // 0x23:2

        player.mo_armd    = read(5, 3);         // 0x23:5
        player.mo_armr    = read(0, 3);         // 0x24:0
        player.mo_ck      = read(3, 3);
        player.weak_use   = read(6, 2);         // 0x24:6

        // Playing positions (13 × 2 bits)
        player.play_pos = new Array(13).fill(0);
        player.play_pos[0]  = read(0, 2);       // CF     0x25:0
        player.play_pos[1]  = read(2, 2);
        player.play_pos[2]  = read(4, 2);
        player.play_pos[3]  = read(6, 2);
        player.play_pos[4]  = read(0, 2);
        player.play_pos[5]  = read(2, 2);
        player.play_pos[6]  = read(4, 2);
        player.play_pos[7]  = read(6, 2);
        player.play_pos[8]  = read(0, 2);
        player.play_pos[9]  = read(2, 2);
        player.play_pos[10] = read(4, 2);
        player.play_pos[11] = read(6, 2);
        player.play_pos[12] = read(0, 2);       // GK     0x28:0

        player.mo_hunchd = read(2, 2);          // 0x28:2
        player.mo_hunchr = read(4, 2);          // 0x28:4
        player.mo_pk     = read(6, 2);          // 0x28:6

        player.ball_win  = read(0, 7);          // 0x29:0
        player.kick_pwr  = read(7, 7);          // 0x29:7

        currentByte.value++;                 // Unknown G (2 bits + padding?)

        player.b_base_copy    = read(2, 1);     // 0x2B:2
        player.b_edit_basicset = read(3, 1);    // 0x2B:3

        currentByte.value++;                 // Unknown H (6 bits remaining in byte)

        player.strong_foot = read(2, 1);        // 0x2C:2

        player.com_style = new Array(7).fill(0);
        player.com_style[0] = read(3, 1);       // 0x2C:3
        player.com_style[1] = read(4, 1);
        player.com_style[2] = read(5, 1);
        player.com_style[3] = read(6, 1);
        player.com_style[4] = read(7, 1);
        player.com_style[5] = read(0, 1);
        player.com_style[6] = read(1, 1);       // 0x2D:1

        player.play_skill = new Array(28).fill(0);  // PES 2015 has ~28 active skills
        player.play_skill[0]  = read(2, 1);     // 0x2D:2
        player.play_skill[1]  = read(3, 1);
        player.play_skill[2]  = read(4, 1);
        player.play_skill[3]  = read(5, 1);
        player.play_skill[4]  = read(6, 1);
        player.play_skill[5]  = read(7, 1);
        player.play_skill[7]  = read(0, 1);
        player.play_skill[8]  = read(1, 1);
        player.play_skill[9]  = read(2, 1);
        player.play_skill[11] = read(3, 1);
        player.play_skill[12] = read(4, 1);
        player.play_skill[13] = read(5, 1);
        player.play_skill[14] = read(6, 1);
        player.play_skill[15] = read(7, 1);
        player.play_skill[18] = read(0, 1);
        player.play_skill[19] = read(1, 1);
        player.play_skill[20] = read(2, 1);
        player.play_skill[22] = read(3, 1);
        player.play_skill[23] = read(4, 1);
        player.play_skill[25] = read(5, 1);
        player.play_skill[26] = read(6, 1);
        player.play_skill[27] = read(7, 1);     // 0x2F:7

        // Name (UTF-8, max ~45 chars + null)
        const nameBytes = data.subarray(currentByte.value, currentByte.value + 46);
        player.name = new TextDecoder("utf-8").decode(nameBytes).replace(/\0.*$/, "");
        currentByte.value += 0x2E;           // 46 bytes

        // Shirt name (max 17 chars + null)
        const shirtBytes = data.subarray(currentByte.value, currentByte.value + 18);
        player.shirt_name = new TextDecoder("ascii").decode(shirtBytes).replace(/\0.*$/, "").trim();
        currentByte.value += 0x12;           // 18 bytes

        // Total block ≈ 0x70 bytes

        return player;
    }

    /**
     * Reads and fills appearance data for a PES 2015 player.
     * Uses a pre-built map of player ID → starting byte offset.
     *
     * @param {Object[]} players - player entry objects (must already have .id set)
     * @param {{ value: number }} currentByte - mutable byte position (simulates int&)
     * @param {Uint8Array} data - raw binary data buffer
     * @returns {boolean} true if appearance was loaded, false if no entry found for this player ID
     */
    static readAppearanceEntry15(players, currentByte, data) {
        const read = (startBit, bitCount) =>
            SaveFile.readData(startBit, bitCount, currentByte, data);

        const checkId = read(0, 32);
        const player = players[checkId]
        // Verify this appearance block belongs to a known player
        if (!player) {
            return false;
        }

        player.b_edit_face   = read(0, 1);
        player.b_edit_hair   = read(1, 1);
        player.b_edit_phys   = read(2, 1);
        player.b_edit_strip  = read(3, 1);

        player.boot_id       = read(4, 14);
        player.glove_id      = read(2, 14); 

        player.copy_id       = read(0, 32);

        // Body proportions ─ all 4-bit values, two per byte
        player.neck_len      = read(0, 4);
        player.neck_size     = read(4, 4);
        player.shldr_hi      = read(0, 4);
        player.shldr_wid     = read(4, 4);
        player.chest         = read(0, 4);
        player.waist         = read(4, 4);
        player.arm_size      = read(0, 4);
        player.arm_len       = read(4, 4);
        player.thigh         = read(0, 4);
        player.calf          = read(4, 4);
        player.leg_len       = read(0, 4);
        player.head_len      = read(4, 4);
        player.head_wid      = read(0, 4);
        player.head_dep      = read(4, 4);

        // Kit & accessory details
        player.wrist_col_l   = read(0, 3);
        player.wrist_col_r   = read(3, 3);
        player.wrist_tape    = read(6, 2);
        player.spec_col      = read(0, 3);
        player.spec_style    = read(3, 3);
        player.sleeve        = read(6, 2);
        player.inners        = read(0, 2);
        player.socks         = read(2, 2);
        player.undershorts   = read(4, 2);
        player.untucked      = read(6, 1);
        player.ankle_tape    = read(7, 1);

        player.gloves        = read(0, 1);
        player.gloves_col    = read(1, 3);

        // Unknown D ─ 1 byte
        currentByte.value += 1;

       // Unknown E ─ 22 bytes
        currentByte.value += 22;

        player.skin_col      = read(0, 3);

        // Unknown F ─ 1 byte
        currentByte.value += 1;

        // Unknown G ─ 18 bytes
        currentByte.value += 18;

        player.iris_col      = read(0, 4);

        // Unknown H ─ 1 byte
        currentByte.value += 1;

        // Unknown I ─ only 3 bytes in PES 2015
        currentByte.value += 3;

        // Total block size after the 4-byte PID = 0x44 bytes (68 decimal)

        return true;
    }

    /**
     * Fills player entry structure for PES 2016-style bit-packed format
     * @param {Object} player - player entry object to fill
     * @param {{ value: number }} currentByte - mutable byte position (simulates int&)
     * @param {Uint8Array} data - raw binary player data buffer
     */
    static readPlayerEntry16(currentByte, data) {
        const read = (startBit, bitCount) => SaveFile.readData(startBit, bitCount, currentByte, data);
        const player = {}

        player.id = read(0, 32);           // 4 bytes
        currentByte.value += 0x6;       // Skip 6 bytes (unknown/padding in 2016 format)

        player.nation    = read(0, 16);
        player.height    = read(0,  8);
        player.weight    = read(0,  8);
        player.gc1       = read(0,  8);
        player.gc2       = read(0,  8);

        player.atk       = read(0, 7);
        player.def       = read(7, 7);
        player.gk        = read(6, 7);     // GK Awareness
        player.drib      = read(5, 7);
        player.mo_fk     = read(4, 4);     // Free Kick

        player.finish    = read(0, 7);
        player.lowpass   = read(7, 7);
        player.loftpass  = read(6, 7);
        player.header    = read(5, 7);
        player.form      = read(4, 3);
        player.b_edit_player = read(7, 1);

        player.swerve    = read(0, 7);     // Curl
        player.catching  = read(7, 7);
        player.clearing  = read(6, 7);
        player.reflex    = read(5, 7);
        player.injury    = read(4, 2);

        // Unknown B - 1 bit skipped implicitly by next read starting at 7

        player.b_edit_basicset = read(7, 1);
        player.body_ctrl = read(0, 7);     // Balance

        player.kick_pwr  = read(7, 7);
        player.exp_pwr   = read(6, 7);     // Acceleration
        player.jump      = read(5, 7);
        player.mo_armd   = read(4, 3);     // Arm diversity left?

        player.b_edit_regpos = read(7, 1);
        player.reg_pos   = read(0, 4);

        // Unknown C - 1 bit skipped

        player.play_style = read(5, 5);
        player.ball_ctrl  = read(2, 7);
        player.ball_win   = read(1, 7);
        player.cover      = read(0, 7);    // GK Reach

        player.b_edit_playpos = read(7, 1);

        player.mo_armr = read(0, 3);
        player.mo_ck   = read(3, 3);       // Corner Kick
        player.weak_acc = read(6, 2);
        player.weak_use = read(0, 2);

        // Playing positions – 13 positions × 2 bits each
        player.play_pos = new Array(13).fill(0);
        player.play_pos[0] = read(2, 2);   // CF
        player.play_pos[1] = read(4, 2);   // SS
        player.play_pos[2] = read(6, 2);   // LWF
        player.play_pos[3] = read(0, 2);   // RWF
        player.play_pos[4] = read(2, 2);   // AMF
        player.play_pos[5] = read(4, 2);   // DMF
        player.play_pos[6] = read(6, 2);   // CMF
        player.play_pos[7] = read(0, 2);   // LMF
        player.play_pos[8] = read(2, 2);   // RMF
        player.play_pos[9] = read(4, 2);   // CB
        player.play_pos[10]= read(6, 2);   // LB
        player.play_pos[11]= read(0, 2);   // RB
        player.play_pos[12]= read(2, 2);   // GK

        player.mo_hunchd = read(4, 2);     // Heading (dive?)
        player.mo_hunchr = read(6, 2);
        player.mo_pk     = read(0, 2);     // Penalty Kick

        player.place_kick = read(2, 7);
        player.speed      = read(1, 7);
        player.age        = read(0, 6);

        player.b_edit_ability = read(6, 1);
        player.b_edit_skill   = read(7, 1);

        player.stamina = read(0, 7);

        player.b_edit_style = read(7, 1);
        player.b_edit_com   = read(0, 1);
        player.b_edit_motion= read(1, 1);

        // Unknown D - 1 bit skipped

        player.b_base_copy = read(3, 1);
        player.strong_foot = read(4, 1);

        // COM playing styles – 7 flags
        player.com_style = new Array(7).fill(0);
        player.com_style[0] = read(5, 1);
        player.com_style[1] = read(6, 1);
        player.com_style[2] = read(7, 1);
        player.com_style[3] = read(0, 1);
        player.com_style[4] = read(1, 1);
        player.com_style[5] = read(2, 1);
        player.com_style[6] = read(3, 1);

        // Player skills – 28 skills in PES 2016 (1 bit each)
        player.play_skill = new Array(28).fill(0);
        player.play_skill[0]  = read(4, 1);   // Scissors Feint
        player.play_skill[1]  = read(5, 1);   // Flip Flap
        player.play_skill[2]  = read(6, 1);   // Marseille Turn
        player.play_skill[3]  = read(7, 1);   // Sombrero
        player.play_skill[4]  = read(0, 1);   // Cut Behind & Turn
        player.play_skill[5]  = read(1, 1);   // Scotch Move ?
        player.play_skill[6]  = read(2, 1);   // Heading
        player.play_skill[7]  = read(3, 1);   // Long Range Drive
        player.play_skill[8]  = read(4, 1);   // Knuckle Shot ?
        player.play_skill[9]  = read(5, 1);   // Dipping Shot ?
        player.play_skill[10] = read(6, 1);   // Acrobatic Finishing
        player.play_skill[11] = read(7, 1);   // Heel Trick
        player.play_skill[12] = read(0, 1);   // First-time Shot
        player.play_skill[13] = read(1, 1);   // One-touch Pass
        player.play_skill[14] = read(2, 1);   // Weighted Pass
        player.play_skill[15] = read(3, 1);   // Pinpoint Crossing
        player.play_skill[16] = read(4, 1);   // Outside Curler
        player.play_skill[17] = read(5, 1);   // Rabona ?
        player.play_skill[18] = read(6, 1);   // Low Lofted Pass
        player.play_skill[19] = read(7, 1);   // Long Throw
        player.play_skill[20] = read(0, 1);   // GK Long Throw ?
        player.play_skill[21] = read(1, 1);   // Malicia ?
        player.play_skill[22] = read(2, 1);   // Man Marking
        player.play_skill[23] = read(3, 1);   // Track Back
        player.play_skill[24] = read(4, 1);   // Acrobatic Clear ?
        player.play_skill[25] = read(5, 1);   // Captaincy ?
        player.play_skill[26] = read(6, 1);   // Super-sub ?
        player.play_skill[27] = read(7, 1);   // Fighting Spirit

        // Name – UTF-8, max ~45 chars + null
        const nameBytes = data.subarray(currentByte.value, currentByte.value + 46);
        player.name = new TextDecoder("utf-8").decode(nameBytes).replace(/\0.*$/, "");
        currentByte.value += 46;

        // Shirt name – usually 15 chars + null
        const shirtBytes = data.subarray(currentByte.value, currentByte.value + 16);
        player.shirt_name = new TextDecoder("ascii").decode(shirtBytes).replace(/\0.*$/, "").trim();
        currentByte.value += 16;

        return player;
    }

    /**
     * Fills appearance-related fields for a PES 2016 player entry
     * @param {Object []} players - player entry objects (must already have .id set)
     * @param {{ value: number }} currentByte - mutable byte position (simulates int&)
     * @param {Uint8Array} data - raw binary data buffer
     * @returns {boolean} true if appearance was filled, false if player ID mismatch
     */
    static readAppearanceEntry16(players, currentByte, data) {
        const read = (startBit, bitCount) => SaveFile.readData(startBit, bitCount, currentByte, data);

        const checkId = read(0, 32);
        const player = players[checkId]
        // Verify this appearance block belongs to a known player
        if (!player) {
            return false;
        } 

        player.b_edit_face   = read(0, 1);
        player.b_edit_hair   = read(1, 1);
        player.b_edit_phys   = read(2, 1);
        player.b_edit_strip  = read(3, 1);

        player.boot_id       = read(4, 14);
        player.glove_id      = read(2, 14);  // Extended to 14 bits using extra space

        player.copy_id       = read(0, 32);

        // Body proportions (all 4-bit values, packed two per byte)
        player.neck_len      = read(0, 4);
        player.neck_size     = read(4, 4);
        player.shldr_hi      = read(0, 4);
        player.shldr_wid     = read(4, 4);
        player.chest         = read(0, 4);
        player.waist         = read(4, 4);
        player.arm_size      = read(0, 4);
        player.arm_len       = read(4, 4);
        player.thigh         = read(0, 4);
        player.calf          = read(4, 4);
        player.leg_len       = read(0, 4);
        player.head_len      = read(4, 4);
        player.head_wid      = read(0, 4);
        player.head_dep      = read(4, 4);

        // Accessories & kit details
        player.wrist_col_l   = read(0, 3);
        player.wrist_col_r   = read(3, 3);
        player.wrist_tape    = read(6, 2);
        player.spec_col      = read(0, 3);
        player.spec_style    = read(3, 3);
        player.sleeve        = read(6, 2);
        player.inners        = read(0, 2);
        player.socks         = read(2, 2);
        player.undershorts   = read(4, 2);
        player.untucked      = read(6, 1);
        player.ankle_tape    = read(7, 1);

        player.gloves        = read(0, 1);
        player.gloves_col    = read(1, 3);

        // Unknown D – single byte
        currentByte.value += 1;

        // Unknown E – 22 bytes
        currentByte.value += 22;

        player.skin_col      = read(0, 3);

        // Unknown F – 1 byte
        currentByte.value += 1;

        // Unknown G – 18 bytes
        currentByte.value += 18;

        player.iris_col      = read(0, 4);

        // Unknown H – 1 byte
        currentByte.value += 1;

        // Unknown I – 7 bytes
        currentByte.value += 7;

        return true;
    }

    /**
     * Fills player entry – PES 2017 style (includes appearance block at the end)
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     */
    static readPlayerEntry17(currentByte, data) {
        const read = (startBit, bits) => SaveFile.readData(startBit, bits, currentByte, data);

        const player = {}

        player.id = read(0, 32);
        currentByte.value += 0x6;

        player.nation = read(0, 16);

        player.height = data[currentByte.value++];
        player.gc2    = data[currentByte.value++];
        player.weight = data[currentByte.value++];
        player.gc1    = data[currentByte.value++];

        player.atk       = read(0, 7);
        player.def       = read(7, 7);
        player.gk        = read(6, 7);
        player.drib      = read(5, 7);
        player.mo_fk     = read(4, 4);

        player.finish    = read(0, 7);
        player.lowpass   = read(7, 7);
        player.loftpass  = read(6, 7);
        player.header    = read(5, 7);
        player.form      = read(4, 3);
        player.b_edit_player = read(7, 1);

        player.swerve    = read(0, 7);
        player.catching  = read(7, 7);
        player.clearing  = read(6, 7);
        player.reflex    = read(5, 7);
        player.injury    = read(4, 2);

        // Unknown B - 1 bit (implicitly skipped)

        player.b_edit_basicset = read(7, 1);
        player.body_ctrl = read(0, 7);
        player.phys_cont = read(7, 7);
        player.kick_pwr  = read(6, 7);
        player.exp_pwr   = read(5, 7);
        player.mo_armd   = read(4, 3);

        player.b_edit_regpos = read(7, 1);
        player.age       = read(0, 6);
        player.reg_pos   = read(6, 4);

        // Unknown C - 1 bit

        player.play_style = read(3, 5);
        player.ball_ctrl  = read(0, 7);
        player.ball_win   = read(7, 7);
        player.weak_acc   = read(6, 2);
        player.jump       = read(0, 7);
        player.mo_armr    = read(7, 3);
        player.mo_ck      = read(2, 3);
        player.cover      = read(5, 7);
        player.weak_use   = read(4, 2);

        player.play_pos = new Array(13).fill(0);
        player.play_pos[0]  = read(6, 2);   // CF?
        player.play_pos[1]  = read(0, 2);
        player.play_pos[2]  = read(2, 2);
        player.play_pos[3]  = read(4, 2);
        player.play_pos[4]  = read(6, 2);
        player.play_pos[5]  = read(0, 2);
        player.play_pos[6]  = read(2, 2);
        player.play_pos[7]  = read(4, 2);
        player.play_pos[8]  = read(6, 2);
        player.play_pos[9]  = read(0, 2);   // CB?
        player.play_pos[10] = read(2, 2);   // LB?
        player.play_pos[11] = read(4, 2);   // RB?
        player.play_pos[12] = read(6, 2);   // GK

        player.mo_hunchd = read(0, 2);
        player.mo_hunchr = read(2, 2);
        player.mo_pk     = read(4, 2);

        player.place_kick = read(6, 7);

        player.b_edit_playpos  = read(5, 1);
        player.b_edit_ability  = read(6, 1);
        player.b_edit_skill    = read(7, 1);

        player.stamina = read(0, 7);
        player.speed   = read(7, 7);

        player.b_edit_style = read(6, 1);
        player.b_edit_com   = read(7, 1);
        player.b_edit_motion = read(0, 1);
        player.b_base_copy   = read(1, 1);

        // Unknown D - 1 bit

        player.strong_foot = read(3, 1);

        // Unknown E - 1 bit

        player.com_style = new Array(7).fill(0);
        player.com_style[0] = read(5, 1);
        player.com_style[1] = read(6, 1);
        player.com_style[2] = read(7, 1);
        player.com_style[3] = read(0, 1);
        player.com_style[4] = read(1, 1);
        player.com_style[5] = read(2, 1);
        player.com_style[6] = read(3, 1);

        player.play_skill = new Array(28).fill(0);
        player.play_skill[0]  = read(4, 1);
        player.play_skill[1]  = read(5, 1);
        player.play_skill[2]  = read(6, 1);
        player.play_skill[3]  = read(7, 1);
        player.play_skill[4]  = read(0, 1);
        player.play_skill[5]  = read(1, 1);
        player.play_skill[6]  = read(2, 1);
        player.play_skill[7]  = read(3, 1);
        player.play_skill[8]  = read(4, 1);
        player.play_skill[9]  = read(5, 1);
        player.play_skill[10] = read(6, 1);
        player.play_skill[11] = read(7, 1);
        player.play_skill[12] = read(0, 1);
        player.play_skill[13] = read(1, 1);
        player.play_skill[14] = read(2, 1);
        player.play_skill[15] = read(3, 1);
        player.play_skill[16] = read(4, 1);
        player.play_skill[17] = read(5, 1);
        player.play_skill[18] = read(6, 1);
        player.play_skill[19] = read(7, 1);
        player.play_skill[20] = read(0, 1);
        player.play_skill[21] = read(1, 1);
        player.play_skill[22] = read(2, 1);
        player.play_skill[23] = read(3, 1);
        player.play_skill[24] = read(4, 1);
        player.play_skill[25] = read(5, 1);
        player.play_skill[26] = read(6, 1);
        player.play_skill[27] = read(7, 1);

        // Unknown F - full byte
        currentByte.value++;

        // Name
        const nameBytes = data.subarray(currentByte.value, currentByte.value + 46);
        player.name = new TextDecoder("utf-8").decode(nameBytes).replace(/\0.*$/, "");
        currentByte.value += 46;

        // Shirt name
        const shirtBytes = data.subarray(currentByte.value, currentByte.value + 18);
        player.shirt_name = new TextDecoder("ascii").decode(shirtBytes).replace(/\0.*$/, "").trim();
        currentByte.value += 18;

        // ────────────────────────────────────────────────
        // Appearance block starts here (same structure as 2016)
        // ────────────────────────────────────────────────

        currentByte.value += 4;  // playerID (32-bit)

        player.b_edit_face  = read(0, 1);
        player.b_edit_hair  = read(1, 1);
        player.b_edit_phys  = read(2, 1);
        player.b_edit_strip = read(3, 1);

        player.boot_id   = read(4, 14);
        player.glove_id  = read(2, 14);

        player.copy_id   = read(0, 32);

        player.neck_len  = read(0, 4);
        player.neck_size = read(4, 4);
        player.shldr_hi  = read(0, 4);
        player.shldr_wid = read(4, 4);
        player.chest     = read(0, 4);
        player.waist     = read(4, 4);
        player.arm_size  = read(0, 4);
        player.arm_len   = read(4, 4);
        player.thigh     = read(0, 4);
        player.calf      = read(4, 4);
        player.leg_len   = read(0, 4);
        player.head_len  = read(4, 4);
        player.head_wid  = read(0, 4);
        player.head_dep  = read(4, 4);

        player.wrist_col_l = read(0, 3);
        player.wrist_col_r = read(3, 3);
        player.wrist_tape  = read(6, 2);
        player.spec_col    = read(0, 3);
        player.spec_style  = read(3, 3);
        player.sleeve      = read(6, 2);
        player.inners      = read(0, 2);
        player.socks       = read(2, 2);
        player.undershorts = read(4, 2);
        player.untucked    = read(6, 1);
        player.ankle_tape  = read(7, 1);

        player.gloves     = read(0, 1);
        player.gloves_col = read(1, 3);

        currentByte.value++;     // Unknown D
        currentByte.value += 22; // Unknown E

        player.skin_col = read(0, 3);

        currentByte.value++;     // Unknown F
        currentByte.value += 18; // Unknown G

        player.iris_col = read(0, 4);

        currentByte.value++;     // Unknown H
        currentByte.value += 7;  // Unknown I

        return player;
    }

    /**
     * Fills player entry – PES 2018 style (manual bit extraction, appearance included)
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     */
    static readPlayerEntry18(currentByte, data) {
        let pos = currentByte.value;

        const player = {};

        // ID – little-endian 32-bit
        player.id = data[pos] +
                    (data[pos+1] << 8) +
                    (data[pos+2] << 16) +
                    (data[pos+3] << 24);
        pos += 4;

        pos += 6;  // skip 0x6 bytes

        // Nation – 16-bit little-endian
        player.nation = data[pos] + (data[pos+1] << 8);
        pos += 2;

        player.height = data[pos++]; 
        player.weight = data[pos++];
        player.gc1    = data[pos++];
        player.gc2    = data[pos++];

        // ────────────────────────────────────────────────
        // Stats – many use cross-byte 7-bit values
        // ────────────────────────────────────────────────

        player.atk  = data[pos] & 127;

        player.def  = data[pos] >> 7;
        pos++;
        player.def += (data[pos] << 1) & 127;

        player.gk   = data[pos] >> 6;
        pos++;
        player.gk  += (data[pos] << 2) & 127;

        player.drib = data[pos] >> 5;
        pos++;
        player.drib += (data[pos] << 3) & 127;

        player.mo_fk = data[pos] >> 4;
        pos++;

        player.finish   = data[pos] & 127;

        player.lowpass  = data[pos] >> 7;
        pos++;
        player.lowpass += (data[pos] << 1) & 127;

        player.loftpass = data[pos] >> 6;
        pos++;
        player.loftpass += (data[pos] << 2) & 127;

        player.header = data[pos] >> 5;
        pos++;
        player.header += (data[pos] << 3) & 127;

        player.form       = (data[pos] >> 4) & 7;

        player.b_edit_player = data[pos] >> 7;
        pos++;

        player.swerve   = data[pos] & 127;

        player.catching = data[pos] >> 7;
        pos++;
        player.catching += (data[pos] << 1) & 127;

        player.clearing = data[pos] >> 6;
        pos++;
        player.clearing += (data[pos] << 2) & 127;

        player.reflex = data[pos] >> 5;
        pos++;
        player.reflex += (data[pos] << 3) & 127;

        player.injury = (data[pos] >> 4) & 3;

        // Unknown B – 1 bit (skipped)

        player.b_edit_basicset = data[pos] >> 7;
        pos++;

        player.body_ctrl = data[pos] & 127;

        player.phys_cont = data[pos] >> 7;
        pos++;
        player.phys_cont += (data[pos] << 1) & 127;

        player.kick_pwr = data[pos] >> 6;
        pos++;
        player.kick_pwr += (data[pos] << 2) & 127;

        player.exp_pwr = data[pos] >> 5;
        pos++;
        player.exp_pwr += (data[pos] << 3) & 127;

        // ────────────────────────────────────────────────
        // From here – structure changed compared to 2017
        // ────────────────────────────────────────────────

        //Unknown motion - 3 bits (pDescriptorNew->data[current_byte] >> 4) & 7;

        player.b_edit_regpos = data[pos] >> 7;
        pos++;

        player.age     = data[pos] & 63;

        player.reg_pos = data[pos] >> 6;
        pos++;
        player.reg_pos += (data[pos] << 2) & 12;

        player.play_style = data[pos] >> 3;
        pos++;

        player.ball_ctrl = data[pos] & 127;

        player.ball_win  = data[pos] >> 7;
        pos++;
        player.ball_win += (data[pos] << 1) & 127;

        player.weak_acc = data[pos] >> 6;
        pos++;

        player.jump    = data[pos] & 127;

        player.mo_armd = data[pos] >> 7;
        pos++;
        player.mo_armd += (data[pos] << 1) & 3;

        player.mo_armr  = (data[pos] >> 2) & 7;

        player.mo_ck = data[pos] >> 5;
        pos++;

        player.cover    = data[pos] & 127;

        player.weak_use = data[pos] >> 7;
        pos++;
        player.weak_use += (data[pos] << 1) & 3;

        player.play_pos = new Array(13).fill(0);
        player.play_pos[0] = (data[pos] >> 1) & 3;
        player.play_pos[1] = (data[pos] >> 3) & 3;
        player.play_pos[2] = (data[pos] >> 5) & 3;
        player.b_edit_playpos = data[pos] >> 7;
        pos++;

        player.play_pos[4] =  data[pos]       & 3;
        player.play_pos[5] = (data[pos] >> 2) & 3;
        player.play_pos[6] = (data[pos] >> 4) & 3;
        player.play_pos[7] = (data[pos] >> 6) & 3;
        pos++;

        player.play_pos[8]  =  data[pos]       & 3;
        player.play_pos[9]  = (data[pos] >> 2) & 3;
        player.play_pos[10] = (data[pos] >> 4) & 3;
        player.play_pos[11] = (data[pos] >> 6) & 3;
        pos++;

        player.play_pos[12] =  data[pos]       & 3;

        player.mo_hunchd    = (data[pos] >> 2) & 3;
        player.mo_hunchr    = (data[pos] >> 4) & 3;

        player.mo_pk        = (data[pos] >> 6) & 3;
        pos++;

        player.place_kick = data[pos] & 127;
        player.b_edit_ability = data[pos] >> 7;
        pos++;

        player.stamina    = data[pos] & 127;
        player.play_pos[3] = data[pos] >> 7;
        pos++;
        player.play_pos[3] += (data[pos] << 1) & 3;

        player.speed = data[pos] >> 1;
        pos++;

        player.b_edit_skill   =  data[pos]       & 1;
        player.b_edit_style   = (data[pos] >> 1) & 1;
        player.b_edit_com     = (data[pos] >> 2) & 1;
        player.b_edit_motion  = (data[pos] >> 3) & 1;
        player.b_base_copy    = (data[pos] >> 4) & 1;
        player.strong_foot    = (data[pos] >> 6) & 1;
        pos++;

        player.com_style = new Array(7).fill(0);
        player.com_style[0] =  data[pos]       & 1;
        player.com_style[1] = (data[pos] >> 1) & 1;
        player.com_style[2] = (data[pos] >> 2) & 1;
        player.com_style[3] = (data[pos] >> 3) & 1;
        player.com_style[4] = (data[pos] >> 4) & 1;
        player.com_style[5] = (data[pos] >> 5) & 1;
        player.com_style[6] = (data[pos] >> 6) & 1;

        player.play_skill = new Array(27).fill(0)
        player.play_skill[0] = (data[pos] >> 7) & 1;
        pos++;

        player.play_skill[1]  =  data[pos]       & 1;
        player.play_skill[2]  = (data[pos] >> 1) & 1;
        player.play_skill[3]  = (data[pos] >> 2) & 1;
        player.play_skill[4]  = (data[pos] >> 3) & 1;
        player.play_skill[5]  = (data[pos] >> 4) & 1;
        player.play_skill[6]  = (data[pos] >> 5) & 1;
        player.play_skill[7]  = (data[pos] >> 6) & 1;
        player.play_skill[8]  = (data[pos] >> 7) & 1;
        pos++;

        player.play_skill[9]  =  data[pos]       & 1;
        player.play_skill[10] = (data[pos] >> 1) & 1;
        player.play_skill[11] = (data[pos] >> 2) & 1;
        player.play_skill[12] = (data[pos] >> 3) & 1;
        player.play_skill[13] = (data[pos] >> 4) & 1;
        player.play_skill[14] = (data[pos] >> 5) & 1;
        player.play_skill[15] = (data[pos] >> 6) & 1;
        player.play_skill[16] = (data[pos] >> 7) & 1;
        pos++;

        player.play_skill[17] =  data[pos]       & 1;
        player.play_skill[18] = (data[pos] >> 1) & 1;
        player.play_skill[19] = (data[pos] >> 2) & 1;
        player.play_skill[20] = (data[pos] >> 3) & 1;
        player.play_skill[21] = (data[pos] >> 4) & 1;
        player.play_skill[22] = (data[pos] >> 5) & 1;
        player.play_skill[23] = (data[pos] >> 6) & 1;
        player.play_skill[24] = (data[pos] >> 7) & 1;
        pos++;

        player.play_skill[25] =  data[pos]       & 1;
        player.play_skill[26] = (data[pos] >> 1) & 1;
        player.play_skill[27] = (data[pos] >> 2) & 1;

        pos++;  // Unknown F – 5 bits remaining

        // Name
        const nameStart = pos;
        player.name = new TextDecoder("utf-8")
            .decode(data.subarray(nameStart, nameStart + 46))
            .replace(/\0.*$/, "");
        pos += 46;

        // Shirt name
        const shirtStart = pos;
        player.shirt_name = new TextDecoder("ascii")
            .decode(data.subarray(shirtStart, shirtStart + 18))
            .replace(/\0.*$/, "").trim();
        pos += 18;

        // ────────────────────────────────────────────────
        // Appearance block (very similar to 2016/2017)
        // ────────────────────────────────────────────────

        pos += 4;  // playerID

        player.b_edit_face  = data[pos] & 1;
        player.b_edit_hair  = (data[pos] >> 1) & 1;
        player.b_edit_phys  = (data[pos] >> 2) & 1;
        player.b_edit_strip = (data[pos] >> 3) & 1;

        player.boot_id      = data[pos] >> 4;
        pos++;
        player.boot_id += data[pos] << 4;
        pos++;
        player.boot_id += (data[pos] & 3) << 12;

        player.glove_id = data[pos] >> 2;
        pos++;
        player.glove_id += data[pos] << 6;      // 14 bits total
        
        pos++;                                  // Unknown B – 4 bits?

        player.copy_id = data[pos] |
                        (data[pos+1] << 8) |
                        (data[pos+2] << 16) |
                        (data[pos+3] << 24);
        pos += 4;

        // Body proportions (4-bit pairs)
        player.neck_len  = data[pos] & 15;
        player.neck_size = data[pos] >> 4;
        pos++;
        player.shldr_hi  = data[pos] & 15;
        player.shldr_wid = data[pos] >> 4;
        pos++;
        player.chest     = data[pos] & 15;
        player.waist     = data[pos] >> 4;
        pos++;
        player.arm_size  = data[pos] & 15;
        player.arm_len   = data[pos] >> 4;
        pos++;
        player.thigh     = data[pos] & 15;
        player.calf      = data[pos] >> 4;
        pos++;
        player.leg_len   = data[pos] & 15;
        player.head_len  = data[pos] >> 4;
        pos++;
        player.head_wid  = data[pos] & 15;
        player.head_dep  = data[pos] >> 4;
        pos++;

        player.wrist_col_l = data[pos] & 7;
        player.wrist_col_r = (data[pos] >> 3) & 7;
        player.wrist_tape  = data[pos] >> 6;
        pos++;

        player.spec_col   = data[pos] & 7;
        player.spec_style = (data[pos] >> 3) & 7;
        player.sleeve     = data[pos] >> 6;
        pos++;

        player.inners      = data[pos] & 3;
        player.socks       = (data[pos] >> 2) & 3;
        player.undershorts = (data[pos] >> 4) & 3;
        player.untucked    = (data[pos] >> 6) & 1;
        player.ankle_tape  = (data[pos] >> 7) & 1;
        pos++;

        player.gloves     = data[pos] & 1;
        player.gloves_col = (data[pos] >> 1) & 7;
        
        // Unknown D
        pos++;           
        
        // Unknown E
        pos += 22;       

        player.skin_col = data[pos] & 7;
        if (player.skin_col === 7) {
            player.skin_col = 0;
            player.b_changed = true;   // flag – no custom skin in PES 2018
        }

        // Unknown F
        pos++;

        // Unknown G
        pos += 18;       

        player.iris_col = data[pos] & 15;
        
        // Unknown H
        pos++;
        
        // Unknown I           
        pos += 7;        

        currentByte.value = pos;

        return player;
    }

    /**
     * Fills player entry – PES 2019 style
     * Mix of direct byte reads + read_data bit extraction + appearance block
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     */
    static readPlayerEntry19(currentByte, data) {
        const read = (startBit, bits) => SaveFile.readData(startBit, bits, currentByte, data);

        const player = {};
        // ID – using read_data (commented alternative is manual LE 32-bit)
        player.id = read(0, 4*8);
        currentByte.value += 4;

        // Nation – manual 16-bit LE
        player.nation = data[currentByte.value] | (data[currentByte.value+1] << 8);
        currentByte.value += 2;

        player.height = data[currentByte.value++];
        player.weight = data[currentByte.value++];
        player.gc1    = data[currentByte.value++];
        player.gc2    = data[currentByte.value++];

        // atk + ball_ctrl (cross-byte 7-bit)
        player.atk       = data[currentByte.value] & 127;
        player.ball_ctrl = data[currentByte.value] >> 7;
        currentByte.value++;
        player.ball_ctrl += (data[currentByte.value] << 1) & 127;

        player.weak_use = data[currentByte.value] >> 6;
        currentByte.value++;

        player.lowpass   = read(0, 7);
        player.loftpass  = read(7, 7);
        player.finish    = read(6, 7);
        player.place_kick = read(5, 7);
        player.mo_armd   = read(4, 3);
        currentByte.value++;  // Unknown A – 1 bit

        player.header   = read(0, 7);
        player.def      = read(7, 7);
        player.ball_win = read(6, 7);
        player.kick_pwr = read(5, 7);
        player.mo_armr  = read(4, 3);
        currentByte.value++;  // Unknown B – 1 bit

        player.exp_pwr  = read(0, 7);
        player.body_ctrl = read(7, 7);
        player.phys_cont = read(6, 7);
        player.jump     = read(5, 7);
        player.mo_ck    = read(4, 3);
        currentByte.value++;  // Unknown C – 1 bit

        player.catching = read(0, 7);
        player.clearing = read(7, 7);
        player.reflex   = read(6, 7);
        player.cover    = read(5, 7);
        player.form     = read(4, 3);
        player.b_edit_player = read(7, 1);

        player.reg_pos  = read(0, 4);
        // Unknown D – 1 bit

        player.play_style = read(5, 5);
        player.mo_fk      = read(2, 4);
        // Unknown E – 1 bit

        player.swerve   = read(7, 7);
        player.speed    = read(6, 7);
        player.star     = read(5, 3);
        player.stamina  = read(0, 7);
        player.gk       = read(7, 7);
        player.mo_pk    = read(6, 3);
        player.drib     = read(1, 7);
        player.weak_acc = read(0, 2);
        player.injury   = read(2, 2);

        // Playing positions – reordered compared to earlier versions
        player.play_pos = new Array(13).fill(0);
        player.play_pos[12] = read(4, 2);   // GK
        player.play_pos[9]  = read(6, 2);   // CB
        player.play_pos[10] = read(0, 2);   // LB
        player.play_pos[11] = read(2, 2);   // RB
        player.play_pos[5]  = read(4, 2);   // DMF
        player.play_pos[6]  = read(6, 2);   // CMF
        player.play_pos[7]  = read(0, 2);   // LMF
        player.play_pos[8]  = read(2, 2);   // RMF
        player.play_pos[4]  = read(4, 2);   // AMF
        player.play_pos[2]  = read(6, 2);   // LWF
        player.play_pos[3]  = read(0, 2);   // RWF
        player.play_pos[1]  = read(2, 2);   // SS
        player.play_pos[0]  = read(4, 2);   // CF

        player.mo_hunchd = read(6, 2);
        player.mo_hunchr = read(0, 2);

        player.age = read(2, 6);

        player.b_edit_basicset  = read(0, 1);
        player.b_edit_regpos    = read(1, 1);
        player.b_edit_playpos   = read(2, 1);
        player.b_edit_ability   = read(3, 1);
        player.b_edit_skill     = read(4, 1);
        player.b_edit_style     = read(5, 1);
        player.b_edit_com       = read(6, 1);
        player.b_edit_motion    = read(7, 1);
        // Unknown F – 1 bit

        player.strong_foot = read(1, 1);

        player.com_style = new Array(7).fill(0);
        player.com_style[0] = read(2, 1);
        player.com_style[1] = read(3, 1);
        player.com_style[2] = read(4, 1);
        player.com_style[3] = read(5, 1);
        player.com_style[4] = read(6, 1);
        player.com_style[5] = read(7, 1);
        player.com_style[6] = read(0, 1);

        // Player skills – sparse indexing (same pattern as 2020)
        player.play_skill = new Array(40).fill(0); // safe size
        player.play_skill[0]  = read(1, 1);
        player.play_skill[28] = read(2, 1);
        player.play_skill[1]  = read(3, 1);
        player.play_skill[2]  = read(4, 1);
        player.play_skill[3]  = read(5, 1);
        player.play_skill[29] = read(6, 1);
        player.play_skill[4]  = read(7, 1);
        player.play_skill[5]  = read(0, 1);
        player.play_skill[30] = read(1, 1);
        player.play_skill[6]  = read(2, 1);
        player.play_skill[7]  = read(3, 1);
        player.play_skill[31] = read(4, 1);
        player.play_skill[8]  = read(5, 1);
        player.play_skill[32] = read(6, 1);
        player.play_skill[33] = read(7, 1);
        player.play_skill[9]  = read(0, 1);
        player.play_skill[10] = read(1, 1);
        player.play_skill[11] = read(2, 1);
        player.play_skill[12] = read(3, 1);
        player.play_skill[13] = read(4, 1);
        player.play_skill[14] = read(5, 1);
        player.play_skill[15] = read(6, 1);
        player.play_skill[16] = read(7, 1);
        player.play_skill[34] = read(0, 1);
        player.play_skill[17] = read(1, 1);
        player.play_skill[18] = read(2, 1);
        player.play_skill[35] = read(3, 1);
        player.play_skill[19] = read(4, 1);
        player.play_skill[20] = read(5, 1);
        player.play_skill[36] = read(6, 1);
        player.play_skill[37] = read(7, 1);
        player.play_skill[21] = read(0, 1);
        player.play_skill[22] = read(1, 1);
        player.play_skill[23] = read(2, 1);
        player.play_skill[38] = read(3, 1);
        player.play_skill[24] = read(4, 1);
        player.play_skill[25] = read(5, 1);
        player.play_skill[26] = read(6, 1);
        player.play_skill[27] = read(7, 1);

        currentByte.value++;  // Unknown G – full byte

        // Name
        const nameStart = currentByte.value;
        player.name = new TextDecoder("utf-8")
            .decode(data.subarray(nameStart, nameStart + 46))
            .replace(/\0.*$/, "");
        currentByte.value += 46;

        // Shirt name
        const shirtStart = currentByte.value;
        player.shirt_name = new TextDecoder("ascii")
            .decode(data.subarray(shirtStart, shirtStart + 18))
            .replace(/\0.*$/, "").trim();
        currentByte.value += 18;

        // ────────────────────────────────────────────────
        // Appearance block – almost identical to PES 2018
        // ────────────────────────────────────────────────

        currentByte.value += 4;  // playerID

        player.b_edit_face  = data[currentByte.value] & 1;
        player.b_edit_hair  = (data[currentByte.value] >> 1) & 1;
        player.b_edit_phys  = (data[currentByte.value] >> 2) & 1;
        player.b_edit_strip = (data[currentByte.value] >> 3) & 1;
        
        player.boot_id      = data[currentByte.value] >> 4;
        currentByte.value++;
        player.boot_id += data[currentByte.value] << 4;
        currentByte.value++;
        player.boot_id += (data[currentByte.value] & 3) << 12;
        
        player.glove_id = data[currentByte.value] >> 2;
        currentByte.value++;
        player.glove_id += data[currentByte.value] << 6;      // 14 bits
        
        currentByte.value++;                                  // Unknown B – 4 bits

        player.copy_id = data[currentByte.value] +
                        (data[currentByte.value+1] << 8) +
                        (data[currentByte.value+2] << 16) +
                        (data[currentByte.value+3] << 24);
        currentByte.value += 4;

        // Body proportions (4-bit pairs)
        player.neck_len  = data[currentByte.value] & 15; 
        player.neck_size = data[currentByte.value] >> 4;
        currentByte.value++;

        player.shldr_hi  = data[currentByte.value] & 15; 
        player.shldr_wid = data[currentByte.value] >> 4;
        currentByte.value++;

        player.chest     = data[currentByte.value] & 15; 
        player.waist     = data[currentByte.value] >> 4;
        currentByte.value++;

        player.arm_size  = data[currentByte.value] & 15; 
        player.arm_len   = data[currentByte.value] >> 4;
        currentByte.value++;

        player.thigh     = data[currentByte.value] & 15; 
        player.calf      = data[currentByte.value] >> 4;
        currentByte.value++;

        player.leg_len   = data[currentByte.value] & 15; 
        player.head_len  = data[currentByte.value] >> 4;
        currentByte.value++;

        player.head_wid  = data[currentByte.value] & 15; 
        player.head_dep  = data[currentByte.value] >> 4;
        currentByte.value++;

        player.wrist_col_l = data[currentByte.value] & 7;
        player.wrist_col_r = (data[currentByte.value] >> 3) & 7;
        player.wrist_tape  = data[currentByte.value] >> 6;
        currentByte.value++;

        player.spec_col   = data[currentByte.value] & 7;
        player.spec_style = (data[currentByte.value] >> 3) & 7;
        player.sleeve     = data[currentByte.value] >> 6;
        currentByte.value++;

        player.inners      = data[currentByte.value] & 3;
        player.socks       = (data[currentByte.value] >> 2) & 3;
        player.undershorts = (data[currentByte.value] >> 4) & 3;
        player.untucked    = (data[currentByte.value] >> 6) & 1;
        player.ankle_tape  = (data[currentByte.value] >> 7) & 1;
        currentByte.value++;

        player.gloves     = data[currentByte.value] & 1;
        player.gloves_col = (data[currentByte.value] >> 1) & 7;

        currentByte.value++;           // Unknown D
        currentByte.value += 22;       // Unknown E

        player.skin_col = data[currentByte.value] & 7;
        if (player.skin_col === 7) {
            player.skin_col = 0;
            player.b_changed = true;
        }

        currentByte.value++;           // Unknown F
        currentByte.value += 18;       // Unknown G

        player.iris_col = data[currentByte.value] & 15;

        currentByte.value++;           // Unknown H
        currentByte.value += 7;        // Unknown I

        return player;
    }

    /**
     * Reads PES 20/21 player data into an object and returns it
     * @param {Uint8Array} data - whole player data buffer
     */
    static readPlayerEntry20_21(currentByte, data) {
        // Helper to make code more readable
        const read = (start, bits) => SaveFile.readData(start, bits, currentByte, data);

        const player = {}

        player.id               = read(0, 32);

        currentByte.value += 4;   // 4 bytes alignment
        
        player.nation           = read(0, 16);
        player.height           = read(0, 8);
        player.weight           = read(0, 8);
        player.gc1              = read(0, 8);
        player.gc2              = read(0, 8);

        player.atk              = read(0, 7);
        player.ball_ctrl        = read(7, 7);
        player.weak_use         = read(6, 2);
        player.tight_pos        = read(0, 7);
        player.lowpass          = read(7, 7);
        player.loftpass         = read(6, 7);
        player.finish           = read(5, 7);

        player.mo_armd          = read(4, 4);
        player.place_kick       = read(0, 7);
        player.swerve           = read(7, 7);   // Curl
        player.speed            = read(6, 7);
        player.exp_pwr          = read(5, 7);   // Acceleration
        player.mo_armr          = read(4, 4);

        player.jump             = read(0, 7);
        player.phys_cont        = read(7, 7);
        player.body_ctrl        = read(6, 7);   // Balance
        player.stamina          = read(5, 7);
        player.mo_ck            = read(4, 4);

        player.ball_win         = read(0, 7);
        player.aggres           = read(7, 7);
        player.gk               = read(6, 7);   // GK Awareness
        player.catching         = read(5, 7);
        player.form             = read(4, 3);
        player.b_edit_player    = read(7, 1);

        player.cover            = read(0, 7);   // GK Reach
        player.age              = read(7, 6);
        player.reg_pos          = read(5, 4);
        //Unknown A - 1/1
        player.play_style       = read(2, 5);
        player.mo_fk            = read(7, 5);
        player.star             = read(4, 3);
        player.b_edit_basicset  = read(7, 1);
        player.def              = read(0, 7);
        player.clearing         = read(7, 7);
        player.header           = read(6, 7);
        player.mo_hunchd        = read(5, 3);
        player.mo_hunchr        = read(0, 3);
        player.mo_pk            = read(3, 3);
        player.weak_acc         = read(6, 2);
        player.drib             = read(0, 7);
        player.injury           = read(7, 2);
        player.play_attit       = read(1, 2);
        player.mo_drib          = read(3, 2);

        // Playing positions
        player.play_pos = new Array(13).fill(0);
        player.play_pos[12] = read(5, 2);  // GK
        player.play_pos[9]  = read(7, 2);  // CB
        player.play_pos[10] = read(1, 2);  // LB
        player.play_pos[11] = read(3, 2);  // RB
        player.play_pos[5]  = read(5, 2);  // DMF
        player.play_pos[6]  = read(7, 2);  // CMF
        player.play_pos[7]  = read(1, 2);  // LMF
        player.play_pos[8]  = read(3, 2);  // RMF
        player.play_pos[4]  = read(5, 2);  // AMF
        player.b_edit_regpos = read(7, 1);
        player.play_pos[3] = read(0, 2);   // RWF
        player.play_pos[1] = read(2, 2);   // SS
        player.play_pos[0] = read(4, 2);   // CF
        player.reflex          = read(6, 7);
        player.kick_pwr        = read(5, 7);
        player.play_pos[2]     = read(4, 2);   // LWF
        player.b_edit_playpos  = read(6, 1);
        player.b_edit_ability  = read(7, 1);
        player.b_edit_skill    = read(0, 1);
        player.b_edit_style    = read(1, 1);
        player.b_edit_com      = read(2, 1);
        player.b_edit_motion   = read(3, 1);

        //Unknown C - 4/1
        player.strong_foot     = read(5, 1);
        player.strong_hand     = read(6, 1);

        // COM playing styles
        player.com_style = new Array(7).fill(0);
        player.com_style[0] = read(7, 1);
        player.com_style[1] = read(0, 1);
        player.com_style[2] = read(1, 1);
        player.com_style[3] = read(2, 1);
        player.com_style[4] = read(3, 1);
        player.com_style[5] = read(4, 1);
        player.com_style[6] = read(5, 1);

        // Player skills
        player.play_skill = new Array(50).fill(0); // enough size
        player.play_skill[0]  = read(6, 1);   // Scissors Feint
        player.play_skill[28] = read(7, 1);   // Double Touch
        player.play_skill[1]  = read(0, 1);   // Flip flap
        player.play_skill[2]  = read(1, 1);   // Marseille turn
        player.play_skill[3]	= read(2, 1); //Sombrero
        player.play_skill[29]	= read(3, 1); //Crossover Turn
        player.play_skill[4]	= read(4, 1); //Cut Behind & Turn
        player.play_skill[5]	= read(5, 1); //Scotch Move
        player.play_skill[30]	= read(6, 1); //Step on Skill
        player.play_skill[6]	= read(7, 1); //Heading
        player.play_skill[7]	= read(0, 1); //Long range drive
        player.play_skill[31]	= read(1, 1); //Chip Shot
        player.play_skill[39]	= read(2, 1); //Long range shooting
        player.play_skill[8]	= read(3, 1); //Knuckle shot
        player.play_skill[32]	= read(4, 1); //Dipping Shots
        player.play_skill[33]	= read(5, 1); //Rising Shots
        player.play_skill[9]	= read(6, 1); //Acro finishing
        player.play_skill[10]	= read(7, 1); //Heel trick
        player.play_skill[11]	= read(0, 1); //First time shot
        player.play_skill[12]	= read(1, 1); //One touch pass
        player.play_skill[40]	= read(2, 1); //Through passing
        player.play_skill[13]	= read(3, 1); //Weighted pass
        player.play_skill[14]	= read(4, 1); //Pinpoint crossing
        player.play_skill[15]	= read(5, 1); //Outside curler
        player.play_skill[16]	= read(6, 1); //Rabona
        player.play_skill[34]	= read(7, 1); //No Look Pass
        player.play_skill[17]	= read(0, 1); //Low Lofted Pass
        player.play_skill[18]	= read(1, 1); //Low Punt trajectory
        player.play_skill[35]	= read(2, 1); //GK High Punt Trajectory
        player.play_skill[19]	= read(3, 1); //Long throw
        player.play_skill[20]	= read(4, 1); //GK long throw
        player.play_skill[36]	= read(5, 1); //Penalty Specialist
        player.play_skill[37]	= read(6, 1); //GK Penalty Specialist
        player.play_skill[21]	= read(7, 1); //Malicia
        player.play_skill[22]	= read(0, 1); //Man marking
        player.play_skill[23]	= read(1, 1); //Track back
        player.play_skill[38]	= read(2, 1); //Interception
        player.play_skill[24]	= read(3, 1); //Acro clear
        player.play_skill[25]	= read(4, 1); //Captaincy
        player.play_skill[26]	= read(5, 1); //Super sub
        player.play_skill[27]	= read(6, 1); //Fighting spirit

        currentByte.value++; // Unknown D 7/1

        // Name (UTF-8) - max 60 characters + null
        const nameBytes = data.subarray(currentByte.value, currentByte.value + 61);
        player.name = new TextDecoder("utf-8").decode(nameBytes).replace(/\0.*$/, "");
        currentByte.value += 61;

        // Shirt name (maybe ASCII)
        const shirtBytes = data.subarray(currentByte.value, currentByte.value + 21);
        player.shirt_name = new TextDecoder("ascii").decode(shirtBytes).replace(/\0.*$/, "");
        currentByte.value += 61; // original skips 61 bytes (probably padding)

        currentByte.value += 64; // Print Name (National Team)

        // Appearance
        currentByte.value += 4; // playerID

        player.b_edit_face   = read(0, 1);
        player.b_edit_hair   = read(1, 1);
        player.b_edit_phys   = read(2, 1);
        player.b_edit_strip  = read(3, 1);

        player.boot_id       = read(4, 14);
        player.glove_id      = read(2, 14);
        player.copy_id       = read(0, 32);

        // Body proportions (4-bit values)
        player.neck_len     = read(0, 4);
        player.neck_size    = read(4, 4);
        player.shldr_hi     = read(0, 4);
        player.shldr_wid    = read(4, 4);
        player.chest		= read(0, 4);
        player.waist		= read(4, 4);
        player.arm_size	    = read(0, 4);
        player.arm_len		= read(4, 4);
        player.thigh		= read(0, 4);
        player.calf		    = read(4, 4);
        player.leg_len		= read(0, 4);
        player.head_len 	= read(4, 4);
        player.head_wid	    = read(0, 4);
        player.head_dep 	= read(4, 4);
        player.wrist_col_l	= read(0, 3);
        player.wrist_col_r   = read(3, 3);
        player.wrist_tape	= read(6, 2);
        player.spec_col	    = read(0, 3);
        player.spec_style	= read(3, 3);
        player.sleeve		= read(6, 2);
        player.inners		= read(0, 2);
        player.socks		= read(2, 2);
        player.undershorts  = read(4, 2);
        player.untucked	    = read(6, 1);
        player.ankle_tape	= read(7, 1);
        //0x16:0
        player.gloves		= read(0, 1);
        player.gloves_col	= read(1, 3);
        //Skip face settings
        currentByte.value += 23;
        //0x2D:0
        player.skin_col     = read(0, 3);
        //No custom skin in 18+
        if(player.skin_col==7) {
            player.skin_col = 0;
            player.b_changed = true;
        }
        //Skip additional face settings
        currentByte.value += 19;
        //0x40:0
        player.iris_col = read(0, 4);
        //Skip hair settings
        currentByte.value += 8;

        return player
    }

    /**
     * Writes player back over the entry at currentByte, the inverse of readPlayerEntry15
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     * @param {Object} player
     */
    static writePlayerEntry15(currentByte, data, player) {
        const write = (startBit, bitCount, value) => SaveFile.writeData(startBit, bitCount, currentByte, data, value);

        write(0, 4*8, player.id);                // 0x00–0x03

        currentByte.value += 0x6;            // Commentary name + Unknown A

        write(0, 2*8, player.nation);            // 0x0A

        write(0, 8, player.height); // 0x0C (byte)
        write(0, 8, player.weight); // 0x0D (byte)
        write(0, 8, player.gc1); // 0x0E (byte)
        write(0, 8, player.gc2); // 0x0F (byte)

        write(0, 7, player.atk);          // 0x10
        write(7, 7, player.def);          // 0x10:7

        write(6, 7, player.gk);          // 0x11:6
        currentByte.value++;                 // Unknown B (0x12:5 – 1 byte skip)

        write(4, 4, player.mo_fk);          // 0x13:4
        write(0, 7, player.ball_ctrl);          // 0x14
        write(7, 7, player.finish);          // 0x14:7
        write(6, 7, player.lowpass);
        write(5, 7, player.loftpass);          // 0x16:5
        write(4, 2, player.weak_acc);          // 0x17:4

        write(7, 1, player.b_edit_player);      // 0x17:7

        write(0, 7, player.place_kick);         // 0x18
        write(7, 7, player.swerve);         // Curl
        write(6, 7, player.catching);         // Saving (GK)
        write(5, 7, player.speed);
        write(4, 3, player.form);         // 0x1B:4

        currentByte.value++;                 // Unknown D (0x1B:7 – 1 byte)

        write(0, 7, player.exp_pwr);          // Acceleration 0x1C:0
        write(7, 7, player.jump);          // 0x1C:7
        write(6, 7, player.stamina);          // 0x1D:6
        write(5, 6, player.age);          // 0x1E:5
        write(3, 4, player.reg_pos);          // 0x1F:3

        currentByte.value++;                 // Unknown E (0x1F:7 – 1 byte)

        write(0, 5, player.play_style);         // 0x20:0
        write(5, 7, player.drib);         // 0x20:5
        write(4, 7, player.header);         // 0x21:4
        write(3, 7, player.body_ctrl);         // Balance 0x22:3
        write(2, 2, player.injury);         // 0x23:2

        write(5, 3, player.mo_armd);         // 0x23:5
        write(0, 3, player.mo_armr);         // 0x24:0
        write(3, 3, player.mo_ck);
        write(6, 2, player.weak_use);         // 0x24:6

        // Playing positions (13 × 2 bits)
        write(0, 2, player.play_pos[0]);       // CF     0x25:0
        write(2, 2, player.play_pos[1]);
        write(4, 2, player.play_pos[2]);
        write(6, 2, player.play_pos[3]);
        write(0, 2, player.play_pos[4]);
        write(2, 2, player.play_pos[5]);
        write(4, 2, player.play_pos[6]);
        write(6, 2, player.play_pos[7]);
        write(0, 2, player.play_pos[8]);
        write(2, 2, player.play_pos[9]);
        write(4, 2, player.play_pos[10]);
        write(6, 2, player.play_pos[11]);
        write(0, 2, player.play_pos[12]);       // GK     0x28:0

        write(2, 2, player.mo_hunchd);          // 0x28:2
        write(4, 2, player.mo_hunchr);          // 0x28:4
        write(6, 2, player.mo_pk);          // 0x28:6

        write(0, 7, player.ball_win);          // 0x29:0
        write(7, 7, player.kick_pwr);          // 0x29:7

        currentByte.value++;                 // Unknown G (2 bits + padding?)

        write(2, 1, player.b_base_copy);     // 0x2B:2
        write(3, 1, player.b_edit_basicset);    // 0x2B:3

        currentByte.value++;                 // Unknown H (6 bits remaining in byte)

        write(2, 1, player.strong_foot);        // 0x2C:2

        write(3, 1, player.com_style[0]);       // 0x2C:3
        write(4, 1, player.com_style[1]);
        write(5, 1, player.com_style[2]);
        write(6, 1, player.com_style[3]);
        write(7, 1, player.com_style[4]);
        write(0, 1, player.com_style[5]);
        write(1, 1, player.com_style[6]);       // 0x2D:1

        write(2, 1, player.play_skill[0]);     // 0x2D:2
        write(3, 1, player.play_skill[1]);
        write(4, 1, player.play_skill[2]);
        write(5, 1, player.play_skill[3]);
        write(6, 1, player.play_skill[4]);
        write(7, 1, player.play_skill[5]);
        write(0, 1, player.play_skill[7]);
        write(1, 1, player.play_skill[8]);
        write(2, 1, player.play_skill[9]);
        write(3, 1, player.play_skill[11]);
        write(4, 1, player.play_skill[12]);
        write(5, 1, player.play_skill[13]);
        write(6, 1, player.play_skill[14]);
        write(7, 1, player.play_skill[15]);
        write(0, 1, player.play_skill[18]);
        write(1, 1, player.play_skill[19]);
        write(2, 1, player.play_skill[20]);
        write(3, 1, player.play_skill[22]);
        write(4, 1, player.play_skill[23]);
        write(5, 1, player.play_skill[25]);
        write(6, 1, player.play_skill[26]);
        write(7, 1, player.play_skill[27]);     // 0x2F:7

        // Name (UTF-8, max ~45 chars + null)
        SaveFile.writeString(data, currentByte.value, 46, player.name, "utf-8");
        currentByte.value += 0x2E;           // 46 bytes

        // Shirt name (max 17 chars + null)
        SaveFile.writeString(data, currentByte.value, 18, player.shirt_name, "ascii", s => s.trim());
        currentByte.value += 0x12;           // 18 bytes

        // Total block ≈ 0x70 bytes

    }

    /**
     * Writes player back over the entry at currentByte, the inverse of readAppearanceEntry15
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     * @param {Object} player
     */
    static writeAppearanceEntry15(currentByte, data, player) {
        const write = (startBit, bitCount, value) => SaveFile.writeData(startBit, bitCount, currentByte, data, value);

        currentByte.value += 4;  // playerID, matched by the caller

        write(0, 1, player.b_edit_face);
        write(1, 1, player.b_edit_hair);
        write(2, 1, player.b_edit_phys);
        write(3, 1, player.b_edit_strip);

        write(4, 14, player.boot_id);
        write(2, 14, player.glove_id); 

        write(0, 32, player.copy_id);

        // Body proportions ─ all 4-bit values, two per byte
        write(0, 4, player.neck_len);
        write(4, 4, player.neck_size);
        write(0, 4, player.shldr_hi);
        write(4, 4, player.shldr_wid);
        write(0, 4, player.chest);
        write(4, 4, player.waist);
        write(0, 4, player.arm_size);
        write(4, 4, player.arm_len);
        write(0, 4, player.thigh);
        write(4, 4, player.calf);
        write(0, 4, player.leg_len);
        write(4, 4, player.head_len);
        write(0, 4, player.head_wid);
        write(4, 4, player.head_dep);

        // Kit & accessory details
        write(0, 3, player.wrist_col_l);
        write(3, 3, player.wrist_col_r);
        write(6, 2, player.wrist_tape);
        write(0, 3, player.spec_col);
        write(3, 3, player.spec_style);
        write(6, 2, player.sleeve);
        write(0, 2, player.inners);
        write(2, 2, player.socks);
        write(4, 2, player.undershorts);
        write(6, 1, player.untucked);
        write(7, 1, player.ankle_tape);

        write(0, 1, player.gloves);
        write(1, 3, player.gloves_col);

        // Unknown D ─ 1 byte
        currentByte.value += 1;

       // Unknown E ─ 22 bytes
        currentByte.value += 22;

        write(0, 3, player.skin_col);

        // Unknown F ─ 1 byte
        currentByte.value += 1;

        // Unknown G ─ 18 bytes
        currentByte.value += 18;

        write(0, 4, player.iris_col);

        // Unknown H ─ 1 byte
        currentByte.value += 1;

        // Unknown I ─ only 3 bytes in PES 2015
        currentByte.value += 3;

        // Total block size after the 4-byte PID = 0x44 bytes (68 decimal)

        return true;
    }

    /**
     * Writes player back over the entry at currentByte, the inverse of readPlayerEntry16
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     * @param {Object} player
     */
    static writePlayerEntry16(currentByte, data, player) {
        const write = (startBit, bitCount, value) => SaveFile.writeData(startBit, bitCount, currentByte, data, value);

        write(0, 32, player.id);           // 4 bytes
        currentByte.value += 0x6;       // Skip 6 bytes (unknown/padding in 2016 format)

        write(0, 16, player.nation);
        write(0, 8, player.height);
        write(0, 8, player.weight);
        write(0, 8, player.gc1);
        write(0, 8, player.gc2);

        write(0, 7, player.atk);
        write(7, 7, player.def);
        write(6, 7, player.gk);     // GK Awareness
        write(5, 7, player.drib);
        write(4, 4, player.mo_fk);     // Free Kick

        write(0, 7, player.finish);
        write(7, 7, player.lowpass);
        write(6, 7, player.loftpass);
        write(5, 7, player.header);
        write(4, 3, player.form);
        write(7, 1, player.b_edit_player);

        write(0, 7, player.swerve);     // Curl
        write(7, 7, player.catching);
        write(6, 7, player.clearing);
        write(5, 7, player.reflex);
        write(4, 2, player.injury);

        // Unknown B - 1 bit skipped implicitly by next read starting at 7

        write(7, 1, player.b_edit_basicset);
        write(0, 7, player.body_ctrl);     // Balance

        write(7, 7, player.kick_pwr);
        write(6, 7, player.exp_pwr);     // Acceleration
        write(5, 7, player.jump);
        write(4, 3, player.mo_armd);     // Arm diversity left?

        write(7, 1, player.b_edit_regpos);
        write(0, 4, player.reg_pos);

        // Unknown C - 1 bit skipped

        write(5, 5, player.play_style);
        write(2, 7, player.ball_ctrl);
        write(1, 7, player.ball_win);
        write(0, 7, player.cover);    // GK Reach

        write(7, 1, player.b_edit_playpos);

        write(0, 3, player.mo_armr);
        write(3, 3, player.mo_ck);       // Corner Kick
        write(6, 2, player.weak_acc);
        write(0, 2, player.weak_use);

        // Playing positions – 13 positions × 2 bits each
        write(2, 2, player.play_pos[0]);   // CF
        write(4, 2, player.play_pos[1]);   // SS
        write(6, 2, player.play_pos[2]);   // LWF
        write(0, 2, player.play_pos[3]);   // RWF
        write(2, 2, player.play_pos[4]);   // AMF
        write(4, 2, player.play_pos[5]);   // DMF
        write(6, 2, player.play_pos[6]);   // CMF
        write(0, 2, player.play_pos[7]);   // LMF
        write(2, 2, player.play_pos[8]);   // RMF
        write(4, 2, player.play_pos[9]);   // CB
        write(6, 2, player.play_pos[10]);   // LB
        write(0, 2, player.play_pos[11]);   // RB
        write(2, 2, player.play_pos[12]);   // GK

        write(4, 2, player.mo_hunchd);     // Heading (dive?)
        write(6, 2, player.mo_hunchr);
        write(0, 2, player.mo_pk);     // Penalty Kick

        write(2, 7, player.place_kick);
        write(1, 7, player.speed);
        write(0, 6, player.age);

        write(6, 1, player.b_edit_ability);
        write(7, 1, player.b_edit_skill);

        write(0, 7, player.stamina);

        write(7, 1, player.b_edit_style);
        write(0, 1, player.b_edit_com);
        write(1, 1, player.b_edit_motion);

        // Unknown D - 1 bit skipped

        write(3, 1, player.b_base_copy);
        write(4, 1, player.strong_foot);

        // COM playing styles – 7 flags
        write(5, 1, player.com_style[0]);
        write(6, 1, player.com_style[1]);
        write(7, 1, player.com_style[2]);
        write(0, 1, player.com_style[3]);
        write(1, 1, player.com_style[4]);
        write(2, 1, player.com_style[5]);
        write(3, 1, player.com_style[6]);

        // Player skills – 28 skills in PES 2016 (1 bit each)
        write(4, 1, player.play_skill[0]);   // Scissors Feint
        write(5, 1, player.play_skill[1]);   // Flip Flap
        write(6, 1, player.play_skill[2]);   // Marseille Turn
        write(7, 1, player.play_skill[3]);   // Sombrero
        write(0, 1, player.play_skill[4]);   // Cut Behind & Turn
        write(1, 1, player.play_skill[5]);   // Scotch Move ?
        write(2, 1, player.play_skill[6]);   // Heading
        write(3, 1, player.play_skill[7]);   // Long Range Drive
        write(4, 1, player.play_skill[8]);   // Knuckle Shot ?
        write(5, 1, player.play_skill[9]);   // Dipping Shot ?
        write(6, 1, player.play_skill[10]);   // Acrobatic Finishing
        write(7, 1, player.play_skill[11]);   // Heel Trick
        write(0, 1, player.play_skill[12]);   // First-time Shot
        write(1, 1, player.play_skill[13]);   // One-touch Pass
        write(2, 1, player.play_skill[14]);   // Weighted Pass
        write(3, 1, player.play_skill[15]);   // Pinpoint Crossing
        write(4, 1, player.play_skill[16]);   // Outside Curler
        write(5, 1, player.play_skill[17]);   // Rabona ?
        write(6, 1, player.play_skill[18]);   // Low Lofted Pass
        write(7, 1, player.play_skill[19]);   // Long Throw
        write(0, 1, player.play_skill[20]);   // GK Long Throw ?
        write(1, 1, player.play_skill[21]);   // Malicia ?
        write(2, 1, player.play_skill[22]);   // Man Marking
        write(3, 1, player.play_skill[23]);   // Track Back
        write(4, 1, player.play_skill[24]);   // Acrobatic Clear ?
        write(5, 1, player.play_skill[25]);   // Captaincy ?
        write(6, 1, player.play_skill[26]);   // Super-sub ?
        write(7, 1, player.play_skill[27]);   // Fighting Spirit

        // Name – UTF-8, max ~45 chars + null
        SaveFile.writeString(data, currentByte.value, 46, player.name, "utf-8");
        currentByte.value += 46;

        // Shirt name – usually 15 chars + null
        SaveFile.writeString(data, currentByte.value, 16, player.shirt_name, "ascii", s => s.trim());
        currentByte.value += 16;

    }

    /**
     * Writes player back over the entry at currentByte, the inverse of readAppearanceEntry16
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     * @param {Object} player
     */
    static writeAppearanceEntry16(currentByte, data, player) {
        const write = (startBit, bitCount, value) => SaveFile.writeData(startBit, bitCount, currentByte, data, value);

        currentByte.value += 4;  // playerID, matched by the caller

        write(0, 1, player.b_edit_face);
        write(1, 1, player.b_edit_hair);
        write(2, 1, player.b_edit_phys);
        write(3, 1, player.b_edit_strip);

        write(4, 14, player.boot_id);
        write(2, 14, player.glove_id);  // Extended to 14 bits using extra space

        write(0, 32, player.copy_id);

        // Body proportions (all 4-bit values, packed two per byte)
        write(0, 4, player.neck_len);
        write(4, 4, player.neck_size);
        write(0, 4, player.shldr_hi);
        write(4, 4, player.shldr_wid);
        write(0, 4, player.chest);
        write(4, 4, player.waist);
        write(0, 4, player.arm_size);
        write(4, 4, player.arm_len);
        write(0, 4, player.thigh);
        write(4, 4, player.calf);
        write(0, 4, player.leg_len);
        write(4, 4, player.head_len);
        write(0, 4, player.head_wid);
        write(4, 4, player.head_dep);

        // Accessories & kit details
        write(0, 3, player.wrist_col_l);
        write(3, 3, player.wrist_col_r);
        write(6, 2, player.wrist_tape);
        write(0, 3, player.spec_col);
        write(3, 3, player.spec_style);
        write(6, 2, player.sleeve);
        write(0, 2, player.inners);
        write(2, 2, player.socks);
        write(4, 2, player.undershorts);
        write(6, 1, player.untucked);
        write(7, 1, player.ankle_tape);

        write(0, 1, player.gloves);
        write(1, 3, player.gloves_col);

        // Unknown D – single byte
        currentByte.value += 1;

        // Unknown E – 22 bytes
        currentByte.value += 22;

        write(0, 3, player.skin_col);

        // Unknown F – 1 byte
        currentByte.value += 1;

        // Unknown G – 18 bytes
        currentByte.value += 18;

        write(0, 4, player.iris_col);

        // Unknown H – 1 byte
        currentByte.value += 1;

        // Unknown I – 7 bytes
        currentByte.value += 7;

        return true;
    }

    /**
     * Writes player back over the entry at currentByte, the inverse of readPlayerEntry17
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     * @param {Object} player
     */
    static writePlayerEntry17(currentByte, data, player) {
        const write = (startBit, bits, value) => SaveFile.writeData(startBit, bits, currentByte, data, value);

        write(0, 32, player.id);
        currentByte.value += 0x6;

        write(0, 16, player.nation);

        write(0, 8, player.height);
        write(0, 8, player.gc2);
        write(0, 8, player.weight);
        write(0, 8, player.gc1);

        write(0, 7, player.atk);
        write(7, 7, player.def);
        write(6, 7, player.gk);
        write(5, 7, player.drib);
        write(4, 4, player.mo_fk);

        write(0, 7, player.finish);
        write(7, 7, player.lowpass);
        write(6, 7, player.loftpass);
        write(5, 7, player.header);
        write(4, 3, player.form);
        write(7, 1, player.b_edit_player);

        write(0, 7, player.swerve);
        write(7, 7, player.catching);
        write(6, 7, player.clearing);
        write(5, 7, player.reflex);
        write(4, 2, player.injury);

        // Unknown B - 1 bit (implicitly skipped)

        write(7, 1, player.b_edit_basicset);
        write(0, 7, player.body_ctrl);
        write(7, 7, player.phys_cont);
        write(6, 7, player.kick_pwr);
        write(5, 7, player.exp_pwr);
        write(4, 3, player.mo_armd);

        write(7, 1, player.b_edit_regpos);
        write(0, 6, player.age);
        write(6, 4, player.reg_pos);

        // Unknown C - 1 bit

        write(3, 5, player.play_style);
        write(0, 7, player.ball_ctrl);
        write(7, 7, player.ball_win);
        write(6, 2, player.weak_acc);
        write(0, 7, player.jump);
        write(7, 3, player.mo_armr);
        write(2, 3, player.mo_ck);
        write(5, 7, player.cover);
        write(4, 2, player.weak_use);

        write(6, 2, player.play_pos[0]);   // CF?
        write(0, 2, player.play_pos[1]);
        write(2, 2, player.play_pos[2]);
        write(4, 2, player.play_pos[3]);
        write(6, 2, player.play_pos[4]);
        write(0, 2, player.play_pos[5]);
        write(2, 2, player.play_pos[6]);
        write(4, 2, player.play_pos[7]);
        write(6, 2, player.play_pos[8]);
        write(0, 2, player.play_pos[9]);   // CB?
        write(2, 2, player.play_pos[10]);   // LB?
        write(4, 2, player.play_pos[11]);   // RB?
        write(6, 2, player.play_pos[12]);   // GK

        write(0, 2, player.mo_hunchd);
        write(2, 2, player.mo_hunchr);
        write(4, 2, player.mo_pk);

        write(6, 7, player.place_kick);

        write(5, 1, player.b_edit_playpos);
        write(6, 1, player.b_edit_ability);
        write(7, 1, player.b_edit_skill);

        write(0, 7, player.stamina);
        write(7, 7, player.speed);

        write(6, 1, player.b_edit_style);
        write(7, 1, player.b_edit_com);
        write(0, 1, player.b_edit_motion);
        write(1, 1, player.b_base_copy);

        // Unknown D - 1 bit

        write(3, 1, player.strong_foot);

        // Unknown E - 1 bit

        write(5, 1, player.com_style[0]);
        write(6, 1, player.com_style[1]);
        write(7, 1, player.com_style[2]);
        write(0, 1, player.com_style[3]);
        write(1, 1, player.com_style[4]);
        write(2, 1, player.com_style[5]);
        write(3, 1, player.com_style[6]);

        write(4, 1, player.play_skill[0]);
        write(5, 1, player.play_skill[1]);
        write(6, 1, player.play_skill[2]);
        write(7, 1, player.play_skill[3]);
        write(0, 1, player.play_skill[4]);
        write(1, 1, player.play_skill[5]);
        write(2, 1, player.play_skill[6]);
        write(3, 1, player.play_skill[7]);
        write(4, 1, player.play_skill[8]);
        write(5, 1, player.play_skill[9]);
        write(6, 1, player.play_skill[10]);
        write(7, 1, player.play_skill[11]);
        write(0, 1, player.play_skill[12]);
        write(1, 1, player.play_skill[13]);
        write(2, 1, player.play_skill[14]);
        write(3, 1, player.play_skill[15]);
        write(4, 1, player.play_skill[16]);
        write(5, 1, player.play_skill[17]);
        write(6, 1, player.play_skill[18]);
        write(7, 1, player.play_skill[19]);
        write(0, 1, player.play_skill[20]);
        write(1, 1, player.play_skill[21]);
        write(2, 1, player.play_skill[22]);
        write(3, 1, player.play_skill[23]);
        write(4, 1, player.play_skill[24]);
        write(5, 1, player.play_skill[25]);
        write(6, 1, player.play_skill[26]);
        write(7, 1, player.play_skill[27]);

        // Unknown F - full byte
        currentByte.value++;

        // Name
        SaveFile.writeString(data, currentByte.value, 46, player.name, "utf-8");
        currentByte.value += 46;

        // Shirt name
        SaveFile.writeString(data, currentByte.value, 18, player.shirt_name, "ascii", s => s.trim());
        currentByte.value += 18;

        // ────────────────────────────────────────────────
        // Appearance block starts here (same structure as 2016)
        // ────────────────────────────────────────────────

        currentByte.value += 4;  // playerID (32-bit)

        write(0, 1, player.b_edit_face);
        write(1, 1, player.b_edit_hair);
        write(2, 1, player.b_edit_phys);
        write(3, 1, player.b_edit_strip);

        write(4, 14, player.boot_id);
        write(2, 14, player.glove_id);

        write(0, 32, player.copy_id);

        write(0, 4, player.neck_len);
        write(4, 4, player.neck_size);
        write(0, 4, player.shldr_hi);
        write(4, 4, player.shldr_wid);
        write(0, 4, player.chest);
        write(4, 4, player.waist);
        write(0, 4, player.arm_size);
        write(4, 4, player.arm_len);
        write(0, 4, player.thigh);
        write(4, 4, player.calf);
        write(0, 4, player.leg_len);
        write(4, 4, player.head_len);
        write(0, 4, player.head_wid);
        write(4, 4, player.head_dep);

        write(0, 3, player.wrist_col_l);
        write(3, 3, player.wrist_col_r);
        write(6, 2, player.wrist_tape);
        write(0, 3, player.spec_col);
        write(3, 3, player.spec_style);
        write(6, 2, player.sleeve);
        write(0, 2, player.inners);
        write(2, 2, player.socks);
        write(4, 2, player.undershorts);
        write(6, 1, player.untucked);
        write(7, 1, player.ankle_tape);

        write(0, 1, player.gloves);
        write(1, 3, player.gloves_col);

        currentByte.value++;     // Unknown D
        currentByte.value += 22; // Unknown E

        write(0, 3, player.skin_col);

        currentByte.value++;     // Unknown F
        currentByte.value += 18; // Unknown G

        write(0, 4, player.iris_col);

        currentByte.value++;     // Unknown H
        currentByte.value += 7;  // Unknown I

    }

    /**
     * Writes player back over the entry at currentByte, the inverse of readPlayerEntry18
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     * @param {Object} player
     */
    static writePlayerEntry18(currentByte, data, player) {
        const write = (startBit, bits, value) => SaveFile.writeData(startBit, bits, currentByte, data, value);

        // ID – little-endian 32-bit
        write(0, 32, player.id);

        currentByte.value += 6;  // skip 0x6 bytes

        // Nation – 16-bit little-endian
        write(0, 16, player.nation);

        write(0, 8, player.height);
        write(0, 8, player.weight);
        write(0, 8, player.gc1);
        write(0, 8, player.gc2);

        // ────────────────────────────────────────────────
        // Stats – many use cross-byte 7-bit values
        // ────────────────────────────────────────────────

        write(0, 7, player.atk);
        write(7, 7, player.def);
        write(6, 7, player.gk);
        write(5, 7, player.drib);
        write(4, 4, player.mo_fk);

        write(0, 7, player.finish);
        write(7, 7, player.lowpass);
        write(6, 7, player.loftpass);
        write(5, 7, player.header);
        write(4, 3, player.form);
        write(7, 1, player.b_edit_player);

        write(0, 7, player.swerve);
        write(7, 7, player.catching);
        write(6, 7, player.clearing);
        write(5, 7, player.reflex);
        write(4, 2, player.injury);

        // Unknown B – 1 bit (skipped)

        write(7, 1, player.b_edit_basicset);

        write(0, 7, player.body_ctrl);
        write(7, 7, player.phys_cont);
        write(6, 7, player.kick_pwr);
        write(5, 7, player.exp_pwr);

        // ────────────────────────────────────────────────
        // From here – structure changed compared to 2017
        // ────────────────────────────────────────────────

        //Unknown motion - 3 bits

        write(7, 1, player.b_edit_regpos);

        write(0, 6, player.age);
        write(6, 4, player.reg_pos);
        write(3, 5, player.play_style);

        write(0, 7, player.ball_ctrl);
        write(7, 7, player.ball_win);
        write(6, 2, player.weak_acc);

        write(0, 7, player.jump);
        write(7, 2, player.mo_armd);
        write(2, 3, player.mo_armr);
        write(5, 3, player.mo_ck);

        write(0, 7, player.cover);
        write(7, 2, player.weak_use);

        write(1, 2, player.play_pos[0]);
        write(3, 2, player.play_pos[1]);
        write(5, 2, player.play_pos[2]);
        write(7, 1, player.b_edit_playpos);

        write(0, 2, player.play_pos[4]);
        write(2, 2, player.play_pos[5]);
        write(4, 2, player.play_pos[6]);
        write(6, 2, player.play_pos[7]);

        write(0, 2, player.play_pos[8]);
        write(2, 2, player.play_pos[9]);
        write(4, 2, player.play_pos[10]);
        write(6, 2, player.play_pos[11]);

        write(0, 2, player.play_pos[12]);

        write(2, 2, player.mo_hunchd);
        write(4, 2, player.mo_hunchr);

        write(6, 2, player.mo_pk);

        write(0, 7, player.place_kick);
        write(7, 1, player.b_edit_ability);

        write(0, 7, player.stamina);
        write(7, 2, player.play_pos[3]);

        write(1, 7, player.speed);

        write(0, 1, player.b_edit_skill);
        write(1, 1, player.b_edit_style);
        write(2, 1, player.b_edit_com);
        write(3, 1, player.b_edit_motion);
        write(4, 1, player.b_base_copy);
        write(6, 1, player.strong_foot);
        currentByte.value++;

        for (let i = 0; i < 7; i++)
            write(i, 1, player.com_style[i]);

        // Skills 0–27 follow the COM styles bit by bit
        for (let i = 0; i < 28; i++)
            write((i + 7) % 8, 1, player.play_skill[i]);

        currentByte.value++;  // Unknown F – 5 bits remaining

        // Name
        SaveFile.writeString(data, currentByte.value, 46, player.name, "utf-8");
        currentByte.value += 46;

        // Shirt name
        SaveFile.writeString(data, currentByte.value, 18, player.shirt_name, "ascii", s => s.trim());
        currentByte.value += 18;

        // ────────────────────────────────────────────────
        // Appearance block (very similar to 2016/2017)
        // ────────────────────────────────────────────────

        currentByte.value += 4;  // playerID

        write(0, 1, player.b_edit_face);
        write(1, 1, player.b_edit_hair);
        write(2, 1, player.b_edit_phys);
        write(3, 1, player.b_edit_strip);

        write(4, 14, player.boot_id);
        write(2, 14, player.glove_id);      // 14 bits total

        write(0, 32, player.copy_id);

        // Body proportions (4-bit pairs)
        write(0, 4, player.neck_len);
        write(4, 4, player.neck_size);
        write(0, 4, player.shldr_hi);
        write(4, 4, player.shldr_wid);
        write(0, 4, player.chest);
        write(4, 4, player.waist);
        write(0, 4, player.arm_size);
        write(4, 4, player.arm_len);
        write(0, 4, player.thigh);
        write(4, 4, player.calf);
        write(0, 4, player.leg_len);
        write(4, 4, player.head_len);
        write(0, 4, player.head_wid);
        write(4, 4, player.head_dep);

        write(0, 3, player.wrist_col_l);
        write(3, 3, player.wrist_col_r);
        write(6, 2, player.wrist_tape);

        write(0, 3, player.spec_col);
        write(3, 3, player.spec_style);
        write(6, 2, player.sleeve);

        write(0, 2, player.inners);
        write(2, 2, player.socks);
        write(4, 2, player.undershorts);
        write(6, 1, player.untucked);
        write(7, 1, player.ankle_tape);

        write(0, 1, player.gloves);
        write(1, 3, player.gloves_col);

        // Unknown D
        currentByte.value++;

        // Unknown E
        currentByte.value += 22;

        // A custom skin read as 0 is written back as 7
        write(0, 3, SaveFile.storedSkinCol(player));

        // Unknown F
        currentByte.value++;

        // Unknown G
        currentByte.value += 18;

        write(0, 4, player.iris_col);

        // Unknown H
        currentByte.value++;

        // Unknown I
        currentByte.value += 7;
    }


    /**
     * Writes player back over the entry at currentByte, the inverse of readPlayerEntry19
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     * @param {Object} player
     */
    static writePlayerEntry19(currentByte, data, player) {
        const write = (startBit, bits, value) => SaveFile.writeData(startBit, bits, currentByte, data, value);

        // ID – using read_data (commented alternative is manual LE 32-bit)
        write(0, 4*8, player.id);
        currentByte.value += 4;

        // Nation – 16-bit LE
        write(0, 16, player.nation);

        write(0, 8, player.height);
        write(0, 8, player.weight);
        write(0, 8, player.gc1);
        write(0, 8, player.gc2);

        // atk + ball_ctrl (cross-byte 7-bit)
        write(0, 7, player.atk);
        write(7, 7, player.ball_ctrl);

        write(6, 2, player.weak_use);

        write(0, 7, player.lowpass);
        write(7, 7, player.loftpass);
        write(6, 7, player.finish);
        write(5, 7, player.place_kick);
        write(4, 3, player.mo_armd);
        currentByte.value++;  // Unknown A – 1 bit

        write(0, 7, player.header);
        write(7, 7, player.def);
        write(6, 7, player.ball_win);
        write(5, 7, player.kick_pwr);
        write(4, 3, player.mo_armr);
        currentByte.value++;  // Unknown B – 1 bit

        write(0, 7, player.exp_pwr);
        write(7, 7, player.body_ctrl);
        write(6, 7, player.phys_cont);
        write(5, 7, player.jump);
        write(4, 3, player.mo_ck);
        currentByte.value++;  // Unknown C – 1 bit

        write(0, 7, player.catching);
        write(7, 7, player.clearing);
        write(6, 7, player.reflex);
        write(5, 7, player.cover);
        write(4, 3, player.form);
        write(7, 1, player.b_edit_player);

        write(0, 4, player.reg_pos);
        // Unknown D – 1 bit

        write(5, 5, player.play_style);
        write(2, 4, player.mo_fk);
        // Unknown E – 1 bit

        write(7, 7, player.swerve);
        write(6, 7, player.speed);
        write(5, 3, player.star);
        write(0, 7, player.stamina);
        write(7, 7, player.gk);
        write(6, 3, player.mo_pk);
        write(1, 7, player.drib);
        write(0, 2, player.weak_acc);
        write(2, 2, player.injury);

        // Playing positions – reordered compared to earlier versions
        write(4, 2, player.play_pos[12]);   // GK
        write(6, 2, player.play_pos[9]);   // CB
        write(0, 2, player.play_pos[10]);   // LB
        write(2, 2, player.play_pos[11]);   // RB
        write(4, 2, player.play_pos[5]);   // DMF
        write(6, 2, player.play_pos[6]);   // CMF
        write(0, 2, player.play_pos[7]);   // LMF
        write(2, 2, player.play_pos[8]);   // RMF
        write(4, 2, player.play_pos[4]);   // AMF
        write(6, 2, player.play_pos[2]);   // LWF
        write(0, 2, player.play_pos[3]);   // RWF
        write(2, 2, player.play_pos[1]);   // SS
        write(4, 2, player.play_pos[0]);   // CF

        write(6, 2, player.mo_hunchd);
        write(0, 2, player.mo_hunchr);

        write(2, 6, player.age);

        write(0, 1, player.b_edit_basicset);
        write(1, 1, player.b_edit_regpos);
        write(2, 1, player.b_edit_playpos);
        write(3, 1, player.b_edit_ability);
        write(4, 1, player.b_edit_skill);
        write(5, 1, player.b_edit_style);
        write(6, 1, player.b_edit_com);
        write(7, 1, player.b_edit_motion);
        // Unknown F – 1 bit

        write(1, 1, player.strong_foot);

        write(2, 1, player.com_style[0]);
        write(3, 1, player.com_style[1]);
        write(4, 1, player.com_style[2]);
        write(5, 1, player.com_style[3]);
        write(6, 1, player.com_style[4]);
        write(7, 1, player.com_style[5]);
        write(0, 1, player.com_style[6]);

        // Player skills – sparse indexing (same pattern as 2020)
        write(1, 1, player.play_skill[0]);
        write(2, 1, player.play_skill[28]);
        write(3, 1, player.play_skill[1]);
        write(4, 1, player.play_skill[2]);
        write(5, 1, player.play_skill[3]);
        write(6, 1, player.play_skill[29]);
        write(7, 1, player.play_skill[4]);
        write(0, 1, player.play_skill[5]);
        write(1, 1, player.play_skill[30]);
        write(2, 1, player.play_skill[6]);
        write(3, 1, player.play_skill[7]);
        write(4, 1, player.play_skill[31]);
        write(5, 1, player.play_skill[8]);
        write(6, 1, player.play_skill[32]);
        write(7, 1, player.play_skill[33]);
        write(0, 1, player.play_skill[9]);
        write(1, 1, player.play_skill[10]);
        write(2, 1, player.play_skill[11]);
        write(3, 1, player.play_skill[12]);
        write(4, 1, player.play_skill[13]);
        write(5, 1, player.play_skill[14]);
        write(6, 1, player.play_skill[15]);
        write(7, 1, player.play_skill[16]);
        write(0, 1, player.play_skill[34]);
        write(1, 1, player.play_skill[17]);
        write(2, 1, player.play_skill[18]);
        write(3, 1, player.play_skill[35]);
        write(4, 1, player.play_skill[19]);
        write(5, 1, player.play_skill[20]);
        write(6, 1, player.play_skill[36]);
        write(7, 1, player.play_skill[37]);
        write(0, 1, player.play_skill[21]);
        write(1, 1, player.play_skill[22]);
        write(2, 1, player.play_skill[23]);
        write(3, 1, player.play_skill[38]);
        write(4, 1, player.play_skill[24]);
        write(5, 1, player.play_skill[25]);
        write(6, 1, player.play_skill[26]);
        write(7, 1, player.play_skill[27]);

        currentByte.value++;  // Unknown G – full byte

        // Name
        SaveFile.writeString(data, currentByte.value, 46, player.name, "utf-8");
        currentByte.value += 46;

        // Shirt name
        SaveFile.writeString(data, currentByte.value, 18, player.shirt_name, "ascii", s => s.trim());
        currentByte.value += 18;

        // ────────────────────────────────────────────────
        // Appearance block – almost identical to PES 2018
        // ────────────────────────────────────────────────

        currentByte.value += 4;  // playerID

        write(0, 1, player.b_edit_face);
        write(1, 1, player.b_edit_hair);
        write(2, 1, player.b_edit_phys);
        write(3, 1, player.b_edit_strip);

        write(4, 14, player.boot_id);
        write(2, 14, player.glove_id);     // 14 bits, ends on the byte boundary

        write(0, 32, player.copy_id);

        // Body proportions (4-bit pairs)
        write(0, 4, player.neck_len);
        write(4, 4, player.neck_size);
        write(0, 4, player.shldr_hi);
        write(4, 4, player.shldr_wid);
        write(0, 4, player.chest);
        write(4, 4, player.waist);
        write(0, 4, player.arm_size);
        write(4, 4, player.arm_len);
        write(0, 4, player.thigh);
        write(4, 4, player.calf);
        write(0, 4, player.leg_len);
        write(4, 4, player.head_len);
        write(0, 4, player.head_wid);
        write(4, 4, player.head_dep);

        write(0, 3, player.wrist_col_l);
        write(3, 3, player.wrist_col_r);
        write(6, 2, player.wrist_tape);

        write(0, 3, player.spec_col);
        write(3, 3, player.spec_style);
        write(6, 2, player.sleeve);

        write(0, 2, player.inners);
        write(2, 2, player.socks);
        write(4, 2, player.undershorts);
        write(6, 1, player.untucked);
        write(7, 1, player.ankle_tape);

        write(0, 1, player.gloves);
        write(1, 3, player.gloves_col);

        currentByte.value++;           // Unknown D
        currentByte.value += 22;       // Unknown E

        // A custom skin read as 0 is written back as 7
        write(0, 3, SaveFile.storedSkinCol(player));

        currentByte.value++;           // Unknown F
        currentByte.value += 18;       // Unknown G

        write(0, 4, player.iris_col);

        currentByte.value++;           // Unknown H
        currentByte.value += 7;        // Unknown I

    }

    /**
     * Writes player back over the entry at currentByte, the inverse of readPlayerEntry20_21
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     * @param {Object} player
     */
    static writePlayerEntry20_21(currentByte, data, player) {
        // Helper to make code more readable
        const write = (start, bits, value) => SaveFile.writeData(start, bits, currentByte, data, value);

        write(0, 32, player.id);

        currentByte.value += 4;   // 4 bytes alignment
        
        write(0, 16, player.nation);
        write(0, 8, player.height);
        write(0, 8, player.weight);
        write(0, 8, player.gc1);
        write(0, 8, player.gc2);

        write(0, 7, player.atk);
        write(7, 7, player.ball_ctrl);
        write(6, 2, player.weak_use);
        write(0, 7, player.tight_pos);
        write(7, 7, player.lowpass);
        write(6, 7, player.loftpass);
        write(5, 7, player.finish);

        write(4, 4, player.mo_armd);
        write(0, 7, player.place_kick);
        write(7, 7, player.swerve);   // Curl
        write(6, 7, player.speed);
        write(5, 7, player.exp_pwr);   // Acceleration
        write(4, 4, player.mo_armr);

        write(0, 7, player.jump);
        write(7, 7, player.phys_cont);
        write(6, 7, player.body_ctrl);   // Balance
        write(5, 7, player.stamina);
        write(4, 4, player.mo_ck);

        write(0, 7, player.ball_win);
        write(7, 7, player.aggres);
        write(6, 7, player.gk);   // GK Awareness
        write(5, 7, player.catching);
        write(4, 3, player.form);
        write(7, 1, player.b_edit_player);

        write(0, 7, player.cover);   // GK Reach
        write(7, 6, player.age);
        write(5, 4, player.reg_pos);
        //Unknown A - 1/1
        write(2, 5, player.play_style);
        write(7, 5, player.mo_fk);
        write(4, 3, player.star);
        write(7, 1, player.b_edit_basicset);
        write(0, 7, player.def);
        write(7, 7, player.clearing);
        write(6, 7, player.header);
        write(5, 3, player.mo_hunchd);
        write(0, 3, player.mo_hunchr);
        write(3, 3, player.mo_pk);
        write(6, 2, player.weak_acc);
        write(0, 7, player.drib);
        write(7, 2, player.injury);
        write(1, 2, player.play_attit);
        write(3, 2, player.mo_drib);

        // Playing positions
        write(5, 2, player.play_pos[12]);  // GK
        write(7, 2, player.play_pos[9]);  // CB
        write(1, 2, player.play_pos[10]);  // LB
        write(3, 2, player.play_pos[11]);  // RB
        write(5, 2, player.play_pos[5]);  // DMF
        write(7, 2, player.play_pos[6]);  // CMF
        write(1, 2, player.play_pos[7]);  // LMF
        write(3, 2, player.play_pos[8]);  // RMF
        write(5, 2, player.play_pos[4]);  // AMF
        write(7, 1, player.b_edit_regpos);
        write(0, 2, player.play_pos[3]);   // RWF
        write(2, 2, player.play_pos[1]);   // SS
        write(4, 2, player.play_pos[0]);   // CF
        write(6, 7, player.reflex);
        write(5, 7, player.kick_pwr);
        write(4, 2, player.play_pos[2]);   // LWF
        write(6, 1, player.b_edit_playpos);
        write(7, 1, player.b_edit_ability);
        write(0, 1, player.b_edit_skill);
        write(1, 1, player.b_edit_style);
        write(2, 1, player.b_edit_com);
        write(3, 1, player.b_edit_motion);

        //Unknown C - 4/1
        write(5, 1, player.strong_foot);
        write(6, 1, player.strong_hand);

        // COM playing styles
        write(7, 1, player.com_style[0]);
        write(0, 1, player.com_style[1]);
        write(1, 1, player.com_style[2]);
        write(2, 1, player.com_style[3]);
        write(3, 1, player.com_style[4]);
        write(4, 1, player.com_style[5]);
        write(5, 1, player.com_style[6]);

        // Player skills
        write(6, 1, player.play_skill[0]);   // Scissors Feint
        write(7, 1, player.play_skill[28]);   // Double Touch
        write(0, 1, player.play_skill[1]);   // Flip flap
        write(1, 1, player.play_skill[2]);   // Marseille turn
        write(2, 1, player.play_skill[3]); //Sombrero
        write(3, 1, player.play_skill[29]); //Crossover Turn
        write(4, 1, player.play_skill[4]); //Cut Behind & Turn
        write(5, 1, player.play_skill[5]); //Scotch Move
        write(6, 1, player.play_skill[30]); //Step on Skill
        write(7, 1, player.play_skill[6]); //Heading
        write(0, 1, player.play_skill[7]); //Long range drive
        write(1, 1, player.play_skill[31]); //Chip Shot
        write(2, 1, player.play_skill[39]); //Long range shooting
        write(3, 1, player.play_skill[8]); //Knuckle shot
        write(4, 1, player.play_skill[32]); //Dipping Shots
        write(5, 1, player.play_skill[33]); //Rising Shots
        write(6, 1, player.play_skill[9]); //Acro finishing
        write(7, 1, player.play_skill[10]); //Heel trick
        write(0, 1, player.play_skill[11]); //First time shot
        write(1, 1, player.play_skill[12]); //One touch pass
        write(2, 1, player.play_skill[40]); //Through passing
        write(3, 1, player.play_skill[13]); //Weighted pass
        write(4, 1, player.play_skill[14]); //Pinpoint crossing
        write(5, 1, player.play_skill[15]); //Outside curler
        write(6, 1, player.play_skill[16]); //Rabona
        write(7, 1, player.play_skill[34]); //No Look Pass
        write(0, 1, player.play_skill[17]); //Low Lofted Pass
        write(1, 1, player.play_skill[18]); //Low Punt trajectory
        write(2, 1, player.play_skill[35]); //GK High Punt Trajectory
        write(3, 1, player.play_skill[19]); //Long throw
        write(4, 1, player.play_skill[20]); //GK long throw
        write(5, 1, player.play_skill[36]); //Penalty Specialist
        write(6, 1, player.play_skill[37]); //GK Penalty Specialist
        write(7, 1, player.play_skill[21]); //Malicia
        write(0, 1, player.play_skill[22]); //Man marking
        write(1, 1, player.play_skill[23]); //Track back
        write(2, 1, player.play_skill[38]); //Interception
        write(3, 1, player.play_skill[24]); //Acro clear
        write(4, 1, player.play_skill[25]); //Captaincy
        write(5, 1, player.play_skill[26]); //Super sub
        write(6, 1, player.play_skill[27]); //Fighting spirit

        currentByte.value++; // Unknown D 7/1

        // Name (UTF-8) - max 60 characters + null
        SaveFile.writeString(data, currentByte.value, 61, player.name, "utf-8");
        currentByte.value += 61;

        // Shirt name (maybe ASCII)
        SaveFile.writeString(data, currentByte.value, 21, player.shirt_name, "ascii");
        currentByte.value += 61; // original skips 61 bytes (probably padding)

        currentByte.value += 64; // Print Name (National Team)

        // Appearance
        currentByte.value += 4; // playerID

        write(0, 1, player.b_edit_face);
        write(1, 1, player.b_edit_hair);
        write(2, 1, player.b_edit_phys);
        write(3, 1, player.b_edit_strip);

        write(4, 14, player.boot_id);
        write(2, 14, player.glove_id);
        write(0, 32, player.copy_id);

        // Body proportions (4-bit values)
        write(0, 4, player.neck_len);
        write(4, 4, player.neck_size);
        write(0, 4, player.shldr_hi);
        write(4, 4, player.shldr_wid);
        write(0, 4, player.chest);
        write(4, 4, player.waist);
        write(0, 4, player.arm_size);
        write(4, 4, player.arm_len);
        write(0, 4, player.thigh);
        write(4, 4, player.calf);
        write(0, 4, player.leg_len);
        write(4, 4, player.head_len);
        write(0, 4, player.head_wid);
        write(4, 4, player.head_dep);
        write(0, 3, player.wrist_col_l);
        write(3, 3, player.wrist_col_r);
        write(6, 2, player.wrist_tape);
        write(0, 3, player.spec_col);
        write(3, 3, player.spec_style);
        write(6, 2, player.sleeve);
        write(0, 2, player.inners);
        write(2, 2, player.socks);
        write(4, 2, player.undershorts);
        write(6, 1, player.untucked);
        write(7, 1, player.ankle_tape);
        //0x16:0
        write(0, 1, player.gloves);
        write(1, 3, player.gloves_col);
        //Skip face settings
        currentByte.value += 23;
        //0x2D:0
        //No custom skin in 18+, so a custom skin read as 0 is written back as 7
        write(0, 3, SaveFile.storedSkinCol(player));
        //Skip additional face settings
        currentByte.value += 19;
        //0x40:0
        write(0, 4, player.iris_col);
        //Skip hair settings
        currentByte.value += 8;

    }

    /**
     * Reads PES 15-18 roster data into the teams object
     * @param {Object} teams 
     * @param {{ value: number }} currentByte 
     * @param {Uint8Array} data 
     */
    static readRoster15_18(teams, currentByte, data) {
        let ii, player_id;
        const t_ind = SaveFile.readData(0, 4*8, currentByte, data);
        const team = teams[t_ind] ?? { roster: [] } //Teams without players aren't loaded

        team.num_on_team = 0
        team.players = []
        for(ii=0;ii<32;ii++) {
            player_id = SaveFile.readData(0, 4*8, currentByte, data);

            team.players[ii] = player_id;
            if(player_id) team.num_on_team++; //Increment player count
        }
        //Hide team with no players
        if(team.players[0] == 0)
            team.b_show = false;
        else team.b_show = true;

        team.numbers = []
        for(ii=0;ii<32;ii++) {
            //Player shirt numbers
            const num = SaveFile.readData(0, 1*8, currentByte, data);
            team.numbers[ii] = num;
            if(team.roster[ii])
                team.roster[ii].num = num;
        }
    }

    /**
     * Reads PES 19 roster data into the teams object
     * @param {Object} teams 
     * @param {{ value: number }} currentByte 
     * @param {Uint8Array} data 
     */
    static readRoster19(teams, currentByte, data) {
        let ii, player_id;
        const t_ind = SaveFile.readData(0, 4*8, currentByte, data)//,
        const team = teams[t_ind] ?? { roster: [] } //Teams without players aren't loaded
        //numTeams = Object.keys(teams).length;
        
        /*for(t_ind=0; t_ind < numTeams; t_ind++) {
            if(team_id == teams[t_ind].id) break;
        }*/

        team.num_on_team = 0
        team.players = []
        for(ii=0;ii<40;ii++) {
            player_id = SaveFile.readData(0, 4*8, currentByte, data);

            team.players[ii] = player_id;
            if(player_id) team.num_on_team++; //Increment player count
        }
        //Hide team with no players
        if(team.players[0] == 0)
            team.b_show = false;
        else team.b_show = true;

        team.numbers = []
        for(ii=0;ii<40;ii++) {
            //Player shirt numbers
            const num = SaveFile.readData(0, 2*8, currentByte, data);
            team.numbers[ii] = num;
            if(team.roster[ii])
                team.roster[ii].num = num;
        }
    }

    /**
     * Reads PES 20/21 roster data into the teams object
     * @param {Object} teams 
     * @param {{ value: number }} currentByte 
     * @param {Uint8Array} data 
     */
    static readRoster20_21(teams, currentByte, data) {
        SaveFile.readRoster19(teams, currentByte, data);
        currentByte.value += 40; //Unknown A
    }

    /**
     * Reads PES 15 tactics data into the teams object
     * @param {Object} teams 
     * @param {{ value: number }} currentByte 
     * @param {Uint8Array} data 
     */
    static readTactics15(teams, currentByte, data) {
        //Total block length: 0x204 bytes
        //let t_ind;
        const t_ind = SaveFile.readData(0, 4*8, currentByte, data)//,
        const team = teams[t_ind] ?? { roster: [] } //Teams without players aren't loaded
        //numTeams = Object.keys(teams).length;

        //Find team array entry that matches this ID
        /*for(t_ind=0;t_ind<numTeams;t_ind++)
        {
            if(team_id == teams[t_ind].id) break;
        }*/
        //currentByte.value+=0x1E0;

        /*const nextValue = currentByte.value + 0x1F6

        teams[t_ind].starting11 = []
        //Starting lineup
        //for(let ii=0; ii<11; ii++)
        while(currentByte.value < nextValue)
        {
            teams[t_ind].starting11[ii] = SaveFile.readData(0, 1*8, currentByte, data);
        }
        if(t_ind == 870)
            debugger;*/
        currentByte.value+=0x1F6;
        
        const cap = SaveFile.readData(0, 1*8, currentByte.value, data);
        team.captain_ind = cap;
        if(team.roster[cap])
            team.roster[cap].cap = true
        
        currentByte.value+=0xA;
    }

    /**
     * Reads PES 16 tactics data into the teams object
     * @param {Object} teams 
     * @param {{ value: number }} currentByte 
     * @param {Uint8Array} data 
     */
    static readTactics16(teams, currentByte, data) {
        //Total block length: 0x274 bytes
        //let t_ind;
        const t_ind = SaveFile.readData(0, 4*8, currentByte, data)//,
        const team = teams[t_ind] ?? { roster: [] } //Teams without players aren't loaded
        //numTeams = Object.keys(teams).length;

        //Find team array entry that matches this ID
        /*for(t_ind=0;t_ind<numTeams;t_ind++)
        {
            if(team_id == teams[t_ind].id) break;
        }*/
        /*const nextValue = currentByte.value + 0x1FA

        teams[t_ind].starting11 = []
        //Starting lineup
        //for(let ii=0; ii<11; ii++)
        let ii = 0;
        while(currentByte.value < nextValue)
        {
            teams[t_ind].starting11[ii] = SaveFile.readData(0, 1*8, currentByte, data);
            ii++;
        }
        if(t_ind == 870)
            debugger;*/
        currentByte.value+=0x1FA;

        const cap = SaveFile.readData(0, 1*8, currentByte.value, data);
        team.captain_ind = cap;
        if(team.roster[cap])
            team.roster[cap].cap = true
        currentByte.value+=0xA;
    }

    /**
     * Reads PES 17/18 tactics data into the teams object
     * @param {Object} teams 
     * @param {{ value: number }} currentByte 
     * @param {Uint8Array} data 
     */
    static readTactics17_18(teams, currentByte, data) {
        //Total block length: 0x274 bytes
        //let t_ind;
        const t_ind = SaveFile.readData(0, 4*8, currentByte, data)//,
        const team = teams[t_ind] ?? { roster: [] } //Teams without players aren't loaded
        //numTeams = Object.keys(teams).length;

        //Find team array entry that matches this ID
        /*for(t_ind=0;t_ind<numTeams;t_ind++)
        {
            if(team_id == teams[t_ind].id) break;
        }*/
        currentByte.value+=0x1E0;

        team.starting11 = []
        //Starting lineup
        for(let ii=0; ii<11; ii++)
        {
            team.starting11[ii] = SaveFile.readData(0, 1*8, currentByte, data);
        }
        currentByte.value+=0x1E;
        //Captain index at byte 0x215:
        const cap = SaveFile.readData(0, 1*8, currentByte.value, data);
        team.captain_ind = cap;
        if(team.roster[cap])
            team.roster[cap].cap = true
        currentByte.value+=0x67;
    }

    /**
     * Reads PES 19-21 tactics data into the teams object
     * @param {Object} teams 
     * @param {{ value: number }} currentByte 
     * @param {Uint8Array} data 
     */
    static readTactics19_21(teams, currentByte, data) {
        //Total block length: 0x274 bytes
        //let t_ind;
        const t_ind = SaveFile.readData(0, 4*8, currentByte, data)//,
        const team = teams[t_ind] ?? { roster: [] } //Teams without players aren't loaded
        //numTeams = Object.keys(teams).length;

        //Find team array entry that matches this ID
        /*for(t_ind=0;t_ind<numTeams;t_ind++)
        {
            if(team_id == teams[t_ind].id) break;
        }*/
        currentByte.value+=0x1E0;

        team.starting11 = []
        //Starting lineup
        for(let ii=0; ii<11; ii++)
        {
            team.starting11[ii] = SaveFile.readData(0, 1*8, currentByte, data);
        }
        currentByte.value+=0x26;
        //Captain index at byte 0x215:
        const cap = SaveFile.readData(0, 1*8, currentByte.value, data);
        team.captain_ind = cap;
        if(team.roster[cap])
            team.roster[cap].cap = true
        currentByte.value+=0x5f;
    }

    /**
     * Writes a PES 15-18 roster entry from the teams object, the inverse of readRoster15_18
     * @param {Object} teams
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     */
    static writeRoster15_18(teams, currentByte, data) {
        const team = teams[SaveFile.readData(0, 4*8, currentByte, data)];

        for(let ii=0;ii<32;ii++)
            SaveFile.writeData(0, 4*8, currentByte, data, team?.players?.[ii]);

        for(let ii=0;ii<32;ii++)
            SaveFile.writeData(0, 1*8, currentByte, data, team?.numbers?.[ii]);
    }

    /**
     * Writes a PES 19 roster entry from the teams object, the inverse of readRoster19
     * @param {Object} teams
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     */
    static writeRoster19(teams, currentByte, data) {
        const team = teams[SaveFile.readData(0, 4*8, currentByte, data)];

        for(let ii=0;ii<40;ii++)
            SaveFile.writeData(0, 4*8, currentByte, data, team?.players?.[ii]);

        for(let ii=0;ii<40;ii++)
            SaveFile.writeData(0, 2*8, currentByte, data, team?.numbers?.[ii]);
    }

    /**
     * Writes a PES 20/21 roster entry from the teams object, the inverse of readRoster20_21
     * @param {Object} teams
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     */
    static writeRoster20_21(teams, currentByte, data) {
        SaveFile.writeRoster19(teams, currentByte, data);
        currentByte.value += 40; //Unknown A
    }

    /**
     * Writes a PES 15 tactics entry from the teams object, the inverse of readTactics15
     * @param {Object} teams
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     */
    static writeTactics15(teams, currentByte, data) {
        const team = teams[SaveFile.readData(0, 4*8, currentByte, data)];
        currentByte.value+=0x1F6;
        SaveFile.writeData(0, 1*8, currentByte.value, data, team?.captain_ind);
        currentByte.value+=0xA;
    }

    /**
     * Writes a PES 16 tactics entry from the teams object, the inverse of readTactics16
     * @param {Object} teams
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     */
    static writeTactics16(teams, currentByte, data) {
        const team = teams[SaveFile.readData(0, 4*8, currentByte, data)];
        currentByte.value+=0x1FA;
        SaveFile.writeData(0, 1*8, currentByte.value, data, team?.captain_ind);
        currentByte.value+=0xA;
    }

    /**
     * Writes a PES 17/18 tactics entry from the teams object, the inverse of readTactics17_18
     * @param {Object} teams
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     */
    static writeTactics17_18(teams, currentByte, data) {
        const team = teams[SaveFile.readData(0, 4*8, currentByte, data)];
        currentByte.value+=0x1E0;
        //Starting lineup
        for(let ii=0; ii<11; ii++)
            SaveFile.writeData(0, 1*8, currentByte, data, team?.starting11?.[ii]);
        currentByte.value+=0x1E;
        SaveFile.writeData(0, 1*8, currentByte.value, data, team?.captain_ind);
        currentByte.value+=0x67;
    }

    /**
     * Writes a PES 19-21 tactics entry from the teams object, the inverse of readTactics19_21
     * @param {Object} teams
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     */
    static writeTactics19_21(teams, currentByte, data) {
        const team = teams[SaveFile.readData(0, 4*8, currentByte, data)];
        currentByte.value+=0x1E0;
        //Starting lineup
        for(let ii=0; ii<11; ii++)
            SaveFile.writeData(0, 1*8, currentByte, data, team?.starting11?.[ii]);
        currentByte.value+=0x26;
        SaveFile.writeData(0, 1*8, currentByte.value, data, team?.captain_ind);
        currentByte.value+=0x5f;
    }

    static readPlayerEntry = {
        '15': SaveFile.readPlayerEntry15,
        '16': SaveFile.readPlayerEntry16,
        '17': SaveFile.readPlayerEntry17,
        '18': SaveFile.readPlayerEntry18,
        '19': SaveFile.readPlayerEntry19,
        '20': SaveFile.readPlayerEntry20_21,
        '21': SaveFile.readPlayerEntry20_21
    }

    static readAppearanceEntry = {
        '15': SaveFile.readAppearanceEntry15,
        '16': SaveFile.readAppearanceEntry16,
        // '17': SaveFile.readAppearanceEntry17,
        //'18': SaveFile.readAppearanceEntry18,
        //'19': SaveFile.readAppearanceEntry19,
        //'20': SaveFile.readAppearanceEntry20,
        //'21': SaveFile.readAppearanceEntry20
    }

    static readRoster = {
        '15': SaveFile.readRoster15_18,
        '16': SaveFile.readRoster15_18,
        '17': SaveFile.readRoster15_18,
        '18': SaveFile.readRoster15_18,
        '19': SaveFile.readRoster19,
        '20': SaveFile.readRoster20_21,
        '21': SaveFile.readRoster20_21
    }

    static readTactics = {
        '15': SaveFile.readTactics15,
        '16': SaveFile.readTactics16,
        '17': SaveFile.readTactics17_18,
        '18': SaveFile.readTactics17_18,
        '19': SaveFile.readTactics19_21,
        '20': SaveFile.readTactics19_21,
        '21': SaveFile.readTactics19_21
    }

    static writePlayerEntry = {
        '15': SaveFile.writePlayerEntry15,
        '16': SaveFile.writePlayerEntry16,
        '17': SaveFile.writePlayerEntry17,
        '18': SaveFile.writePlayerEntry18,
        '19': SaveFile.writePlayerEntry19,
        '20': SaveFile.writePlayerEntry20_21,
        '21': SaveFile.writePlayerEntry20_21
    }

    static writeAppearanceEntry = {
        '15': SaveFile.writeAppearanceEntry15,
        '16': SaveFile.writeAppearanceEntry16,
    }

    static writeRoster = {
        '15': SaveFile.writeRoster15_18,
        '16': SaveFile.writeRoster15_18,
        '17': SaveFile.writeRoster15_18,
        '18': SaveFile.writeRoster15_18,
        '19': SaveFile.writeRoster19,
        '20': SaveFile.writeRoster20_21,
        '21': SaveFile.writeRoster20_21
    }

    static writeTactics = {
        '15': SaveFile.writeTactics15,
        '16': SaveFile.writeTactics16,
        '17': SaveFile.writeTactics17_18,
        '18': SaveFile.writeTactics17_18,
        '19': SaveFile.writeTactics19_21,
        '20': SaveFile.writeTactics19_21,
        '21': SaveFile.writeTactics19_21
    }

    static playerByte = {
        '15': 0x4C,
        '16': 0x4C,
        '16MyClub': 0x4C,
        '17': 0x78,
        '18': 0x7c,
        '19': 0x7c,
        '20': 0x7c,
        '21': 0x7c
    }

    static appearanceByte = {
        '15': 0x2AB9CC,
        '16': 0x2AB9CC,
        '16MyClub': 0x2AB9CC,
        '17': null,
        '18': null,
        '19': null,
        '20': null,
        '21': null
    }

    static rosterByte = {
        '15': 0x4E45CC,
        '16': 0x4FCC6C,
        '16MyClub': 0x4FCC6C,
        '17': 0x475A90,
        '18': 0x46FF54,
        '19': 0x6773C4,
        '20': 0x9CCC04,
        '21': 0x9D4648
    }

    static tacticsByte = {
        '15': 0x507194,
        '16': 0x51F814,
        '16MyClub': 0x51F814,
        '17': 0x490640,
        '18': 0x488B74,
        '19': 0x69EC8C,
        '20': 0xA01E3C,
        '21': 0xA09880
    }

    /**
     * Loads players
     * @param {number} playerCount 
     */
    loadPlayers(playerCount) {
        const currentByte = { value: SaveFile.playerByte[this.pes] };
        for (let i = 0; i < playerCount; i++) {
            const player = SaveFile.readPlayerEntry[this.pes](currentByte, this.payload);
            player.team_id = Math.floor(player.id/100);
            this.players[player.id] = player;
            if(!(player.team_id in this.teams))
                this.teams[player.team_id] = { roster: [] }
            this.teams[player.team_id].roster.push(player)
        }

        currentByte.value = SaveFile.appearanceByte[this.pes]
        if(!currentByte.value) //no appearance byte, continue
            return

        for (let i = 0; i < playerCount; i++) {
            SaveFile.readAppearanceEntry[this.pes](this.players, currentByte, this.payload);
        }
    }

    /**
     * Writes this.players back into the payload, the inverse of loadPlayers.
     * Entries are matched to players by the ID stored in each entry.
     */
    savePlayers() {
        const playerCount = SaveFile.readData(0, 2*8, SaveFile.playerCountByte[this.pes], this.payload);
        const currentByte = { value: SaveFile.playerByte[this.pes] };
        for (let i = 0; i < playerCount; i++) {
            const player = this.players[SaveFile.readData(0, 4*8, currentByte.value, this.payload)];
            if(player)
                SaveFile.writePlayerEntry[this.pes](currentByte, this.payload, player);
            else SaveFile.readPlayerEntry[this.pes](currentByte, this.payload); // skip the entry
        }

        currentByte.value = SaveFile.appearanceByte[this.pes]
        if(!currentByte.value) //no appearance byte, done
            return

        for (let i = 0; i < playerCount; i++) {
            const id = SaveFile.readData(0, 4*8, currentByte.value, this.payload);
            if(this.players[id])
                SaveFile.writeAppearanceEntry[this.pes](currentByte, this.payload, this.players[id]);
            else SaveFile.readAppearanceEntry[this.pes]({ [id]: {} }, currentByte, this.payload); // skip the entry
        }
    }
    /**
     * Fills basic team identification fields for PES 2015-style format
     * @param {{ value: number }} currentByte - mutable current byte position (simulates int&)
     * @param {Uint8Array} data - raw binary team data buffer
     */
    static readTeamEntry15(currentByte, data) {
        const read = (startBit, bitCount) => SaveFile.readData(startBit, bitCount, currentByte, data);
        
        const team = {};

        team.id = read(0, 4 * 8);

        currentByte.value += 0xE;
        team.b_edit_name = read(0, 1);
        team.b_edit_shortname = read(1, 1);

        currentByte.value += 0x82;

        // Full team name (UTF-8, max ~69 characters including null terminator)
        const nameBytes = data.subarray(currentByte.value, currentByte.value + 0x46);
        team.name = new TextDecoder("utf-8").decode(nameBytes).replace(/\0.*$/, "");
        currentByte.value += 0x46;

        // Short name / three-letter code (4 bytes, usually ASCII)
        const shortNameBytes = data.subarray(currentByte.value, currentByte.value + 4 - 1);
        team.short_name = new TextDecoder("ascii").decode(shortNameBytes).replace(/\0.*$/, "")
                          .replace(/[^A-Z\d]/gi, '');
        currentByte.value += 0x4;

        currentByte.value += 0xEA;

        //Block length: 0x1C8

        return team;
    }

    /**
     * Fills basic team identification fields for PES 2016-style format
     * @param {{ value: number }} currentByte - mutable current byte position (simulates int&)
     * @param {Uint8Array} data - raw binary team data buffer
     */
    static readTeamEntry16(currentByte, data) {
        const read = (startBit, bitCount) => SaveFile.readData(startBit, bitCount, currentByte, data);

        const team = {}
        // Team ID (32 bits = 4 bytes)
        team.id = read(0, 32);

        currentByte.value += 0xE;      // Skip 14 bytes (unknown / padding in 2016 format)

        // Name edited flag (usually the lowest bit of a byte)
        team.b_edit_name = read(0, 1);

        currentByte.value += 0x82;     // Large skip – likely includes logo/emblem data, colors, stadium link, etc.

        // Full team name (UTF-8, max ~69 characters including null terminator)
        const nameBytes = data.subarray(currentByte.value, currentByte.value + 0x46);
        team.name = new TextDecoder("utf-8").decode(nameBytes).replace(/\0.*$/, "");
        currentByte.value += 0x46;

        // Short name / three-letter code (4 bytes, ASCII)
        const shortNameBytes = data.subarray(currentByte.value, currentByte.value + 4 - 1);
        team.short_name = new TextDecoder("ascii").decode(shortNameBytes).replace(/\0.*$/, "")
                          .replace(/[^A-Z\d]/gi, '');
        currentByte.value += 4;

        currentByte.value += 0xEA;     // Final large skip – stadium name, banners, rivals, unknown blocks
    
        return team;
    }

    /**
     * Fills basic team info + colors + some strip data (PES 2017)
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     */
    static readTeamEntry17(currentByte, data) {
        const read = (startBit, bits) => SaveFile.readData(startBit, bits, currentByte, data);

        const team = {};

        team.id = read(0, 32);
        currentByte.value += 0xE;           // → 0x12

        team.color1_red   = read(0, 6);
        team.color1_green = read(6, 6);
        currentByte.value++;                // → 0x14

        team.color2_red   = read(0, 6);
        team.color2_green = read(6, 6);
        team.color2_blue  = read(4, 6);
        team.color1_blue  = read(2, 6);
        currentByte.value += 2;             // → 0x19

        team.b_edit_name = read(4, 1);
        currentByte.value++;                // → 0x1A

        team.b_edit_strip = read(5, 1);
        currentByte.value += 2;             // → 0x1C

        // Strip kit blocks – 10 entries
        team.stripBlock = new Array(10);
        for (let i = 0; i < 10; i++) {
            team.stripBlock[i] = {
                stripNumber: read(0, 8),
                stripTeamId: read(0, 24)
            };
        }

        currentByte.value += 0x54;

        // Team name
        const nameBytes = data.subarray(currentByte.value, currentByte.value + 0x46);
        team.name = new TextDecoder("utf-8").decode(nameBytes).replace(/\0.*$/, "");
        currentByte.value += 0x46;

        // Short name
        const shortNameBytes = data.subarray(currentByte.value, currentByte.value + 4 - 1);
        team.short_name = new TextDecoder("ascii").decode(shortNameBytes).replace(/\0.*$/, "")
                          .replace(/[^A-Z\d]/gi, '');

        currentByte.value += 4;
        currentByte.value += 0xFE;          // large skip (stadium, rivals, banners, unknown)
    
        return team;
    }

    /**
     * Fills basic team identification + colors (PES 2018 style)
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     */
    static readTeamEntry18(currentByte, data) {
        let pos = currentByte.value;

        const team = {};

        // Team ID – little-endian 32-bit
        team.id = data[pos] |
                (data[pos+1] << 8) |
                (data[pos+2] << 16) |
                (data[pos+3] << 24);
        pos += 4;

        pos += 0xE;   // → offset 0x12

        // Primary color (6-bit components)
        team.color1_red   = data[pos] & 63;
        team.color1_green = data[pos] >> 6;
        pos++;

        team.color1_green += (data[pos] << 2) & 63;
        pos++;

        // Secondary color
        team.color2_red   = data[pos] & 63;
        team.color2_green = data[pos] >> 6;
        pos++;

        team.color2_green += (data[pos] << 2) & 63;
        team.color2_blue  = data[pos] >> 4;
        pos++;

        team.color2_blue  += (data[pos] << 4) & 63;
        team.color1_blue  = data[pos] >> 2;
        pos += 3;     // was commented 0x94 – now 0x3

        team.b_edit_name = (data[pos] >> 4) & 1;
        pos += 0x7F;

        // Team name
        team.name = new TextDecoder("utf-8")
            .decode(data.subarray(pos, pos + 0x46))
            .replace(/\0.*$/, "");
        pos += 0x46;

        // Short name
        team.short_name = new TextDecoder("utf-8")
            .decode(data.subarray(pos, pos + 4))
            .replace(/\0.*$/, "")
            .replace(/[^A-Z\d]/gi, '');
        pos += 4;

        pos += 0xFE;   // large skip (unknown)

        currentByte.value = pos;

        return team;
    }

    /**
     * Fills basic team info – PES 2019 style
     * Includes manager ID, stadium ID, colors
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     */
    static readTeamEntry19(currentByte, data) {
        let pos = currentByte.value;

        const team = {};

        // Team ID – manual little-endian 32-bit
        team.id = data[pos] +
                (data[pos+1] << 8) +
                (data[pos+2] << 16) +
                (data[pos+3] << 24);
        pos += 4;

        // Manager ID – same
        team.manager_id = data[pos] +
                        (data[pos+1] << 8) +
                        (data[pos+2] << 16) +
                        (data[pos+3] << 24);
        pos += 4;

        pos += 2;  // Team emblem

        // Stadium ID – 16-bit LE
        team.stadium_id = data[pos] + (data[pos+1] << 8);
        pos += 2;

        pos += 0xA;  // → offset ~0x16

        // Colors – 6-bit values, cross-byte
        team.color1_red   = data[pos] >> 2;
        pos++;

        team.color1_green = data[pos] & 63;
        team.b_edit_name  = (data[pos] >> 6) & 1;
        pos++;

        team.color2_green = data[pos] & 63;
        team.color2_blue  = data[pos] >> 6;
        pos++;

        team.color2_blue += (data[pos] << 2) & 63;
        pos += 2;

        team.b_edit_stadium = (data[pos] >> 6) & 1;
        pos++;

        team.color1_blue = data[pos] & 63;
        team.color2_red  = data[pos] >> 6;
        pos++;

        team.color2_red += (data[pos] << 2) & 63;
        pos += 0x3B;

        // Team name
        team.name = new TextDecoder("utf-8")
            .decode(data.subarray(pos, pos + 0x46))
            .replace(/\0.*$/, "");
        pos += 0x46;

        // Short name
        team.short_name = new TextDecoder("utf-8")
            .decode(data.subarray(pos, pos + 4))
            .replace(/\0.*$/, "")
            .replace(/[^A-Z\d]/gi, '');
        pos += 4;

        pos += 0xFE;  // large skip (rivals, banners, unknown)

        currentByte.value = pos;

        return team;
    }

    /**
     * Reads team data at currentByte and returns it in as object
     * @param { Object<number> } currentByte 
     * @param { Uint8Array } data 
     * @returns { Object<string, string|number> } Object containing team data
     */
    static readTeamEntry20(currentByte, data) {
        const read = (start, end) => SaveFile.readData(start, end, currentByte, data)

        const team = {}
        team.id = read(0, 4*8);
        team.manager_id = read(0, 4*8);

        currentByte.value+=2; //Team emblem
        //0xA
        team.stadium_id     = read(0, 2*8);

        currentByte.value   += 0xA; //Skip to 0x16
        team.color1_red	    = read(2, 6);
        team.color1_green	= read(0, 6);
        team.b_edit_name	= read(6, 1);
        currentByte.value++; //Edited emblem: 1 bit
        team.color2_green	= read(0, 6);
        team.color2_blue	= read(6, 6);
        currentByte.value+=2; //Media backdrop colors
        team.b_edit_stadium = read(6, 1);
        currentByte.value++; //Edited stadium name: 1 bit
        currentByte.value+=2; //Stadium settings
        team.color1_blue	= read(0, 6);
        team.color2_red	    = read(6, 6);

        currentByte.value += 0x39;
        team.rivals = []
        team.rivals.push(read(0, 4*8)); //Rival team ID 1
        team.rivals.push(read(0, 4*8)); //Rival team ID 2
        team.rivals.push(read(0, 4*8)); //Rival team ID 3
        team.rivals = team.rivals.filter(r => r != 262143); // 262143 == OFF
        currentByte.value+=4; //Banner Edited flags

        // Name (UTF-8) - max 69 characters + null
        const nameBytes = data.subarray(currentByte.value, currentByte.value + 0x46);
        team.name = new TextDecoder("utf-8").decode(nameBytes).replace(/\0.*$/, "");
        currentByte.value += 0x46;

        // Shirt name (maybe ASCII)
        const shortNameBytes = data.subarray(currentByte.value, currentByte.value + 4 - 1);
        team.short_name = new TextDecoder("ascii").decode(shortNameBytes).replace(/\0.*$/, "")
                          .replace(/[^A-Z\d]/gi, '');
        currentByte.value+=4;

        // Stadium Name (UTF-8) - max 69 characters + null
        const stadiumBytes = data.subarray(currentByte.value, currentByte.value + 181);
        team.stadium_name = new TextDecoder("utf-8").decode(stadiumBytes).replace(/\0.*$/, "");
        currentByte.value+=181; //Stadium name
        currentByte.value+=16; //Banner 1 text
        currentByte.value+=16; //Banner 2 text
        currentByte.value+=16; //Banner 3 text
        currentByte.value+=16; //Banner 4 text

        currentByte.value+=165; //Unknown D

        return team;
    }

    /**
     * Writes team back over the entry at currentByte, the inverse of readTeamEntry15
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     * @param {Object} team
     */
    static writeTeamEntry15(currentByte, data, team) {
        const write = (startBit, bitCount, value) => SaveFile.writeData(startBit, bitCount, currentByte, data, value);
        

        write(0, 4 * 8, team.id);

        currentByte.value += 0xE;
        write(0, 1, team.b_edit_name);
        write(1, 1, team.b_edit_shortname);

        currentByte.value += 0x82;

        // Full team name (UTF-8, max ~69 characters including null terminator)
        SaveFile.writeString(data, currentByte.value, 0x46, team.name, "utf-8");
        currentByte.value += 0x46;

        // Short name / three-letter code (4 bytes, usually ASCII)
        SaveFile.writeString(data, currentByte.value, 4, team.short_name, "ascii", s => s.replace(/[^A-Z\d]/gi, ''));
        currentByte.value += 0x4;

        currentByte.value += 0xEA;

        //Block length: 0x1C8

    }

    /**
     * Writes team back over the entry at currentByte, the inverse of readTeamEntry16
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     * @param {Object} team
     */
    static writeTeamEntry16(currentByte, data, team) {
        const write = (startBit, bitCount, value) => SaveFile.writeData(startBit, bitCount, currentByte, data, value);

        // Team ID (32 bits = 4 bytes)
        write(0, 32, team.id);

        currentByte.value += 0xE;      // Skip 14 bytes (unknown / padding in 2016 format)

        // Name edited flag (usually the lowest bit of a byte)
        write(0, 1, team.b_edit_name);

        currentByte.value += 0x82;     // Large skip – likely includes logo/emblem data, colors, stadium link, etc.

        // Full team name (UTF-8, max ~69 characters including null terminator)
        SaveFile.writeString(data, currentByte.value, 0x46, team.name, "utf-8");
        currentByte.value += 0x46;

        // Short name / three-letter code (4 bytes, ASCII)
        SaveFile.writeString(data, currentByte.value, 4, team.short_name, "ascii", s => s.replace(/[^A-Z\d]/gi, ''));
        currentByte.value += 4;

        currentByte.value += 0xEA;     // Final large skip – stadium name, banners, rivals, unknown blocks
    
    }

    /**
     * Writes team back over the entry at currentByte, the inverse of readTeamEntry17
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     * @param {Object} team
     */
    static writeTeamEntry17(currentByte, data, team) {
        const write = (startBit, bits, value) => SaveFile.writeData(startBit, bits, currentByte, data, value);

        write(0, 32, team.id);
        currentByte.value += 0xE;           // → 0x12

        write(0, 6, team.color1_red);
        write(6, 6, team.color1_green);
        currentByte.value++;                // → 0x14

        write(0, 6, team.color2_red);
        write(6, 6, team.color2_green);
        write(4, 6, team.color2_blue);
        write(2, 6, team.color1_blue);
        currentByte.value += 2;             // → 0x19

        write(4, 1, team.b_edit_name);
        currentByte.value++;                // → 0x1A

        write(5, 1, team.b_edit_strip);
        currentByte.value += 2;             // → 0x1C

        // Strip kit blocks – 10 entries
        for (let i = 0; i < 10; i++) {
            write(0, 8, team.stripBlock?.[i]?.stripNumber);
            write(0, 24, team.stripBlock?.[i]?.stripTeamId);
        }

        currentByte.value += 0x54;

        // Team name
        SaveFile.writeString(data, currentByte.value, 0x46, team.name, "utf-8");
        currentByte.value += 0x46;

        // Short name
        SaveFile.writeString(data, currentByte.value, 4, team.short_name, "ascii", s => s.replace(/[^A-Z\d]/gi, ''));

        currentByte.value += 4;
        currentByte.value += 0xFE;          // large skip (stadium, rivals, banners, unknown)
    
    }

    /**
     * Writes team back over the entry at currentByte, the inverse of readTeamEntry18
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     * @param {Object} team
     */
    static writeTeamEntry18(currentByte, data, team) {
        const write = (startBit, bits, value) => SaveFile.writeData(startBit, bits, currentByte, data, value);

        // Team ID – little-endian 32-bit
        write(0, 32, team.id);

        currentByte.value += 0xE;   // → offset 0x12

        // Primary color (6-bit components)
        write(0, 6, team.color1_red);
        write(6, 6, team.color1_green);
        currentByte.value++;

        // Secondary color
        write(0, 6, team.color2_red);
        write(6, 6, team.color2_green);
        write(4, 6, team.color2_blue);
        write(2, 6, team.color1_blue);
        currentByte.value += 2;

        write(4, 1, team.b_edit_name);
        currentByte.value += 0x7F;

        // Team name
        SaveFile.writeString(data, currentByte.value, 0x46, team.name, "utf-8");
        currentByte.value += 0x46;

        // Short name
        SaveFile.writeString(data, currentByte.value, 4, team.short_name, "utf-8", s => s.replace(/[^A-Z\d]/gi, ''));
        currentByte.value += 4;

        currentByte.value += 0xFE;   // large skip (unknown)
    }

    /**
     * Writes team back over the entry at currentByte, the inverse of readTeamEntry19
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     * @param {Object} team
     */
    static writeTeamEntry19(currentByte, data, team) {
        const write = (startBit, bits, value) => SaveFile.writeData(startBit, bits, currentByte, data, value);

        // Team ID – little-endian 32-bit
        write(0, 32, team.id);

        // Manager ID – same
        write(0, 32, team.manager_id);

        currentByte.value += 2;  // Team emblem

        // Stadium ID – 16-bit LE
        write(0, 16, team.stadium_id);

        currentByte.value += 0xA;  // → offset ~0x16

        // Colors – 6-bit values, cross-byte
        write(2, 6, team.color1_red);

        write(0, 6, team.color1_green);
        write(6, 1, team.b_edit_name);
        currentByte.value++;

        write(0, 6, team.color2_green);
        write(6, 6, team.color2_blue);
        currentByte.value += 2;

        write(6, 1, team.b_edit_stadium);
        currentByte.value++;

        write(0, 6, team.color1_blue);
        write(6, 6, team.color2_red);
        currentByte.value += 0x3B;

        // Team name
        SaveFile.writeString(data, currentByte.value, 0x46, team.name, "utf-8");
        currentByte.value += 0x46;

        // Short name
        SaveFile.writeString(data, currentByte.value, 4, team.short_name, "utf-8", s => s.replace(/[^A-Z\d]/gi, ''));
        currentByte.value += 4;

        currentByte.value += 0xFE;  // large skip (rivals, banners, unknown)
    }


    /**
     * Writes team back over the entry at currentByte, the inverse of readTeamEntry20
     * @param {{ value: number }} currentByte
     * @param {Uint8Array} data
     * @param {Object} team
     */
    static writeTeamEntry20(currentByte, data, team) {
        const write = (start, end, value) => SaveFile.writeData(start, end, currentByte, data, value);

        write(0, 4*8, team.id);
        write(0, 4*8, team.manager_id);

        currentByte.value+=2; //Team emblem
        //0xA
        write(0, 2*8, team.stadium_id);

        currentByte.value   += 0xA; //Skip to 0x16
        write(2, 6, team.color1_red);
        write(0, 6, team.color1_green);
        write(6, 1, team.b_edit_name);
        currentByte.value++; //Edited emblem: 1 bit
        write(0, 6, team.color2_green);
        write(6, 6, team.color2_blue);
        currentByte.value+=2; //Media backdrop colors
        write(6, 1, team.b_edit_stadium);
        currentByte.value++; //Edited stadium name: 1 bit
        currentByte.value+=2; //Stadium settings
        write(0, 6, team.color1_blue);
        write(6, 6, team.color2_red);

        currentByte.value += 0x39;
        // OFF slots were filtered out on load, so only rewrite the rivals when they changed
        const rivals = [0, 4, 8].map(i => SaveFile.readData(0, 4*8, currentByte.value + i, data));
        if(team.rivals && !SaveFile.arraysEqual(team.rivals, rivals.filter(r => r != 262143))) {
            for(let i = 0; i < 3; i++)
                write(0, 4*8, team.rivals[i] ?? 262143); // 262143 == OFF
        }
        else currentByte.value += 12;
        currentByte.value+=4; //Banner Edited flags

        // Name (UTF-8) - max 69 characters + null
        SaveFile.writeString(data, currentByte.value, 0x46, team.name, "utf-8");
        currentByte.value += 0x46;

        // Shirt name (maybe ASCII)
        SaveFile.writeString(data, currentByte.value, 4, team.short_name, "ascii", s => s.replace(/[^A-Z\d]/gi, ''));
        currentByte.value+=4;

        // Stadium Name (UTF-8) - max 69 characters + null
        SaveFile.writeString(data, currentByte.value, 181, team.stadium_name, "utf-8");
        currentByte.value+=181; //Stadium name
        currentByte.value+=16; //Banner 1 text
        currentByte.value+=16; //Banner 2 text
        currentByte.value+=16; //Banner 3 text
        currentByte.value+=16; //Banner 4 text

        currentByte.value+=165; //Unknown D

    }

    static teamByte = {
        '15': 0x44AA6C,
        '16': 0x46310C,
        '16MyClub': 0x46310C,
        '17': 0x3C3E58,
        '18': 0x3C3E5C,
        '19': 0x5BCC7C,
        '20': 0x8ED2FC,
        '21': 0x8ED2FC
    }

    static readTeamEntry = {
        '15': SaveFile.readTeamEntry15,
        '16': SaveFile.readTeamEntry16,
        '16MyClub': SaveFile.readTeamEntry16,
        '17': SaveFile.readTeamEntry17,
        '18': SaveFile.readTeamEntry18,
        '19': SaveFile.readTeamEntry19,
        '20': SaveFile.readTeamEntry20,
        '21': SaveFile.readTeamEntry20
    }

    static writeTeamEntry = {
        '15': SaveFile.writeTeamEntry15,
        '16': SaveFile.writeTeamEntry16,
        '16MyClub': SaveFile.writeTeamEntry16,
        '17': SaveFile.writeTeamEntry17,
        '18': SaveFile.writeTeamEntry18,
        '19': SaveFile.writeTeamEntry19,
        '20': SaveFile.writeTeamEntry20,
        '21': SaveFile.writeTeamEntry20
    }

    /**
     * Loads teams
     * @param {number} teamCount 
     */
    loadTeams(teamCount) {
        const currentByte = { value: SaveFile.teamByte[this.pes] };
        for (let i = 0; i < teamCount; i++) {
            const team = SaveFile.readTeamEntry[this.pes](currentByte, this.payload);
            if(this.pes == '20') {
                // team entry size is 528 bytes vs 2021's 588 bytes for some reason
                currentByte.value -= 60;
            }

            if(!(team.id in this.teams)) {
                console.log('No players on team, skipping', team);
                continue;
            }
            Object.assign(team, this.teams[team.id]);
            this.teams[team.id] = team;

            /*for(const p of team.roster) {
                p.team = team
            }*/
        }

        currentByte.value = SaveFile.rosterByte[this.pes]
        for (let i = 0; i < teamCount; i++) {
            SaveFile.readRoster[this.pes](this.teams, currentByte, this.payload)
        }

        currentByte.value = SaveFile.tacticsByte[this.pes]
        for (let i = 0; i < teamCount; i++) {
            SaveFile.readTactics[this.pes](this.teams, currentByte, this.payload)
        }
    }

    /**
     * Writes this.teams back into the payload, the inverse of loadTeams.
     * Entries are matched to teams by the ID stored in each entry.
     */
    saveTeams() {
        const teamCount = SaveFile.readData(0, 2*8, SaveFile.teamCountByte[this.pes], this.payload);
        const currentByte = { value: SaveFile.teamByte[this.pes] };
        for (let i = 0; i < teamCount; i++) {
            const team = this.teams[SaveFile.readData(0, 4*8, currentByte.value, this.payload)];
            if(team)
                SaveFile.writeTeamEntry[this.pes](currentByte, this.payload, team);
            else SaveFile.readTeamEntry[this.pes](currentByte, this.payload); // skip the entry
            if(this.pes == '20') {
                // team entry size is 528 bytes vs 2021's 588 bytes for some reason
                currentByte.value -= 60;
            }
        }

        currentByte.value = SaveFile.rosterByte[this.pes]
        for (let i = 0; i < teamCount; i++) {
            SaveFile.writeRoster[this.pes](this.teams, currentByte, this.payload)
        }

        currentByte.value = SaveFile.tacticsByte[this.pes]
        for (let i = 0; i < teamCount; i++) {
            SaveFile.writeTactics[this.pes](this.teams, currentByte, this.payload)
        }
    }
}

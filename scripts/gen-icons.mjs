// Generates public/icon-192.png and public/icon-512.png — navy square with a
// gold ring + "L" monogram. Pure Node (zlib + hand-rolled PNG chunks), no deps.
// Run: node scripts/gen-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const NAVY = [10, 31, 68];      // #0A1F44
const GOLD = [212, 175, 55];    // #D4AF37

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // truecolor RGB
  // scanlines: filter byte + RGB per pixel
  const raw = Buffer.alloc(size * (size * 3 + 1));
  const cx = size / 2, cy = size / 2;
  const ringR = size * 0.36, ringW = size * 0.05;
  const barW = size * 0.09, barH = size * 0.34; // "L" stem
  const footW = size * 0.2, footH = size * 0.09; // "L" foot
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 3;
      let px = NAVY;
      const d = Math.hypot(x - cx, y - cy);
      const inRing = Math.abs(d - ringR) < ringW;
      // simple "L" glyph centered
      const inStem = x > cx - barW / 2 - size * 0.05 && x < cx + barW / 2 - size * 0.05 && y > cy - barH / 2 && y < cy + barH / 2;
      const inFoot = x > cx - barW / 2 - size * 0.05 && x < cx - barW / 2 - size * 0.05 + footW && y > cy + barH / 2 - footH && y < cy + barH / 2;
      if (inRing || inStem || inFoot) px = GOLD;
      raw[i] = px[0]; raw[i + 1] = px[1]; raw[i + 2] = px[2];
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  writeFileSync(`public/icon-${size}.png`, png(size));
  console.log(`wrote public/icon-${size}.png`);
}

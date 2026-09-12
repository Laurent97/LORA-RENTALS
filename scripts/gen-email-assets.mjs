// Generates public/email/icon-gold.png (48px) and icon-gold@2x.png (96px):
// a gold shield with a navy "L" on a transparent background, for the email
// header/footer. Pure Node, no deps. Run: node scripts/gen-email-assets.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const GOLD = [212, 175, 55];
const NAVY = [10, 31, 68];

function crc32(buf) {
  let t = crc32.t;
  if (!t) {
    t = crc32.t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

// Shield: rounded top, tapering to a point at the bottom.
function inShield(x, y, s) {
  const nx = (x - s / 2) / (s / 2), ny = (y - s * 0.08) / (s * 0.84); // 0..1 vertical
  if (ny < 0 || ny > 1) return false;
  const halfW = ny < 0.55 ? 0.92 : 0.92 * (1 - ((ny - 0.55) / 0.45) ** 1.6);
  if (ny < 0.12) { // rounded shoulders
    const r = 0.12, cy = 0.12, cx = 0.92 - r;
    if (Math.abs(nx) > cx) return Math.hypot(Math.abs(nx) - cx, ny - cy) <= r;
  }
  return Math.abs(nx) <= halfW;
}
function inL(x, y, s) {
  const stemW = s * 0.13, stemH = s * 0.42, footW = s * 0.30, footH = s * 0.12;
  const x0 = s * 0.36, y0 = s * 0.24;
  return (x >= x0 && x < x0 + stemW && y >= y0 && y < y0 + stemH) ||
         (x >= x0 && x < x0 + footW && y >= y0 + stemH - footH && y < y0 + stemH);
}

function png(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const ss = 3; // supersampling for anti-aliased edges
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1); raw[row] = 0;
    for (let x = 0; x < size; x++) {
      let cover = 0, lcover = 0;
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const px = x + (sx + 0.5) / ss, py = y + (sy + 0.5) / ss;
        if (inShield(px, py, size)) { cover++; if (inL(px, py, size)) lcover++; }
      }
      const a = cover / (ss * ss), lf = cover ? lcover / cover : 0;
      const i = row + 1 + x * 4;
      raw[i] = Math.round(GOLD[0] * (1 - lf) + NAVY[0] * lf);
      raw[i + 1] = Math.round(GOLD[1] * (1 - lf) + NAVY[1] * lf);
      raw[i + 2] = Math.round(GOLD[2] * (1 - lf) + NAVY[2] * lf);
      raw[i + 3] = Math.round(255 * a);
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/email", { recursive: true });
writeFileSync("public/email/icon-gold.png", png(48));
writeFileSync("public/email/icon-gold@2x.png", png(96));
console.log("wrote public/email/icon-gold.png, icon-gold@2x.png");

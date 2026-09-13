// Generates public/icon-192.png and public/icon-512.png — navy square with a
// gold ring + "L" monogram. Pure Node (zlib + hand-rolled PNG chunks), no deps.
// Run: node scripts/gen-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

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

function png(width, height = width) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // truecolor RGB
  // scanlines: filter byte + RGB per pixel
  const raw = Buffer.alloc(height * (width * 3 + 1));
  const unit = Math.min(width, height);
  const cx = width / 2, cy = height / 2;
  const ringR = unit * 0.36, ringW = unit * 0.05;
  const barW = unit * 0.09, barH = unit * 0.34; // "L" stem
  const footW = unit * 0.2, footH = unit * 0.09; // "L" foot
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const i = row + 1 + x * 3;
      let px = NAVY;
      const d = Math.hypot(x - cx, y - cy);
      const inRing = Math.abs(d - ringR) < ringW;
      // simple "L" glyph centered
      const inStem = x > cx - barW / 2 - unit * 0.05 && x < cx + barW / 2 - unit * 0.05 && y > cy - barH / 2 && y < cy + barH / 2;
      const inFoot = x > cx - barW / 2 - unit * 0.05 && x < cx - barW / 2 - unit * 0.05 + footW && y > cy + barH / 2 - footH && y < cy + barH / 2;
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

mkdirSync("public/icons", { recursive: true });
for (const size of [72, 96, 128, 144, 152, 180, 192, 384, 512]) {
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}x${size}.png`;
  writeFileSync(`public/icons/${name}`, png(size));
}
for (const size of [192, 512]) writeFileSync(`public/icons/icon-maskable-${size}.png`, png(size));
mkdirSync("public/icons/splash", { recursive: true });
for (const [width, height] of [[640, 1136], [750, 1334], [828, 1792], [1125, 2436], [1170, 2532], [1242, 2688], [1284, 2778]]) {
  writeFileSync(`public/icons/splash/apple-splash-${width}x${height}.png`, png(width, height));
}
mkdirSync("public/screenshots", { recursive: true });
writeFileSync("public/screenshots/home-mobile.png", png(1080, 1920));
writeFileSync("public/screenshots/home-desktop.png", png(1920, 1080));
console.log("wrote PWA icons to public/icons");

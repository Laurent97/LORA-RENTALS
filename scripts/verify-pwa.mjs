import { existsSync, readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("public/manifest.json", "utf8"));
const required = ["public/sw.js", "public/icons/apple-touch-icon.png", "public/icons/icon-192x192.png", "public/icons/icon-512x512.png", "public/screenshots/home-mobile.png", "public/screenshots/home-desktop.png"];
for (const icon of manifest.icons) required.push(`public${icon.src}`);
for (const item of required) if (!existsSync(item)) throw new Error(`Missing PWA asset: ${item}`);
if (manifest.display !== "standalone" || manifest.start_url !== "/?utm_source=pwa" || !manifest.shortcuts?.length || !manifest.screenshots?.length) throw new Error("Manifest is missing required install metadata");
const sw = readFileSync("public/sw.js", "utf8");
for (const token of ["offline", "push", "notificationclick"]) if (!sw.includes(token)) throw new Error(`Service worker lacks ${token} handling`);
console.log(`PWA verification passed: ${manifest.icons.length} icons, ${manifest.shortcuts.length} shortcuts, ${manifest.screenshots.length} screenshots.`);

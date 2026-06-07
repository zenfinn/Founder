#!/usr/bin/env node
import sharp from "sharp";
import { copyFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import toIco from "to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "../public");
const appDir = join(__dirname, "../app");
const BG = "#1a3aad";

/** Path-based serif F — crisp at 16px (no font fallback that can look like "M"). */
function buildFounderIconSvg(size) {
  const radius = Math.round(size * 0.18);
  const stemX = Math.round(size * 0.29);
  const stemW = Math.round(size * 0.14);
  const topY = Math.round(size * 0.21);
  const topH = Math.round(size * 0.125);
  const topW = Math.round(size * 0.43);
  const midY = Math.round(size * 0.485);
  const midH = Math.round(size * 0.11);
  const midW = Math.round(size * 0.33);
  const stemH = Math.round(size * 0.58);

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/>
  <rect x="${stemX}" y="${topY}" width="${stemW}" height="${stemH}" rx="${Math.max(2, Math.round(stemW * 0.12))}" fill="#ffffff"/>
  <rect x="${stemX}" y="${topY}" width="${topW}" height="${topH}" rx="${Math.max(2, Math.round(topH * 0.15))}" fill="#ffffff"/>
  <rect x="${stemX}" y="${midY}" width="${midW}" height="${midH}" rx="${Math.max(2, Math.round(midH * 0.15))}" fill="#ffffff"/>
</svg>`;
}

async function renderIcon(size) {
  return sharp(Buffer.from(buildFounderIconSvg(size))).png().toBuffer();
}

const sizes = [
  ["favicon-16x16.png", 16],
  ["favicon-32x32.png", 32],
  ["favicon-48x48.png", 48],
  ["apple-touch-icon.png", 180],
  ["android-chrome-192x192.png", 192],
  ["android-chrome-512x512.png", 512],
];

const pngBuffers = {};

for (const [filename, size] of sizes) {
  const buffer = await renderIcon(size);
  pngBuffers[filename] = buffer;
  writeFileSync(join(publicDir, filename), buffer);
}

const ico = await toIco([
  pngBuffers["favicon-16x16.png"],
  pngBuffers["favicon-32x32.png"],
  pngBuffers["favicon-48x48.png"],
]);
writeFileSync(join(publicDir, "favicon.ico"), ico);
copyFileSync(join(publicDir, "favicon.ico"), join(appDir, "favicon.ico"));

const svg = buildFounderIconSvg(512);
writeFileSync(join(publicDir, "founder-icon.svg"), svg);
writeFileSync(join(appDir, "icon.svg"), svg);

console.log("Favicon set generated in /public and /app");

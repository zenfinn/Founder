#!/usr/bin/env node
import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import toIco from "to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "../public");
const BG = "#1a3aad";

async function renderIcon(size) {
  const fontSize = Math.round(size * 0.58);
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" rx="${Math.round(size * 0.18)}" fill="${BG}"/>
    <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${fontSize}">F</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

const sizes = [
  ["favicon-16x16.png", 16],
  ["favicon-32x32.png", 32],
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

const ico = await toIco([pngBuffers["favicon-16x16.png"], pngBuffers["favicon-32x32.png"]]);
writeFileSync(join(publicDir, "favicon.ico"), ico);

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="92" fill="${BG}"/>
  <text x="256" y="290" text-anchor="middle" fill="#ffffff" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="300">F</text>
</svg>`;
writeFileSync(join(publicDir, "founder-icon.svg"), svg);

console.log("Favicon set generated in /public");

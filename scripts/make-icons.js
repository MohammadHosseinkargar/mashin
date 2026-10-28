const sharp = require("sharp");
const { writeFileSync } = require("fs");

const W = 18;
const H = 18;
// Rounded square with gold gradient + car silhouette
const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffea9a"/>
      <stop offset="0.45" stop-color="#f6bd4f"/>
      <stop offset="1" stop-color="#ff8f3f"/>
    </linearGradient>
    <radialGradient id="bg" cx="50%" cy="40%" r="70%">
      <stop offset="0" stop-color="#1a2336"/>
      <stop offset="1" stop-color="#070a12"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#bg)"/>
  <path d="M34 64 C34 54 42 47 54 45 L66 42 C72 32 78 24 85 18 L92 16 C97 16 99 20 99 26 L99 40 H1 L1 40 C1 20 3 16 8 16 L15 18 C22 24 28 32 34 42 Z"
    fill="url(#g)" stroke="#fff" stroke-opacity="0.25" stroke-width="1.2"/>
  <circle cx="28" cy="70" r="9" fill="#05070c"/>
  <circle cx="28" cy="70" r="9" fill="none" stroke="#3a4660" stroke-width="1"/>
  <circle cx="28" cy="70" r="4.5" fill="#0f1522" stroke="#aeb9cd" stroke-width="0.8"/>
  <circle cx="72" cy="70" r="9" fill="#05070c"/>
  <circle cx="72" cy="70" r="9" fill="none" stroke="#3a4660" stroke-width="1"/>
  <circle cx="72" cy="70" r="4.5" fill="#0f1522" stroke="#aeb9cd" stroke-width="0.8"/>
  <path d="M20 46 L80 46" stroke="#000" stroke-opacity="0.25" stroke-width="1.2"/>
  <rect x="14" y="37" width="14" height="2.5" rx="1" fill="#ff4d5e"/>
  <path d="M84 42 L96 46" stroke="#fff6c9" stroke-opacity="0.7" stroke-width="1.5"/>
</svg>`;

async function run() {
  const sizes = [192, 512];
  for (const size of sizes) {
    const buf = await sharp(Buffer.from(svg(size)))
      .png()
      .toBuffer();
    writeFileSync(`public/icon-${size}.png`, buf);
    console.log(`wrote public/icon-${size}.png`);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });

/**
 * Generates public/og-image.png for Colearn.
 *
 * Canvas : 1200 × 630, solid white
 * Layout : official logo.png centred at the top, H1 headline beneath it,
 *          brand tagline under that.
 *
 * Logo discipline: the mark is used exactly as supplied. It is only trimmed of
 * its fully-transparent outer margin and scaled proportionally — it is never
 * redrawn, recoloured, stretched, rotated or given effects.
 *
 * Run: node scripts/gen-og-image.mjs
 */
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const W = 1200;
const H = 630;

// ── 1. Logo — trim transparent margin, then scale proportionally ─────────────
// The source is a 2276² canvas whose ink occupies only 1716×773; trimming first
// means the visible mark gets real presence on the card instead of being
// shrunk together with its empty padding.
const LOGO_H = 104;

const logoBuffer = await sharp(path.join(ROOT, 'logo.png'))
  .trim({ threshold: 1 })
  .resize({ height: LOGO_H, fit: 'inside' })
  .toBuffer();

const logoMeta = await sharp(logoBuffer).metadata();
const LOGO_W = logoMeta.width;

const LOGO_X = Math.round((W - LOGO_W) / 2);
const LOGO_Y = 168;

// ── 2. Text overlay ──────────────────────────────────────────────────────────
const H1_Y = LOGO_Y + LOGO_H + 58; // baseline of the headline
const TAGLINE_Y = H1_Y + 60;       // baseline of the tagline

// NOTE: no webfont @import here — sharp/librsvg does not fetch remote fonts, so
// it would silently do nothing. We use a local stack instead (Inter when the
// build machine has it installed, otherwise a system sans).
const FONT_STACK = "Inter, 'Segoe UI', Arial, Helvetica, sans-serif";

const textSVG = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text
    x="${W / 2}" y="${H1_Y}"
    text-anchor="middle"
    font-family="${FONT_STACK}"
    font-size="56" font-weight="800"
    fill="#0F172A"
  >Learn it. Build it. Prove it.</text>

  <text
    x="${W / 2}" y="${TAGLINE_Y}"
    text-anchor="middle"
    font-family="${FONT_STACK}"
    font-size="26" font-weight="500"
    fill="#64748B"
  >Learn → Build → Prove → Succeed</text>
</svg>`;

// ── 3. Compose: white canvas + logo + text, flattened to an opaque PNG ───────
const OUT = path.join(ROOT, 'public', 'og-image.png');

await sharp({
  create: {
    width: W,
    height: H,
    channels: 4,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
})
  .composite([
    { input: logoBuffer, top: LOGO_Y, left: LOGO_X },
    { input: Buffer.from(textSVG), top: 0, left: 0 },
  ])
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`✓ OG image written: ${OUT} (${W}×${H}, logo ${LOGO_W}×${LOGO_H})`);

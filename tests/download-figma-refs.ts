/**
 * Downloads Figma component node images as PNG reference files.
 *
 * Run once (or whenever the Figma design changes) with:
 *   npx tsx tests/download-figma-refs.ts
 *
 * Requires FIGMA_API_TOKEN to be set (or passed inline).
 */

import fs   from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const FIGMA_TOKEN = process.env.FIGMA_API_TOKEN;
if (!FIGMA_TOKEN) {
  console.error('Error: FIGMA_API_TOKEN environment variable is not set.');
  console.error('Usage: FIGMA_API_TOKEN=<your-token> npx tsx tests/download-figma-refs.ts');
  process.exit(1);
}
const FILE_KEY    = '0SGlWXx4nQMnLBUyMU7GZt';
const OUT_DIR     = path.join(process.cwd(), 'tests', '__figma__');

// ─── Node IDs extracted from the <Button> COMPONENT_SET (node 1:1068) ────────
// Key format:  {variant}_{color}_{state}
export const FIGMA_NODE_IDS: Record<string, string> = {
  'contained_primary_enabled':   '1:1069',
  'contained_secondary_enabled': '1:1150',
  'contained_error_enabled':     '1:1177',
  'contained_warning_enabled':   '1:1204',
  'contained_info_enabled':      '1:1231',
  'contained_success_enabled':   '1:1258',
  'contained_primary_disabled':  '1:1341',
  'contained_secondary_disabled':'1:1362',
  'contained_error_disabled':    '1:1369',
  'contained_warning_disabled':  '1:1376',
  'contained_info_disabled':     '1:1383',
  'contained_success_disabled':  '1:1390',
  'outlined_primary_enabled':    '1:2053',
  'outlined_secondary_enabled':  '1:2134',
  'outlined_error_enabled':      '1:2161',
  'outlined_warning_enabled':    '1:2188',
  'outlined_info_enabled':       '1:2215',
  'outlined_success_enabled':    '1:2242',
  'outlined_primary_disabled':   '1:2325',
  'outlined_secondary_disabled': '1:2346',
  'outlined_error_disabled':     '1:2353',
  'outlined_warning_disabled':   '1:2360',
  'outlined_info_disabled':      '1:2367',
  'outlined_success_disabled':   '1:2374',
  'text_primary_enabled':        '1:3365',
  'text_secondary_enabled':      '1:3488',
  'text_error_enabled':          '1:3515',
  'text_warning_enabled':        '1:3542',
  'text_info_enabled':           '1:3569',
  'text_success_enabled':        '1:3596',
  'text_primary_disabled':       '1:3467',
  'text_secondary_disabled':     '1:3658',
  'text_error_disabled':         '1:3665',
  'text_warning_disabled':       '1:3672',
  'text_info_disabled':          '1:3679',
  'text_success_disabled':       '1:3686',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function get(url: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      // Follow redirects (Figma CDN returns 307)
      if (res.statusCode === 307 || res.statusCode === 302 || res.statusCode === 301) {
        file.close();
        fs.unlinkSync(dest);
        download(res.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    }).on('error', reject);
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const allIds    = Object.values(FIGMA_NODE_IDS);
  // Figma Images API accepts max ~200 IDs per request; batch in 36 is fine.
  const nodeParam = allIds.map(id => encodeURIComponent(id)).join(',');
  const apiUrl    = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${nodeParam}&format=png&scale=1`;

  console.log(`Fetching image URLs for ${allIds.length} nodes…`);
  const body  = await get(apiUrl, { 'X-Figma-Token': FIGMA_TOKEN });
  const json  = JSON.parse(body) as { images: Record<string, string | null>; err: string | null };

  if (json.err) throw new Error(`Figma API error: ${json.err}`);

  const entries = Object.entries(FIGMA_NODE_IDS);
  let ok = 0;
  let skipped = 0;

  for (const [key, nodeId] of entries) {
    const imageUrl = json.images[nodeId];
    if (!imageUrl) {
      console.warn(`  ⚠  No image for ${key} (${nodeId})`);
      skipped++;
      continue;
    }
    const dest = path.join(OUT_DIR, `${key}.png`);
    process.stdout.write(`  ↓  ${key}.png … `);
    await download(imageUrl, dest);
    console.log('done');
    ok++;
  }

  console.log(`\nDownloaded ${ok} images, skipped ${skipped}.`);
  console.log(`Saved to: ${OUT_DIR}`);
}

// Only execute when run directly (not when imported for FIGMA_NODE_IDS)
import { fileURLToPath } from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => { console.error(err); process.exit(1); });
}

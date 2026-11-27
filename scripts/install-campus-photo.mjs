// Puts a reviewed Wikimedia Commons photo on the site, with its credit.
//
//   NODE_USE_ENV_PROXY=1 node scripts/install-campus-photo.mjs <university id> [candidate number, default 0]
//   NODE_USE_ENV_PROXY=1 node scripts/install-campus-photo.mjs --batch picks.json   # {"mit": 0, "harvard": 2, ...}
//   add `--cache <dir>` to reuse the previews find-campus-photos.mjs --download saved (<id>.<n>.jpg)
//
// Takes the candidate from scripts/photo-candidates.json (written by find-campus-photos.mjs),
// saves it as src/assets/campus/<id>.jpg (1600 px wide, JPEG) and records author, licence and
// source in src/data/photos.json. Look at the photo before installing it: the search only ranks.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const UA = 'GlobalAdmissionSite/1.0 (https://github.com/; educational static site, photo attribution script)';
const candidates = JSON.parse(readFileSync('scripts/photo-candidates.json', 'utf8'));
const credits = JSON.parse(readFileSync('src/data/photos.json', 'utf8'));

const args = process.argv.slice(2);
const cacheAt = args.indexOf('--cache');
const cache = cacheAt >= 0 ? args.splice(cacheAt, 2)[1] : null;
const picks = args[0] === '--batch' ? JSON.parse(readFileSync(args[1], 'utf8')) : { [args[0]]: Number(args[1] ?? 0) };

async function fetchImage(id, n, url) {
  const cached = cache && join(cache, `${id}.${n}.jpg`);
  if (cached && existsSync(cached)) return readFileSync(cached);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`download failed (${res.status})`);
  await new Promise((r) => setTimeout(r, 800));
  return Buffer.from(await res.arrayBuffer());
}

for (const [id, n] of Object.entries(picks)) {
  const c = candidates[id]?.[n];
  if (!c) {
    console.error(`${id}: no candidate #${n}`);
    process.exitCode = 1;
    continue;
  }
  let image;
  try {
    image = await fetchImage(id, n, c.thumb);
  } catch (err) {
    console.error(`${id}: ${err.message}`);
    process.exitCode = 1;
    continue;
  }
  await sharp(image)
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`src/assets/campus/${id}.jpg`);
  credits[id] = { file: c.file, author: c.author, license: c.license, licenseUrl: c.licenseUrl, source: c.page };
  console.log(`${id}: ${c.file} — ${c.author}, ${c.license}`);
}

const sorted = Object.fromEntries(Object.entries(credits).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync('src/data/photos.json', JSON.stringify(sorted, null, 1) + '\n');

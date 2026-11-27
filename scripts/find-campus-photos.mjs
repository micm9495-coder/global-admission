// Finds freely licensed campus photos on Wikimedia Commons for universities that have no photo yet,
// or only one of unknown origin (a file in src/assets/campus without a credit in src/data/photos.json).
//
//   NODE_USE_ENV_PROXY=1 node scripts/find-campus-photos.mjs [--download <dir>]
//
// Uncredited photos are handled first. For each university it searches Wikimedia Commons (curated
// photos first), drops logos, seals, maps and portraits, keeps landscape JPEGs
// under a free licence, and ranks them. Results go to scripts/photo-candidates.json for a human to review;
// nothing is added to the site automatically.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const UA = 'GlobalAdmissionSite/1.0 (https://github.com/; educational static site, photo attribution script)';
const universities = JSON.parse(readFileSync('src/data/universities.json', 'utf8'));
const downloadDir = process.argv.includes('--download') ? process.argv[process.argv.indexOf('--download') + 1] : null;

const SKIP = /logo|seal|arms|coat|crest|emblem|flag|map|portrait|signature|mascot|icon|wordmark|banner|diagram|chart|plan_|locator|stamp|medal|statue_of|bust|headshot|official_photo|\(cropped\)/i;
const GOOD = /campus|hall|building|library|college|universit|quad|main|tower|view|aerial|chapel|court|gate|square|lawn|facade|façade|panorama|exterior|cathedral|house|centre|center/i;
/** Photos of events, people, signs or interiors: allowed, but ranked below building shots. */
const BAD = /event|protest|commencement|graduat|concert|party|dinosaur|sign\b|plaque|interior|room|lecture|class|students|people|lights|christmas|match|game|stadium|ceremony|visit|meeting|conference/i;
const FREE =/^(cc0|cc[ -]by(-sa)?[ -]?[\d.]*|public domain|pd|attribution)/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(host, params) {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null);
    if (!res || res.status === 429) {
      await sleep(5000 * 2 ** attempt);
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }
  throw new Error(`gave up after retries: ${url}`);
}
const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const credits = JSON.parse(readFileSync('src/data/photos.json', 'utf8'));
const hasPhoto = (id) => existsSync(join('src/assets/campus', `${id}.jpg`));
// Photos already on the site without a known author come first: they are the ones to replace.
const queue = [...universities.filter((u) => hasPhoto(u.id)), ...universities.filter((u) => !hasPhoto(u.id))]
  .filter((u) => !credits[u.id]);

const out = existsSync('scripts/photo-candidates.json') ? JSON.parse(readFileSync('scripts/photo-candidates.json', 'utf8')) : {};
for (const u of queue) {
  if (out[u.id]?.length && (!downloadDir || existsSync(join(downloadDir, `${u.id}.0.jpg`)))) continue;
  const candidates = [];
  const seen = new Set();
  // Commons-curated photos first (Quality / Valued / Featured), then building shots, then whatever
  // is filed directly in the university's own category. The bonus feeds the ranking below.
  const queries = [
    [3, `filetype:bitmap "${u.wikiTitle}" incategory:Quality_images|Valued_images|Featured_pictures_on_Wikimedia_Commons`],
    [1.5, `filetype:bitmap "${u.wikiTitle}" building`],
    [0, `filetype:bitmap incategory:"${u.wikiTitle}"`],
  ];
  for (const [bonus, query] of queries) {
    const info = await api('commons.wikimedia.org', {
      action: 'query', generator: 'search', gsrnamespace: '6', gsrlimit: '40', gsrsearch: query,
      prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1600',
    }).catch((err) => (console.warn(`  ${u.id}: ${err.message}`), { query: { pages: [] } }));
    for (const p of info.query?.pages ?? []) {
      if (!/\.jpe?g$/i.test(p.title) || SKIP.test(p.title)) continue;
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const m = ii.extmetadata ?? {};
      const license = strip(m.LicenseShortName?.value);
      if (!FREE.test(license)) continue;
      if (ii.width < 1200 || ii.width < ii.height * 1.15) continue;
      const name = p.title.replace(/^File:/, '');
      if (seen.has(name)) continue;
      seen.add(name);
      const nameTokens = u.name.toLowerCase().split(/\W+/).filter((t) => t.length > 3);
      const score = bonus + (GOOD.test(name) ? 2 : 0) - (BAD.test(name) ? 2 : 0) +
        (nameTokens.some((t) => name.toLowerCase().includes(t)) ? 1 : 0) + Math.min(ii.width / 4000, 1);
      candidates.push({
        file: name, score: Number(score.toFixed(2)), width: ii.width, height: ii.height,
        thumb: ii.thumburl, page: ii.descriptionurl,
        author: strip(m.Artist?.value) || 'unknown', license, licenseUrl: m.LicenseUrl?.value ?? null,
      });
    }
    await sleep(900);
  }
  candidates.sort((a, b) => b.score - a.score);
  out[u.id] = candidates.slice(0, 4);
  console.log(`${u.id}: ${candidates.length ? candidates[0].file : '— none'}`);
  if (downloadDir && candidates[0]) {
    mkdirSync(downloadDir, { recursive: true });
    for (const [n, c] of candidates.slice(0, 3).entries()) {
      const target = join(downloadDir, `${u.id}.${n}.jpg`);
      if (!existsSync(target)) await download(c.thumb, target);
      await sleep(900);
    }
  }
  // Save progress after every university so an interrupted run loses nothing.
  writeFileSync('scripts/photo-candidates.json', JSON.stringify(out, null, 1) + '\n');
  await sleep(900);
}

async function download(url, target) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.ok) return writeFileSync(target, Buffer.from(await res.arrayBuffer()));
      if (res.status !== 429) return console.warn(`  skip ${res.status} ${url}`);
    } catch (err) {
      console.warn(`  retry ${attempt + 1}: ${err.cause?.message ?? err.message}`);
    }
    await sleep(4000 * (attempt + 1));
  }
}
writeFileSync('scripts/photo-candidates.json', JSON.stringify(out, null, 1) + '\n');
console.log(`\n${Object.values(out).filter((c) => c.length).length}/${Object.keys(out).length} universities have candidates`);

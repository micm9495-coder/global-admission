// Applies official university cost data from data-updates/official-costs.json.
//
//   node scripts/apply-official-costs.mjs [YYYY-MM-DD]   # date the figures were checked, default today
//
// For each university in the file it rewrites `budget` in src/data/universities.json and replaces
// the cost of every program row that still carries the old planning estimate. Rows with a
// course-specific published fee are left alone. Totals are only filled from the university's own
// figures (a published cost of attendance, or tuition + the university's living-cost estimate).
import { readFileSync, writeFileSync } from 'node:fs';

const ESTIMATE = 'Ориентир для планирования';
const checked = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const updates = JSON.parse(readFileSync('data-updates/official-costs.json', 'utf8'));
const universities = JSON.parse(readFileSync('src/data/universities.json', 'utf8'));
const programs = JSON.parse(readFileSync('src/data/programs.json', 'utf8'));

const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/\s/g, ' ');
const range = ([a, b], cur) => (a === b ? `${fmt(a)} ${cur}` : `${fmt(a)}–${fmt(b)} ${cur}`);

let changedPrograms = 0;
for (const [id, u] of Object.entries(updates)) {
  if (id.startsWith('_')) continue;
  const uni = universities.find((x) => x.id === id);
  if (!uni) throw new Error(`unknown university id: ${id}`);
  if (!u.source?.startsWith('https://')) throw new Error(`${id}: source must be an https URL`);

  let total;
  let type;
  if (u.total) {
    total = range(u.total, u.currency);
    type = 'Официальный бюджет вуза';
  } else if (u.living) {
    const extra = u.extra ?? [0, 0];
    total = range([u.tuition[0] + u.living[0] + extra[0], u.tuition[1] + u.living[1] + extra[1]], u.currency);
    type = 'Официальный тариф + расходы по оценке вуза';
  } else {
    total = 'вуз не публикует';
    type = 'Официальный тариф; бюджет вуз не публикует';
  }
  const budget = { tuition: range(u.tuition, u.currency), total, year: u.year, type, note: u.note, source: u.source, checked };

  const old = uni.budget;
  uni.budget = budget;
  for (const p of programs) {
    if (p.university !== id || p.cost.type !== ESTIMATE) continue;
    p.cost = { ...budget, note: `Диапазон по вузу: точная сумма зависит от программы. ${budget.note}` };
    changedPrograms++;
  }
  console.log(`${id}: ${old.tuition} (${old.type}) → ${budget.tuition} (${type})`);
}

writeFileSync('src/data/universities.json', JSON.stringify(universities, null, 1) + '\n');
writeFileSync('src/data/programs.json', JSON.stringify(programs, null, 1) + '\n');
console.log(`\nprogram rows updated: ${changedPrograms}`);

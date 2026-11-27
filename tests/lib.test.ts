import { describe, expect, it } from 'vitest';
import { norm, plural, scaleCells, monogramSize } from '../src/lib/text';
import { matchesUniversity, qsQuery, universityHaystack } from '../src/lib/search';
import { average } from '../src/lib/ratings';
import universities from '../src/data/universities.json';
import programs from '../src/data/programs.json';

describe('text', () => {
  it('folds ё and case', () => expect(norm('  Ёлка ')).toBe('елка'));
  it('picks Russian plural forms', () => {
    expect(plural(1, 'вуз', 'вуза', 'вузов')).toBe('1 вуз');
    expect(plural(3, 'вуз', 'вуза', 'вузов')).toBe('3 вуза');
    expect(plural(11, 'вуз', 'вуза', 'вузов')).toBe('11 вузов');
    expect(plural(24, 'экзамен', 'экзамена', 'экзаменов')).toBe('24 экзамена');
    expect(plural(100, 'вуз', 'вуза', 'вузов')).toBe('100 вузов');
  });
  it('splits short score ranges into cells', () => {
    expect(scaleCells('400–1600')).toEqual(['4', '0', '0', '–', '1', '6', '0', '0']);
    expect(scaleCells('A*–E')).toEqual(['A', '*', '–', 'E']);
    expect(scaleCells('1–6 (новая шкала 2026)')).toBeNull();
    expect(scaleCells('Cambridge English Scale')).toBeNull();
  });
  it('shrinks long names', () => expect(monogramSize('MIT')).toBeGreaterThan(monogramSize('University of Melbourne')));
});

describe('university search', () => {
  const oxford = universities.find((u) => u.id === 'oxford')!;
  const hay = universityHaystack(oxford);
  it('finds by Russian alias', () => expect(matchesUniversity(hay, oxford.ranks.qs, 'оксфорд')).toBe(true));
  it('finds by country and city words together', () =>
    expect(matchesUniversity(hay, oxford.ranks.qs, 'великобритания оксфорд')).toBe(true));
  it('treats #N as an exact QS place', () => {
    expect(qsQuery('#4')).toBe(4);
    expect(matchesUniversity(hay, oxford.ranks.qs, '#4')).toBe(true);
    expect(matchesUniversity(hay, oxford.ranks.qs, '#5')).toBe(false);
  });
  it('lists both universities tied at QS 25', () => {
    const tied = universities.filter((u) => matchesUniversity(universityHaystack(u), u.ranks.qs, '#25'));
    expect(tied.map((u) => u.name).sort()).toEqual(expect.arrayContaining(['Princeton']));
    expect(tied.length).toBeGreaterThanOrEqual(2);
  });
});

describe('data integrity', () => {
  const ids = new Set(universities.map((u) => u.id));
  it('has 100 universities with unique ids', () => expect(ids.size).toBe(100));
  it('links every program to an existing university', () =>
    expect(programs.filter((p) => !ids.has(p.university))).toEqual([]));
  it('keeps all 877 programs', () => expect(programs).toHaveLength(877));
});

describe('ratings', () => {
  it('averages scores and treats missing as zero', () => {
    expect(average([10, 5])).toBe(7.5);
    expect(average(undefined)).toBe(0);
  });
});

describe('photo credits', async () => {
  const { existsSync } = await import('node:fs');
  const credits: Record<string, { source: string }> = (await import('../src/data/photos.json')).default;
  const ids = new Set(universities.map((u) => u.id));
  it('credit every photo to an existing university with a file on disk', () => {
    for (const id of Object.keys(credits)) {
      expect(ids.has(id), id).toBe(true);
      expect(existsSync(`src/assets/campus/${id}.jpg`), id).toBe(true);
      expect(credits[id]!.source).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    }
  });
  it('has a credit for every photo on the site', async () => {
    const { readdirSync } = await import('node:fs');
    const files = readdirSync('src/assets/campus').map((f) => f.replace(/\.jpg$/, ''));
    expect(files.filter((id) => !credits[id])).toEqual([]);
  });
});

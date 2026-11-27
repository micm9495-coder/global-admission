import { norm } from './text';

interface UniversityLike {
  name: string;
  country: string;
  wikiTitle: string;
  city: string;
  aliases: string[];
  ranks: { qs: number | null; the: number | null; usNews: number | null; national: number | null };
}

/** Everything a visitor might type to find a university, in one normalized string. */
export function universityHaystack(u: UniversityLike): string {
  const ranks = [u.ranks.qs, u.ranks.the, u.ranks.usNews, u.ranks.national]
    .filter((v): v is number => v !== null)
    .map((v) => `#${v} № ${v}`);
  return norm([u.name, u.country, u.wikiTitle, u.city, ...u.aliases, ...ranks].join(' '));
}

/** «25» or «#25» means "QS place 25"; returns that number, otherwise null. */
export function qsQuery(query: string): number | null {
  const q = query.trim();
  return /^#?\d+$/.test(q) ? Number(q.replace('#', '')) : null;
}

/** True when every word of the query occurs somewhere in the haystack. */
export function matchesAllWords(haystack: string, query: string): boolean {
  const words = norm(query).split(/\s+/).filter(Boolean);
  return words.every((w) => haystack.includes(w));
}

export function matchesUniversity(haystack: string, qs: number | null, query: string): boolean {
  const place = qsQuery(query);
  return place !== null ? qs === place : matchesAllWords(haystack, query);
}

/**
 * The visitor's own scores for universities, kept in this browser only.
 * The storage key matches the old single-file site, so existing scores carry over.
 */
const KEY = 'ga-ratings';

export type Ratings = Record<string, number[]>;

export function loadRatings(): Ratings {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Ratings) : {};
  } catch {
    return {};
  }
}

/** Returns false when the browser refuses to store data (private mode, blocked storage). */
export function saveRating(name: string, scores: number[]): boolean {
  const all = loadRatings();
  all[name] = scores;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

export function average(scores: number[] | undefined): number {
  return scores?.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

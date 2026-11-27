/** Lowercase, trim and fold «ё» into «е» so search ignores those differences. */
export const norm = (s: string): string => s.toLowerCase().replaceAll('ё', 'е').trim();

/** Russian plural: plural(5, 'экзамен', 'экзамена', 'экзаменов') → «5 экзаменов». */
export function plural(n: number, one: string, few: string, many: string): string {
  const a = n % 10;
  const b = n % 100;
  const word = a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
  return `${n} ${word}`;
}

/**
 * Splits a short score range such as «400–1600» or «A*–E» into answer-sheet cells.
 * Returns null for anything that is not a short range, which is then shown as plain text.
 */
export function scaleCells(scale: string): string[] | null {
  if (!/^[0-9A-Z*]{1,4}[–-][0-9A-Z*]{1,4}$/.test(scale)) return null;
  return [...scale].map((ch) => (ch === '-' ? '–' : ch));
}

/** Font size for the name shown in place of a missing campus photo. */
export function monogramSize(name: string): number {
  const n = name.length;
  return n <= 4 ? 46 : n <= 10 ? 32 : n <= 18 ? 25 : 21;
}

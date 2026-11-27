/** Prefixes a site path with the deploy base (e.g. «/global-admission/» on GitHub Pages). */
export function withBase(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

/** Google search restricted to the university's own domain. */
export function officialSearch(website: string, name: string, query: string): string {
  const host = new URL(website).hostname.replace(/^www\./, '');
  return 'https://www.google.com/search?q=' + encodeURIComponent(`site:${host} ${name} ${query}`);
}

export const wikiUrl = (title: string): string =>
  'https://en.wikipedia.org/wiki/' + encodeURIComponent(title.replaceAll(' ', '_'));

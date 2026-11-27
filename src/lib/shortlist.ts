/**
 * «Мой список»: universities the visitor is considering, with where they are in the process
 * and a private note. Stored in this browser only.
 */
export const STATUSES = ['Присматриваюсь', 'Готовлю документы', 'Подал заявку', 'Пришёл ответ'] as const;
export type Status = (typeof STATUSES)[number];

export interface Entry {
  status: Status;
  note: string;
  /** Milliseconds since epoch; keeps the list in the order things were added. */
  added: number;
}
export type Shortlist = Record<string, Entry>;

const KEY = 'ga-shortlist';

/** Drops anything malformed so a hand-edited or old value can never break the page. */
export function parse(raw: string | null): Shortlist {
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    const out: Shortlist = {};
    for (const [id, v] of Object.entries(data as Record<string, Partial<Entry>>)) {
      if (!v || typeof v !== 'object') continue;
      out[id] = {
        status: STATUSES.includes(v.status as Status) ? (v.status as Status) : STATUSES[0],
        note: typeof v.note === 'string' ? v.note : '',
        added: typeof v.added === 'number' ? v.added : 0,
      };
    }
    return out;
  } catch {
    return {};
  }
}

export function toggle(list: Shortlist, id: string, now = Date.now()): Shortlist {
  const next = { ...list };
  if (next[id]) delete next[id];
  else next[id] = { status: STATUSES[0], note: '', added: now };
  return next;
}

export function update(list: Shortlist, id: string, patch: Partial<Pick<Entry, 'status' | 'note'>>): Shortlist {
  const current = list[id];
  return current ? { ...list, [id]: { ...current, ...patch } } : list;
}

/** Ids in the order they were added. */
export const orderedIds = (list: Shortlist): string[] =>
  Object.entries(list).sort((a, b) => a[1].added - b[1].added).map(([id]) => id);

export function load(): Shortlist {
  try {
    return parse(localStorage.getItem(KEY));
  } catch {
    return {};
  }
}

/**
 * Returns false when the browser refuses to store data (private mode, blocked storage).
 * `notify: false` skips the re-render event, for edits typed into a field that is already on screen.
 */
export function save(list: Shortlist, { notify = true } = {}): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    if (notify) window.dispatchEvent(new CustomEvent('shortlist-change'));
    return true;
  } catch {
    return false;
  }
}

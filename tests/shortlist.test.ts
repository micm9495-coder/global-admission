import { describe, expect, it } from 'vitest';
import { STATUSES, orderedIds, parse, toggle, update } from '../src/lib/shortlist';

describe('shortlist', () => {
  it('adds and removes with toggle', () => {
    const a = toggle({}, 'oxford', 1);
    expect(a.oxford).toEqual({ status: STATUSES[0], note: '', added: 1 });
    expect(toggle(a, 'oxford')).toEqual({});
  });

  it('updates status and note of a saved university only', () => {
    const a = toggle({}, 'mit', 1);
    const b = update(a, 'mit', { status: 'Подал заявку', note: 'дедлайн 1 января' });
    expect(b.mit).toMatchObject({ status: 'Подал заявку', note: 'дедлайн 1 января' });
    expect(update(b, 'eth-zurich', { note: 'x' })).toBe(b);
  });

  it('keeps the order in which universities were added', () => {
    let s = toggle({}, 'nus', 3);
    s = toggle(s, 'mit', 1);
    s = toggle(s, 'ucl', 2);
    expect(orderedIds(s)).toEqual(['mit', 'ucl', 'nus']);
  });

  it('survives broken or foreign stored values', () => {
    expect(parse(null)).toEqual({});
    expect(parse('not json')).toEqual({});
    expect(parse('[1,2]')).toEqual({});
    expect(parse('{"mit":{"status":"???","note":5}}')).toEqual({ mit: { status: STATUSES[0], note: '', added: 0 } });
  });
});

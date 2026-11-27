import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { norm } from '@/lib/text';
import type { ProgramRow } from '@/lib/types';

export const GET: APIRoute = async () => {
  const [programs, universities] = await Promise.all([getCollection('programs'), getCollection('universities')]);
  const byId = new Map(universities.map((u) => [u.id, u.data]));
  const rows: ProgramRow[] = programs.map(({ data: p }) => {
    const u = byId.get(p.university.id)!;
    return {
      uni: u.name,
      uniId: p.university.id,
      name: p.name,
      kind: p.kind,
      area: p.area,
      rank: p.areaRank,
      search: norm([u.name, u.country, u.wikiTitle, p.name, p.kind, p.keywords].join(' ')),
      cost: p.cost,
      req: p.requirements,
      alumni: u.alumni.join(', '),
    };
  });
  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
};

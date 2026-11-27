/** One row of the programs table, served as /data/programs.json and rendered in the browser. */
export interface ProgramRow {
  uni: string;
  uniId: string;
  name: string;
  kind: string;
  area: string;
  rank: number | null;
  search: string;
  cost: { tuition: string; total: string; year: string; type: string; note: string; source: string };
  req: { text: string; type: string; link: string };
  alumni: string;
}

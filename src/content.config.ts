import { defineCollection, reference } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const link = z.object({ label: z.string(), url: z.url() });

/** A cost figure plus where it came from and how reliable it is. */
const cost = z.object({
  tuition: z.string(),
  total: z.string(),
  year: z.string(),
  type: z.string(),
  note: z.string(),
  source: z.url(),
  /** Date the figures were checked against the university's own site (YYYY-MM-DD). */
  checked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const rank = z.number().int().positive().nullable();

const universities = defineCollection({
  loader: file('src/data/universities.json'),
  schema: z.object({
    order: z.number().int().nonnegative(),
    name: z.string(),
    country: z.string(),
    website: z.url(),
    wikiTitle: z.string(),
    founded: z.string(),
    city: z.string(),
    history: z.string(),
    academicProfile: z.string(),
    admissionOverview: z.string(),
    /** University-specific admission caveat (language of study, separate application system…). */
    admissionNote: z.object({ text: z.string(), link: link.nullable() }).nullable(),
    admissionsUrl: z.url(),
    strengths: z.string(),
    alumni: z.array(z.string()),
    ranks: z.object({ qs: rank, the: rank, usNews: rank, national: rank }),
    extraRanks: z.array(z.object({ label: z.string(), rank: z.number(), url: z.url() })),
    /** Extra search terms, e.g. Russian spellings. */
    aliases: z.array(z.string()),
    catalog: z.object({ official: z.boolean(), note: z.string().nullable(), url: z.url().nullable() }),
    budget: cost,
  }),
});

const countries = defineCollection({
  loader: file('src/data/countries.json'),
  schema: z.object({
    currency: z.string().length(3),
    costGuideUrl: z.url(),
    rulesUrl: z.url(),
    certificateNote: z.string(),
  }),
});

const programs = defineCollection({
  loader: file('src/data/programs.json'),
  schema: z.object({
    university: reference('universities'),
    name: z.string(),
    kind: z.string(),
    area: z.string(),
    areaRank: rank,
    keywords: z.string(),
    cost,
    requirements: z.object({ text: z.string(), type: z.string(), link: z.url() }),
  }),
});

const exams = defineCollection({
  loader: file('src/data/exams.json'),
  schema: z.object({
    order: z.number().int().nonnegative(),
    name: z.string(),
    category: z.enum(['Английский', 'Поступление', 'Школьные квалификации', 'Магистратура', 'Другие языки']),
    region: z.string(),
    duration: z.string(),
    scale: z.string(),
    structure: z.string(),
    notes: z.string(),
    officialUrl: z.url(),
    components: z.string(),
    otherComponents: z.string(),
    practiceUrl: z.url(),
  }),
});

/** Who took each campus photo and under which licence; keyed by university id. */
const photos = defineCollection({
  loader: file('src/data/photos.json'),
  schema: z.object({
    file: z.string(),
    author: z.string(),
    license: z.string(),
    licenseUrl: z.url().nullable(),
    source: z.url(),
  }),
});

export const collections = { universities, countries, programs, exams, photos };

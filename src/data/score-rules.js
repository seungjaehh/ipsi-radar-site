// SAMPLE conversion rules for the fictional sample universities. The numbers are made up.
// Real rules are extracted from each university's 모집요강 and marked verified by a person (docs/COLLECTION.md).
const SAMPLE = { name: '샘플 데이터(가상)', url: null, sample: true };
const ENG_DEDUCT = { 1: 0, 2: 2, 3: 5, 4: 9, 5: 14, 6: 20, 7: 27, 8: 35, 9: 44 };
const HIST_ADD = { 1: 10, 2: 10, 3: 10, 4: 9.8, 5: 9.6, 6: 9.4, 7: 9.2, 8: 9, 9: 8.8 };

export const SAMPLE_SCORE_RULES = [
  { id: 'garam-main-csat-nat', kind: 'csat', univId: 'garam-main', year: 2027, track: '자연', scale: 1000, source: SAMPLE, asOf: '2026-09-20', verified: true,
    parts: [{ subject: 'korean', basis: 'standard', max: 150, weight: 0.25 }, { subject: 'math', basis: 'standard', max: 150, weight: 0.4 }, { subject: 'inquiry', basis: 'percentile', count: 2, weight: 0.35 }],
    english: { mode: 'deduct', table: ENG_DEDUCT }, history: { mode: 'add', table: HIST_ADD } },
  { id: 'garam-main-csat-hum', kind: 'csat', univId: 'garam-main', year: 2027, track: '인문', scale: 1000, source: SAMPLE, asOf: '2026-09-20', verified: true,
    parts: [{ subject: 'korean', basis: 'standard', max: 150, weight: 0.4 }, { subject: 'math', basis: 'standard', max: 150, weight: 0.3 }, { subject: 'inquiry', basis: 'percentile', count: 2, weight: 0.3 }],
    english: { mode: 'deduct', table: ENG_DEDUCT }, history: { mode: 'add', table: HIST_ADD } },
  { id: 'hanul-csat', kind: 'csat', univId: 'hanul', year: 2027, track: '공통', scale: 600, source: SAMPLE, asOf: '2026-09-18', verified: true,
    parts: [{ subject: 'korean', basis: 'percentile', weight: 0.3 }, { subject: 'math', basis: 'percentile', weight: 0.3 }, { subject: 'inquiry', basis: 'percentile', count: 2, weight: 0.25 }],
    english: { mode: 'weighted', weight: 0.15, table: { 1: 100, 2: 96, 3: 90, 4: 82, 5: 72, 6: 60, 7: 46, 8: 30, 9: 12 } }, history: { mode: 'deduct', table: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5, 9: 6 } } },
  { id: 'bitnara-csat', kind: 'csat', univId: 'bitnara-nat', year: 2027, track: '공통', scale: 500, source: SAMPLE, asOf: '2026-09-16', verified: true,
    parts: [{ subject: 'korean', basis: 'standard', max: 150, weight: 0.3 }, { subject: 'math', basis: 'standard', max: 150, weight: 0.35 }, { subject: 'inquiry', basis: 'standard', max: 75, count: 2, weight: 0.35 }],
    english: { mode: 'add', table: { 1: 20, 2: 19, 3: 17, 4: 14, 5: 10, 6: 6, 7: 3, 8: 1, 9: 0 } }, history: { mode: 'add', table: HIST_ADD } },
  { id: 'garam-main-school', kind: 'school', univId: 'garam-main', year: 2027, scale: 1000, source: SAMPLE, asOf: '2026-09-20', verified: true,
    subjects: ['korean', 'english', 'math', 'social', 'science'], yearWeights: { 1: 0.2, 2: 0.4, 3: 0.4 },
    gradeTable: { 1: 100, 2: 98, 3: 95, 4: 90, 5: 82, 6: 70, 7: 55, 8: 35, 9: 10 } },
  // Not verified yet: never shown (docs/COLLECTION.md, review queue).
  { id: 'saebit-csat-draft', kind: 'csat', univId: 'saebit', year: 2027, track: '공통', scale: 1000, source: SAMPLE, asOf: '2026-09-15', verified: false,
    parts: [{ subject: 'korean', basis: 'percentile', weight: 0.5 }, { subject: 'math', basis: 'percentile', weight: 0.5 }],
    english: { mode: 'add', table: ENG_DEDUCT }, history: { mode: 'add', table: HIST_ADD } },
];

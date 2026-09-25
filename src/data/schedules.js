// SAMPLE schedules for the fictional sample universities. Real schedules come from each university's
// admissions notice; every item must keep its source and as-of date (docs/PRODUCT.md §7, §8-4).
const SAMPLE = { name: '샘플 데이터(가상)', url: null, sample: true };

export const SAMPLE_SCHEDULES = [
  { id: 'garam-main-essay', univId: 'garam-main', kind: '논술', title: '가람대 논술고사 (인문계열)', start: '2026-11-21T10:00:00+09:00', end: '2026-11-21T12:00:00+09:00', source: SAMPLE, asOf: '2026-09-20' },
  { id: 'garam-main-essay-sci', univId: 'garam-main', kind: '논술', title: '가람대 논술고사 (자연계열)', start: '2026-11-22T14:00:00+09:00', end: '2026-11-22T16:00:00+09:00', source: SAMPLE, asOf: '2026-09-20' },
  { id: 'garam-main-result', univId: 'garam-main', kind: '발표', title: '가람대 수시 최초 합격자 발표', start: '2026-12-12T17:00:00+09:00', source: SAMPLE, asOf: '2026-09-20' },
  { id: 'hanul-interview', univId: 'hanul', kind: '면접', title: '한울대 학생부종합 면접', start: '2026-11-28T09:00:00+09:00', end: '2026-11-29T18:00:00+09:00', source: SAMPLE, asOf: '2026-09-18' },
  { id: 'hanul-result', univId: 'hanul', kind: '발표', title: '한울대 수시 합격자 발표', start: '2026-12-10T14:00:00+09:00', source: SAMPLE, asOf: '2026-09-18' },
  { id: 'saebit-interview', univId: 'saebit', kind: '면접', title: '새빛대 간호학과 면접', start: '2026-12-05T10:00:00+09:00', source: SAMPLE, asOf: '2026-09-15' },
  { id: 'yeoul-essay', univId: 'yeoul', kind: '논술', title: '여울대 약학과 논술', start: '2026-11-29T13:00:00+09:00', end: '2026-11-29T15:30:00+09:00', source: SAMPLE, asOf: '2026-09-22' },
  { id: 'dasom-interview', univId: 'dasom-edu', kind: '면접', title: '다솜교대 교직적성 면접', start: '2026-12-03T08:30:00+09:00', source: SAMPLE, asOf: '2026-09-19' },
  { id: 'bitnara-result', univId: 'bitnara-nat', kind: '발표', title: '빛나라국립대 수시 합격자 발표', start: '2026-12-11T10:00:00+09:00', source: SAMPLE, asOf: '2026-09-16' },
  { id: 'nosource', univId: 'nuri', kind: '면접', title: '출처가 없는 일정(표시 안 됨)', start: '2026-12-01T10:00:00+09:00', source: null, asOf: null },
];

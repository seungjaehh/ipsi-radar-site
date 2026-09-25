// Explore and compare universities by what matters to the student (docs/PRODUCT.md §3).
// Pure functions: the browser and the tests use the same code.

// Out of scope: junior colleges, remote/cyber universities, company-run 기술대학 and 각종학교 (docs/PRODUCT.md §2).
export const EXCLUDED_TYPES = ['전문대학', '원격대학', '사이버대학', '방송통신대학', '기술대학', '기능대학', '각종학교'];

// Each value maps to one metric. We order by these; we never publish a rank (docs/PRODUCT.md §5).
export const VALUES = [
  { id: 'employment', label: '취업', metric: 'employmentRate', better: 'high', hint: '학교 전체 취업률' },
  { id: 'prestige', label: '간판', metric: 'admission70', better: 'high', hint: '입시결과 70% 컷(백분위)' },
  { id: 'cost', label: '비용', metric: 'tuition', better: 'low', hint: '연 등록금' },
  { id: 'support', label: '장학', metric: 'scholarship', better: 'high', hint: '1인당 장학금' },
  { id: 'life', label: '생활', metric: 'dormRate', better: 'high', hint: '기숙사 수용률' },
  { id: 'stability', label: '학업 지속', metric: 'dropoutRate', better: 'low', hint: '중도탈락률' },
];

export const METRIC_LABELS = {
  employmentRate: '취업률', admission70: '입시결과 70% 컷', tuition: '연 등록금',
  scholarship: '1인당 장학금', dormRate: '기숙사 수용률', dropoutRate: '중도탈락률',
};

export const isEligible = u => !EXCLUDED_TYPES.includes(u.type);
export const eligible = list => list.filter(isEligible);

// A number is shown only with a source and an as-of date.
export function metricOf(u, key) {
  const x = u.metrics?.[key];
  return x && Number.isFinite(x.value) && x.source && x.asOf ? x : null;
}

export const displayName = u => (u.campus && u.campus !== '본교' ? `${u.name} (${u.campus})` : u.name);
export const isBranch = u => Boolean(u.campus && u.campus !== '본교');

// 이 기준(value)의 실제 자료가 목록에 몇 곳이나 있는지. 0이면 이 기준을 선택해도 순서가 바뀌지 않는다
// (모든 학교가 동점 처리되어 가나다순으로 빠짐) — 화면에서 "자료 없음"으로 알려주기 위한 것.
export function valueCoverage(list, valueId) {
  const v = VALUES.find(x => x.id === valueId);
  if (!v) return { withData: 0, total: list.length };
  return { withData: list.filter(u => metricOf(u, v.metric)).length, total: list.length };
}

export function search(list, { q = '', region = '', campus = '' } = {}) {
  const needle = q.trim().toLowerCase();
  return eligible(list).filter(u =>
    (!needle || u.name.toLowerCase().includes(needle) || u.majors?.some(m => m.name.toLowerCase().includes(needle))) &&
    (!region || u.region === region) &&
    (!campus || (campus === 'main' ? !isBranch(u) : isBranch(u))));
}

// Weights: { valueId: 0..3 }. Returns a new array in the chosen order; metric values are never touched.
// Missing metrics count as the middle of the range so they neither win nor lose.
export function orderByValues(list, weights = {}) {
  const active = VALUES.filter(v => (weights[v.id] ?? 0) > 0);
  if (!active.length) return [...list].sort((a, b) => displayName(a).localeCompare(displayName(b), 'ko'));
  const ranges = Object.fromEntries(active.map(v => {
    const xs = list.map(u => metricOf(u, v.metric)?.value).filter(Number.isFinite);
    return [v.id, { lo: Math.min(...xs), hi: Math.max(...xs) }];
  }));
  const score = u => active.reduce((sum, v) => {
    const { lo, hi } = ranges[v.id], x = metricOf(u, v.metric)?.value;
    let s = Number.isFinite(x) && hi > lo ? (x - lo) / (hi - lo) : 0.5;
    if (v.better === 'low') s = 1 - s;
    return sum + s * weights[v.id];
  }, 0);
  return list.map(u => ({ u, s: score(u) }))
    .sort((a, b) => b.s - a.s || displayName(a.u).localeCompare(displayName(b.u), 'ko'))
    .map(x => x.u);
}

// Comparison table: rows follow the student's priorities, columns are the chosen universities.
export function compareRows(list, weights = {}) {
  const order = [...VALUES].sort((a, b) => (weights[b.id] ?? 0) - (weights[a.id] ?? 0));
  return order.map(v => ({
    value: v,
    label: METRIC_LABELS[v.metric],
    cells: list.map(u => metricOf(u, v.metric)),
  }));
}

// Four-year cost estimate for parents (docs/PRODUCT.md §4). Clearly an estimate.
export function fourYearCost(u, { housing = 'dorm', monthlyRent = 55, dormPerYear = 280, commutePerMonth = 8 } = {}) {
  const tuition = metricOf(u, 'tuition')?.value;
  if (!Number.isFinite(tuition)) return null;
  const living = housing === 'dorm' ? dormPerYear : housing === 'rent' ? monthlyRent * 12 : commutePerMonth * 12;
  return { tuition: tuition * 4, living: living * 4, total: (tuition + living) * 4, unit: '만원', estimate: true };
}

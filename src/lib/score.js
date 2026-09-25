// Score conversion (환산) by each university's published rule. Converts only; never predicts admission.
// A rule is data extracted from the university's 모집요강 and verified by a person (docs/COLLECTION.md).
//
// 정시 (CSAT) rule:
//   { kind: 'csat', univId, year, track, scale, source, asOf, verified,
//     parts: [{ subject: 'korean'|'math'|'inquiry', basis: 'standard'|'percentile', weight, max?, count? }],
//     english: { mode: 'add'|'deduct'|'weighted', table: {1..9: points}, weight? },
//     history: { mode: 'add'|'deduct', table: {1..9: points} } }
//   weighted parts: (score / max) * weight * scale. 'weighted' English: (table[grade] / table[1]) * weight * scale.
//   Part weights (+ English weight if 'weighted') sum to 1.
//
// 수시 교과 (school grades) rule:
//   { kind: 'school', univId, year, scale, source, asOf, verified,
//     subjects: ['korean','english','math','social','science'], yearWeights: {1:w,2:w,3:w},
//     gradeTable: {1..9 or 1..5: points} }   // points per grade, averaged by credits

export const SUBJECT_LABELS = { korean: '국어', math: '수학', english: '영어', inquiry: '탐구', history: '한국사', social: '사회', science: '과학' };
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d + 0; // + 0 turns -0 into 0
const grade = g => { const n = Number(g); if (!Number.isInteger(n) || n < 1 || n > 9) throw new Error(`등급은 1~9 정수여야 합니다: ${g}`); return n; };

// A rule is usable only when it has a source, an as-of date and a person's verification.
export const isUsableRule = r => Boolean(r?.source && r?.asOf && r?.verified);

export function validateCsatRule(r) {
  const errors = [];
  if (r.kind !== 'csat') errors.push('kind');
  if (!(r.scale > 0)) errors.push('scale');
  const w = r.parts.reduce((s, p) => s + p.weight, 0) + (r.english?.mode === 'weighted' ? r.english.weight : 0);
  if (Math.abs(w - 1) > 1e-6) errors.push(`weights sum ${w}`);
  for (const p of r.parts) {
    if (!['korean', 'math', 'inquiry'].includes(p.subject)) errors.push(`subject ${p.subject}`);
    if (!['standard', 'percentile'].includes(p.basis)) errors.push(`basis ${p.basis}`);
    if (p.basis === 'standard' && !(p.max > 0)) errors.push(`${p.subject} needs max for standard scores`);
  }
  for (const k of ['english', 'history']) {
    const t = r[k]?.table;
    if (!t || [1, 2, 3, 4, 5, 6, 7, 8, 9].some(g => !Number.isFinite(t[g]))) errors.push(`${k} table must cover grades 1-9`);
  }
  return errors;
}

// scores: { korean:{standard,percentile}, math:{standard,percentile}, inquiry:[{standard,percentile},{...}], english:grade, history:grade }
export function convertCsat(rule, scores) {
  const errors = validateCsatRule(rule);
  if (errors.length) throw new Error(`환산 규칙 오류: ${errors.join(', ')}`);
  const lines = [];
  for (const p of rule.parts) {
    let raw, max;
    if (p.subject === 'inquiry') {
      const list = (scores.inquiry ?? []).slice(0, p.count ?? 2);
      if (list.length < (p.count ?? 2)) throw new Error(`탐구 ${p.count ?? 2}과목 점수가 필요합니다.`);
      raw = list.reduce((s, x) => s + Number(x[p.basis]), 0) / list.length;
    } else raw = Number(scores[p.subject]?.[p.basis]);
    max = p.basis === 'percentile' ? 100 : p.max;
    if (!Number.isFinite(raw) || raw < 0 || raw > max) throw new Error(`${SUBJECT_LABELS[p.subject]} 점수를 확인해 주세요.`);
    lines.push({ subject: p.subject, label: SUBJECT_LABELS[p.subject], basis: p.basis, raw: round(raw), points: round((raw / max) * p.weight * rule.scale) });
  }
  const e = rule.english, eg = grade(scores.english);
  const ePoints = e.mode === 'weighted' ? (e.table[eg] / e.table[1]) * e.weight * rule.scale : e.mode === 'deduct' ? -Math.abs(e.table[eg]) : e.table[eg];
  lines.push({ subject: 'english', label: '영어', basis: `${eg}등급`, raw: eg, points: round(ePoints), mode: e.mode });
  const h = rule.history, hg = grade(scores.history);
  lines.push({ subject: 'history', label: '한국사', basis: `${hg}등급`, raw: hg, points: round(h.mode === 'deduct' ? -Math.abs(h.table[hg]) : h.table[hg]), mode: h.mode });
  return { total: round(lines.reduce((s, l) => s + l.points, 0)), scale: rule.scale, lines };
}

// records: [{ year: 1|2|3, subject, grade, credits }]
export function convertSchool(rule, records) {
  const used = records.filter(r => rule.subjects.includes(r.subject) && rule.yearWeights[r.year] > 0);
  if (!used.length) throw new Error('반영 과목의 성적이 없습니다.');
  let weighted = 0, weights = 0;
  const byYear = {};
  for (const r of used) {
    const g = grade(r.grade), c = Number(r.credits) || 1, pts = rule.gradeTable[g];
    if (!Number.isFinite(pts)) throw new Error(`${g}등급 점수가 규칙에 없습니다.`);
    const w = c * rule.yearWeights[r.year];
    weighted += pts * w; weights += w;
    (byYear[r.year] ??= { credits: 0, sum: 0 }); byYear[r.year].credits += c; byYear[r.year].sum += g * c;
  }
  const best = Math.max(...Object.values(rule.gradeTable));
  return {
    total: round((weighted / weights / best) * rule.scale),
    scale: rule.scale,
    average: Object.fromEntries(Object.entries(byYear).map(([y, v]) => [y, round(v.sum / v.credits)])),
  };
}

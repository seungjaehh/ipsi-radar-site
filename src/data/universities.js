// SAMPLE DATA. Every school here is fictional and every number is made up for the demo.
// Real data comes from `npm run import` (대학알리미 공시 파일 → data/universities.json), which replaces this list.
// A metric is shown only when it carries a source and an as-of date (docs/PRODUCT.md §7).

const SAMPLE = { name: '샘플 데이터(가상)', url: null, sample: true };
const m = (value, unit, asOf = '2026-09') => ({ value, unit, source: SAMPLE, asOf });

// tier: A 심층 / B 표준 / C 기본 (docs/PRODUCT.md §2). type follows 대학알리미 학교종류.
export const SAMPLE_UNIVERSITIES = [
  { id: 'garam-main', name: '가람대학교', campus: '본교', type: '대학교', region: '서울', city: '서울 종로구', tier: 'A', homepage: null,
    metrics: { employmentRate: m(71.2, '%'), admission70: m(94.1, '백분위'), tuition: m(812, '만원/년'), scholarship: m(398, '만원/인'), dormRate: m(14.3, '%'), dropoutRate: m(2.1, '%') },
    majors: [{ name: '경영학과', field: '경영경제', employmentRate: m(73.5, '%') }, { name: '컴퓨터공학과', field: '공학', employmentRate: m(79.8, '%') }, { name: '국어국문학과', field: '인문', employmentRate: m(58.2, '%') }] },
  { id: 'garam-2', name: '가람대학교', campus: '제2캠퍼스', type: '대학교', region: '충남', city: '충남 천안시', tier: 'B', homepage: null,
    metrics: { employmentRate: m(64.8, '%'), admission70: m(78.5, '백분위'), tuition: m(790, '만원/년'), scholarship: m(421, '만원/인'), dormRate: m(38.9, '%'), dropoutRate: m(5.6, '%') },
    majors: [{ name: '글로벌경영학과', field: '경영경제', employmentRate: m(62.1, '%') }, { name: '바이오공학과', field: '공학', employmentRate: m(66.4, '%') }] },
  { id: 'hanul', name: '한울대학교', campus: '본교', type: '대학교', region: '서울', city: '서울 마포구', tier: 'A', homepage: null,
    metrics: { employmentRate: m(68.4, '%'), admission70: m(91.7, '백분위'), tuition: m(845, '만원/년'), scholarship: m(352, '만원/인'), dormRate: m(11.8, '%'), dropoutRate: m(2.6, '%') },
    majors: [{ name: '미디어커뮤니케이션학과', field: '사회', employmentRate: m(64.0, '%') }, { name: '전자공학과', field: '공학', employmentRate: m(81.2, '%') }, { name: '심리학과', field: '사회', employmentRate: m(57.9, '%') }] },
  { id: 'saebit', name: '새빛대학교', campus: '본교', type: '대학교', region: '경기', city: '경기 수원시', tier: 'B', homepage: null,
    metrics: { employmentRate: m(66.1, '%'), admission70: m(84.2, '백분위'), tuition: m(768, '만원/년'), scholarship: m(405, '만원/인'), dormRate: m(22.4, '%'), dropoutRate: m(3.9, '%') },
    majors: [{ name: '기계공학과', field: '공학', employmentRate: m(74.6, '%') }, { name: '간호학과', field: '의약', employmentRate: m(88.3, '%') }] },
  { id: 'bitnara-nat', name: '빛나라국립대학교', campus: '본교', type: '대학교', region: '부산', city: '부산 금정구', tier: 'B', homepage: null, national: true,
    metrics: { employmentRate: m(63.5, '%'), admission70: m(86.0, '백분위'), tuition: m(432, '만원/년'), scholarship: m(310, '만원/인'), dormRate: m(19.7, '%'), dropoutRate: m(3.4, '%') },
    majors: [{ name: '조선해양공학과', field: '공학', employmentRate: m(77.0, '%') }, { name: '영어교육과', field: '교육', employmentRate: m(61.5, '%') }] },
  { id: 'dasom-edu', name: '다솜교육대학교', campus: '본교', type: '교육대학', region: '경기', city: '경기 안양시', tier: 'B', homepage: null, national: true,
    metrics: { employmentRate: m(76.9, '%'), admission70: m(88.8, '백분위'), tuition: m(356, '만원/년'), scholarship: m(280, '만원/인'), dormRate: m(26.1, '%'), dropoutRate: m(1.7, '%') },
    majors: [{ name: '초등교육과', field: '교육', employmentRate: m(76.9, '%') }] },
  { id: 'nuri', name: '누리대학교', campus: '본교', type: '대학교', region: '대전', city: '대전 유성구', tier: 'C', homepage: null,
    metrics: { employmentRate: m(61.0, '%'), tuition: m(742, '만원/년'), scholarship: m(446, '만원/인'), dormRate: m(31.2, '%'), dropoutRate: m(5.1, '%') },
    majors: [{ name: '소프트웨어학과', field: '공학', employmentRate: m(69.3, '%') }] },
  { id: 'haeoreum', name: '해오름대학교', campus: '본교', type: '대학교', region: '광주', city: '광주 북구', tier: 'C', homepage: null,
    metrics: { employmentRate: m(58.7, '%'), tuition: m(698, '만원/년'), scholarship: m(468, '만원/인'), dormRate: m(35.5, '%'), dropoutRate: m(6.2, '%') },
    majors: [{ name: '사회복지학과', field: '사회', employmentRate: m(63.8, '%') }] },
  { id: 'sanmaru-tech', name: '산마루산업대학교', campus: '본교', type: '산업대학', region: '경북', city: '경북 구미시', tier: 'C', homepage: null,
    metrics: { employmentRate: m(67.2, '%'), tuition: m(651, '만원/년'), scholarship: m(390, '만원/인'), dormRate: m(42.0, '%'), dropoutRate: m(7.4, '%') },
    majors: [{ name: '신소재공학과', field: '공학', employmentRate: m(70.1, '%') }] },
  { id: 'yeoul', name: '여울대학교', campus: '본교', type: '대학교', region: '서울', city: '서울 동대문구', tier: 'A', homepage: null,
    metrics: { employmentRate: m(69.9, '%'), admission70: m(89.9, '백분위'), tuition: m(801, '만원/년'), scholarship: m(377, '만원/인'), dormRate: m(9.6, '%'), dropoutRate: m(2.9, '%') },
    majors: [{ name: '약학과', field: '의약', employmentRate: m(92.4, '%') }, { name: '경제학과', field: '경영경제', employmentRate: m(66.7, '%') }] },
  { id: 'yeoul-2', name: '여울대학교', campus: '분교', type: '대학교', region: '강원', city: '강원 원주시', tier: 'C', homepage: null,
    metrics: { employmentRate: m(60.3, '%'), tuition: m(776, '만원/년'), scholarship: m(430, '만원/인'), dormRate: m(40.8, '%'), dropoutRate: m(6.8, '%') },
    majors: [{ name: '보건행정학과', field: '의약', employmentRate: m(65.2, '%') }] },
  // Excluded on load: 전문대학 is out of scope (docs/PRODUCT.md §2).
  { id: 'bom-college', name: '봄전문대학', campus: '본교', type: '전문대학', region: '경기', city: '경기 부천시', tier: 'C', homepage: null, metrics: {}, majors: [] },
];

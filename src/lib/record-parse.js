// 학교생활기록부(학생부) PDF에서 뽑아낸 텍스트를 성적·출결·활동으로 정리한다.
// 이 파일은 순수 함수만 담는다: 실제 PDF 읽기(pdf.js)는 public/app.js에서, 이 파일은 결과 텍스트만 받는다.
//
// 절대 하지 않는 것: 이름·주민등록번호·주소·학교명·반·번호·담임 이름은 추출하지 않는다.
// 학생부 1쪽(인적·학적사항)은 통째로 무시하고, "N. 제목" 형식의 절 제목으로 구간만 찾아 그 안의
// 표만 읽는다. 이 파일이 반환하는 값에는 위 식별정보가 절대 들어가지 않아야 한다(테스트로 고정).
//
// 학생부 레이아웃은 학교·연도마다 다르고, pdftotext로 뽑은 텍스트는 표의 셀이 줄바꿈으로 어긋나기도
// 한다. 그래서 이 추출은 "최선의 추정"이며, 모든 결과에 confidence를 남기고 화면에서 사람이 고치게 한다.

// ---------- 성적 (7. 교과학습발달상황) ----------
// 실제 표 한 행(예): "국어        국어         4    74/63.8(15.2)     C(318)  4"
// = 교과 과목 학점수 원점수/과목평균(표준편차) 성취도(수강자수) 석차등급(진로선택과목은 없음)
const GRADE_ROW = /([가-힣][가-힣·()\/0-9A-Za-z\s]{0,24}?)\s+(\d{1,2})\s+(\d{1,3})\s*\/\s*(\d{1,3}(?:\.\d)?)\s*\(\s*\d{1,2}(?:\.\d)?\s*\)\s*([A-E])\s*\(\s*(\d{1,4})\s*\)\s*(\d)?\s*$/;
const YEAR_MARK = /\[(\d)\s*학년\s*\]/g;

// 표에는 "교과"와 "과목" 두 칸이 있다. 대부분 같아서("국어 국어") 하나로 줄이고, 다르면
// ("과학 생명과학I") 실제 과목명(뒤 칸)을 subject로, 교과명(앞 칸)을 category로 따로 둔다.
function normalizeSubject(raw) {
  const tokens = raw.replace(/\s+/g, ' ').trim().split(' ').filter((t, i, arr) => t !== arr[i - 1]);
  return { subject: tokens.at(-1), category: tokens.length > 1 ? tokens[0] : null };
}

function splitByGradeYear(text) {
  const marks = [...text.matchAll(YEAR_MARK)];
  if (!marks.length) return [{ year: null, text }];
  return marks.map((m, i) => ({ year: Number(m[1]), text: text.slice(m.index, marks[i + 1]?.index ?? text.length) }));
}

export function extractGrades(text) {
  const grades = [];
  for (const { year, text: blockText } of splitByGradeYear(text)) {
    const seen = {}; // 같은 과목이 두 번째로 나오면 2학기로 본다 (학기 표시가 텍스트로 안 남는 경우가 있어서)
    for (const rawLine of blockText.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;
      const m = GRADE_ROW.exec(line);
      if (!m) continue;
      const { subject, category } = normalizeSubject(m[1]);
      const semesterIdx = (seen[subject] = (seen[subject] ?? 0) + 1);
      grades.push({
        year, semester: Math.min(semesterIdx, 2), subject, category,
        credit: Number(m[2]), rawScore: Number(m[3]), classAvg: Number(m[4]),
        achievement: m[5], classSize: Number(m[6]), rank: m[7] ? Number(m[7]) : null,
        confidence: year && m[7] ? 'high' : year ? 'medium' : 'low',
      });
    }
  }
  return grades;
}

// ---------- 출결 (2. 출결상황) ----------
// 실제 표는 학년별로 질병/미인정/기타 × 결석/지각/조퇴/결과 12개 숫자가 촘촘히 붙어 나와
// 글자만으로는 정확히 나눠 세기 어렵다. 그래서 "수업일수"와 "개근" 여부만 확실히 뽑고,
// 나머지는 사람이 원본에서 확인하도록 안내한다(지어내지 않는다).
const ATTEND_SECTION = /2\.\s*출\s*결\s*상\s*황([\s\S]{0,2000}?)(?:3\.\s*수\s*상|$)/;
const ATTEND_ROW = /^(\d)\s+(\d{2,3})\b(.*)$/;

export function extractAttendance(text) {
  const section = text.match(ATTEND_SECTION);
  if (!section) return { found: false, years: [] };
  const years = [];
  for (const rawLine of section[1].split(/\r?\n/)) {
    const m = ATTEND_ROW.exec(rawLine.trim());
    if (!m) continue;
    years.push({ year: Number(m[1]), classDays: Number(m[2]), perfectAttendance: /개근/.test(m[3]) });
  }
  return { found: years.length > 0, years };
}

// ---------- 수상경력 (3. 수상경력) ----------
// 실제 표는 상 이름과 날짜·수여기관이 서로 다른 줄로 밀려 나온다(칸 줄바꿈). 같은 항목인지 확실치
// 않아 confidence를 'low'로 두고, 날짜 하나에 가장 가까운 상 이름 하나만 짝짓는다.
const AWARD_DATE = /(20\d{2})\.(\d{1,2})\.(\d{1,2})\.?/;
const AWARD_TITLE = /^[^\d.][가-힣A-Za-z0-9()·,\s]{1,40}(?:상|위)$/;

export function extractAwards(text) {
  const section = text.match(/3\.\s*수\s*상\s*경\s*력([\s\S]{0,3000}?)(?:4\.\s*자격증|$)/);
  if (!section) return [];
  const lines = section[1].split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const awards = [];
  for (let i = 0; i < lines.length; i++) {
    const dm = lines[i].match(AWARD_DATE);
    if (!dm) continue;
    const date = `${dm[1]}-${String(dm[2]).padStart(2, '0')}-${String(dm[3]).padStart(2, '0')}`;
    const titleLine = [lines[i], ...lines.slice(Math.max(0, i - 2), i), ...lines.slice(i + 1, i + 3)]
      .find(l => AWARD_TITLE.test(l.replace(AWARD_DATE, '').trim()));
    awards.push({ date, title: titleLine ? titleLine.replace(AWARD_DATE, '').trim() : null, confidence: 'low' });
  }
  return awards;
}

// ---------- 봉사활동 실적 ----------
// 행마다 "개별시간  누계시간" 두 숫자가 끝에 붙는다. 마지막 행의 누계가 총 봉사시간에 가장 가깝지만
// 학년이 바뀌면 누계가 다시 시작되는 학교도 있어, 다음처럼 "누계로 보이는 값들의 최댓값"을 추정치로 쓴다.
const SERVICE_ROW = /(\d{1,2})\s+(\d{1,2})\s*$/;

export function extractServiceHours(text) {
  const section = text.match(/봉사활동\s*(?:실적)?([\s\S]{0,4000}?)(?:\n\d+\.\s|$)/);
  if (!section) return null;
  const totals = [...section[1].split(/\r?\n/)]
    .map(l => l.trim().match(SERVICE_ROW))
    .filter(Boolean)
    .map(m => Number(m[2]));
  return totals.length ? Math.max(...totals) : null;
}

// ---------- 요약 ----------
// 등급 흐름과 계열별 평균을 계산한다. 판단(합격 가능성 등)은 하지 않는다.
const round1 = n => Math.round(n * 10) / 10;

export function summarizeGrades(grades) {
  const ranked = grades.filter(g => g.rank);
  const withYear = ranked.filter(g => g.year);
  const byYear = {};
  for (const g of withYear) (byYear[g.year] ??= []).push(g.rank);
  const yearAvg = Object.fromEntries(Object.entries(byYear).map(([y, rs]) => [y, round1(rs.reduce((a, b) => a + b, 0) / rs.length)]));
  const overall = ranked.length ? round1(ranked.reduce((a, g) => a + g.rank, 0) / ranked.length) : null;
  const years = Object.keys(yearAvg).map(Number).sort();
  const trend = years.length >= 2 ? (yearAvg[years[0]] > yearAvg[years.at(-1)] ? 'improving' : yearAvg[years[0]] < yearAvg[years.at(-1)] ? 'declining' : 'flat') : 'unknown';
  return { overall, yearAvg, trend, subjectCount: new Set(grades.map(g => g.subject)).size, rankedCount: ranked.length, unrankedCount: grades.length - ranked.length };
}

// ---------- 전체 파이프라인 ----------
// 절대 포함하지 않는 것: 이름, 주민등록번호, 주소, 학교명, 반/번호, 담임 이름. 이 함수는 그런 필드를
// 만들지 않으며, 입력 텍스트 중 "1. 인적·학적사항" 구간은 아예 읽지 않는다(정규식이 그 절을 대상으로
// 하지 않음). 테스트(record-parse.test.js)가 실제 형식의 식별정보 섞인 입력으로 이를 고정한다.
export function analyzeRecordText(text) {
  const clean = String(text ?? '').replace(/\u0000/g, '');
  const grades = extractGrades(clean);
  const attendance = extractAttendance(clean);
  const awards = extractAwards(clean);
  const serviceHours = extractServiceHours(clean);
  const summary = summarizeGrades(grades);
  return {
    grades, attendance, awards, serviceHours, summary,
    warnings: [
      ...(grades.length === 0 ? ['성적 표(교과학습발달상황)를 찾지 못했습니다. 학교생활기록부 PDF가 맞는지, 표가 이미지로 스캔되지 않았는지 확인해 주세요.'] : []),
      ...(!attendance.found ? ['출결 정보를 찾지 못했습니다.'] : []),
      ...(attendance.years.some(y => !y.perfectAttendance) ? ['개근이 아닌 학년이 있습니다. 정확한 결석·지각 횟수는 원본 PDF에서 직접 확인하세요(자동으로 정확히 세지 못했습니다).'] : []),
      ...(awards.some(a => !a.title) ? ['수상 날짜는 찾았지만 이름과 정확히 짝짓지 못한 항목이 있습니다.'] : []),
      ...(grades.some(g => g.confidence !== 'high') ? ['일부 성적은 학년 구분이나 표 인식이 불확실합니다. 원본과 대조해 주세요.'] : []),
    ],
  };
}

import { VALUES, METRIC_LABELS, eligible, search, orderByValues, compareRows, metricOf, displayName, isBranch, fourYearCost, valueCoverage } from './src/lib/explore.js?v=muh5oa1j';
import { toIcs, isVerified, isAllDay } from './src/lib/ics.js?v=muh5oa1j';
import { CRITERIA, IDEAL_SECONDS, offlineFeedback } from './src/lib/interview.js?v=muh5oa1j';
import { SAMPLE_UNIVERSITIES } from './src/data/universities.js?v=muh5oa1j';
import { SAMPLE_SCHEDULES } from './src/data/schedules.js?v=muh5oa1j';
import { FIELDS, KINDS, questionsFor } from './src/data/questions.js?v=muh5oa1j';
import { convertCsat, convertSchool, isUsableRule, SUBJECT_LABELS } from './src/lib/score.js?v=muh5oa1j';
import { SAMPLE_SCORE_RULES } from './src/data/score-rules.js?v=muh5oa1j';
import { SAMPLE_EXAM_QUESTIONS } from './src/data/exam-questions.js?v=muh5oa1j';
import { analyzeRecordText } from './src/lib/record-parse.js?v=muh5oa1j';

const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TIER = { A: '정보 심층', B: '정보 표준', C: '정보 기본' };
const MAX_COMPARE = 4;

// Per-device conveniences only; the page works without storage.
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(`ipsi:${key}`)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(`ipsi:${key}`, JSON.stringify(value)); } catch {} },
};

const state = {
  univs: [], schedules: SAMPLE_SCHEDULES, rules: SAMPLE_SCORE_RULES, exams: SAMPLE_EXAM_QUESTIONS, sample: true, ai: false,
  weights: store.get('weights', { employment: 2, prestige: 1 }),
  targets: store.get('targets', []), compare: store.get('compare', []),
  history: store.get('history', []), question: null, timer: null, startedAt: 0,
  record: store.get('record', null),
};
const save = () => { store.set('weights', state.weights); store.set('targets', state.targets); store.set('compare', state.compare); store.set('history', state.history); };
const byId = id => state.univs.find(u => u.id === id);

function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }

// ---------- tabs
function showTab(name) {
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  document.querySelectorAll('.panel').forEach(p => { p.hidden = p.id !== `tab-${name}`; });
  if (name === 'compare') renderCompare();
  if (name === 'schedule') renderSchedule();
  if (name === 'score') renderScores();
  if (name === 'interview') renderExams();
}
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => showTab(b.dataset.tab));

// ---------- 학생부(생기부) 분석 — 파일은 이 탭 밖으로 절대 나가지 않음(fetch/전송 없음, pdf.js로 이 브라우저에서만 읽음)
const TIER_LABEL = { A: '심층', B: '표준', C: '기본' };
function achColor(rank) { return rank ? (rank <= 2 ? 'good' : rank >= 7 ? 'warn' : '') : ''; }
function renderRecordResult(r) {
  const byYearSem = {};
  for (const g of r.grades) (byYearSem[`${g.year ?? '?'}학년 ${g.semester ?? ''}학기`] ??= []).push(g);
  const gradeHtml = Object.entries(byYearSem).map(([label, list]) => `
    <div class="record-block"><h3>${esc(label)}</h3><table class="record-table"><tbody>
      ${list.map(g => `<tr><th>${esc(g.subject)}${g.category ? `<small>${esc(g.category)}</small>` : ''}</th><td>${esc(g.rawScore)}점 (평균 ${esc(g.classAvg)})</td><td>${esc(g.achievement)}</td><td class="${achColor(g.rank)}">${g.rank ? `${g.rank}등급` : '등급 없음'}</td></tr>`).join('')}
    </tbody></table></div>`).join('') || '<p class="empty">성적 표를 찾지 못했습니다.</p>';

  const s = r.summary;
  const trendLabel = { improving: '올라가는 추세', declining: '내려가는 추세', flat: '비슷한 추세', unknown: '추세 판단 불가(자료 부족)' }[s.trend];
  const yearRows = Object.entries(s.yearAvg).map(([y, avg]) => `<tr><th>${esc(y)}학년 평균</th><td>${esc(avg)}등급</td></tr>`).join('');

  const attendHtml = r.attendance.found
    ? `<table class="record-table"><tbody>${r.attendance.years.map(y => `<tr><th>${esc(y.year)}학년</th><td>수업일수 ${esc(y.classDays)}일</td><td>${y.perfectAttendance ? '개근' : '결석·지각 있음(정확한 수는 원본 확인)'}</td></tr>`).join('')}</tbody></table>`
    : '<p class="empty">출결 정보를 찾지 못했습니다.</p>';

  const awardsHtml = r.awards.length
    ? `<ul>${r.awards.map(a => `<li>${esc(a.date)} — ${a.title ? esc(a.title) : '(이름 확인 필요)'}</li>`).join('')}</ul>`
    : '<p class="empty">수상 내역을 찾지 못했습니다.</p>';

  $('record-result').innerHTML = `
    <section class="record-summary">
      <div class="record-stat"><strong>${s.overall ?? '—'}</strong><small>전체 평균 등급</small></div>
      <div class="record-stat"><strong>${s.subjectCount}</strong><small>과목 수</small></div>
      <div class="record-stat"><strong>${esc(trendLabel)}</strong><small>학년별 등급 추세</small></div>
      ${r.serviceHours != null ? `<div class="record-stat"><strong>${esc(r.serviceHours)}</strong><small>봉사시간(추정, 원본 확인)</small></div>` : ''}
    </section>
    ${yearRows ? `<table class="record-table"><tbody>${yearRows}</tbody></table>` : ''}
    ${r.warnings.length ? `<div class="record-warnings"><strong>확인이 필요해요</strong><ul>${r.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
    <h3 class="record-section-title">학기별 성적</h3>
    ${gradeHtml}
    <h3 class="record-section-title">출결</h3>
    ${attendHtml}
    <h3 class="record-section-title">수상 (이름과 날짜가 정확히 안 맞을 수 있어요)</h3>
    ${awardsHtml}
  `;
}

let pdfjsLibPromise = null;
async function loadPdfJs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('./vendor/pdfjs/pdf.min.mjs').then(lib => {
      lib.GlobalWorkerOptions.workerSrc = './vendor/pdfjs/pdf.worker.min.mjs';
      return lib;
    });
  }
  return pdfjsLibPromise;
}

// 텍스트가 있는 PDF는 페이지마다 글자가 꽤 많다. 평균 30자 미만이면 스캔한 이미지로 보고 OCR로 넘어간다.
const SCANNED_CHARS_PER_PAGE = 30;

async function extractPdfPages(file) {
  const pdfjsLib = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // pdf.js gives text items with x/y position; sort roughly top-to-bottom, left-to-right per line
    // like pdftotext -layout does, so our row-based regex sees the same shape.
    const items = content.items.map(it => ({ str: it.str, x: it.transform[4], y: Math.round(it.transform[5]) }));
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    let lastY = null, line = '', text = '';
    for (const it of items) {
      if (lastY !== null && Math.abs(it.y - lastY) > 2) { text += line + '\n'; line = ''; }
      line += (line ? ' ' : '') + it.str;
      lastY = it.y;
    }
    text += line;
    pages.push({ page, text });
  }
  return pages;
}

let tesseractPromise = null;
async function loadTesseract() {
  if (!tesseractPromise) {
    tesseractPromise = import('./vendor/tesseract/tesseract.esm.min.js').then(({ default: Tesseract }) =>
      Tesseract.createWorker('kor+eng', Tesseract.OEM.LSTM_ONLY, {
        workerPath: './vendor/tesseract/worker.min.js', workerBlobURL: false,
        corePath: './vendor/tesseract/tesseract-core-lstm.wasm.js', langPath: './vendor/tessdata',
      }));
  }
  return tesseractPromise;
}

// 스캔한 이미지 페이지를 캔버스에 그린 뒤(이 브라우저 안에서만), OCR로 글자를 읽는다. 느릴 수 있음.
async function ocrPage(page, worker, onStatus) {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width; canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  onStatus?.();
  const { data } = await worker.recognize(canvas);
  return data.text;
}

function applyRecordAnalysis(result) {
  $('record-result').dataset.hasResult = 'true';
  renderRecordResult(result);
  $('record-clear').hidden = false;
  state.record = result;
  if ($('record-keep').checked) store.set('record', result);
}

// 학생부 교과(국어/수학/영어/사회/과학)만 수시 교과 환산에 쓴다. 다른 교과(예체능 등)나 등급이 없는
// 진로선택 과목은 자체적으로 판단해 반영하지 않고 조용히 뺀다(지어내지 않는다, docs/PRODUCT.md §5).
const KOR_TO_SCHOOL_SUBJECT = Object.fromEntries(Object.entries(SUBJECT_LABELS).map(([key, label]) => [label, key]));
function schoolRecordsFromGrades(grades) {
  return grades
    .filter(g => g.year && g.rank != null)
    .map(g => ({ year: g.year, subject: KOR_TO_SCHOOL_SUBJECT[g.category ?? g.subject], grade: g.rank, credits: g.credit }))
    .filter(r => r.subject);
}

$('record-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  $('record-file-label').textContent = file.name;
  $('record-status').textContent = '이 브라우저에서 PDF를 읽는 중… (전송하지 않습니다)';
  $('record-result').innerHTML = '';
  try {
    const pages = await extractPdfPages(file);
    const textLen = pages.reduce((sum, p) => sum + p.text.replace(/\s/g, '').length, 0);
    const looksScanned = pages.length > 0 && textLen / pages.length < SCANNED_CHARS_PER_PAGE;
    let text, ocr = false;
    if (!looksScanned) {
      text = pages.map(p => p.text).join('\n\f');
    } else {
      ocr = true;
      $('record-status').textContent = `글자가 없는 스캔본으로 보여 OCR로 다시 읽습니다… (느릴 수 있어요, 0/${pages.length}쪽)`;
      const worker = await loadTesseract();
      const ocrTexts = [];
      for (let i = 0; i < pages.length; i++) {
        ocrTexts.push(await ocrPage(pages[i].page, worker, () => {
          $('record-status').textContent = `OCR로 읽는 중… (${i + 1}/${pages.length}쪽)`;
        }));
      }
      text = ocrTexts.join('\n\f');
    }
    const result = analyzeRecordText(text, { ocr });
    applyRecordAnalysis(result);
    $('record-status').textContent = ocr
      ? '스캔본을 OCR로 읽어 분석했습니다. 글자 인식 오차가 있을 수 있으니 반드시 원본과 대조하세요.'
      : '분석했습니다. 자동 추출은 실수가 있을 수 있으니 원본과 함께 확인하세요.';
  } catch (err) {
    $('record-status').textContent = 'PDF를 읽지 못했습니다. 학생부 PDF 파일이 맞는지 확인해 주세요.';
  } finally {
    e.target.value = '';
  }
});
$('record-keep').addEventListener('change', () => { if (!$('record-keep').checked) store.set('record', undefined); });
$('record-clear').addEventListener('click', () => {
  store.set('record', undefined);
  try { localStorage.removeItem('ipsi:record'); } catch {}
  state.record = null;
  $('record-result').innerHTML = ''; $('record-status').textContent = '지웠습니다.';
  $('record-clear').hidden = true; $('record-file-label').textContent = '학생부 PDF 선택 (또는 여기로 끌어다 놓기)';
});
['dragover', 'dragleave', 'drop'].forEach(evt => $('record-file').closest('.record-drop').addEventListener(evt, e => {
  e.preventDefault();
  if (evt === 'drop' && e.dataTransfer.files[0]) { $('record-file').files = e.dataTransfer.files; $('record-file').dispatchEvent(new Event('change')); }
}));
{
  const saved = store.get('record', null);
  if (saved) { $('record-keep').checked = true; applyRecordAnalysis(saved); $('record-status').textContent = '이 기기에 저장된 지난 분석 결과입니다.'; }
}

// ---------- explore
function metricHtml(u, key, focus) {
  const x = metricOf(u, key);
  if (!x) return '';
  return `<div class="metric${focus ? ' focus' : ''}"><small>${esc(METRIC_LABELS[key])}</small><b>${esc(x.value.toLocaleString('ko-KR'))}<small style="display:inline"> ${esc(x.unit)}</small></b><small>${esc(x.source.name)} · ${esc(x.asOf)}</small></div>`;
}

function renderValues() {
  $('values').innerHTML = VALUES.map(v => {
    const w = state.weights[v.id] ?? 0;
    const { withData } = valueCoverage(state.univs, v.id);
    const noData = withData === 0;
    const label = noData ? `${esc(v.label)} <small>(자료 없음)</small>` : esc(v.label);
    const title = noData ? `${v.hint} — 아직 실제 자료가 없어 순서에 반영되지 않습니다.` : v.hint;
    return `<button class="value${noData ? ' no-data' : ''}" data-value="${v.id}" data-w="${w}" title="${esc(title)}" aria-label="${esc(v.label)} 중요도 ${w}${noData ? ', 자료 없음' : ''}">${label} <span class="pips">${'●'.repeat(w)}${'○'.repeat(3 - w)}</span></button>`;
  }).join('');
  const missing = VALUES.filter(v => (state.weights[v.id] ?? 0) > 0 && valueCoverage(state.univs, v.id).withData === 0);
  const notice = $('values-notice');
  if (notice) {
    notice.hidden = missing.length === 0;
    notice.textContent = missing.length ? `${missing.map(v => v.label).join(', ')}: 아직 실제 자료가 없어서 이 기준은 순서에 영향을 주지 못해요. 순위를 지어내지 않기 때문에, 자료가 모이면 반영할게요.` : '';
  }
}

function renderList() {
  const list = orderByValues(search(state.univs, { q: $('q').value, region: $('region').value, campus: $('campus').value }), state.weights);
  const focus = new Set(VALUES.filter(v => (state.weights[v.id] ?? 0) > 0).map(v => v.metric));
  const shownMetrics = [...VALUES].sort((a, b) => (state.weights[b.id] ?? 0) - (state.weights[a.id] ?? 0)).map(v => v.metric);
  $('result-count').textContent = `4년제 ${list.length}곳${state.sample ? ' (샘플)' : ''} · 고른 기준 순서로 정렬`;
  $('univ-list').innerHTML = list.length ? list.map(u => `
    <article class="card">
      <div><h3>${esc(displayName(u))}</h3>
        <div class="tags">${isBranch(u) ? `<span class="tag branch">${esc(u.campus)} · 본교와 다름</span>` : '<span class="tag">본교</span>'}
          <span class="tag">${esc(u.type)}</span><span class="tag">${esc(u.city ?? u.region)}</span><span class="tag">${TIER[u.tier] ?? ''}</span>
          ${u.real ? '<span class="tag real">실제 자료 · 확인됨</span>' : state.sample ? '<span class="tag sample">샘플</span>' : ''}</div></div>
      <div class="metrics">${shownMetrics.map(k => metricHtml(u, k, focus.has(k))).join('')}</div>
      ${u.majors?.length ? `<small class="muted">학과 예: ${u.majors.slice(0, 3).map(m => `${esc(m.name)}${metricOf({ metrics: { e: m.employmentRate } }, 'e') ? ` (취업 ${m.employmentRate.value}%)` : ''}`).join(', ')}</small>` : ''}
      <div class="actions">
        <button class="ghost" data-target="${u.id}" aria-pressed="${state.targets.includes(u.id)}">${state.targets.includes(u.id) ? '★ 목표 대학' : '☆ 목표로 등록'}</button>
        <button class="ghost" data-compare="${u.id}" aria-pressed="${state.compare.includes(u.id)}">${state.compare.includes(u.id) ? '✓ 비교 중' : '+ 비교'}</button>
      </div>
    </article>`).join('') : '<p class="empty">조건에 맞는 대학이 없습니다.</p>';
  $('compare-count').textContent = state.compare.length;
  $('target-count').textContent = state.targets.length;
}

$('values').onclick = e => {
  const b = e.target.closest('[data-value]'); if (!b) return;
  state.weights[b.dataset.value] = ((state.weights[b.dataset.value] ?? 0) + 1) % 4;
  save(); renderValues(); renderList();
};
['q', 'region', 'campus'].forEach(id => $(id).addEventListener('input', renderList));
$('univ-list').onclick = e => {
  const t = e.target.closest('[data-target]'), c = e.target.closest('[data-compare]');
  if (t) { const id = t.dataset.target; state.targets = state.targets.includes(id) ? state.targets.filter(x => x !== id) : [...state.targets, id]; toast(state.targets.includes(id) ? '목표 대학에 등록했어요. 내 일정에서 확인하세요.' : '목표에서 뺐어요.'); }
  if (c) {
    const id = c.dataset.compare;
    if (state.compare.includes(id)) state.compare = state.compare.filter(x => x !== id);
    else if (state.compare.length >= MAX_COMPARE) return toast(`비교는 ${MAX_COMPARE}곳까지예요.`);
    else state.compare = [...state.compare, id];
  }
  save(); renderList();
};

// ---------- compare
function renderCompare() {
  const list = state.compare.map(byId).filter(Boolean);
  if (!list.length) { $('compare-table').innerHTML = '<p class="empty">탐색에서 “+ 비교”를 눌러 대학을 추가하세요.</p>'; return; }
  const rows = compareRows(list, state.weights);
  const housing = $('housing').value;
  const cost = list.map(u => fourYearCost(u, { housing }));
  $('compare-table').innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>기준</th>${list.map(u => `<th>${esc(displayName(u))}${isBranch(u) ? '<small>본교와 다름</small>' : ''}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr><th>${esc(r.value.label)}<small>${esc(r.label)}</small></th>${r.cells.map(x => `<td>${x ? `${esc(x.value.toLocaleString('ko-KR'))} ${esc(x.unit)}<small>${esc(x.source.name)} · ${esc(x.asOf)}</small>` : '<small>자료 없음</small>'}</td>`).join('')}</tr>`).join('')}
    <tr><th>4년 비용(추정)<small>등록금 + 주거</small></th>${cost.map(c => `<td>${c ? `${c.total.toLocaleString('ko-KR')} 만원<small>등록금 ${c.tuition.toLocaleString('ko-KR')} + 주거 ${c.living.toLocaleString('ko-KR')}</small>` : '<small>자료 없음</small>'}</td>`).join('')}</tr>
    <tr><th></th>${list.map(u => `<td><button class="ghost" data-uncompare="${u.id}">빼기</button></td>`).join('')}</tr>
    </tbody></table></div>`;
}
$('housing').onchange = renderCompare;
$('compare-table').onclick = e => { const b = e.target.closest('[data-uncompare]'); if (!b) return; state.compare = state.compare.filter(x => x !== b.dataset.uncompare); save(); renderCompare(); renderList(); };

// Parents: a link that carries the student's list, nothing else (no names, no scores).
function shareLink() {
  const data = btoa(unescape(encodeURIComponent(JSON.stringify({ t: state.targets, c: state.compare }))));
  return `${location.origin}${location.pathname}#share=${data}`;
}
async function copyShare() {
  const url = shareLink();
  try { await navigator.clipboard.writeText(url); toast('공유 링크를 복사했어요. 부모님께 보내 주세요.'); } catch { prompt('이 링크를 복사해 보내 주세요.', url); }
}
$('share-parent').onclick = copyShare; $('share-schedule').onclick = copyShare;

// ---------- schedule
const dday = iso => { const d = Math.ceil((new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000); return d > 0 ? `D-${d}` : d === 0 ? 'D-DAY' : '지남'; };
function mySchedules() { return state.schedules.filter(s => state.targets.includes(s.univId) && isVerified(s)).sort((a, b) => Date.parse(a.start) - Date.parse(b.start)); }
function renderSchedule() {
  const items = mySchedules();
  if (!state.targets.length) { $('schedule-list').innerHTML = '<p class="empty">탐색에서 “☆ 목표로 등록”을 누르면 그 대학의 일정이 여기에 모입니다.</p>'; return; }
  if (!items.length) { $('schedule-list').innerHTML = '<p class="empty">목표 대학의 확인된 일정이 아직 없습니다.</p>'; return; }
  const days = Map.groupBy(items, s => new Date(s.start).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }));
  $('schedule-list').innerHTML = [...days].map(([day, list]) => `<div class="day"><h3>${esc(day)}</h3>${list.map(s => `
    <div class="event"><span class="dday">${dday(s.start)}</span><strong>${esc(s.title)}</strong>
      <small>${esc(s.kind)} · ${isAllDay(s) ? '종일' : new Date(s.start).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}${s.end && !isAllDay(s) ? ` ~ ${new Date(s.end).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''} · ${esc(displayName(byId(s.univId) ?? { name: '' }))}</small>
      <small>출처: ${s.source.url ? `<a href="${esc(s.source.url)}" target="_blank" rel="noopener">${esc(s.source.name)}</a>` : esc(s.source.name)}${s.page ? ` p.${esc(s.page)}` : ''} · 기준일 ${esc(s.asOf)}${s.source.reviewedBy ? ` · 확인 ${esc(s.source.reviewedBy)}` : ''}</small></div>`).join('')}</div>`).join('');
}
$('ics').onclick = () => {
  const items = mySchedules();
  if (!items.length) return toast('내보낼 일정이 없어요. 먼저 목표 대학을 등록하세요.');
  const url = URL.createObjectURL(new Blob([toIcs(items)], { type: 'text/calendar;charset=utf-8' }));
  Object.assign(document.createElement('a'), { href: url, download: 'ipsi-radar.ics' }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('캘린더 파일을 받았어요. 열면 내 캘린더에 추가됩니다(하루 전 알림 포함).');
};

// ---------- score conversion (local only: scores never leave this device)
const myUnivIds = () => [...new Set([...state.targets, ...state.compare])];
function readScores() {
  const s = { korean: {}, math: {}, inquiry: [{}, {}] };
  for (const input of $('score-form').elements) {
    if (!input.name || input.value === '') continue;
    const v = Number(input.value), [a, b, c] = input.name.split('.');
    if (a === 'inquiry') s.inquiry[Number(b)][c] = v; else if (b) s[a][b] = v; else s[a] = v;
  }
  return s;
}
function writeScores(s) {
  for (const input of $('score-form').elements) {
    if (!input.name) continue;
    const [a, b, c] = input.name.split('.');
    const v = a === 'inquiry' ? s.inquiry?.[Number(b)]?.[c] : b ? s[a]?.[b] : s[a];
    input.value = v ?? '';
  }
}
function renderScores(run = false) {
  const ids = myUnivIds();
  if (!ids.length) { $('score-results').innerHTML = '<p class="empty">탐색에서 목표 대학이나 비교 대학을 먼저 고르세요.</p>'; return; }
  const scores = readScores();
  store.set('scores', scores);
  $('score-results').innerHTML = ids.map(id => {
    const u = byId(id); if (!u) return '';
    const csatRules = state.rules.filter(r => r.univId === id && r.kind === 'csat' && isUsableRule(r));
    const csatHtml = !csatRules.length
      ? `<section class="result"><strong>${esc(displayName(u))} · 정시</strong><p class="muted">확인된 정시 환산 방법이 아직 없습니다.</p></section>`
      : csatRules.map(r => {
          let body;
          if (!run) body = '<p class="muted">성적을 넣고 “환산하기”를 누르세요.</p>';
          else {
            try {
              const out = convertCsat(r, scores);
              body = `<p class="total">${out.total.toLocaleString('ko-KR')} <small>/ ${out.scale.toLocaleString('ko-KR')}점 기준</small></p>
                <table><tbody>${out.lines.map(l => `<tr><th>${esc(l.label)}<small>${esc(l.basis === 'standard' ? '표준점수' : l.basis === 'percentile' ? '백분위' : l.basis)}${l.mode ? ` · ${{ add: '가산', deduct: '감산', weighted: '비율 반영' }[l.mode]}` : ''}</small></th><td>${l.points > 0 && l.mode ? '+' : ''}${l.points.toLocaleString('ko-KR')}</td></tr>`).join('')}</tbody></table>`;
            } catch (e) { body = `<p class="err">${esc(e.message)}</p>`; }
          }
          return `<section class="result"><strong>${esc(displayName(u))} · ${esc(r.year)}학년도 정시 ${esc(r.track)}</strong>${body}
            <small class="muted">출처: ${esc(r.source.name)}${r.source.url ? ` · <a href="${esc(r.source.url)}" target="_blank" rel="noopener">원문</a>` : ''}${r.page ? ` p.${esc(r.page)}` : ''} · 기준일 ${esc(r.asOf)}. 변환표준점수 등 수능 후 발표 값은 반영되지 않을 수 있습니다.</small></section>`;
        }).join('');

    const schoolRules = state.rules.filter(r => r.univId === id && r.kind === 'school' && isUsableRule(r));
    const schoolHtml = !schoolRules.length ? '' : schoolRules.map(r => {
      let body;
      if (!state.record) body = '<p class="muted">“내 학생부” 탭에서 학생부 PDF를 넣으면 여기 자동으로 채워집니다.</p>';
      else {
        const records = schoolRecordsFromGrades(state.record.grades);
        if (!records.length) body = '<p class="muted">학생부에서 이 대학이 반영하는 교과(국어·수학·영어·사회·과학)의 등급 있는 성적을 찾지 못했습니다.</p>';
        else {
          try {
            const out = convertSchool(r, records);
            body = `<p class="total">${out.total.toLocaleString('ko-KR')} <small>/ ${out.scale.toLocaleString('ko-KR')}점 기준</small></p>
              <table><tbody>${Object.entries(out.average).map(([y, avg]) => `<tr><th>${esc(y)}학년 평균</th><td>${esc(avg)}등급</td></tr>`).join('')}</tbody></table>
              <p class="muted">반영 교과: ${r.subjects.map(s => esc(SUBJECT_LABELS[s] ?? s)).join('·')} · 학생부 자동 반영이라 실수가 있을 수 있어요, 원본과 대조하세요.</p>`;
          } catch (e) { body = `<p class="err">${esc(e.message)}</p>`; }
        }
      }
      return `<section class="result"><strong>${esc(displayName(u))} · ${esc(r.year)}학년도 수시 교과</strong>${body}
        <small class="muted">출처: ${esc(r.source.name)}${r.source.url ? ` · <a href="${esc(r.source.url)}" target="_blank" rel="noopener">원문</a>` : ''}${r.page ? ` p.${esc(r.page)}` : ''} · 기준일 ${esc(r.asOf)}.</small></section>`;
    }).join('');

    return csatHtml + schoolHtml;
  }).join('');
}
$('score-run').onclick = () => renderScores(true);
$('score-example').onclick = () => { writeScores({ korean: { standard: 131, percentile: 94 }, math: { standard: 137, percentile: 92 }, inquiry: [{ standard: 66, percentile: 93 }, { standard: 63, percentile: 88 }], english: 2, history: 3 }); renderScores(true); };

// ---------- past questions of target universities
function renderExams() {
  const list = state.exams.filter(x => myUnivIds().includes(x.univId) && x.source && x.asOf);
  $('exam-wrap').hidden = !list.length; $('exam-count').textContent = list.length;
  $('exam-list').innerHTML = list.map(x => {
    const u = byId(x.univId), meta = `${esc(displayName(u ?? { name: x.univId }))} · ${esc(x.year)} ${esc(x.type)} · ${esc(x.unit)} ${esc(x.track)} · ${esc(x.source.name)}${x.page ? ` p.${esc(x.page)}` : ''}`;
    return x.license === 'permitted'
      ? `<li>${esc(x.text)}<small>${meta}</small>${x.type === '면접' ? `<button class="ghost" data-exam="${esc(x.id)}">이 질문으로 연습</button>` : ''}</li>`
      : `<li>문항 원문은 대학 자료에서 확인하세요${x.source.url ? `: <a href="${esc(x.source.url)}" target="_blank" rel="noopener">원문 열기</a>` : ''}<small>${meta}</small></li>`;
  }).join('');
}
$('exam-list').onclick = e => { const b = e.target.closest('[data-exam]'); if (!b) return; const x = state.exams.find(q => q.id === b.dataset.exam); if (x) { nextQuestion(x.text); $('question-text').scrollIntoView({ block: 'center' }); } };

// ---------- interview
$('field').innerHTML = FIELDS.map(f => `<option>${f}</option>`).join('');
$('kind').innerHTML = Object.entries(KINDS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
function nextQuestion(text) {
  if (text) state.question = { id: 'follow', text };
  else {
    const pool = questionsFor($('field').value, $('kind').value).filter(q => q.id !== state.question?.id);
    state.question = pool[Math.floor(Math.random() * pool.length)] ?? questionsFor('*')[0];
  }
  $('question-text').textContent = state.question.text;
  $('answer').value = ''; $('feedback').innerHTML = ''; stopTimer(); $('timer').textContent = '0:00';
}
const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const elapsed = () => (state.startedAt ? Math.round((Date.now() - state.startedAt) / 1000) : 0);
function stopTimer() { clearInterval(state.timer); state.timer = null; $('start').textContent = '답변 시작'; }
$('start').onclick = () => {
  if (state.timer) return stopTimer();
  state.startedAt = Date.now(); $('start').textContent = '멈춤';
  state.timer = setInterval(() => { const s = elapsed(); $('timer').textContent = fmt(s); $('timer').classList.toggle('over', s > IDEAL_SECONDS.max); }, 250);
  $('answer').focus();
};
$('next-q').onclick = () => nextQuestion(); $('field').onchange = () => nextQuestion(); $('kind').onchange = () => nextQuestion();

// Speech input where the browser supports it (Chrome, Edge, Safari).
const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Speech) {
  const rec = new Speech(); rec.lang = 'ko-KR'; rec.continuous = true; rec.interimResults = false;
  let on = false;
  rec.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) $('answer').value += `${e.results[i][0].transcript.trim()} `; };
  rec.onend = () => { if (on) rec.start(); };
  $('mic').hidden = false;
  $('mic').onclick = () => {
    on = !on; $('mic').textContent = on ? '■ 받아쓰기 멈춤' : '🎙 말로 답하기';
    if (on) { if (!state.timer) $('start').click(); rec.start(); } else rec.stop();
  };
}

function renderFeedback(fb) {
  $('feedback').innerHTML = `<section class="fb">
    ${fb.notice ? `<p class="notice">${esc(fb.notice)}</p>` : ''}
    <span class="eyebrow">${fb.mode === 'ai' ? 'AI 코치 피드백' : '자동 채점 피드백'}</span>
    <div class="bars">${CRITERIA.map(c => `<div class="bar"><span>${c.label}</span><span><i style="width:${fb.scores[c.id] * 20}%"></i></span><b>${fb.scores[c.id]}</b></div>`).join('')}</div>
    <p>${esc(fb.summary)}</p>
    <div><h3>잘한 점</h3><ul>${fb.strengths.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
    <div><h3>고칠 점</h3><ul>${fb.improvements.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
    <div><h3>다시 말할 때의 뼈대</h3><ol>${fb.outline.map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>
    <div class="follow"><h3>면접관의 꼬리 질문</h3><p>${esc(fb.followUp)}</p></div>
    <button id="follow-up" class="ghost">꼬리 질문으로 이어서 연습</button>
  </section>`;
  $('follow-up').onclick = () => nextQuestion(fb.followUp);
}

$('submit').onclick = async () => {
  const input = { field: $('field').value, major: $('major').value, question: state.question.text, answer: $('answer').value, seconds: elapsed() };
  if (input.answer.trim().length < 10) return toast('답변을 10자 이상 적어 주세요.');
  stopTimer();
  const useAi = state.ai && $('consent').checked;
  $('submit').disabled = true; $('submit').textContent = useAi ? 'AI가 답변을 읽는 중…' : '채점 중…';
  let fb;
  try {
    // Static hosting has no server: score in the browser (the same rubric the server uses).
    if (state.static) { fb = offlineFeedback(input); throw null; }
    const res = await fetch('./api/interview/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, useAi }) });
    fb = await res.json();
    if (!res.ok) throw new Error(fb.error);
  } catch (e) {
    if (!fb) try { fb = { ...offlineFeedback(input), notice: '서버에 연결하지 못해 이 기기에서 자동 채점했어요.' }; } catch (err) { toast(err.message); }
  } finally { $('submit').disabled = false; $('submit').textContent = '피드백 받기'; }
  if (!fb) return;
  renderFeedback(fb);
  state.history = [{ at: new Date().toISOString(), q: input.question, avg: CRITERIA.reduce((s, c) => s + fb.scores[c.id], 0) / CRITERIA.length, mode: fb.mode }, ...state.history].slice(0, 20);
  save(); renderHistory();
};
function renderHistory() {
  $('history').innerHTML = state.history.map(h => `<li>${new Date(h.at).toLocaleDateString('ko-KR')} · 평균 ${h.avg.toFixed(1)} · ${esc(h.q)}</li>`).join('') || '<li class="muted">아직 기록이 없습니다.</li>';
}

// ---------- boot
async function boot() {
  let status = {};
  try { status = await (await fetch('./api/status', { cache: 'no-cache' })).json(); } catch {}
  state.ai = Boolean(status.ai);
  state.static = Boolean(status.static);
  if (status.dataset === 'imported') {
    try { const r = await fetch('./data/universities.json', { cache: 'no-cache' }); if (r.ok) { state.univs = eligible(await r.json()); state.sample = false; } } catch {}
  }
  if (!state.univs.length) state.univs = eligible(SAMPLE_UNIVERSITIES);
  // Real data replaces the samples: imported universities never mix with sample schedules, rules or questions.
  if (!state.sample) { state.schedules = []; state.rules = []; state.exams = []; }
  if (status.published) {
    try {
      const r = await fetch('./data/published.json', { cache: 'no-cache' });
      if (r.ok) {
        const p = await r.json();
        // Verified real data sits next to the samples (sample mode) or replaces nothing (imported mode).
        state.schedules = [...state.schedules, ...(p.schedules ?? [])];
        state.rules = [...state.rules, ...(p.scoreRules ?? [])];
        state.exams = [...state.exams, ...(p.examQuestions ?? [])];
        for (const u of p.universities ?? []) if (!byId(u.id)) state.univs.push({ ...u, real: true });
      }
    } catch {}
  }
  writeScores(store.get('scores', {}));
  $('sample-banner').hidden = !state.sample;
  $('ai-status').textContent = state.ai ? 'AI 피드백을 사용할 수 있어요. 동의하면 AI가 읽고, 아니면 자동 채점합니다.' : '지금은 AI 없이 자동 채점 기준으로 피드백합니다.';
  $('consent-wrap').hidden = !state.ai;
  const regions = [...new Set(state.univs.map(u => u.region))].sort((a, b) => a.localeCompare(b, 'ko'));
  $('region').insertAdjacentHTML('beforeend', regions.map(r => `<option>${esc(r)}</option>`).join(''));
  // A parent opening a shared link sees the student's list.
  const m = location.hash.match(/^#share=(.+)$/);
  if (m) {
    try {
      const shared = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
      const known = ids => (Array.isArray(ids) ? ids : []).filter(id => byId(id)).slice(0, 20);
      state.targets = [...new Set([...state.targets, ...known(shared.t)])];
      state.compare = [...new Set([...state.compare, ...known(shared.c)])].slice(0, MAX_COMPARE);
      save(); history.replaceState(null, '', location.pathname); toast('공유받은 목표 대학을 불러왔어요.'); showTab('schedule');
    } catch { toast('공유 링크를 읽을 수 없어요.'); }
  }
  renderValues(); renderList(); renderHistory(); nextQuestion();
}
boot();

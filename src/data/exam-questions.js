// SAMPLE past questions for the fictional sample universities (written for the demo, so shown in full).
// Real ones come from each university's 선행학습 영향평가 보고서 through the review pipeline and are
// 'link-only' by default: we show the university, year, page and link, not the text (docs/COLLECTION.md).
const SAMPLE = { name: '샘플 데이터(가상)', url: null, sample: true };

export const SAMPLE_EXAM_QUESTIONS = [
  { id: 'garam-2026-int-1', univId: 'garam-main', type: '면접', year: 2026, track: '자연', unit: '학생부종합', page: 34, license: 'permitted', source: SAMPLE, asOf: '2026-05-31',
    text: '학생부에 적힌 탐구 활동에서 가설이 틀렸다고 판단한 근거는 무엇이었고, 그다음 무엇을 바꿨나요?' },
  { id: 'garam-2026-int-2', univId: 'garam-main', type: '면접', year: 2026, track: '인문', unit: '학생부종합', page: 35, license: 'permitted', source: SAMPLE, asOf: '2026-05-31',
    text: '읽은 책의 주장 가운데 동의하지 않는 부분을 하나 골라, 반박 근거를 들어 설명해 주세요.' },
  { id: 'hanul-2026-int-1', univId: 'hanul', type: '면접', year: 2026, track: '공통', unit: '학생부종합', page: 21, license: 'permitted', source: SAMPLE, asOf: '2026-05-30',
    text: '팀 프로젝트에서 본인의 의견이 채택되지 않았던 경험과, 그 뒤 본인이 한 일을 말해 주세요.' },
  { id: 'garam-2026-essay-1', univId: 'garam-main', type: '논술', year: 2026, track: '인문', unit: '논술우수자', page: 12, license: 'link-only', source: SAMPLE, asOf: '2026-05-31',
    text: '(링크 전용 예시: 원문은 공개되지 않은 것으로 가정합니다)' },
];

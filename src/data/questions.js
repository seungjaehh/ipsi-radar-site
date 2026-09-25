// Example interview questions by field. These are practice examples written for this service,
// not a specific university's past questions. Real 기출 come from each university's 선행학습 영향평가 보고서.

export const FIELDS = ['인문', '사회', '경영경제', '자연', '공학', '의약', '교육', '예체능'];
export const KINDS = {
  common: '인성·공통',
  major: '전공적합성',
  record: '학생부 확인',
};

export const QUESTIONS = [
  // 인성·공통 (all fields)
  { id: 'c1', field: '*', kind: 'common', text: '1분 동안 자기소개를 해 주세요. 지원 학과와 연결되는 경험을 하나 넣어 주세요.' },
  { id: 'c2', field: '*', kind: 'common', text: '고등학교 생활에서 가장 힘들었던 일과, 그것을 어떻게 해결했는지 말해 주세요.' },
  { id: 'c3', field: '*', kind: 'common', text: '팀 활동에서 의견이 부딪혔던 경험이 있나요? 본인은 어떤 역할을 했나요?' },
  { id: 'c4', field: '*', kind: 'common', text: '대학에 입학하면 첫 1년 동안 무엇을 가장 먼저 하고 싶나요?' },
  { id: 'c5', field: '*', kind: 'record', text: '학생부에 적힌 활동 중 가장 깊이 파고든 것 하나를 골라, 처음 계기와 결과를 설명해 주세요.' },
  { id: 'c6', field: '*', kind: 'record', text: '읽은 책 중 생각이 바뀐 책이 있다면, 무엇이 어떻게 바뀌었는지 말해 주세요.' },
  // 전공적합성
  { id: 'h1', field: '인문', kind: 'major', text: '번역할 수 없는 단어가 있다고 생각하나요? 예를 들어 설명해 주세요.' },
  { id: 'h2', field: '인문', kind: 'major', text: '고전을 지금 읽어야 하는 이유를 한 가지 들고, 반대 의견에도 답해 주세요.' },
  { id: 's1', field: '사회', kind: 'major', text: '최근 관심 있게 본 사회 문제 하나를 고르고, 원인을 두 가지 이상으로 나눠 설명해 주세요.' },
  { id: 's2', field: '사회', kind: 'major', text: '여론조사 결과를 볼 때 무엇을 먼저 확인해야 한다고 생각하나요?' },
  { id: 'e1', field: '경영경제', kind: 'major', text: '가격을 올렸는데 매출이 늘어나는 경우가 있을까요? 조건을 설명해 주세요.' },
  { id: 'e2', field: '경영경제', kind: 'major', text: '관심 있는 기업 하나를 골라, 그 기업이 돈을 버는 구조를 설명해 주세요.' },
  { id: 'n1', field: '자연', kind: 'major', text: '실험 결과가 예상과 달랐던 경험이 있나요? 그때 무엇을 의심했나요?' },
  { id: 'n2', field: '자연', kind: 'major', text: '확률과 통계가 일상에서 잘못 쓰이는 예를 하나 들어 주세요.' },
  { id: 'g1', field: '공학', kind: 'major', text: '만들어 보거나 고쳐 본 것이 있다면, 문제를 어떻게 정의했는지부터 설명해 주세요.' },
  { id: 'g2', field: '공학', kind: 'major', text: '안전과 비용이 부딪힐 때 엔지니어는 무엇을 기준으로 판단해야 할까요?' },
  { id: 'm1', field: '의약', kind: 'major', text: '환자가 치료를 거부할 때 의료인은 어떻게 해야 한다고 생각하나요?' },
  { id: 'm2', field: '의약', kind: 'major', text: '의료 정보가 넘치는 시대에 보건의료인에게 필요한 역량은 무엇일까요?' },
  { id: 't1', field: '교육', kind: 'major', text: '수업에 집중하지 않는 학생이 있다면 첫 번째로 무엇을 하겠나요?' },
  { id: 't2', field: '교육', kind: 'major', text: '좋은 선생님의 조건을 경험을 바탕으로 한 가지만 말해 주세요.' },
  { id: 'a1', field: '예체능', kind: 'major', text: '본인의 작품이나 실기에서 가장 부족하다고 느끼는 점과 극복 계획을 말해 주세요.' },
  { id: 'a2', field: '예체능', kind: 'major', text: '예술이나 체육이 사회에 기여하는 방식 하나를 설명해 주세요.' },
];

export const questionsFor = (field, kind) =>
  QUESTIONS.filter(q => (q.field === '*' || q.field === field) && (!kind || q.kind === kind));

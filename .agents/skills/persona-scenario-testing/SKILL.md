---
name: persona-scenario-testing
description: "기능 개발 후 다양한 사용자 페르소나(Persona)와 시나리오를 설계하고, 브라우저를 직접 띄워 물리적 상태 단언(Physical Assertion) 및 Gap 분석을 수행하는 엄격한 QA 스킬"
---

# 페르소나 기반 시나리오 테스팅 스킬 (Persona Scenario Testing)

AI 에이전트의 주관적이고 낙관적인 판단("잘 된 것 같습니다")을 배제하고, **오픈소스 QA 프레임워크(browser-use, Stagehand, Midscene)의 핵심 엔지니어링 원칙(물리적 상태 검증, 불변식 검증, 에러 인터셉트)**을 적용하여 변칙성을 통제하는 엄격한 테스트 프로토콜입니다.

---

## 4대 불변 검증 원칙 (Invariants)

테스트 실행 시 AI는 단순 눈대중이 아닌, 브라우저 콘솔에서 다음 **4대 물리적 검증 코드**를 실행하여 `PASS` 여부를 판정해야 합니다:

### 1. 뷰포트 레이아웃 물리 검증 (Viewport Alignment)
모달, 팝오버 등 오버레이 UI가 화면 밖이나 최하단으로 밀려 떨어지지 않았는지 좌표를 검증합니다.
```javascript
// 브라우저 evaluate로 실행
(() => {
  const modal = document.querySelector('[role="dialog"]');
  if (!modal) return { pass: false, reason: "모달 DOM 없음" };
  const rect = modal.getBoundingClientRect();
  const centerY = (rect.top + rect.bottom) / 2;
  const viewportCenterY = window.innerHeight / 2;
  const isCentered = Math.abs(centerY - viewportCenterY) < 80;
  const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight + 50;
  return {
    pass: isCentered && isInViewport,
    rect: { top: rect.top, bottom: rect.bottom, height: rect.height },
    centerY,
    viewportCenterY,
    reason: !isCentered ? "모달이 화면 중앙이 아닌 곳(하단 등)으로 밀림" : "정상"
  };
})();
```

### 2. 상호작용성 및 포커스 트랩 검증 (Interactivity & Pointer-Events)
요소가 눈에 보이더라도 `pointer-events: none`이나 Radix Focus Trap에 의해 먹통인지 검증합니다.
```javascript
(() => {
  const popover = document.querySelector('[style*="z-index: 70"]') || document.querySelector('[style*="z-index: 9999"]');
  const input = popover?.querySelector('input');
  if (!input) return { pass: false, reason: "입력창 요소 없음" };
  
  const style = window.getComputedStyle(input);
  const pointerEventsOk = style.pointerEvents !== 'none';
  input.focus();
  const hasFocus = document.activeElement === input;
  
  return {
    pass: pointerEventsOk && hasFocus,
    pointerEvents: style.pointerEvents,
    hasFocus,
    reason: !pointerEventsOk ? "pointer-events: none 차단됨" : !hasFocus ? "포커스 트랩으로 입력 포커스 불가" : "정상"
  };
})();
```

### 3. 데이터 보존 불변식 검증 (Data Preservation Invariant)
"국문만 수정" 페르소나 실행 시, 기존 영문이 의도치 않게 새로 번역되어 덮어쓰여졌는지 원문과 대조합니다.
```javascript
// 수정 전 영문 원문 (beforeEn)과 저장 후 영문 (afterEn) 일치 검증
if (scenario === "keep_english_on_minor_edit") {
  assert(beforeEn.trim() === afterEn.trim(), "CRITICAL: 기존 영문이 자동 번역으로 덮어쓰여져 유실됨!");
}
```

### 4. 콘솔 무결성 (Console & Network Errors)
테스트 수행 중 `console.error` 또는 HTTP 4xx/5xx 실패가 1건이라도 발생하면 실패 처리.

---

## 실행 프로세스 (Execution Lifecycle)

```
[1. 페르소나 정의]
   ↓ (목적, 예상 행동, 금기 사항(Anti-patterns) 명시)
[2. 브라우저 subagent 가동 & 액션 실행]
   ↓ (실제 마우스 클릭, 텍스트 드래그, 우클릭, 타이핑)
[3. 브라우저 내부 물리 검증 (JS Assertion 실행)]
   ↓ (좌표, pointer-events, activeElement, 데이터 diff 측정)
[4. 실패 원인 공학적 분석 (CSS 충돌, FocusScope, 상태 불일치)]
   ↓
[5. 사용자에게 사실 기반 정량 보고서 제출]
```

---

## 페르소나 템플릿 예시

1. **오타 수정형 페르소나 (Minor Fixer)**
   - **목표**: 국문 제목의 오타 1글자만 수정하고 저장.
   - **검증**: `[수정사항만 저장 (영문 유지)]` 클릭 ➔ 영문 데이터 변경량 0 byte 확인.
2. **글로벌 전면 개편 페르소나 (Full Synchronizer)**
   - **목표**: 국문 본문 단락을 대폭 수정하고 영문도 통일.
   - **검증**: `[번역 후 저장 (영문 최신화)]` 클릭 ➔ 영문 자동 갱신 및 등록된 고정 용어 치환율 100% 확인.
3. **용어집 수시 등록 페르소나 (Glossary Power User)**
   - **목표**: 본문 단어 드래그 ➔ 우클릭 ➔ 팝오버 입력 ➔ 등록.
   - **검증**: 팝오버 출현 좌표가 커서 근처인가? 인풋 포커스 정상인가? 닫기 버튼 작동하는가?
4. **변칙적 조작 페르소나 (Adversarial / Chaos User)**
   - **목표**: 모달 바깥 연타, 1글자만 드래그 후 우클릭, 빈 텍스트 저장 시도.
   - **검증**: 모달 갇힘 현상 없음, 유효성 검증 토스트 출현, 비정상 API 호출 차단.

---

## 보고서 출력 양식 (Output Format)

```markdown
### 🧪 페르소나 시나리오 테스트 결과 보고

| 페르소나 | 시나리오 | 물리 검증 결과 (좌표/포커스/데이터) | 판정 |
|---|---|---|---|
| 오타 수정자 | 국문 1자 수정 후 저장 | 영문 원문 diff: 0 바이트 보존 | PASS |
| 용어 등록자 | 단어 드래그 후 우클릭 | rect.top: 240px (뷰포트 중앙), 포커스 획득 | PASS |
| 변칙 조작자 | 바깥 클릭 및 미입력 저장 | alert-dialog 정상 방어, 콘솔 에러 0건 | PASS |

#### 🔍 발견된 Gap 및 개선 필요 지점
- [ ] 문제점: (있을 경우 구체적 CSS 클래스 또는 상태 불일치 명시)
- [ ] 권장 해결책:
```

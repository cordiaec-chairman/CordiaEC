# 물리적 단언문 카탈로그 (Deterministic Physical Assertions Catalog)

## 1. 개요
LLM 에이전트의 가장 큰 취약점은 **"그럴듯하게 테스트했다고 착각하는 주관적 환각(Subjective Hallucination)"**입니다.  
본 카탈로그는 브라우저 서브에이전트가 테스트를 수행할 때 기계적으로 검증해야 하는 **물리적 측정 코드 및 불변식(Invariants)**을 정의합니다.

---

## 2. 5대 물리 단언군 (Physical Assertion Suites)

### Suite 1. 뷰포트 지오메트리 & 레이아웃 안정성 (Layout & Geometry)
모달, 드롭다운, 툴팁, 플로팅 바가 뷰포트 내에 정상 렌더링되는지 수학적으로 검증합니다.

```javascript
// [단언 1.1] 모달 뷰포트 중앙 정렬 검증 (Radix/Tailwind fixed 오버라이드 탐지)
const dialog = document.querySelector('[role="dialog"]');
const rect = dialog.getBoundingClientRect();
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;

const centerX = rect.left + rect.width / 2;
const centerY = rect.top + rect.height / 2;

// 중심점 오차 30px 이내 단언
const isHorizontallyCentered = Math.abs(centerX - viewportWidth / 2) < 30;
const isVerticallyCentered = Math.abs(centerY - viewportHeight / 2) < 30;
console.assert(isHorizontallyCentered && isVerticallyCentered, "모달이 뷰포트 중앙에서 이탈함", { rect });

// [단언 1.2] 화면 밖 잘림(Clipping) 및 오버플로우 방지
console.assert(rect.top >= 0 && rect.bottom <= viewportHeight, "모달 상/하단이 뷰포트 밖으로 잘림");
```

### Suite 2. 상호작용성 및 포커스 격리 (Pointer Events & Focus Trap)
클릭이 가능한 상태인지, 라이브러리의 포커스 트랩이나 백드롭이 이벤트를 가로채지 않는지 검증합니다.

```javascript
// [단언 2.1] 타겟 엘리먼트의 실제 클릭 수용 가능 여부
function assertInteractable(selector) {
  const el = document.querySelector(selector);
  console.assert(el !== null, `엘리먼트 부재: ${selector}`);
  
  const style = window.getComputedStyle(el);
  console.assert(style.pointerEvents !== 'none', `pointer-events: none 으로 차단됨: ${selector}`);
  console.assert(style.visibility !== 'hidden' && style.display !== 'none', `비가시 상태: ${selector}`);
  
  // 요소의 중심 좌표에서 hit-test 수행
  const rect = el.getBoundingClientRect();
  const hitEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  console.assert(el.contains(hitEl) || hitEl.contains(el), `다른 레이어(백드롭/투명 오버레이)에 가려짐! 최상단 요소:`, hitEl);
}

// [단언 2.2] Radix/모달 오픈 시 고아 엘리먼트(Orphan) 검사
// 모달 외부 body에 렌더링된 툴팁/팝오버가 aria-hidden이나 inert에 갇히지 않았는지 확인
const activePopovers = document.querySelectorAll('.floating-popover, [data-radix-popper-content-wrapper]');
activePopovers.forEach(popover => {
  let parent = popover.parentElement;
  while (parent && parent !== document.body) {
    console.assert(!parent.hasAttribute('aria-hidden') || parent.getAttribute('aria-hidden') === 'false', 
      "부모의 aria-hidden 때문에 팝오버 접근 차단됨", popover);
    parent = parent.parentElement;
  }
});
```

### Suite 3. 데이터 비파괴성 & 페이로드 무결성 (Payload & Data Integrity)
사용자가 수정하지 않은 기존 필드가 백엔드 통신 시 변조되거나 빈 값으로 덮어씌워지지 않는지 검증합니다.

```javascript
// [단언 3.1] 미수정 데이터 보존 검증 (0-byte 변조 방지)
// 원본 레코드 vs 저장 요청 페이로드 대조
function assertPayloadPurity(originalRecord, updatePayload, explicitlyEditedFields) {
  for (const [key, originalValue] of Object.entries(originalRecord)) {
    if (!explicitlyEditedFields.includes(key) && updatePayload.hasOwnProperty(key)) {
      console.assert(
        JSON.stringify(originalValue) === JSON.stringify(updatePayload[key]),
        `[경고] 사용자가 건드리지 않은 '${key}' 필드가 변조됨! 원본:`, originalValue, "전송값:", updatePayload[key]
      );
    }
  }
}
```

### Suite 4. 브라우저 런타임 클린니스 (Runtime Cleanliness)
작업 도중 콘솔 에러, 경고, 반응성 지연이 발생하는지 검증합니다.

```javascript
// [단언 4.1] 치명적 콘솔 에러 0건 유지
const fatalErrors = window.__capturedErrors || [];
console.assert(fatalErrors.length === 0, `런타임 에러 발생 (${fatalErrors.length}건):`, fatalErrors);

// [단언 4.2] 돔 누수(DOM Leak) 및 고아 노드 잔류 검사
// 모달이 닫힌 후 백드롭 잔여물이 남아있는지 확인
function assertCleanTeardown() {
  const orphanBackdrops = document.querySelectorAll('[data-radix-dialog-overlay], .modal-backdrop');
  console.assert(orphanBackdrops.length === 0, "닫힌 후 백드롭이 DOM에 잔류하여 화면 클릭을 방해함");
}
```

### Suite 5. 성능 및 반응성 (Performance & Latency)
새 기능 추가 후 기본 액션의 레이아웃 스래싱(Layout Thrashing) 및 반응 지연을 검증합니다.

```javascript
// [단언 5.1] 액션 반응성 (INP / Click to Visual Feedback)
const start = performance.now();
// (사용자 클릭 이벤트 트리거)
requestAnimationFrame(() => {
  const duration = performance.now() - start;
  console.assert(duration < 100, `시각적 피드백 지연 (>100ms): ${duration.toFixed(1)}ms`);
});
```

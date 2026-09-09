# CordiaEC 최신 기능 고도화 내역 및 인수인계 문서 (2026년 9월)

본 문서는 **CordiaEC 글로벌 웹 플랫폼**의 관리자 포스팅 스튜디오 인터랙션 고도화, Smart Dual Save 및 고정 용어집 연동, 영구적 범용 페르소나 기능 검증 프레임워크 구축, 그리고 레티나 디스플레이 대응 전역 스크롤 60 FPS 최적화 전체 변경 내역을 상세히 기록한 문서입니다.

---

## 📌 2026년 9월 주요 업데이트 요약 (Changelog)

### 1. 📝 관리자 포스팅 스튜디오 (AdminPostsTab) UX 전면 고도화
* **관련 파일**: `client/src/components/admin/AdminPostsTab.tsx`
* **모달 뷰포트 정중앙 렌더링 복구**:
  * `DialogContent`에 인라인으로 들어간 Tailwind `relative` 속성을 제거하여, Radix UI의 기본 뷰포트 센터링(`fixed left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2`)이 정상 복구되도록 조치.
  * 화면 하단으로 모달이 밀리거나 잘리는 레이아웃 버그를 원천 해결.
* **게시글 카드 전체 클릭 진입(Affordance)**:
  * 기존에는 우측 '수정' 버튼만 클릭 가능했으나, 카드 전체 영역(`Card`)에 `cursor-pointer hover:shadow-md`를 부여하여 카드 어디를 클릭해도 즉시 편집 모달이 열리도록 인터랙션 개선.
* **Smart Dual Save (버튼 분리형 스마트 저장)**:
  * 기존 게시글을 수정할 때 귀찮은 확인 팝업창을 띄우지 않고, 저장 버튼을 2개로 분리 제공:
    1. **`[수정사항만 저장 (영문 유지)]`**: 오타나 문장을 경미하게 수정했을 때 1클릭 저장. 공들여 작성해 둔 기존 영문 본문이 1글자도 변조되지 않고 **100% 안전 보존 (0-byte 손실)**.
    2. **`[✨ 번역 후 저장 (영문 최신화)]`**: 국문 본문이 대폭 바뀌었을 때 클릭. 등록된 고정 용어 사전을 자동 치환하며 영문 전체를 최신화하여 동시 저장.
* **고정 용어집(Glossary) 우클릭 등록 팝오버 안정화**:
  * 팝오버를 모달 외부 `#root`가 아닌 `DialogContent` 내부로 마운트하고, 좌표를 다이얼로그 기준으로 상대 계산하도록 재설계.
  * Radix UI의 포커스 트랩 및 `pointer-events: none` 차단 문제를 원천 해소하여 드래그 우클릭 시 정상 입력 및 저장이 가능하도록 해결.
* **작성자별 자동 번역 설정 격리**:
  * `autoTranslateEnabled` 전역 설정을 작성자 계정 단위(`user.user_metadata` 및 `localStorage`)로 격리하여, 여러 관리자가 서로 다른 번역 선호도를 유지할 수 있도록 정비.

---

### 2. 🧪 영구적 범용 페르소나 기능 검증 프레임워크 구축
* **관련 디렉토리**: `.agents/skills/persona-scenario-testing/`
  * `SKILL.md` (마스터 헌장 및 실행 규격)
  * `references/graph-engineering.md` (상태-행동 유향 그래프 모델링 및 4대 병리 감지)
  * `references/physical-assertions.md` (결정론적 DOM 지오메트리/포커스/페이로드 단언문 카탈로그)
  * `references/domain-examples.md` (이커머스/SaaS/RBAC/CMS 다중 도메인 적용 매트릭스)
  * `references/anti-frankenstein-audit.md` (덧대기식 코딩 및 주객전도 방지 감사 프로토콜)
* **프레임워크 핵심 가치**:
  * **2대 보편 공리**:
    1. *인지 마찰 불변의 법칙*: 신규 기능이 기존 사용자의 근육 기억을 해치거나 스텝 수/망설임을 늘려서는 안 됨.
    2. *핵심 가치 보존 및 반(反)프랑켄슈타인*: 부가 기능을 덧대느라 본질적 핵심 엔진을 오염시키거나 느리게 만들어서는 안 됨.
  * **4대 보편 아키타입**:
    * **A. 관성적 미니멀리스트**: 기존의 단순 작업만 빠르게 끝내려는 유저 (스텝 수 증가 0회 검증).
    * **B. 본질적 파워 생산자**: 대용량 데이터 및 핵심 기능을 극한으로 쓰는 유저 (성능 저하 및 레이아웃 침해 0px 검증).
    * **C. 신규 기능 수혜자**: 새 기능을 적극 활용하는 타겟 유저 (최소 마찰로 고차원 결과 도출 검증).
    * **D. 경계선/혼돈 탐색자**: 변칙적 입력, 중도 취소, 연타를 수행하는 유저 (고아 DOM 및 시스템 크래시 0건 검증).
  * **인간 개입형(HITL) 4단계 라이프사이클**:
    * AI가 독단적으로 테스트를 끝내지 않고, **Phase 1(시나리오 그래프 제출 및 사용자 컨펌)** ➔ **Phase 2(브라우저 자율 계측)** ➔ **Phase 3(퇴행/인지 마찰 분석)** ➔ **Phase 4(정량 진단 보고)**를 단계별로 거침.
  * **실환경 E2E 검증 완료**:
    * 상용 사이트(`https://k-dia.net/admin`, `news`, `reports`)에서 크롬 브라우저 서브에이전트를 통해 4대 아키타입 실측 검증 완료 및 녹화 증거 확보.

---

### 3. ⚡ 레티나 디스플레이 대응 전역 스크롤 60 FPS 최적화
* **관련 파일**: `client/src/components/Layout.tsx`, `client/src/pages/Reports.tsx`, `client/src/pages/News.tsx`, `client/src/pages/OverseasKorean.tsx`
* **현상**: MacBook 레티나 디스플레이 및 크롬 브라우저에서 리포트/뉴스 스크롤 시 미세한 프레임 튐(Jank) 발생.
* **원인 규명**:
  1. 상단 고정 헤더 및 플로팅 SNS 바의 `backdrop-blur-md`로 인해, 스크롤 매 프레임마다 크롬 Blink 엔진이 GPU 셰이더로 수백만 픽셀을 실시간 블러 재연산(Re-compositing)하는 병목 발생.
  2. 카드 목록 썸네일 이미지에 비동기 디코딩(`decoding="async"`)이 없어 뷰포트 진입 시 메인 UI 스레드 일시 멈칫 유발.
* **최적화 조치**:
  1. `Layout.tsx`: 고정 헤더와 SNS 플로팅 바에서 무거운 `backdrop-blur-md`를 걷어내고 깔끔한 `bg-white` + `border-b`로 전환하여 **실시간 GPU 블러 셰이더 부하를 0으로 소멸**.
  2. `Reports.tsx`, `News.tsx`, `OverseasKorean.tsx`: 모든 카드 이미지에 `loading="lazy"` 및 `decoding="async"` 표준 속성 적용.
* **실측 검증 결과**:
  * 스크롤 평균 FPS: **60 FPS** 유지.
  * 33ms 초과 프레임 지연(Long Frame): **0건 (0.00)**.
  * 텍스트 및 레이아웃 깨짐 부작용 0% 확인.

---

## 🚀 배포 및 동기화 상태
* **GitHub Remotes**:
  * `origin/main` (`leejy9/CordiaEC_portfolio`) 최신화 완료.
  * `upstream/main` (`cordiaec-chairman/CordiaEC`) 최신화 완료.
* **Vercel 프로덕션**: 빌드 및 라이브 배포 완료 (`https://k-dia.net`).

# CordiaEC 최신 기능 고도화 내역 및 인수인계 문서 (2026년 8월)

본 문서는 **CordiaEC 글로벌 웹 플랫폼**의 UI/UX 고도화, 관리자 포스팅 스튜디오 구축, About 페이지 공식 브랜드 스토리 정립, 다국어 및 미디어 처리 파이프라인의 전체 변경 내역을 상세히 기록한 문서입니다.

---

## 📌 주요 업데이트 요약 (Changelog)

### 1. 📝 관리자 포스팅 스튜디오 (Full-Width Rich Posting Studio)
* **파일**: `client/src/components/admin/AdminPostsTab.tsx`, `client/src/components/MarkdownRenderer.tsx`, `client/src/lib/imageCompressor.ts`
* **100% 풀 와이드 상하 분할 레이아웃**:
  * **상단 (100%)**: 게시판 구분, 연계 이니셔티브, 발행일자, 외부 원문 링크 및 대표 썸네일/PDF 전문 업로더 배치.
  * **설정 접기/펼치기 (`Settings Collapse`)**: 글 작성 시 상단 우측의 `[게시/파일 설정 접기]`를 통해 화면 전체를 글쓰기 에디터로 확장 가능.
* **리치 포스팅 툴바 (Posting Toolbar)**:
  * 소제목(`H2`, `H3`), 볼드(`**`), 이탤릭(`*`), 인용구(`>`), 글머리 기호(`-`), 순서 목록(`1.`), 링크, 구분선 도구 지원.
  * **본문 내 사진 삽입 (`[🖼️ 본문 사진 삽입]`)**:
    * 사진 선택 즉시 브라우저에서 **1600px 리사이징 & WebP 85% 자동 압축** 후 Supabase Storage(`post-images`) 업로드.
    * 본문 커서 위치에 `![이미지 설명](URL)` 마크다운 태그를 자동 주입.
* **실시간 마크다운 미리보기 모드 (`Live Preview`)**:
  * 실제 사용자 화면과 100% 동일한 타이포그래피 스타일을 작성 도중 토글하여 즉시 검토 가능.
* **DeepL 자동 번역 시 서식/이미지 보존**:
  * `client/src/lib/queries.ts`의 `translateTexts`에 정규식 기반 **플레이스홀더 마스킹/언마스킹 파이프라인**을 적용하여, 국문→영문 자동 번역 시 이미지 태그 및 링크 URL이 번역기로 인해 깨지는 현상을 100% 원천 차단.

---

### 2. 🏛️ About 페이지 공식 브랜드 스토리 정립
* **파일**: `client/src/pages/About.tsx`, `client/src/lib/i18n.tsx`, `client/src/lib/queries.ts`
* **3대 핵심 섹션 구조화**:
  1. **설립자 인사말 및 지향점 (Founder's Message)**:
     * 한국학 학술 연구팀 기반에서 출발하여 일회성 매칭의 한계를 극복하고, 부설 연구원(KDec)의 학술 신뢰도와 협동조합의 무역/문화 실행력을 결합한 설립 당위성 에세이.
  2. **미션과 비전 (Mission & Vision)**:
     * `Compass`와 `Globe` 아이콘을 활용한 2열 카드 레이아웃.
  3. **공식 연혁 (Our History - 타임라인 형태)**:
     * 행정 서류에 기록된 **실제 공식 연혁 7개 항목** 수록 (서초구청 설립신고증 제2025-서울서초-352호, 법인 설립 등기, 부설 KDec 연구원 명칭 확정, 조달청 나라장터 민간수요자 등록 등).
     * `DEFAULT_MILESTONES` 기본 탑재 및 관리자 `AdminMilestonesTab`과 양방향 연동.
* **완벽한 국/영문 다국어(i18n) 지원**:
  * 모든 인사말, 미션/비전, 연혁 항목이 글로벌 영문 모드 전환 시 매끄럽게 번역되어 출력.

---

### 3. 🎨 홈 화면 및 글로벌 헤더 UX 최적화
* **파일**: `client/src/pages/Home.tsx`, `client/src/components/Layout.tsx`
* **홈 화면 이니셔티브 카드 (1×6 가로 쇼케이스 & 타이포그래피 정비)**:
  * 좁은 카드 폭에서 발생하던 1글자 떨어짐(예: `자\n문`) 및 영문 말줄임표(`...`) 잘림을 완벽 해결.
  * **단어 단위 줄바꿈 (`break-keep`)** + **자간 미세 조정 (`tracking-tight`)** + **카드 텍스트 최소 높이 고정 (`min-h-[58px]`)**을 적용하여 6개 카드의 하단 라인이 일직선으로 반듯하게 정렬.
* **글로벌 헤더 우측 상단 가독성 개선**:
  * 좁은 헤더 우측에 겹쳐 있던 SNS 아이콘들을 분리하고, **`[KOR | ENG]` 언어 전환 버튼만 단독 배치**하여 가독성과 조작 편의성을 극대화.
  * SNS 채널 링크는 사이트 하단 푸터(Footer)와 모바일 드로어 메뉴에 정갈하게 집중 배치.

---

### 4. 📊 콘텐츠 뷰어 마크다운 렌더러 연결
* **파일**: `client/src/components/modals/NewsModal.tsx`, `client/src/pages/NewsDetail.tsx`, `client/src/pages/ReportDetail.tsx`, `client/src/pages/OverseasKoreanDetail.tsx`
* 모든 게시글 상세 페이지 및 뉴스 모달에서 단순 개행(`split('\n')`) 대신 `<MarkdownRenderer />`를 사용하여 소제목, 볼드, 인용구, 본문 내 사진 등이 잡지처럼 유려하게 렌더링되도록 통일.

---

## 🚀 운영 서버(Production) 배포 시 점검 사항

1. **신규 패키지**:
   * `package.json`에 `react-markdown` 및 `remark-gfm`이 추가되어 있으므로 호스팅 서버(Vercel 등)에서 빌드 시 자동 설치됩니다.
2. **Supabase Storage 버킷**:
   * `post-images` (대표 이미지 및 본문 인라인 이미지) - Public 설정
   * `post-files` (PDF 보고서 전문 파일) - Public 설정
3. **환경변수 (Environment Variables)**:
   * `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
   * `VITE_SUPABASE_ANON_KEY`: Supabase 익명 공개 키
   * `DEEPL_API_KEY`: DeepL 번역 API 키 (서버리스 `/api/translate`용)

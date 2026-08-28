# CordiaEC 최신 기능 고도화 내역 및 인수인계 문서 (2026년 8월)

본 문서는 **CordiaEC 글로벌 웹 플랫폼**의 UI/UX 고도화, 관리자 포스팅 스튜디오 구축, About 페이지 공식 브랜드 스토리 정립, 다국어 분리 관리, 팝업/문의/이메일 파이프라인 및 스크롤 최적화 전체 변경 내역을 상세히 기록한 문서입니다.

---

## 📌 주요 업데이트 요약 (Changelog)

### 1. 🚀 페이지 진입 및 라우팅 시 최상단 스크롤 보장 & 레이아웃 시프트 방지
* **파일**: `client/src/main.tsx`, `client/src/App.tsx`, `client/src/components/HeroCarousel.tsx`
* **브라우저 스크롤 위치 강제 복원 방지**:
  * `main.tsx`에 `window.history.scrollRestoration = "manual"`을 적용하여 페이지 새로고침이나 재방문 시 브라우저가 이전 스크롤 위치를 임의로 기억해 이니셔티브 섹션 등으로 이동하는 현상을 원천 방지.
* **즉각적인 최상단 스크롤 (`ScrollToTop`)**:
  * 라우트 변경 시 `window`, `documentElement`, `body`의 스크롤 위치를 `behavior: "instant"`로 즉시 (0, 0)으로 초기화하고, 비동기 렌더링 직후(50ms) 재보정 실행.
* **히어로 캐러셀 레이아웃 시프트(CLS) 방지**:
  * 슬라이드 데이터 로딩 중 빈 화면(`null`)을 반환하지 않고, 동일한 높이(`h-[440px] sm:h-[500px] lg:h-[540px]`)의 배경 스켈레톤을 렌더링하여 하단 콘텐츠(About, Initiatives)가 위로 튀어 올라오는 깜빡임을 완벽 차단.

---

### 2. 🌐 문의하기 (Contact) 페이지 & ContactModal 한/영 다국어 완벽 분기
* **파일**: `client/src/pages/Contact.tsx`, `client/src/components/modals/ContactModal.tsx`, `client/src/lib/i18n.tsx`
* **Contact 페이지 전체 한글/영문 대응**:
  * 연락처 정보(Email, Phone), 주소(인하대학교 K-학술확산연구센터 국/영문 표기), 업무 시간(Business Hours), 안내 사항(What to expect) 4대 항목 완벽 분기.
* **ContactModal 폼 & 유효성 검사 다국어 처리**:
  * 폼 라벨, Placeholder, Zod 유효성 검사 에러 메시지(이름/이메일/내용 글자수 제한), 전송 중 상태(`전송 중...` / `Sending...`), 성공/실패 토스트 알림까지 방문자 언어에 맞춰 100% 자동 전환.

---

### 3. 📧 문의 접수 및 이메일 자동 알림 파이프라인 (Resend API 연동)
* **파일**: `api/contact.js`, `client/src/lib/queries.ts`
* **이중 저장 및 알림 아키텍처**:
  1. **Supabase DB (`contacts` 테이블)**: 접수된 모든 문의를 DB에 영구 보관 (관리자 패널에서 실시간 조회 및 삭제 가능).
  2. **이메일 자동 발송 (Resend API)**: 문의 접수 즉시 `cordiaec@gmail.com`으로 상세 문의 내역(문의자명, 회신 이메일, 접수 일시, 문의 본문, 원클릭 답장 링크)이 담긴 HTML 메일 자동 전달.
* **스팸 방지 (Honeypot)** 및 API 실패 시 클라이언트 직접 DB Insert Fallback 로직 탑재.

---

### 4. 🎨 브랜드 로고 그래픽 고도화 & 협력사 배너 규격 개선
* **파일**: `attached_assets/headline_ko.png`, `client/src/components/Layout.tsx`, `client/src/components/PartnerBanner.tsx`
* **한글 로고 딥오션 블루(`#014d8b`) 색상 일치 및 'Cordia' Bold체 강화**:
  * 영문 시그니처 로고 색상(`RGB(1, 77, 139)`)과 100% 동일하게 한글 로고 텍스트 색상을 통일.
  * 하단 "Cordia" 영문 서체를 스무스 안티앨리어싱 볼드체로 보강하여 심볼 마크와의 시각적 균형감 완성.
  * 하단 다크 푸터(Footer)에서는 `brightness-0 invert`를 통해 선명한 화이트 로고로 자동 반전 렌더링.
* **협력사 로고 카드 크기 확대**:
  * 카드 높이(`h-20 sm:h-24`) 및 로고 최대 높이(`max-h-14 sm:max-h-16`)를 상향하여, 세로형 로고(예: 이주및재외동포센터)가 지나치게 작아지는 현상을 해결하고 가로형 로고와의 조화를 달성.

---

### 5. 📢 팝업(Popups) 한/영 분리 관리 및 DeepL 원클릭 번역 복제
* **파일**: `client/src/components/admin/AdminPopupsTab.tsx`, `client/src/components/PopupDisplay.tsx`, `supabase/patch_2026_08_popups_lang.sql`
* **언어별 노출 제어**:
  * 팝업 데이터 모델에 `target_lang` (`"all"` | `"ko"` | `"en"`) 지원.
  * 한국어 방문자에게는 국문+공통 팝업("오늘 하루 보지 않기" / "닫기"), 영문 방문자에게는 영문+공통 팝업("Do not show today" / "Close")으로 자동 필터링 노출.
* **관리자 팝업 스튜디오 기능**:
  * 상단 언어 필터 탭(`[전체]`, `[🇰🇷 한국어]`, `[🇺🇸 영어]`, `[🌐 공통]`).
  * 팝업 카드 목록에서 **`[✨ 영문/국문 팝업 초안 생성]`** 원클릭 버튼 제공 (DeepL 번역 후 기존 위치/레이아웃을 복제하여 전용 이미지만 교체 등록 가능).

---

### 6. 📝 관리자 포스팅 스튜디오 (Full-Width Rich Posting Studio)
* **파일**: `client/src/components/admin/AdminPostsTab.tsx`, `client/src/components/MarkdownRenderer.tsx`
* **100% 풀 와이드 상하 분할 레이아웃 & 설정 접기/펼치기 (`Settings Collapse`)**: 글 작성 시 상단 설정을 접고 화면 전체를 글쓰기 에디터로 확장 가능.
* **리치 포스팅 툴바 (Posting Toolbar)**: 소제목(`H2`, `H3`), 볼드, 이탤릭, 인용구, 목록, 링크 도구 및 **본문 내 WebP 85% 자동 압축 사진 삽입 (`[🖼️ 본문 사진 삽입]`)** 지원.
* **실시간 마크다운 미리보기 모드 (`Live Preview`)** 및 DeepL 번역 시 마크다운/이미지 태그 보존 파이프라인 적용.
* **이니셔티브 연계 저장 및 조회 버그 완벽 수정**.

---

### 7. 🏛️ About 페이지 공식 브랜드 스토리 정립 & 연혁 다국어화
* **파일**: `client/src/pages/About.tsx`, `client/src/lib/i18n.tsx`, `client/src/lib/queries.ts`
* 설립자 인사말(Founder's Message), 미션 & 비전 2열 카드, 행정 서류 기반 공식 연혁 7개 항목 수록.
* 공식 연혁 항목 국/영문 자동 번역 매핑 및 타임라인 날짜 뱃지 로컬라이징.

---

### 8. 🔒 브라우저 종료 시 세션 즉시 만료 (보안 강화)
* **파일**: `client/src/lib/supabase.ts`
* Supabase Auth 스토리지 설정을 `localStorage`에서 `window.sessionStorage`로 전환하여 브라우저 창/탭을 닫으면 관리자 로그인 세션이 즉시 자동 소각되도록 보안 정책 강화.

---

## 🚀 운영 서버(Production) 환경변수 점검 체크리스트

| 환경변수 | 위치 | 필수 여부 | 설명 |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Vercel Project Settings | ✅ 필수 | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Vercel Project Settings | ✅ 필수 | Supabase 익명 공개 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel Project Settings | 💡 권장 | 서버리스 API에서 RLS 우회 안전 저장용 |
| `DEEPL_API_KEY` | Vercel Project Settings | ✅ 필수 | DeepL 번역 API 키 (`/api/translate`용) |
| `RESEND_API_KEY` | Vercel Project Settings | ✅ 필수 | Resend 이메일 발송 API 키 (`/api/contact`용) |
| `CONTACT_RECEIVER_EMAIL` | Vercel Project Settings | 선택 | 문의 수신 메일 (기본값: `cordiaec@gmail.com`) |
| `RESEND_FROM_EMAIL` | Vercel Project Settings | 선택 | 발신 메일 주소 (DNS 인증 완료 시 `CordiaEC <contact@k-dia.net>` 등) |

---

## 🗄️ Supabase DB 마이그레이션 이력
1. `supabase/migration.sql` — 초기 전체 스키마 (테이블, RLS, Storage 정책)
2. `supabase/patch_2026_08_posts_fix.sql` — posts 테이블 `file_name`, `file_url` 컬럼 및 Storage 버킷
3. `supabase/patch_2026_08_popups_lang.sql` — popups 테이블 `target_lang` 컬럼 추가

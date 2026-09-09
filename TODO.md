# CordiaEC 작업 현황

> 2026-06-11: TODO 4건 + 이중언어(KOR/ENG + DeepL 자동번역) 구현 완료.

## ✅ 완료된 작업

1. **페이지 전환 애니메이션** — 라우트 변경 시 0.28초 페이드인+상승 (CSS만 사용)
2. **히어로 캐러셀** — `hero_slides` 테이블 + admin "히어로" 메뉴 (슬라이드 CRUD, 이미지 업로드, 순서 변경, 활성 토글, 전환 간격 설정). 홈 첫 화면이 자동 전환 슬라이드로 교체됨 (이전/일시정지/다음 + 인덱스 표시)
3. **팝업 안내창** — `popups` 테이블 + admin "팝업" 메뉴 (위치 5종/크기/게시 시작·종료 일시/활성 토글/이미지/링크). 홈에서 게시 기간 내 팝업 표시 + "오늘 하루 보지 않기"
4. **백업 자동화** — `.github/workflows/backup.yml` 주 1회(월요일 KST 오전 9시) 전체 테이블 JSON을 `backups/`에 자동 커밋
5. **유튜브 영상 홈 쇼케이스 (B-Plus 하이브리드 슬라이더)** — 홈 이니셔티브와 최신 소식 사이에 배치. 최신 영상 대형 피처드 카드 + 우측 가로 슬라이더 카드 리스트. 클릭 시 16:9 반응형 라이트박스 팝업 재생 지원.
6. **어드민 유튜브 영상 관리 탭 (`AdminYouTubeTab.tsx`)** — 유튜브 URL 입력 시 비디오 ID 및 고화질 썸네일 자동 파싱, 한/영 제목 및 설명, 노출 순서, 활성화 토글 CRUD 지원.
7. **어드민 2열 작성 스튜디오 (`AdminPostsTab.tsx`)** — 96vw × 92vh 몰입형 2열 레이아웃(좌측 72% 메인 캔버스, 우측 28% 발행/메타데이터 사이드 패널). 스마트 듀얼 저장(영문 유지 vs 자동번역 최신화) 보존.
8. **본문 Ctrl+V 클립보드 이미지 다이렉트 업로드** — 본문 에디터에서 스크린샷 붙여넣기 시 1600px WebP 자동 최적화 후 Supabase Storage 업로드 및 마크다운 커서 자동 삽입.
9. **게시글 예약 발행 지원** — 발행일자를 미래 날짜로 지정 시 일반 방문자(홈/목록/상세) 노출 자동 차단, 관리자 목록에서 차분한 중립 슬레이트 회색 `[예약 (YYYY-MM-DD)]` 뱃지 표시.

## ⚠️ 백업 활성화에 필요한 1회성 설정 (사용자 작업)

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret:

| Secret 이름 | 값 |
|---|---|
| `SUPABASE_URL` | `https://pjgywtpysimaywlaaymj.supabase.co` |
| `SUPABASE_ANON_KEY` | anon key (.env.local과 동일 값) |
| `SUPABASE_SERVICE_ROLE_KEY` | (선택) Supabase 대시보드 → Settings → API → service_role. 등록해야 contacts(문의 개인정보)까지 백업됨 |

등록 후 GitHub → Actions 탭 → "Weekly Supabase Backup" → Run workflow로 수동 테스트 1회 권장.

## ⚠️ 이중언어 활성화에 필요한 1회성 설정 (사용자 작업)

1. [DeepL API Free](https://www.deepl.com/pro-api) 가입 (무료, 월 50만 자) → API 키 발급
2. Vercel → Settings → Environment Variables → `DEEPL_API_KEY` 추가 → Redeploy
3. 키 등록 전에도 사이트·KOR/ENG 토글은 정상 작동 (자동 번역 버튼만 비활성 에러)

## 남은 아이디어 및 향후 핵심 과제 (미착수)

- [ ] **보고서 및 뉴스 SEO & GEO (Generative Engine Optimization / AI 검색 최적화) 세팅**:
  - OpenGraph / Twitter Card 동적 메타태그 완성 (각 보고서/뉴스별 맞춤 타이틀, 썸네일, 발췌문 반영).
  - Schema.org JSON-LD 구조화 데이터 (`Article`, `Report`, `Organization`) 주입으로 구글 리치 검색결과 및 Perplexity, ChatGPT, Gemini 등 생성형 AI 검색엔진의 지식 인덱싱(GEO) 극대화.
  - 사이트맵(`sitemap.xml`) 및 `robots.txt` 자동 갱신 파이프라인.
- 코드 스플리팅으로 초기 번들 최적화 (dynamic import() 적용)
- 도메인 연결 (Vercel → Settings → Domains)

## 재개 시 컨텍스트 메모

- DB 접근은 전부 `client/src/lib/queries.ts`, 타입은 `database.types.ts`
- DB 스키마: `supabase/migration.sql`(최초) + `supabase/2026-06-11_hero_popups.sql`(증분). **migration.sql 전체 재실행 금지** (데이터 삭제됨)
- 새 테이블은 Supabase MCP(apply_migration)로 직접 적용 가능 (project_id: `pjgywtpysimaywlaaymj`)
- admin 메뉴 추가: `pages/Admin.tsx`의 MENU 배열 + `components/admin/` 탭 컴포넌트
- 브랜드 색상은 `index.css` 수제 클래스 (`bg-cordia-teal` 등) — 그라데이션/투명도 변형 없음 주의
- 배포: push → Vercel 자동. 환경변수 변경 시만 수동 Redeploy

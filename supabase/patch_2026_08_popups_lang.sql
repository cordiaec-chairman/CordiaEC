-- ============================================================
-- 팝업 다국어 지원: 노출 대상 언어(target_lang) 컬럼 추가
-- 'all': 한국어/영어 사이트 공통 노출
-- 'ko': 한국어(KOR) 사이트 방문자에게만 노출 (국문 포스터 등)
-- 'en': 영어(ENG) 사이트 방문자에게만 노출 (영문 포스터 등)
-- ============================================================

ALTER TABLE popups ADD COLUMN IF NOT EXISTS target_lang text DEFAULT 'all';

-- 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_popups_target_lang ON popups (target_lang);

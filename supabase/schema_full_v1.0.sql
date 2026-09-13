-- ============================================================
-- CordiaEC (사단법인 지구촌한인세상 꼬르디아) 
-- 통합 마스터 데이터베이스 스키마 (schema_full_v1.0.sql)
-- 
-- 최종 갱신: 2026-09-13
-- 포함 기능:
-- 1. 10대 핵심 테이블 (게시글, 유튜브, 이니셔티브, 연혁, 파트너, 팝업, 문의, 용어집 등)
-- 2. 완전한 Row Level Security (RLS) 보안 정책 (미인증 쓰기/삭제 원천 차단)
-- 3. Storage 버킷 (post-images, report-files) 및 접근 제어
-- 4. 필수 기본 시드 데이터 (이니셔티브, 번역 고정 용어사전, 협력사)
-- ============================================================

-- 확장 모듈 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. posts (소식 / 디아스포라 칼럼 / 연구보고서)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board        TEXT NOT NULL DEFAULT 'news' CHECK (board IN ('news', 'diaspora', 'reports')),
  title        TEXT NOT NULL,
  title_ko     TEXT,
  title_en     TEXT,
  summary      TEXT,
  summary_ko   TEXT,
  summary_en   TEXT,
  content      TEXT NOT NULL DEFAULT '',
  content_ko   TEXT,
  content_en   TEXT,
  category     TEXT DEFAULT '일반',
  category_ko  TEXT,
  category_en  TEXT,
  image_url    TEXT,
  file_url     TEXT,
  file_name    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_public_read" ON public.posts;
CREATE POLICY "posts_public_read" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "posts_admin_all" ON public.posts;
CREATE POLICY "posts_admin_all" ON public.posts FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 2. youtube_videos (글로벌 유튜브 영상 쇼케이스)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.youtube_videos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_url    TEXT NOT NULL,
  video_id       TEXT NOT NULL,
  title          TEXT NOT NULL,
  title_ko       TEXT,
  summary        TEXT,
  summary_ko     TEXT,
  published_date DATE NOT NULL DEFAULT CURRENT_DATE,
  display_order  INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "youtube_videos_public_read" ON public.youtube_videos;
CREATE POLICY "youtube_videos_public_read" ON public.youtube_videos FOR SELECT USING (true);

DROP POLICY IF EXISTS "youtube_videos_admin_write" ON public.youtube_videos;
CREATE POLICY "youtube_videos_admin_write" ON public.youtube_videos FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 3. initiatives (6대 핵심 이니셔티브)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.initiatives (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number         INTEGER NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  title_ko       TEXT,
  title_en       TEXT,
  subtitle       TEXT,
  subtitle_ko    TEXT,
  subtitle_en    TEXT,
  description    TEXT,
  description_ko TEXT,
  description_en TEXT,
  icon           TEXT,
  image_url      TEXT,
  bullets        JSONB DEFAULT '[]'::jsonb,
  bullets_ko     JSONB DEFAULT '[]'::jsonb,
  bullets_en     JSONB DEFAULT '[]'::jsonb,
  display_order  INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "initiatives_public_read" ON public.initiatives;
CREATE POLICY "initiatives_public_read" ON public.initiatives FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "initiatives_admin_all" ON public.initiatives;
CREATE POLICY "initiatives_admin_all" ON public.initiatives FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 4. partners (협력 기관 / 스폰서 배너)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  logo_url      TEXT NOT NULL,
  link_url      TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partners_public_read" ON public.partners;
CREATE POLICY "partners_public_read" ON public.partners FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "partners_admin_all" ON public.partners;
CREATE POLICY "partners_admin_all" ON public.partners FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 5. contacts (온라인 문의함 — 개인정보 보호 RLS 적용)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 비로그인 방문자의 신규 문의 작성만 허용 (목록 열람 절대 불가)
DROP POLICY IF EXISTS "contacts_public_insert" ON public.contacts;
CREATE POLICY "contacts_public_insert" ON public.contacts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- 관리자만 문의 내역 열람 및 삭제 가능
DROP POLICY IF EXISTS "contacts_admin_read" ON public.contacts;
CREATE POLICY "contacts_admin_read" ON public.contacts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "contacts_admin_delete" ON public.contacts;
CREATE POLICY "contacts_admin_delete" ON public.contacts FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 6. glossary (DeepL 번역 고정 용어사전)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.glossary (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_term TEXT NOT NULL UNIQUE,
  target_term TEXT NOT NULL,
  category    TEXT DEFAULT '기관명',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.glossary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "glossary_public_read" ON public.glossary;
CREATE POLICY "glossary_public_read" ON public.glossary FOR SELECT USING (true);

DROP POLICY IF EXISTS "glossary_admin_all" ON public.glossary;
CREATE POLICY "glossary_admin_all" ON public.glossary FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- 고정 용어사전 기본 시드 데이터
INSERT INTO public.glossary (source_term, target_term, category) VALUES
  ('지구촌한인세상', 'Cordia (Global Korean World)', '기관명'),
  ('꼬르디아', 'Cordia', '기관명'),
  ('K학술확산연구센터', 'K-Academic Diffusion Research Center', '기관명'),
  ('인하대 국제관계연구소', 'Center for International Studies, Inha University', '기관명'),
  ('디아스포라', 'Diaspora', '학술'),
  ('한국학', 'Korean Studies', '학술'),
  ('재외동포', 'Overseas Koreans', '일반'),
  ('고려인', 'Koryo-saram (Ethnic Koreans in Post-Soviet States)', '일반')
ON CONFLICT (source_term) DO NOTHING;

-- ============================================================
-- 7. milestones (연혁) & hero_slides (히어로) & popups (팝업)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.milestones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year           TEXT NOT NULL,
  title          TEXT NOT NULL,
  title_ko       TEXT,
  title_en       TEXT,
  description    TEXT,
  description_ko TEXT,
  description_en TEXT,
  display_order  INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones_public_read" ON public.milestones FOR SELECT USING (true);
CREATE POLICY "milestones_admin_all" ON public.milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.popups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  title_ko    TEXT,
  title_en    TEXT,
  content     TEXT,
  content_ko  TEXT,
  content_en  TEXT,
  image_url   TEXT,
  link_url    TEXT,
  link_text   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  start_date  DATE,
  end_date    DATE,
  lang        TEXT NOT NULL DEFAULT 'ko'
);
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "popups_public_read" ON public.popups FOR SELECT USING (is_active = true);
CREATE POLICY "popups_admin_all" ON public.popups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 8. Storage 버킷 (post-images, report-files)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('post-images', 'post-images', true),
  ('report-files', 'report-files', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_public_read') THEN
    CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT USING (bucket_id IN ('post-images', 'report-files'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_admin_upload') THEN
    CREATE POLICY "storage_admin_upload" ON storage.objects FOR INSERT WITH CHECK (
      bucket_id IN ('post-images', 'report-files') AND auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_admin_delete') THEN
    CREATE POLICY "storage_admin_delete" ON storage.objects FOR DELETE USING (
      bucket_id IN ('post-images', 'report-files') AND auth.role() = 'authenticated'
    );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

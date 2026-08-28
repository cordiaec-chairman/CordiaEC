-- ============================================================
-- CordiaEC Database Schema Patch (2026-08)
-- 문제 해결:
-- 1. posts 테이블 'file_name', 'file_url' 컬럼 및 'reports' board 제약조건 보장
-- 2. contacts 테이블 RLS 정책 갱신 (비로그인 방문자의 문의 등록 완벽 허용)
-- 3. partners (협력사) 테이블 생성 및 RLS 정책 보장
-- 4. Storage 버킷 및 권한 보장
-- 5. PostgREST 스키마 캐시 즉시 갱신
-- ============================================================

-- ① posts 테이블에 첨부파일 관련 컬럼 추가
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS file_name TEXT;

-- ② posts 테이블 board 제약조건에 'reports' 포함 갱신
DO $$
BEGIN
  ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_board_check;
  ALTER TABLE public.posts ADD CONSTRAINT posts_board_check CHECK (board IN ('news', 'diaspora', 'reports'));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'posts_board_check warning: %', SQLERRM;
END $$;

-- ③ contacts (문의 접수) 테이블 및 RLS 정책 (비로그인 등록 허용)
CREATE TABLE IF NOT EXISTS public.contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_public_insert" ON public.contacts;
CREATE POLICY "contacts_public_insert" ON public.contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "contacts_admin_read" ON public.contacts;
CREATE POLICY "contacts_admin_read" ON public.contacts
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "contacts_admin_delete" ON public.contacts;
CREATE POLICY "contacts_admin_delete" ON public.contacts
  FOR DELETE
  TO authenticated
  USING (true);

-- ④ partners (협력사 배너) 테이블 보장
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
CREATE POLICY "partners_public_read" ON public.partners
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "partners_admin_all" ON public.partners;
CREATE POLICY "partners_admin_all" ON public.partners
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ⑤ Storage 버킷 생성 및 RLS 정책 보장 (post-images, report-files)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('post-images', 'post-images', true),
  ('report-files', 'report-files', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_objects_public_read') THEN
    CREATE POLICY "storage_objects_public_read" ON storage.objects
      FOR SELECT USING (bucket_id IN ('post-images', 'report-files'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_objects_admin_upload') THEN
    CREATE POLICY "storage_objects_admin_upload" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id IN ('post-images', 'report-files') AND auth.role() = 'authenticated'
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'storage_objects_admin_delete') THEN
    CREATE POLICY "storage_objects_admin_delete" ON storage.objects
      FOR DELETE USING (
        bucket_id IN ('post-images', 'report-files') AND auth.role() = 'authenticated'
      );
  END IF;
END $$;

-- ⑥ PostgREST 스키마 캐시 새로고침 (클라이언트 즉시 인식)
NOTIFY pgrst, 'reload schema';

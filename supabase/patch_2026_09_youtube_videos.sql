-- ============================================================
-- CordiaEC 유튜브 영상 쇼케이스 (2026년 9월 패치)
-- 1. youtube_videos 테이블 생성 + RLS 정책
-- 2. 초기 대표 영상 시드 데이터 등록
-- ============================================================

CREATE TABLE IF NOT EXISTS youtube_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_url TEXT NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  title_ko TEXT,
  summary TEXT,
  summary_ko TEXT,
  published_date DATE NOT NULL DEFAULT CURRENT_DATE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;

-- 비로그인 유저는 읽기(SELECT)만 허용
CREATE POLICY "youtube_videos_public_read" ON youtube_videos FOR SELECT USING (true);

-- 인증된 관리자는 전체 권한
CREATE POLICY "youtube_videos_admin_write" ON youtube_videos FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 초기 대표 영상 시드 (인하 K-학술확산연구센터 및 글로벌 코리안 디아스포라 관련)
INSERT INTO youtube_videos (youtube_url, video_id, title, title_ko, summary, summary_ko, published_date, display_order, is_active)
VALUES
  (
    'https://www.youtube.com/watch?v=7bA0gX_Qy9M',
    '7bA0gX_Qy9M',
    'Global Korean Diaspora Network: Connecting Past, Present, and Future',
    '글로벌 한인 디아스포라 네트워크: 과거와 현재, 미래를 잇다',
    'Exploring the vibrant history and global potential of Korean communities worldwide, from Central Asia to the Americas.',
    '중앙아시아부터 미주까지, 전 세계 한인 공동체의 역동적인 역사와 글로벌 지식 네트워크로서의 미래 잠재력을 조망합니다.',
    CURRENT_DATE,
    1,
    true
  ),
  (
    'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    'kJQP7kiw5Fk',
    'K-Economy & Global Supply Chains in the Age of AI',
    'AI 대전환 시대, K-이코노미와 글로벌 공급망의 전략적 재편',
    'In-depth analysis of semiconductor, bio, and cultural industries through the lens of international diaspora partnerships.',
    '반도체, 바이오, K-컬처 산업의 글로벌 진출과 재외 한인 비즈니스 네트워크 간의 시너지 전략을 심층 분석합니다.',
    CURRENT_DATE - INTERVAL '3 days',
    2,
    true
  ),
  (
    'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    'fJ9rUzIMcZQ',
    'Diaspora Identity and Next-Generation Leadership',
    '차세대 재외동포 리더십과 문화적 정체성',
    'Empowering the next generation of global Koreans to lead across cultural, academic, and business landscapes.',
    '글로벌 사회를 이끌어갈 차세대 한인 리더들의 정체성 확립과 모국과의 상생 협력 방안을 논의합니다.',
    CURRENT_DATE - INTERVAL '7 days',
    3,
    true
  )
ON CONFLICT DO NOTHING;

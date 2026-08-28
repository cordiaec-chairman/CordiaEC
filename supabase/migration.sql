-- ============================================================
-- CordiaEC Database Migration
-- Run this once in Supabase Dashboard > SQL Editor
-- ============================================================

-- 기존 테이블 정리 (처음에만 필요)
DROP TABLE IF EXISTS initiatives CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;

-- ① 이니셔티브 (6개 고정, 내용만 수정 가능)
CREATE TABLE initiatives (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  label       TEXT NOT NULL,
  category    TEXT NOT NULL,
  description TEXT NOT NULL,
  content     TEXT NOT NULL,
  image_url   TEXT,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- ② 게시글 (뉴스 + K-Diaspora + 산업분석 보고서)
CREATE TABLE posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board            TEXT NOT NULL CHECK (board IN ('news', 'diaspora', 'reports')),
  title            TEXT NOT NULL,
  excerpt          TEXT NOT NULL,
  content          TEXT NOT NULL,
  title_ko         TEXT,
  excerpt_ko       TEXT,
  content_ko       TEXT,
  image_url        TEXT,
  file_url         TEXT,
  file_name        TEXT,
  link_url         TEXT,
  initiative_slug  TEXT REFERENCES initiatives(slug) ON DELETE SET NULL,
  is_pinned_home   BOOLEAN NOT NULL DEFAULT false,
  published_date   TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ③ 연혁
CREATE TABLE milestones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_label  TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  description_ko TEXT,
  image_url     TEXT,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- ④ 홈/사이트 설정 (key-value)
CREATE TABLE site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ⑤ 문의
CREATE TABLE contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ⑥ 협력사/파트너 (홈 하단 롤링 배너)
CREATE TABLE partners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  logo_url      TEXT NOT NULL,
  link_url      TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS 활성화
-- ============================================================
ALTER TABLE initiatives    ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS 정책
-- ============================================================

-- initiatives: 모두 읽기 / 관리자만 쓰기
CREATE POLICY "initiatives_public_read"  ON initiatives FOR SELECT USING (true);
CREATE POLICY "initiatives_admin_write"  ON initiatives FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- posts: 모두 읽기 / 관리자만 쓰기
CREATE POLICY "posts_public_read"  ON posts FOR SELECT USING (true);
CREATE POLICY "posts_admin_write"  ON posts FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- milestones: 모두 읽기 / 관리자만 쓰기
CREATE POLICY "milestones_public_read"  ON milestones FOR SELECT USING (true);
CREATE POLICY "milestones_admin_write"  ON milestones FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- site_settings: 모두 읽기 / 관리자만 쓰기
CREATE POLICY "site_settings_public_read"  ON site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings_admin_write"  ON site_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- contacts: 비로그인은 INSERT만 / 읽기·삭제는 관리자만
CREATE POLICY "contacts_public_insert"  ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "contacts_admin_read"     ON contacts FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "contacts_admin_delete"   ON contacts FOR DELETE
  USING (auth.role() = 'authenticated');

-- partners: 모두 읽기(활성 상태만) / 관리자만 쓰기
CREATE POLICY "partners_public_read"  ON partners FOR SELECT USING (is_active = true);
CREATE POLICY "partners_admin_all"    ON partners FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- Storage 버킷 (이미지 & 보고서 PDF)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('post-images', 'post-images', true),
  ('report-files', 'report-files', true)
ON CONFLICT (id) DO NOTHING;

-- 버킷 정책: 모두 읽기 / 관리자만 업로드·삭제
CREATE POLICY "storage_objects_public_read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('post-images', 'report-files'));

CREATE POLICY "storage_objects_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('post-images', 'report-files') AND auth.role() = 'authenticated'
  );

CREATE POLICY "storage_objects_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('post-images', 'report-files') AND auth.role() = 'authenticated'
  );

-- ============================================================
-- 시드 데이터: 이니셔티브 6개
-- ============================================================
INSERT INTO initiatives (slug, title, title_ko, label, category, description, description_ko, content, content_ko, image_url, display_order) VALUES
(
  'research-policy',
  'Research & Policy Advisory',
  '재외한인 연구 및 정책 자문',
  'Research & Policy',
  'Research & Policy',
  'Investigating the status of global Korean communities and establishing objective data for policy-making and strategic initiatives.',
  '전 세계 한인 공동체의 실태를 조사하고, 정책 수립과 사업 추진에 필요한 객관적 데이터를 구축합니다.',
  '• Conducting research projects commissioned by government ministries and municipalities regarding overseas Koreans.
• Publishing and distributing field-based policy issue briefs.
• Establishing partnerships and joint research networks with domestic and international academic institutions.',
  '• 정부 부처 및 지자체의 재외동포 관련 연구용역 수행
• 현장 기반의 정책 보고서(Issue Brief) 발간 및 배포
• 국내외 학술 기관과의 파트너십 구축 및 공동 연구',
  'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
  1
),
(
  'business-trade',
  'Global Trade & Distribution',
  '글로벌 무역 및 유통 지원',
  'Business & Trade',
  'Business & Trade',
  'Connecting domestic producers with overseas Korean businesses to provide secure and efficient logistics and distribution networks.',
  '국내 생산자와 해외 한인 소상공인을 연결하여 안전하고 효율적인 물류 및 유통 경로를 제공합니다.',
  '• Operating product distribution and group purchasing platforms for overseas Korean businesses.
• Practical trade consulting on customs clearance, logistics, and local regulations.
• Facilitating B2B matching and collaborative projects between domestic SMEs and overseas Korean enterprises.',
  '• 해외 한인 비즈니스를 위한 상품 유통 및 공동 구매 플랫폼 운영
• 통관 서류, 배송, 현지 규제 등에 관한 무역 실무 컨설팅
• 국내외 중소기업과 한인 기업 간의 B2B 매칭 및 연계 사업',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
  2
),
(
  'culture-heritage',
  'Korean Cultural Archiving & Exchange',
  '한인 문화 아카이빙 및 교류',
  'Culture & Heritage',
  'Culture & Heritage',
  'Digitizing and preserving Korean cultural assets, and running programs to foster mutual understanding across generations and regions.',
  '한인 문화 자산을 디지털화하여 보존하고, 세대와 지역을 넘어 상호 이해를 돕는 프로그램을 운영합니다.',
  '• Building digital archives for traditional and contemporary Korean diaspora cultural assets.
• Providing interactive online and offline Korean culture education and experiential content.
• Planning regular cultural exchange events and academic seminars.',
  '• 전통 및 현대 한인 문화 자료의 디지털 아카이브 구축
• 온·오프라인 플랫폼을 활용한 비대면 한국 문화 교육 및 체험 콘텐츠 제공
• 정기적인 문화 교류 행사 및 소규모 세미나 기획',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
  3
),
(
  'next-generation',
  'Next-Generation Talent & Leadership',
  '차세대 인재 양성 및 리더십',
  'Next-Gen Leadership',
  'Next-Generation',
  'Empowering next-generation overseas Korean youth with global capabilities and opportunities to connect with their homeland.',
  '차세대 재외동포 청소년과 청년들이 글로벌 역량을 갖추고 모국과 연결될 수 있도록 교육 기회를 제공합니다.',
  '• Running homeland study visits and cultural immersion programs for overseas Korean youth.
• Connecting youth internships through partnerships with universities, NGOs, and global enterprises.
• Operating online and offline leadership development curricula for global network building.',
  '• 재외동포 청소년 대상의 고국 연수 및 문화 체험 프로그램 운영
• 국내외 대학, NGO, 기업 등과의 파트너십을 통한 청년 인턴십 연계
• 글로벌 리더십 및 네트워크 형성을 위한 온·오프라인 교육 과정 운영',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  4
),
(
  'media-storytelling',
  'Media & Storytelling Production',
  '미디어 콘텐츠 기획 및 제작',
  'Media & Content',
  'Media & Storytelling',
  'Documenting the lives and knowledge of overseas Koreans, producing accessible media content that resonates with the public.',
  '재외한인의 삶과 지식을 기록하고, 대중이 쉽게 공감할 수 있는 형태의 미디어 콘텐츠를 생산합니다.',
  '• Producing interview projects and dialogue videos highlighting the experiences of prominent diaspora leaders.
• Enhancing public accessibility via short-form media branding and multilingual subtitles.
• Publishing regular booklets and card news based on community records and meeting archives.',
  '• 재외한인 명사들의 경험을 기록하는 인터뷰 프로젝트 및 대담 영상 제작
• 숏폼, 자막 다국어화 등 대중적 접근성을 높인 미디어 브랜딩
• 정기 모임 기록에 기반한 정기간행물(북릿) 및 카드뉴스 발행',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
  5
),
(
  'solidarity-wellbeing',
  'Global Korean Solidarity & Wellbeing',
  '지구촌 한인 상생 및 권익 증진',
  'Solidarity & Wellbeing',
  'Solidarity & Wellbeing',
  'Fostering a mutual solidarity network to support the livelihood and protect the rights of global Korean diaspora communities.',
  '조합원 및 전 세계 한인 디아스포라의 생활 안정을 돕고, 상호 권익을 보호하기 위한 연대망을 형성합니다.',
  '• Providing practical advisory and guides for settlement, legal, and taxation matters for overseas Koreans.
• Operating domestic and international welfare support projects for vulnerable diaspora members and immigrants.
• Creating a mutual growth ecosystem through regular diaspora roundtables and networking assemblies.',
  '• 정착, 법률, 세무 등 재외동포의 실질적 어려움을 해소하는 자문 및 가이드 제공
• 취약 계층 동포 및 이주민을 위한 국내외 복지 지원 사업 운영
• 국내외 재외한인 간담회 및 네트워크 행사를 통한 상생 생태계 조성',
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
  6
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  title_ko = EXCLUDED.title_ko,
  label = EXCLUDED.label,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  description_ko = EXCLUDED.description_ko,
  content = EXCLUDED.content,
  content_ko = EXCLUDED.content_ko,
  image_url = EXCLUDED.image_url,
  display_order = EXCLUDED.display_order;

-- ============================================================
-- 시드 데이터: 연혁 4개
-- ============================================================
INSERT INTO milestones (period_label, title, description, image_url, display_order) VALUES
(
  'Founded in 1985',
  'Founded in 1985',
  'Inha University Institute of International Relations established',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200',
  1
),
(
  'Expanded in 2022',
  'Expanded in 2022',
  'K-Academic Diffusion Research Center launched to expand academic and cultural initiatives',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200',
  2
),
(
  'New beginning in 2025',
  'New beginning in 2025',
  'Cordia founded as a global hub, connecting expertise in Korean Studies with business and cultural opportunities',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200',
  3
),
(
  'Today & Beyond',
  'Today & Beyond',
  'Growing into a trusted platform for global networks and cross-border collaboration',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200',
  4
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 시드 데이터: 홈 기본 설정 및 SNS
-- ============================================================
INSERT INTO site_settings (key, value) VALUES
  ('home_board_title', 'Latest News'),
  ('home_board_count', '3'),
  ('sns_youtube', 'https://youtube.com'),
  ('sns_instagram', 'https://instagram.com'),
  ('sns_x', 'https://x.com')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 시드 데이터: 협력사 샘플
-- ============================================================
INSERT INTO partners (name, logo_url, link_url, display_order, is_active) VALUES
  ('Inha University', 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=60', 'https://inha.ac.kr', 1, true),
  ('K-Academic Diffusion Research Center', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=60', 'https://k-road.kr', 2, true),
  ('Center for International Studies', 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=300&auto=format&fit=crop&q=60', 'https://inhacis.inha.ac.kr', 3, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 시드 데이터: 히어로 슬라이드
-- ============================================================
INSERT INTO hero_slides (id, headline, headline_ko, sub_lines, sub_lines_ko, image_url, display_order, is_active) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Bridging Korean Heritage with Global Opportunities',
  '한국의 학술·문화 자산과 글로벌 비즈니스를 잇다',
  'Connecting Korean expertise and diaspora leadership to the world.
Fostering research, education, and sustainable economic exchange.',
  '전 세계 한인 디아스포라와 모국을 연결하는 글로벌 허브
연구·정책 자문부터 무역, 문화 아카이빙, 차세대 리더십까지',
  'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1800&q=80',
  1,
  true
),
(
  '00000000-0000-0000-0000-000000000002',
  'Global Knowledge & Diaspora Network',
  '글로벌 한인 네트워크와 지식 생태계 구축',
  'Empowering next-generation innovators and overseas Korean leaders.
Collaborating with domestic and international partners for shared growth.',
  '차세대 글로벌 인재 양성과 해외 한인 소상공인 무역 지원
지구촌 한인 상생과 권익 증진을 위한 든든한 연대망',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1800&q=80',
  2,
  true
),
(
  '00000000-0000-0000-0000-000000000003',
  'Preserving Culture, Inspiring Innovation',
  '문화의 디지털 보존과 미디어 콘텐츠 창출',
  'Digitizing diaspora heritage and producing resonant media storytelling.
Advancing scholarly depth and commercial value together.',
  '한인 문화 자산의 디지털 아카이빙과 대중적 미디어 브랜딩
학술적 깊이와 실질적 비즈니스 가치의 조화로운 성장',
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1800&q=80',
  3,
  true
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 시드 데이터: 샘플 게시글 (뉴스, 산업분석 보고서, K-디아스포라)
-- ============================================================
INSERT INTO posts (id, board, title, title_ko, excerpt, excerpt_ko, content, content_ko, image_url, file_url, file_name, initiative_slug, is_pinned_home, published_date) VALUES
(
  '10000000-0000-0000-0000-000000000001',
  'news',
  'CordiaEC Signs Strategic MOU with North American Korean Business Association',
  'CordiaEC, 북미 한인경제인협회와 글로벌 공급망 구축을 위한 전략적 파트너십(MOU) 체결',
  'Establishing direct trade channels and B2B export-import collaboration between domestic SMEs and overseas Korean enterprises.',
  '재외한인 소상공인과 국내 유망 중소기업 간의 직거래 유통망 개척 및 B2B 수출입 지원 협력을 본격화합니다.',
  'CordiaEC has officially signed a Memorandum of Understanding (MOU) with the North American Korean Business Association to build a resilient global logistics and B2B trade infrastructure.',
  'CordiaEC가 북미 한인경제인협회와 업무협약(MOU)을 체결하고 국내외 중소기업과 해외 한인 비즈니스를 잇는 글로벌 무역 지원 플랫폼 운영에 돌입합니다.',
  'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
  null,
  null,
  'business-trade',
  true,
  '2025-02-15 09:00:00+00'
),
(
  '10000000-0000-0000-0000-000000000002',
  'news',
  '2025 Global Korean Youth Leadership Forum Concludes with Policy Recommendations',
  '2025년 상반기 재외한인 차세대 리더십 포럼 성료 및 정책 제언집 발간',
  'Over 40 next-generation diaspora youth leaders from 12 countries convened to discuss academic and cultural ties with Korea.',
  '12개국 40여 명의 차세대 디아스포라 청년 리더들이 모여 모국과의 학술·문화 연계 강화 방안을 논의했습니다.',
  'The 2025 Next-Gen Leadership Forum successfully concluded its 3-day intensive workshop series, presenting collaborative action plans for diaspora engagement.',
  '3일간 진행된 차세대 글로벌 리더십 워크숍을 통해 청년 인턴십 연계 및 글로벌 네트워크 구축을 위한 실질적 실행 과제가 도출되었습니다.',
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
  null,
  null,
  'next-generation',
  false,
  '2025-01-28 14:00:00+00'
),
(
  '10000000-0000-0000-0000-000000000003',
  'news',
  'CordiaEC Launches Beta Version of Digital Diaspora Archive ''K-Heritage Net''',
  '한국 문화자산 디지털 아카이브 ‘K-Heritage Net’ 베타 서비스 오픈',
  'Digitizing and preserving the migration history and cultural records of the global Korean diaspora for public access.',
  '전 세계 한인 디아스포라의 이주 역사와 문화적 기록을 디지털로 체계화하여 누구나 열람할 수 있도록 지원합니다.',
  'Our newly developed digital repository provides interactive access to thousands of diaspora community documents and audio-visual assets.',
  '디지털 아카이브 플랫폼을 통해 역사적 사료 및 이주민 구술 기록을 체계적으로 보존하고 대중에게 개방합니다.',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  null,
  null,
  'culture-heritage',
  false,
  '2025-01-10 11:00:00+00'
),
(
  '20000000-0000-0000-0000-000000000001',
  'reports',
  '2025 North American K-Consumer Goods Trends & Diaspora Distribution Strategies',
  '2025 북미 K-소비재 유통 트렌드 및 한인 유통망 활용 전략',
  'Strategic market entry analysis for Korean premium consumer goods leveraging local diaspora logistics networks.',
  '북미 주요 대도시의 한인 유통 네트워크를 활용한 국내 프리미엄 식품 및 소비재 시장 진출 전략 분석',
  'This report provides comprehensive market intelligence on North American retail channels, consumer preferences, and collaborative distribution models with Korean diaspora business owners.',
  '본 보고서는 북미 주요 유통 채널 현황과 한인 상권을 연계한 고효율 물류 유통 모델을 심층 분석하여 국내 기업의 해외 진출 실무 가이드를 제시합니다.',
  'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=800&q=80',
  'https://example.com/reports/2025_north_america_k_goods_report.pdf',
  '2025_North_America_K_Goods_Report.pdf',
  'business-trade',
  true,
  '2025-02-20 10:00:00+00'
),
(
  '20000000-0000-0000-0000-000000000002',
  'reports',
  'Southeast Asian Diaspora Policy Trends and Global Talent Acquisition Study',
  '동남아 주요국 재외동포 정책 동향과 글로벌 인재 유치 방안 연구',
  'Examining talent empowerment policies and internship networks for Korean diaspora youth across ASEAN hubs.',
  '베트남, 인도네시아 등 신흥 아세안 거점 한인 청년 인재들의 역량 강화 및 국내 기업 연계 인턴십 정책 분석',
  'An empirical study on policy frameworks supporting Korean diaspora professionals in Southeast Asia, highlighting government-academic cooperation.',
  '동남아 주요 거점 국가들의 동포 정책 변화와 한인 청년 인재들의 취·창업 생태계 활성화 방안을 조사 분석한 정책 보고서입니다.',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
  'https://example.com/reports/asean_diaspora_policy_2025.pdf',
  'ASEAN_Diaspora_Policy_Study_2025.pdf',
  'research-policy',
  false,
  '2025-02-05 09:30:00+00'
),
(
  '20000000-0000-0000-0000-000000000003',
  'reports',
  'Commercialization and Global Branding Strategies for Korean Cultural Assets',
  '글로벌 K-컬처 확산에 따른 한인 문화자산 상업화 및 브랜딩 전략',
  'Building a sustainable cultural industry ecosystem through short-form storytelling and digital media translation.',
  '전통 문화 콘텐츠의 숏폼 및 디지털 미디어 전환을 통한 지속 가능한 문화 산업 생태계 구축 방안',
  'Analyzing modern digital adaptation of Korean cultural assets, multimedia IP monetization, and cross-border audience engagement.',
  '디지털 미디어와 결합한 한인 문화 자산의 브랜딩 전략과 글로벌 미디어 시장에서의 부가가치 창출 방안을 분석합니다.',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
  'https://example.com/reports/k_culture_branding_2025.pdf',
  'K_Culture_Branding_Strategy_2025.pdf',
  'media-storytelling',
  false,
  '2025-01-15 15:00:00+00'
)
ON CONFLICT (id) DO NOTHING;

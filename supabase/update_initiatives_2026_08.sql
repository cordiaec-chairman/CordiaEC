-- ============================================================
-- CordiaEC 6대 공식 이니셔티브 DB 갱신 마이그레이션 (2026-08)
-- 
-- 적용 대상: Supabase 대시보드 > SQL Editor
-- 목적: 6월 초기 템플릿 구형 데이터(K-Food, K-Beauty 등)를 
--       최신 6대 공식 이니셔티브(국문/영문 완비)로 갱신
-- ============================================================

-- 1. 기존 구형 이니셔티브를 참조하던 게시글의 FK 안전 해제
UPDATE posts 
SET initiative_slug = NULL 
WHERE initiative_slug NOT IN (
  'research-policy', 'business-trade', 'culture-heritage', 
  'next-generation', 'media-storytelling', 'solidarity-wellbeing'
);

-- 2. 구형 모의 이니셔티브 삭제
DELETE FROM initiatives 
WHERE slug NOT IN (
  'research-policy', 'business-trade', 'culture-heritage', 
  'next-generation', 'media-storytelling', 'solidarity-wellbeing'
);

-- 3. 최신 6대 공식 이니셔티브 등록 및 갱신 (ON CONFLICT 구문으로 멱등성 보장)
INSERT INTO initiatives (slug, title, title_ko, label, category, description, description_ko, content, content_ko, image_url, display_order)
VALUES
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
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
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
  'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80',
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

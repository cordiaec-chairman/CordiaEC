-- ============================================================
-- CordiaEC 고객 요청 반영 증분 패치 (2026년 9월)
-- 1. 첫 화면 메인 히어로 슬라이드(HeroCarousel) 헤드라인 및 서브라인 수정
-- 2. 6대 핵심 전략 플랫폼 (Initiatives) 명칭 및 내용 전면 개편
-- ============================================================

-- 1. hero_slides 다국어 컬럼 안전 추가 (이미 존재 시 무시)
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS headline_ko TEXT;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS sub_lines_ko TEXT;

-- 2. 메인 히어로 첫 번째 슬라이드 업데이트
UPDATE hero_slides
SET
  headline = 'Connecting Knowledge, People and Policy for the Future of Global Koreans',
  headline_ko = '지구촌 한인의 미래를 위해 지식, 사람, 정책을 잇다',
  sub_lines = E'Cordia links knowledge, people, and opportunities for those seeking a deeper understanding of Korea.\nWe do not simply report events; we discover meaning, connect people, and shape the future.\nOur mission is to bridge local expertise with international networks across culture, business, and education.',
  sub_lines_ko = E'Cordia는 한국을 더 깊이 이해하고자 하는 이들을 위해 지식, 사람, 기회를 연결합니다.\n우리는 단순한 사건 전달을 넘어, 의미를 발견하고 사람을 잇고 미래를 만들어갑니다.\n우리의 사명은 문화, 비즈니스, 교육 전반에 걸쳐 현장의 전문성과 글로벌 네트워크를 연결하는 것입니다.'
WHERE display_order = 1 OR id = (SELECT id FROM hero_slides ORDER BY display_order ASC LIMIT 1);

-- 3. 6대 전략 플랫폼 (Initiatives) 업데이트 (기존 slug 유지로 링크 및 데이터 무결성 보장)
-- 첫째: 글로벌 코리안 연결 (기존 research-policy)
UPDATE initiatives
SET
  title = 'Global Korean Connection',
  title_ko = '글로벌 코리안 연결',
  label = 'Network & Diaspora',
  category = 'Global Network',
  description = 'Overseas Koreans and the diaspora are no longer subjects of support, but a vibrant force connecting global knowledge and experience with the global Korean network.',
  description_ko = '재외동포와 디아스포라는 더 이상 지원 대상이 아니라 세계적 지식과 경험을 글로벌 한인 네트워크와 연결한다.',
  content = '• Overseas Koreans and the diaspora are no longer subjects of support, but a vibrant force connecting global knowledge and experience with the global Korean network.
• Building dynamic networks connecting diaspora communities worldwide.
• Facilitating cross-border knowledge exchange and collaborative field projects.',
  content_ko = '• 재외동포와 디아스포라는 더 이상 지원 대상이 아니라 세계적 지식과 경험을 글로벌 한인 네트워크와 연결합니다.
• 전 세계 디아스포라 한인 공동체를 유기적으로 연결하는 동적 네트워크 구축
• 국경을 넘나드는 지식 교류 및 현장 기반의 공동 프로젝트 추진',
  display_order = 1
WHERE slug = 'research-policy';

-- 둘째: K-Economy와 글로벌 한인 교차 (기존 business-trade)
UPDATE initiatives
SET
  title = 'K-Economy & Global Koreans',
  title_ko = 'K-Economy와 글로벌 한인 교차',
  label = 'Economy & Industry',
  category = 'K-Economy',
  description = 'Analyzing and interpreting the intersections between the Korean economy and global Koreans, including AI, semiconductors, supply chains, K-food, and K-beauty.',
  description_ko = 'AI, 반도체, 공급망, K-푸드, K-뷰티 등 한국경제와 글로벌 한인과의 접점을 분석하고 해석한다.',
  content = '• Analyzing and interpreting the intersections between the Korean economy and global Koreans, including AI, semiconductors, supply chains, K-food, and K-beauty.
• Strategic consulting and B2B matching for Korean businesses expanding globally.
• In-depth market intelligence on cross-border supply chains and emerging economic trends.',
  content_ko = '• AI, 반도체, 공급망, K-푸드, K-뷰티 등 한국경제와 글로벌 한인과의 접점을 심층 분석하고 해석합니다.
• 글로벌 진출을 추진하는 한인 기업 및 국내 유망 기업을 위한 전략 컨설팅 및 B2B 매칭
• 글로벌 공급망 재편 및 신흥 경제 트렌드에 대한 실천적 시장 인텔리전스 제공',
  display_order = 2
WHERE slug = 'business-trade';

-- 셋째: K-Culture & Life (기존 culture-heritage)
UPDATE initiatives
SET
  title = 'K-Culture & Life',
  title_ko = 'K-Culture & Life',
  label = 'Culture & Ecosystem',
  category = 'K-Culture',
  description = 'Culture is not merely an object of consumption but the core of national competitiveness; interpreting food, wine, cities, travel, and history as a unified K-Culture ecosystem.',
  description_ko = '문화는 소비 대상이 아니라 국가 경쟁력의 핵심이며, 음식, 와인, 도시, 여행, 역사 등을 하나의 K 문화 생태계로 해석한다.',
  content = '• Culture is not merely an object of consumption but the core of national competitiveness; interpreting food, wine, cities, travel, and history as a unified K-Culture ecosystem.
• Digital archiving of Korean cultural heritage and contemporary diaspora lifestyle assets.
• Global cultural exchange programs connecting generations and regions.',
  content_ko = '• 문화는 소비 대상이 아니라 국가 경쟁력의 핵심이며, 음식, 와인, 도시, 여행, 역사 등을 하나의 K 문화 생태계로 해석합니다.
• 한국의 문화 유산 및 현대 디아스포라의 라이프스타일 자산 디지털 아카이빙
• 세대와 지역을 아우르는 글로벌 문화 교류 및 체험 프로그램 기획·운영',
  display_order = 3
WHERE slug = 'culture-heritage';

-- 넷째: Policy & Geopolitics (기존 media-storytelling)
UPDATE initiatives
SET
  title = 'Policy & Geopolitics',
  title_ko = 'Policy & Geopolitics',
  label = 'Policy & Strategy',
  category = 'Geopolitics',
  description = 'International politics is not a commentary on events but a lens for reading the future; strategically examining global regions including Northeast Asia, the US, and China.',
  description_ko = '국제 정치는 사건 해설이 아니라 미래를 읽는 프레임이며, 동북아를 비롯 미국과 중국은 물론 글로벌 지역을 전략적으로 조망한다.',
  content = '• International politics is not a commentary on events but a lens for reading the future; strategically examining global regions including Northeast Asia, the US, and China.
• Strategic policy analysis and foresight briefs on global geopolitical shifts.
• High-level dialogues and expert forums on international relations affecting global Koreans.',
  content_ko = '• 국제 정치는 단순한 사건 해설이 아니라 미래를 읽는 프레임이며, 동북아를 비롯 미국과 중국은 물론 글로벌 지역을 전략적으로 조망합니다.
• 글로벌 지정학적 변화와 통상 환경에 관한 전략 정책 분석 및 미래 전망 보고서 발간
• 재외한인 사회와 모국에 영향을 미치는 국제 관계 이슈에 관한 전문가 포럼 및 정책 제언',
  display_order = 4
WHERE slug = 'media-storytelling';

-- 다섯째: Expert Network (기존 solidarity-wellbeing)
UPDATE initiatives
SET
  title = 'Expert Network',
  title_ko = 'Expert Network',
  label = 'Knowledge & People',
  category = 'Expert Network',
  description = 'A platform where people themselves become content, building a sustainable global Korean knowledge ecosystem through expert DBs, interviews, joint columns, and projects.',
  description_ko = '사람 자체가 콘텐츠가 되는 플랫폼으로 전문가 DB, 인터뷰, 공동 칼럼, 프로젝트를 통해 지속 가능한 글로벌 한인 지식 생태계를 구축한다.',
  content = '• A platform where people themselves become content, building a sustainable global Korean knowledge ecosystem through expert DBs, interviews, joint columns, and projects.
• Global Korean expert database and talent directory across key industries.
• Co-authored columns, deep-dive interviews, and collaborative research initiatives.',
  content_ko = '• 사람 자체가 콘텐츠가 되는 플랫폼으로 전문가 DB, 인터뷰, 공동 칼럼, 프로젝트를 통해 지속 가능한 글로벌 한인 지식 생태계를 구축합니다.
• 주요 학술·산업·정책 분야의 글로벌 한인 전문가 디렉토리 및 인재 풀 구축
• 전문가 심층 인터뷰, 공동 기고, 다국적 협업 프로젝트 발굴 및 운영',
  display_order = 5
WHERE slug = 'solidarity-wellbeing';

-- 여섯째: 차세대 글로벌 한인 인재 양성 및 리더쉽 (기존 next-generation)
UPDATE initiatives
SET
  title = 'Next-Gen Global Korean Talent & Leadership',
  title_ko = '차세대 글로벌 한인 인재 양성 및 리더십',
  label = 'Next-Gen Leadership',
  category = 'Next-Generation',
  description = 'Empowering next-generation global Korean youth with leadership, cultural identity, and networks to bridge their homeland and host societies.',
  description_ko = '글로벌 역량과 정체성을 겸비한 차세대 한인 리더를 육성하고, 모국과 거주국을 잇는 미래 지식 네트워크의 주역으로 지원합니다.',
  content = '• Empowering next-generation global Korean youth with leadership, cultural identity, and networks to bridge their homeland and host societies.
• Youth leadership camps, homeland immersion programs, and mentorship networks.
• Fostering future diaspora innovators and global civic leaders.',
  content_ko = '• 글로벌 역량과 정체성을 겸비한 차세대 한인 리더를 육성하고, 모국과 거주국을 잇는 미래 지식 네트워크의 주역으로 지원합니다.
• 차세대 재외동포 청소년·청년을 위한 글로벌 리더십 포럼 및 모국 연수 프로그램 운영
• 글로벌 기업·기관과의 멘토링 연계를 통한 차세대 혁신가 양성',
  display_order = 6
WHERE slug = 'next-generation';

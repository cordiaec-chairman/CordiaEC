import { supabase, isSupabaseConfigured } from "./supabase";
import type { Initiative, Post, Milestone, Contact, HeroSlide, Popup, Partner } from "./database.types";

export const DEFAULT_INITIATIVES: Initiative[] = [
  {
    slug: "research-policy",
    label: "Research & Policy",
    category: "Research & Policy",
    title: "Research & Policy Advisory",
    title_ko: "재외한인 연구 및 정책 자문",
    description: "Investigating the status of global Korean communities and establishing objective data for policy-making and strategic initiatives.",
    description_ko: "전 세계 한인 공동체의 실태를 조사하고, 정책 수립과 사업 추진에 필요한 객관적 데이터를 구축합니다.",
    image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    display_order: 1,
    content: "• Conducting research projects commissioned by government ministries and municipalities regarding overseas Koreans.\n• Publishing and distributing field-based policy issue briefs.\n• Establishing partnerships and joint research networks with domestic and international academic institutions.",
    content_ko: "• 정부 부처 및 지자체의 재외동포 관련 연구용역 수행\n• 현장 기반의 정책 보고서(Issue Brief) 발간 및 배포\n• 국내외 학술 기관과의 파트너십 구축 및 공동 연구",
  },
  {
    slug: "business-trade",
    label: "Business & Trade",
    category: "Business & Trade",
    title: "Global Trade & Distribution",
    title_ko: "글로벌 무역 및 유통 지원",
    description: "Connecting domestic producers with overseas Korean businesses to provide secure and efficient logistics and distribution networks.",
    description_ko: "국내 생산자와 해외 한인 소상공인을 연결하여 안전하고 효율적인 물류 및 유통 경로를 제공합니다.",
    image_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    display_order: 2,
    content: "• Operating product distribution and group purchasing platforms for overseas Korean businesses.\n• Practical trade consulting on customs clearance, logistics, and local regulations.\n• Facilitating B2B matching and collaborative projects between domestic SMEs and overseas Korean enterprises.",
    content_ko: "• 해외 한인 비즈니스를 위한 상품 유통 및 공동 구매 플랫폼 운영\n• 통관 서류, 배송, 현지 규제 등에 관한 무역 실무 컨설팅\n• 국내외 중소기업과 한인 기업 간의 B2B 매칭 및 연계 사업",
  },
  {
    slug: "culture-heritage",
    label: "Culture & Heritage",
    category: "Culture & Heritage",
    title: "Korean Cultural Archiving & Exchange",
    title_ko: "한인 문화 아카이빙 및 교류",
    description: "Digitizing and preserving Korean cultural assets, and running programs to foster mutual understanding across generations and regions.",
    description_ko: "한인 문화 자산을 디지털화하여 보존하고, 세대와 지역을 넘어 상호 이해를 돕는 프로그램을 운영합니다.",
    image_url: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=800&q=80",
    display_order: 3,
    content: "• Building digital archives for traditional and contemporary Korean diaspora cultural assets.\n• Providing interactive online and offline Korean culture education and experiential content.\n• Planning regular cultural exchange events and academic seminars.",
    content_ko: "• 전통 및 현대 한인 문화 자료의 디지털 아카이브 구축\n• 온·오프라인 플랫폼을 활용한 비대면 한국 문화 교육 및 체험 콘텐츠 제공\n• 정기적인 문화 교류 행사 및 소규모 세미나 기획",
  },
  {
    slug: "next-generation",
    label: "Next-Gen Leadership",
    category: "Next-Generation",
    title: "Next-Generation Talent & Leadership",
    title_ko: "차세대 인재 양성 및 리더십",
    description: "Empowering next-generation overseas Korean youth with global capabilities and opportunities to connect with their homeland.",
    description_ko: "차세대 재외동포 청소년과 청년들이 글로벌 역량을 갖추고 모국과 연결될 수 있도록 교육 기회를 제공합니다.",
    image_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    display_order: 4,
    content: "• Running homeland study visits and cultural immersion programs for overseas Korean youth.\n• Connecting youth internships through partnerships with universities, NGOs, and global enterprises.\n• Operating online and offline leadership development curricula for global network building.",
    content_ko: "• 재외동포 청소년 대상의 고국 연수 및 문화 체험 프로그램 운영\n• 국내외 대학, NGO, 기업 등과의 파트너십을 통한 청년 인턴십 연계\n• 글로벌 리더십 및 네트워크 형성을 위한 온·오프라인 교육 과정 운영",
  },
  {
    slug: "media-storytelling",
    label: "Media & Content",
    category: "Media & Storytelling",
    title: "Media & Storytelling Production",
    title_ko: "미디어 콘텐츠 기획 및 제작",
    description: "Documenting the lives and knowledge of overseas Koreans, producing accessible media content that resonates with the public.",
    description_ko: "재외한인의 삶과 지식을 기록하고, 대중이 쉽게 공감할 수 있는 형태의 미디어 콘텐츠를 생산합니다.",
    image_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    display_order: 5,
    content: "• Producing interview projects and dialogue videos highlighting the experiences of prominent diaspora leaders.\n• Enhancing public accessibility via short-form media branding and multilingual subtitles.\n• Publishing regular booklets and card news based on community records and meeting archives.",
    content_ko: "• 재외한인 명사들의 경험을 기록하는 인터뷰 프로젝트 및 대담 영상 제작\n• 숏폼, 자막 다국어화 등 대중적 접근성을 높인 미디어 브랜딩\n• 정기 모임 기록에 기반한 정기간행물(북릿) 및 카드뉴스 발행",
  },
  {
    slug: "solidarity-wellbeing",
    label: "Solidarity & Wellbeing",
    category: "Solidarity & Wellbeing",
    title: "Global Korean Solidarity & Wellbeing",
    title_ko: "지구촌 한인 상생 및 권익 증진",
    description: "Fostering a mutual solidarity network to support the livelihood and protect the rights of global Korean diaspora communities.",
    description_ko: "조합원 및 전 세계 한인 디아스포라의 생활 안정을 돕고, 상호 권익을 보호하기 위한 연대망을 형성합니다.",
    image_url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80",
    display_order: 6,
    content: "• Providing practical advisory and guides for settlement, legal, and taxation matters for overseas Koreans.\n• Operating domestic and international welfare support projects for vulnerable diaspora members and immigrants.\n• Creating a mutual growth ecosystem through regular diaspora roundtables and networking assemblies.",
    content_ko: "• 정착, 법률, 세무 등 재외동포의 실질적 어려움을 해소하는 자문 및 가이드 제공\n• 취약 계층 동포 및 이주민을 위한 국내외 복지 지원 사업 운영\n• 국내외 재외한인 간담회 및 네트워크 행사를 통한 상생 생태계 조성",
  },
];

// ============================================================
// 이니셔티브
// ============================================================
export async function getInitiatives(): Promise<Initiative[]> {
  if (!isSupabaseConfigured) return DEFAULT_INITIATIVES;
  try {
    const { data, error } = await supabase
      .from("initiatives")
      .select("*")
      .order("display_order");
    if (error || !data || data.length === 0) return DEFAULT_INITIATIVES;
    return data as Initiative[];
  } catch {
    return DEFAULT_INITIATIVES;
  }
}

export async function getInitiative(slug: string): Promise<Initiative | null> {
  if (!isSupabaseConfigured) {
    return DEFAULT_INITIATIVES.find((i) => i.slug === slug) || null;
  }
  try {
    const { data, error } = await supabase
      .from("initiatives")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) {
      return DEFAULT_INITIATIVES.find((i) => i.slug === slug) || null;
    }
    return data as Initiative | null;
  } catch {
    return DEFAULT_INITIATIVES.find((i) => i.slug === slug) || null;
  }
}

export async function updateInitiative(
  slug: string,
  updates: Partial<Omit<Initiative, "slug">>
): Promise<void> {
  const { error } = await supabase
    .from("initiatives")
    .update(updates as Record<string, unknown>)
    .eq("slug", slug);
  if (error) throw error;
}

// ============================================================
// 기본 가데이터 (뉴스, 산업분석 보고서, K-디아스포라)
// ============================================================
export const DEFAULT_POSTS: Post[] = [
  // 1. 뉴스 (News)
  {
    id: "news-1",
    board: "news",
    title: "CordiaEC Signs Strategic MOU with North American Korean Business Association",
    title_ko: "CordiaEC, 북미 한인경제인협회와 글로벌 공급망 구축을 위한 전략적 파트너십(MOU) 체결",
    excerpt: "Establishing direct trade channels and B2B export-import collaboration between domestic SMEs and overseas Korean enterprises.",
    excerpt_ko: "재외한인 소상공인과 국내 유망 중소기업 간의 직거래 유통망 개척 및 B2B 수출입 지원 협력을 본격화합니다.",
    content: "CordiaEC has officially signed a Memorandum of Understanding (MOU) with the North American Korean Business Association to build a resilient global logistics and B2B trade infrastructure.",
    content_ko: "CordiaEC가 북미 한인경제인협회와 업무협약(MOU)을 체결하고 국내외 중소기업과 해외 한인 비즈니스를 잇는 글로벌 무역 지원 플랫폼 운영에 돌입합니다.",
    image_url: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80",
    file_url: null,
    file_name: null,
    link_url: null,
    initiative_slug: "business-trade",
    is_pinned_home: true,
    published_date: "2025-02-15T09:00:00Z",
    created_at: "2025-02-15T09:00:00Z",
  },
  {
    id: "news-2",
    board: "news",
    title: "2025 Global Korean Youth Leadership Forum Concludes with Policy Recommendations",
    title_ko: "2025년 상반기 재외한인 차세대 리더십 포럼 성료 및 정책 제언집 발간",
    excerpt: "Over 40 next-generation diaspora youth leaders from 12 countries convened to discuss academic and cultural ties with Korea.",
    excerpt_ko: "12개국 40여 명의 차세대 디아스포라 청년 리더들이 모여 모국과의 학술·문화 연계 강화 방안을 논의했습니다.",
    content: "The 2025 Next-Gen Leadership Forum successfully concluded its 3-day intensive workshop series, presenting collaborative action plans for diaspora engagement.",
    content_ko: "3일간 진행된 차세대 글로벌 리더십 워크숍을 통해 청년 인턴십 연계 및 글로벌 네트워크 구축을 위한 실질적 실행 과제가 도출되었습니다.",
    image_url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
    file_url: null,
    file_name: null,
    link_url: null,
    initiative_slug: "next-generation",
    is_pinned_home: false,
    published_date: "2025-01-28T14:00:00Z",
    created_at: "2025-01-28T14:00:00Z",
  },
  {
    id: "news-3",
    board: "news",
    title: "CordiaEC Launches Beta Version of Digital Diaspora Archive 'K-Heritage Net'",
    title_ko: "한국 문화자산 디지털 아카이브 ‘K-Heritage Net’ 베타 서비스 오픈",
    excerpt: "Digitizing and preserving the migration history and cultural records of the global Korean diaspora for public access.",
    excerpt_ko: "전 세계 한인 디아스포라의 이주 역사와 문화적 기록을 디지털로 체계화하여 누구나 열람할 수 있도록 지원합니다.",
    content: "Our newly developed digital repository provides interactive access to thousands of diaspora community documents and audio-visual assets.",
    content_ko: "디지털 아카이브 플랫폼을 통해 역사적 사료 및 이주민 구술 기록을 체계적으로 보존하고 대중에게 개방합니다.",
    image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    file_url: null,
    file_name: null,
    link_url: null,
    initiative_slug: "culture-heritage",
    is_pinned_home: false,
    published_date: "2025-01-10T11:00:00Z",
    created_at: "2025-01-10T11:00:00Z",
  },

  // 2. 산업분석 보고서 (Reports)
  {
    id: "report-1",
    board: "reports",
    title: "2025 North American K-Consumer Goods Trends & Diaspora Distribution Strategies",
    title_ko: "2025 북미 K-소비재 유통 트렌드 및 한인 유통망 활용 전략",
    excerpt: "Strategic market entry analysis for Korean premium consumer goods leveraging local diaspora logistics networks.",
    excerpt_ko: "북미 주요 대도시의 한인 유통 네트워크를 활용한 국내 프리미엄 식품 및 소비재 시장 진출 전략 분석",
    content: "This report provides comprehensive market intelligence on North American retail channels, consumer preferences, and collaborative distribution models with Korean diaspora business owners.",
    content_ko: "본 보고서는 북미 주요 유통 채널 현황과 한인 상권을 연계한 고효율 물류 유통 모델을 심층 분석하여 국내 기업의 해외 진출 실무 가이드를 제시합니다.",
    image_url: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=800&q=80",
    file_url: "https://example.com/reports/2025_north_america_k_goods_report.pdf",
    file_name: "2025_North_America_K_Goods_Report.pdf",
    link_url: null,
    initiative_slug: "business-trade",
    is_pinned_home: true,
    published_date: "2025-02-20T10:00:00Z",
    created_at: "2025-02-20T10:00:00Z",
  },
  {
    id: "report-2",
    board: "reports",
    title: "Southeast Asian Diaspora Policy Trends and Global Talent Acquisition Study",
    title_ko: "동남아 주요국 재외동포 정책 동향과 글로벌 인재 유치 방안 연구",
    excerpt: "Examining talent empowerment policies and internship networks for Korean diaspora youth across ASEAN hubs.",
    excerpt_ko: "베트남, 인도네시아 등 신흥 아세안 거점 한인 청년 인재들의 역량 강화 및 국내 기업 연계 인턴십 정책 분석",
    content: "An empirical study on policy frameworks supporting Korean diaspora professionals in Southeast Asia, highlighting government-academic cooperation.",
    content_ko: "동남아 주요 거점 국가들의 동포 정책 변화와 한인 청년 인재들의 취·창업 생태계 활성화 방안을 조사 분석한 정책 보고서입니다.",
    image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    file_url: "https://example.com/reports/asean_diaspora_policy_2025.pdf",
    file_name: "ASEAN_Diaspora_Policy_Study_2025.pdf",
    link_url: null,
    initiative_slug: "research-policy",
    is_pinned_home: false,
    published_date: "2025-02-05T09:30:00Z",
    created_at: "2025-02-05T09:30:00Z",
  },
  {
    id: "report-3",
    board: "reports",
    title: "Commercialization and Global Branding Strategies for Korean Cultural Assets",
    title_ko: "글로벌 K-컬처 확산에 따른 한인 문화자산 상업화 및 브랜딩 전략",
    excerpt: "Building a sustainable cultural industry ecosystem through short-form storytelling and digital media translation.",
    excerpt_ko: "전통 문화 콘텐츠의 숏폼 및 디지털 미디어 전환을 통한 지속 가능한 문화 산업 생태계 구축 방안",
    content: "Analyzing modern digital adaptation of Korean cultural assets, multimedia IP monetization, and cross-border audience engagement.",
    content_ko: "디지털 미디어와 결합한 한인 문화 자산의 브랜딩 전략과 글로벌 미디어 시장에서의 부가가치 창출 방안을 분석합니다.",
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    file_url: "https://example.com/reports/k_culture_branding_2025.pdf",
    file_name: "K_Culture_Branding_Strategy_2025.pdf",
    link_url: null,
    initiative_slug: "media-storytelling",
    is_pinned_home: false,
    published_date: "2025-01-15T15:00:00Z",
    created_at: "2025-01-15T15:00:00Z",
  },

  // 3. K-디아스포라 (Diaspora)
  {
    id: "diaspora-1",
    board: "diaspora",
    title: "120 Years of Korean Immigration in Hawaii: Historical Footprints and Mutual Aid",
    title_ko: "하와이 이민 120년: 초기 한인 공동체의 자조 조직과 역사적 발자취",
    excerpt: "Documenting the resilient history of early Korean immigrants in Hawaii and the founding of grassroots community organizations.",
    excerpt_ko: "하와이 초기 사탕수수 농장 이민자들의 자조 공동체 형성과 모국 독립운동 지원의 역사적 기록을 조명합니다.",
    content: "A detailed historical monograph documenting the cultural resilience and organizational history of Hawaiian Korean diaspora pioneers.",
    content_ko: "1903년 하와이 사탕수수 이민으로 시작된 초기 한인 디아스포라의 역사적 기록과 자조 연대망의 발전 과정을 아카이빙합니다.",
    image_url: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80",
    file_url: null,
    file_name: null,
    link_url: null,
    initiative_slug: "culture-heritage",
    is_pinned_home: false,
    published_date: "2025-02-18T10:00:00Z",
    created_at: "2025-02-18T10:00:00Z",
  },
  {
    id: "diaspora-2",
    board: "diaspora",
    title: "Commercial Growth and Next-Gen Leadership in Latin American Korean Communities",
    title_ko: "중남미 한인 사회의 상권 형성과 차세대 비즈니스 리더십 인터뷰",
    excerpt: "Field interviews with leading Korean-Latin entrepreneurs driving innovation in textile, manufacturing, and commerce.",
    excerpt_ko: "브라질 봉헤치로, 아르헨티나 등 중남미 한인 섬유·무역 상권의 역사와 차세대 기업가들의 혁신 사례를 소개합니다.",
    content: "Interviews and economic field records from major Latin American Korean commercial hubs.",
    content_ko: "중남미 지역 한인 상권의 발전 과정과 현지 주류 사회로 도약하는 차세대 한인 비즈니스 리더들의 현장 인터뷰입니다.",
    image_url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80",
    file_url: null,
    file_name: null,
    link_url: null,
    initiative_slug: "solidarity-wellbeing",
    is_pinned_home: false,
    published_date: "2025-02-01T11:00:00Z",
    created_at: "2025-02-01T11:00:00Z",
  },
];

// ============================================================
// 게시글 (뉴스 / K-디아스포라 / 산업분석 보고서)
// ============================================================
export async function getPosts(opts: {
  board?: "news" | "diaspora" | "reports";  // 생략하면 모든 게시판
  page?: number;
  limit?: number;
  initiativeSlug?: string;
  search?: string;
}): Promise<{ posts: Post[]; total: number }> {
  const { board, page = 1, limit = 10, initiativeSlug, search } = opts;

  if (!isSupabaseConfigured) {
    let filtered = [...DEFAULT_POSTS];
    if (board) filtered = filtered.filter((p) => p.board === board);
    if (initiativeSlug) filtered = filtered.filter((p) => p.initiative_slug === initiativeSlug);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((p) =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.title_ko && p.title_ko.toLowerCase().includes(q)) ||
        (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
        (p.excerpt_ko && p.excerpt_ko.toLowerCase().includes(q))
      );
    }
    const from = (page - 1) * limit;
    const to = from + limit;
    return { posts: filtered.slice(from, to), total: filtered.length };
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from("posts")
      .select("*", { count: "exact" })
      .order("published_date", { ascending: false })
      .range(from, to);

    if (board) query = query.eq("board", board);
    if (initiativeSlug) query = query.eq("initiative_slug", initiativeSlug);
    if (search) query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error || !data || data.length === 0) {
      let filtered = [...DEFAULT_POSTS];
      if (board) filtered = filtered.filter((p) => p.board === board);
      return { posts: filtered.slice(from, from + limit), total: filtered.length };
    }
    return { posts: (data ?? []) as Post[], total: count ?? 0 };
  } catch {
    let filtered = [...DEFAULT_POSTS];
    if (board) filtered = filtered.filter((p) => p.board === board);
    return { posts: filtered.slice(from, from + limit), total: filtered.length };
  }
}

export async function getPost(id: string): Promise<Post | null> {
  const fallback = DEFAULT_POSTS.find((p) => p.id === id) || null;
  if (!isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return fallback;
    return data as Post | null;
  } catch {
    return fallback;
  }
}

export async function getHomePosts(count: number): Promise<Post[]> {
  const fallback = DEFAULT_POSTS.filter((p) => p.board === "news").slice(0, count);
  if (!isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("board", "news")
      .order("is_pinned_home", { ascending: false })
      .order("published_date", { ascending: false })
      .limit(count);
    if (error || !data || data.length === 0) return fallback;
    return data as Post[];
  } catch {
    return fallback;
  }
}

export async function getHomeReports(count: number): Promise<Post[]> {
  const fallback = DEFAULT_POSTS.filter((p) => p.board === "reports").slice(0, count);
  if (!isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("board", "reports")
      .order("published_date", { ascending: false })
      .limit(count);
    if (error || !data || data.length === 0) return fallback;
    return data as Post[];
  } catch {
    return fallback;
  }
}

export async function createPost(
  post: Omit<Post, "id" | "created_at">
): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .insert(post as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as Post;
}

export async function updatePost(
  id: string,
  updates: Partial<Omit<Post, "id" | "created_at">>
): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .update(updates as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Post;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// 연혁
// ============================================================
export const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: "m-1",
    period_label: "2025.04.16",
    title: "2025.04.16",
    description: "Preparation of promoter and founder register and execution of rent-free office lease agreement.",
    description_ko: "발기인 및 설립동의자 명부 작성 및 사무실 무상 임대차 계약 체결",
    image_url: null,
    display_order: 1,
  },
  {
    id: "m-2",
    period_label: "2025.05.08",
    title: "2025.05.08",
    description: "Received Official Cooperative Establishment Certificate from the Mayor of Seocho-gu, Seoul (No. 2025-Seoul Seocho-352).",
    description_ko: "서울특별시 서초구청장으로부터 '지구촌한인세상꼬르디아 협동조합' 설립 신고확인증 교부 (제2025-서울서초-352호)",
    image_url: null,
    display_order: 2,
  },
  {
    id: "m-3",
    period_label: "2025.05.20",
    title: "2025.05.20",
    description: "Completed corporate registration and designated official commencement date.",
    description_ko: "법인 설립 등기 완료 및 개업연월일 지정",
    image_url: null,
    display_order: 3,
  },
  {
    id: "m-4",
    period_label: "2025.05.26",
    title: "2025.05.26",
    description: "Completed registration of corporate seal certificate at Seoul Central District Court Registry Office.",
    description_ko: "서울중앙지방법원 등기국 법인인감증명서 등록 완료",
    image_url: null,
    display_order: 4,
  },
  {
    id: "m-5",
    period_label: "2025.07.28",
    title: "2025.07.28",
    description: "Opened corporate bank account at KB Kookmin Bank and formalized administrative governance.",
    description_ko: "국민은행 사업자 통장 개설 및 본격적인 법인 행정 구조 정비",
    image_url: null,
    display_order: 5,
  },
  {
    id: "m-6",
    period_label: "2025.07.30",
    title: "2025.07.30",
    description: "Finalized name of affiliated 'Korean Diaspora Economy & Culture Research Institute (KDec)' and established initial operational roadmap.",
    description_ko: "부설 '글로벌한인경제문화연구원(KDec)' 명칭 확정 및 연구소 초기 운영 전략 수립",
    image_url: null,
    display_order: 6,
  },
  {
    id: "m-7",
    period_label: "2025.12.16",
    title: "2025.12.16",
    description: "Approved and registered as private purchaser on Public Procurement Service National E-Procurement System (KONEPS / Nara-Jangteo).",
    description_ko: "조달청 국가종합전자조달시스템(나라장터) 민간수요자 시스템 이용 승인 및 등록 완료",
    image_url: null,
    display_order: 7,
  },
];

export async function getMilestones(): Promise<Milestone[]> {
  if (!isSupabaseConfigured) return DEFAULT_MILESTONES;
  try {
    const { data, error } = await supabase
      .from("milestones")
      .select("*")
      .order("display_order");
    if (error || !data || data.length === 0) return DEFAULT_MILESTONES;
    return data as Milestone[];
  } catch {
    return DEFAULT_MILESTONES;
  }
}

export async function createMilestone(
  m: Omit<Milestone, "id">
): Promise<Milestone> {
  const { data, error } = await supabase
    .from("milestones")
    .insert(m as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as Milestone;
}

export async function updateMilestone(
  id: string,
  updates: Partial<Omit<Milestone, "id">>
): Promise<void> {
  const { error } = await supabase
    .from("milestones")
    .update(updates as Record<string, unknown>)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMilestone(id: string): Promise<void> {
  const { error } = await supabase.from("milestones").delete().eq("id", id);
  if (error) throw error;
}

export const DEFAULT_SITE_SETTINGS: Record<string, string> = {
  home_board_title: "Latest News",
  home_board_count: "3",
  sns_youtube: "https://www.youtube.com",
  sns_instagram: "https://www.instagram.com",
  sns_x: "https://x.com",
};

// ============================================================
// 사이트 설정 & SNS
// ============================================================
export async function getSiteSettings(): Promise<Record<string, string>> {
  // 로컬스토리지에 저장된 테스트 설정 로드
  const localSaved = typeof window !== "undefined" ? localStorage.getItem("cordia_site_settings") : null;
  const localObj = localSaved ? JSON.parse(localSaved) : {};

  if (!isSupabaseConfigured) {
    return { ...DEFAULT_SITE_SETTINGS, ...localObj };
  }
  try {
    const { data, error } = await supabase.from("site_settings").select("*");
    if (error || !data || data.length === 0) return { ...DEFAULT_SITE_SETTINGS, ...localObj };
    const dbSettings = Object.fromEntries(
      (data as { key: string; value: string }[]).map((r) => [r.key, r.value])
    );
    return { ...DEFAULT_SITE_SETTINGS, ...localObj, ...dbSettings };
  } catch {
    return { ...DEFAULT_SITE_SETTINGS, ...localObj };
  }
}

export async function updateSiteSetting(key: string, value: string): Promise<void> {
  // 1. 로컬스토리지에도 실시간 동기화
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem("cordia_site_settings");
    const parsed = existing ? JSON.parse(existing) : {};
    parsed[key] = value;
    localStorage.setItem("cordia_site_settings", JSON.stringify(parsed));
  }

  // 2. Supabase 연결 시 DB에 영구 저장 (upsert)
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value } as Record<string, unknown>);
    if (error) throw error;
  }
}

// ============================================================
// 문의 (DB 저장 + 이메일 알림)
// ============================================================
export async function submitContact(contact: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  // 1. 서버리스 API로 전송 시도 (DB 저장 + cordiaec@gmail.com 이메일 발송)
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });
    if (res.ok) return;
  } catch {
    // API 실패 시 아래 Supabase 직접 저장으로 fallback
  }

  // 2. Fallback: 클라이언트에서 Supabase DB에 직접 insert
  const { error } = await supabase
    .from("contacts")
    .insert(contact as Record<string, unknown>);
  if (error) throw error;
}

export async function getContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Contact[];
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// 협력사 (Partners)
// ============================================================
export async function getActivePartners(): Promise<Partner[]> {
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("is_active", true)
    .order("display_order");
  if (error) {
    console.warn("Partners table query error (fallback empty):", error);
    return [];
  }
  return (data ?? []) as Partner[];
}

export async function getAllPartners(): Promise<Partner[]> {
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .order("display_order");
  if (error) {
    console.warn("Partners table query error (fallback empty):", error);
    return [];
  }
  return (data ?? []) as Partner[];
}

export async function createPartner(partner: Omit<Partner, "id" | "created_at">): Promise<Partner> {
  const { data, error } = await supabase
    .from("partners")
    .insert(partner as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as Partner;
}

export async function updatePartner(
  id: string,
  updates: Partial<Omit<Partner, "id" | "created_at">>
): Promise<void> {
  const { error } = await supabase
    .from("partners")
    .update(updates as Record<string, unknown>)
    .eq("id", id);
  if (error) throw error;
}

export async function deletePartner(id: string): Promise<void> {
  const { error } = await supabase.from("partners").delete().eq("id", id);
  if (error) throw error;
}

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: "hero-1",
    headline: "Bridging Korean Heritage with Global Opportunities",
    headline_ko: "한국의 학술·문화 자산과 글로벌 비즈니스를 잇다",
    sub_lines: "Connecting Korean expertise and diaspora leadership to the world.\nFostering research, education, and sustainable economic exchange.",
    sub_lines_ko: "전 세계 한인 디아스포라와 모국을 연결하는 글로벌 허브\n연구·정책 자문부터 무역, 문화 아카이빙, 차세대 리더십까지",
    image_url: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1800&q=80",
    display_order: 1,
    is_active: true,
  },
  {
    id: "hero-2",
    headline: "Global Knowledge & Diaspora Network",
    headline_ko: "글로벌 한인 네트워크와 지식 생태계 구축",
    sub_lines: "Empowering next-generation innovators and overseas Korean leaders.\nCollaborating with domestic and international partners for shared growth.",
    sub_lines_ko: "차세대 글로벌 인재 양성과 해외 한인 소상공인 무역 지원\n지구촌 한인 상생과 권익 증진을 위한 든든한 연대망",
    image_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1800&q=80",
    display_order: 2,
    is_active: true,
  },
  {
    id: "hero-3",
    headline: "Preserving Culture, Inspiring Innovation",
    headline_ko: "문화의 디지털 보존과 미디어 콘텐츠 창출",
    sub_lines: "Digitizing diaspora heritage and producing resonant media storytelling.\nAdvancing scholarly depth and commercial value together.",
    sub_lines_ko: "한인 문화 자산의 디지털 아카이빙과 대중적 미디어 브랜딩\n학술적 깊이와 실질적 비즈니스 가치의 조화로운 성장",
    image_url: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1800&q=80",
    display_order: 3,
    is_active: true,
  },
];

// ============================================================
// 히어로 슬라이드
// ============================================================
export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  if (!isSupabaseConfigured) return DEFAULT_HERO_SLIDES;
  try {
    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .eq("is_active", true)
      .order("display_order");
    if (error || !data || data.length === 0) return DEFAULT_HERO_SLIDES;
    return data as HeroSlide[];
  } catch {
    return DEFAULT_HERO_SLIDES;
  }
}

export async function getAllHeroSlides(): Promise<HeroSlide[]> {
  if (!isSupabaseConfigured) return DEFAULT_HERO_SLIDES;
  try {
    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .order("display_order");
    if (error || !data || data.length === 0) return DEFAULT_HERO_SLIDES;
    return data as HeroSlide[];
  } catch {
    return DEFAULT_HERO_SLIDES;
  }
}

export async function createHeroSlide(slide: Omit<HeroSlide, "id">): Promise<HeroSlide> {
  const { data, error } = await supabase
    .from("hero_slides")
    .insert(slide as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as HeroSlide;
}

export async function updateHeroSlide(
  id: string,
  updates: Partial<Omit<HeroSlide, "id">>
): Promise<void> {
  const { error } = await supabase
    .from("hero_slides")
    .update(updates as Record<string, unknown>)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteHeroSlide(id: string): Promise<void> {
  const { error } = await supabase.from("hero_slides").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// 팝업
// ============================================================
export async function getActivePopups(): Promise<Popup[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("popups")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now);
  if (error) throw error;
  return (data ?? []) as Popup[];
}

export async function getAllPopups(): Promise<Popup[]> {
  const { data, error } = await supabase
    .from("popups")
    .select("*")
    .order("starts_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Popup[];
}

export async function createPopup(popup: Omit<Popup, "id">): Promise<Popup> {
  const { data, error } = await supabase
    .from("popups")
    .insert(popup as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as Popup;
}

export async function updatePopup(
  id: string,
  updates: Partial<Omit<Popup, "id">>
): Promise<void> {
  const { error } = await supabase
    .from("popups")
    .update(updates as Record<string, unknown>)
    .eq("id", id);
  if (error) throw error;
}

export async function deletePopup(id: string): Promise<void> {
  const { error } = await supabase.from("popups").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// DeepL 번역 (관리자 전용 — 마크다운 이미지/태그 보호)
// ============================================================
export async function translateTexts(texts: string[]): Promise<string[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("로그인이 필요합니다.");

  // 마크다운 이미지 `![alt](url)` 및 링크 `[text](url)` 태그 보호
  const placeholdersList: Array<{ token: string; original: string }[]> = [];

  const maskedTexts = texts.map((text, idx) => {
    if (!text || !text.trim()) {
      placeholdersList[idx] = [];
      return text;
    }

    const placeholders: { token: string; original: string }[] = [];
    let counter = 0;

    // 1. 이미지 마크다운 보호: ![alt](url)
    let processed = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match) => {
      const token = `__IMG_TAG_${counter++}__`;
      placeholders.push({ token, original: match });
      return token;
    });

    // 2. 링크 URL 주소 보호: [text](https://...)
    processed = processed.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (match, linkText, url) => {
      const token = `__LINK_URL_${counter++}__`;
      placeholders.push({ token, original: `](${url})` });
      return `[${linkText}${token}`;
    });

    placeholdersList[idx] = placeholders;
    return processed;
  });

  const res = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ texts: maskedTexts }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `번역 실패 (${res.status})`);
  }

  const data = await res.json();
  const rawTranslations: string[] = data.translations;

  // 번역된 텍스트에서 플레이스홀더 복원
  return rawTranslations.map((trans, idx) => {
    let unmasked = trans;
    const placeholders = placeholdersList[idx] || [];
    placeholders.forEach(({ token, original }) => {
      unmasked = unmasked.split(token).join(original);
    });
    return unmasked;
  });
}

// ============================================================
// 이미지 업로드 (Storage + WebP 압축)
// ============================================================
export async function uploadImage(file: File): Promise<string> {
  const compressed = await compressImage(file);
  const path = `${crypto.randomUUID()}.webp`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, compressed, { contentType: "image/webp", upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from("post-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteImage(url: string): Promise<void> {
  const path = url.split("/post-images/")[1];
  if (!path) return;
  await supabase.storage.from("post-images").remove([path]);
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_WIDTH = 1600;
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Image compression failed"));
        },
        "image/webp",
        0.82
      );
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

// ============================================================
// PDF 보고서 파일 업로드
// ============================================================
export async function uploadPdf(file: File): Promise<{ url: string; name: string }> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${crypto.randomUUID()}_${sanitizedName}`;

  const { error } = await supabase.storage
    .from("report-files")
    .upload(path, file, { contentType: file.type || "application/pdf", upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from("report-files").getPublicUrl(path);
  return { url: data.publicUrl, name: file.name };
}

export async function deletePdf(url: string): Promise<void> {
  const path = url.split("/report-files/")[1];
  if (!path) return;
  await supabase.storage.from("report-files").remove([path]);
}


import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "ko";

const LanguageContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("site_lang");
    return saved === "ko" || saved === "en" ? saved : "en";
  });
  const setLang = (l: Lang) => {
    localStorage.setItem("site_lang", l);
    setLangState(l);
  };
  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export const useLang = () => useContext(LanguageContext);

/** DB 콘텐츠 필드: 한국어 모드면 _ko 칼럼 우선, 없으면 영어로 폴백 */
export function pickField<T extends object>(item: T, field: string, lang: Lang): string {
  const rec = item as Record<string, unknown>;
  if (lang === "ko") {
    const ko = rec[`${field}_ko`];
    if (typeof ko === "string" && ko.trim()) return ko;
  }
  return (rec[field] as string) || "";
}

/** 고정 UI 문구 사전 */
const STRINGS: Record<string, { en: string; ko: string }> = {
  // Nav
  "nav.home": { en: "Home", ko: "홈" },
  "nav.about": { en: "About", ko: "소개" },
  "nav.initiatives": { en: "Initiatives", ko: "이니셔티브" },
  "nav.research_trends": { en: "Research & Trends", ko: "연구 & 동향" },
  "nav.reports": { en: "Industry Reports", ko: "산업분석 보고서" },
  "nav.reports_desc": { en: "In-depth global industry & policy analysis", ko: "글로벌 산업 및 정책 심층 분석 리포트" },
  "nav.diaspora": { en: "K-Diaspora", ko: "K-디아스포라" },
  "nav.diaspora_desc": { en: "Global Korean diaspora archives & field insights", ko: "전 세계 한인 사회 현황 및 아카이브" },
  "nav.news": { en: "News", ko: "뉴스" },
  "nav.contact": { en: "Contact", ko: "문의" },
  // Footer
  "footer.tagline": {
    en: "Driving global progress through innovative solutions and strategic partnerships.",
    ko: "혁신적인 솔루션과 전략적 파트너십으로 글로벌 협력을 이끌어갑니다.",
  },
  "footer.quickLinks": { en: "Quick Links", ko: "바로가기" },
  "footer.contactInfo": { en: "Contact Info", ko: "연락처" },
  // Common
  "common.viewAllNews": { en: "View All News", ko: "뉴스 전체 보기" },
  "common.viewAllReports": { en: "View All Reports", ko: "보고서 전체 보기" },
  "common.viewAllInitiatives": { en: "View All Initiatives", ko: "이니셔티브 전체 보기" },
  "common.learnMore": { en: "Learn More", ko: "자세히 보기" },
  "common.search": { en: "Search", ko: "검색" },
  "common.previous": { en: "Previous", ko: "이전" },
  "common.next": { en: "Next", ko: "다음" },
  "common.backToList": { en: "Back to List", ko: "목록으로" },
  "common.viewOriginal": { en: "View Original", ko: "원문 보기" },
  "common.downloadPdf": { en: "Download PDF", ko: "PDF 다운로드" },
  "common.notFound": { en: "Post not found.", ko: "게시글을 찾을 수 없습니다." },
  // Home
  "home.aboutTitle": { en: "About CordiaEC", ko: "CordiaEC 소개" },
  "home.aboutDesc": {
    en: "Cordia is a global hub rooted in Korean Studies, connecting knowledge and people across borders. We create trusted networks and opportunities that deepen understanding of Korea worldwide.",
    ko: "Cordia는 한국학에 뿌리를 둔 글로벌 허브로, 국경을 넘어 지식과 사람을 연결합니다. 전 세계가 한국을 더 깊이 이해할 수 있도록 신뢰할 수 있는 네트워크와 기회를 만듭니다.",
  },
  "home.feature1Title": { en: "Insightful Knowledge", ko: "통찰력 있는 지식" },
  "home.feature1Desc": { en: "Sharing trusted perspectives on Korea", ko: "한국에 대한 신뢰할 수 있는 관점 공유" },
  "home.feature2Title": { en: "Trusted Networks", ko: "신뢰의 네트워크" },
  "home.feature2Desc": {
    en: "Connecting experts, communities, and institutions",
    ko: "전문가, 커뮤니티, 기관을 연결",
  },
  "home.feature3Title": { en: "Collaborative Opportunities", ko: "협력의 기회" },
  "home.feature3Desc": { en: "Creating spaces for global partnerships", ko: "글로벌 파트너십의 장 마련" },
  "home.learnMoreAbout": { en: "Learn More About Us", ko: "더 알아보기" },
  "home.initiativesTitle": { en: "Our Initiatives", ko: "주요 이니셔티브 & 활동 영역" },
  "home.initiativesDesc": {
    en: "Cordia drives collaboration across Korean business, culture, and education. From K-Food and K-Beauty to startups and venture capital, we create trusted bridges that connect global partners and unlock new opportunities.",
    ko: "Cordia는 한국의 비즈니스·문화·교육 전반의 협력을 이끕니다. K-Food와 K-Beauty부터 스타트업, 벤처캐피털까지, 글로벌 파트너를 연결하는 신뢰의 다리를 만듭니다.",
  },
  "home.newsDesc": {
    en: "Stay updated with the latest developments, announcements, and insights from CordiaEC.",
    ko: "CordiaEC의 최신 소식과 발표, 인사이트를 확인하세요.",
  },
  "home.reportsTitle": { en: "Industry Reports", ko: "산업분석 보고서" },
  "home.reportsDesc": {
    en: "Strategic intelligence, data-driven analysis, and sector forecasts on Korean global industries.",
    ko: "한국의 주요 글로벌 산업에 대한 전략적 시장 인텔리전스와 데이터 기반 심층 분석 리포트입니다.",
  },
  "home.partnersTitle": { en: "Partners & Collaborators", ko: "주요 협력 기관 및 글로벌 파트너" },
  "home.noNews": { en: "No news yet.", ko: "아직 등록된 소식이 없습니다." },
  "home.noReports": { en: "No reports yet.", ko: "아직 등록된 보고서가 없습니다." },
  "home.ctaTitle": { en: "Ready to Get Started?", ko: "함께하실 준비가 되셨나요?" },
  "home.ctaDesc": {
    en: "Connect with our team to explore partnership opportunities and learn how CordiaEC can help drive your organization's global progress through strategic collaboration.",
    ko: "파트너십 기회를 탐색하고, CordiaEC가 전략적 협력을 통해 어떻게 글로벌 성장을 도울 수 있는지 알아보세요.",
  },
  "home.ctaButton": { en: "Contact Us", ko: "문의하기" },
  // News / Diaspora pages
  "news.heroTitle": { en: "News & Updates", ko: "뉴스 & 소식" },
  "news.heroDesc": { en: "Latest developments and insights from CordiaEC", ko: "CordiaEC의 최신 소식과 인사이트" },
  "news.searchPlaceholder": { en: "Search news...", ko: "뉴스 검색..." },
  "news.empty": { en: "No news articles found", ko: "뉴스가 없습니다" },
  "news.backToNews": { en: "News List", ko: "뉴스 목록" },
  // Reports page
  "reports.heroTitle": { en: "Industry Reports", ko: "산업분석 보고서" },
  "reports.heroDesc": {
    en: "Strategic intelligence, research briefs, and industry forecasts by CordiaEC",
    ko: "CordiaEC 전문가들이 제공하는 한국 산업 및 글로벌 시장 전략 분석 리포트",
  },
  "reports.searchPlaceholder": { en: "Search reports...", ko: "보고서 제목·내용 검색..." },
  "reports.empty": { en: "No reports found", ko: "등록된 보고서가 없습니다" },
  "reports.backToList": { en: "Reports List", ko: "보고서 목록" },
  "reports.downloadPdf": { en: "Download Full PDF", ko: "보고서 PDF 다운로드" },
  // Diaspora
  "diaspora.heroTitle": { en: "K-Diaspora Community", ko: "K-디아스포라 커뮤니티" },
  "diaspora.heroDesc": {
    en: "Stories and activities from our global Korean diaspora community",
    ko: "전 세계 한인 디아스포라 커뮤니티의 이야기와 활동",
  },
  "diaspora.searchPlaceholder": { en: "Search posts...", ko: "게시글 검색..." },
  "diaspora.empty": { en: "No posts found", ko: "게시글이 없습니다" },
  "diaspora.backToList": { en: "K-Diaspora List", ko: "K-디아스포라 목록" },
  // Initiatives
  "initiatives.title": { en: "Our Initiatives", ko: "이니셔티브" },
  "initiatives.desc": {
    en: "Discover our comprehensive programs designed to foster innovation, collaboration, and sustainable growth across diverse industries and markets.",
    ko: "다양한 산업과 시장에서 혁신·협력·지속가능한 성장을 위한 프로그램을 만나보세요.",
  },
  "initiatives.related": { en: "Related News", ko: "관련 소식" },
  "initiatives.relatedEmpty": { en: "No related news yet.", ko: "아직 등록된 소식이 없습니다." },
  "initiatives.backToList": { en: "Initiatives List", ko: "이니셔티브 목록" },
  "initiatives.applyNow": { en: "Apply Now", ko: "신청하기" },
  // About
  "about.heroTitle": { en: "About CordiaEC", ko: "CordiaEC 소개" },
  "about.heroDesc": {
    en: "Connecting knowledge and field experiences across borders to foster sustainable solidarity and shared growth for global Korean diaspora communities.",
    ko: "국경을 넘어 지식과 현장을 잇는 따뜻한 연대, 지구촌 한인 디아스포라 공동체의 지속 가능한 상생 플랫폼을 만들어갑니다.",
  },
  // 1. Founder's Message
  "about.founderBadge": { en: "Founder's Message", ko: "설립자 인사말" },
  "about.founderTitle": { en: "Founder's Message & Purpose", ko: "설립자 인사말 및 지향점" },
  "about.founderHeadline": {
    en: "Beginning a Warm Solidarity Connecting Knowledge and Field Across Borders",
    ko: "국경을 넘어 지식과 현장을 잇는 따뜻한 연대를 시작하며",
  },
  "about.founderP1": {
    en: "Over the past few years, conducting free online Korean Studies lectures with our research team and studying politics, international relations, overseas Koreans, and Korean economic and cultural networks, we reached one clear conclusion: the Korean diaspora rooted across the world is not merely human capital, but a knowledge community possessing unique cultural identity and market agility that transcends borders.",
    ko: "지난 수년간 연구팀과 함께 한국학 무료 온라인 강좌를 운영하고 정치, 국제관계, 해외 동포, 한인 경제문화를 연구해 오면서 한 가지 명확한 결론에 도달했습니다. 전 세계 각지에 뿌리내린 한인 디아스포라는 단순한 인적 자원을 넘어, 국경을 초월한 고유의 문화적 정체성과 시장 대응력을 지닌 지식 공동체라는 점입니다.",
  },
  "about.founderP2": {
    en: "However, global matching and international cooperation so far have often been limited to one-off events, or focused on surface-level gains while missing deep contextual field realities. Synthesizing field voices into an effective structure, and building a sustainable win-win ecosystem spanning from deep analysis to post-management, is the real challenge we must solve today.",
    ko: "그러나 지금까지의 글로벌 매칭과 국제 협력은 대개 일회성 행사에 그치거나, 현장의 깊이 있는 맥락을 놓친 채 표면적인 이익만을 쫓는 한계가 있었습니다. 현장의 목소리를 종합하여 효율적인 구조를 만드는 것, 그리고 단기적인 사업을 넘어 분석과 사후 관리까지 이어지는 지속 가능한 상생 생태계를 구축하는 것이 지금 우리에게 필요한 진짜 과제입니다.",
  },
  "about.founderP3": {
    en: "Accordingly, we introduced a new model that combines the public credibility and rigor of an affiliated research institute (conducting academic research and policy advisory) with the field execution power of a cooperative (driving global trade, distribution, and cultural exchange). Cordia is not simply an organization matching people. Grounded in research-driven understanding, we will steadily build bridges of solid trust toward a future-oriented global platform where individual creative achievement and collective community interests coexist.",
    ko: "이에 우리는 학술 연구와 정책 자문을 수행하는 부설 연구소의 공공적 신뢰도와, 무역 유통 및 문화교류를 직접 추진하는 협동조합의 실행력을 결합한 새로운 모델을 세상에 내놓게 되었습니다. 꼬르디아는 단순히 사람과 사람을 매칭하는 조직이 아닙니다. 연구 기반의 깊이 있는 이해를 바탕으로 단단한 신뢰의 다리를 놓고, 개인의 창의적인 성취와 공동체의 이익이 함께 공존할 수 있는 미래형 글로벌 플랫폼을 향해 묵묵히 걸어가겠습니다.",
  },
  // 2. Mission & Vision
  "about.vmBadge": { en: "Philosophy", ko: "지향 가치" },
  "about.vmTitle": { en: "Mission & Vision", ko: "미션과 비전" },
  "about.missionTitle": { en: "미션 (Mission)", ko: "미션 (Mission)" },
  "about.missionDesc": {
    en: "Based on in-depth understanding and rigorous academic research on the global Korean diaspora community, we foster substantive international cooperation and establish a sustainable win-win network.",
    ko: "재외한인 디아스포라 공동체에 대한 깊이 있는 이해와 학술적 연구를 바탕으로, 실질적인 국제 협력을 도모하고 지속 가능한 상생 네트워크를 구축합니다.",
  },
  "about.visionTitle": { en: "비전 (Vision)", ko: "비전 (Vision)" },
  "about.visionDesc": {
    en: "By organically integrating knowledge and field experience, we promote the rights and interests of global Korean communities and establish a trusted, future-oriented global platform where individuals and communities grow together.",
    ko: "지식과 현장 경험을 유기적으로 융합하여 전 세계 한인 공동체의 권익을 증진하고, 개인과 공동체가 함께 성장하는 신뢰 기반의 미래형 글로벌 플랫폼으로 자리매김합니다.",
  },
  // 3. History
  "about.historyBadge": { en: "Milestones", ko: "발자취" },
  "about.historyTitle": { en: "공식 연혁 (History)", ko: "공식 연혁 (History)" },
  "about.historySubtitle": {
    en: "Official chronicle recorded based on establishment filings and certified administrative proceedings.",
    ko: "드라이브 내 설립 신고 및 행정 서류에 기록된 실제 일정을 바탕으로 정돈된 공식 연혁입니다.",
  },
  "about.goToInitiatives": { en: "Explore Our Initiatives", ko: "주요 이니셔티브 둘러보기" },
  // Contact
  "contact.title": { en: "Contact Us", ko: "문의하기" },
  "contact.desc": {
    en: "We're here to help. Reach out to us with any questions or inquiries about our programs, partnerships, or services.",
    ko: "프로그램, 파트너십, 서비스에 대해 궁금한 점이 있으시면 언제든 문의해 주세요.",
  },
};

export function useT() {
  const { lang } = useLang();
  return (key: string): string => STRINGS[key]?.[lang] ?? key;
}

import { supabase, isSupabaseConfigured } from "./supabase";
import type { Initiative, Post, Milestone, Contact, HeroSlide, Popup, Partner } from "./database.types";

// 기본 폴백 가데이터 제거 (오직 Supabase DB의 실제 데이터만 단일 진실 공급원으로 사용)
export const DEFAULT_INITIATIVES: Initiative[] = [];

// ============================================================
// 이니셔티브
// ============================================================
export async function getInitiatives(): Promise<Initiative[]> {
  try {
    const { data, error } = await supabase
      .from("initiatives")
      .select("*")
      .order("display_order");
    if (error) {
      console.error("Initiatives query error:", error);
      return [];
    }
    return (data ?? []) as Initiative[];
  } catch (err) {
    console.error("Initiatives fetch exception:", err);
    return [];
  }
}

export async function getInitiative(slug: string): Promise<Initiative | null> {
  try {
    const { data, error } = await supabase
      .from("initiatives")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      console.error("Initiative query error:", error);
      return null;
    }
    return data as Initiative | null;
  } catch (err) {
    console.error("Initiative fetch exception:", err);
    return null;
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

// 기본 폴백 가데이터 제거 (오직 Supabase DB의 실제 데이터만 단일 진실 공급원으로 사용)
export const DEFAULT_POSTS: Post[] = [];

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
    if (search) {
      const cleanSearch = search.replace(/[,()"]/g, "").trim();
      if (cleanSearch) {
        // 영문 및 국문 제목/요약 동시 검색
        query = query.or(
          `title.ilike.%${cleanSearch}%,excerpt.ilike.%${cleanSearch}%,title_ko.ilike.%${cleanSearch}%,excerpt_ko.ilike.%${cleanSearch}%`
        );
      }
    }

    const { data, error, count } = await query;
    if (error) {
      console.error("Posts query error:", error);
      return { posts: [], total: 0 };
    }
    return { posts: (data ?? []) as Post[], total: count ?? 0 };
  } catch (err) {
    console.error("Posts fetch exception:", err);
    return { posts: [], total: 0 };
  }
}

export async function getPost(id: string): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("Post query error:", error);
      return null;
    }
    return data as Post | null;
  } catch (err) {
    console.error("Post fetch exception:", err);
    return null;
  }
}

export async function getHomePosts(count: number): Promise<Post[]> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("board", "news")
      .order("is_pinned_home", { ascending: false })
      .order("published_date", { ascending: false })
      .limit(count);
    if (error) {
      console.error("Home posts query error:", error);
      return [];
    }
    return (data ?? []) as Post[];
  } catch (err) {
    console.error("Home posts fetch exception:", err);
    return [];
  }
}

export async function getHomeReports(count: number): Promise<Post[]> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("board", "reports")
      .order("published_date", { ascending: false })
      .limit(count);
    if (error) {
      console.error("Home reports query error:", error);
      return [];
    }
    return (data ?? []) as Post[];
  } catch (err) {
    console.error("Home reports fetch exception:", err);
    return [];
  }
}

export async function createPost(
  post: Omit<Post, "id" | "created_at">
): Promise<Post> {
  const payload: Record<string, unknown> = { ...post };
  const { data, error } = await supabase
    .from("posts")
    .insert(payload)
    .select()
    .single();

  // DB에 아직 file_name/file_url 컬럼이 없는 경우 자동 컬럼 제외 재시도 (과도기 에러 방지)
  if (error && (error.message.includes("file_name") || error.message.includes("file_url"))) {
    console.warn("DB posts 테이블에 file_name 컬럼이 없어 파일 필드를 제외하고 재시도합니다.", error.message);
    delete payload.file_name;
    delete payload.file_url;
    const retry = await supabase
      .from("posts")
      .insert(payload)
      .select()
      .single();
    if (retry.error) throw retry.error;
    return retry.data as Post;
  }

  if (error) throw error;
  return data as Post;
}

export async function updatePost(
  id: string,
  updates: Partial<Omit<Post, "id" | "created_at">>
): Promise<Post> {
  const payload: Record<string, unknown> = { ...updates };
  const { data, error } = await supabase
    .from("posts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error && (error.message.includes("file_name") || error.message.includes("file_url"))) {
    console.warn("DB posts 테이블에 file_name 컬럼이 없어 파일 필드를 제외하고 재시도합니다.", error.message);
    delete payload.file_name;
    delete payload.file_url;
    const retry = await supabase
      .from("posts")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (retry.error) throw retry.error;
    return retry.data as Post;
  }

  if (error) throw error;
  return data as Post;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

// 기본 폴백 가데이터 제거 (오직 Supabase DB의 실제 데이터만 단일 진실 공급원으로 사용)
export const DEFAULT_MILESTONES: Milestone[] = [];

// 기존 영문 데이터에 대한 기본 국문 매핑 (DB의 description_ko가 null일 때 자동 보정)
const KNOWN_MILESTONE_KO_MAP: Record<string, string> = {
  "Founded in 1985": "인하대학교 국제관계연구소 설립",
  "Expanded in 2022": "K-학술확산연구센터 출범 및 학술·문화 확산 프로젝트 본격화",
  "New beginning in 2025": "글로벌 허브 CordiaEC 설립 — 한국학 전문성과 글로벌 비즈니스·문화 가치 연결",
  "Today & Beyond": "신뢰받는 글로벌 네트워크 및 국경을 넘나드는 상생 협력 플랫폼으로 도약",
};

export async function getMilestones(): Promise<Milestone[]> {
  try {
    const { data, error } = await supabase
      .from("milestones")
      .select("*")
      .order("display_order");
    if (error) {
      console.error("Milestones query error:", error);
      return [];
    }
    const list = (data ?? []) as Milestone[];
    return list.map((m) => {
      if (!m.description_ko && KNOWN_MILESTONE_KO_MAP[m.period_label]) {
        return { ...m, description_ko: KNOWN_MILESTONE_KO_MAP[m.period_label] };
      }
      return m;
    });
  } catch (err) {
    console.error("Milestones fetch exception:", err);
    return [];
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
  let apiSuccess = false;
  let apiErrorMessage = "";

  // 1. 서버리스 API로 전송 시도 (DB 저장 + cordiaec@gmail.com 이메일 발송)
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });
    if (res.ok) {
      apiSuccess = true;
      return;
    }
    const errData = await res.json().catch(() => ({}));
    apiErrorMessage = errData.error || `HTTP ${res.status}`;
    console.warn("Contact API error, trying direct DB insert fallback:", apiErrorMessage);
  } catch (err: any) {
    console.warn("Contact API fetch error, trying direct DB insert fallback:", err);
  }

  // 2. Fallback: 클라이언트에서 Supabase DB에 직접 insert
  if (!apiSuccess) {
    const { error } = await supabase
      .from("contacts")
      .insert(contact as Record<string, unknown>);
    if (error) {
      console.error("Direct Supabase contacts insert error:", error);
      throw new Error(
        apiErrorMessage
          ? `문의 접수 실패: ${apiErrorMessage}`
          : `문의 접수에 실패했습니다 (${error.message}). 잠시 후 다시 시도해주세요.`
      );
    }
  }
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

// 기본 폴백 가데이터 제거 (오직 Supabase DB의 실제 데이터만 단일 진실 공급원으로 사용)
export const DEFAULT_HERO_SLIDES: HeroSlide[] = [];

// ============================================================
// 히어로 슬라이드
// ============================================================
export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  try {
    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .eq("is_active", true)
      .order("display_order");
    if (error) {
      console.error("Active hero slides query error:", error);
      return [];
    }
    return (data ?? []) as HeroSlide[];
  } catch (err) {
    console.error("Active hero slides fetch exception:", err);
    return [];
  }
}

export async function getAllHeroSlides(): Promise<HeroSlide[]> {
  try {
    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .order("display_order");
    if (error) {
      console.error("All hero slides query error:", error);
      return [];
    }
    return (data ?? []) as HeroSlide[];
  } catch (err) {
    console.error("All hero slides fetch exception:", err);
    return [];
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
  const payload: Record<string, unknown> = { ...popup };
  const { data, error } = await supabase
    .from("popups")
    .insert(payload)
    .select()
    .single();

  if (error && error.message.includes("target_lang")) {
    console.warn("popups 테이블에 target_lang 컬럼이 없어 제외하고 저장합니다.", error.message);
    delete payload.target_lang;
    const retry = await supabase
      .from("popups")
      .insert(payload)
      .select()
      .single();
    if (retry.error) throw retry.error;
    return retry.data as Popup;
  }

  if (error) throw error;
  return data as Popup;
}

export async function updatePopup(
  id: string,
  updates: Partial<Omit<Popup, "id">>
): Promise<void> {
  const payload: Record<string, unknown> = { ...updates };
  const { error } = await supabase
    .from("popups")
    .update(payload)
    .eq("id", id);

  if (error && error.message.includes("target_lang")) {
    console.warn("popups 테이블에 target_lang 컬럼이 없어 제외하고 업데이트합니다.", error.message);
    delete payload.target_lang;
    const retry = await supabase
      .from("popups")
      .update(payload)
      .eq("id", id);
    if (retry.error) throw retry.error;
    return;
  }

  if (error) throw error;
}

export async function deletePopup(id: string): Promise<void> {
  const { error } = await supabase.from("popups").delete().eq("id", id);
  if (error) throw error;
}

export interface GlossaryItem {
  id: string;
  ko: string;
  en: string;
}

export const DEFAULT_GLOSSARY: GlossaryItem[] = [
  { id: "1", ko: "K학술확산연구센터", en: "K-Academic Diffusion Research Center" },
  { id: "2", ko: "국제관계연구소", en: "Inha Center for International Studies" },
  { id: "3", ko: "이주및재외동포센터", en: "Center for Migration and Overseas Koreans" },
  { id: "4", ko: "지구촌한인세상", en: "Cordia" },
  { id: "5", ko: "디아스포라", en: "Diaspora" },
  { id: "6", ko: "한국학", en: "Korean Studies" },
  { id: "7", ko: "부설 연구원", en: "Affiliated Research Institute (KDec)" },
];

export async function getGlossary(): Promise<GlossaryItem[]> {
  try {
    const settings = await getSiteSettings();
    if (settings.translation_glossary) {
      const parsed = JSON.parse(settings.translation_glossary);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to parse translation glossary:", e);
  }
  return DEFAULT_GLOSSARY;
}

export async function saveGlossary(items: GlossaryItem[]): Promise<void> {
  await updateSiteSetting("translation_glossary", JSON.stringify(items));
}

// ============================================================
// DeepL 번역 (관리자 전용 — 마크다운 이미지/태그 & 고정 용어사전 보호)
// ============================================================
export async function translateTexts(
  texts: string[],
  targetLang: "EN-US" | "KO" = "EN-US"
): Promise<string[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("로그인이 필요합니다.");

  // 고정 용어사전 로드
  const glossary = await getGlossary();

  // 마크다운 이미지 `![alt](url)`, 링크 `[text](url)`, 및 용어사전 태그 보호
  const placeholdersList: Array<{ token: string; replacement: string }[]> = [];

  const maskedTexts = texts.map((text, idx) => {
    if (!text || !text.trim()) {
      placeholdersList[idx] = [];
      return text;
    }

    const placeholders: { token: string; replacement: string }[] = [];
    let counter = 0;

    // 1. 이미지 마크다운 보호: ![alt](url)
    let processed = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match) => {
      const token = `__IMG_TAG_${counter++}__`;
      placeholders.push({ token, replacement: match });
      return token;
    });

    // 2. 링크 URL 주소 보호: [text](https://...)
    processed = processed.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (match, linkText, url) => {
      const token = `__LINK_URL_${counter++}__`;
      placeholders.push({ token, replacement: `](${url})` });
      return `[${linkText}${token}`;
    });

    // 3. 고정 용어 사전(Glossary) 치환
    if (glossary && glossary.length > 0) {
      if (targetLang === "EN-US") {
        // 국문 -> 영문 번역 시: 국문 단어를 토큰으로 치환 후, 번역 결과에 지정된 영문 단어 주입
        const sortedKo = [...glossary]
          .filter((g) => g.ko && g.ko.trim() && g.en && g.en.trim())
          .sort((a, b) => b.ko.length - a.ko.length);

        sortedKo.forEach((item) => {
          if (processed.includes(item.ko)) {
            const token = `__GLOSSARY_${counter++}__`;
            placeholders.push({ token, replacement: item.en });
            processed = processed.split(item.ko).join(token);
          }
        });
      } else {
        // 영문 -> 국문 번역 시: 영문 단어를 대소문자 무시 검색하여 토큰으로 치환 후 지정된 국문 단어 주입
        const sortedEn = [...glossary]
          .filter((g) => g.ko && g.ko.trim() && g.en && g.en.trim())
          .sort((a, b) => b.en.length - a.en.length);

        sortedEn.forEach((item) => {
          const escaped = item.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(escaped, "gi");
          if (regex.test(processed)) {
            const token = `__GLOSSARY_${counter++}__`;
            placeholders.push({ token, replacement: item.ko });
            processed = processed.replace(regex, token);
          }
        });
      }
    }

    placeholdersList[idx] = placeholders;
    return processed;
  });

  const res = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ texts: maskedTexts, targetLang }),
  });

  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    if (contentType.includes("text/html")) {
      throw new Error(`번역 API 엔드포인트(/api/translate)를 찾을 수 없습니다. Vercel 배포 상태를 확인해주세요. (HTTP ${res.status})`);
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || `번역 실패 (${res.status})`);
  }

  if (contentType.includes("text/html")) {
    throw new Error("번역 API 응답 형식이 올바르지 않습니다. (HTML 응답 수신)");
  }

  const data = await res.json();
  const rawTranslations: string[] = data.translations;

  // 번역된 텍스트에서 플레이스홀더 복원 (용어사전 매핑 및 이미지/링크 복구)
  return rawTranslations.map((trans, idx) => {
    let unmasked = trans;
    const placeholders = placeholdersList[idx] || [];
    placeholders.forEach(({ token, replacement }) => {
      unmasked = unmasked.split(token).join(replacement);
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


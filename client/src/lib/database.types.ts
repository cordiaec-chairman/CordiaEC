export interface Initiative {
  slug: string;
  title: string;
  title_ko: string | null;
  description_ko: string | null;
  content_ko: string | null;
  label: string;
  category: string;
  description: string;
  content: string;
  image_url: string | null;
  display_order: number;
}

export interface Post {
  id: string;
  board: "news" | "diaspora" | "reports";
  title: string;
  excerpt: string;
  content: string;
  title_ko: string | null;
  excerpt_ko: string | null;
  content_ko: string | null;
  image_url: string | null;
  file_url?: string | null;
  file_name?: string | null;
  link_url: string | null;
  initiative_slug: string | null;
  is_pinned_home: boolean;
  published_date: string;
  created_at: string;
}

export interface Milestone {
  id: string;
  period_label: string;
  title: string;
  description: string;
  description_ko: string | null;
  image_url: string | null;
  display_order: number;
}

export interface SiteSetting {
  key: string;
  value: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  logo_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface HeroSlide {
  id: string;
  image_url: string;
  headline: string;
  sub_lines: string;
  headline_ko: string | null;
  sub_lines_ko: string | null;
  display_order: number;
  is_active: boolean;
}

export type PopupPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type PopupTargetLang = "all" | "ko" | "en";

export interface Popup {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  position: PopupPosition;
  width: number;
  pos_x: number | null;  // 화면 대비 % (드래그로 지정). null이면 position 프리셋 사용
  pos_y: number | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  target_lang?: PopupTargetLang;
}

// supabase-js가 요구하는 Database 제네릭 타입
export type Database = {
  public: {
    Tables: {
      initiatives: {
        Row: Initiative;
        Insert: Initiative;
        Update: Partial<Initiative>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, "id" | "created_at">;
        Update: Partial<Omit<Post, "id" | "created_at">>;
      };
      milestones: {
        Row: Milestone;
        Insert: Omit<Milestone, "id">;
        Update: Partial<Omit<Milestone, "id">>;
      };
      site_settings: {
        Row: SiteSetting;
        Insert: SiteSetting;
        Update: Pick<SiteSetting, "value">;
      };
      contacts: {
        Row: Contact;
        Insert: Omit<Contact, "id" | "created_at">;
        Update: never;
      };
      partners: {
        Row: Partner;
        Insert: Omit<Partner, "id" | "created_at">;
        Update: Partial<Omit<Partner, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

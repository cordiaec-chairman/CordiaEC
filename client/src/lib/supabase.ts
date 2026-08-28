import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "https://dummy-project.supabase.co";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "dummy-anon-key";

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes("dummy") &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_ANON_KEY.includes("dummy")
);

// 브라우저 닫을 시 세션 즉시 만료 (sessionStorage 적용) 및 기존 localStorage 잔여 토큰 소각
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("test_admin_auth");
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
        localStorage.removeItem(k);
      }
    });
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
  },
});

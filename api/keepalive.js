// Vercel Cron이 3일마다 호출 → Supabase 무료 프로젝트 자동 일시정지 방지
export default async function handler(_req, res) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    res.status(500).json({ ok: false, error: "Missing Supabase env vars" });
    return;
  }

  const r = await fetch(`${url}/rest/v1/site_settings?select=key&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });

  res.status(200).json({ ok: r.ok });
}

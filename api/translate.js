// DeepL 번역 프록시 (한국어 → 영어)
// - DEEPL_API_KEY는 서버에만 존재 (브라우저 노출 없음)
// - 관리자(Supabase Auth 로그인) 토큰을 검증한 요청만 처리 → 무료 한도 도용 방지
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const deeplKey = process.env.DEEPL_API_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!deeplKey) {
    res.status(500).json({ error: "DEEPL_API_KEY가 서버 환경변수(Vercel Environment Variables)에 설정되지 않았습니다." });
    return;
  }

  // 1) 관리자 인증 검증
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    res.status(401).json({ error: "로그인이 필요합니다." });
    return;
  }

  if (supabaseUrl && anonKey) {
    try {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) {
        res.status(401).json({ error: "유효하지 않은 관리자 세션입니다." });
        return;
      }
    } catch (authErr) {
      console.error("Supabase auth verification failed:", authErr);
      res.status(401).json({ error: "관리자 세션 검증에 실패했습니다." });
      return;
    }
  }

  // 2) 번역 요청
  const { texts, targetLang = "EN-US", sourceLang } = req.body || {};
  if (!Array.isArray(texts) || texts.length === 0 || texts.length > 20) {
    res.status(400).json({ error: "texts는 1개 이상 20개 이하의 문자열 배열이어야 합니다." });
    return;
  }

  const cleanKey = (deeplKey || "").trim().replace(/^["']|["']$/g, "");
  if (!cleanKey) {
    res.status(500).json({
      error: "DEEPL_API_KEY가 설정되지 않았습니다.",
      detail: "Vercel 대시보드 > Settings > Environment Variables에 DEEPL_API_KEY를 등록한 후 반드시 [Redeploy]를 실행해주세요.",
    });
    return;
  }

  // 1차 시도 및 보조 엔드포인트 자동 구성 (Free/Pro 양방향 자동 폴백)
  const primaryEndpoint = cleanKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";
  const fallbackEndpoint = cleanKey.endsWith(":fx")
    ? "https://api.deepl.com/v2/translate"
    : "https://api-free.deepl.com/v2/translate";

  const target = targetLang === "KO" ? "KO" : "EN-US";
  const payload = {
    text: texts.map((t) => String(t).slice(0, 20000)),
    target_lang: target,
  };
  if (sourceLang) {
    payload.source_lang = sourceLang.toUpperCase();
  }

  const payloadBody = JSON.stringify(payload);

  async function callDeepL(endpoint) {
    return fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${cleanKey}`,
        "Content-Type": "application/json",
      },
      body: payloadBody,
    });
  }

  try {
    let deeplRes = await callDeepL(primaryEndpoint);

    // 403 오류 발생 시 (엔드포인트 불일치 등) 반대편 엔드포인트로 1회 자동 재시도
    if (deeplRes.status === 403) {
      const retryRes = await callDeepL(fallbackEndpoint);
      if (retryRes.ok) {
        deeplRes = retryRes;
      }
    }

    if (!deeplRes.ok) {
      const raw = await deeplRes.text();
      let hint = "";
      if (deeplRes.status === 403) {
        hint = "API 키가 유효하지 않거나 웹 번역기(Pro) 전용 계정일 수 있습니다. 개발자용 'DeepL API'(deepl.com/your-account/keys)에서 발급받은 Authentication Key인지 확인해주세요.";
      } else if (deeplRes.status === 456) {
        hint = "DeepL 번역 무료/유료 사용량 한도(Quota)가 초과되었습니다.";
      } else if (deeplRes.status === 401) {
        hint = "DeepL 인증에 실패했습니다. API 키를 다시 확인해주세요.";
      }
      res.status(502).json({
        error: `DeepL API 오류 (${deeplRes.status})`,
        detail: hint ? `${hint} (원문: ${raw.slice(0, 150)})` : raw.slice(0, 300),
      });
      return;
    }

    const data = await deeplRes.json();
    res.status(200).json({ translations: data.translations.map((t) => t.text) });
  } catch (netErr) {
    console.error("DeepL network error:", netErr);
    res.status(502).json({ error: "DeepL 서버와 통신할 수 없습니다.", detail: String(netErr) });
  }
}

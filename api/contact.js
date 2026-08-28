// Vercel Serverless API: /api/contact
// 1) Supabase contacts 테이블에 안전하게 저장
// 2) cordiaec@gmail.com으로 문의 상세 내용 이메일 자동 발송 (Resend API)
// 3) 스팸 봇 방지 (Honeypot) 및 오류 격리

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { name, email, message, hp } = req.body || {};

  // 1) Honeypot 검사: 숨겨진 인풋에 값이 채워져 있으면 스팸 봇
  if (hp) {
    res.status(200).json({ success: true, message: "Message received" });
    return;
  }

  // 2) 유효성 검사
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "이름을 입력해주세요." });
    return;
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "올바른 이메일 주소를 입력해주세요." });
    return;
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "문의 내용을 입력해주세요." });
    return;
  }

  const cleanName = name.trim().slice(0, 100);
  const cleanEmail = email.trim().slice(0, 150);
  const cleanMessage = message.trim().slice(0, 5000);
  const nowStr = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  // 3) Supabase DB contacts 테이블에 저장
  if (supabaseUrl && anonKey) {
    try {
      const dbRes = await fetch(`${supabaseUrl}/rest/v1/contacts`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          message: cleanMessage,
        }),
      });

      if (!dbRes.ok) {
        const errText = await dbRes.text();
        console.error("Supabase insert error:", errText);
      }
    } catch (dbErr) {
      console.error("DB connection error:", dbErr);
    }
  }

  // 4) Resend API를 통한 cordiaec@gmail.com 메일 발송
  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_RECEIVER_EMAIL || "cordiaec@gmail.com";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "CordiaEC Web <onboarding@resend.dev>";

  if (resendApiKey) {
    try {
      const htmlContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #111827; padding: 24px 28px; text-align: left;">
            <h1 style="color: #14b8a6; font-size: 20px; margin: 0; font-weight: 700;">CordiaEC 홈페이지 신규 문의</h1>
            <p style="color: #9ca3af; font-size: 13px; margin: 4px 0 0 0;">접수 일시: ${nowStr} (KST)</p>
          </div>
          
          <div style="padding: 28px;">
            <div style="margin-bottom: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #14b8a6;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;"><strong>문의자:</strong> <span style="color: #111827;">${cleanName}</span></p>
              <p style="margin: 0; font-size: 14px; color: #4b5563;"><strong>회신 이메일:</strong> <a href="mailto:${cleanEmail}" style="color: #0284c7; text-decoration: none;">${cleanEmail}</a></p>
            </div>

            <div style="margin-bottom: 24px;">
              <h3 style="font-size: 15px; color: #111827; margin: 0 0 10px 0; font-weight: 600;">문의 내용:</h3>
              <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #374151; white-space: pre-wrap;">${cleanMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
            </div>

            <div style="text-align: center; padding-top: 12px; border-top: 1px solid #f3f4f6;">
              <a href="mailto:${cleanEmail}?subject=Re:%20[CordiaEC]%20문의에%20대한%20답변드립니다" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
                문의자에게 답장하기 (${cleanEmail})
              </a>
            </div>
          </div>

          <div style="background: #f9fafb; padding: 16px 28px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">본 메일은 CordiaEC 웹사이트(cordiaec.com) 문의 폼을 통해 자동 발송되었습니다.</p>
          </div>
        </div>
      `;

      const mailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: cleanEmail,
          subject: `[CordiaEC 문의] ${cleanName}님의 새로운 문의사항이 접수되었습니다`,
          html: htmlContent,
        }),
      });

      if (!mailRes.ok) {
        const mailErr = await mailRes.text();
        console.error("Resend API error:", mailErr);
      }
    } catch (err) {
      console.error("Email sending error:", err);
    }
  } else {
    console.log("RESEND_API_KEY is not configured. Inquiry saved to DB only.");
  }

  res.status(200).json({ success: true, message: "문의가 성공적으로 접수되었습니다." });
}

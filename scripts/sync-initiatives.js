#!/usr/bin/env node

/**
 * CordiaEC 6대 공식 이니셔티브 DB 동기화 스크립트
 * 
 * 실행 방법:
 * 1) 대화형 실행 (이메일/비번 입력):
 *    node scripts/sync-initiatives.js
 * 
 * 2) 인자 직접 전달:
 *    node scripts/sync-initiatives.js --email admin@example.com --password "******"
 * 
 * 3) 서비스 롤 키(Service Role Key)로 직접 실행:
 *    SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/sync-initiatives.js
 */

import { createClient } from "@supabase/supabase-js";
import readline from "readline";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://pjgywtpysimaywlaaymj.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ3l3dHB5c2ltYXl3bGFheW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzg0ODQsImV4cCI6MjA2OTk1NDQ4NH0.0qRjDGxp8I1RIyD0TOdoDYiSJnQc1HhNikRq9v6y2ZY";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const OFFICIAL_INITIATIVES = [
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

const LEGACY_SLUGS = ["k-food", "k-beauty", "startups", "vc-matching", "internships", "forums"];

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      result[key] = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
    }
  }
  return result;
}

function prompt(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function main() {
  console.log("==================================================");
  console.log("🚀 CordiaEC 6대 공식 이니셔티브 DB 동기화 도구");
  console.log(`🌐 Supabase URL: ${SUPABASE_URL}`);
  console.log("==================================================\n");

  const args = parseArgs();
  if (args.help || args.h) {
    console.log("사용법:");
    console.log("  1) 대화형 실행 (이메일/비밀번호 프롬프트):");
    console.log("     npm run db:sync-initiatives\n");
    console.log("  2) 인자 직접 전달:");
    console.log("     npm run db:sync-initiatives -- --email admin@example.com --password '비밀번호'\n");
    console.log("  3) 서비스 롤 키로 권한 우회 실행:");
    console.log("     SUPABASE_SERVICE_ROLE_KEY=your_key npm run db:sync-initiatives\n");
    process.exit(0);
  }

  let supabase;

  if (SERVICE_ROLE_KEY) {
    console.log("🔑 SUPABASE_SERVICE_ROLE_KEY 감지: 관리자 마스터 권한으로 실행합니다.");
    supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } else {
    let email = args.email || process.env.ADMIN_EMAIL;
    let password = args.password || process.env.ADMIN_PASSWORD;

    if (!email) {
      email = await prompt("관리자 이메일(Email): ");
    }
    if (!password) {
      password = await prompt("관리자 비밀번호(Password): ");
    }

    if (!email || !password) {
      console.error("❌ 이메일과 비밀번호가 필요합니다.");
      process.exit(1);
    }

    console.log(`\n🔐 관리자 인증 시도 중 (${email})...`);
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData?.session) {
      console.error(`❌ 관리자 로그인 실패: ${authError?.message || "세션 생성 실패"}`);
      process.exit(1);
    }
    console.log("✅ 관리자 인증 성공!");
  }

  console.log("\n[1/3] 구형 이니셔티브 참조 게시글 외래키 정리 중...");
  const { error: postErr } = await supabase
    .from("posts")
    .update({ initiative_slug: null })
    .in("initiative_slug", LEGACY_SLUGS);
  if (postErr) {
    console.warn("⚠️ posts 외래키 정리 중 경고 (무시 가능):", postErr.message);
  } else {
    console.log("✅ 완료: 구형 이니셔티브 참조 해제");
  }

  console.log("\n[2/3] 구형 모의 이니셔티브 데이터 삭제 중...");
  const { error: delErr } = await supabase
    .from("initiatives")
    .delete()
    .in("slug", LEGACY_SLUGS);
  if (delErr) {
    console.warn("⚠️ initiatives 삭제 중 경고:", delErr.message);
  } else {
    console.log("✅ 완료: 구형 데이터 6건 삭제");
  }

  console.log("\n[3/3] 최신 6대 공식 이니셔티브 등록 및 갱신 중...");
  const { error: upsertErr } = await supabase
    .from("initiatives")
    .upsert(OFFICIAL_INITIATIVES, { onConflict: "slug" });

  if (upsertErr) {
    console.error("❌ 이니셔티브 등록 실패:", upsertErr.message);
    process.exit(1);
  }

  console.log("✅ 완료: 6대 공식 이니셔티브 등록 성공!");
  console.log("\n==================================================");
  console.log("🎉 모든 동기화가 완료되었습니다.");
  console.log("이제 https://k-dia.net 과 /admin 에서 최신 6대 공식 이니셔티브가 정상 표시됩니다.");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("❌ 예외 발생:", err);
  process.exit(1);
});

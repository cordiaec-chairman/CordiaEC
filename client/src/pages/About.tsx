import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { getMilestones } from "@/lib/queries";
import type { Milestone } from "@/lib/database.types";
import { useLang, useT, pickField } from "@/lib/i18n";
import { Quote, Compass, Globe, Calendar, ArrowRight, Sparkles, Building2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function About() {
  const { lang } = useLang();
  const t = useT();

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ["milestones"],
    queryFn: getMilestones,
  });

  return (
    <Layout>
      {/* 1. About Hero Section */}
      <section className="relative py-16 sm:py-24 bg-[#0a192f] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0a192f] to-[#07111e] opacity-95"></div>
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-teal-500/10 blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-teal-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CORDIA ENTERPRISE COOPERATIVE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight" data-testid="text-about-hero-title">
              {t("about.heroTitle")}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed font-light max-w-2xl mx-auto" data-testid="text-about-hero-description">
              {t("about.heroDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* 2. 설립자 인사말 및 지향점 (Founder's Message) */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="outline" className="border-teal-500/30 text-teal-700 bg-teal-50/60 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2.5">
              {t("about.founderBadge")}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {t("about.founderTitle")}
            </h2>
          </div>

          {/* Letter Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200/80 shadow-xl shadow-slate-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/5 rounded-bl-full pointer-events-none" />
            <Quote className="w-12 h-12 text-teal-600/20 absolute top-6 right-6 sm:top-8 sm:right-8 pointer-events-none" />

            {/* Headline */}
            <div className="border-b border-slate-100 pb-6 mb-8">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0f2445] leading-snug">
                "{t("about.founderHeadline")}"
              </h3>
            </div>

            {/* Paragraphs */}
            <div className="space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed font-normal">
              <p className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border-l-4 border-teal-600 text-slate-800">
                {t("about.founderP1")}
              </p>
              <p>
                {t("about.founderP2")}
              </p>
              <p className="bg-blue-50/40 p-4 sm:p-5 rounded-2xl border border-blue-100/80 text-slate-800 font-medium">
                {t("about.founderP3")}
              </p>
            </div>

            {/* Signature Area */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0f2445] text-white flex items-center justify-center font-bold text-sm">
                  C
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">지구촌한인세상꼬르디아 협동조합</p>
                  <p className="text-sm font-bold text-slate-900">Cordia Enterprise Cooperative</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">부설 글로벌한인경제문화연구원 (KDec)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 미션과 비전 (Mission & Vision) */}
      <section className="py-16 sm:py-24 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="outline" className="border-blue-500/30 text-blue-700 bg-blue-50/60 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2.5">
              {t("about.vmBadge")}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900" data-testid="text-vision-mission-title">
              {t("about.vmTitle")}
            </h2>
          </div>

          {/* 2-Column Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1: Mission */}
            <div className="bg-gradient-to-br from-teal-50/60 via-white to-white rounded-3xl p-8 border border-teal-100 shadow-lg shadow-teal-900/5 flex flex-col justify-between relative overflow-hidden group hover:border-teal-300 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-6 shadow-md shadow-teal-600/20">
                  <Compass className="w-6 h-6" />
                </div>
                <div className="inline-block text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-100/70 px-2.5 py-0.5 rounded-md mb-2">
                  OUR MISSION
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                  {t("about.missionTitle")}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal" data-testid="text-mission-description">
                  {t("about.missionDesc")}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-teal-100/80 flex items-center gap-2 text-xs font-semibold text-teal-700">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>깊이 있는 학술 연구 & 상생 네트워크</span>
              </div>
            </div>

            {/* Card 2: Vision */}
            <div className="bg-gradient-to-br from-blue-50/60 via-white to-white rounded-3xl p-8 border border-blue-100 shadow-lg shadow-blue-900/5 flex flex-col justify-between relative overflow-hidden group hover:border-blue-300 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#0f2445] text-white flex items-center justify-center mb-6 shadow-md shadow-blue-900/20">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="inline-block text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-100/70 px-2.5 py-0.5 rounded-md mb-2">
                  OUR VISION
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                  {t("about.visionTitle")}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal" data-testid="text-vision-description">
                  {t("about.visionDesc")}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-blue-100/80 flex items-center gap-2 text-xs font-semibold text-blue-800">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>지식과 현장 융합 · 미래형 글로벌 플랫폼</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 공식 연혁 (Our History - 타임라인) */}
      <section className="py-16 sm:py-24 bg-slate-50/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2.5 shadow-2xs">
              {t("about.historyBadge")}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2" data-testid="text-org-history-title">
              {t("about.historyTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              {t("about.historySubtitle")}
            </p>
          </div>

          {/* Timeline List */}
          <div className="relative max-w-3xl mx-auto mb-16">
            {/* Center-left Connecting Line */}
            <div className="absolute left-6 sm:left-36 top-3 bottom-3 w-0.5 bg-slate-200" />

            {isLoading ? (
              <div className="space-y-6">
                {[...Array(4)].map((_, idx) => (
                  <div
                    key={idx}
                    className="relative flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-8 animate-pulse"
                  >
                    <div className="flex items-center gap-3 sm:w-32 sm:justify-end shrink-0 pl-12 sm:pl-0">
                      <div className="h-8 w-24 bg-slate-200 rounded-xl" />
                    </div>
                    <div className="absolute left-6 sm:left-36 -translate-x-1/2 top-2 sm:top-2.5 w-3 h-3 rounded-full bg-slate-300" />
                    <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs ml-12 sm:ml-0">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : milestones.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>등록된 공식 연혁 정보가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {milestones.map((milestone: Milestone, idx: number) => {
                  const desc = pickField(milestone, "description", lang);
                  return (
                    <div
                      key={milestone.id || idx}
                      className="relative flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-8 group"
                      data-testid={`row-milestone-${idx}`}
                    >
                      {/* Left: Date Badge */}
                      <div className="flex items-center gap-3 sm:w-32 sm:justify-end shrink-0 pl-12 sm:pl-0">
                        <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-[#0f2445] shadow-2xs group-hover:border-teal-500 group-hover:text-teal-700 transition-colors">
                          {milestone.period_label}
                        </div>
                      </div>

                      {/* Center: Timeline Dot */}
                      <div className="absolute left-6 sm:left-36 -translate-x-1/2 top-2 sm:top-2.5 w-3 h-3 rounded-full bg-white border-2 border-teal-600 shadow-xs group-hover:bg-teal-600 transition-colors" />

                      {/* Right: Content Card */}
                      <div className="flex-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all ml-12 sm:ml-0">
                        <div className="text-slate-800 text-sm sm:text-base leading-relaxed font-medium">
                          {desc.split("\n").map((line, i) =>
                            line.trim() ? <p key={i} className="mb-1 last:mb-0">{line.trim()}</p> : null
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom CTA Button */}
          <div className="text-center pt-6">
            <Link href="/initiatives">
              <button
                className="inline-flex items-center gap-2 bg-[#0f2445] hover:bg-[#1a3a60] text-white px-8 py-3.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-950/10 hover:shadow-lg transition-all"
                data-testid="button-go-to-initiatives"
              >
                <span>{t("about.goToInitiatives")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

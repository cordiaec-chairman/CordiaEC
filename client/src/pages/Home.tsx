import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import HeroCarousel from "@/components/HeroCarousel";
import PopupDisplay from "@/components/PopupDisplay";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, FileText, FileDown, Lightbulb, Users, Handshake } from "lucide-react";
import { getInitiatives, getHomePosts, getHomeReports, getSiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/queries";
import { useLang, useT, pickField } from "@/lib/i18n";
import type { Initiative, Post } from "@/lib/database.types";
import NewsModal from "@/components/modals/NewsModal";
import PartnerBanner from "@/components/PartnerBanner";

export default function Home() {
  const { lang } = useLang();
  const t = useT();
  const [, navigate] = useLocation();
  const [selectedNews, setSelectedNews] = useState<Post | null>(null);
  const [newsModalOpen, setNewsModalOpen] = useState(false);

  const { data: initiatives = [] } = useQuery({
    queryKey: ["initiatives"],
    queryFn: getInitiatives,
  });

  const { data: settings = DEFAULT_SITE_SETTINGS } = useQuery({
    queryKey: ["site_settings"],
    queryFn: getSiteSettings,
  });

  const homeCount = parseInt(settings.home_board_count || "3", 10);

  const { data: newsArticles = [], isLoading: isNewsLoading } = useQuery({
    queryKey: ["home_posts", homeCount],
    queryFn: () => getHomePosts(homeCount),
  });

  const { data: reports = [], isLoading: isReportsLoading } = useQuery({
    queryKey: ["home_reports", 3],
    queryFn: () => getHomeReports(3),
  });

  const openNewsModal = (article: Post) => {
    setSelectedNews(article);
    setNewsModalOpen(true);
  };

  return (
    <Layout>
      {/* 팝업 모달 */}
      <PopupDisplay />

      {/* 1. Hero Carousel */}
      <HeroCarousel />

      {/* 2. Who We Are & Storytelling Section */}
      <section className="py-14 sm:py-20 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* 좌측: 스토리텔링 본문 */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold uppercase tracking-wider mb-3.5">
                Global Knowledge Hub
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-snug">
                {t("home.aboutTitle")}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mb-8 leading-relaxed">
                {t("home.aboutDesc")}
              </p>

              {/* 3대 핵심 가치 */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 sm:p-5 bg-slate-50/80 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center mb-3">
                    <Lightbulb className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1.5">
                    {t("home.feature1Title")}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t("home.feature1Desc")}
                  </p>
                </div>

                <div className="p-4 sm:p-5 bg-slate-50/80 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center mb-3">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1.5">
                    {t("home.feature2Title")}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t("home.feature2Desc")}
                  </p>
                </div>

                <div className="p-4 sm:p-5 bg-slate-50/80 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center mb-3">
                    <Handshake className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1.5">
                    {t("home.feature3Title")}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t("home.feature3Desc")}
                  </p>
                </div>
              </div>

              <Link href="/about">
                <Button className="bg-[#0f2445] hover:bg-[#1a3a60] text-white text-sm font-semibold h-11 px-6 rounded-lg shadow-sm">
                  {t("home.learnMoreAbout")} <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>

            {/* 우측: 브랜드 이미지 카드 */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-4/3 group">
                <img
                  src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                  alt="Cordia Global Network"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    {lang === "ko" ? "신뢰의 글로벌 파트너십" : "Trusted Partnership"}
                  </span>
                  <p className="text-sm font-medium leading-snug">
                    {lang === "ko"
                      ? "학술적 전문성과 글로벌 비즈니스 가치의 조화로운 연결"
                      : "Connecting scholarly depth with global business excellence"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Initiatives Grid Section - Sleek 1x6 Horizontal Showcase */}
      <section className="py-14 sm:py-20 bg-slate-50/70 border-b border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 inline-block px-3 py-1 rounded-full border border-teal-200/60 mb-2.5">
              {lang === "ko" ? "핵심 사업 분야" : "Core Focus Areas"}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2.5 tracking-tight">
              {t("home.initiativesTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-keep max-w-xl mx-auto">
              {t("home.initiativesDesc")}
            </p>
          </div>

          {/* 1 Row x 6 Columns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 mb-10">
            {initiatives.map((init: Initiative) => {
              const title = pickField(init, "title", lang);
              return (
                <Link
                  key={init.slug}
                  href={`/initiatives/${init.slug}`}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/85 shadow-2xs hover:shadow-lg hover:border-slate-300 transition-all duration-300 text-center"
                >
                  {/* Square Image with Zoom effect */}
                  <div className="aspect-square w-full overflow-hidden bg-slate-100 relative">
                    <img
                      src={init.image_url || ""}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Balanced 2-Line Title Container */}
                  <div className="p-3 sm:p-3.5 flex-1 flex items-center justify-center min-h-[58px] sm:min-h-[62px] bg-white">
                    <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 group-hover:text-teal-700 transition-colors leading-[1.35] tracking-tight break-keep text-center">
                      {title}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center">
            <Link href="/initiatives">
              <Button
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-[#0f2445] text-xs sm:text-sm font-semibold h-10 px-5 rounded-xl shadow-2xs transition-all"
              >
                {t("common.viewAllInitiatives")} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Latest News & Industry Reports 2-Column Split */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* 좌측: 최신 소식 (Latest News) */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {lang === "ko" ? "최신 소식" : "Updates"}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      {settings.home_board_title && settings.home_board_title !== "Latest News" 
                        ? settings.home_board_title 
                        : (lang === "ko" ? "최신 뉴스 & 공지" : "Latest News")}
                    </h3>
                  </div>
                  <Link href="/news">
                    <span className="text-xs font-semibold text-slate-500 hover:text-[#0f2445] flex items-center gap-1 cursor-pointer transition-colors">
                      {t("common.viewAllNews")} <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                </div>

                {isNewsLoading ? (
                  <div className="space-y-3.5">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="flex gap-4 bg-white border border-slate-100 rounded-xl p-3.5 sm:p-4 animate-pulse">
                        <div className="w-24 h-20 sm:w-28 sm:h-22 rounded-lg bg-slate-100 shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-slate-200 rounded w-3/4" />
                          <div className="h-3 bg-slate-100 rounded w-full" />
                          <div className="h-2.5 bg-slate-100 rounded w-1/4 mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : newsArticles.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl text-slate-400 text-xs sm:text-sm">
                    {t("home.noNews")}
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {newsArticles.map((article: Post) => (
                      <div
                        key={article.id}
                        onClick={() => openNewsModal(article)}
                        className="flex gap-4 bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 hover:shadow-md hover:border-slate-400 transition-all cursor-pointer group"
                      >
                        <div className="w-24 h-20 sm:w-28 sm:h-22 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                          {article.image_url ? (
                            <img
                              src={article.image_url}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                              News
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#0f2445] transition-colors line-clamp-1">
                              {pickField(article, "title", lang)}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                              {pickField(article, "excerpt", lang)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                            <Calendar className="w-3 h-3" />
                            {new Date(article.published_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 우측: 산업분석 보고서 (Industry Reports) */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {lang === "ko" ? "전문 리포트" : "Intelligence"}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      {t("home.reportsTitle")}
                    </h3>
                  </div>
                  <Link href="/reports">
                    <span className="text-xs font-semibold text-slate-500 hover:text-[#0f2445] flex items-center gap-1 cursor-pointer transition-colors">
                      {t("common.viewAllReports")} <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                </div>

                {isReportsLoading ? (
                  <div className="space-y-3.5">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="flex gap-4 bg-white border border-slate-100 rounded-xl p-3.5 sm:p-4 animate-pulse">
                        <div className="w-24 h-20 sm:w-28 sm:h-22 rounded-lg bg-slate-100 shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-slate-200 rounded w-3/4" />
                          <div className="h-3 bg-slate-100 rounded w-full" />
                          <div className="h-2.5 bg-slate-100 rounded w-1/4 mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl text-slate-400 text-xs sm:text-sm">
                    {t("home.noReports")}
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {reports.map((report: Post) => (
                      <div
                        key={report.id}
                        onClick={() => navigate(`/reports/${report.id}`)}
                        className="flex gap-4 bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 hover:shadow-md hover:border-slate-400 transition-all cursor-pointer group"
                      >
                        <div className="w-24 h-20 sm:w-28 sm:h-22 rounded-lg overflow-hidden shrink-0 bg-slate-50 border border-slate-200 flex items-center justify-center">
                          {report.image_url ? (
                            <img
                              src={report.image_url}
                              alt={report.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-600 text-center p-1">
                              <FileText className="w-5 h-5 mb-0.5" />
                              <span className="text-[9px] font-bold">REPORT</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                Report
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#0f2445] transition-colors line-clamp-1">
                              {pickField(report, "title", lang)}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-1 leading-relaxed">
                              {pickField(report, "excerpt", lang)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(report.published_date).toLocaleDateString()}
                            </span>
                            {report.file_url && (
                              <span className="text-[#0f2445] font-semibold flex items-center gap-0.5">
                                <FileDown className="w-3 h-3" /> PDF
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Partners Infinite Rolling Marquee Banner */}
      <PartnerBanner />

      {/* 6. Contact CTA Section */}
      <section className="py-14 sm:py-18 bg-[#0f2445] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left max-w-xl">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-1.5 block">
                {lang === "ko" ? "파트너십 & 제휴 문의" : "Partnership Inquiry"}
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2.5 leading-snug">
                {t("home.ctaTitle")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t("home.ctaDesc")}
              </p>
            </div>
            <Link href="/contact">
              <Button className="bg-white hover:bg-slate-100 text-[#0f2445] font-bold text-sm h-12 px-7 rounded-lg shadow-md shrink-0">
                {t("home.ctaButton")} <ArrowRight className="w-4 h-4 ml-2 text-[#0f2445]" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 모달 */}
      <NewsModal
        open={newsModalOpen}
        onOpenChange={setNewsModalOpen}
        article={selectedNews}
      />
    </Layout>
  );
}

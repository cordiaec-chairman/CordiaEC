import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, ChevronRight, CheckCircle2, ImageIcon } from "lucide-react";
import { getInitiative, getPosts } from "@/lib/queries";
import type { Post } from "@/lib/database.types";
import { useLang, useT, pickField } from "@/lib/i18n";

export default function InitiativeDetail() {
  const { lang } = useLang();
  const t = useT();
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const { data: initiative, isLoading: initiativeLoading } = useQuery({
    queryKey: ["initiative", slug],
    queryFn: () => getInitiative(slug!),
    enabled: !!slug,
  });

  const { data: postsData, isLoading: newsLoading } = useQuery({
    queryKey: ["posts_by_initiative", slug],
    queryFn: () =>
      getPosts({
        initiativeSlug: slug,
        page: 1,
        limit: 100,
      }),
    enabled: !!slug,
  });

  const getPostRoute = (post: Post) => {
    if (post.board === "reports") return `/reports/${post.id}`;
    if (post.board === "diaspora") return `/overseas-korean/${post.id}`;
    return `/news/${post.id}`;
  };

  const articles: Post[] = postsData?.posts ?? [];

  if (initiativeLoading) {
    return (
      <Layout>
        <div className="py-16 container mx-auto px-4 max-w-4xl">
          <div className="h-8 bg-slate-200 rounded w-24 mb-8 animate-pulse" />
          <div className="h-64 bg-slate-200 rounded-xl mb-8 animate-pulse" />
          <div className="h-10 bg-slate-200 rounded w-3/4 mb-4 animate-pulse" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (!initiative) {
    return (
      <Layout>
        <div className="py-32 text-center">
          <p className="text-2xl text-slate-400 mb-6">이니셔티브를 찾을 수 없습니다.</p>
          <Button onClick={() => navigate("/initiatives")} className="bg-[#0f2445] hover:bg-[#1a3a60] text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />{t('initiatives.backToList')}
          </Button>
        </div>
      </Layout>
    );
  }

  const rawContent = pickField(initiative, 'content', lang) || "";
  const contentLines = rawContent.split("\n").map(l => l.trim()).filter(Boolean);
  const isBulletList = contentLines.some(l => l.startsWith("•") || l.startsWith("-"));

  return (
    <Layout>
      <article className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button
            variant="ghost"
            className="mb-8 text-slate-500 hover:text-[#0f2445] hover:bg-slate-100 -ml-2"
            onClick={() => navigate("/initiatives")}
            data-testid="button-back-initiatives"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />{t('initiatives.backToList')}
          </Button>

          {initiative && (
            <>
              <div className="w-full max-h-96 aspect-16/9 overflow-hidden rounded-2xl mb-8 bg-slate-100 border border-slate-200">
                <img
                  src={initiative.image_url || ""}
                  alt={initiative.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="inline-flex items-center px-3 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold uppercase tracking-wider mb-4">
                {initiative.category}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-6 leading-snug">
                {pickField(initiative, 'title', lang)}
              </h1>

              {/* 개요 (Description Box) */}
              <div className="p-5 sm:p-6 bg-slate-50 rounded-xl border-l-4 border-[#0f2445] border-y border-r border-slate-200/80 mb-10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {lang === "ko" ? "사업 개요" : "Overview"}
                </h3>
                <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-medium">
                  {pickField(initiative, 'description', lang)}
                </p>
              </div>

              {/* 주요 과제 (Key Tasks) */}
              <div className="mb-12">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span>{lang === "ko" ? "주요 과제 및 실행 계획" : "Key Tasks & Action Plans"}</span>
                </h3>

                {isBulletList ? (
                  <div className="grid gap-3">
                    {contentLines.map((line, i) => {
                      const cleanText = line.replace(/^[•\-]\s*/, "");
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all"
                        >
                          <CheckCircle2 className="w-5 h-5 text-[#0f2445] shrink-0 mt-0.5" />
                          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                            {cleanText}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-4">
                    {contentLines.map((p, i) => (
                      <p key={i} className="text-sm sm:text-base text-slate-700 leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Related News */}
          <div className="border-t border-slate-200 pt-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">{t('initiatives.related')}</h2>

            {newsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200/70">
                <p className="text-slate-500 font-medium text-sm">{t('initiatives.relatedEmpty')}</p>
                <p className="text-xs text-slate-400 mt-1.5">관리자 패널에서 게시글 작성 시 이 분야를 선택하면 연동됩니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article) => {
                  const boardLabel = {
                    news: lang === "ko" ? "뉴스" : "News",
                    reports: lang === "ko" ? "보고서" : "Report",
                    diaspora: lang === "ko" ? "K-디아스포라" : "Diaspora",
                  }[article.board] || "Post";

                  return (
                    <div
                      key={article.id}
                      onClick={() => navigate(getPostRoute(article))}
                      className="flex items-center gap-4 bg-white border border-slate-200/90 rounded-xl p-4 hover:shadow-md hover:border-slate-400 transition-all cursor-pointer group"
                      data-testid={`row-related-news-${article.id}`}
                    >
                      <div className="w-28 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                        {article.image_url ? (
                          <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {boardLabel}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#0f2445] transition-colors line-clamp-1">
                          {pickField(article, 'title', lang)}
                        </h3>
                        <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 mt-1 leading-relaxed">
                          {pickField(article, 'excerpt', lang)}
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2 text-xs text-slate-400 min-w-[90px]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(article.published_date).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0f2445] shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex gap-3 justify-center">
            <Button
              className="bg-[#0f2445] hover:bg-[#1a3a60] text-white px-8 py-3 text-sm font-semibold rounded-lg shadow-sm"
              onClick={() => navigate("/contact")}
              data-testid="button-apply-now"
            >
              {t('initiatives.applyNow')}
            </Button>
          </div>
        </div>
      </article>
    </Layout>
  );
}

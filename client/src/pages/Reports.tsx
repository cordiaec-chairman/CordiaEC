import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, ImageIcon, FileDown, ChevronRight, Search, FileText } from "lucide-react";
import { getPosts } from "@/lib/queries";
import type { Post } from "@/lib/database.types";
import { useLang, useT, pickField } from "@/lib/i18n";

function buildPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

export default function Reports() {
  const { lang } = useLang();
  const t = useT();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["posts_reports", currentPage, limit, searchQuery],
    queryFn: () =>
      getPosts({
        board: "reports",
        page: currentPage,
        limit,
        search: searchQuery,
      }),
  });

  const reports: Post[] = reportsData?.posts || [];
  const total: number = reportsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageList = useMemo(() => buildPageList(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 bg-cordia-dark text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-cordia-teal mb-2">
            Intelligence & Research
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">{t("reports.heroTitle")}</h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl">{t("reports.heroDesc")}</p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="flex-1 relative">
              <Input
                placeholder={t("reports.searchPlaceholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchQuery(searchInput);
                    setCurrentPage(1);
                  }
                }}
                className="pl-10 h-11"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            </div>
            <Button
              onClick={() => {
                setSearchQuery(searchInput);
                setCurrentPage(1);
              }}
              className="bg-cordia-teal hover:bg-cordia-green text-white h-11 px-6"
            >
              {t("common.search")}
            </Button>
          </div>

          {/* Reports List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>{t("reports.empty")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report: Post) => (
                <div
                  key={report.id}
                  className="flex flex-col sm:flex-row gap-4 bg-white border border-gray-100 rounded-xl p-4 sm:p-5 hover:shadow-md hover:border-cordia-teal/30 transition-all group"
                  data-testid={`row-report-${report.id}`}
                >
                  <div
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="w-full sm:w-44 h-32 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center cursor-pointer"
                  >
                    {report.image_url ? (
                      <img
                        src={report.image_url}
                        alt={report.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                        <FileText className="w-8 h-8 text-cordia-teal/60 mb-1" />
                        <span className="text-[11px] font-semibold text-gray-500">Industry Report</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                          Research Brief
                        </span>
                      </div>
                      <h3
                        onClick={() => navigate(`/reports/${report.id}`)}
                        className="font-bold text-base sm:text-lg text-cordia-dark group-hover:text-cordia-teal transition-colors line-clamp-2 cursor-pointer"
                      >
                        {pickField(report, "title", lang)}
                      </h3>
                      <p
                        onClick={() => navigate(`/reports/${report.id}`)}
                        className="text-gray-600 text-xs sm:text-sm line-clamp-2 mt-1.5 cursor-pointer leading-relaxed"
                      >
                        {pickField(report, "excerpt", lang)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 mt-4 pt-3 border-t border-gray-50">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(report.published_date).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-2">
                        {report.file_url && (
                          <a
                            href={report.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-cordia-teal/10 text-cordia-teal hover:bg-cordia-teal hover:text-white rounded-lg font-medium transition-colors"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            PDF 다운로드
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/reports/${report.id}`)}
                          className="h-8 px-2.5 text-xs text-gray-600 hover:text-cordia-teal hover:bg-gray-50"
                        >
                          자세히 보기 <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !isLoading && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                {t("common.previous")}
              </Button>
              {pageList.map((page, idx) =>
                page === "..." ? (
                  <span key={idx} className="text-gray-400 px-1">
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page as number)}
                    className={
                      page === currentPage ? "bg-cordia-teal text-white hover:bg-cordia-green" : ""
                    }
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                {t("common.next")}
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

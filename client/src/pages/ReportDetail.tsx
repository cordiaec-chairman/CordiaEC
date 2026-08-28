import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, FileDown, ExternalLink, FileText } from "lucide-react";
import { getPost } from "@/lib/queries";
import type { Post } from "@/lib/database.types";
import { useLang, useT, pickField } from "@/lib/i18n";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default function ReportDetail() {
  const { lang } = useLang();
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: report, isLoading, isError } = useQuery<Post | null>({
    queryKey: ["post", id],
    queryFn: () => getPost(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="py-12 sm:py-16 container mx-auto px-4 max-w-3xl">
          <div className="h-8 bg-gray-200 rounded w-24 mb-6 animate-pulse" />
          <div className="h-56 bg-gray-200 rounded-xl mb-6 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !report) {
    return (
      <Layout>
        <div className="py-28 text-center">
          <p className="text-xl text-gray-400 mb-6">{t("common.notFound")}</p>
          <Button onClick={() => navigate("/reports")} className="bg-cordia-teal text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("reports.backToList")}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="py-10 sm:py-14 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <Button
            variant="ghost"
            className="mb-6 text-gray-500 hover:text-cordia-teal -ml-2 text-sm"
            onClick={() => navigate("/reports")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("reports.backToList")}
          </Button>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
              Industry Report
            </span>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(report.published_date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-cordia-dark mb-5 leading-tight">
            {pickField(report, "title", lang)}
          </h1>

          {report.image_url && (
            <img
              src={report.image_url}
              alt={report.title}
              className="w-full max-h-[420px] object-cover rounded-2xl mb-8 border border-gray-100 shadow-sm"
            />
          )}

          {report.excerpt && (
            <div className="p-4 bg-gray-50 border-l-4 border-slate-400 rounded-r-xl mb-8">
              <p className="text-sm sm:text-base text-gray-700 italic leading-relaxed">
                {pickField(report, "excerpt", lang)}
              </p>
            </div>
          )}

          <div className="mt-6">
            <MarkdownRenderer content={pickField(report, "content", lang)} />
          </div>

          {/* PDF Download Section (Bottom, Calm Slate/Navy Tone) */}
          {report.file_url && (
            <div className="mt-12 p-5 sm:p-6 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#0f2445] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {lang === "ko" ? "첨부 보고서 전문 (PDF)" : "Full PDF Report"}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 truncate mt-0.5">
                    {report.file_name || (lang === "ko" ? "보고서 전문 PDF 파일" : "Report PDF Document")}
                  </p>
                </div>
              </div>
              <a
                href={report.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0f2445] hover:bg-[#1a3a60] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs shrink-0"
              >
                <FileDown className="w-4 h-4" />
                {t("reports.downloadPdf")}
              </a>
            </div>
          )}

          {report.link_url && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-3">
              <a
                href={report.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-cordia-dark px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t("common.viewOriginal")}
              </a>
            </div>
          )}
        </div>
      </article>
    </Layout>
  );
}

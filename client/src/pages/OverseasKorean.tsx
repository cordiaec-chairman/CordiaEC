import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, ImageIcon, ExternalLink, ChevronRight, Search } from "lucide-react";
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

export default function OverseasKorean() {
  const { lang } = useLang();
  const t = useT();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ["posts_diaspora", currentPage, limit, searchQuery],
    queryFn: () =>
      getPosts({
        board: "diaspora",
        page: currentPage,
        limit,
        search: searchQuery,
      }),
  });

  const posts: Post[] = data?.posts || [];
  const total: number = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageList = useMemo(() => buildPageList(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 bg-cordia-dark text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-cordia-teal mb-2">
            Global Network
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">{t('diaspora.heroTitle')}</h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl">{t('diaspora.heroDesc')}</p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Input
                placeholder={t('diaspora.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchQuery(searchInput);
                    setCurrentPage(1);
                  }
                }}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            </div>
            <Button
              onClick={() => {
                setSearchQuery(searchInput);
                setCurrentPage(1);
              }}
              className="bg-cordia-teal hover:bg-cordia-green text-white"
            >
              {t('common.search')}
            </Button>
          </div>

          {/* Posts List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>{t('diaspora.empty')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post: Post) => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/overseas-korean/${post.id}`)}
                  className="flex gap-4 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-cordia-teal/30 transition-all cursor-pointer group"
                  data-testid={`row-diaspora-${post.id}`}
                >
                  <div className="w-40 h-28 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                    {post.image_url ? (
                      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-semibold text-cordia-dark group-hover:text-cordia-teal transition-colors line-clamp-2">
                        {pickField(post, 'title', lang)}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mt-2">
                        {pickField(post, 'excerpt', lang)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.published_date).toLocaleDateString()}
                      </span>
                      {post.link_url && (
                        <span className="flex items-center gap-1 text-cordia-teal">
                          <ExternalLink className="w-3 h-3" />
                          Link
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-cordia-teal shrink-0 self-center" />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !isLoading && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                {t('common.previous')}
              </Button>
              {pageList.map((page, idx) =>
                page === "..." ? (
                  <span key={idx} className="text-gray-400">
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    onClick={() => setCurrentPage(page as number)}
                    className={
                      page === currentPage
                        ? "bg-cordia-teal text-white hover:bg-cordia-green"
                        : ""
                    }
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, ChevronLeft, ChevronRight, Calendar, ExternalLink, X, Film } from "lucide-react";
import { getYoutubeVideos } from "@/lib/queries";
import { useLang, pickField } from "@/lib/i18n";
import type { YouTubeVideo } from "@/lib/database.types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export default function YouTubeShowcase() {
  const { lang } = useLang();
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["youtube_videos"],
    queryFn: () => getYoutubeVideos(false),
  });

  const scroll = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const amount = direction === "left" ? -320 : 320;
    sliderRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <section className="py-14 sm:py-20 bg-slate-900 text-white border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="h-8 w-48 bg-slate-800 rounded mb-8 animate-pulse" />
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 h-80 bg-slate-800 rounded-2xl animate-pulse" />
            <div className="lg:col-span-7 flex gap-4 overflow-hidden">
              <div className="w-64 h-80 bg-slate-800 rounded-2xl shrink-0 animate-pulse" />
              <div className="w-64 h-80 bg-slate-800 rounded-2xl shrink-0 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return null;
  }

  const [featuredVideo, ...remainingVideos] = videos;
  const featuredTitle = pickField(featuredVideo, "title", lang);
  const featuredSummary = pickField(featuredVideo, "summary", lang);

  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-[#0b172a] to-[#0f2445] text-white border-b border-slate-800 relative overflow-hidden">
      {/* Background subtle glow effect */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-teal-300 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2.5 border border-white/15">
              <Film className="w-3.5 h-3.5 text-teal-400" />
              <span>{lang === "ko" ? "미디어 & 영상 아카이브" : "Media & Archives"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {lang === "ko"
                ? "글로벌 한인 디아스포라 & K-학술 포럼"
                : "CordiaEC Media & Global Forum"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl">
              {lang === "ko"
                ? "인하 K-학술확산연구센터와 CordiaEC가 전하는 최신 세미나, 석학 대담 및 현장 영상입니다."
                : "Explore in-depth lectures, international symposiums, and leadership talks on the Korean diaspora."}
            </p>
          </div>

          {/* Navigation Arrows for remaining slider */}
          {remainingVideos.length > 0 && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => scroll("left")}
                aria-label="이전 영상"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/15 active:scale-95 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                aria-label="다음 영상"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/15 active:scale-95 shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Hybrid Layout: Left Featured Video + Right Horizontal Scroll Snap Track */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 1. Left Featured Hero Card (Approx 42% on desktop) */}
          <div className="lg:col-span-5 flex flex-col">
            <div
              onClick={() => setSelectedVideo(featuredVideo)}
              className="group flex-1 flex flex-col bg-slate-800/80 hover:bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/80 hover:border-teal-500/50 transition-all duration-300 cursor-pointer shadow-xl relative"
            >
              {/* Featured Video Thumbnail with Overlay */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img
                  src={`https://img.youtube.com/vi/${featuredVideo.video_id}/maxresdefault.jpg`}
                  onError={(e) => {
                    // Fallback to hqdefault if maxres doesn't exist
                    (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${featuredVideo.video_id}/hqdefault.jpg`;
                  }}
                  alt={featuredTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 transition-colors" />

                {/* Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white text-[11px] font-bold rounded-md shadow-md tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {lang === "ko" ? "최신 영상" : "LATEST"}
                </div>

                {/* Center Big Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-red-600 group-hover:bg-red-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
                    <Play className="w-6 h-6 ml-0.5 fill-current" />
                  </div>
                </div>
              </div>

              {/* Featured Video Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{featuredVideo.published_date}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-2 leading-snug">
                    {featuredTitle}
                  </h3>
                  {featuredSummary && (
                    <p className="text-xs sm:text-sm text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                      {featuredSummary}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-teal-400 group-hover:text-teal-300">
                  <span>{lang === "ko" ? "영상 재생하기" : "Watch Video"}</span>
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Right Horizontal Scroll-Snap Carousel (Approx 58% on desktop) */}
          <div className="lg:col-span-7 flex flex-col">
            {remainingVideos.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8 bg-slate-800/40 rounded-2xl border border-slate-700/50 text-slate-400 text-xs">
                {lang === "ko" ? "추가 영상이 준비 중입니다." : "More videos coming soon."}
              </div>
            ) : (
              <div
                ref={sliderRef}
                className="flex gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory hide-scrollbar"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {remainingVideos.map((video) => {
                  const title = pickField(video, "title", lang);
                  const summary = pickField(video, "summary", lang);

                  return (
                    <div
                      key={video.id}
                      onClick={() => setSelectedVideo(video)}
                      className="group snap-start shrink-0 w-[260px] sm:w-[280px] bg-slate-800/80 hover:bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/80 hover:border-teal-500/50 transition-all duration-300 cursor-pointer shadow-lg flex flex-col"
                    >
                      {/* Thumbnail with Play Icon on hover */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                        <img
                          src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/15 transition-colors" />

                        <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-red-600/90 group-hover:bg-red-600 text-white flex items-center justify-center shadow-md transform group-hover:scale-110 transition-all">
                            <Play className="w-4 h-4 ml-0.5 fill-current" />
                          </div>
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{video.published_date}</span>
                          </div>
                          <h4 className="text-xs sm:text-[13px] font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-2 leading-snug">
                            {title}
                          </h4>
                          {summary && (
                            <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                              {summary}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-medium text-slate-400 group-hover:text-teal-300">
                          <span>{lang === "ko" ? "시청하기" : "Watch"}</span>
                          <Play className="w-3 h-3 fill-current" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive YouTube Video Playback Lightbox Modal */}
      {selectedVideo && (
        <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl w-[94vw] p-0 overflow-hidden bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl text-white">
            <DialogTitle className="sr-only">
              {pickField(selectedVideo, "title", lang)}
            </DialogTitle>

            {/* Video Player Header */}
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-white truncate">
                  {pickField(selectedVideo, "title", lang)}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={selectedVideo.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <span>YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* 16:9 Iframe Player */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.video_id}?autoplay=1&rel=0`}
                title={pickField(selectedVideo, "title", lang)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {/* Summary & Metadata under player */}
            {pickField(selectedVideo, "summary", lang) && (
              <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{selectedVideo.published_date}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {pickField(selectedVideo, "summary", lang)}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

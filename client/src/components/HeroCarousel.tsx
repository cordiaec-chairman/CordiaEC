import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { getActiveHeroSlides, getSiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/queries";
import { useLang, pickField } from "@/lib/i18n";

export default function HeroCarousel() {
  const { lang } = useLang();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const { data: slides = [] } = useQuery({
    queryKey: ["hero_slides"],
    queryFn: getActiveHeroSlides,
  });

  const { data: settings = DEFAULT_SITE_SETTINGS } = useQuery({
    queryKey: ["site_settings"],
    queryFn: getSiteSettings,
  });

  const intervalSec = Math.max(2, parseInt(settings.hero_interval || "5", 10) || 5);
  const count = slides.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % Math.max(1, count)), [count]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + Math.max(1, count)) % Math.max(1, count)), [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(next, intervalSec * 1000);
    return () => clearInterval(t);
  }, [paused, count, intervalSec, next]);

  // 슬라이드 인덱스가 범위를 벗어나면 보정 (슬라이드 삭제 시)
  useEffect(() => {
    if (current >= count && count > 0) setCurrent(0);
  }, [count, current]);

  if (count === 0) return null;

  const slide = slides[Math.min(current, count - 1)];

  return (
    <section className="relative h-[440px] sm:h-[500px] lg:h-[540px] flex items-end overflow-hidden">
      {/* Slide images (cross-fade) */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
          style={{ backgroundImage: `url('${s.image_url}')`, opacity: i === Math.min(current, count - 1) ? 1 : 0 }}
        />
      ))}
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/25" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-10 sm:pb-14 pt-16">
        {/* Controls */}
        {count > 1 && (
          <div className="flex items-center gap-2 mb-4 text-white/90">
            <button
              onClick={prev}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Previous slide"
              data-testid="hero-prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPaused(!paused)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label={paused ? "Play" : "Pause"}
              data-testid="hero-pause"
            >
              {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={next}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Next slide"
              data-testid="hero-next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs tracking-widest ml-1 font-medium text-white/80" data-testid="hero-index">
              {Math.min(current, count - 1) + 1} / {count}
            </span>
          </div>
        )}

        {/* Text */}
        <div key={slide.id} className="page-enter max-w-3xl">
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight whitespace-pre-line drop-shadow-xs"
            data-testid="text-hero-title"
          >
            {pickField(slide, "headline", lang)}
          </h1>
          <div className="space-y-1">
            {pickField(slide, "sub_lines", lang).split("\n").map((line, i) =>
              line.trim() ? (
                <p key={i} className="text-xs sm:text-sm md:text-base text-white/90 leading-relaxed drop-shadow-xs">
                  {line.trim()}
                </p>
              ) : null
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

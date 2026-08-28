import { useQuery } from "@tanstack/react-query";
import { getActivePartners } from "@/lib/queries";
import { useT } from "@/lib/i18n";
import type { Partner } from "@/lib/database.types";

export default function PartnerBanner() {
  const t = useT();
  const { data: partners = [] } = useQuery({
    queryKey: ["active_partners"],
    queryFn: getActivePartners,
  });

  if (partners.length === 0) return null;

  // 무한 롤링을 위해 배열을 복제하여 2회 이상 연속 배치
  const displayPartners = [...partners, ...partners, ...partners];

  return (
    <section className="py-10 sm:py-14 bg-gray-50/80 border-t border-b border-gray-100 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-cordia-teal mb-1">
            Global Network & Collaboration
          </p>
          <h3 className="text-lg sm:text-xl font-bold text-cordia-dark">
            {t("home.partnersTitle")}
          </h3>
        </div>
      </div>

      {/* Infinite Rolling Marquee Container */}
      <div className="relative w-full overflow-hidden mask-fade-edges">
        <div className="flex gap-8 sm:gap-12 animate-marquee hover:[animation-play-state:paused] w-max py-2 items-center">
          {displayPartners.map((partner: Partner, idx: number) => {
            const content = (
              <div
                key={`${partner.id}-${idx}`}
                className="flex items-center justify-center h-14 sm:h-16 px-6 bg-white rounded-xl border border-gray-100/80 shadow-xs hover:shadow-md hover:border-cordia-teal/40 transition-all duration-300 group shrink-0 cursor-pointer"
                title={partner.name}
              >
                <img
                  src={partner.logo_url}
                  alt={partner.name}
                  className="max-h-8 sm:max-h-10 max-w-[140px] sm:max-w-[160px] object-contain filter grayscale opacity-75 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                  loading="lazy"
                />
              </div>
            );

            if (partner.link_url) {
              return (
                <a
                  key={`${partner.id}-${idx}`}
                  href={partner.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block shrink-0"
                >
                  {content}
                </a>
              );
            }

            return <div key={`${partner.id}-${idx}`} className="shrink-0">{content}</div>;
          })}
        </div>
      </div>
    </section>
  );
}

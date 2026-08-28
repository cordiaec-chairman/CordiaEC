import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { getInitiatives } from "@/lib/queries";
import type { Initiative } from "@/lib/database.types";
import { useLang, useT, pickField } from "@/lib/i18n";

export default function Initiatives() {
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const t = useT();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const { data: initiatives = [] } = useQuery({
    queryKey: ["initiatives"],
    queryFn: getInitiatives,
  });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 bg-[#0f2445] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-300 mb-2">
            Focus Areas
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 text-white">
            {t('initiatives.title')}
          </h1>
          <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed">
            {t('initiatives.desc')}
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initiatives.map((init: Initiative) => (
              <Card
                key={init.slug}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-slate-400 transition-all duration-300 cursor-pointer group flex flex-col"
                onClick={() => navigate(`/initiatives/${init.slug}`)}
                data-testid={`card-initiative-${init.slug}`}
              >
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="w-full h-48 mb-5 rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={init.image_url || ""}
                      alt={init.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="inline-flex self-start items-center px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2.5">
                    {init.category}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2.5 group-hover:text-[#0f2445] transition-colors leading-snug">
                    {pickField(init, 'title', lang)}
                  </h3>
                  <p className="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
                    {pickField(init, 'description', lang)}
                  </p>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-auto">
                    <span className="text-sm text-[#0f2445] font-semibold group-hover:underline">
                      {t('common.learnMore')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#0f2445] group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

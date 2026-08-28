import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, Youtube, Instagram, ChevronDown, FileText, Compass } from "lucide-react";
import { useLang, useT } from "@/lib/i18n";
import { getSiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/queries";
import logoIcon from "@assets/Icon_png_2-removebg-preview_1754497111079.png";
import logoText from "@assets/headline_1754497111077.png";

interface LayoutProps {
  children: React.ReactNode;
}

/** X (구 Twitter) 커스텀 SVG 아이콘 */
function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileResearchOpen, setMobileResearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { lang, setLang } = useLang();
  const t = useT();

  const { data: settings = DEFAULT_SITE_SETTINGS } = useQuery({
    queryKey: ["site_settings"],
    queryFn: getSiteSettings,
  });

  const isResearchActive = location.startsWith("/reports") || location.startsWith("/overseas-korean");

  const LangToggle = (
    <div className="flex items-center gap-1.5 text-xs font-semibold">
      <Globe className="w-3.5 h-3.5 text-slate-400" />
      <button
        onClick={() => setLang("ko")}
        className={`transition-colors ${
          lang === "ko" ? "text-[#0f2445] font-bold" : "text-slate-400 hover:text-slate-700"
        }`}
        data-testid="lang-ko"
      >
        KOR
      </button>
      <span className="text-slate-300">|</span>
      <button
        onClick={() => setLang("en")}
        className={`transition-colors ${
          lang === "en" ? "text-[#0f2445] font-bold" : "text-slate-400 hover:text-slate-700"
        }`}
        data-testid="lang-en"
      >
        ENG
      </button>
    </div>
  );

  const SnsLinks = ({
    size = "md",
    direction = "row",
  }: {
    size?: "sm" | "md" | "lg";
    direction?: "row" | "col";
  }) => {
    const youtube = settings?.sns_youtube || "https://www.youtube.com/@inhak-academy2859";
    const instagram = settings?.sns_instagram || "https://www.instagram.com/cordiaec/";
    const xLink = settings?.sns_x || "https://x.com/Cordia_EC";

    const badgeSizes = {
      sm: "w-8 h-8",
      md: "w-9 h-9 sm:w-10 sm:h-10",
      lg: "w-11 h-11",
    }[size];

    const iconSizes = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    }[size];

    return (
      <div className={`flex ${direction === "col" ? "flex-col items-center gap-2" : "items-center gap-2.5 sm:gap-3 flex-wrap"}`}>
        {youtube && (
          <a
            href={youtube}
            target="_blank"
            rel="noopener noreferrer"
            className={`group inline-flex items-center justify-center ${badgeSizes} rounded-full bg-[#FF0000] text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/40 hover:scale-110 active:scale-95 transition-all duration-200`}
            title="YouTube"
            aria-label="CordiaEC YouTube"
          >
            <Youtube className={iconSizes} />
          </a>
        )}
        {instagram && (
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={`group inline-flex items-center justify-center ${badgeSizes} rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md shadow-pink-500/25 hover:shadow-lg hover:shadow-pink-500/40 hover:scale-110 active:scale-95 transition-all duration-200`}
            title="Instagram"
            aria-label="CordiaEC Instagram"
          >
            <Instagram className={iconSizes} />
          </a>
        )}
        {xLink && (
          <a
            href={xLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`group inline-flex items-center justify-center ${badgeSizes} rounded-full bg-[#0a0f18] hover:bg-black text-white shadow-md shadow-slate-900/30 hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 border border-slate-700/60`}
            title="X (구 Twitter)"
            aria-label="CordiaEC X"
          >
            <XIcon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
          </a>
        )}
      </div>
    );
  };

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  };

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const footerLinks = [
    { name: t("nav.about"), href: "/about" },
    { name: t("nav.initiatives"), href: "/initiatives" },
    { name: t("nav.reports"), href: "/reports" },
    { name: t("nav.diaspora"), href: "/overseas-korean" },
    { name: t("nav.news"), href: "/news" },
    { name: t("nav.contact"), href: "/contact" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 text-[15px]">
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-50 shadow-2xs">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer" data-testid="logo">
                <img src={logoIcon} alt="CordiaEC Icon" className="h-10 w-auto object-contain shrink-0" style={{ height: "40px", maxHeight: "40px", width: "auto" }} />
                <img src={logoText} alt="CordiaEC" className="h-7.5 w-auto hidden sm:block object-contain shrink-0" style={{ height: "30px", maxHeight: "30px", width: "auto" }} />
              </div>
            </Link>

            <div className="hidden lg:flex items-center space-x-7">
              <Link href="/">
                <span className={`text-sm transition-colors duration-150 cursor-pointer ${isActive("/") ? "text-[#0f2445] font-bold" : "text-slate-600 hover:text-[#0f2445] font-medium"}`} data-testid="nav-/">{t("nav.home")}</span>
              </Link>
              <Link href="/about">
                <span className={`text-sm transition-colors duration-150 cursor-pointer ${isActive("/about") ? "text-[#0f2445] font-bold" : "text-slate-600 hover:text-[#0f2445] font-medium"}`} data-testid="nav-/about">{t("nav.about")}</span>
              </Link>
              <Link href="/initiatives">
                <span className={`text-sm transition-colors duration-150 cursor-pointer ${isActive("/initiatives") ? "text-[#0f2445] font-bold" : "text-slate-600 hover:text-[#0f2445] font-medium"}`} data-testid="nav-/initiatives">{t("nav.initiatives")}</span>
              </Link>

              <div className="relative py-4" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <button
                  className={`flex items-center gap-1.5 text-sm transition-colors duration-150 cursor-pointer outline-none ${isResearchActive ? "text-[#0f2445] font-bold" : "text-slate-600 hover:text-[#0f2445] font-medium"}`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  data-testid="nav-dropdown-research"
                >
                  <span>{t("nav.research_trends")}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? "rotate-180 text-[#0f2445]" : "text-slate-400"}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-72 bg-white rounded-xl shadow-xl border border-slate-200/90 py-2 px-1.5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                    <Link href="/reports">
                      <div className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${location.startsWith("/reports") ? "bg-slate-50 text-[#0f2445]" : "hover:bg-slate-50 text-slate-700 hover:text-[#0f2445]"}`} onClick={() => setDropdownOpen(false)}>
                        <div className="p-2 rounded-md bg-slate-100 text-[#0f2445] shrink-0 mt-0.5"><FileText className="w-4 h-4" /></div>
                        <div><div className="text-sm font-semibold leading-tight">{t("nav.reports")}</div><div className="text-[11px] text-slate-500 mt-1 leading-snug">{t("nav.reports_desc")}</div></div>
                      </div>
                    </Link>
                    <div className="my-1 border-t border-slate-100" />
                    <Link href="/overseas-korean">
                      <div className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${location.startsWith("/overseas-korean") ? "bg-slate-50 text-[#0f2445]" : "hover:bg-slate-50 text-slate-700 hover:text-[#0f2445]"}`} onClick={() => setDropdownOpen(false)}>
                        <div className="p-2 rounded-md bg-slate-100 text-[#0f2445] shrink-0 mt-0.5"><Compass className="w-4 h-4" /></div>
                        <div><div className="text-sm font-semibold leading-tight">{t("nav.diaspora")}</div><div className="text-[11px] text-slate-500 mt-1 leading-snug">{t("nav.diaspora_desc")}</div></div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/news">
                <span className={`text-sm transition-colors duration-150 cursor-pointer ${isActive("/news") ? "text-[#0f2445] font-bold" : "text-slate-600 hover:text-[#0f2445] font-medium"}`} data-testid="nav-/news">{t("nav.news")}</span>
              </Link>
              <Link href="/contact">
                <span className={`text-sm transition-colors duration-150 cursor-pointer ${isActive("/contact") ? "text-[#0f2445] font-bold" : "text-slate-600 hover:text-[#0f2445] font-medium"}`} data-testid="nav-/contact">{t("nav.contact")}</span>
              </Link>
              <div className="flex items-center pl-3 border-l border-slate-200">
                {LangToggle}
              </div>
            </div>

            <div className="lg:hidden flex items-center gap-2">
              {LangToggle}
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="button-mobile-menu" className="h-9 w-9 text-slate-700">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 shadow-lg animate-in fade-in duration-150">
            <div className="px-4 py-4 space-y-2">
              <Link href="/"><span className={`block text-sm cursor-pointer py-1.5 ${isActive("/") ? "text-[#0f2445] font-bold" : "text-slate-600 hover:text-[#0f2445] font-medium"}`} onClick={() => setMobileMenuOpen(false)}>{t("nav.home")}</span></Link>
              <Link href="/about"><span className={`block text-sm cursor-pointer py-1.5 ${isActive("/about") ? "text-[#0f2445] font-bold" : "text-slate-600 hover:text-[#0f2445] font-medium"}`} onClick={() => setMobileMenuOpen(false)}>{t("nav.about")}</span></Link>
              <Link href="/initiatives"><span className={`block text-sm cursor-pointer py-1.5 ${isActive("/initiatives") ? "text-[#0f2445] font-bold" : "text-slate-600 hover:text-[#0f2445] font-medium"}`} onClick={() => setMobileMenuOpen(false)}>{t("nav.initiatives")}</span></Link>
              
              <div className="border-y border-slate-100 py-1 my-1">
                <button onClick={() => setMobileResearchOpen(!mobileResearchOpen)} className={`w-full flex items-center justify-between py-1.5 text-sm font-medium ${isResearchActive ? "text-[#0f2445] font-bold" : "text-slate-700"}`}>
                  <span>{t("nav.research_trends")}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileResearchOpen ? "rotate-180 text-[#0f2445]" : "text-slate-400"}`} />
                </button>
                {mobileResearchOpen && (
                  <div className="pl-3 py-1 space-y-1 bg-slate-50 rounded-lg my-1">
                    <Link href="/reports"><span className="block text-xs py-1.5 text-slate-600 hover:text-[#0f2445]" onClick={() => setMobileMenuOpen(false)}>• {t("nav.reports")}</span></Link>
                    <Link href="/overseas-korean"><span className="block text-xs py-1.5 text-slate-600 hover:text-[#0f2445]" onClick={() => setMobileMenuOpen(false)}>• {t("nav.diaspora")}</span></Link>
                  </div>
                )}
              </div>

              <Link href="/news"><span className={`block text-sm cursor-pointer py-1.5 ${isActive("/news") ? "text-[#0f2445] font-bold" : "text-slate-600 hover:text-[#0f2445] font-medium"}`} onClick={() => setMobileMenuOpen(false)}>{t("nav.news")}</span></Link>
              <Link href="/contact"><span className={`block text-sm cursor-pointer py-1.5 ${isActive("/contact") ? "text-[#0f2445] font-bold" : "text-slate-600 hover:text-[#0f2445] font-medium"}`} onClick={() => setMobileMenuOpen(false)}>{t("nav.contact")}</span></Link>
              
              {/* 모바일 메뉴 하단 SNS 채널 박스 */}
              <div className="pt-3.5 mt-2 border-t border-slate-100">
                <div className="flex items-center justify-between p-3 bg-slate-50/90 rounded-2xl border border-slate-200/70">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Official Channels</span>
                    <span className="text-xs text-[#0f2445] font-semibold">공식 SNS 바로가기</span>
                  </div>
                  <SnsLinks size="sm" />
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 우측 화면 고정 플로팅 SNS 빠른 링크 바 (Desktop) */}
      <aside
        aria-label="Social Media Quick Links"
        className="fixed right-3.5 sm:right-5 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-2 z-40 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200/80 hover:shadow-2xl transition-all"
      >
        <div className="text-[10px] font-bold text-slate-400 text-center tracking-tighter pb-0.5 border-b border-slate-100">
          SNS
        </div>
        <div className="py-0.5">
          <SnsLinks size="sm" direction="col" />
        </div>
      </aside>

      <main className="pt-16">{children}</main>

      <footer className="bg-[#0f2445] text-white py-12 sm:py-14 border-t border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 sm:gap-10">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={logoIcon} alt="CordiaEC Icon" className="h-8 w-auto object-contain shrink-0" style={{ height: "32px", maxHeight: "32px", width: "auto" }} />
                <img src={logoText} alt="CordiaEC" className="h-6 w-auto brightness-0 invert object-contain shrink-0" style={{ height: "24px", maxHeight: "24px", width: "auto" }} />
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed max-w-sm">{t("footer.tagline")}</p>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Official Channels
                </p>
                <SnsLinks size="md" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 text-slate-200">{t("footer.quickLinks")}</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                {footerLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}><span className="text-slate-300 hover:text-white transition-colors cursor-pointer">{item.name}</span></Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 text-slate-200">{t("footer.contactInfo")}</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-1.5">
                  <span>Email:</span>
                  <a href="mailto:cordiaec@gmail.com" className="hover:text-white transition-colors">
                    cordiaec@gmail.com
                  </a>
                </li>
                <li>Location: Incheon & Seoul, South Korea</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700/60 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 gap-3">
            <div>
              <p>©2025 CordiaEC. All rights reserved.</p>
            </div>
            <div className="flex space-x-5">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <Link href="/admin">
                <span className="hover:text-white transition-colors cursor-pointer" data-testid="link-admin">
                  Admin
                </span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

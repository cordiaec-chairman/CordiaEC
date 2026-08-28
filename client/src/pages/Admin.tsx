import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Lock, FileText, Layers, History, LayoutGrid, Mail, LogOut, Images, Megaphone, Handshake } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import AdminPostsTab from "@/components/admin/AdminPostsTab";
import AdminInitiativesTab from "@/components/admin/AdminInitiativesTab";
import AdminMilestonesTab from "@/components/admin/AdminMilestonesTab";
import AdminHomeSettingsTab from "@/components/admin/AdminHomeSettingsTab";
import AdminContactsTab from "@/components/admin/AdminContactsTab";
import AdminHeroTab from "@/components/admin/AdminHeroTab";
import AdminPopupsTab from "@/components/admin/AdminPopupsTab";
import AdminPartnersTab from "@/components/admin/AdminPartnersTab";

const MENU = [
  { id: "posts", label: "게시글/보고서", icon: FileText },
  { id: "partners", label: "협력사", icon: Handshake },
  { id: "hero", label: "히어로", icon: Images },
  { id: "popups", label: "팝업", icon: Megaphone },
  { id: "initiatives", label: "이니셔티브", icon: Layers },
  { id: "milestones", label: "연혁", icon: History },
  { id: "home", label: "홈/SNS 설정", icon: LayoutGrid },
  { id: "contacts", label: "문의함", icon: Mail },
] as const;

type MenuId = (typeof MENU)[number]["id"];

export default function Admin() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [active, setActive] = useState<MenuId>("posts");

  const handleLogout = async () => {
    localStorage.removeItem("test_admin_auth");
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <AdminLoginForm />;
  }

  return (
    <Layout>
      <div className="py-10 bg-gray-50 min-h-[85vh]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Sidebar */}
            <aside className="w-full md:w-60 shrink-0 md:sticky md:top-24">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-5 border-b border-slate-800 bg-[#0f2445] text-white">
                  <h1 className="text-base font-bold flex items-center gap-2 text-white">
                    <div className="w-6 h-6 rounded-md bg-white/15 text-white flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    CordiaEC Admin
                  </h1>
                  <p className="text-[11px] text-slate-300 mt-1 truncate">{user.email}</p>
                </div>
                <nav className="p-3 flex md:flex-col gap-1 overflow-x-auto">
                  {MENU.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActive(item.id)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap md:w-full text-left ${
                          isActive
                            ? "bg-[#0f2445] text-white shadow-sm font-bold"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                        data-testid={`menu-${item.id}`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span className={isActive ? "text-white font-bold" : "text-slate-700"}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </nav>
                <div className="p-3 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    로그아웃
                  </button>
                </div>
              </div>
            </aside>

            {/* Content */}
            <section className="flex-1 min-w-0 w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {active === "posts" && <AdminPostsTab />}
              {active === "partners" && <AdminPartnersTab />}
              {active === "hero" && <AdminHeroTab />}
              {active === "popups" && <AdminPopupsTab />}
              {active === "initiatives" && <AdminInitiativesTab />}
              {active === "milestones" && <AdminMilestonesTab />}
              {active === "home" && <AdminHomeSettingsTab />}
              {active === "contacts" && <AdminContactsTab />}
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}

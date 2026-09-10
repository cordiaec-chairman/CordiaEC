import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Sparkles, Loader2, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getInitiatives, updateInitiative, translateTexts } from "@/lib/queries";
import type { Initiative } from "@/lib/database.types";

export default function AdminInitiativesTab() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Initiative | null>(null);
  const [activeLangTab, setActiveLangTab] = useState<"ko" | "en">("ko");

  const [form, setForm] = useState({
    title: "",
    label: "",
    category: "",
    description: "",
    content: "",
    titleKo: "",
    descriptionKo: "",
    contentKo: "",
    imageUrl: "",
  });
  const [translating, setTranslating] = useState(false);

  const handleTranslateKoToEn = async () => {
    const src = [form.titleKo || form.label, form.descriptionKo, form.contentKo];
    if (!src.some((t) => t.trim())) {
      toast({ title: "번역할 국문 내용이 없습니다.", variant: "destructive" });
      return;
    }
    setTranslating(true);
    try {
      const [title, description, content] = await translateTexts(src.map((t) => t || " "), "EN-US");
      setForm((f) => ({
        ...f,
        title: (f.titleKo.trim() || f.label.trim()) ? title.trim() : f.title,
        description: f.descriptionKo.trim() ? description.trim() : f.description,
        content: f.contentKo.trim() ? content.trim() : f.content,
      }));
      toast({ title: "영문 번역 완료", description: "영문 탭에 번역 내용이 반영되었습니다." });
    } catch (err: any) {
      toast({ title: "번역 실패", description: err.message, variant: "destructive" });
    } finally {
      setTranslating(false);
    }
  };

  const handleTranslateEnToKo = async () => {
    const src = [form.title, form.description, form.content];
    if (!src.some((t) => t.trim())) {
      toast({ title: "번역할 영문 내용이 없습니다.", variant: "destructive" });
      return;
    }
    setTranslating(true);
    try {
      const [titleKo, descriptionKo, contentKo] = await translateTexts(src.map((t) => t || " "), "KO");
      setForm((f) => ({
        ...f,
        titleKo: f.title.trim() ? titleKo.trim() : f.titleKo,
        label: f.label.trim() ? f.label : (f.title.trim() ? titleKo.trim() : f.label),
        descriptionKo: f.description.trim() ? descriptionKo.trim() : f.descriptionKo,
        contentKo: f.content.trim() ? contentKo.trim() : f.contentKo,
      }));
      toast({ title: "국문 번역 완료", description: "국문 탭에 번역 내용이 반영되었습니다." });
    } catch (err: any) {
      toast({ title: "번역 실패", description: err.message, variant: "destructive" });
    } finally {
      setTranslating(false);
    }
  };

  const { data: initiatives = [] } = useQuery({
    queryKey: ["initiatives"],
    queryFn: getInitiatives,
  });

  const openEdit = (init: Initiative) => {
    setEditing(init);
    setForm({
      title: init.title || "",
      label: init.label || "",
      category: init.category || "",
      description: init.description || "",
      content: init.content || "",
      titleKo: init.title_ko || "",
      descriptionKo: init.description_ko || "",
      contentKo: init.content_ko || "",
      imageUrl: init.image_url || "",
    });
    setActiveLangTab("ko");
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const finalTitleKo = form.titleKo.trim() || form.label.trim() || form.title.trim();
      const finalTitle = form.title.trim() || finalTitleKo;
      const finalLabel = form.label.trim() || finalTitleKo;

      await updateInitiative(editing.slug, {
        title: finalTitle,
        label: finalLabel,
        category: form.category,
        description: form.description,
        content: form.content,
        title_ko: finalTitleKo,
        description_ko: form.descriptionKo.trim() || null,
        content_ko: form.contentKo.trim() || null,
        image_url: form.imageUrl.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      setFormOpen(false);
      toast({ title: "수정 완료", description: "이니셔티브 정보가 업데이트되었습니다." });
    },
    onError: (err: any) => {
      toast({
        title: "오류",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-cordia-dark mb-1">이니셔티브 관리</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            6대 핵심 사업 분야 정보를 수정할 수 있습니다. 카드를 클릭하면 즉시 수정 창이 열립니다.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initiatives.map((init) => (
          <Card
            key={init.slug}
            onClick={() => openEdit(init)}
            className="border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-400 transition-all cursor-pointer group"
          >
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                {init.image_url && (
                  <div className="w-full h-32 overflow-hidden rounded-lg mb-3 bg-slate-100">
                    <img
                      src={init.image_url}
                      alt={init.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                    {init.display_order}번 • {init.category}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-0.5 group-hover:text-blue-700 transition-colors">
                  {init.title_ko || init.label || init.title}
                </h3>
                {init.title && (
                  <p className="text-xs text-slate-400 font-medium mb-2">{init.title}</p>
                )}
                <p className="text-xs text-slate-600 line-clamp-2 mb-3.5 leading-relaxed">
                  {init.description_ko || init.description}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(init);
                }}
                className="w-full text-xs font-semibold mt-auto group-hover:bg-slate-50"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                수정
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>이니셔티브 수정: {editing?.title_ko || editing?.label || editing?.title}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Bilingual Studio Switcher with Auto-Translate */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5 p-0.5 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveLangTab("ko")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeLangTab === "ko"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>🇰🇷 한국어</span>
                  {(form.titleKo || form.label) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLangTab("en")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeLangTab === "en"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>🇺🇸 English</span>
                  {form.title && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </button>
              </div>

              {activeLangTab === "ko" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTranslateKoToEn}
                  disabled={translating || (!form.titleKo.trim() && !form.label.trim())}
                  className="h-8 px-2.5 text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 flex items-center gap-1.5 rounded-lg"
                >
                  {translating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>영문으로 자동 번역</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTranslateEnToKo}
                  disabled={translating || !form.title.trim()}
                  className="h-8 px-2.5 text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 flex items-center gap-1.5 rounded-lg"
                >
                  {translating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>국문으로 자동 번역</span>
                </Button>
              )}
            </div>

            {/* Korean Tab Panel */}
            {activeLangTab === "ko" && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1 block">
                      제목 (국문) *
                    </Label>
                    <Input
                      value={form.titleKo}
                      onChange={(e) => setForm({ ...form, titleKo: e.target.value })}
                      placeholder="예: 글로벌 코리안 연결"
                      className="text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1 block">
                      홈 화면 카드 라벨 (국문 짧은 명칭)
                    </Label>
                    <Input
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="홈 6개 카드에 표시될 라벨"
                      className="text-xs rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">
                    사업 개요 설명 (국문)
                  </Label>
                  <Textarea
                    rows={2}
                    value={form.descriptionKo}
                    onChange={(e) => setForm({ ...form, descriptionKo: e.target.value })}
                    placeholder="상세 페이지 상단 개요 박스에 노출될 설명..."
                    className="text-xs rounded-xl leading-relaxed"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">
                    주요 과제 및 실행 계획 (국문, • 불릿 기호 지원)
                  </Label>
                  <Textarea
                    rows={5}
                    value={form.contentKo}
                    onChange={(e) => setForm({ ...form, contentKo: e.target.value })}
                    placeholder="• 첫 번째 주요 과제&#10;• 두 번째 주요 과제"
                    className="text-xs rounded-xl leading-relaxed font-mono"
                  />
                </div>
              </div>
            )}

            {/* English Tab Panel */}
            {activeLangTab === "en" && (
              <div className="space-y-3.5">
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">
                    Title (English) *
                  </Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Global Korean Connection"
                    className="text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">
                    Overview (English)
                  </Label>
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description displayed on English views..."
                    className="text-xs rounded-xl leading-relaxed"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-1 block">
                    Key Tasks & Action Plans (English)
                  </Label>
                  <Textarea
                    rows={5}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="• Action item 1&#10;• Action item 2"
                    className="text-xs rounded-xl leading-relaxed font-mono"
                  />
                </div>
              </div>
            )}

            {/* Shared Common Fields */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1 block">
                  분야 (Category)
                </Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="예: Global Network, K-Economy"
                  className="text-xs rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1 block">
                  대표 이미지 URL
                </Label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-3">
            <Button variant="outline" onClick={() => setFormOpen(false)} className="text-xs">
              취소
            </Button>
            <Button
              className="bg-[#0f2445] hover:bg-[#1a3a60] text-white text-xs font-semibold"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

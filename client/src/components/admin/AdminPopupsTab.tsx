import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash2,
  CalendarRange,
  Move,
  Sparkles,
  Loader2,
  Globe,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PopupPositionEditor from "@/components/admin/PopupPositionEditor";
import {
  getAllPopups,
  createPopup,
  updatePopup,
  deletePopup,
  uploadImage,
  deleteImage,
  translateTexts,
} from "@/lib/queries";
import type { Popup, PopupPosition, PopupTargetLang } from "@/lib/database.types";

const POSITION_LABELS: Record<PopupPosition, string> = {
  center: "중앙",
  "top-left": "좌측 상단",
  "top-right": "우측 상단",
  "bottom-left": "좌측 하단",
  "bottom-right": "우측 하단",
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function popupStatus(p: Popup): { label: string; cls: string } {
  const now = new Date();
  if (!p.is_active) return { label: "비활성", cls: "bg-gray-100 text-gray-500" };
  if (new Date(p.starts_at) > now) return { label: "게시 예정", cls: "bg-amber-100 text-amber-700" };
  if (new Date(p.ends_at) < now) return { label: "기간 종료", cls: "bg-gray-100 text-gray-500" };
  return { label: "게시 중", cls: "bg-green-100 text-green-700" };
}

function langBadge(lang?: PopupTargetLang) {
  if (lang === "ko") {
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0 flex items-center gap-1">
        <span>🇰🇷</span> 한국어 전용
      </span>
    );
  }
  if (lang === "en") {
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0 flex items-center gap-1">
        <span>🇺🇸</span> 영어 전용
      </span>
    );
  }
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0 flex items-center gap-1">
      <Globe className="w-3 h-3 text-slate-400" /> 공통 노출
    </span>
  );
}

export default function AdminPopupsTab() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Popup | null>(null);
  const [uploading, setUploading] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [formTranslating, setFormTranslating] = useState(false);

  // 언어별 탭 필터: all_views (전체보기), ko (한국어), en (영어), all (공통)
  const [langFilter, setLangFilter] = useState<"all_views" | "ko" | "en" | "all">("all_views");

  const defaultForm = (initialLang: PopupTargetLang = "all") => {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    return {
      title: "",
      content: "",
      imageUrl: "",
      linkUrl: "",
      targetLang: initialLang,
      position: "center" as PopupPosition,
      width: "380",
      posX: 50,
      posY: 25,
      startsAt: toLocalInput(now.toISOString()),
      endsAt: toLocalInput(weekLater.toISOString()),
    };
  };
  const [form, setForm] = useState(defaultForm());

  const { data: popups = [] } = useQuery({
    queryKey: ["admin_popups"],
    queryFn: getAllPopups,
  });

  const openCreate = (targetLang: PopupTargetLang = langFilter === "ko" ? "ko" : langFilter === "en" ? "en" : "all") => {
    setForm(defaultForm(targetLang));
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (p: Popup) => {
    setEditing(p);
    setForm({
      title: p.title,
      content: p.content,
      imageUrl: p.image_url || "",
      linkUrl: p.link_url || "",
      targetLang: p.target_lang || "all",
      position: p.position,
      width: String(p.width),
      posX: p.pos_x ?? 50,
      posY: p.pos_y ?? 25,
      startsAt: toLocalInput(p.starts_at),
      endsAt: toLocalInput(p.ends_at),
    });
    setFormOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
      toast({ title: "이미지 업로드 완료" });
    } catch (err: any) {
      toast({ title: "업로드 실패", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // 팝업 복제 및 DeepL 번역 초안 생성
  const handleDuplicateAndTranslate = async (sourcePopup: Popup) => {
    const isKo = sourcePopup.target_lang === "ko" || (!sourcePopup.target_lang && /[가-힣]/.test(sourcePopup.title));
    const targetOppositeLang: PopupTargetLang = isKo ? "en" : "ko";
    const targetOppositeName = isKo ? "영어(ENG)" : "한국어(KOR)";

    const confirmMsg = `현재 팝업 [${sourcePopup.title}]을 바탕으로\n[${targetOppositeName} 전용 팝업] 초안을 새로 생성하시겠습니까?\n\n• 제목/문구가 DeepL을 통해 번역 초안으로 자동 입력됩니다.\n• 위치/크기/게시기간/링크가 그대로 복제되어 화면 레이아웃이 통일됩니다.\n• 생성 후 ${targetOppositeName} 전용 포스터 이미지를 올려주시면 완성됩니다.`;
    if (!window.confirm(confirmMsg)) return;

    setTranslatingId(sourcePopup.id);
    try {
      let translatedTitle = sourcePopup.title;
      let translatedContent = sourcePopup.content || "";

      const textsToTranslate: string[] = [];
      if (sourcePopup.title) textsToTranslate.push(sourcePopup.title);
      if (sourcePopup.content?.trim()) textsToTranslate.push(sourcePopup.content);

      const targetDeepLLang = targetOppositeLang === "ko" ? "KO" : "EN-US";
      if (textsToTranslate.length > 0) {
        toast({ title: "DeepL 번역 중...", description: `${targetOppositeName}로 초안을 자동 생성합니다.` });
        const translations = await translateTexts(textsToTranslate, targetDeepLLang);
        if (translations[0]) translatedTitle = translations[0];
        if (translations[1]) translatedContent = translations[1];
      }

      setEditing(null); // 신규 등록 모드
      setForm({
        title: translatedTitle,
        content: translatedContent,
        imageUrl: "", // 언어별 이미지가 다를 수 있으므로 비워서 새 이미지 등록 유도
        linkUrl: sourcePopup.link_url || "",
        targetLang: targetOppositeLang,
        position: sourcePopup.position,
        width: String(sourcePopup.width),
        posX: sourcePopup.pos_x ?? 50,
        posY: sourcePopup.pos_y ?? 25,
        startsAt: toLocalInput(sourcePopup.starts_at),
        endsAt: toLocalInput(sourcePopup.ends_at),
      });
      setFormOpen(true);
      toast({
        title: `${targetOppositeName} 팝업 초안 생성 완료!`,
        description: `번역된 문구를 확인하시고, ${targetOppositeName} 포스터 이미지를 업로드한 후 저장해주세요.`,
      });
    } catch (err: any) {
      toast({
        title: "자동 번역 실패",
        description: err.message || "DeepL 번역 중 오류가 발생했습니다. 직접 입력해주세요.",
        variant: "destructive",
      });
    } finally {
      setTranslatingId(null);
    }
  };

  // 모달 내 실시간 번역
  const handleModalTranslate = async () => {
    if (!form.title.trim() && !form.content.trim()) {
      toast({ title: "번역할 내용이 없습니다.", description: "제목이나 내용을 먼저 입력해주세요." });
      return;
    }
    setFormTranslating(true);
    try {
      const texts: string[] = [];
      if (form.title.trim()) texts.push(form.title);
      if (form.content.trim()) texts.push(form.content);

      // 번역 후 타겟 언어도 자동 토글
      const nextLang: PopupTargetLang = form.targetLang === "ko" ? "en" : form.targetLang === "en" ? "ko" : "en";
      const targetDeepLLang = nextLang === "ko" ? "KO" : "EN-US";

      const translations = await translateTexts(texts, targetDeepLLang);
      let newTitle = form.title;
      let newContent = form.content;
      let ptr = 0;
      if (form.title.trim()) newTitle = translations[ptr++] || form.title;
      if (form.content.trim()) newContent = translations[ptr++] || form.content;

      setForm((prev) => ({
        ...prev,
        title: newTitle,
        content: newContent,
        targetLang: nextLang,
      }));
      toast({ title: "DeepL 번역 완료", description: "문구가 번역되었으며 대상 언어가 전환되었습니다." });
    } catch (err: any) {
      toast({ title: "번역 실패", description: err.message, variant: "destructive" });
    } finally {
      setFormTranslating(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        title: form.title,
        content: form.content,
        image_url: form.imageUrl || null,
        link_url: form.linkUrl || null,
        position: form.position,
        width: Math.min(800, Math.max(240, parseInt(form.width, 10) || 380)),
        pos_x: form.posX,
        pos_y: form.posY,
        starts_at: new Date(form.startsAt).toISOString(),
        ends_at: new Date(form.endsAt).toISOString(),
        is_active: editing ? editing.is_active : true,
        target_lang: form.targetLang,
      };
      if (new Date(payload.ends_at) <= new Date(payload.starts_at)) {
        throw new Error("종료일시는 시작일시보다 뒤여야 합니다.");
      }
      if (editing) {
        await updatePopup(editing.id, payload);
      } else {
        await createPopup(payload as Omit<Popup, "id">);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setFormOpen(false);
      toast({ title: editing ? "수정 완료" : "팝업 등록 완료" });
    },
    onError: (err: any) => toast({ title: "오류", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (p: Popup) => {
      if (p.image_url?.includes("/post-images/")) {
        await deleteImage(p.image_url);
      }
      await deletePopup(p.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setDeleteTarget(null);
      toast({ title: "삭제 완료" });
    },
    onError: (err: any) => toast({ title: "오류", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updatePopup(id, { is_active: active }),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  // 언어별 필터링된 팝업 목록
  const filteredPopups = popups.filter((p) => {
    if (langFilter === "all_views") return true;
    if (langFilter === "all") return !p.target_lang || p.target_lang === "all";
    return p.target_lang === langFilter;
  });

  const countKo = popups.filter((p) => p.target_lang === "ko").length;
  const countEn = popups.filter((p) => p.target_lang === "en").length;
  const countAll = popups.filter((p) => !p.target_lang || p.target_lang === "all").length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="text-xl font-bold text-cordia-dark">팝업 안내창 관리 ({popups.length})</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            홈 화면에 띄울 안내 팝업을 관리합니다. 한국어/영어 사이트별로 각각 다른 포스터나 공지를 분리 운영할 수 있습니다.
          </p>
        </div>
        <Button onClick={() => openCreate()} className="bg-[#0f2445] hover:bg-[#1a3a60] text-white font-medium shrink-0">
          <Plus className="w-4 h-4 mr-2" />새 팝업 등록
        </Button>
      </div>

      {/* 언어별 탭 필터 */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-5 border-b border-slate-200/80 pb-2.5 overflow-x-auto">
        <button
          onClick={() => setLangFilter("all_views")}
          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
            langFilter === "all_views"
              ? "bg-[#0f2445] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          전체 ({popups.length})
        </button>
        <button
          onClick={() => setLangFilter("ko")}
          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            langFilter === "ko"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>🇰🇷</span> 한국어 전용 ({countKo})
        </button>
        <button
          onClick={() => setLangFilter("en")}
          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            langFilter === "en"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>🇺🇸</span> 영어 전용 ({countEn})
        </button>
        <button
          onClick={() => setLangFilter("all")}
          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            langFilter === "all"
              ? "bg-slate-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> 공통 노출 ({countAll})
        </button>
      </div>

      {/* 팝업 목록 카드 */}
      <div className="space-y-3">
        {filteredPopups.map((p) => {
          const status = popupStatus(p);
          const isKo = p.target_lang === "ko" || (!p.target_lang && /[가-힣]/.test(p.title));
          const oppositeTarget = isKo ? "영문" : "국문";

          return (
            <Card key={p.id} className="border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-14 h-14 object-cover rounded-xl border border-slate-100 shrink-0 bg-slate-50" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-medium shrink-0 bg-slate-50">
                      텍스트
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${status.cls}`}>
                        {status.label}
                      </span>
                      {langBadge(p.target_lang)}
                      <Badge variant="outline" className="text-xs shrink-0">
                        {p.pos_x != null && p.pos_y != null
                          ? `${Math.round(p.pos_x)}%, ${Math.round(p.pos_y)}% · 폭 ${p.width}px`
                          : POSITION_LABELS[p.position]}
                      </Badge>
                    </div>

                    <p className="font-bold text-sm text-slate-900 truncate">{p.title}</p>
                    {p.content && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{p.content}</p>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <CalendarRange className="w-3 h-3" />
                      {new Date(p.starts_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                      {" ~ "}
                      {new Date(p.ends_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </div>
                </div>

                {/* 우측 조작 버튼 그룹 */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* DeepL 반대 언어 팝업 초안 자동 생성 버튼 */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 text-xs font-semibold gap-1.5 h-8 px-2.5"
                    title={`이 팝업을 바탕으로 ${oppositeTarget} 전용 팝업 초안을 자동 번역 생성합니다.`}
                    disabled={translatingId === p.id}
                    onClick={() => handleDuplicateAndTranslate(p)}
                  >
                    {translatingId === p.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                    <span>{oppositeTarget} 팝업 초안 생성</span>
                  </Button>

                  <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: p.id, active: checked })}
                      title={p.is_active ? "클릭 시 비활성화" : "클릭 시 활성화"}
                    />
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(p)} title="수정">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteTarget(p)}
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredPopups.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            {langFilter === "all_views"
              ? "등록된 팝업이 없습니다."
              : `${langFilter === "ko" ? "한국어 전용" : langFilter === "en" ? "영어 전용" : "공통"} 팝업이 없습니다.`}
          </div>
        )}
      </div>

      {/* 등록 및 수정 다이얼로그 */}
      <Dialog open={formOpen && !editorOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editing ? "팝업 수정" : "새 팝업 등록"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. 노출 대상 언어 선택 (핵심) */}
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
                노출 대상 언어 *
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, targetLang: "all" })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    form.targetLang === "all"
                      ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  🌐 한/영 공통
                  <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                    전체 방문자에게 표시
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, targetLang: "ko" })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    form.targetLang === "ko"
                      ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  🇰🇷 한국어 전용
                  <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                    국문 사이트(KOR)만 표시
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, targetLang: "en" })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    form.targetLang === "en"
                      ? "border-purple-600 bg-purple-600 text-white shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  🇺🇸 영어 전용
                  <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                    영문 사이트(ENG)만 표시
                  </span>
                </button>
              </div>
            </div>

            {/* 2. 제목 & DeepL 번역 버튼 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-bold text-slate-700">제목 *</Label>
                <button
                  type="button"
                  onClick={handleModalTranslate}
                  disabled={formTranslating || (!form.title && !form.content)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 disabled:opacity-40"
                >
                  {formTranslating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  )}
                  <span>DeepL로 반대 언어 번역</span>
                </button>
              </div>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={form.targetLang === "en" ? "e.g. 2026 Global Summit Registration Guide" : "예: 2026 글로벌 서밋 참가 신청 안내"}
                className="h-10 text-sm"
              />
            </div>

            {/* 3. 본문 내용 */}
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
                안내 내용 (선택사항)
              </Label>
              <Textarea
                rows={3}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="팝업 하단에 표시할 설명 문구 (포스터 이미지만 사용하는 경우 비워두셔도 됩니다)"
                className="text-sm"
              />
            </div>

            {/* 4. 이미지 포스터 업로드 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  팝업 이미지 포스터 (선택사항)
                </Label>
                <span className="text-[11px] text-slate-400">
                  {form.targetLang === "en" ? "영문 전용 포스터 업로드 권장" : form.targetLang === "ko" ? "국문 전용 포스터 업로드 권장" : "공통 포스터 업로드"}
                </span>
              </div>

              {form.imageUrl ? (
                <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <img src={form.imageUrl} alt="preview" className="w-full max-h-56 object-contain" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, imageUrl: "" })}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md transition-colors"
                    title="이미지 제거"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-full h-28 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  <span className="text-xs text-slate-500 font-medium">
                    {uploading ? "업로드 중..." : "클릭하여 이미지 파일 업로드 (PNG, JPG, WebP)"}
                  </span>
                </label>
              )}
            </div>

            {/* 5. 클릭 링크 */}
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
                클릭 시 이동할 링크 URL (선택사항)
              </Label>
              <Input
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="https://... 또는 /news, /reports"
                className="h-10 text-sm"
              />
            </div>

            {/* 6. 위치 / 크기 조정 */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <Label className="text-xs font-bold text-slate-800 mb-1.5 block">
                화면 위치 및 크기
              </Label>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-semibold"
                  onClick={() => setEditorOpen(true)}
                >
                  <Move className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  마우스로 직접 끌어서 위치/크기 조정
                </Button>
                <span className="text-xs text-slate-500">
                  화면의 {Math.round(form.posX)}%, {Math.round(form.posY)}% 지점 · 폭 {form.width}px
                </span>
              </div>
            </div>

            {/* 7. 게시 기간 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1.5 block">게시 시작 일시 *</Label>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1.5 block">게시 종료 일시 *</Label>
                <Input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              취소
            </Button>
            <Button
              className="bg-[#0f2445] hover:bg-[#1a3a60] text-white"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.title.trim() || !form.startsAt || !form.endsAt}
            >
              {saveMutation.isPending ? "저장 중..." : "저장하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 드래그&리사이즈 위치 에디터 */}
      {editorOpen && (
        <PopupPositionEditor
          title={form.title}
          content={form.content}
          imageUrl={form.imageUrl}
          initialX={form.posX}
          initialY={form.posY}
          initialWidth={Math.min(800, Math.max(240, parseInt(form.width, 10) || 380))}
          otherPopups={popups.filter((p) => p.id !== editing?.id && p.is_active)}
          onSave={(x, y, w) => {
            setForm((f) => ({ ...f, posX: x, posY: y, width: String(w) }));
            setEditorOpen(false);
          }}
          onCancel={() => setEditorOpen(false)}
        />
      )}

      {/* 삭제 확인 모달 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>팝업을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              [{deleteTarget?.title}] 팝업이 영구히 삭제됩니다. 연결된 이미지 파일도 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

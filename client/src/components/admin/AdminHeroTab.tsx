import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAllHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  uploadImage,
  deleteImage,
  getSiteSettings,
  updateSiteSetting,
  translateTexts,
} from "@/lib/queries";
import { Languages } from "lucide-react";
import type { HeroSlide } from "@/lib/database.types";

export default function AdminHeroTab() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);
  const [uploading, setUploading] = useState(false);
  const [interval, setIntervalValue] = useState("5");
  const [translating, setTranslating] = useState(false);

  const handleTranslateKoToEn = async () => {
    if (!form.headlineKo.trim() && !form.subLinesKo.trim()) {
      toast({ title: "번역할 국문 내용이 없습니다.", variant: "destructive" });
      return;
    }
    setTranslating(true);
    try {
      const [headline, subLines] = await translateTexts([form.headlineKo || " ", form.subLinesKo || " "], "EN-US");
      setForm((f) => ({
        ...f,
        headline: f.headlineKo.trim() ? headline.trim() : f.headline,
        subLines: f.subLinesKo.trim() ? subLines.trim() : f.subLines,
      }));
      toast({ title: "영문 번역 완료", description: "영문 칸에 번역된 내용이 입력되었습니다." });
    } catch (err: any) {
      toast({ title: "번역 실패", description: err.message, variant: "destructive" });
    } finally {
      setTranslating(false);
    }
  };

  const handleTranslateEnToKo = async () => {
    if (!form.headline.trim() && !form.subLines.trim()) {
      toast({ title: "번역할 영문 내용이 없습니다.", variant: "destructive" });
      return;
    }
    setTranslating(true);
    try {
      const [headlineKo, subLinesKo] = await translateTexts([form.headline || " ", form.subLines || " "], "KO");
      setForm((f) => ({
        ...f,
        headlineKo: f.headline.trim() ? headlineKo.trim() : f.headlineKo,
        subLinesKo: f.subLines.trim() ? subLinesKo.trim() : f.subLinesKo,
      }));
      toast({ title: "국문 번역 완료", description: "국문 칸에 번역된 내용이 입력되었습니다." });
    } catch (err: any) {
      toast({ title: "번역 실패", description: err.message, variant: "destructive" });
    } finally {
      setTranslating(false);
    }
  };

  const [form, setForm] = useState({ imageUrl: "", headline: "", subLines: "", headlineKo: "", subLinesKo: "" });

  const { data: slides = [] } = useQuery({
    queryKey: ["admin_hero_slides"],
    queryFn: getAllHeroSlides,
  });

  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: getSiteSettings,
  });

  useEffect(() => {
    if (settings?.hero_interval) setIntervalValue(settings.hero_interval);
  }, [settings]);

  const openCreate = () => {
    setForm({ imageUrl: "", headline: "", subLines: "", headlineKo: "", subLinesKo: "" });
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (s: HeroSlide) => {
    setEditing(s);
    setForm({ imageUrl: s.image_url, headline: s.headline, subLines: s.sub_lines, headlineKo: s.headline_ko || "", subLinesKo: s.sub_lines_ko || "" });
    setFormOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "파일 크기 초과", description: "이미지는 8MB 이하여야 합니다.", variant: "destructive" });
      return;
    }
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const finalHeadline = form.headline.trim() || form.headlineKo.trim();
      const finalSubLines = form.subLines.trim() || form.subLinesKo.trim();

      if (editing) {
        await updateHeroSlide(editing.id, {
          image_url: form.imageUrl,
          headline: finalHeadline,
          sub_lines: finalSubLines,
          headline_ko: form.headlineKo.trim() || null,
          sub_lines_ko: form.subLinesKo.trim() || null,
        });
      } else {
        await createHeroSlide({
          image_url: form.imageUrl,
          headline: finalHeadline,
          sub_lines: finalSubLines,
          headline_ko: form.headlineKo.trim() || null,
          sub_lines_ko: form.subLinesKo.trim() || null,
          display_order: slides.length + 1,
          is_active: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setFormOpen(false);
      toast({ title: editing ? "수정 완료" : "슬라이드 추가 완료" });
    },
    onError: (err: any) => toast({ title: "오류", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (slide: HeroSlide) => {
      if (slide.image_url.includes("/post-images/")) {
        await deleteImage(slide.image_url);
      }
      await deleteHeroSlide(slide.id);
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
      updateHeroSlide(id, { is_active: active }),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; order: number }[]) => {
      for (const { id, order } of updates) {
        await updateHeroSlide(id, { display_order: order });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    const newOrder = [...slides];
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    reorderMutation.mutate(newOrder.map((s, i) => ({ id: s.id, order: i + 1 })));
  };

  const intervalMutation = useMutation({
    mutationFn: () => updateSiteSetting("hero_interval", String(Math.max(2, parseInt(interval, 10) || 5))),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "전환 간격 저장 완료" });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>슬라이드 전환 간격</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-3">
          <div>
            <Label>간격 (초)</Label>
            <Input
              type="number"
              min="2"
              max="30"
              value={interval}
              onChange={(e) => setIntervalValue(e.target.value)}
              className="w-28"
            />
          </div>
          <Button
            className="bg-cordia-teal hover:bg-cordia-green text-white"
            onClick={() => intervalMutation.mutate()}
            disabled={intervalMutation.isPending}
          >
            저장
          </Button>
        </CardContent>
      </Card>

      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-cordia-dark">히어로 슬라이드 ({slides.length})</h2>
          <Button onClick={openCreate} className="bg-[#0f2445] hover:bg-[#1a3a60] text-white font-medium">
            <Plus className="w-4 h-4 mr-2" />새 슬라이드
          </Button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          홈 첫 화면에 표시되는 전체화면 슬라이드입니다. 끄면(스위치) 목록에는 남고 화면에서만 숨겨집니다.
        </p>

        <div className="space-y-3">
          {slides.map((s, idx) => (
            <Card key={s.id} className={`border ${s.is_active ? "border-gray-100" : "border-gray-100 opacity-50"}`}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <img src={s.image_url} alt="" className="w-24 h-14 object-cover rounded-lg shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-cordia-dark truncate">{s.headline}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{s.sub_lines.split("\n")[0]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={s.is_active}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: s.id, active: checked })}
                  />
                  <Button variant="outline" size="sm" onClick={() => move(idx, -1)} disabled={idx === 0 || reorderMutation.isPending}>
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => move(idx, 1)} disabled={idx === slides.length - 1 || reorderMutation.isPending}>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => setDeleteTarget(s)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {slides.length === 0 && (
            <div className="text-center py-16 text-gray-400">슬라이드가 없습니다. 새 슬라이드를 추가하세요.</div>
          )}
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "슬라이드 수정" : "새 슬라이드"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>배경 이미지 *</Label>
              {form.imageUrl ? (
                <div className="relative">
                  <img src={form.imageUrl} alt="preview" className="w-full max-h-56 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, imageUrl: "" })}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-full h-36 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-cordia-teal hover:bg-cordia-teal/5 transition-colors cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  <span className="text-sm text-gray-500">
                    {uploading ? "업로드 중..." : "클릭하여 이미지 업로드 (가로로 넓은 사진 권장)"}
                  </span>
                </label>
              )}
            </div>
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-cordia-dark">🇰🇷 국문</p>
              <div>
                <Label>큰 제목 (국문)</Label>
                <Textarea
                  rows={2}
                  value={form.headlineKo}
                  onChange={(e) => setForm({ ...form, headlineKo: e.target.value })}
                  placeholder={"예: 한국학을 특화하는 CordiaEC입니다."}
                />
              </div>
              <div>
                <Label>부가 텍스트 (국문)</Label>
                <Textarea
                  rows={3}
                  value={form.subLinesKo}
                  onChange={(e) => setForm({ ...form, subLinesKo: e.target.value })}
                  placeholder={"한 줄에 하나씩"}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-blue-300 text-blue-700 bg-blue-50/50 hover:bg-blue-100 text-xs"
                onClick={handleTranslateKoToEn}
                disabled={translating}
              >
                <Languages className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                {translating ? "번역 중..." : "🇰🇷 국문 → 🇺🇸 영문 번역"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 text-xs"
                onClick={handleTranslateEnToKo}
                disabled={translating}
              >
                <Languages className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                {translating ? "번역 중..." : "🇺🇸 영문 → 🇰🇷 국문 번역"}
              </Button>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-cordia-dark">🇺🇸 영문 * (기본 표시 언어)</p>
              <div>
                <Label>Headline *</Label>
                <Textarea
                  rows={2}
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder="English headline"
                />
                <p className="text-xs text-gray-400 mt-1">줄바꿈하면 화면에서도 줄이 나뉩니다.</p>
              </div>
              <div>
                <Label>Sub lines</Label>
                <Textarea
                  rows={3}
                  value={form.subLines}
                  onChange={(e) => setForm({ ...form, subLines: e.target.value })}
                  placeholder="One per line"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>취소</Button>
            <Button
              className="bg-[#0f2445] hover:bg-[#1a3a60] text-white"
              onClick={() => saveMutation.mutate()}
              disabled={
                saveMutation.isPending ||
                !form.imageUrl ||
                (!form.headline.trim() && !form.headlineKo.trim())
              }
            >
              {saveMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>슬라이드를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>업로드한 배경 이미지도 함께 삭제됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
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

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
import { Pencil, Languages, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getInitiatives, updateInitiative, syncDefaultInitiatives, translateTexts } from "@/lib/queries";
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
import type { Initiative } from "@/lib/database.types";

export default function AdminInitiativesTab() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [editing, setEditing] = useState<Initiative | null>(null);

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

  const handleTranslate = async () => {
    const src = [form.titleKo, form.descriptionKo, form.contentKo];
    if (!src.some((t) => t.trim())) {
      toast({ title: "번역할 국문 내용이 없습니다.", variant: "destructive" });
      return;
    }
    setTranslating(true);
    try {
      const [title, description, content] = await translateTexts(src.map((t) => t || " "));
      setForm((f) => ({
        ...f,
        title: f.titleKo.trim() ? title.trim() : f.title,
        description: f.descriptionKo.trim() ? description.trim() : f.description,
        content: f.contentKo.trim() ? content.trim() : f.content,
      }));
      toast({ title: "번역 완료" });
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
      title: init.title,
      label: init.label,
      category: init.category,
      description: init.description,
      content: init.content,
      titleKo: init.title_ko || "",
      descriptionKo: init.description_ko || "",
      contentKo: init.content_ko || "",
      imageUrl: init.image_url || "",
    });
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      await updateInitiative(editing.slug, {
        title: form.title,
        label: form.label,
        category: form.category,
        description: form.description,
        content: form.content,
        title_ko: form.titleKo || null,
        description_ko: form.descriptionKo || null,
        content_ko: form.contentKo || null,
        image_url: form.imageUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      setFormOpen(false);
      toast({ title: "수정 완료" });
    },
    onError: (err: any) => {
      toast({
        title: "오류",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncDefaultInitiatives,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      setSyncConfirmOpen(false);
      toast({
        title: "동기화 완료",
        description: "최신 6대 공식 이니셔티브가 운영 DB에 성공적으로 등록되었습니다.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "동기화 실패",
        description: err.message || "DB 갱신 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-cordia-dark mb-1">이니셔티브 관리</h2>
          <p className="text-sm text-gray-500">6개 공식 이니셔티브의 정보(국문/영문, 설명, 이미지)를 수정할 수 있습니다.</p>
        </div>
        <Button
          variant="outline"
          className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm self-start sm:self-auto shrink-0 shadow-sm"
          onClick={() => setSyncConfirmOpen(true)}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin text-cordia-teal" : ""}`} />
          {syncMutation.isPending ? "동기화 진행 중..." : "최신 6대 공식 데이터로 DB 동기화"}
        </Button>
      </div>

      <AlertDialog open={syncConfirmOpen} onOpenChange={setSyncConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>최신 6대 공식 이니셔티브 DB 동기화</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-slate-600 text-sm">
              <p>
                운영 데이터베이스에 등록된 기존 이니셔티브 데이터를 <strong>최신 6대 공식 표준 이니셔티브</strong>(재외한인 연구 및 정책 자문, 글로벌 무역 및 유통 지원, 한인 문화 아카이빙 및 교류, 차세대 인재 양성 및 리더십, 미디어 콘텐츠 기획 및 제작, 지구촌 한인 상생 및 권익 증진)로 일괄 갱신합니다.
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-md border border-amber-200">
                ⚠️ 기존 구형 모의 데이터(K-Food, K-Beauty 등)는 삭제되며, 공식 국문/영문 번역본이 DB에 즉시 등록됩니다.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={syncMutation.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#0f2445] hover:bg-[#1a3a60] text-white"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? "동기화 중..." : "지금 동기화 실행"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initiatives.map((init) => (
          <Card key={init.slug} className="border border-gray-100">
            <CardContent className="p-4">
              {init.image_url && (
                <img src={init.image_url} alt={init.title} className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              <h3 className="font-semibold text-cordia-dark mb-1">{init.label}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{init.description}</p>
              <Button variant="outline" size="sm" onClick={() => openEdit(init)} className="w-full">
                <Pencil className="w-4 h-4 mr-2" />
                수정
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>이니셔티브 수정: {editing?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-cordia-dark">🇰🇷 국문</p>
              <div>
                <Label>제목 (국문)</Label>
                <Input value={form.titleKo} onChange={(e) => setForm({ ...form, titleKo: e.target.value })} />
              </div>
              <div>
                <Label>한줄 설명 (국문)</Label>
                <Textarea rows={2} value={form.descriptionKo} onChange={(e) => setForm({ ...form, descriptionKo: e.target.value })} />
              </div>
              <div>
                <Label>본문 (국문)</Label>
                <Textarea rows={5} value={form.contentKo} onChange={(e) => setForm({ ...form, contentKo: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
                onClick={handleTranslate}
                disabled={translating}
              >
                <Languages className="w-4 h-4 mr-2" />
                {translating ? "번역 중..." : "국문 → 영문 자동 번역 (DeepL)"}
              </Button>
            </div>
            <div>
              <Label>Title (영문) *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>라벨</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>
            <div>
              <Label>분야</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <Label>한줄 설명</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>본문</Label>
              <Textarea
                rows={7}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div>
              <Label>대표 이미지 URL</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              취소
            </Button>
            <Button
              className="bg-[#0f2445] hover:bg-[#1a3a60] text-white"
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

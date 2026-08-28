import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Search,
  CheckCircle2,
  Info,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { getGlossary, saveGlossary, DEFAULT_GLOSSARY, type GlossaryItem } from "@/lib/queries";

export default function AdminGlossaryTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GlossaryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GlossaryItem | null>(null);

  const [form, setForm] = useState({ ko: "", en: "" });

  const { data: glossary = [], isLoading } = useQuery({
    queryKey: ["admin_glossary"],
    queryFn: getGlossary,
  });

  const saveMutation = useMutation({
    mutationFn: saveGlossary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_glossary"] });
      queryClient.invalidateQueries({ queryKey: ["site_settings"] });
      toast({ title: "고정 용어 사전이 저장되었습니다." });
      setFormOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "저장 실패", description: err.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ko: "", en: "" });
    setFormOpen(true);
  };

  const openEdit = (item: GlossaryItem) => {
    setEditing(item);
    setForm({ ko: item.ko, en: item.en });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.ko.trim() || !form.en.trim()) {
      toast({ title: "국문과 영문 용어를 모두 입력해주세요.", variant: "destructive" });
      return;
    }

    let next: GlossaryItem[];
    if (editing) {
      next = glossary.map((item) =>
        item.id === editing.id
          ? { ...item, ko: form.ko.trim(), en: form.en.trim() }
          : item
      );
    } else {
      const newItem: GlossaryItem = {
        id: "gloss_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        ko: form.ko.trim(),
        en: form.en.trim(),
      };
      next = [newItem, ...glossary];
    }

    saveMutation.mutate(next);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const next = glossary.filter((item) => item.id !== deleteTarget.id);
    saveMutation.mutate(next);
    setDeleteTarget(null);
  };


  const filtered = glossary.filter(
    (item) =>
      item.ko.toLowerCase().includes(search.toLowerCase()) ||
      item.en.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 안내 배너 */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 shadow-xs">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                번역 고정 용어집 (Translation Glossary)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                국↔영 양방향 100% 보존
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              기관명, 연구센터, 고유명사 등을 등록해두면 <strong>게시글·팝업·슬라이드 등 관리자 전역에서 DeepL 자동 번역 실행 시</strong>{" "}
              번역기가 임의로 오역하지 않고 <strong>지정하신 공식 영문/국문 표기로 100% 정확하게 고정 치환</strong>됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 상단 액션 바 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="등록된 용어 검색 (국문 또는 영문)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={openCreate}
            className="bg-[#0f2445] hover:bg-[#1a3a60] text-white text-xs h-9 font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            새 고정 용어 추가
          </Button>
        </div>
      </div>

      {/* 용어 목록 테이블 */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                등록된 고정 용어 목록 ({filtered.length}개)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                긴 문구일수록 우선 순위가 높게 적용되어 완벽한 매칭을 보장합니다.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm">로딩 중...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm space-y-2">
              <p>등록된 용어가 없습니다.</p>
              <Button variant="outline" size="sm" onClick={openCreate} className="text-xs">
                첫 번째 용어 등록하기
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50/80 transition-colors gap-3"
                >
                  <div className="grid sm:grid-cols-2 gap-2 sm:gap-6 flex-1 items-center">
                    {/* 🇰🇷 국문 */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-base shrink-0">🇰🇷</span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          국문 고정 표기
                        </span>
                        <span className="text-sm font-bold text-slate-900 break-all">
                          {item.ko}
                        </span>
                      </div>
                    </div>

                    {/* 🇺🇸 영문 */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-base shrink-0">🇺🇸</span>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          공식 영문 명칭
                        </span>
                        <span className="text-sm font-semibold text-blue-900 break-all font-mono">
                          {item.en}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(item)}
                      className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" /> 수정
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(item)}
                      className="h-8 px-2.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> 삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 등록 / 수정 모달 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              {editing ? "고정 용어 수정" : "새 고정 용어 등록"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">🇰🇷 국문 용어 *</Label>
              <Input
                value={form.ko}
                onChange={(e) => setForm({ ...form, ko: e.target.value })}
                placeholder="예: K학술확산연구센터"
                className="mt-1 text-sm font-semibold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                국문 본문에서 번역할 때 찾을 단어입니다.
              </p>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">🇺🇸 공식 영문 표기 *</Label>
              <Input
                value={form.en}
                onChange={(e) => setForm({ ...form, en: e.target.value })}
                placeholder="예: K-Academic Diffusion Research Center"
                className="mt-1 text-sm font-semibold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                번역 결과로 치환될 정확한 영문 표기입니다.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setFormOpen(false)}>
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-[#0f2445] hover:bg-[#1a3a60] text-white font-semibold"
            >
              {saveMutation.isPending ? "저장 중..." : "저장하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 모달 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>고정 용어 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deleteTarget?.ko}" ↔ "{deleteTarget?.en}"</strong> 항목을 사전에서 삭제하시겠습니까?
              삭제 후에는 번역 시 DeepL 일반 번역으로 처리됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

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
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMilestones, createMilestone, updateMilestone, deleteMilestone, translateTexts } from "@/lib/queries";
import { Languages } from "lucide-react";
import type { Milestone } from "@/lib/database.types";

export default function AdminMilestonesTab() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [form, setForm] = useState({
    periodLabel: "",
    description: "",
    descriptionKo: "",
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["milestones"],
    queryFn: getMilestones,
  });
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!form.descriptionKo.trim()) {
      toast({ title: "번역할 국문 내용이 없습니다.", variant: "destructive" });
      return;
    }
    setTranslating(true);
    try {
      const [description] = await translateTexts([form.descriptionKo]);
      setForm((f) => ({ ...f, description: description.trim() }));
      toast({ title: "번역 완료" });
    } catch (err: any) {
      toast({ title: "번역 실패", description: err.message, variant: "destructive" });
    } finally {
      setTranslating(false);
    }
  };

  const openCreate = () => {
    setForm({ periodLabel: "", description: "", descriptionKo: "" });
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (m: Milestone) => {
    setEditing(m);
    setForm({
      periodLabel: m.period_label,
      description: m.description,
      descriptionKo: m.description_ko || "",
    });
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const finalDesc = form.description.trim() || form.descriptionKo.trim();
      if (editing) {
        await updateMilestone(editing.id, {
          period_label: form.periodLabel.trim(),
          title: form.periodLabel.trim(),
          description: finalDesc,
          description_ko: form.descriptionKo.trim() || null,
        });
      } else {
        await createMilestone({
          period_label: form.periodLabel.trim(),
          title: form.periodLabel.trim(),
          description: finalDesc,
          description_ko: form.descriptionKo.trim() || null,
          image_url: null,
          display_order: milestones.length + 1,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      setFormOpen(false);
      toast({ title: editing ? "수정 완료" : "등록 완료" });
    },
    onError: (err: any) => {
      toast({
        title: "오류",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMilestone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      setDeleteTarget(null);
      toast({ title: "삭제 완료" });
    },
    onError: (err: any) => {
      toast({
        title: "오류",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; order: number }[]) => {
      for (const { id, order } of updates) {
        await updateMilestone(id, { display_order: order });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
    },
  });

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...milestones];
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    reorderMutation.mutate(newOrder.map((m, i) => ({ id: m.id, order: i + 1 })));
  };

  const moveDown = (index: number) => {
    if (index === milestones.length - 1) return;
    const newOrder = [...milestones];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderMutation.mutate(newOrder.map((m, i) => ({ id: m.id, order: i + 1 })));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-cordia-dark">연혁 (About 페이지 하단)</h2>
        <Button onClick={openCreate} className="bg-[#0f2445] hover:bg-[#1a3a60] text-white font-medium">
          <Plus className="w-4 h-4 mr-2" />
          새 항목
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        연도 박스와 내용을 입력하세요. 내용을 여러 줄로 쓰면 한 연도 아래 여러 항목으로 표시됩니다.
      </p>

      <div className="space-y-3">
        {milestones.map((m, idx) => (
          <Card key={m.id} className="border border-gray-100">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="shrink-0 bg-cordia-blue text-white text-sm font-bold px-3 py-2 rounded-tl-xl rounded-br-xl">
                  {m.period_label}
                </div>
                <p className="text-sm text-gray-600 truncate">{m.description.split("\n")[0]}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0 || reorderMutation.isPending}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveDown(idx)}
                  disabled={idx === milestones.length - 1 || reorderMutation.isPending}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(m)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => setDeleteTarget(m.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {milestones.length === 0 && (
          <div className="text-center py-16 text-gray-400">아직 연혁 항목이 없습니다.</div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "연혁 수정" : "새 연혁 항목"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>연도 박스 *</Label>
              <Input
                value={form.periodLabel}
                onChange={(e) => setForm({ ...form, periodLabel: e.target.value })}
                placeholder="예: 2007년"
              />
            </div>
            <div>
              <Label>내용 (국문)</Label>
              <Textarea
                rows={4}
                value={form.descriptionKo}
                onChange={(e) => setForm({ ...form, descriptionKo: e.target.value })}
                placeholder={"한 줄에 하나씩 입력하세요.\n예:\n이주 및 재외동포센터 설립"}
              />
            </div>
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="border-cordia-teal/50 text-cordia-teal hover:bg-cordia-teal/5"
                onClick={handleTranslate}
                disabled={translating}
              >
                <Languages className="w-4 h-4 mr-2" />
                {translating ? "번역 중..." : "국문 → 영문 자동 번역 (DeepL)"}
              </Button>
            </div>
            <div>
              <Label>내용 (영문) *</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={"One item per line (English)"}
              />
              <p className="text-xs text-gray-400 mt-1">줄바꿈하면 같은 연도 아래 여러 항목으로 표시됩니다.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              취소
            </Button>
            <Button
              className="bg-[#0f2445] hover:bg-[#1a3a60] text-white"
              onClick={() => saveMutation.mutate()}
              disabled={
                saveMutation.isPending ||
                !form.periodLabel.trim() ||
                (!form.description.trim() && !form.descriptionKo.trim())
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
            <AlertDialogTitle>삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
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

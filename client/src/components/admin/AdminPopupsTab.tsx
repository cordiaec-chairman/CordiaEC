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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, CalendarRange, Move } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PopupPositionEditor from "@/components/admin/PopupPositionEditor";
import {
  getAllPopups,
  createPopup,
  updatePopup,
  deletePopup,
  uploadImage,
  deleteImage,
} from "@/lib/queries";
import type { Popup, PopupPosition } from "@/lib/database.types";

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

export default function AdminPopupsTab() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Popup | null>(null);
  const [uploading, setUploading] = useState(false);

  const defaultForm = () => {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    return {
      title: "",
      content: "",
      imageUrl: "",
      linkUrl: "",
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

  const openCreate = () => {
    setForm(defaultForm());
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
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

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-cordia-dark">팝업 안내창 ({popups.length})</h2>
        <Button onClick={openCreate} className="bg-[#0f2445] hover:bg-[#1a3a60] text-white font-medium">
          <Plus className="w-4 h-4 mr-2" />새 팝업
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        홈 화면에 표시되는 안내 팝업입니다. 게시 기간 내 + 활성 상태인 팝업만 방문자에게 보입니다.
      </p>

      <div className="space-y-3">
        {popups.map((p) => {
          const status = popupStatus(p);
          return (
            <Card key={p.id} className="border border-gray-100">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {p.image_url && (
                    <img src={p.image_url} alt="" className="w-12 h-12 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${status.cls}`}>{status.label}</span>
                      <p className="font-semibold text-cordia-dark truncate">{p.title}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {p.pos_x != null && p.pos_y != null
                          ? `${Math.round(p.pos_x)}%, ${Math.round(p.pos_y)}% · ${p.width}px`
                          : POSITION_LABELS[p.position]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                      <CalendarRange className="w-3 h-3" />
                      {new Date(p.starts_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                      {" ~ "}
                      {new Date(p.ends_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={p.is_active}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: p.id, active: checked })}
                  />
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => setDeleteTarget(p)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {popups.length === 0 && (
          <div className="text-center py-16 text-gray-400">등록된 팝업이 없습니다.</div>
        )}
      </div>

      <Dialog open={formOpen && !editorOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "팝업 수정" : "새 팝업"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>제목 *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 2026 글로벌 서밋 참가 신청 안내"
              />
            </div>
            <div>
              <Label>내용</Label>
              <Textarea
                rows={3}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="안내 내용 (이미지만 쓸 경우 비워도 됩니다)"
              />
            </div>
            <div>
              <Label>이미지 (선택)</Label>
              {form.imageUrl ? (
                <div className="relative inline-block">
                  <img src={form.imageUrl} alt="preview" className="w-full max-h-48 object-contain rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, imageUrl: "" })}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-full h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-cordia-teal hover:bg-cordia-teal/5 transition-colors cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  <span className="text-sm text-gray-500">{uploading ? "업로드 중..." : "클릭하여 이미지 업로드"}</span>
                </label>
              )}
            </div>
            <div>
              <Label>클릭 시 이동할 링크 (선택)</Label>
              <Input
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>위치 / 크기</Label>
              <div className="flex items-center gap-3 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="border-cordia-teal/50 text-cordia-teal hover:bg-cordia-teal/5"
                  onClick={() => setEditorOpen(true)}
                >
                  <Move className="w-4 h-4 mr-2" />
                  마우스로 위치/크기 조정
                </Button>
                <span className="text-xs text-gray-400">
                  현재: 화면의 {Math.round(form.posX)}%, {Math.round(form.posY)}% 지점 · 폭 {form.width}px
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                미리보기 화면에서 팝업을 직접 끌어다 놓고, 모서리를 드래그해 크기를 조절합니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>게시 시작 *</Label>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>
              <div>
                <Label>게시 종료 *</Label>
                <Input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>취소</Button>
            <Button
              className="bg-[#0f2445] hover:bg-[#1a3a60] text-white"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.title.trim() || !form.startsAt || !form.endsAt}
            >
              {saveMutation.isPending ? "저장 중..." : "저장"}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>팝업을 삭제하시겠습니까?</AlertDialogTitle>
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

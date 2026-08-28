import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, ExternalLink, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAllPartners, createPartner, updatePartner, deletePartner, uploadImage, deleteImage } from "@/lib/queries";
import type { Partner } from "@/lib/database.types";

export default function AdminPartnersTab() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const defaultForm = {
    name: "",
    logoUrl: "",
    linkUrl: "",
    displayOrder: 1,
    isActive: true,
  };
  const [form, setForm] = useState(defaultForm);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["admin_partners"],
    queryFn: getAllPartners,
  });

  const openCreate = () => {
    setForm({
      ...defaultForm,
      displayOrder: partners.length + 1,
    });
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (partner: Partner) => {
    setEditing(partner);
    setForm({
      name: partner.name,
      logoUrl: partner.logo_url,
      linkUrl: partner.link_url || "",
      displayOrder: partner.display_order,
      isActive: partner.is_active,
    });
    setFormOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "로고 이미지는 5MB 이하여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, logoUrl: url }));
      toast({ title: "로고 업로드 완료" });
    } catch (err: any) {
      toast({
        title: "업로드 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        logo_url: form.logoUrl,
        link_url: form.linkUrl.trim() || null,
        display_order: Number(form.displayOrder) || 1,
        is_active: form.isActive,
      };

      if (editing) {
        await updatePartner(editing.id, payload);
      } else {
        await createPartner(payload as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
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

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updatePartner(id, { is_active: active }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "노출 상태 변경 완료" });
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
    mutationFn: async (id: string) => {
      const partner = partners.find((p) => p.id === id);
      if (partner?.logo_url) {
        await deleteImage(partner.logo_url);
      }
      await deletePartner(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
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

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-cordia-dark flex items-center gap-2">
            협력사 관리 <Badge variant="secondary">{partners.length}</Badge>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            홈페이지 하단에 자동 롤링되는 협력사 로고 및 연결 링크를 관리합니다.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-[#0f2445] hover:bg-[#1a3a60] text-white font-medium">
          <Plus className="w-4 h-4 mr-2" />
          새 협력사 추가
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="mb-2">아직 등록된 협력사가 없습니다.</p>
          <p className="text-xs">상단의 [새 협력사 추가] 버튼을 눌러 파트너 로고를 등록해보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((partner) => (
            <Card key={partner.id} className="border border-gray-100">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-24 h-12 bg-gray-50 border border-gray-100 rounded-lg p-1.5 flex items-center justify-center shrink-0">
                    <img
                      src={partner.logo_url}
                      alt={partner.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">#{partner.display_order}</span>
                      <p className="font-semibold text-cordia-dark truncate">{partner.name}</p>
                    </div>
                    {partner.link_url ? (
                      <a
                        href={partner.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cordia-teal hover:underline flex items-center gap-1 mt-0.5 truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        {partner.link_url}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 mt-0.5">링크 없음</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{partner.is_active ? "노출 중" : "숨김"}</span>
                    <Switch
                      checked={partner.is_active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: partner.id, active: checked })
                      }
                      disabled={toggleActiveMutation.isPending}
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => openEdit(partner)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => setDeleteTarget(partner.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "협력사 수정" : "새 협력사 등록"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>협력사 / 파트너 이름 *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="예: 인하대학교"
              />
            </div>

            <div>
              <Label>로고 이미지 *</Label>
              {form.logoUrl ? (
                <div className="relative inline-block mt-1 p-2 bg-gray-50 border rounded-lg">
                  <img src={form.logoUrl} alt="Logo preview" className="h-16 w-auto object-contain" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logoUrl: "" })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600 flex items-center justify-center shadow"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-cordia-teal hover:bg-cordia-teal/5 transition-colors cursor-pointer mt-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                  <span className="text-xs text-gray-500">
                    {uploadingLogo ? "업로드 중..." : "클릭하여 협력사 로고 업로드 (투명 PNG / JPG 권장)"}
                  </span>
                </label>
              )}
            </div>

            <div>
              <Label>웹사이트 연결 링크 (URL)</Label>
              <Input
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>노출 순서</Label>
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value, 10) || 1 })}
                  min="1"
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between p-2 border rounded-lg h-10">
                  <Label className="cursor-pointer text-xs">홈에 노출</Label>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              취소
            </Button>
            <Button
              className="bg-[#0f2445] hover:bg-[#1a3a60] text-white"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.name.trim() || !form.logoUrl}
            >
              {saveMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>협력사를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>홈 화면 롤링 배너에서 즉시 제외됩니다.</AlertDialogDescription>
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

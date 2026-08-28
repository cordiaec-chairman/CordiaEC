import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Mail, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getContacts, deleteContact } from "@/lib/queries";
import type { Contact } from "@/lib/database.types";

export default function AdminContactsTab() {
  const { toast } = useToast();
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: contacts = [] } = useQuery({
    queryKey: ["admin_contacts"],
    queryFn: getContacts,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_contacts"] });
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
      <div className="mb-6">
        <h2 className="text-xl font-bold text-cordia-dark">
          문의 접수 <Badge variant="secondary">{contacts.length}</Badge>
        </h2>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">접수된 문의가 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <Card key={contact.id} className="border border-gray-100">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-cordia-dark truncate">{contact.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(contact.created_at).toLocaleDateString("ko-KR")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setViewingContact(contact)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => setDeleteTarget(contact.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewingContact} onOpenChange={(open) => !open && setViewingContact(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>문의 내용</DialogTitle>
          </DialogHeader>
          {viewingContact && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-gray-500">이름</p>
                <p className="font-semibold text-cordia-dark">{viewingContact.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">이메일</p>
                <p className="font-semibold text-cordia-dark">{viewingContact.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">접수 일시</p>
                <p className="font-semibold text-cordia-dark">
                  {new Date(viewingContact.created_at).toLocaleString("ko-KR")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">메시지</p>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">{viewingContact.message}</p>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button
                  asChild
                  className="bg-cordia-teal hover:bg-cordia-teal/90 text-white"
                >
                  <a href={`mailto:${viewingContact.email}?subject=Re:%20[CordiaEC]%20문의에%20대한%20답변드립니다`}>
                    <Mail className="w-4 h-4 mr-2" />
                    이메일로 바로 답장하기
                  </a>
                </Button>
              </div>
            </div>
          )}
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

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  getYoutubeVideos,
  createYoutubeVideo,
  updateYoutubeVideo,
  deleteYoutubeVideo,
  extractYouTubeVideoId,
} from "@/lib/queries";
import type { YouTubeVideo } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Calendar, Video, ExternalLink, Play } from "lucide-react";

export default function AdminYouTubeTab() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<YouTubeVideo | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const defaultForm = {
    youtube_url: "",
    video_id: "",
    title: "",
    title_ko: "",
    summary: "",
    summary_ko: "",
    published_date: new Date().toISOString().split("T")[0],
    display_order: 1,
    is_active: true,
  };

  const [form, setForm] = useState(defaultForm);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["admin_youtube_videos"],
    queryFn: () => getYoutubeVideos(true),
  });

  const createMutation = useMutation({
    mutationFn: createYoutubeVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_youtube_videos"] });
      queryClient.invalidateQueries({ queryKey: ["youtube_videos"] });
      toast({ title: "등록 완료", description: "유튜브 영상이 성공적으로 등록되었습니다." });
      setFormOpen(false);
    },
    onError: (err: any) => {
      const msg = err.message || "";
      if (msg.includes("does not exist") || msg.includes("youtube_videos") || msg.includes("42P01")) {
        toast({
          title: "DB 테이블 생성 필요",
          description: "Supabase SQL Editor에서 'supabase/patch_2026_09_youtube_videos.sql'을 실행해 주세요.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "등록 실패",
          description: msg || "영상 등록 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<YouTubeVideo> }) =>
      updateYoutubeVideo(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_youtube_videos"] });
      queryClient.invalidateQueries({ queryKey: ["youtube_videos"] });
      toast({ title: "수정 완료", description: "영상 정보가 성공적으로 수정되었습니다." });
      setFormOpen(false);
    },
    onError: (err: any) => {
      const msg = err.message || "";
      if (msg.includes("does not exist") || msg.includes("youtube_videos") || msg.includes("42P01")) {
        toast({
          title: "DB 테이블 생성 필요",
          description: "Supabase SQL Editor에서 'supabase/patch_2026_09_youtube_videos.sql'을 실행해 주세요.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "수정 실패",
          description: msg || "영상 수정 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith("yt-seed-")) {
        // 시드 데이터는 DB에 테이블이 없거나 초기 데이터일 때 보여주는 임시 데이터
        // 실제 DB 테이블 생성 안내
        throw new Error("초기 시드 데이터는 Supabase DB에 'youtube_videos' 테이블 생성 후 실제 등록된 영상으로 삭제·관리하실 수 있습니다.");
      }
      return deleteYoutubeVideo(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_youtube_videos"] });
      queryClient.invalidateQueries({ queryKey: ["youtube_videos"] });
      toast({ title: "삭제 완료", description: "영상이 삭제되었습니다." });
      setDeleteTargetId(null);
    },
    onError: (err: any) => {
      const msg = err.message || "";
      if (msg.includes("does not exist") || msg.includes("youtube_videos") || msg.includes("42P01")) {
        toast({
          title: "DB 테이블 생성 필요",
          description: "Supabase SQL Editor에서 'supabase/patch_2026_09_youtube_videos.sql'을 실행해 주세요.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "삭제 실패",
          description: msg || "영상 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    },
  });

  const openNewForm = () => {
    setEditingVideo(null);
    setForm({
      ...defaultForm,
      display_order: videos.length + 1,
    });
    setFormOpen(true);
  };

  const openEditForm = (video: YouTubeVideo) => {
    setEditingVideo(video);
    setForm({
      youtube_url: video.youtube_url,
      video_id: video.video_id,
      title: video.title,
      title_ko: video.title_ko || "",
      summary: video.summary || "",
      summary_ko: video.summary_ko || "",
      published_date: video.published_date,
      display_order: video.display_order,
      is_active: video.is_active,
    });
    setFormOpen(true);
  };

  const handleUrlChange = (url: string) => {
    const extractedId = extractYouTubeVideoId(url) || "";
    setForm((prev) => ({
      ...prev,
      youtube_url: url,
      video_id: extractedId || prev.video_id,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.youtube_url || !form.video_id) {
      toast({
        title: "입력 오류",
        description: "올바른 유튜브 영상 URL을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (!form.title && !form.title_ko) {
      toast({
        title: "입력 오류",
        description: "영상 제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      youtube_url: form.youtube_url,
      video_id: form.video_id,
      title: form.title || form.title_ko,
      title_ko: form.title_ko || form.title,
      summary: form.summary || null,
      summary_ko: form.summary_ko || null,
      published_date: form.published_date,
      display_order: Number(form.display_order) || 0,
      is_active: form.is_active,
    };

    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo.id, updates: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-red-600" />
            유튜브 영상 관리
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            홈 화면 미디어 쇼케이스에 노출될 유튜브 영상 콘텐츠를 등록하고 순서를 정렬합니다.
          </p>
        </div>
        <Button
          onClick={openNewForm}
          className="bg-[#0f2445] hover:bg-[#1a3a60] text-white text-xs font-semibold h-9 px-4 rounded-xl shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" /> 영상 등록
        </Button>
      </div>

      {/* Seed fallback notice if DB table not yet created */}
      {videos.some((v) => v.id.startsWith("yt-seed-")) && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <span className="shrink-0 text-base">⚠️</span>
          <div className="space-y-1">
            <p className="font-bold text-amber-900">
              Supabase DB에 <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">youtube_videos</code> 테이블 생성이 필요합니다.
            </p>
            <p className="text-amber-700 leading-relaxed">
              현재는 화면 구성을 위해 기본 시드 영상 3종이 임시로 표시되고 있습니다.
              Supabase 대시보드의 <strong>SQL Editor</strong>에서 프로젝트 내 <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">supabase/patch_2026_09_youtube_videos.sql</code> 쿼리를 실행해 주시면 실제 DB 영상 추가/수정/삭제가 완전히 활성화됩니다.
            </p>
          </div>
        </div>
      )}

      {/* Videos List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <Video className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">등록된 영상이 없습니다.</p>
          <p className="text-xs text-slate-400 mt-1">상단의 '영상 등록' 버튼을 눌러 새 영상을 추가해보세요.</p>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {videos.map((video, idx) => (
            <Card
              key={video.id}
              className="border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all group overflow-hidden"
            >
              <CardContent className="p-3.5 sm:p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Thumbnail */}
                  <div className="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-200">
                    <img
                      src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center">
                        <Play className="w-3 h-3 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge
                        variant="outline"
                        className={
                          idx === 0
                            ? "bg-red-50 text-red-700 border-red-200 text-[10px] font-bold"
                            : "bg-slate-50 text-slate-600 border-slate-200 text-[10px]"
                        }
                      >
                        {idx === 0 ? "대표 영상 (1위)" : `순서 #${video.display_order}`}
                      </Badge>
                      {!video.is_active && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[10px]">
                          비공개
                        </Badge>
                      )}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {video.published_date}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                      {video.title_ko || video.title}
                    </h3>
                    {video.summary_ko || video.summary ? (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {video.summary_ko || video.summary}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={video.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="유튜브에서 원본 보기"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditForm(video)}
                    className="h-8 px-2.5 text-xs text-slate-700"
                    title="수정"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTargetId(video.id)}
                    className="h-8 px-2.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Video Edit/Add Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-xl w-[94vw] p-0 overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-red-600" />
              {editingVideo ? "영상 정보 수정" : "새 유튜브 영상 등록"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* YouTube URL input */}
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-1 block">
                유튜브 영상 URL *
              </Label>
              <Input
                value={form.youtube_url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="예: https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
                className="text-xs rounded-xl"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                유튜브 링크를 붙여넣으면 비디오 ID와 썸네일이 자동으로 추출됩니다.
              </p>
            </div>

            {/* Thumbnail Live Preview */}
            {form.video_id ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <img
                  src={`https://img.youtube.com/vi/${form.video_id}/mqdefault.jpg`}
                  alt="preview"
                  className="w-24 aspect-video object-cover rounded-lg shrink-0 border border-slate-200"
                />
                <div className="min-w-0 text-xs">
                  <span className="font-semibold text-slate-800 block truncate">추출된 Video ID</span>
                  <code className="text-teal-700 font-mono text-[11px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                    {form.video_id}
                  </code>
                </div>
              </div>
            ) : null}

            {/* Title (Korean / English) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1 block">제목 (국문) *</Label>
                <Input
                  value={form.title_ko}
                  onChange={(e) => setForm({ ...form, title_ko: e.target.value })}
                  placeholder="한국어 영상 제목"
                  className="text-xs rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1 block">제목 (영문)</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="English Video Title"
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Summary (Korean / English) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1 block">요약 설명 (국문)</Label>
                <Textarea
                  rows={2}
                  value={form.summary_ko}
                  onChange={(e) => setForm({ ...form, summary_ko: e.target.value })}
                  placeholder="홈 화면 카드에 표시될 1~2줄 요약..."
                  className="text-xs rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1 block">요약 설명 (영문)</Label>
                <Textarea
                  rows={2}
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Brief summary in English..."
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Published Date & Display Order & Active */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1 block">발행/업로드 일자</Label>
                <Input
                  type="date"
                  value={form.published_date}
                  onChange={(e) => setForm({ ...form, published_date: e.target.value })}
                  className="text-xs rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1 block">노출 순서 (낮을수록 앞)</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 0 })}
                  className="text-xs rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1 block">공개 상태</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                  <span className="text-xs font-semibold text-slate-600">
                    {form.is_active ? "공개" : "비공개"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormOpen(false)}
                className="text-xs rounded-xl"
              >
                취소
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#0f2445] hover:bg-[#1a3a60] text-white text-xs rounded-xl font-semibold px-4"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "저장 중..."
                  : editingVideo
                  ? "수정사항 저장"
                  : "영상 등록"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent className="max-w-md bg-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900">
              영상을 삭제하시겠습니까?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              이 작업은 되돌릴 수 없습니다. 홈 화면 미디어 쇼케이스에서 해당 영상이 즉시 제거됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-xl">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "삭제 중..." : "삭제하기"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  getYoutubeVideos,
  createYoutubeVideo,
  updateYoutubeVideo,
  deleteYoutubeVideo,
  extractYouTubeVideoId,
  translateTexts,
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
import { Plus, Pencil, Trash2, Calendar, Video, ExternalLink, Play, Sparkles, Languages, Loader2, GripVertical, ArrowUpDown, ChevronUp, ChevronDown, Check } from "lucide-react";

export default function AdminYouTubeTab() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<YouTubeVideo | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeLangTab, setActiveLangTab] = useState<"ko" | "en">("ko");
  const [translating, setTranslating] = useState(false);
  const [confirmTranslateOpen, setConfirmTranslateOpen] = useState(false);
  const [translateDirection, setTranslateDirection] = useState<"koToEn" | "enToKo">("koToEn");

  // 정렬 모드 및 드래그앤드롭 상태
  const [sortMode, setSortMode] = useState<"custom" | "latest" | "popular">("custom");
  const [localVideos, setLocalVideos] = useState<YouTubeVideo[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const didDragRef = useRef(false);

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

  useEffect(() => {
    if (videos && videos.length > 0) {
      setLocalVideos(videos);
    }
  }, [videos]);

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
    setActiveLangTab("ko");
    setFormOpen(true);
  };

  const openEditForm = (video: YouTubeVideo) => {
    setEditingVideo(video);
    const isTitleSame = Boolean(video.title && video.title_ko && video.title.trim() === video.title_ko.trim());
    const isSummarySame = Boolean(video.summary && video.summary_ko && video.summary.trim() === video.summary_ko.trim());

    setForm({
      youtube_url: video.youtube_url,
      video_id: video.video_id,
      title: isTitleSame ? "" : (video.title || ""),
      title_ko: video.title_ko || (isTitleSame ? (video.title || "") : ""),
      summary: isSummarySame ? "" : (video.summary || ""),
      summary_ko: video.summary_ko || (isSummarySame ? (video.summary || "") : ""),
      published_date: video.published_date,
      display_order: video.display_order,
      is_active: video.is_active,
    });
    setActiveLangTab("ko");
    setFormOpen(true);
  };

  const handleTranslateKoToEn = async () => {
    const sources = [form.title_ko, form.summary_ko];
    if (!sources.some((t) => t?.trim())) {
      toast({
        title: "번역할 국문 내용이 없습니다",
        description: "국문 제목이나 요약을 먼저 작성해주세요.",
        variant: "destructive",
      });
      return;
    }
    setTranslating(true);
    try {
      const [enTitle, enSummary] = await translateTexts(
        sources.map((t) => t || " "),
        "EN-US"
      );
      setForm((prev) => ({
        ...prev,
        title: prev.title_ko.trim() ? enTitle.trim() : prev.title,
        summary: prev.summary_ko.trim() ? enSummary.trim() : prev.summary,
      }));
      setActiveLangTab("en");
      toast({
        title: "영문 자동 번역 완료",
        description: "국문 내용을 바탕으로 영문 제목과 설명이 생성되었습니다.",
      });
    } catch (err: any) {
      toast({
        title: "번역 실패",
        description: err.message || "DeepL 번역 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setTranslating(false);
    }
  };

  const handleTranslateEnToKo = async () => {
    const sources = [form.title, form.summary];
    if (!sources.some((t) => t?.trim())) {
      toast({
        title: "번역할 영문 내용이 없습니다",
        description: "영문 제목이나 요약을 먼저 작성해주세요.",
        variant: "destructive",
      });
      return;
    }
    setTranslating(true);
    try {
      const [koTitle, koSummary] = await translateTexts(
        sources.map((t) => t || " "),
        "KO"
      );
      setForm((prev) => ({
        ...prev,
        title_ko: prev.title.trim() ? koTitle.trim() : prev.title_ko,
        summary_ko: prev.summary.trim() ? koSummary.trim() : prev.summary_ko,
      }));
      setActiveLangTab("ko");
      toast({
        title: "국문 자동 번역 완료",
        description: "영문 내용을 바탕으로 국문 제목과 설명이 생성되었습니다.",
      });
    } catch (err: any) {
      toast({
        title: "번역 실패",
        description: err.message || "DeepL 번역 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setTranslating(false);
    }
  };

  const handleUrlChange = (url: string) => {
    const extractedId = extractYouTubeVideoId(url) || "";
    setForm((prev) => ({
      ...prev,
      youtube_url: url,
      video_id: extractedId || prev.video_id,
    }));
  };

  const executeSave = (payload: any) => {
    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo.id, updates: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const executeSaveWithAutoTranslate = async () => {
    setTranslating(true);
    try {
      let finalTitle = form.title.trim();
      let finalTitleKo = form.title_ko.trim();
      let finalSummary = form.summary.trim();
      let finalSummaryKo = form.summary_ko.trim();

      if (translateDirection === "koToEn") {
        const sources = [form.title_ko, form.summary_ko];
        const [enTitle, enSummary] = await translateTexts(sources.map((t) => t || " "), "EN-US");
        finalTitle = enTitle.trim();
        finalSummary = enSummary.trim();
        setForm((prev) => ({ ...prev, title: finalTitle, summary: finalSummary }));
      } else {
        const sources = [form.title, form.summary];
        const [koTitle, koSummary] = await translateTexts(sources.map((t) => t || " "), "KO");
        finalTitleKo = koTitle.trim();
        finalSummaryKo = koSummary.trim();
        setForm((prev) => ({ ...prev, title_ko: finalTitleKo, summary_ko: finalSummaryKo }));
      }

      const payload = {
        youtube_url: form.youtube_url,
        video_id: form.video_id,
        title: finalTitle,
        title_ko: finalTitleKo,
        summary: finalSummary || null,
        summary_ko: finalSummaryKo || null,
        published_date: form.published_date,
        display_order: Number(form.display_order) || 0,
        is_active: form.is_active,
      };

      setConfirmTranslateOpen(false);
      executeSave(payload);
      toast({
        title: "자동 번역 및 저장 완료",
        description: "반대 언어 번역본이 생성되어 함께 저장되었습니다.",
      });
    } catch (err: any) {
      toast({
        title: "자동 번역 실패",
        description: (err.message || "DeepL 번역 중 오류가 발생했습니다.") + " 현재 입력된 내용으로 저장합니다.",
        variant: "destructive",
      });
      setConfirmTranslateOpen(false);
      executeDirectSave();
    } finally {
      setTranslating(false);
    }
  };

  const executeDirectSave = () => {
    setConfirmTranslateOpen(false);
    const payload = {
      youtube_url: form.youtube_url,
      video_id: form.video_id,
      title: form.title.trim(),
      title_ko: form.title_ko.trim() || null,
      summary: form.summary.trim() || null,
      summary_ko: form.summary_ko.trim() || null,
      published_date: form.published_date,
      display_order: Number(form.display_order) || 0,
      is_active: form.is_active,
    };
    executeSave(payload);
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
    if (!form.title.trim() && !form.title_ko.trim()) {
      toast({
        title: "입력 오류",
        description: "영상 제목을 최소 한 개 언어로 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const hasKo = Boolean(form.title_ko.trim());
    const hasEn = Boolean(form.title.trim());

    if (hasKo && !hasEn) {
      setTranslateDirection("koToEn");
      setConfirmTranslateOpen(true);
      return;
    }
    if (!hasKo && hasEn) {
      setTranslateDirection("enToKo");
      setConfirmTranslateOpen(true);
      return;
    }

    executeDirectSave();
  };

  // 정렬된 영상 목록 계산 (로컬 상태 localVideos 우선 적용으로 0ms 즉각 반응)
  const currentVideos = localVideos.length > 0 ? localVideos : videos;
  const sortedVideos = [...currentVideos].sort((a, b) => {
    if (sortMode === "latest") {
      const dateA = new Date(a.published_date || a.created_at || 0).getTime();
      const dateB = new Date(b.published_date || b.created_at || 0).getTime();
      return dateB - dateA;
    }
    if (sortMode === "popular") {
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1;
      }
      return (a.display_order ?? 0) - (b.display_order ?? 0);
    }
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (sortMode !== "custom") return;
    didDragRef.current = true;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", `${index}`);
    } catch {}
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (sortMode !== "custom" || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTimeout(() => {
      didDragRef.current = false;
    }, 150);
  };

  const applyOrderList = async (list: YouTubeVideo[]) => {
    setIsReordering(true);
    // 1. 0ms 낙관적 로컬 즉시 갱신 (화면 깜빡임·되돌아감 방지)
    const reindexedList = list.map((video, idx) => ({
      ...video,
      display_order: idx + 1,
    }));
    setLocalVideos(reindexedList);

    try {
      // 2. LocalStorage에 순서맵 영구 보관 (시드 데이터 및 DB 미생성 시에도 100% 지속 유지)
      const orderMap: Record<string, number> = {};
      reindexedList.forEach((v, idx) => {
        orderMap[v.id] = idx + 1;
      });
      localStorage.setItem("cordia_youtube_seed_order", JSON.stringify(orderMap));

      // 3. 실제 DB 데이터인 경우 Supabase display_order 일괄 갱신
      const realDbVideos = reindexedList.filter((v) => !v.id.startsWith("yt-seed-"));
      if (realDbVideos.length > 0) {
        await Promise.all(
          realDbVideos.map((video) =>
            updateYoutubeVideo(video.id, { display_order: video.display_order })
          )
        );
        queryClient.invalidateQueries({ queryKey: ["admin_youtube_videos"] });
        queryClient.invalidateQueries({ queryKey: ["youtube_videos"] });
      }

      toast({
        title: "순서 변경 완료",
        description: `새로운 순서가 적용되었습니다. (1위: ${reindexedList[0]?.title_ko || reindexedList[0]?.title || "첫 번째 영상"})`,
      });
    } catch (err: any) {
      console.warn("Could not persist to Supabase:", err.message);
      toast({
        title: "순서 로컬 적용 완료",
        description: "새로운 순서가 브라우저에 저장되었습니다.",
      });
    } finally {
      setIsReordering(false);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (sortMode !== "custom" || draggedIndex === null || draggedIndex === targetIndex) {
      handleDragEnd();
      return;
    }

    const nextList = [...sortedVideos];
    const [movedItem] = nextList.splice(draggedIndex, 1);
    nextList.splice(targetIndex, 0, movedItem);

    handleDragEnd();
    await applyOrderList(nextList);
  };

  const handleMoveOne = async (currentIndex: number, delta: number) => {
    const targetIndex = currentIndex + delta;
    if (targetIndex < 0 || targetIndex >= sortedVideos.length) return;

    const nextList = [...sortedVideos];
    const [movedItem] = nextList.splice(currentIndex, 1);
    nextList.splice(targetIndex, 0, movedItem);

    await applyOrderList(nextList);
  };

  const handleApplyCurrentSortAsDisplayOrder = async () => {
    if (sortedVideos.length === 0) return;
    await applyOrderList(sortedVideos);
    setSortMode("custom");
    toast({
      title: "순서번호 일괄 적용 완료",
      description: "현재 정렬된 순서대로 1번부터 번호가 영구 저장되었습니다.",
    });
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

      {/* Sorting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-slate-100/90 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-700 ml-1 mr-1 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            정렬 기준:
          </span>
          <button
            type="button"
            onClick={() => setSortMode("custom")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              sortMode === "custom"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            지정 순서 (드래그 가능)
          </button>
          <button
            type="button"
            onClick={() => setSortMode("latest")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              sortMode === "latest"
                ? "bg-white text-blue-700 shadow-2xs border border-blue-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            최신순
          </button>
          <button
            type="button"
            onClick={() => setSortMode("popular")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              sortMode === "popular"
                ? "bg-white text-red-700 shadow-2xs border border-red-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            인기/대표순
          </button>
        </div>

        {sortMode !== "custom" && (
          <Button
            size="sm"
            variant="outline"
            disabled={isReordering}
            onClick={handleApplyCurrentSortAsDisplayOrder}
            className="text-xs h-8 bg-white hover:bg-slate-50 text-slate-800 font-semibold border-slate-300 shadow-2xs flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-blue-600" />
            <span>현재 {sortMode === "latest" ? "최신순" : "인기순"}대로 순서번호(1~N) 일괄 저장</span>
          </Button>
        )}
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
      ) : sortedVideos.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <Video className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">등록된 영상이 없습니다.</p>
          <p className="text-xs text-slate-400 mt-1">상단의 '영상 등록' 버튼을 눌러 새 영상을 추가해보세요.</p>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {sortedVideos.map((video, idx) => (
            <Card
              key={video.id}
              draggable={sortMode === "custom"}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, idx)}
              onClick={() => {
                if (didDragRef.current) return;
                openEditForm(video);
              }}
              className={`border select-none transition-all group overflow-hidden cursor-pointer bg-white hover:bg-slate-50/50 ${
                dragOverIndex === idx
                  ? "border-blue-500 ring-4 ring-blue-300/60 bg-blue-50/40 shadow-lg scale-[1.01]"
                  : "border-slate-200/90 hover:border-slate-400 hover:shadow-md"
              } ${draggedIndex === idx ? "opacity-30 border-dashed border-blue-400 shadow-none" : ""}`}
            >
              <CardContent className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                {/* Drag Handle & Step Buttons */}
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className={`p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors ${
                      sortMode === "custom"
                        ? "cursor-grab active:cursor-grabbing"
                        : "cursor-not-allowed opacity-30"
                    }`}
                    title={
                      sortMode === "custom"
                        ? "마우스로 드래그하여 순서 이동 (1위 영상은 메인 홈 대표 영상으로 자동 노출됩니다)"
                        : "지정 순서 모드에서 드래그 가능합니다"
                    }
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0 || isReordering || sortMode !== "custom"}
                      onClick={() => handleMoveOne(idx, -1)}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-100 rounded"
                      title="한 칸 위로 이동"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={
                        idx === sortedVideos.length - 1 ||
                        isReordering ||
                        sortMode !== "custom"
                      }
                      onClick={() => handleMoveOne(idx, 1)}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-100 rounded"
                      title="한 칸 아래로 이동"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1 pointer-events-none select-none">
                  {/* Thumbnail */}
                  <div className="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-200 pointer-events-none select-none">
                    <img
                      src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                      alt=""
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
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
                        {idx === 0
                          ? "대표 영상 (1위)"
                          : `순서 #${video.display_order} (${idx + 1}위)`}
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
                    {video.title && video.title_ko && video.title !== video.title_ko && (
                      <p className="text-xs text-slate-400 truncate">
                        ({video.title})
                      </p>
                    )}
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
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="유튜브에서 원본 보기"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditForm(video);
                    }}
                    className="h-8 px-2.5 text-xs text-slate-700 flex items-center gap-1"
                    title="수정"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>수정</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTargetId(video.id);
                    }}
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
                  <code className="text-slate-700 font-mono text-[11px] bg-slate-200/80 px-1.5 py-0.5 rounded border border-slate-300">
                    {form.video_id}
                  </code>
                </div>
              </div>
            ) : null}

            {/* Bilingual Content Studio with Auto-Translate */}
            <div className="space-y-3 pt-1">
              {/* Language Switcher Tabs & Auto Translate Button */}
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
                    {form.title_ko && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
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
                    {form.title && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                </div>

                {/* Single Clean Translate Control Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={activeLangTab === "ko" ? handleTranslateKoToEn : handleTranslateEnToKo}
                  disabled={translating || (activeLangTab === "ko" ? !form.title_ko.trim() : !form.title.trim())}
                  className="h-8 px-2.5 text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 flex items-center gap-1.5 rounded-lg"
                  title="현재 작성된 내용을 바탕으로 반대 언어로 즉시 번역합니다 (결과 확인 및 직접 수정 가능)"
                >
                  {translating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>번역하기</span>
                </Button>
              </div>

              {/* Korean Tab Panel */}
              {activeLangTab === "ko" && (
                <div className="space-y-3.5">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1 block">
                      영상 제목 (국문) *
                    </Label>
                    <Input
                      value={form.title_ko}
                      onChange={(e) => setForm({ ...form, title_ko: e.target.value })}
                      placeholder="예: 글로벌 한인 디아스포라 네트워크"
                      className="text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1 block">
                      영상 요약 설명 (국문)
                    </Label>
                    <Textarea
                      rows={3}
                      value={form.summary_ko}
                      onChange={(e) => setForm({ ...form, summary_ko: e.target.value })}
                      placeholder="홈 화면 카드에 표시될 1~2줄 요약 설명..."
                      className="text-xs rounded-xl leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* English Tab Panel */}
              {activeLangTab === "en" && (
                <div className="space-y-3.5">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1 block">
                      Video Title (English) *
                    </Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Global Korean Diaspora Network"
                      className="text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1 block">
                      Video Summary (English)
                    </Label>
                    <Textarea
                      rows={3}
                      value={form.summary}
                      onChange={(e) => setForm({ ...form, summary: e.target.value })}
                      placeholder="Short summary displayed on home cards..."
                      className="text-xs rounded-xl leading-relaxed"
                    />
                  </div>
                </div>
              )}
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

      {/* Auto Translate on Save Confirmation Alert */}
      <AlertDialog open={confirmTranslateOpen} onOpenChange={setConfirmTranslateOpen}>
        <AlertDialogContent className="max-w-md bg-white rounded-2xl">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1 border border-blue-100 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-slate-900">
              {translateDirection === "koToEn"
                ? "영문 번역본을 함께 생성하시겠습니까?"
                : "국문 번역본을 함께 생성하시겠습니까?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 space-y-2 leading-relaxed pt-1">
              <p>
                {translateDirection === "koToEn"
                  ? "현재 국문 내용만 작성되어 있습니다. 글로벌 영문 방문자를 위해 DeepL로 자동 번역하여 함께 저장할까요?"
                  : "현재 영문 내용만 작성되어 있습니다. 국내 국문 방문자를 위해 DeepL로 자동 번역하여 함께 저장할까요?"}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-col gap-2 mt-3">
            <Button
              className="w-full bg-[#0f2445] hover:bg-[#1a3a60] text-white text-xs h-9 font-semibold rounded-xl shadow-xs"
              onClick={executeSaveWithAutoTranslate}
              disabled={translating || createMutation.isPending || updateMutation.isPending}
            >
              {translating ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              )}
              자동 번역 후 저장
            </Button>
            <div className="flex items-center gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1 text-xs h-8.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={executeDirectSave}
                disabled={translating || createMutation.isPending || updateMutation.isPending}
              >
                현재 언어만 저장
              </Button>
              <Button
                variant="ghost"
                className="text-xs h-8.5 rounded-xl text-slate-500 hover:bg-slate-100"
                onClick={() => setConfirmTranslateOpen(false)}
                disabled={translating}
              >
                취소
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

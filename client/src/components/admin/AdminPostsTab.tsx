import { useState, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  FileUp,
  FileText as FileIcon,
  ImageIcon,
  Languages,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link2,
  Minus,
  Eye,
  Edit3,
  ChevronDown,
  ChevronUp,
  Settings2,
  ImagePlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  uploadImage,
  deleteImage,
  uploadPdf,
  deletePdf,
  getInitiatives,
  translateTexts,
} from "@/lib/queries";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import type { Post } from "@/lib/database.types";

type BoardFilter = "all" | "news" | "diaspora" | "reports";

export default function AdminPostsTab() {
  const { toast } = useToast();
  const [boardFilter, setBoardFilter] = useState<BoardFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingInlineImage, setUploadingInlineImage] = useState(false);

  const [activeLangTab, setActiveLangTab] = useState<"ko" | "en">("ko");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  const contentKoRef = useRef<HTMLTextAreaElement | null>(null);
  const contentEnRef = useRef<HTMLTextAreaElement | null>(null);
  const inlineImageInputRef = useRef<HTMLInputElement | null>(null);

  const defaultForm = {
    board: "news" as "news" | "diaspora" | "reports",
    title: "",
    excerpt: "",
    content: "",
    titleKo: "",
    excerptKo: "",
    contentKo: "",
    imageUrl: "",
    fileUrl: "",
    fileName: "",
    linkUrl: "",
    initiativeSlug: "",
    publishedDate: new Date().toISOString().split("T")[0],
  };
  const [form, setForm] = useState(defaultForm);
  const [translating, setTranslating] = useState(false);

  const insertFormatting = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const isKo = activeLangTab === "ko";
    const textarea = isKo ? contentKoRef.current : contentEnRef.current;
    const currentVal = isKo ? form.contentKo : form.content;

    if (!textarea) {
      const newVal = currentVal ? `${currentVal}\n${prefix}${placeholder}${suffix}` : `${prefix}${placeholder}${suffix}`;
      setForm((f) => (isKo ? { ...f, contentKo: newVal } : { ...f, content: newVal }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = currentVal.substring(start, end);
    const textToInsert = selected || placeholder;
    const replacement = `${prefix}${textToInsert}${suffix}`;
    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);

    setForm((f) => (isKo ? { ...f, contentKo: newVal } : { ...f, content: newVal }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + textToInsert.length);
    }, 50);
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "파일 크기 초과", description: "이미지는 15MB 이하여야 합니다.", variant: "destructive" });
      return;
    }

    setUploadingInlineImage(true);
    try {
      const url = await uploadImage(file);
      const isKo = activeLangTab === "ko";
      const altText = file.name.replace(/\.[^/.]+$/, "") || "본문 이미지";
      const imageMarkdown = `\n\n![${altText}](${url})\n\n`;

      const textarea = isKo ? contentKoRef.current : contentEnRef.current;
      const currentVal = isKo ? form.contentKo : form.content;

      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newVal = currentVal.substring(0, start) + imageMarkdown + currentVal.substring(end);
        setForm((f) => (isKo ? { ...f, contentKo: newVal } : { ...f, content: newVal }));
      } else {
        setForm((f) => (isKo ? { ...f, contentKo: (f.contentKo || "") + imageMarkdown } : { ...f, content: (f.content || "") + imageMarkdown }));
      }

      toast({ title: "본문 이미지 삽입 완료", description: "WebP 자동 최적화 후 본문 커서 위치에 이미지가 삽입되었습니다." });
    } catch (err: any) {
      toast({ title: "이미지 삽입 실패", description: err.message, variant: "destructive" });
    } finally {
      setUploadingInlineImage(false);
      if (inlineImageInputRef.current) inlineImageInputRef.current.value = "";
    }
  };

  const handleTranslateKoToEn = async () => {
    const sources = [form.titleKo, form.excerptKo, form.contentKo];
    if (!sources.some((t) => t.trim())) {
      toast({ title: "번역할 국문 내용이 없습니다.", description: "국문 제목 또는 내용을 먼저 작성해주세요.", variant: "destructive" });
      return;
    }
    setTranslating(true);
    try {
      const [title, excerpt, content] = await translateTexts(sources.map((t) => t || " "), "EN-US");
      setForm((f) => ({
        ...f,
        title: f.titleKo.trim() ? title.trim() : f.title,
        excerpt: f.excerptKo.trim() ? excerpt.trim() : f.excerpt,
        content: f.contentKo.trim() ? content.trim() : f.content,
      }));
      setActiveLangTab("en");
      toast({ title: "영문 자동 번역 완료", description: "국문 내용을 바탕으로 영문이 생성되었습니다. 영문 탭으로 이동합니다." });
    } catch (err: any) {
      toast({ title: "번역 실패", description: err.message, variant: "destructive" });
    } finally {
      setTranslating(false);
    }
  };

  const handleTranslateEnToKo = async () => {
    const sources = [form.title, form.excerpt, form.content];
    if (!sources.some((t) => t.trim())) {
      toast({ title: "번역할 영문 내용이 없습니다.", description: "영문 제목 또는 내용을 먼저 작성해주세요.", variant: "destructive" });
      return;
    }
    setTranslating(true);
    try {
      const [titleKo, excerptKo, contentKo] = await translateTexts(sources.map((t) => t || " "), "KO");
      setForm((f) => ({
        ...f,
        titleKo: f.title.trim() ? titleKo.trim() : f.titleKo,
        excerptKo: f.excerpt.trim() ? excerptKo.trim() : f.excerptKo,
        contentKo: f.content.trim() ? contentKo.trim() : f.contentKo,
      }));
      setActiveLangTab("ko");
      toast({ title: "국문 자동 번역 완료", description: "영문 내용을 바탕으로 국문이 생성되었습니다. 국문 탭으로 이동합니다." });
    } catch (err: any) {
      toast({ title: "번역 실패", description: err.message, variant: "destructive" });
    } finally {
      setTranslating(false);
    }
  };

  const { data: postsData, isLoading } = useQuery({
    queryKey: ["admin_posts", boardFilter, page, limit, searchQuery],
    queryFn: () => getPosts({ board: boardFilter === "all" ? undefined : boardFilter, page, limit, search: searchQuery || undefined }),
  });

  const { data: initiatives = [] } = useQuery({
    queryKey: ["initiatives"],
    queryFn: getInitiatives,
  });

  const posts = postsData?.posts || [];
  const total = postsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const runSearch = () => {
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const openCreate = () => {
    setForm({ ...defaultForm, board: boardFilter === "diaspora" ? "diaspora" : boardFilter === "reports" ? "reports" : "news", publishedDate: new Date().toISOString().split("T")[0] });
    setEditing(null);
    setActiveLangTab("ko");
    setIsPreviewMode(false);
    setShowSettings(true);
    setFormOpen(true);
  };

  const openEdit = (post: Post) => {
    setEditing(post);
    setForm({
      board: post.board,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      titleKo: post.title_ko || "",
      excerptKo: post.excerpt_ko || "",
      contentKo: post.content_ko || "",
      imageUrl: post.image_url || "",
      fileUrl: post.file_url || "",
      fileName: post.file_name || "",
      linkUrl: post.link_url || "",
      initiativeSlug: post.initiative_slug || "",
      publishedDate: new Date(post.published_date).toISOString().split("T")[0],
    });
    setActiveLangTab(post.title_ko ? "ko" : "en");
    setIsPreviewMode(false);
    setShowSettings(true);
    setFormOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "파일 크기 초과", description: "이미지는 15MB 이하여야 합니다.", variant: "destructive" });
      return;
    }
    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
      toast({ title: "대표 썸네일 업로드 완료 (WebP 자동 압축)" });
    } catch (err: any) {
      toast({ title: "업로드 실패", description: err.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      toast({ title: "파일 크기 초과", description: "PDF 파일은 30MB 이하여야 합니다.", variant: "destructive" });
      return;
    }
    setUploadingPdf(true);
    try {
      const { url, name } = await uploadPdf(file);
      setForm((f) => ({ ...f, fileUrl: url, fileName: name }));
      toast({ title: "PDF 파일 업로드 완료", description: name });
    } catch (err: any) {
      toast({
        title: "업로드 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingPdf(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const finalTitleKo = form.titleKo.trim() || null;
      const finalContentKo = form.contentKo.trim() || null;
      const finalExcerptKo = form.excerptKo.trim() || (finalContentKo ? finalContentKo.slice(0, 150) : null);

      const finalTitle = form.title.trim() || finalTitleKo || "";
      const finalContent = form.content.trim() || finalContentKo || "";
      const finalExcerpt = form.excerpt.trim() || finalExcerptKo || (finalContent ? finalContent.slice(0, 150) : "");

      const payload: Record<string, any> = {
        board: form.board,
        title: finalTitle,
        excerpt: finalExcerpt,
        content: finalContent,
        title_ko: finalTitleKo,
        excerpt_ko: finalExcerptKo,
        content_ko: finalContentKo,
        image_url: form.imageUrl || null,
        link_url: form.linkUrl || null,
        initiative_slug: form.initiativeSlug && form.initiativeSlug !== "none" ? form.initiativeSlug : null,
        is_pinned_home: editing ? editing.is_pinned_home : false,
        published_date: new Date(form.publishedDate).toISOString(),
      };

      // 파일이 첨부된 경우에만 컬럼 전송 (PostgREST schema cache 400 에러 방지)
      if (form.fileUrl) payload.file_url = form.fileUrl;
      if (form.fileName) payload.file_name = form.fileName;

      if (editing) {
        await updatePost(editing.id, payload);
      } else {
        await createPost(payload as any);
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const post = posts.find((p) => p.id === id);
      if (post?.image_url) {
        await deleteImage(post.image_url);
      }
      if (post?.file_url) {
        await deletePdf(post.file_url);
      }
      await deletePost(id);
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
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-slate-900">
          게시글 <Badge variant="secondary">{total}</Badge>
        </h2>
        <Button onClick={openCreate} className="bg-[#0f2445] hover:bg-[#1a3a60] text-white font-medium">
          <Plus className="w-4 h-4 mr-2" />새 글
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Select
          value={boardFilter}
          onValueChange={(v: BoardFilter) => {
            setBoardFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모두 보기</SelectItem>
            <SelectItem value="news">뉴스</SelectItem>
            <SelectItem value="reports">산업분석 보고서</SelectItem>
            <SelectItem value="diaspora">K-Diaspora</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={String(limit)}
          onValueChange={(v) => {
            setLimit(parseInt(v, 10));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10개씩 보기</SelectItem>
            <SelectItem value="20">20개씩 보기</SelectItem>
            <SelectItem value="50">50개씩 보기</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[180px]">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="제목·요약 검색..."
            className="pl-9"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        </div>
        <Button variant="outline" onClick={runSearch}>
          검색
        </Button>
        {searchQuery && (
          <Button
            variant="ghost"
            className="text-gray-400"
            onClick={() => {
              setSearchInput("");
              setSearchQuery("");
              setPage(1);
            }}
          >
            초기화
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {searchQuery ? "검색 결과가 없습니다." : "아직 게시글이 없습니다."}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="border border-gray-100">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {post.image_url && (
                    <img src={post.image_url} alt="" className="w-12 h-12 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-xs ${
                          post.board === "news"
                            ? "border-cordia-teal/40 text-cordia-teal"
                            : post.board === "reports"
                            ? "border-amber-500/40 text-amber-600 bg-amber-50/50"
                            : "border-cordia-blue/40 text-cordia-blue"
                        }`}
                      >
                        {post.board === "news" ? "뉴스" : post.board === "reports" ? "보고서" : "K-Diaspora"}
                      </Badge>
                      <p className="font-semibold text-cordia-dark truncate">{post.title}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.published_date).toLocaleDateString()}
                      </span>
                      {post.file_url && (
                        <span className="flex items-center gap-1 text-cordia-teal font-medium">
                          <FileIcon className="w-3 h-3" />
                          PDF 첨부됨
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(post)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => setDeleteTarget(post.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Form Dialog - Full-Width Rich Posting Studio */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-5xl w-[96vw] max-h-[94vh] flex flex-col p-0 overflow-hidden bg-white shadow-2xl rounded-2xl border border-slate-200">
          {/* Header */}
          <DialogHeader className="px-6 py-3.5 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                {editing ? "게시글 수정" : "새 글 포스팅"}
              </DialogTitle>
              <Badge
                variant="outline"
                className={
                  form.board === "news"
                    ? "border-cordia-teal/40 text-cordia-teal bg-teal-50/40 text-xs"
                    : form.board === "reports"
                    ? "border-amber-500/40 text-amber-600 bg-amber-50/50 text-xs"
                    : "border-cordia-blue/40 text-cordia-blue bg-blue-50/40 text-xs"
                }
              >
                {form.board === "news" ? "뉴스 (News)" : form.board === "reports" ? "산업분석 보고서 (Reports)" : "K-Diaspora"}
              </Badge>
            </div>

            {/* 상단 설정 접기/펼치기 토글 버튼 */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-2xs mr-8"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showSettings ? "게시/파일 설정 접기" : "게시/파일 설정 펼치기"}</span>
              {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </DialogHeader>

          {/* Dialog Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/30">
            {/* 1. 상단 100% 폭: 게시 기본 설정 & 미디어 첨부 영역 (Collapsible) */}
            {showSettings && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 animate-in fade-in-50 duration-200">
                {/* 1행: 게시판, 이니셔티브, 발행일, 외부링크 (4열 그리드) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1.5 block">게시판 구분 *</Label>
                    <Select
                      value={form.board}
                      onValueChange={(v: "news" | "diaspora" | "reports") => setForm({ ...form, board: v })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-lg bg-slate-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="news">뉴스 & 공지 (News)</SelectItem>
                        <SelectItem value="reports">산업분석 보고서 (Reports)</SelectItem>
                        <SelectItem value="diaspora">K-디아스포라 (K-Diaspora)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1.5 block">연계 이니셔티브</Label>
                    <Select
                      value={form.initiativeSlug || "none"}
                      onValueChange={(v) => setForm({ ...form, initiativeSlug: v === "none" ? "" : v })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-lg bg-slate-50/50">
                        <SelectValue placeholder="선택 (선택사항)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">전체 / 미지정</SelectItem>
                        {initiatives.map((init) => (
                          <SelectItem key={init.slug} value={init.slug}>
                            {init.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1.5 block">발행일자 *</Label>
                    <Input
                      type="date"
                      value={form.publishedDate}
                      onChange={(e) => setForm({ ...form, publishedDate: e.target.value })}
                      className="h-9 text-xs rounded-lg bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1.5 block">외부 원문 링크 (선택)</Label>
                    <Input
                      value={form.linkUrl}
                      onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                      placeholder="https://..."
                      className="h-9 text-xs rounded-lg bg-slate-50/50"
                    />
                  </div>
                </div>

                {/* 2행: 대표 썸네일(50%) + 보고서 PDF 첨부(50%) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  {/* 대표 썸네일 이미지 */}
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                        대표 썸네일 이미지 (카드/헤더용)
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">자동 1600px WebP 압축</span>
                    </Label>
                    {form.imageUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 group h-24 bg-slate-50 flex items-center justify-between p-2">
                        <img src={form.imageUrl} alt="preview" className="h-full w-32 object-cover rounded-lg" />
                        <div className="flex-1 px-3 text-xs text-slate-500 truncate">
                          대표 썸네일 등록됨
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setForm({ ...form, imageUrl: "" })}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2.5 text-xs shrink-0"
                        >
                          삭제
                        </Button>
                      </div>
                    ) : (
                      <label className="w-full h-24 border-2 border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50/60 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer bg-slate-50/30">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-600 font-medium">
                          {uploadingImage ? "압축 & 업로드 중..." : "클릭하여 대표 이미지 업로드 (최대 15MB)"}
                        </span>
                      </label>
                    )}
                  </div>

                  {/* 보고서 PDF 파일 첨부 */}
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileUp className="w-3.5 h-3.5 text-slate-600" />
                        첨부파일 / 보고서 전문 PDF
                      </span>
                      {form.board === "reports" && (
                        <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.2 rounded">
                          보고서 권장
                        </span>
                      )}
                    </Label>
                    {form.fileUrl ? (
                      <div className="flex items-center justify-between p-2.5 h-24 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                            <FileIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-800 truncate block">
                              {form.fileName || "첨부 파일.pdf"}
                            </span>
                            <span className="text-[11px] text-teal-700 font-medium">PDF 파일 연결 완료</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2 text-xs shrink-0"
                          onClick={() => setForm({ ...form, fileUrl: "", fileName: "" })}
                        >
                          삭제
                        </Button>
                      </div>
                    ) : (
                      <label className="w-full h-24 border-2 border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50/60 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer bg-slate-50/30">
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={handlePdfUpload}
                          disabled={uploadingPdf}
                        />
                        <FileUp className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-600 font-medium">
                          {uploadingPdf ? "PDF 업로드 중..." : "클릭하여 PDF 보고서 파일 업로드 (최대 30MB)"}
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. 하단 100% 폭: 몰입형 리치 본문 에디터 (Full-Width Studio) */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              {/* 에디터 상단 바 (언어 탭 + 딥엘 번역 + 미리보기 토글) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveLangTab("ko")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeLangTab === "ko"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span>🇰🇷</span> 국문 작성
                    {form.titleKo && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLangTab("en")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeLangTab === "en"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span>🇺🇸</span> 영문 (English) *
                    {form.title && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* 양방향 DeepL 번역 버튼 (현재 탭에 맞춰 국->영 또는 영->국 자동 전환) */}
                  {activeLangTab === "ko" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100 hover:text-blue-900 text-xs h-8 px-3 rounded-lg shadow-2xs font-semibold"
                      onClick={handleTranslateKoToEn}
                      disabled={translating || !form.titleKo}
                      title="작성하신 국문 내용을 기반으로 영문 필드를 자동 번역하여 완성합니다 (서식/사진 보존)"
                    >
                      <Languages className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      {translating ? "번역 중..." : "🇰🇷 국문 → 🇺🇸 영문 자동 번역"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 text-xs h-8 px-3 rounded-lg shadow-2xs font-semibold"
                      onClick={handleTranslateEnToKo}
                      disabled={translating || !form.title}
                      title="작성하신 영문 내용을 기반으로 국문 필드를 자동 번역하여 완성합니다 (서식/사진 보존)"
                    >
                      <Languages className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                      {translating ? "번역 중..." : "🇺🇸 영문 → 🇰🇷 국문 자동 번역"}
                    </Button>
                  )}

                  {/* 실시간 미리보기 토글 */}
                  <Button
                    type="button"
                    size="sm"
                    variant={isPreviewMode ? "default" : "outline"}
                    className={`text-xs h-8 px-3 rounded-lg shadow-2xs font-semibold ${
                      isPreviewMode
                        ? "bg-[#0f2445] text-white hover:bg-[#1a3a60]"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                  >
                    {isPreviewMode ? (
                      <>
                        <Edit3 className="w-3.5 h-3.5 mr-1.5" /> 편집 모드로 돌아가기
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> 실시간 미리보기
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 3. 리치 포스팅 툴바 (Posting Toolbar) */}
              {!isPreviewMode && (
                <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  {/* 서식 도구들 */}
                  <button
                    type="button"
                    onClick={() => insertFormatting("## ", "\n", "소제목 2")}
                    className="p-1.5 px-2 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors flex items-center gap-0.5"
                    title="소제목 2 (H2)"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("### ", "\n", "소제목 3")}
                    className="p-1.5 px-2 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors flex items-center gap-0.5"
                    title="소제목 3 (H3)"
                  >
                    <Heading3 className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-slate-200 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormatting("**", "**", "굵은 텍스트")}
                    className="p-1.5 px-2 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors"
                    title="굵게 (Bold)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("*", "*", "기울임 텍스트")}
                    className="p-1.5 px-2 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors"
                    title="기울임 (Italic)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("> ", "\n", "인용 문구를 입력하세요")}
                    className="p-1.5 px-2 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors"
                    title="인용구 (Blockquote)"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-slate-200 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormatting("- ", "\n", "목록 항목")}
                    className="p-1.5 px-2 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors"
                    title="글머리 기호 목록"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("1. ", "\n", "순서 목록 항목")}
                    className="p-1.5 px-2 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors"
                    title="번호 목록"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("[링크 텍스트](", ")", "https://...")}
                    className="p-1.5 px-2 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors"
                    title="하이퍼링크 삽입"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("\n---\n", "\n")}
                    className="p-1.5 px-2 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors"
                    title="구분선 삽입"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-px h-4 bg-slate-200 mx-1" />

                  {/* 본문 사진 업로드 및 삽입 버튼 (핵심!) */}
                  <input
                    type="file"
                    ref={inlineImageInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleInlineImageUpload}
                    disabled={uploadingInlineImage}
                  />
                  <button
                    type="button"
                    onClick={() => inlineImageInputRef.current?.click()}
                    disabled={uploadingInlineImage}
                    className="p-1.5 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-all flex items-center gap-1.5 ml-auto border border-teal-200/80 shadow-2xs"
                    title="본문 커서 위치에 사진을 업로드하고 삽입합니다"
                  >
                    <ImagePlus className="w-3.5 h-3.5 text-teal-600" />
                    <span>{uploadingInlineImage ? "본문 사진 업로드 중..." : "🖼️ 본문 사진 삽입"}</span>
                  </button>
                </div>
              )}

              {/* 4. 에디터 폼 본체 (국문 / 영문 / 미리보기) */}
              {isPreviewMode ? (
                /* 미리보기 화면 */
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200 min-h-[420px] space-y-4">
                  <div className="border-b border-slate-200 pb-4">
                    <Badge variant="outline" className="text-xs mb-2">
                      {activeLangTab === "ko" ? "🇰🇷 국문 미리보기" : "🇺🇸 영문 미리보기"}
                    </Badge>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      {activeLangTab === "ko" ? form.titleKo || "(제목 없음)" : form.title || "(No Title)"}
                    </h1>
                    {(activeLangTab === "ko" ? form.excerptKo : form.excerpt) && (
                      <p className="text-sm text-slate-500 mt-2 italic bg-white p-3 rounded-xl border border-slate-200">
                        {activeLangTab === "ko" ? form.excerptKo : form.excerpt}
                      </p>
                    )}
                  </div>
                  <MarkdownRenderer
                    content={
                      (activeLangTab === "ko" ? form.contentKo : form.content) ||
                      "*(작성된 본문 내용이 없습니다)*"
                    }
                  />
                </div>
              ) : activeLangTab === "ko" ? (
                /* 국문 작성 폼 (100% 풀 와이드) */
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
                      제목 (국문)
                    </Label>
                    <Input
                      value={form.titleKo}
                      onChange={(e) => setForm({ ...form, titleKo: e.target.value })}
                      placeholder="한국어 제목을 입력하세요..."
                      className="text-base sm:text-lg font-bold h-12 rounded-xl border-slate-200 focus:border-[#0f2445]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
                      요약문 (국문)
                    </Label>
                    <Textarea
                      rows={2}
                      value={form.excerptKo}
                      onChange={(e) => setForm({ ...form, excerptKo: e.target.value })}
                      placeholder="목록 및 홈 화면에 노출될 1~2줄 요약문..."
                      className="text-xs leading-relaxed rounded-xl border-slate-200 focus:border-[#0f2445]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>상세 본문 (국문)</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        위 툴바를 이용해 소제목, 볼드, 본문 사진을 자유롭게 삽입하세요
                      </span>
                    </Label>
                    <Textarea
                      ref={contentKoRef}
                      rows={14}
                      value={form.contentKo}
                      onChange={(e) => setForm({ ...form, contentKo: e.target.value })}
                      placeholder="블로그를 쓰듯이 본문 내용을 자유롭게 작성하세요...&#10;&#10;사진을 넣고 싶을 때는 원하는 줄에 커서를 두고 상단의 [🖼️ 본문 사진 삽입] 버튼을 누르시면 됩니다."
                      className="text-sm leading-relaxed font-sans rounded-xl border-slate-200 focus:border-[#0f2445] min-h-[320px]"
                    />
                  </div>
                </div>
              ) : (
                /* 영문 작성 폼 (100% 풀 와이드) */
                <div className="space-y-4 animate-in fade-in-50 duration-150">
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Title (English) *</span>
                      <span className="text-[10px] text-slate-400 font-normal">글로벌 사이트 기본 표시 언어</span>
                    </Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Enter English Title..."
                      className="text-base sm:text-lg font-bold h-12 rounded-xl border-slate-200 focus:border-[#0f2445]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1.5 block">
                      Excerpt (English) *
                    </Label>
                    <Textarea
                      rows={2}
                      value={form.excerpt}
                      onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                      placeholder="Short summary for preview cards..."
                      className="text-xs leading-relaxed rounded-xl border-slate-200 focus:border-[#0f2445]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Content (English) *</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Markdown formatting and inline images are supported
                      </span>
                    </Label>
                    <Textarea
                      ref={contentEnRef}
                      rows={14}
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="Detailed article or report content in English...&#10;&#10;Place cursor and click [🖼️ 본문 사진 삽입] to insert pictures anywhere."
                      className="text-sm leading-relaxed font-sans rounded-xl border-slate-200 focus:border-[#0f2445] min-h-[320px]"
                    />
                  </div>
                </div>
              )}

              {/* 하단 에디터 가이드 상태바 */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {activeLangTab === "ko" ? "🇰🇷 국문 작성 모드" : "🇺🇸 영문 작성 모드 (글로벌 필수)"}
                </span>
                <span>
                  {activeLangTab === "ko" && !form.title && (
                    <span className="text-amber-600 font-medium">⚠️ 저장 전 상단의 [국문 → 영문 자동 번역] 또는 직접 영문 작성이 필요합니다.</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-row items-center justify-between">
            <p className="text-xs text-slate-500 hidden sm:block">
              💡 국문 작성 후 <span className="font-semibold text-slate-700">[국문 → 영문 자동 번역]</span>을 누르면 영문 버전이 즉시 생성됩니다.
            </p>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" onClick={() => setFormOpen(false)} className="rounded-lg text-xs h-9 px-4">
                취소
              </Button>
              <Button
                className="bg-[#0f2445] hover:bg-[#1a3a60] text-white font-semibold rounded-lg text-xs h-9 px-5 shadow-sm"
                onClick={() => saveMutation.mutate()}
                disabled={
                  saveMutation.isPending ||
                  (!form.title.trim() && !form.titleKo.trim()) ||
                  (!form.content.trim() && !form.contentKo.trim()) ||
                  !form.publishedDate
                }
              >
                {saveMutation.isPending ? "저장 중..." : editing ? "수정사항 저장" : "게시글 발행"}
              </Button>
            </div>
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

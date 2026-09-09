import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
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
  X,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
  getGlossary,
  saveGlossary,
  findPostsContainingTerm,
  batchReplaceTermInPosts,
  type GlossaryItem,
} from "@/lib/queries";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import type { Post } from "@/lib/database.types";

type BoardFilter = "all" | "news" | "diaspora" | "reports";

export default function AdminPostsTab() {
  const { toast } = useToast();
  const [boardFilter, setBoardFilter] = useState<BoardFilter>("all");
  const [initiativeFilter, setInitiativeFilter] = useState<string>("all");
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

  const { user } = useAuth();
  const userKey = user?.id || user?.email || "default";

  // 영문 자동 번역 토글 상태 (작성자 계정별로 독립 저장 및 유지)
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      // 1. 작성자(관리자 계정)의 Supabase user_metadata 우선 확인
      const metaVal = user.user_metadata?.auto_translate;
      if (typeof metaVal === "boolean") {
        setAutoTranslateEnabled(metaVal);
        localStorage.setItem(`cordia_admin_auto_translate_${userKey}`, String(metaVal));
        return;
      }
      // 2. 브라우저 localStorage의 작성자별 설정 확인
      const saved = localStorage.getItem(`cordia_admin_auto_translate_${userKey}`);
      if (saved !== null) {
        setAutoTranslateEnabled(saved === "true");
      }
    } catch {
      // ignore
    }
  }, [user, userKey]);

  const toggleAutoTranslate = async (val: boolean) => {
    setAutoTranslateEnabled(val);
    try {
      localStorage.setItem(`cordia_admin_auto_translate_${userKey}`, String(val));
      if (user) {
        // 현재 로그인한 작성자 계정에 영구 저장
        await supabase.auth.updateUser({
          data: { auto_translate: val },
        });
      }
    } catch (e) {
      console.warn("Failed to persist author auto-translate setting:", e);
    }
  };

  const [confirmTranslateOpen, setConfirmTranslateOpen] = useState(false);

  // 고정 용어 사전 로드
  const { data: glossary = [] } = useQuery({
    queryKey: ["glossary"],
    queryFn: getGlossary,
  });

  // 본문 텍스트 드래그 시 뜨는 플로팅 용어 팝오버 상태
  interface FloatingPopoverState {
    open: boolean;
    x: number;
    y: number;
    selectedText: string;
    lang: "ko" | "en";
    matched: GlossaryItem | null;
    ko: string;
    en: string;
  }
  const [floatingPopover, setFloatingPopover] = useState<FloatingPopoverState | null>(null);
  const [savingGlossary, setSavingGlossary] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement | null>(null);

  // 용어 수정 시 다른 게시글 일괄 변경 확인 모달 상태
  interface BatchConfirmState {
    open: boolean;
    matchedPosts: Post[];
    oldKo: string;
    newKo: string;
    oldEn: string;
    newEn: string;
    updating: boolean;
  }
  const [batchConfirm, setBatchConfirm] = useState<BatchConfirmState | null>(null);

  // 텍스트 선택 후 우클릭(Context Menu) 시 플로팅 팝오버 오픈
  const handleElementContextMenu = (
    e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>,
    lang: "ko" | "en"
  ) => {
    const el = e.currentTarget;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = el.value.substring(start, end).trim();

    // 2자 이상 선택된 상태에서 우클릭 시에만 커스텀 팝오버를 띄우고 브라우저 기본 메뉴 방지
    if (!selected || selected.length < 2 || selected.length > 60) {
      return;
    }

    e.preventDefault();

    const match = glossary.find(
      (g) =>
        g.ko.trim().toLowerCase() === selected.toLowerCase() ||
        g.en.trim().toLowerCase() === selected.toLowerCase()
    );

    const popoverWidth = 340;
    const popoverHeight = 250;

    // 모달(dialogContentRef) 내부 상대 좌표 계산
    const dialogRect = dialogContentRef.current?.getBoundingClientRect();
    const offsetX = dialogRect ? e.clientX - dialogRect.left : e.clientX;
    const offsetY = dialogRect ? e.clientY - dialogRect.top : e.clientY;

    const maxX = (dialogRect?.width ?? window.innerWidth) - popoverWidth - 16;
    const maxY = (dialogRect?.height ?? window.innerHeight) - popoverHeight - 16;

    const x = Math.min(maxX, Math.max(16, offsetX + 6));
    const y = Math.min(maxY, Math.max(16, offsetY + 6));

    setFloatingPopover({
      open: true,
      x,
      y,
      selectedText: selected,
      lang,
      matched: match || null,
      ko: match ? match.ko : lang === "ko" ? selected : "",
      en: match ? match.en : lang === "en" ? selected : "",
    });
  };

  const handleAddGlossaryTerm = async (retranslateImmediately = false) => {
    if (!floatingPopover) return;
    const ko = floatingPopover.ko.trim();
    const en = floatingPopover.en.trim();
    if (!ko || !en) {
      toast({ title: "국문과 영문 표기를 모두 입력해주세요.", variant: "destructive" });
      return;
    }
    setSavingGlossary(true);
    try {
      const newItem: GlossaryItem = {
        id: crypto.randomUUID(),
        ko,
        en,
      };
      const nextList = [...glossary, newItem];
      await saveGlossary(nextList);
      queryClient.setQueryData(["glossary"], nextList);
      setFloatingPopover(null);

      if (retranslateImmediately) {
        toast({ title: "용어 등록 완료", description: `"${ko}" ↔ "${en}" 등록 후 다시 번역을 실행합니다.` });
        if (activeLangTab === "ko" && (form.titleKo || form.contentKo)) {
          await handleTranslateKoToEn();
        } else if (activeLangTab === "en" && (form.title || form.content)) {
          await handleTranslateEnToKo();
        }
      } else {
        toast({
          title: "고정 용어 등록 완료",
          description: `"${ko}" ↔ "${en}" (자동 번역 시 100% 고정 반영됩니다)`,
        });
      }
    } catch (err: any) {
      toast({ title: "용어 등록 실패", description: err.message, variant: "destructive" });
    } finally {
      setSavingGlossary(false);
    }
  };

  const handleUpdateGlossaryTerm = async (retranslateImmediately = false) => {
    if (!floatingPopover || !floatingPopover.matched) return;
    const oldItem = floatingPopover.matched;
    const newKo = floatingPopover.ko.trim();
    const newEn = floatingPopover.en.trim();

    if (!newKo || !newEn) {
      toast({ title: "국문과 영문 표기를 모두 입력해주세요.", variant: "destructive" });
      return;
    }

    if (oldItem.ko.trim() === newKo && oldItem.en.trim() === newEn) {
      setFloatingPopover(null);
      return;
    }

    setSavingGlossary(true);
    try {
      // 다른 게시글에서 이 단어가 사용되었는지 조회
      const matchedPosts = await findPostsContainingTerm(oldItem.ko, oldItem.en);
      const otherPosts = editing ? matchedPosts.filter((p) => p.id !== editing.id) : matchedPosts;

      if (otherPosts.length > 0) {
        setBatchConfirm({
          open: true,
          matchedPosts: otherPosts,
          oldKo: oldItem.ko,
          newKo,
          oldEn: oldItem.en,
          newEn,
          updating: false,
        });
        setFloatingPopover(null);
        return;
      }

      // 다른 글에 없으면 사전만 업데이트
      const nextList = glossary.map((item) =>
        item.id === oldItem.id ? { ...item, ko: newKo, en: newEn } : item
      );
      await saveGlossary(nextList);
      queryClient.setQueryData(["glossary"], nextList);
      setFloatingPopover(null);

      if (retranslateImmediately) {
        toast({ title: "용어 수정 완료", description: `"${newKo}" ↔ "${newEn}" 수정 후 다시 번역합니다.` });
        if (activeLangTab === "ko" && (form.titleKo || form.contentKo)) {
          await handleTranslateKoToEn();
        } else if (activeLangTab === "en" && (form.title || form.content)) {
          await handleTranslateEnToKo();
        }
      } else {
        toast({
          title: "고정 용어 수정 완료",
          description: `"${newKo}" ↔ "${newEn}"`,
        });
      }
    } catch (err: any) {
      toast({ title: "용어 수정 실패", description: err.message, variant: "destructive" });
    } finally {
      setSavingGlossary(false);
    }
  };

  const handleExecuteBatchReplace = async (replaceInOtherPosts: boolean) => {
    if (!batchConfirm) return;
    setBatchConfirm((b) => (b ? { ...b, updating: true } : null));

    try {
      const nextList = glossary.map((item) =>
        item.ko === batchConfirm.oldKo || item.en === batchConfirm.oldEn
          ? { ...item, ko: batchConfirm.newKo, en: batchConfirm.newEn }
          : item
      );
      await saveGlossary(nextList);
      queryClient.setQueryData(["glossary"], nextList);

      if (replaceInOtherPosts && batchConfirm.matchedPosts.length > 0) {
        const count = await batchReplaceTermInPosts(
          batchConfirm.matchedPosts,
          batchConfirm.oldKo,
          batchConfirm.newKo,
          batchConfirm.oldEn,
          batchConfirm.newEn
        );
        queryClient.invalidateQueries({ queryKey: ["admin_posts"] });
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        toast({
          title: "일괄 수정 완료",
          description: `고정 용어 사전 및 다른 게시글 ${count}개에서 단어가 일괄 교체되었습니다.`,
        });
      } else {
        toast({
          title: "고정 용어 사전 수정 완료",
          description: "다른 게시글은 유지하고 용어 사전만 수정되었습니다.",
        });
      }

      if (formOpen) {
        setForm((f) => ({
          ...f,
          titleKo: f.titleKo.replaceAll(batchConfirm.oldKo, batchConfirm.newKo),
          excerptKo: f.excerptKo.replaceAll(batchConfirm.oldKo, batchConfirm.newKo),
          contentKo: f.contentKo.replaceAll(batchConfirm.oldKo, batchConfirm.newKo),
          title: f.title.replace(new RegExp(batchConfirm.oldEn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), batchConfirm.newEn),
          excerpt: f.excerpt.replace(new RegExp(batchConfirm.oldEn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), batchConfirm.newEn),
          content: f.content.replace(new RegExp(batchConfirm.oldEn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), batchConfirm.newEn),
        }));
      }
    } catch (err: any) {
      toast({ title: "일괄 수정 실패", description: err.message, variant: "destructive" });
    } finally {
      setBatchConfirm(null);
    }
  };

  const handleDeleteGlossaryTerm = async () => {
    if (!floatingPopover || !floatingPopover.matched) return;
    const item = floatingPopover.matched;
    setSavingGlossary(true);
    try {
      const nextList = glossary.filter((g) => g.id !== item.id);
      await saveGlossary(nextList);
      queryClient.setQueryData(["glossary"], nextList);
      toast({ title: "고정 용어 삭제 완료", description: `"${item.ko}" 용어가 사전에서 삭제되었습니다.` });
      setFloatingPopover(null);
    } catch (err: any) {
      toast({ title: "삭제 실패", description: err.message, variant: "destructive" });
    } finally {
      setSavingGlossary(false);
    }
  };

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

  const { data: initiatives = [] } = useQuery({
    queryKey: ["initiatives"],
    queryFn: getInitiatives,
  });

  const getInitiativeTitle = (slug?: string | null) => {
    if (!slug) return null;
    const init = initiatives.find((i) => i.slug === slug);
    return init ? init.title_ko || init.title : slug;
  };

  const { data: postsData, isLoading } = useQuery({
    queryKey: ["admin_posts", boardFilter, initiativeFilter, page, limit, searchQuery],
    queryFn: () =>
      getPosts({
        board: boardFilter === "all" ? undefined : boardFilter,
        initiativeSlug: initiativeFilter === "all" ? undefined : initiativeFilter,
        page,
        limit,
        search: searchQuery || undefined,
      }),
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
    mutationFn: async (overrideForm?: typeof form) => {
      const activeForm = overrideForm || form;
      const finalTitleKo = activeForm.titleKo.trim() || null;
      const finalContentKo = activeForm.contentKo.trim() || null;
      const finalExcerptKo = activeForm.excerptKo.trim() || (finalContentKo ? finalContentKo.slice(0, 150) : null);

      const finalTitle = activeForm.title.trim() || finalTitleKo || "";
      const finalContent = activeForm.content.trim() || finalContentKo || "";
      const finalExcerpt = activeForm.excerpt.trim() || finalExcerptKo || (finalContent ? finalContent.slice(0, 150) : "");

      const payload: Record<string, any> = {
        board: activeForm.board,
        title: finalTitle,
        excerpt: finalExcerpt,
        content: finalContent,
        title_ko: finalTitleKo,
        excerpt_ko: finalExcerptKo,
        content_ko: finalContentKo,
        image_url: activeForm.imageUrl || null,
        link_url: activeForm.linkUrl || null,
        initiative_slug: activeForm.initiativeSlug && activeForm.initiativeSlug !== "none" ? activeForm.initiativeSlug : null,
        is_pinned_home: editing ? editing.is_pinned_home : false,
        published_date: new Date(activeForm.publishedDate).toISOString(),
      };

      // 파일이 첨부된 경우에만 컬럼 전송 (PostgREST schema cache 400 에러 방지)
      if (activeForm.fileUrl) payload.file_url = activeForm.fileUrl;
      if (activeForm.fileName) payload.file_name = activeForm.fileName;

      if (editing) {
        await updatePost(editing.id, payload);
      } else {
        await createPost(payload as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setFormOpen(false);
      setConfirmTranslateOpen(false);
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

  const executeSaveWithAutoTranslate = async () => {
    setTranslating(true);
    try {
      const sources = [form.titleKo, form.excerptKo, form.contentKo];
      const [tEn, eEn, cEn] = await translateTexts(sources.map((t) => t || " "), "EN-US");
      const updatedForm = {
        ...form,
        title: tEn.trim(),
        excerpt: eEn.trim(),
        content: cEn.trim(),
      };
      setForm(updatedForm);
      await saveMutation.mutateAsync(updatedForm);
      toast({
        title: "영문 자동 번역 및 저장 완료",
        description: "영문 제목·요약·본문이 자동 생성되어 함께 저장되었습니다.",
      });
    } catch (err: any) {
      toast({
        title: "영문 자동 번역 실패",
        description: (err.message || "번역 중 오류가 발생했습니다.") + " 국문으로 우선 저장합니다.",
        variant: "destructive",
      });
      await saveMutation.mutateAsync(form);
    } finally {
      setTranslating(false);
    }
  };

  const handleInitiateSave = async () => {
    const hasKo = Boolean(form.titleKo.trim() || form.contentKo.trim());
    const hasEn = Boolean(form.title.trim() && form.content.trim());
    const isKoChanged = editing
      ? form.titleKo.trim() !== (editing.title_ko || "").trim() || form.contentKo.trim() !== (editing.content_ko || "").trim()
      : false;

    // 1. 자동 번역 모드가 ON인 경우
    if (autoTranslateEnabled && hasKo) {
      if (!hasEn || !editing || isKoChanged) {
        await executeSaveWithAutoTranslate();
        return;
      }
    }

    // 2. 자동 번역 모드가 OFF인데 영문이 비어있거나, 국문이 수정된 경우 (확인 팝업)
    if (hasKo && (!hasEn || (editing && isKoChanged))) {
      setConfirmTranslateOpen(true);
      return;
    }

    // 3. 일반 저장
    saveMutation.mutate(form);
  };

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
        <div className="flex items-center gap-2.5">
          {/* 포스팅 집중 작업용 영문 자동 번역 스위치 */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-colors">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className={`w-3.5 h-3.5 ${autoTranslateEnabled ? "text-blue-600" : "text-slate-400"}`} />
              저장 시 자동 번역
            </span>
            <Switch
              checked={autoTranslateEnabled}
              onCheckedChange={toggleAutoTranslate}
              aria-label="저장 시 자동 번역"
            />
          </div>
          <Button onClick={openCreate} className="bg-[#0f2445] hover:bg-[#1a3a60] text-white font-medium">
            <Plus className="w-4 h-4 mr-2" />새 글
          </Button>
        </div>
      </div>

      {/* Filters (쇼핑몰 스타일 복합 조건 필터) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 1. 대분류: 게시판 세그먼트 버튼 탭 */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70">
            {[
              { id: "all", label: "전체 게시판" },
              { id: "news", label: "뉴스 & 공지" },
              { id: "reports", label: "산업분석 보고서" },
              { id: "diaspora", label: "K-디아스포라" },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setBoardFilter(b.id as BoardFilter);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  boardFilter === b.id
                    ? "bg-[#0f2445] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* 보기 개수 */}
          <Select
            value={String(limit)}
            onValueChange={(v) => {
              setLimit(parseInt(v, 10));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-28 h-8 text-xs rounded-lg bg-slate-50 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10개씩 보기</SelectItem>
              <SelectItem value="20">20개씩 보기</SelectItem>
              <SelectItem value="50">50개씩 보기</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 2. 소분류: 이니셔티브 필터 + 검색창 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="w-full sm:w-64 shrink-0">
            <Select
              value={initiativeFilter}
              onValueChange={(v) => {
                setInitiativeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/70 border-slate-200">
                <SelectValue placeholder="모든 이니셔티브" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🌐 전체 이니셔티브 (모두 보기)</SelectItem>
                {initiatives.map((init) => (
                  <SelectItem key={init.slug} value={init.slug}>
                    {init.title_ko || init.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative flex-1">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="제목·요약·내용 통합 키워드 검색..."
              className="pl-9 pr-8 h-9 text-xs rounded-xl bg-slate-50/70 border-slate-200"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            onClick={runSearch}
            className="h-9 px-4 text-xs font-semibold bg-[#0f2445] hover:bg-[#1a3a60] text-white rounded-xl shrink-0"
          >
            검색
          </Button>
        </div>

        {/* 3. 복합 필터 Active Tags (적용된 필터 칩) */}
        {(boardFilter !== "all" || initiativeFilter !== "all" || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">적용된 조건:</span>
            {boardFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 bg-slate-200/80 text-slate-700 text-xs py-0.5 px-2 font-medium">
                게시판: {boardFilter === "news" ? "뉴스" : boardFilter === "reports" ? "보고서" : "K-디아스포라"}
                <button
                  onClick={() => {
                    setBoardFilter("all");
                    setPage(1);
                  }}
                  className="hover:text-slate-900 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {initiativeFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 bg-teal-100 text-teal-800 text-xs py-0.5 px-2 font-medium">
                이니셔티브: {getInitiativeTitle(initiativeFilter)}
                <button
                  onClick={() => {
                    setInitiativeFilter("all");
                    setPage(1);
                  }}
                  className="hover:text-teal-950 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800 text-xs py-0.5 px-2 font-medium">
                키워드: "{searchQuery}"
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                    setPage(1);
                  }}
                  className="hover:text-blue-950 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={() => {
                setBoardFilter("all");
                setInitiativeFilter("all");
                setSearchInput("");
                setSearchQuery("");
                setPage(1);
              }}
              className="text-xs text-slate-500 hover:text-red-600 font-medium underline ml-auto transition-colors"
            >
              전체 필터 초기화
            </button>
          </div>
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
            <Card
              key={post.id}
              onClick={() => openEdit(post)}
              className="border border-gray-100 hover:border-slate-300 hover:shadow-md cursor-pointer transition-all duration-150 group"
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {post.image_url && (
                    <img src={post.image_url} alt="" className="w-12 h-12 object-cover rounded-lg shrink-0 group-hover:opacity-95" />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
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
                        {post.board === "news" ? "뉴스" : post.board === "reports" ? "보고서" : "K-디아스포라"}
                      </Badge>
                      {post.initiative_slug && getInitiativeTitle(post.initiative_slug) && (
                        <Badge variant="secondary" className="shrink-0 text-[11px] bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          {getInitiativeTitle(post.initiative_slug)}
                        </Badge>
                      )}
                      {post.is_pinned_home && (
                        <Badge variant="secondary" className="shrink-0 text-[10px] bg-amber-100 text-amber-800 font-medium">
                          홈 고정
                        </Badge>
                      )}
                      <p className="font-semibold text-cordia-dark group-hover:text-blue-700 transition-colors truncate">
                        {post.title_ko || post.title}
                      </p>
                      {post.title_ko && post.title && post.title_ko !== post.title && (
                        <span className="text-xs text-slate-400 truncate hidden md:inline">
                          ({post.title})
                        </span>
                      )}
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
                <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(post);
                    }}
                    title="게시글 수정"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(post.id);
                    }}
                    title="게시글 삭제"
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
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setFloatingPopover(null);
        }}
      >
        <DialogContent
          ref={dialogContentRef}
          className="max-w-5xl w-[96vw] max-h-[94vh] flex flex-col p-0 overflow-hidden bg-white shadow-2xl rounded-2xl border border-slate-200"
        >
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
                            {init.title_ko || init.title}
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
                    국문 작성
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
                    영문 (English) *
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
                      title="작성하신 국문 내용을 기반으로 영문 필드를 자동 번역합니다."
                    >
                      <Languages className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      {translating ? "번역 중..." : "자동 번역"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 text-xs h-8 px-3 rounded-lg shadow-2xs font-semibold"
                      onClick={handleTranslateEnToKo}
                      disabled={translating || !form.title}
                      title="작성하신 영문 내용을 기반으로 국문 필드를 자동 번역합니다."
                    >
                      <Languages className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                      {translating ? "번역 중..." : "자동 번역"}
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
                    <Label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>제목 (국문)</span>
                      <span className="text-[10px] text-slate-400 font-normal">단어 드래그 후 우클릭 시 고정 용어 사전 연동</span>
                    </Label>
                    <Input
                      value={form.titleKo}
                      onChange={(e) => setForm({ ...form, titleKo: e.target.value })}
                      onContextMenu={(e) => handleElementContextMenu(e, "ko")}
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
                      onContextMenu={(e) => handleElementContextMenu(e, "ko")}
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
                      onContextMenu={(e) => handleElementContextMenu(e, "ko")}
                      placeholder="블로그를 쓰듯이 본문 내용을 자유롭게 작성하세요...&#10;&#10;사진을 넣고 싶을 때는 원하는 줄에 커서를 두고 상단의 [🖼️ 본문 사진 삽입] 버튼을 누르시면 됩니다.&#10;&#10;💡 제목·요약·본문에서 단어를 드래그하고 마우스 우클릭하면 고정 용어 사전 등록/조회 팝오버가 뜹니다."
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
                      <span className="text-[10px] text-slate-400 font-normal">단어 드래그 후 우클릭 시 고정 용어 사전 연동</span>
                    </Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      onContextMenu={(e) => handleElementContextMenu(e, "en")}
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
                      onContextMenu={(e) => handleElementContextMenu(e, "en")}
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
                      onContextMenu={(e) => handleElementContextMenu(e, "en")}
                      placeholder="Detailed article or report content in English...&#10;&#10;Place cursor and click [🖼️ 본문 사진 삽입] to insert pictures anywhere.&#10;&#10;💡 Drag any word and right-click to look up or register fixed glossary terms."
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
                    <span className="text-amber-600 font-medium">⚠️ 저장 전 상단의 [자동 번역] 또는 직접 영문 작성이 필요합니다.</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={autoTranslateEnabled}
                onCheckedChange={toggleAutoTranslate}
                id="modal-auto-translate"
              />
              <label htmlFor="modal-auto-translate" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5">
                <Sparkles className={`w-3.5 h-3.5 ${autoTranslateEnabled ? "text-blue-600" : "text-slate-400"}`} />
                저장 시 자동 번역
                <span className={`text-[11px] font-normal ${autoTranslateEnabled ? "text-blue-600 font-bold" : "text-slate-400"}`}>
                  ({autoTranslateEnabled ? "켜짐" : "꺼짐"})
                </span>
              </label>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" onClick={() => setFormOpen(false)} className="rounded-lg text-xs h-9 px-4">
                취소
              </Button>
              {editing ? (
                <>
                  <Button
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 font-medium rounded-lg text-xs h-9 px-3.5 shadow-2xs"
                    onClick={() => saveMutation.mutate(form)}
                    disabled={
                      saveMutation.isPending ||
                      translating ||
                      (!form.title.trim() && !form.titleKo.trim()) ||
                      (!form.content.trim() && !form.contentKo.trim()) ||
                      !form.publishedDate
                    }
                    title="오타 수정 등 가벼운 편집 시 기존 영문 내용을 보존하고 저장합니다."
                  >
                    {saveMutation.isPending ? "저장 중..." : "수정사항만 저장 (영문 유지)"}
                  </Button>
                  <Button
                    className="bg-[#0f2445] hover:bg-[#1a3a60] text-white font-semibold rounded-lg text-xs h-9 px-4 shadow-sm flex items-center gap-1.5"
                    onClick={executeSaveWithAutoTranslate}
                    disabled={
                      saveMutation.isPending ||
                      translating ||
                      (!form.titleKo.trim() && !form.title.trim()) ||
                      !form.publishedDate
                    }
                    title="국문 내용을 기반으로 영문을 새로 자동 번역하여 함께 저장합니다."
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                    {translating ? "번역 및 저장 중..." : "번역 후 저장 (영문 최신화)"}
                  </Button>
                </>
              ) : (
                <Button
                  className="bg-[#0f2445] hover:bg-[#1a3a60] text-white font-semibold rounded-lg text-xs h-9 px-5 shadow-sm flex items-center gap-1.5"
                  onClick={autoTranslateEnabled && (!form.title.trim() || !form.content.trim()) ? executeSaveWithAutoTranslate : () => saveMutation.mutate(form)}
                  disabled={
                    saveMutation.isPending ||
                    translating ||
                    (!form.title.trim() && !form.titleKo.trim()) ||
                    (!form.content.trim() && !form.contentKo.trim()) ||
                    !form.publishedDate
                  }
                >
                  {autoTranslateEnabled && (!form.title.trim() || !form.content.trim()) && (
                    <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                  )}
                  {translating
                    ? "번역 및 발행 중..."
                    : saveMutation.isPending
                    ? "발행 중..."
                    : autoTranslateEnabled && (!form.title.trim() || !form.content.trim())
                    ? "자동 번역 후 발행"
                    : "게시글 발행"}
                </Button>
              )}
            </div>
          </DialogFooter>

          {/* 플로팅 용어 팝오버 (단어 드래그 후 마우스 우클릭 시 모달 내부 커서 위치에 출현) */}
          {floatingPopover && (
            <>
              {/* 모달 내부 바깥 클릭 시 팝오버만 닫히는 오버레이 */}
              <div
                className="absolute inset-0 z-[60] bg-transparent"
                onClick={() => setFloatingPopover(null)}
              />
              <div
                style={{
                  position: "absolute",
                  left: `${floatingPopover.x}px`,
                  top: `${floatingPopover.y}px`,
                  zIndex: 70,
                }}
                className="w-[340px] bg-white p-3.5 rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-2.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      {floatingPopover.matched ? "등록된 고정 용어 (수정 가능)" : "새 고정 용어 등록"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFloatingPopover(null)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">국문 표기</span>
                    <Input
                      value={floatingPopover.ko}
                      onChange={(e) => setFloatingPopover({ ...floatingPopover, ko: e.target.value })}
                      placeholder="국문 표기"
                      className="h-8 text-xs rounded-lg"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">공식 영문 표기</span>
                    <Input
                      value={floatingPopover.en}
                      onChange={(e) => setFloatingPopover({ ...floatingPopover, en: e.target.value })}
                      placeholder="공식 영문 표기"
                      className="h-8 text-xs rounded-lg"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          floatingPopover.matched ? handleUpdateGlossaryTerm(false) : handleAddGlossaryTerm(false);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">
                  {floatingPopover.matched ? (
                    <>
                      <button
                        type="button"
                        onClick={handleDeleteGlossaryTerm}
                        disabled={savingGlossary}
                        className="text-[11px] text-red-500 hover:text-red-700 underline font-medium"
                      >
                        삭제
                      </button>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => handleUpdateGlossaryTerm(false)}
                          disabled={savingGlossary || !floatingPopover.ko || !floatingPopover.en}
                          className="h-7 text-xs px-2.5 rounded-lg border-slate-300 hover:bg-slate-50"
                        >
                          {savingGlossary ? "저장 중..." : "수정"}
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => handleUpdateGlossaryTerm(true)}
                          disabled={savingGlossary || !floatingPopover.ko || !floatingPopover.en || translating}
                          className="h-7 text-xs bg-[#0f2445] hover:bg-[#1a3a60] text-white px-2.5 rounded-lg flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-blue-300" />
                          수정 후 바로 번역
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-slate-400">번역 시 고정 치환</span>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => handleAddGlossaryTerm(false)}
                          disabled={savingGlossary || !floatingPopover.ko || !floatingPopover.en}
                          className="h-7 text-xs px-2.5 rounded-lg border-slate-300 hover:bg-slate-50"
                        >
                          {savingGlossary ? "등록 중..." : "등록"}
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => handleAddGlossaryTerm(true)}
                          disabled={savingGlossary || !floatingPopover.ko || !floatingPopover.en || translating}
                          className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 rounded-lg flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-blue-200" />
                          등록 후 바로 번역
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 국문 수정 / 영문 미작성 시 저장 확인 팝업 */}
      <AlertDialog open={confirmTranslateOpen} onOpenChange={setConfirmTranslateOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1 border border-blue-100 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-slate-900">
              {editing ? "영문도 함께 갱신하시겠습니까?" : "영문 번역본을 생성하시겠습니까?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 space-y-2 leading-relaxed pt-1">
              <p>
                {editing
                  ? "국문 내용이 수정되었습니다. 영문 버전도 자동 번역하여 함께 갱신할까요?"
                  : "현재 국문 내용만 작성되어 있습니다. 글로벌 방문자를 위해 영문 번역본을 함께 생성하시겠습니까?"}
              </p>
              <p className="text-slate-400 text-[11px]">
                본문 서식과 이미지 배치를 보존하며 영문으로 자동 번역됩니다.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-col gap-2 mt-3">
            <Button
              className="w-full bg-[#0f2445] hover:bg-[#1a3a60] text-white text-xs h-9 font-semibold rounded-xl shadow-xs"
              onClick={async () => {
                setConfirmTranslateOpen(false);
                await executeSaveWithAutoTranslate();
              }}
              disabled={translating || saveMutation.isPending}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              자동 번역 후 저장
            </Button>
            <div className="flex items-center gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1 text-xs h-8.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setConfirmTranslateOpen(false);
                  saveMutation.mutate(form);
                }}
                disabled={saveMutation.isPending}
              >
                현재 상태로 저장
              </Button>
              <Button
                variant="ghost"
                className="flex-1 text-xs h-8.5 rounded-xl text-slate-500 hover:text-slate-900"
                onClick={() => {
                  setConfirmTranslateOpen(false);
                  setActiveLangTab("en");
                }}
              >
                취소 (직접 확인)
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* 용어 수정 시 다른 게시글 일괄 변경 확인 모달 */}
      <AlertDialog open={Boolean(batchConfirm)} onOpenChange={(open) => !open && setBatchConfirm(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1 border border-amber-100 shadow-2xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-slate-900">
              다른 게시글에서도 일괄 수정하시겠습니까?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 space-y-2.5 leading-relaxed pt-1">
              <p>
                고정 용어가 수정되었습니다:
              </p>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                <div>
                  <span className="text-slate-400">국문: </span>
                  <span className="line-through text-red-500 mr-1.5">{batchConfirm?.oldKo}</span>
                  <span className="font-bold text-emerald-700">→ {batchConfirm?.newKo}</span>
                </div>
                <div>
                  <span className="text-slate-400">영문: </span>
                  <span className="line-through text-red-500 mr-1.5">{batchConfirm?.oldEn}</span>
                  <span className="font-bold text-emerald-700">→ {batchConfirm?.newEn}</span>
                </div>
              </div>
              <p>
                현재 이 단어가 포함된 다른 게시글 <strong className="text-blue-600">{batchConfirm?.matchedPosts.length}개</strong>가 발견되었습니다.
                다른 게시글의 본문과 제목에서도 이 단어를 새 표기로 일괄 교체하시겠습니까?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-col gap-2 mt-3">
            <Button
              className="w-full bg-[#0f2445] hover:bg-[#1a3a60] text-white text-xs h-9 font-semibold rounded-xl shadow-xs"
              onClick={() => handleExecuteBatchReplace(true)}
              disabled={batchConfirm?.updating}
            >
              {batchConfirm?.updating ? "일괄 치환 중..." : `모든 게시글 (${batchConfirm?.matchedPosts.length}개) 일괄 치환 후 저장`}
            </Button>
            <div className="flex items-center gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1 text-xs h-8.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => handleExecuteBatchReplace(false)}
                disabled={batchConfirm?.updating}
              >
                사전만 수정하고 유지
              </Button>
              <Button
                variant="ghost"
                className="flex-1 text-xs h-8.5 rounded-xl text-slate-500 hover:text-slate-900"
                onClick={() => setBatchConfirm(null)}
                disabled={batchConfirm?.updating}
              >
                취소
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

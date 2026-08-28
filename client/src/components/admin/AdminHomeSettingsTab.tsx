import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Pin, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSiteSettings, updateSiteSetting, getPosts, updatePost } from "@/lib/queries";
import type { Post } from "@/lib/database.types";

export default function AdminHomeSettingsTab() {
  const { toast } = useToast();
  const [boardTitle, setBoardTitle] = useState("Latest News");
  const [boardCount, setBoardCount] = useState("3");
  const [snsYoutube, setSnsYoutube] = useState("");
  const [snsInstagram, setSnsInstagram] = useState("");
  const [snsX, setSnsX] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: getSiteSettings,
  });

  const { data: postsData } = useQuery({
    queryKey: ["admin_posts", "news"],
    queryFn: () => getPosts({ board: "news", page: 1, limit: 100 }),
  });

  useEffect(() => {
    if (settings) {
      setBoardTitle(settings.home_board_title || "Latest News");
      setBoardCount(settings.home_board_count || "3");
      setSnsYoutube(settings.sns_youtube || "");
      setSnsInstagram(settings.sns_instagram || "");
      setSnsX(settings.sns_x || "");
    }
  }, [settings]);

  // 고정 글 먼저, 그 다음 최신순 — 홈 화면과 동일한 순서로 보여줌
  const posts = [...(postsData?.posts || [])].sort((a, b) => {
    if (a.is_pinned_home !== b.is_pinned_home) return a.is_pinned_home ? -1 : 1;
    return new Date(b.published_date).getTime() - new Date(a.published_date).getTime();
  });

  const settingsMutation = useMutation({
    mutationFn: async () => {
      await updateSiteSetting("home_board_title", boardTitle);
      await updateSiteSetting("home_board_count", boardCount);
      await updateSiteSetting("sns_youtube", snsYoutube.trim());
      await updateSiteSetting("sns_instagram", snsInstagram.trim());
      await updateSiteSetting("sns_x", snsX.trim());
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "설정 저장 완료" });
    },
    onError: (err: any) => {
      toast({ title: "오류", description: err.message, variant: "destructive" });
    },
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      updatePost(id, { is_pinned_home: pinned }),
    onSuccess: (_data, { pinned }) => {
      queryClient.invalidateQueries();
      toast({ title: pinned ? "홈 게시판에 고정됨" : "고정 해제됨" });
    },
    onError: (err: any) => {
      toast({ title: "오류", description: err.message, variant: "destructive" });
    },
  });

  const count = parseInt(boardCount, 10) || 3;

  return (
    <div className="space-y-6">
      {/* SNS 연동 링크 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>공식 SNS 연동 설정</CardTitle>
          <p className="text-xs text-gray-500 font-normal">
            웹사이트 상단 헤더 및 하단 푸터에 노출될 공식 SNS 채널 URL을 관리합니다. 비워둘 경우 해당 아이콘이 자동으로 숨겨집니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold text-gray-700">YouTube 채널 URL</Label>
              <Input
                value={snsYoutube}
                onChange={(e) => setSnsYoutube(e.target.value)}
                placeholder="https://youtube.com/@..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">Instagram URL</Label>
              <Input
                value={snsInstagram}
                onChange={(e) => setSnsInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">X (Twitter) URL</Label>
              <Input
                value={snsX}
                onChange={(e) => setSnsX(e.target.value)}
                placeholder="https://x.com/..."
                className="mt-1"
              />
            </div>
          </div>
          <Button
            className="bg-[#0f2445] hover:bg-[#1a3a60] text-white"
            onClick={() => settingsMutation.mutate()}
            disabled={settingsMutation.isPending}
          >
            {settingsMutation.isPending ? "저장 중..." : "SNS 및 홈 설정 저장"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>홈 게시판 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>섹션 제목</Label>
              <Input value={boardTitle} onChange={(e) => setBoardTitle(e.target.value)} placeholder="예: Latest News" />
            </div>
            <div>
              <Label>노출 건수</Label>
              <Input
                type="number"
                value={boardCount}
                onChange={(e) => setBoardCount(e.target.value)}
                min="1"
                max="20"
              />
            </div>
          </div>
          <Button
            className="bg-cordia-teal hover:bg-cordia-green text-white"
            onClick={() => settingsMutation.mutate()}
            disabled={settingsMutation.isPending}
          >
            {settingsMutation.isPending ? "저장 중..." : "설정 저장"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>홈 게시판 노출 글 관리</CardTitle>
          <p className="text-sm text-gray-500 font-normal">
            홈 게시판에는 <strong>고정 글이 먼저</strong>, 나머지는 <strong>최신순</strong>으로 총 {count}개가
            표시됩니다. 아래 스위치로 글을 고정하세요. 새 뉴스를 쓰면 자동으로 후보에 올라갑니다.
          </p>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">
              아직 뉴스가 없습니다. 게시글 탭에서 뉴스를 작성하면 여기에 나타납니다.
            </p>
          ) : (
            <div className="space-y-2">
              {posts.map((post: Post, idx: number) => {
                const visibleOnHome = idx < count;
                return (
                  <div
                    key={post.id}
                    className={`flex items-center justify-between gap-4 p-3 rounded-lg border ${
                      visibleOnHome ? "border-cordia-teal/40 bg-cordia-teal/5" : "border-gray-100 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {post.is_pinned_home && <Pin className="w-4 h-4 text-cordia-teal shrink-0" />}
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-cordia-dark truncate">{post.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.published_date).toLocaleDateString()}
                          {visibleOnHome && (
                            <Badge variant="outline" className="text-[10px] border-cordia-teal/40 text-cordia-teal">
                              홈에 표시 중
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">고정</span>
                      <Switch
                        checked={post.is_pinned_home}
                        onCheckedChange={(checked) => pinMutation.mutate({ id: post.id, pinned: checked })}
                        disabled={pinMutation.isPending}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { getActivePopups } from "@/lib/queries";
import type { Popup, PopupPosition } from "@/lib/database.types";
import { useLang } from "@/lib/i18n";

const POSITION_CLASSES: Record<PopupPosition, string> = {
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  "top-left": "top-24 left-4 sm:left-8",
  "top-right": "top-24 right-4 sm:right-8",
  "bottom-left": "bottom-4 left-4 sm:left-8",
  "bottom-right": "bottom-4 right-4 sm:right-8",
};

function todayKey(id: string) {
  return `popup_hide_${id}_${new Date().toISOString().split("T")[0]}`;
}

function PopupCard({ popup, onClose }: { popup: Popup; onClose: (id: string, hideToday: boolean) => void }) {
  const { lang } = useLang();
  const [hideToday, setHideToday] = useState(false);

  const body = (
    <>
      {popup.image_url && (
        <img src={popup.image_url} alt={popup.title} className="w-full h-auto block" />
      )}
      {popup.content.trim() && (
        <p className="p-4 text-sm text-gray-600 whitespace-pre-wrap">{popup.content}</p>
      )}
    </>
  );

  // 드래그로 지정한 좌표(% 기준)가 있으면 사용, 없으면 프리셋 위치
  const hasFreePosition = popup.pos_x != null && popup.pos_y != null;
  const freeStyle: React.CSSProperties = hasFreePosition
    ? {
        left: `clamp(8px, ${popup.pos_x}%, calc(100vw - ${Math.min(popup.width, 800)}px - 8px))`,
        top: `clamp(72px, ${popup.pos_y}%, calc(100vh - 160px))`,
      }
    : {};

  return (
    <div
      className={`fixed z-[90] ${hasFreePosition ? "" : POSITION_CLASSES[popup.position] || POSITION_CLASSES.center} max-w-[calc(100vw-2rem)]`}
      style={{ width: popup.width, ...freeStyle }}
      data-testid={`popup-${popup.id}`}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* 제목 헤더 */}
        <div className="flex items-center justify-between gap-3 pl-4 pr-2 py-2.5 border-b border-gray-100">
          <h3 className="font-bold text-sm text-cordia-dark truncate">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cordia-teal mr-2 align-middle" />
            {popup.title}
          </h3>
          <button
            onClick={() => onClose(popup.id, hideToday)}
            className="shrink-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
            aria-label="Close popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {popup.link_url ? (
          <a href={popup.link_url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-95">
            {body}
          </a>
        ) : (
          body
        )}

        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100">
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={hideToday}
              onChange={(e) => setHideToday(e.target.checked)}
              className="rounded border-gray-300"
            />
            {lang === "ko" ? "오늘 하루 보지 않기" : "Do not show today"}
          </label>
          <button
            onClick={() => onClose(popup.id, hideToday)}
            className="text-xs font-medium text-gray-500 hover:text-gray-800"
          >
            {lang === "ko" ? "닫기" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PopupDisplay() {
  const { lang } = useLang();
  const [closed, setClosed] = useState<string[]>([]);

  const { data: popups = [] } = useQuery({
    queryKey: ["active_popups"],
    queryFn: getActivePopups,
  });

  const visible = popups.filter((p) => {
    if (closed.includes(p.id) || localStorage.getItem(todayKey(p.id))) return false;
    // 언어별 필터링: target_lang이 없거나 "all"이면 항상 표시, "ko"나 "en"이면 해당 사이트 언어일 때만 표시
    if (!p.target_lang || p.target_lang === "all") return true;
    return p.target_lang === lang;
  });

  const handleClose = (id: string, hideToday: boolean) => {
    if (hideToday) localStorage.setItem(todayKey(id), "1");
    setClosed((c) => [...c, id]);
  };

  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((popup) => (
        <PopupCard key={popup.id} popup={popup} onClose={handleClose} />
      ))}
    </>
  );
}

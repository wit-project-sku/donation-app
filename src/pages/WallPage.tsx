import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { fetchWallEntriesPage, type WallEntry } from "../api/wall";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { WallGiverCard } from "../components/WallGiverCard";
import { PageBody } from "../components/layout/PageBody";
import { finishDonationFlow } from "../config/navigation";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { defaultDonationImage } from "../utils/defaultDonationImage";
import {
  appendKeyboardInput,
  removeLastHangul,
} from "../utils/hangulInput";
import "./WallPage.css";

const WALL_PAGE_SIZE = 4;

function donationTypeLabel(
  entry: WallEntry,
  sessionType: "one-time" | "regular",
): string {
  if (entry.id === "current") {
    return sessionType === "regular" ? "정기 후원" : "일시 후원";
  }
  return entry.paymentMethod;
}

export function WallPage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const deferredSearch = useDeferredValue(search.trim());
  const searchRef = useRef<HTMLDivElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);

  const {
    donorName,
    amount,
    donationType,
    selectedCampaign,
    capturedPhotoUrl,
    submittedRecordId,
    resetSession,
  } = useDonationStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wallEntries", { pageNum, pageSize: WALL_PAGE_SIZE, keyword: deferredSearch }],
    queryFn: () =>
      fetchWallEntriesPage({
        pageNum,
        pageSize: WALL_PAGE_SIZE,
        keyword: deferredSearch,
      }),
  });

  useEffect(() => {
    setPageNum(1);
  }, [deferredSearch]);

  useEffect(() => {
    if (!keyboardOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        searchRef.current?.contains(target) ||
        keyboardRef.current?.contains(target)
      ) {
        return;
      }
      setKeyboardOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [keyboardOpen]);

  const userEntry: WallEntry | null =
    submittedRecordId == null && selectedCampaign
      ? {
          id: "current",
          donorName: donorName.trim(),
          amount: amount || 0,
          campaignName: selectedCampaign.title,
          paymentMethod:
            donationType === "regular" ? "정기 후원" : "일시 후원",
          timeAgo: "NOW",
          photoUrl: capturedPhotoUrl ?? undefined,
          isNew: true,
        }
      : null;

  const entries = data?.content ?? [];
  const visibleEntries =
    pageNum === 1 && userEntry
      ? [userEntry, ...entries].slice(0, WALL_PAGE_SIZE)
      : entries;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  const handleKeyPress = (key: string) => {
    if (key === "\n") {
      setKeyboardOpen(false);
      return;
    }
    setSearch((value) => appendKeyboardInput(value, key));
  };

  const handleGoHome = () => {
    finishDonationFlow(navigate, resetSession);
  };

  const themeVars = {
    backgroundColor: theme.background,
    ["--wall-primary" as string]: theme.primary,
    ["--wall-on-primary" as string]: theme.text.onPrimary,
    ["--wall-text-primary" as string]: theme.text.primary,
    ["--wall-text-secondary" as string]: theme.text.secondary,
    ["--wall-card-bg" as string]: theme.card.background,
    ["--wall-photo-bg" as string]: theme.background,
    ["--wall-soft-bg" as string]: `color-mix(in srgb, ${theme.secondary} 22%, ${theme.card.background})`,
    ["--wall-soft-border" as string]: `color-mix(in srgb, ${theme.secondary} 50%, ${theme.card.background})`,
    ["--wall-accent-border" as string]: `color-mix(in srgb, ${theme.primary} 55%, ${theme.card.background})`,
  };

  return (
    <PageBody className="wall-page" scroll={false} style={themeVars}>
      <button
        type="button"
        className="wall-page__home-btn"
        onClick={handleGoHome}
        style={{
          backgroundColor: theme.primary,
          borderColor: theme.primary,
          color: theme.text.onPrimary,
        }}
      >
        홈으로
      </button>

      <main className="wall-page__main">
        <header className="wall-page__header">
          <h1
            className="wall-page__title"
            style={{ color: theme.primary }}
          >
            기억되는 나눔
          </h1>
          <p
            className="wall-page__subtitle"
            style={{ color: theme.text.secondary }}
          >
            후원자님들의 따뜻한 마음에 감사드립니다.
          </p>
        </header>

        <div
          className={`wall-page__search-card${keyboardOpen ? " wall-page__search-card--active" : ""}`}
          ref={searchRef}
          style={{ backgroundColor: theme.card.background }}
        >
          <span
            className="wall-page__search-label"
            style={{ color: theme.text.secondary }}
          >
            이름 검색
          </span>
          <div className="wall-page__search-row">
            <input
              className="wall-page__search"
              type="text"
              placeholder="이름으로 검색해보세요"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => setKeyboardOpen(true)}
              onClick={() => setKeyboardOpen(true)}
              style={{ color: theme.text.primary }}
            />
            {search.length > 0 && (
              <button
                type="button"
                className="wall-page__search-clear"
                onClick={(event) => {
                  event.stopPropagation();
                  setSearch("");
                }}
                aria-label="검색어 지우기"
                style={{ color: theme.text.secondary }}
              >
                지우기
              </button>
            )}
            <Search
              className="wall-page__search-icon"
              size={44}
              strokeWidth={2.5}
              style={{ color: theme.primary }}
            />
          </div>
        </div>

        <section className="wall-page__grid-panel" aria-label="기부자의 벽">
          {isLoading && (
            <p
              className="wall-page__status"
              style={{ color: theme.text.secondary }}
            >
              불러오는 중...
            </p>
          )}
          {isError && (
            <p className="wall-page__status wall-page__status--error">
              기부 내역을 불러오지 못했습니다
            </p>
          )}
          {!isLoading && !isError && visibleEntries.length === 0 && (
            <p
              className="wall-page__status"
              style={{ color: theme.text.secondary }}
            >
              표시할 기부 내역이 없습니다
            </p>
          )}
          {!isLoading && !isError && visibleEntries.length > 0 && (
            <div className="wall-page__grid">
              {visibleEntries.map((entry) => (
                <WallGiverCard
                  key={entry.id}
                  donorName={entry.donorName}
                  amount={entry.amount}
                  campaignName={entry.campaignName}
                  campaignImageUrl={
                    entry.id === "current"
                      ? selectedCampaign?.imageUrl ?? defaultDonationImage
                      : defaultDonationImage
                  }
                  donationType={donationTypeLabel(entry, donationType)}
                  photoUrl={entry.photoUrl}
                  timeAgo={entry.timeAgo}
                  isNew={entry.isNew}
                />
              ))}
            </div>
          )}
        </section>

        <div className="wall-page__pager" aria-label="기부자 목록 페이지">
          <button
            type="button"
            className="wall-page__pager-btn wall-page__pager-btn--prev"
            onClick={() => setPageNum((page) => Math.max(1, page - 1))}
            disabled={pageNum <= 1}
            aria-label="이전 페이지"
            style={{
              borderColor: theme.primary,
              backgroundColor: theme.primary,
              color: theme.text.onPrimary,
            }}
          >
            <span className="wall-page__pager-icon" aria-hidden>
              ‹
            </span>
          </button>
          <span
            className="wall-page__pager-text"
            style={{ color: theme.text.secondary }}
          >
            {pageNum}/{totalPages}
          </span>
          <button
            type="button"
            className="wall-page__pager-btn wall-page__pager-btn--next"
            onClick={() => setPageNum((page) => Math.min(totalPages, page + 1))}
            disabled={pageNum >= totalPages}
            aria-label="다음 페이지"
            style={{
              borderColor: theme.primary,
              backgroundColor: theme.primary,
              color: theme.text.onPrimary,
            }}
          >
            <span className="wall-page__pager-icon" aria-hidden>
              ›
            </span>
          </button>
        </div>
      </main>

      {keyboardOpen && (
        <div className="wall-page__keyboard" ref={keyboardRef}>
          <VirtualKeyboard
            onKeyPress={handleKeyPress}
            onBackspace={() => setSearch((value) => removeLastHangul(value))}
            onSpace={() => setSearch((value) => `${value} `)}
          />
        </div>
      )}
    </PageBody>
  );
}

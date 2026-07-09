import { useInfiniteQuery } from "@tanstack/react-query";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchWallEntriesPage, type WallEntry } from "../api/wall";
import { AppFooter } from "../components/AppFooter";
import { AppHeader } from "../components/AppHeader";
import { IconSearch } from "../components/Icon";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { WallGiverCard } from "../components/WallGiverCard";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { getKioskBridge } from "../utils/kioskBridge";
import { useTheme } from "../theme/ThemeContext";
import { defaultDonationImage } from "../utils/defaultDonationImage";
import { appendKeyboardInput, removeLastHangul } from "../utils/hangulInput";
import "./WallPage.css";

const WALL_PAGE_SIZE = 9;
const SCROLL_LOAD_THRESHOLD = 240;

export function WallPage() {
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const deferredSearch = useDeferredValue(search.trim());
  const searchRef = useRef<HTMLDivElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const gridPanelRef = useRef<HTMLElement>(null);

  const {
    donorName,
    amount,
    donationType,
    selectedCampaign,
    capturedPhotoUrl,
    submittedRecordId,
  } = useDonationStore();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "wallEntries",
      { pageSize: WALL_PAGE_SIZE, targetType: "CAMPAIGN", donatorName: deferredSearch },
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchWallEntriesPage({
        pageNum: pageParam,
        pageSize: WALL_PAGE_SIZE,
        targetType: "CAMPAIGN",
        donatorName: deferredSearch,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.pageNum + 1,
  });

  // Reaching the wall (donation complete): play the video on the kiosk's Monitor 2.
  useEffect(() => {
    getKioskBridge()?.showVideo();
  }, []);

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
          targetType: "CAMPAIGN",
          paymentMethod:
            donationType === "regular" ? "정기 후원" : "일시 후원",
          donatedAt: new Date().toISOString(),
          timeAgo: "NOW",
          photoUrl: capturedPhotoUrl ?? undefined,
          isNew: true,
        }
      : null;

  const entries = useMemo(
    () => data?.pages.flatMap((page) => page.content) ?? [],
    [data],
  );

  const visibleEntries = useMemo(() => {
    if (!userEntry) return entries;
    const withoutDuplicate = entries.filter((entry) => entry.id !== "current");
    return [userEntry, ...withoutDuplicate];
  }, [entries, userEntry]);

  const handleGridScroll = useCallback(() => {
    const panel = gridPanelRef.current;
    if (!panel || !hasNextPage || isFetchingNextPage) return;
    const distanceFromEnd =
      panel.scrollHeight - panel.scrollTop - panel.clientHeight;
    if (distanceFromEnd < SCROLL_LOAD_THRESHOLD) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleKeyPress = (key: string) => {
    if (key === "\n") {
      setKeyboardOpen(false);
      return;
    }
    setSearch((value) => appendKeyboardInput(value, key));
  };

  const themeVars = {
    ["--wall-primary" as string]: theme.primary,
    ["--wall-on-primary" as string]: theme.text.onPrimary,
    ["--wall-text-primary" as string]: theme.text.primary,
    ["--wall-text-secondary" as string]: theme.text.secondary,
    ["--wall-card-bg" as string]: theme.card.background,
    ["--wall-soft-bg" as string]: `color-mix(in srgb, ${theme.secondary} 22%, ${theme.card.background})`,
    ["--wall-soft-border" as string]: `color-mix(in srgb, ${theme.secondary} 55%, ${theme.card.background})`,
    ["--wall-accent-border" as string]: `color-mix(in srgb, ${theme.primary} 65%, ${theme.card.background})`,
  };

  return (
    <PageBody className="wall-page" scroll={false} style={themeVars}>
      <AppHeader />

      <div className="wall-body">
        <h2 className="wall-title">함께해주셔서 감사합니다</h2>

        <div className="wall-search-area" ref={searchRef}>
          <div
            className={`wall-search${keyboardOpen ? " wall-search--on" : ""}`}
            style={keyboardOpen ? { borderColor: theme.primary } : undefined}
          >
            <input
              className="wall-search__input"
              type="text"
              placeholder="이름으로 검색해보세요!"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => setKeyboardOpen(true)}
              onClick={() => setKeyboardOpen(true)}
            />
            {search.length > 0 && (
              <button
                type="button"
                className="wall-search__clear"
                onClick={(event) => {
                  event.stopPropagation();
                  setSearch("");
                }}
                aria-label="검색어 지우기"
              >
                지우기
              </button>
            )}
            <IconSearch
              className="wall-search__icon"
              width={71}
              height={68}
              style={{ color: theme.primary }}
            />
          </div>

          {keyboardOpen && (
            <div className="wall-keyboard" ref={keyboardRef}>
              <VirtualKeyboard
                onKeyPress={handleKeyPress}
                onBackspace={() => setSearch((value) => removeLastHangul(value))}
                onSpace={() => setSearch((value) => `${value} `)}
              />
            </div>
          )}
        </div>

        <section
          ref={gridPanelRef}
          className="wall-grid-panel"
          aria-label="기부자의 벽"
          onScroll={handleGridScroll}
        >
          {isLoading && <p className="wall-status">불러오는 중...</p>}
          {isError && (
            <p className="wall-status wall-status--error">
              기부 내역을 불러오지 못했습니다
            </p>
          )}
          {!isLoading && !isError && visibleEntries.length === 0 && (
            <p className="wall-status">표시할 기부 내역이 없습니다</p>
          )}
          {!isLoading && !isError && visibleEntries.length > 0 && (
            <>
              <div className="wall-grid">
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
                    photoUrl={entry.photoUrl}
                    donatedAt={entry.donatedAt}
                    isNew={entry.isNew}
                  />
                ))}
              </div>
              {hasNextPage && (
                <button
                  type="button"
                  className="wall-load-more"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "불러오는 중..." : "더 보기"}
                </button>
              )}
            </>
          )}
        </section>
      </div>

      <AppFooter />
    </PageBody>
  );
}

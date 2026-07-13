import { useInfiniteQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { IconSearch } from "../components/Icon";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { fetchWallEntriesPage } from "../api/wall";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { appendKeyboardInput, removeLastHangul } from "../utils/hangulInput";
import heartDefault from "../assets/donated.png";
import "./SchoolWallPage.css";

type Filter = "name" | "school";

const WALL_PAGE_SIZE = 6;

/** "2026-05-22T…" → "2026.05.22" */
function formatDotDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}.${mm}.${dd}`;
}

/**
 * 학교 기부내역(기부한컷) 벽 (Figma 5659:96280 / 5659:96279).
 * 이름/학교로 검색해 합성 사진 그리드를 노출한다.
 * GET /api/donations/payment/history (targetType=SCHOOL) 연동.
 */
export function SchoolWallPage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const selectedCampaign = useDonationStore((s) => s.selectedCampaign);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());

  const handleKeyPress = (key: string) => {
    if (key === "\n") {
      setKeyboardOpen(false);
      return;
    }
    setQuery((prev) => appendKeyboardInput(prev, key));
  };

  // 필터 탭에 따라 기부자 이름 / 학교(대상) 이름 검색을 분기한다.
  const searchParams = useMemo(() => {
    if (!deferredQuery) return {};
    return filter === "school"
      ? { targetName: deferredQuery }
      : { donatorName: deferredQuery };
  }, [deferredQuery, filter]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "schoolWallEntries",
      { pageSize: WALL_PAGE_SIZE, targetType: "SCHOOL", ...searchParams },
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchWallEntriesPage({
        pageNum: pageParam,
        pageSize: WALL_PAGE_SIZE,
        targetType: "SCHOOL",
        ...searchParams,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.pageNum + 1,
  });

  const entries = useMemo(
    () => data?.pages.flatMap((page) => page.content) ?? [],
    [data],
  );

  // 상세 흐름을 거치지 않고 진입해도 벽은 볼 수 있어야 하므로 selectedCampaign 가드는 없음
  void selectedCampaign;

  return (
    <PageBody className="school-wall" scroll={false}>
      <AppHeader
        title="기부"
        backTo="/school-certificate"
        subtitle="함께해주셔서 감사합니다"
      />

      <div
        className="sw-body"
        style={{ ["--sw-accent" as string]: theme.primary }}
      >
        {/* 검색창 — Figma 5659:96026 초록 테두리 4.29px, radius 120.
            클릭 시 검색창 바로 아래에 본문 폭 가상 키보드 노출 */}
        <div className="sw-search-area">
          <div className="sw-search" style={{ borderColor: theme.primary }}>
            <input
              className="sw-search__input"
              value={query}
              inputMode="none"
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setKeyboardOpen(true)}
              onClick={() => setKeyboardOpen(true)}
              placeholder="검색으로 찾아보세요!"
            />
            <IconSearch
              className="sw-search__icon"
              width={80}
              height={77}
              style={{ color: theme.primary }}
            />
          </div>

          {keyboardOpen && (
            <>
              <button
                type="button"
                className="sw-kb-backdrop"
                aria-label="키보드 닫기"
                onClick={() => setKeyboardOpen(false)}
              />
              <div className="sw-keyboard">
                <VirtualKeyboard
                  onKeyPress={handleKeyPress}
                  onBackspace={() =>
                    setQuery((prev) => removeLastHangul(prev))
                  }
                  onSpace={() => setQuery((prev) => `${prev} `)}
                />
              </div>
            </>
          )}
        </div>

        {/* 필터 탭 — Figma 5659:96227/96229 이름으로/학교로 (선택 시 초록) */}
        <div className="sw-filters">
          <button
            type="button"
            className={`sw-filter${filter === "name" ? " is-on" : ""}`}
            style={filter === "name" ? { backgroundColor: theme.primary } : undefined}
            onClick={() => setFilter(filter === "name" ? null : "name")}
          >
            이름으로 찾기
          </button>
          <button
            type="button"
            className={`sw-filter${filter === "school" ? " is-on" : ""}`}
            style={filter === "school" ? { backgroundColor: theme.primary } : undefined}
            onClick={() => setFilter(filter === "school" ? null : "school")}
          >
            학교로 찾기
          </button>
        </div>

        {/* 기부한컷 그리드 */}
        {isLoading && <p className="sw-empty">불러오는 중...</p>}
        {isError && <p className="sw-empty">기부 내역을 불러오지 못했습니다</p>}
        {!isLoading && !isError && (
          <div className="sw-grid">
            {entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="sw-card"
                onClick={() => navigate("/school-certificate")}
              >
                <span
                  className={`sw-card__photo${entry.photoUrl?.trim() ? "" : " sw-card__photo--placeholder"}`}
                >
                  <img
                    className={`sw-card__img${entry.photoUrl?.trim() ? "" : " sw-card__img--placeholder"}`}
                    src={entry.photoUrl?.trim() || heartDefault}
                    alt=""
                    loading="lazy"
                  />
                  {/* 학교는 로고가 없어 하단 오버레이에 학교명을 로고 대신 표시.
                      증서/NGO 벽과 동일 패턴: 사진 있으면 어두운 배드롭, 없으면 텍스트만. */}
                  <span className="sw-card__overlay">
                    <span className="sw-card__grad">{entry.campaignName}</span>
                  </span>
                </span>
                <span className="sw-card__meta">
                  <span className="sw-card__line" aria-hidden />
                  <span className="sw-card__date">
                    {formatDotDate(entry.donatedAt)}
                  </span>
                  <span className="sw-card__name">{entry.donorName}</span>
                  <span className="sw-card__line" aria-hidden />
                </span>
              </button>
            ))}
            {entries.length === 0 && (
              <p className="sw-empty">검색 결과가 없습니다</p>
            )}
          </div>
        )}

        {hasNextPage && (
          <button
            type="button"
            className="sw-load-more"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "불러오는 중..." : "더 보기"}
          </button>
        )}
      </div>
    </PageBody>
  );
}

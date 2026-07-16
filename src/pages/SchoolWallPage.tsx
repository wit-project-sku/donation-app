import { useInfiniteQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { IconSearch } from "../components/Icon";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { fetchWallEntriesPage } from "../api/wall";
import { useDonationStore } from "../store/donationStore";
import { useSchoolLogoByName } from "../hooks/useSchoolLogo";
import { useTheme } from "../theme/ThemeContext";
import { appendKeyboardInput, removeLastHangul } from "../utils/hangulInput";
import schoolEmblem from "../assets/school-emblem.png";
import "./SchoolWallPage.css";

type Filter = "name" | "school";

/** Figma 5827:170314 — 한 화면 5열 × 4행 = 20개, 그 다음은 "더 보기"로 이어 받는다. */
const WALL_COLS = 5;
const WALL_ROWS = 4;
const WALL_PAGE_SIZE = WALL_COLS * WALL_ROWS;

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
  // 기부내역 응답에 로고가 없어 학교명으로 찾는다 (useSchoolLogo 주석 참고).
  const logoByName = useSchoolLogoByName();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());

  // 졸업연도 셀렉트 — Figma 5827:170297. 기부내역 API 에 연도 필터가 없어
  // 불러온 항목의 기부일(donatedAt) 연도로 화면에서 거른다.
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: current - 1980 + 1 }, (_, i) => current - i);
  }, []);
  const [selectedYear, setSelectedYear] = useState<number>(
    () => new Date().getFullYear(),
  );
  const [yearOpen, setYearOpen] = useState(false);

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

  const entries = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.content) ?? [];
    // 연도 필터 — 서버 파라미터가 없어 불러온 범위 안에서만 거른다.
    return all.filter((entry) => {
      const year = new Date(entry.donatedAt).getFullYear();
      return Number.isNaN(year) ? true : year === selectedYear;
    });
  }, [data, selectedYear]);

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
        {/* 필터 탭 — Figma 5659:87298/87305 (검색 줄 위) */}
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

        {/* 졸업연도 셀렉트 + 검색창 — Figma 5827:170297 / 5535:19877 (한 줄) */}
        <div className="sw-search-area">
          <div className="sw-search-row">
            <button
              type="button"
              className="sw-year"
              onClick={() => setYearOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={yearOpen}
            >
              <span className="sw-year__value">{selectedYear}</span>
              <span
                className="sw-year__arrow"
                style={{ color: theme.primary }}
                aria-hidden
              >
                ▼
              </span>
            </button>

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
          </div>

          {yearOpen && (
            <ul className="sw-year-options" role="listbox">
              {years.map((year) => (
                <li key={year} role="option" aria-selected={year === selectedYear}>
                  <button
                    type="button"
                    className={`sw-year-option${year === selectedYear ? " is-selected" : ""}`}
                    style={year === selectedYear ? { color: theme.primary } : undefined}
                    onClick={() => {
                      setSelectedYear(year);
                      setYearOpen(false);
                    }}
                  >
                    {year}
                  </button>
                </li>
              ))}
            </ul>
          )}

        </div>

        {/* 기부한컷 그리드 */}
        {isLoading && <p className="sw-empty">불러오는 중...</p>}
        {isError && <p className="sw-empty">기부 내역을 불러오지 못했습니다</p>}
        {!isLoading && !isError && (
          <div className="sw-grid">
            {/* 카드 탭 → 기부한컷 크게 보기 (선택 항목을 라우터 state 로 전달) */}
            {entries.map((entry) => {
              // 못 찾은 학교는 기본 엠블럼 — 벽 상세·증서와 같은 폴백 규칙.
              const schoolLogo = logoByName(entry.campaignName);
              return (
              <button
                key={entry.id}
                type="button"
                className="sw-card"
                onClick={() =>
                  navigate("/school-wall-detail", { state: { entry } })
                }
              >
                {/* 사진 있음 → 사진으로 채움 / 없음 → 어두운 배경 + 학교 엠블럼 중앙
                    (증서 카드와 동일 규칙, 기본 이미지는 쓰지 않는다) */}
                <span
                  className={`sw-card__photo${entry.photoUrl?.trim() ? "" : " sw-card__photo--empty"}`}
                >
                  {entry.photoUrl?.trim() ? (
                    <img
                      className="sw-card__img"
                      src={entry.photoUrl}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <img
                      className="sw-card__emblem"
                      src={schoolLogo ?? schoolEmblem}
                      alt=""
                    />
                  )}
                  <span className="sw-card__overlay">
                    {/* 학교 로고 — 증서·벽 상세 오버레이와 같은 규칙(로고 없으면 생략) */}
                    {schoolLogo && (
                      <img
                        className="sw-card__badge"
                        src={schoolLogo}
                        alt=""
                        loading="lazy"
                      />
                    )}
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
              );
            })}
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

      {/* 검색 키보드 — 본문(.sw-body)이 스크롤되므로 바깥에 두고 페이지 기준으로
          좌측 세로중앙 네비(SideNav top 2010 + h205 ≈ 2215) 바로 아래에 고정한다. */}
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
              onBackspace={() => setQuery((prev) => removeLastHangul(prev))}
              onSpace={() => setQuery((prev) => `${prev} `)}
            />
          </div>
        </>
      )}
    </PageBody>
  );
}

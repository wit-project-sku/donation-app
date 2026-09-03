import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { useDonationStore } from "../store/donationStore";
import { fetchSchoolsPage, type SchoolDto } from "../api/schools";
import type { SchoolRegionCode, SchoolSort } from "../api/types";
import { buildSchoolCampaignFromDto } from "../data/schoolCampaign";
import { AppHeader } from "../components/AppHeader";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { appendKeyboardInput, removeLastHangul } from "../utils/hangulInput";
import "./SchoolSelectPage.css";

/** 교복 사주기 캠페인 강조색 (Figma 5659:87407 초록) */
const SCHOOL_ACCENT = "#08b741";

/** 학교 목록은 하루 1회만 갱신 (24시간 캐시 + 마운트 중 24시간마다 재요청). */
const SCHOOLS_REFETCH_MS = 24 * 60 * 60 * 1000;

/** Figma 5656:26078 검색 아이콘 — 강조색 마스크, stroke 9 */
function SchoolSearchIcon({ color }: { color: string }) {
  return (
    <svg
      className="school-page__search-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 77"
      fill="none"
      aria-hidden
    >
      <path
        d="M60.8219 58.9L75.5 72.5M70.7667 36.2333C70.7667 53.7592 55.9324 67.9667 37.6333 67.9667C19.3343 67.9667 4.5 53.7592 4.5 36.2333C4.5 18.7075 19.3343 4.5 37.6333 4.5C55.9324 4.5 70.7667 18.7075 70.7667 36.2333Z"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Figma 5656:54452 — 지역 필터 탭 (5열 × 2행) */
const REGIONS = [
  "서울",
  "경기도",
  "충청남도",
  "충청북도",
  "경상남도",
  "경상북도",
  "전라남도",
  "전라북도",
  "강원도",
  "제주",
] as const;

type RegionName = (typeof REGIONS)[number];

/** Figma 5658:54534 — 초성 필터 */
const CONSONANTS = [
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

const REGION_CODE_MAP: Record<RegionName, SchoolRegionCode> = {
  서울: "SEOUL",
  경기도: "GYEONGGI",
  충청남도: "CHUNGNAM",
  충청북도: "CHUNGBUK",
  경상남도: "GYEONGNAM",
  경상북도: "GYEONGBUK",
  전라남도: "JEONNAM",
  전라북도: "JEONBUK",
  강원도: "GANGWON",
  제주: "JEJU",
};

/** Figma 5659:86855~87026 — 7열 × 8행이 한 화면에 보이고, 넘치면 세로 스크롤 */
const GRID_COLS = 7;
const GRID_ROWS = 8;
const GRID_PAGE_SIZE = GRID_COLS * GRID_ROWS * 3;

/** 진입 시 기본 선택 지역 (Figma 5656:54454 서울 선택 상태) */
const DEFAULT_REGION: RegionName = "서울";

/** "○○고등학교" → "○○고" 로 축약 (칩 라벨) */
function toChipLabel(name: string): string {
  return name.replace(/등학교$/, "");
}

/** "서울" → "서울시", "경기도" → "경기도" (학교 수 문구용) */
function regionCountLabel(region: RegionName): string {
  return /도$|시$/.test(region) ? region : `${region}시`;
}

/**
 * 후배에게 교복 사주기 — 기부할 학교 선택 화면 (Figma 5659:87407).
 * 상단 크롬(AppHeader)은 공통 컴포넌트를 재사용하고, 본문(검색·지역 탭·초성·
 * 학교 수·지역 순위 토글·학교 칩 그리드)은 2160px 키오스크 좌표계에 Figma 값
 * 그대로 배치한다. 지역 탭은 항상 하나가 선택돼 있고(기본 서울), 학교는 칩
 * 그리드로만 보여준다 — "지역 순위" 를 켜면 같은 그리드를 지역 내 기부액순으로
 * 정렬한다.
 */
export function SchoolSelectPage() {
  const navigate = useAppNavigate();
  const setSelectedCampaign = useDonationStore(
    (state) => state.setSelectedCampaign,
  );
  const setDonationCategory = useDonationStore(
    (state) => state.setDonationCategory,
  );
  const [query, setQuery] = useState("");
  const [selectedRegion, setSelectedRegion] =
    useState<RegionName>(DEFAULT_REGION);
  // null = 초성 미선택(가나다순 전체). 초성 선택 시 해당 초성으로 필터.
  const [consonant, setConsonant] = useState<string | null>(null);
  // 그리드 정렬 토글 — false: 가나다순(NAME) / true: 지역 순위(DONATION_REGION).
  const [regionRank, setRegionRank] = useState(false);
  // 검색창 클릭 시 검색창 바로 아래에 가상 키보드 노출 (다른 입력 화면과 동일 컴포넌트)
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const handleKeyPress = (key: string) => {
    if (key === "\n") {
      setKeyboardOpen(false);
      return;
    }
    setQuery((prev) => appendKeyboardInput(prev, key));
  };

  const keyword = query.trim();
  // 검색어가 있으면 지역·초성 필터 없이 전체에서 이름으로 찾는다.
  const regionCode = keyword ? undefined : REGION_CODE_MAP[selectedRegion];
  const initial = keyword ? undefined : (consonant ?? undefined);
  const sort: SchoolSort = regionRank && !keyword ? "DONATION_REGION" : "NAME";

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "schools",
      {
        pageNum: 1,
        pageSize: GRID_PAGE_SIZE,
        regionCode: regionCode ?? null,
        keyword: keyword || null,
        initial: initial ?? null,
        sort,
        includeInactive: false,
      },
    ],
    queryFn: () =>
      fetchSchoolsPage({
        pageNum: 1,
        pageSize: GRID_PAGE_SIZE,
        region: regionCode,
        keyword: keyword || undefined,
        initial: initial || undefined,
        sort,
        includeInactive: false,
      }),
    staleTime: SCHOOLS_REFETCH_MS,
    refetchInterval: SCHOOLS_REFETCH_MS,
    refetchOnWindowFocus: false,
  });

  const schools = useMemo(() => data?.content ?? [], [data?.content]);
  const totalCount = data?.totalElements ?? schools.length;

  // 학교 선택 → 캠페인 설정 후 학교 상세로 이동.
  // 학교를 고른 시점에 흐름이 확정되므로 카테고리도 여기서 함께 세팅한다.
  const openSchool = (school: SchoolDto) => {
    setDonationCategory("school");
    setSelectedCampaign(buildSchoolCampaignFromDto(school));
    navigate("/school-detail");
  };

  const selectRegion = (name: RegionName) => {
    setSelectedRegion(name);
    setConsonant(null);
    setRegionRank(false);
  };

  return (
    <div className="school-page">
      <div className="school-page__header">
        {/* Figma 5656:26074 — 타이틀 "후배에게 교복 사주기" + ★부제, 초록 강조 */}
        <AppHeader
          title="후배에게 교복 사주기"
          subtitle="기부할 학교를 선택해주세요"
          accent={SCHOOL_ACCENT}
        />
      </div>

      {/* 검색창 — Figma 5656:26076 흰 배경, 강조색 5px 테두리, radius 120 */}
      <div className="school-page__search">
        <input
          className="school-page__search-input"
          value={query}
          inputMode="none"
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setKeyboardOpen(true)}
          onClick={() => setKeyboardOpen(true)}
          placeholder="학교를 검색해 찾아보세요"
        />
        <SchoolSearchIcon color={SCHOOL_ACCENT} />
      </div>

      {/* 검색 키보드 — 검색창 바로 아래 오버레이 (탭 아웃 시 닫힘) */}
      {keyboardOpen && (
        <>
          <button
            type="button"
            className="school-page__kb-backdrop"
            aria-label="키보드 닫기"
            onClick={() => setKeyboardOpen(false)}
          />
          <div className="school-page__keyboard">
            <VirtualKeyboard
              onKeyPress={handleKeyPress}
              onBackspace={() => setQuery((prev) => removeLastHangul(prev))}
              onSpace={() => setQuery((prev) => `${prev} `)}
            />
          </div>
        </>
      )}

      {/* 지역 필터 탭 — Figma 5656:54452 (5열 × 2행, 343×170) */}
      <div className="school-page__regions" role="tablist">
        {REGIONS.map((name) => {
          const isSelected = selectedRegion === name;
          return (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`school-region${isSelected ? " is-selected" : ""}`}
              onClick={() => selectRegion(name)}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* 초성 필터 — Figma 5658:54534 (ㄱ~ㅎ, 선택 시 강조색 밑줄) */}
      <div className="school-page__consonants">
        {CONSONANTS.map((char) => (
          <button
            key={char}
            type="button"
            className={`school-consonant${consonant === char ? " is-active" : ""}`}
            onClick={() =>
              setConsonant((prev) => (prev === char ? null : char))
            }
          >
            {char}
          </button>
        ))}
      </div>

      {/* 학교 수 — Figma 5776:25795 */}
      <p className="school-page__count">
        • {regionCountLabel(selectedRegion)} 참여 고등학교 수 : 총{" "}
        {totalCount.toLocaleString()}개교
      </p>

      {/* 지역 순위 토글 — Figma 5846:93667. 켜면 그리드를 지역 내 기부액순으로 정렬 */}
      <button
        type="button"
        className={`school-region-rank${regionRank ? " is-active" : ""}`}
        onClick={() => setRegionRank((prev) => !prev)}
        aria-pressed={regionRank}
      >
        지역 순위
      </button>

      {/* 학교 칩 그리드 — Figma 5659:86855 (7열, 250×120, 행간격 78, 초록 스크롤바) */}
      <div className="school-grid">
        {isLoading ? (
          <div className="school-grid__msg">불러오는 중...</div>
        ) : isError ? (
          <div className="school-grid__msg">학교 목록을 불러오지 못했습니다</div>
        ) : schools.length === 0 ? (
          <div className="school-grid__msg">검색 결과가 없습니다</div>
        ) : (
          schools.map((school) => (
            <button
              key={school.id}
              type="button"
              className="school-chip"
              onClick={() => openSchool(school)}
            >
              {toChipLabel(school.name)}
            </button>
          ))
        )}
      </div>

      {/* 하단 그라데이션 페이드 — Figma 5827:171240 (투명 → #c4c4c4) */}
      <div className="school-page__footer-fade" aria-hidden />
    </div>
  );
}

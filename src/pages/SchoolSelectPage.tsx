import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { useTheme } from "../theme/ThemeContext";
import { useDonationStore } from "../store/donationStore";
import {
  fetchSchoolsPage,
  type SchoolDto,
} from "../api/schools";
import type { SchoolRegionCode } from "../api/types";
import { buildSchoolCampaignFromDto } from "../data/schoolCampaign";
import { AppHeader } from "../components/AppHeader";
import { PartnerBar } from "../components/PartnerBar";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { appendKeyboardInput, removeLastHangul } from "../utils/hangulInput";
import { formatCurrency } from "../utils/format";
import "./SchoolSelectPage.css";

/** 랭킹은 하루 1회만 갱신 (24시간 캐시 + 마운트 중 24시간마다 재요청). */
const RANKING_REFETCH_MS = 24 * 60 * 60 * 1000;

/** Figma 5659:87591 검색 아이콘 — 테마색(인사동 코랄 #FE6C50) 마스크, stroke 9 */
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

/** Figma 5659:87600 — 지역 필터 칩 (5열 × 2행) */
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
];

/** Figma 5659:87592 — 초성 필터 */
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

const REGION_CODE_MAP: Record<(typeof REGIONS)[number], SchoolRegionCode> = {
  서울: "SEOUL",
  "경기도": "GYEONGGI",
  "충청남도": "CHUNGNAM",
  "충청북도": "CHUNGBUK",
  "경상남도": "GYEONGNAM",
  "경상북도": "GYEONGBUK",
  "전라남도": "JEONNAM",
  "전라북도": "JEONBUK",
  강원도: "GANGWON",
  제주: "JEJU",
};

const TABLE_PAGE_SIZE = 10;
const GRID_COLS = 7;
const GRID_ROWS = 8;
const GRID_PAGE_SIZE = GRID_COLS * GRID_ROWS;

function toChipLabel(name: string): string {
  return name.replace(/등학교$/, "");
}

/** rank → 색상 그룹 클래스 (1위 코랄 / 2·3위 검정 / 4위 이하 회색) */
function rankTone(rank: number): string {
  if (rank === 1) return "is-rank1";
  if (rank <= 3) return "is-top3";
  return "is-rest";
}

/**
 * 기부할 학교 선택 화면 (Figma 5656:26114).
 * 홈에서 [학교] 카드를 누르면 진입한다. 상단 크롬(AppHeader)과 하단 파트너 바
 * (PartnerBar)는 공통 컴포넌트를 재사용하고, 본문(검색·지역칩·초성·랭킹표)은
 * 2160px 키오스크 좌표계에 맞춰 Figma 값 그대로 배치한다.
 */
export function SchoolSelectPage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const setSelectedCampaign = useDonationStore(
    (state) => state.setSelectedCampaign,
  );
  const [query, setQuery] = useState("");
  // null → 전체 랭킹 표(Figma 5656:26114), 지역 선택 → 학교 칩 그리드(Figma 5659:87407)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  // null = 초성 미선택(진입 시 기부액순 랭킹). 초성 선택 시 가나다순(NAME) 정렬.
  const [consonant, setConsonant] = useState<string | null>(null);
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
  const initial = keyword ? undefined : (consonant ?? undefined);
  const regionCode = selectedRegion
    ? REGION_CODE_MAP[selectedRegion as keyof typeof REGION_CODE_MAP]
    : undefined;
  const pageSize = selectedRegion ? GRID_PAGE_SIZE : TABLE_PAGE_SIZE;
  // 진입/기본 = DONATION(기부액순 랭킹). 초성 선택 시 = NAME(가나다순).
  const sort: "DONATION" | "NAME" = consonant ? "NAME" : "DONATION";
  // 순위 변동 배지는 기부액순 랭킹(초성/검색 미적용)에서만 노출한다.
  const isRankingView = !selectedRegion && !consonant && !keyword;

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "schools",
      {
        pageNum: 1,
        pageSize,
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
        pageSize,
        region: regionCode,
        keyword: keyword || undefined,
        initial: initial || undefined,
        sort,
        includeInactive: false,
      }),
    staleTime: RANKING_REFETCH_MS,
    refetchInterval: RANKING_REFETCH_MS,
    refetchOnWindowFocus: false,
  });

  const schools = useMemo(() => data?.content ?? [], [data?.content]);

  const gridSchools = useMemo(
    () => schools.slice(0, GRID_PAGE_SIZE),
    [schools],
  );

  const tableSchools = useMemo(
    () => (selectedRegion ? [] : schools.slice(0, TABLE_PAGE_SIZE)),
    [selectedRegion, schools],
  );

  // 학교 선택 → 캠페인 설정 후 학교 상세로 이동
  const openSchool = (school: SchoolDto) => {
    setSelectedCampaign(buildSchoolCampaignFromDto(school));
    navigate("/school-detail");
  };

  return (
    <div className="school-page">
      <div className="school-page__header">
        {/* Figma: 헤더 타이틀 "교복주기" + ★부제 "기부할 학교를 선택해주세요" */}
        <AppHeader title="교복주기" subtitle="기부할 학교를 선택해주세요" />
      </div>

      {/* 검색창 — Figma 5659:87589 흰 배경, 코랄 4.29px 테두리, radius 120 */}
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
        <SchoolSearchIcon color={theme.primary} />
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

      {/* 지역 필터 칩 — Figma 5659:87600 (5열 × 2행) */}
      <div className="school-page__regions">
        {REGIONS.map((name) => {
          const isSelected = selectedRegion === name;
          // 미선택 상태에선 기본으로 '서울'을 강조(Figma 5656:26114 랭킹 뷰)
          const isDefault = selectedRegion === null && name === "서울";
          return (
            <button
              key={name}
              type="button"
              className={`school-region${isSelected ? " is-selected" : ""}${
                isDefault ? " is-active" : ""
              }`}
              onClick={() =>
                setSelectedRegion((prev) => (prev === name ? null : name))
              }
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* 초성 필터 — Figma 5659:87592. 지역 선택 시에만 노출(랭킹 뷰엔 없음). */}
      {selectedRegion && (
        <div className="school-page__consonants">
          {CONSONANTS.map((char) => (
            <button
              key={char}
              type="button"
              className={`school-consonant${consonant === char ? " is-active" : ""}`}
              onClick={() => setConsonant((prev) => (prev === char ? null : char))}
            >
              {char}
            </button>
          ))}
        </div>
      )}

      {selectedRegion ? (
        /* 지역 선택 상태 — 학교 칩 그리드 (실제 결과만 표시, 빈 칸 없음) */
        <>
          {/* 학교 수 — Figma 5776:25795: "• 서울시 고등학교 수 : 총 N개교" */}
          <p className="school-page__count">
            • {selectedRegion}
            {/도$|시$/.test(selectedRegion) ? "" : "시"} 고등학교 수 : 총{" "}
            {(data?.totalElements ?? gridSchools.length).toLocaleString()}개교
          </p>
          <div className="school-grid">
          {isLoading ? (
            <div className="school-grid__msg">불러오는 중...</div>
          ) : isError ? (
            <div className="school-grid__msg">
              학교 목록을 불러오지 못했습니다
            </div>
          ) : gridSchools.length === 0 ? (
            <div className="school-grid__msg">검색 결과가 없습니다</div>
          ) : (
            gridSchools.map((school) => (
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
        </>
      ) : (
        <>
          {/* 전국 학교 수 — Figma: "• 전국고등학교 수 : 총 N개교" (지역 미선택) */}
          <p className="school-page__count school-page__count--all">
            • 전국고등학교 수 : 총{" "}
            {(data?.totalElements ?? schools.length).toLocaleString()}개교
          </p>

          {/* 랭킹 표 */}
          <div className="school-table">
            <div className="school-table__head">
              <span className="school-table__col school-table__col--rank">
                순위
              </span>
              <span className="school-table__col school-table__col--name">
                학교명
              </span>
              <span className="school-table__col school-table__col--amount">
                기부액
              </span>
              <span className="school-table__col school-table__col--part">
                참여자(명)
              </span>
              <span className="school-table__col school-table__col--benef">
                수혜자(명)
              </span>
            </div>

            {isLoading ? (
              <div
                className="school-table__row"
                style={{ justifyContent: "center", cursor: "default" }}
              >
                불러오는 중...
              </div>
            ) : isError ? (
              <div
                className="school-table__row"
                style={{ justifyContent: "center", cursor: "default" }}
              >
                학교 목록을 불러오지 못했습니다
              </div>
            ) : schools.length === 0 ? (
              <div
                className="school-table__row"
                style={{ justifyContent: "center", cursor: "default" }}
              >
                검색 결과가 없습니다
              </div>
            ) : (
              tableSchools.map((school, index) => {
                const rank = index + 1;
                const tone = rankTone(rank);
                // 순위 변동은 백엔드 rankChange (양수=상승 ▲ / 음수=하락 ▼), 랭킹 뷰에서만.
                const change = isRankingView ? school.rankChange ?? 0 : 0;

                return (
                  <button
                    key={school.id}
                    type="button"
                    className={`school-table__row ${tone}`}
                    onClick={() => openSchool(school)}
                  >
                    <span className="school-table__col school-table__col--rank">
                      <span className="school-table__rank-no">{rank}</span>
                      {change !== 0 && (
                        <span
                          key={`${school.id}-${change}`}
                          className={`school-table__change ${
                            change > 0 ? "is-up" : "is-down"
                          }`}
                        >
                          {change > 0 ? "▲" : "▼"}
                          {Math.abs(change)}
                        </span>
                      )}
                    </span>
                    <span className="school-table__col school-table__col--name">
                      {toChipLabel(school.name)}
                    </span>
                    <span className="school-table__col school-table__col--amount">
                      {formatCurrency(school.accumulatedAmount)}원
                    </span>
                    <span className="school-table__col school-table__col--part">
                      {school.participantCount ?? 0}
                    </span>
                    <span className="school-table__col school-table__col--benef">
                      {school.studentCount ?? 0}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* 기준일 — Figma 5776:25491 Noto Sans Medium 36 #999 */}
          <p className="school-page__asof">2026.07.07 22:00기준</p>
        </>
      )}

      {/* 하단 그라데이션 페이드 — Figma 5659:87586 (투명 → #c4c4c4) */}
      <div className="school-page__footer-fade" aria-hidden />

      {/* 파트너 바 — Figma 5659:87593 검정 h572 + 로고 */}
      <div className="school-page__footer">
        <PartnerBar />
      </div>
    </div>
  );
}

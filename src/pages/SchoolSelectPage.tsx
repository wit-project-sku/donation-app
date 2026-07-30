import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { useDonationStore } from "../store/donationStore";
import { fetchSchoolsPage, type SchoolDto } from "../api/schools";
import { buildSchoolCampaignFromDto } from "../data/schoolCampaign";
import { AppHeader } from "../components/AppHeader";
import { FooterBanner } from "../components/FooterBanner";
import { SchoolPromoCard } from "../components/SchoolPromoCard";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { appendKeyboardInput, removeLastHangul } from "../utils/hangulInput";
import "./SchoolSelectPage.css";

/** 교복 사주기 캠페인 강조색 (Figma 5951:75859 초록) */
const SCHOOL_ACCENT = "#08b741";

/** 학교 목록은 하루 1회만 갱신 (24시간 캐시). */
const SCHOOLS_REFETCH_MS = 24 * 60 * 60 * 1000;

/** 칩으로 노출할 학교 수 (2행 가로 스크롤). */
const CHIP_PAGE_SIZE = 60;

/** Figma 5951:75879 검색 아이콘 — 강조색 마스크, stroke 9 */
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

/** "○○고등학교" → "○○고" 로 축약 (칩 라벨) */
function toChipLabel(name: string): string {
  return name.replace(/등학교$/, "");
}

/**
 * 후배에게 교복 사주기 — 학교 선택 화면 (Figma 5951:75859).
 * 상단 크롬(AppHeader)·하단 배너(FooterBanner)는 공통 컴포넌트를 재사용하고,
 * 본문(검색·학교 칩 2행·안내 카드)은 2160px 키오스크 좌표계에 Figma 값 그대로
 * 배치한다. 지역/초성 탭·랭킹 표는 제거하고 검색으로 학교를 찾는다.
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

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "schools",
      { pageNum: 1, pageSize: CHIP_PAGE_SIZE, keyword: keyword || null, sort: "NAME" },
    ],
    queryFn: () =>
      fetchSchoolsPage({
        pageNum: 1,
        pageSize: CHIP_PAGE_SIZE,
        keyword: keyword || undefined,
        sort: "NAME",
        includeInactive: false,
      }),
    staleTime: SCHOOLS_REFETCH_MS,
    refetchInterval: SCHOOLS_REFETCH_MS,
    refetchOnWindowFocus: false,
  });

  const schools = useMemo(() => data?.content ?? [], [data?.content]);

  // 학교 선택 → 캠페인 설정 후 학교 상세로 이동.
  // 학교를 고른 시점에 흐름이 확정되므로 카테고리도 여기서 함께 세팅한다.
  const openSchool = (school: SchoolDto) => {
    setDonationCategory("school");
    setSelectedCampaign(buildSchoolCampaignFromDto(school));
    navigate("/school-detail");
  };

  return (
    <div className="school-page">
      <div className="school-page__header">
        {/* Figma 5951:75859 — 타이틀 "후배에게 교복 사주기" + ★부제, 초록 강조 */}
        <AppHeader
          title="후배에게 교복 사주기"
          subtitle="기부할 학교를 선택해주세요"
          accent={SCHOOL_ACCENT}
        />
      </div>

      {/* 검색창 — Figma 5951:75877 흰 배경, 강조색 테두리, radius 120 */}
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

      {/* 학교 칩 — Figma 5951:76053/76069 (2행 가로 스크롤, 250×120) */}
      <div className="school-chips">
        {isLoading ? (
          <div className="school-chips__msg">불러오는 중...</div>
        ) : isError ? (
          <div className="school-chips__msg">학교 목록을 불러오지 못했습니다</div>
        ) : schools.length === 0 ? (
          <div className="school-chips__msg">검색 결과가 없습니다</div>
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

      {/* 안내 카드 — Figma 5951:76052 (교복 나눔 과정 안내) */}
      <SchoolPromoCard />

      {/* 하단 그라데이션 페이드 — Figma 5659:87586 (투명 → #c4c4c4) */}
      <div className="school-page__footer-fade" aria-hidden />

      {/* 하단 파트너 배너 — Figma 5951:75880 (위트글로벌 + NGO 로고) */}
      <div className="school-page__footer">
        <FooterBanner />
      </div>
    </div>
  );
}

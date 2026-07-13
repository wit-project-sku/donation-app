import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { fetchCampaignsPage } from "../api/campaigns";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { IconSearch } from "../components/Icon";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { resolveOrganizer } from "../theme/organizers";
import type { Campaign } from "../types";
import "./CampaignsPage.css";

// 모든 캠페인을 한 번에 받아 가로 스크롤로 노출 (개수 제한 없음).
const CAMPAIGNS_PAGE_SIZE = 100;

export function CampaignsPage() {
  const navigate = useAppNavigate();
  const { setSelectedCampaign } = useDonationStore();
  const { theme, category } = useTheme();
  const [query, setQuery] = useState("");

  const isSchool = category === "school";

  // The hero and the white sheet share ONE scroll container. Scrolling moves both
  // at 1:1 (no resizing → no card jitter); the hero simply scrolls up and away
  // while the sheet (on top, rounded-overlap preserved) rises to fill the screen
  // — that upward reveal is the "grow".
  // Drag-vs-tap guard: on a touch kiosk a scroll-drag that starts on a card must
  // NOT open that card. Track pointer movement; if it moves past a threshold we
  // treat the gesture as a scroll and swallow the card click.
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    draggedRef.current = false;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const start = pointerStart.current;
    if (!start) return;
    if (
      Math.abs(e.clientX - start.x) > 12 ||
      Math.abs(e.clientY - start.y) > 12
    ) {
      draggedRef.current = true;
    }
  }, []);

  const {
    data: pageData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["campaigns", "grid"],
    queryFn: () =>
      fetchCampaignsPage({
        pageNum: 1,
        pageSize: CAMPAIGNS_PAGE_SIZE,
        type: "NGO",
        includeInactive: false,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const campaigns = useMemo(() => pageData?.content ?? [], [pageData?.content]);

  // 학교 플로우에서만 이름 검색(백엔드 카테고리 필드 부재 → 클라이언트 필터).
  // 개수 제한 없이 전체 노출 — 가로 스크롤로 스와이프.
  const visibleCampaigns = useMemo(() => {
    return isSchool && query.trim()
      ? campaigns.filter((c) =>
          c.title.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : campaigns;
  }, [campaigns, isSchool, query]);

  const heroCampaign = campaigns[0] ?? null;

  const handleOpen = useCallback(
    (campaign: Campaign) => {
      // Ignore clicks that were actually scroll-drags.
      if (draggedRef.current) return;
      setSelectedCampaign(campaign);
      navigate("/campaign");
    },
    [setSelectedCampaign, navigate],
  );

  if (isLoading) {
    return (
      <PageBody className="campaigns-page" scroll={false}>
        <AppHeader
          title={isSchool ? "학교" : "NGO"}
          subtitle={`기부할 ${isSchool ? "학교를" : "캠페인을"} 선택해주세요`}
        />
        <p className="campaigns-page__state">불러오는 중...</p>
      </PageBody>
    );
  }

  if (isError || campaigns.length === 0) {
    return (
      <PageBody className="campaigns-page" scroll={false}>
        <AppHeader
          title={isSchool ? "학교" : "NGO"}
          subtitle={`기부할 ${isSchool ? "학교를" : "캠페인을"} 선택해주세요`}
        />
        <p className="campaigns-page__state campaigns-page__state--error">
          캠페인을 불러오지 못했습니다
        </p>
      </PageBody>
    );
  }

  return (
    <PageBody className="campaigns-page" scroll={false}>
      {heroCampaign && (
        <div className="campaigns-hero">
          <img
            className="campaigns-hero__img"
            src={heroCampaign.imageUrl}
            alt=""
          />
          <div className="campaigns-hero__overlay" aria-hidden />
          <h2 className="campaigns-hero__headline">
            당신의 따뜻한 마음이
            <br />
            누군가의 희망이 됩니다
          </h2>
        </div>
      )}

      <div className="campaigns-header-overlay">
        <AppHeader
          title={isSchool ? "학교" : "NGO"}
          subtitle={`기부할 ${isSchool ? "학교를" : "캠페인을"} 선택해주세요`}
          light
        />
      </div>

      <div
        className="campaigns-body"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{ ["--cg-accent" as string]: theme.primary }}
      >
        {isSchool && (
          <div
            className="campaigns-search"
            style={query ? { borderColor: theme.primary } : undefined}
          >
            <input
              className="campaigns-search__input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="학교를 검색해 찾아보세요"
            />
            <IconSearch
              className="campaigns-search__icon"
              width={44}
              height={44}
              style={{ color: theme.primary }}
            />
          </div>
        )}

        {/* 안내문 — Figma 5535:18379 body 상단(히어로 바로 아래), 카드 위로 이동 */}
        <p className="campaigns-note">
          우리가 함께하지 않으면 아무것도 바뀌지 않습니다.
        </p>

        <div className="campaigns-grid" role="list">
          {visibleCampaigns.map((campaign) => {
            const organizer = resolveOrganizer(campaign, category);
            return (
              <button
                key={campaign.id}
                type="button"
                className="campaign-card"
                role="listitem"
                onClick={() => handleOpen(campaign)}
                aria-label={`${campaign.title} 캠페인 보기`}
              >
                <span className="campaign-card__visual">
                  <img
                    className="campaign-card__image"
                    src={campaign.imageUrl}
                    alt=""
                    decoding="async"
                  />
                  {/* 상단 어두운 바 — Figma image287: rgba(0,0,0,.5), h93, radius 45 45 0 0.
                      주최단체 로고 가독성 확보용. */}
                  <span className="campaign-card__orgbar" aria-hidden />
                  <img
                    className="campaign-card__logo"
                    src={organizer.logo}
                    alt={organizer.label}
                  />
                </span>
                {/* 캠페인명 — 카드 하단, 가운데. 제목이 길어 최대 10자만 노출(초과 시 …). */}
                <span className="campaign-card__title">
                  {campaign.title.length > 10
                    ? `${campaign.title.slice(0, 10)}…`
                    : campaign.title}
                </span>
              </button>
            );
          })}
          {visibleCampaigns.length === 0 && (
            <p className="campaigns-grid__empty">검색 결과가 없습니다</p>
          )}
        </div>
      </div>
    </PageBody>
  );
}

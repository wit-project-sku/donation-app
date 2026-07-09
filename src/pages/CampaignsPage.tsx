import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { fetchCampaignsPage } from "../api/campaigns";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { IconSearch } from "../components/Icon";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { resolveOrganizer } from "../theme/organizers";
import { PartnerBar } from "../components/PartnerBar";
import type { Campaign } from "../types";
import "./CampaignsPage.css";

const CAMPAIGNS_PAGE_SIZE = 20;

export function CampaignsPage() {
  const navigate = useAppNavigate();
  const { setSelectedCampaign } = useDonationStore();
  const { theme, category } = useTheme();
  const [query, setQuery] = useState("");

  const isSchool = category === "school";

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

  // 학교 플로우에서만 이름 검색(백엔드 카테고리 필드 부재 → 클라이언트 필터)
  // Figma: 3열 × 2행 = 최대 6개만 노출
  const visibleCampaigns = useMemo(() => {
    const base =
      isSchool && query.trim()
        ? campaigns.filter((c) =>
            c.title.toLowerCase().includes(query.trim().toLowerCase()),
          )
        : campaigns;
    return base.slice(0, 6);
  }, [campaigns, isSchool, query]);

  const heroCampaign = campaigns[0] ?? null;

  const handleOpen = useCallback(
    (campaign: Campaign) => {
      setSelectedCampaign(campaign);
      navigate("/campaign");
    },
    [setSelectedCampaign, navigate],
  );

  if (isLoading) {
    return (
      <PageBody className="campaigns-page" scroll={false}>
        <AppHeader title={isSchool ? "학교" : "NGO"} />
        <p className="campaigns-page__state">불러오는 중...</p>
      </PageBody>
    );
  }

  if (isError || campaigns.length === 0) {
    return (
      <PageBody className="campaigns-page" scroll={false}>
        <AppHeader title={isSchool ? "학교" : "NGO"} />
        <p className="campaigns-page__state campaigns-page__state--error">
          캠페인을 불러오지 못했습니다
        </p>
      </PageBody>
    );
  }

  return (
    <PageBody className="campaigns-page">
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
        <AppHeader title={isSchool ? "학교" : "NGO"} light />
      </div>

      <div className="campaigns-body">
        <p className="campaigns-body__label">
          기부할 {isSchool ? "학교를" : "캠페인을"} 선택해주세요
        </p>

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
                  <span className="campaign-card__scrim" aria-hidden />
                  <img
                    className="campaign-card__logo"
                    src={organizer.logo}
                    alt={organizer.label}
                  />
                  <span className="campaign-card__title">{campaign.title}</span>
                </span>
                <span className="campaign-card__action">기부하기</span>
              </button>
            );
          })}
          {visibleCampaigns.length === 0 && (
            <p className="campaigns-grid__empty">검색 결과가 없습니다</p>
          )}
        </div>

        <p className="campaigns-note">
          우리가 함께하지 않으면 아무것도 바뀌지 않습니다.
        </p>
      </div>

      <PartnerBar />
    </PageBody>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";
import { fetchCampaignsPage } from "../api/campaigns";
import { IconHeart } from "../components/Icon";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import type { Campaign } from "../types";
import { formatCampaignProgressAmounts } from "../utils/campaignProgress";
import "./CampaignsPage.css";

const CAMPAIGNS_CONFIG = {
  featuredCount: 4,
  pageSize: 4,
} as const;

export function CampaignsPage() {
  const navigate = useAppNavigate();
  const { setSelectedCampaign } = useDonationStore();
  const { theme } = useTheme();

  const { data: pageData, isLoading, isError } = useQuery({
    queryKey: ["campaigns", "featured"],
    queryFn: () =>
      fetchCampaignsPage({ pageNum: 1, pageSize: CAMPAIGNS_CONFIG.pageSize }),
    staleTime: 5 * 60 * 1000,
  });

  const campaigns = useMemo(() => pageData?.content ?? [], [pageData?.content]);

  const featuredCampaigns = useMemo(
    () => campaigns.slice(0, CAMPAIGNS_CONFIG.featuredCount),
    [campaigns],
  );

  const handleSelect = useCallback(
    (campaign: Campaign) => {
      setSelectedCampaign(campaign);
      navigate("/campaign");
    },
    [setSelectedCampaign, navigate],
  );

  if (isLoading) {
    return (
      <PageBody
        className="campaigns-page"
        scroll={false}
        style={{ backgroundColor: theme.background }}
      >
        <p className="campaigns-page__loading">불러오는 중...</p>
      </PageBody>
    );
  }

  if (isError || campaigns.length === 0) {
    return (
      <PageBody
        className="campaigns-page"
        scroll={false}
        style={{ backgroundColor: theme.background }}
      >
        <p
          className="campaigns-page__loading campaigns-page__loading--error"
          style={{ color: "#b42318" }}
        >
          캠페인을 불러오지 못했습니다
        </p>
      </PageBody>
    );
  }

  return (
    <PageBody
      className="campaigns-page"
      scroll={false}
      style={{ backgroundColor: theme.background }}
    >
      <div className="campaigns-page__header">
        <div className="campaigns-page__header-content">
          <h3
            className="campaigns-page__subtitle"
            style={{ color: theme.primary }}
          >
            이 마음을 전해볼까요?
          </h3>
          <p
            className="campaigns-page__header-desc"
            style={{ color: theme.text.secondary }}
          >
            기부금 전액이 현장 지원에 사용되며, 법정 기부금으로서 세액공제 혜택이 적용됩니다
          </p>
        </div>

        <button
          type="button"
          className="campaigns-page__wall-link"
          onClick={() => navigate("/wall")}
          style={{
            borderColor: theme.primary,
            backgroundColor: theme.primary,
            color: theme.text.onPrimary,
          }}
          aria-label="기부내역 보기"
        >
          <IconHeart size={42} aria-hidden />
          <span>기부내역 보기</span>
        </button>
      </div>

      <div className="campaigns-page__swiper-wrap">
        <Swiper
          modules={[EffectCards, Navigation]}
          effect="cards"
          speed={0}
          initialSlide={Math.min(1, Math.max(featuredCampaigns.length - 1, 0))}
          grabCursor
          cardsEffect={{
            slideShadows: true,
            rotate: true,
            perSlideRotate: 2,
            perSlideOffset: 8,
          }}
          navigation={{
            prevEl: ".campaigns-page__nav-btn--prev",
            nextEl: ".campaigns-page__nav-btn--next",
          }}
          className="campaigns-page__swiper"
        >
          {featuredCampaigns.map((campaign) => {
            const progress = formatCampaignProgressAmounts(campaign);

            return (
              <SwiperSlide
                key={campaign.id}
                className="campaigns-page__swiper-slide"
              >
                <button
                  type="button"
                  className="campaigns-page__main-card"
                  onClick={() => handleSelect(campaign)}
                  style={{
                    backgroundImage: `url(${campaign.imageUrl})`,
                    cursor: "pointer",
                  }}
                >
                  <div className="campaigns-page__card-bg-overlay" />

                  <div className="campaigns-page__card-content">
                    <div className="campaigns-page__title-line">
                      <h2
                        className="campaigns-page__card-title"
                        style={{ color: theme.primary }}
                      >
                        {campaign.title}
                      </h2>
                    </div>

                    <p
                      className="campaigns-page__card-desc"
                      style={{ color: "#FFFFFF" }}
                    >
                      {campaign.description}
                    </p>

                    <div className="campaigns-page__progress">
                      <div className="campaigns-page__progress-info">
                        <span className="campaigns-page__progress-amount">
                          {progress.label}
                        </span>
                        <span className="campaigns-page__progress-percent">
                          {progress.percent}%
                        </span>
                      </div>
                      <div
                        className="campaigns-page__progress-bar"
                        style={{
                          backgroundColor: theme.secondary + "40",
                        }}
                      >
                        <div
                          className="campaigns-page__progress-fill"
                          style={{
                            width: `${progress.percent}%`,
                            backgroundColor: theme.primary,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {featuredCampaigns.length > 1 && (
        <div className="campaigns-page__nav">
          <button
            type="button"
            className="campaigns-page__nav-btn campaigns-page__nav-btn--prev"
            aria-label="이전"
            style={{
              borderColor: theme.primary,
              backgroundColor: theme.primary,
              color: theme.text.onPrimary,
            }}
          >
            <span className="campaigns-page__nav-icon" aria-hidden>
              ‹
            </span>
          </button>
          <button
            type="button"
            className="campaigns-page__nav-btn campaigns-page__nav-btn--next"
            aria-label="다음"
            style={{
              borderColor: theme.primary,
              backgroundColor: theme.primary,
              color: theme.text.onPrimary,
            }}
          >
            <span className="campaigns-page__nav-icon" aria-hidden>
              ›
            </span>
          </button>
        </div>
      )}
    </PageBody>
  );
}

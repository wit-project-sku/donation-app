import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { fetchCampaignsPage } from "../api/campaigns";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import type { Campaign } from "../types";
import "./CampaignsPage.css";

const CAMPAIGNS_PAGE_SIZE = 20;

export function CampaignsPage() {
  const navigate = useAppNavigate();
  const { setSelectedCampaign } = useDonationStore();
  const { theme } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: pageData, isLoading, isError } = useQuery({
    queryKey: ["campaigns", "grid"],
    queryFn: () => fetchCampaignsPage({ pageNum: 1, pageSize: CAMPAIGNS_PAGE_SIZE }),
    staleTime: 5 * 60 * 1000,
  });

  const campaigns = useMemo(() => pageData?.content ?? [], [pageData?.content]);

  useEffect(() => {
    if (campaigns.length === 0) return;
    setSelectedId((current) => current ?? campaigns[0].id);
  }, [campaigns]);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedId) ?? null,
    [campaigns, selectedId],
  );

  const handleOpenCampaign = useCallback(
    (campaign: Campaign) => {
      setSelectedId(campaign.id);
      setSelectedCampaign(campaign);
      navigate("/campaign");
    },
    [setSelectedCampaign, navigate],
  );

  const handleStart = useCallback(() => {
    if (!selectedCampaign) return;
    setSelectedCampaign(selectedCampaign);
    navigate("/campaign");
  }, [selectedCampaign, setSelectedCampaign, navigate]);

  if (isLoading) {
    return (
      <PageBody className="campaigns-page" scroll={false}>
        <p className="campaigns-page__loading">불러오는 중...</p>
      </PageBody>
    );
  }

  if (isError || campaigns.length === 0) {
    return (
      <PageBody className="campaigns-page" scroll={false}>
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
    <PageBody className="campaigns-page" scroll={false}>
      <header className="campaigns-page__header">
        <p className="campaigns-page__header-desc">
          기부금 전액이 현장 지원에 사용되며, 법정 기부금으로서 세액공제 혜택이 적용됩니다
        </p>
        <h1 className="campaigns-page__title">이 마음을 전해볼까요?</h1>
      </header>

      <div className="campaigns-page__scroll">
        <div className="campaigns-page__grid" role="list">
          {campaigns.map((campaign) => (
            <button
              key={campaign.id}
              type="button"
              className="campaigns-page__card"
              role="listitem"
              onClick={() => handleOpenCampaign(campaign)}
              aria-label={`${campaign.title} 캠페인 보기`}
            >
              <span className="campaigns-page__card-visual">
                <img
                  className="campaigns-page__card-image"
                  src={campaign.imageUrl}
                  alt=""
                  decoding="async"
                />
                <span className="campaigns-page__card-overlay" aria-hidden />
                <span className="campaigns-page__card-title">{campaign.title}</span>
              </span>
              <span className="campaigns-page__card-action">기부하기</span>
            </button>
          ))}
        </div>
      </div>

      <div className="campaigns-page__cta-fade" aria-hidden />
      <div className="campaigns-page__cta-wrap">
        <button
          type="button"
          className="campaigns-page__cta"
          onClick={handleStart}
          disabled={!selectedCampaign}
          style={{ backgroundColor: theme.primary }}
        >
          이 마음으로 시작하기
        </button>
      </div>
    </PageBody>
  );
}

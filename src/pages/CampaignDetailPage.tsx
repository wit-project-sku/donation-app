import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { PartnerBar } from "../components/PartnerBar";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { fetchCampaignById } from "../api/campaigns";
import { formatCampaignProgressAmounts } from "../utils/campaignProgress";
import { formatCurrency } from "../utils/format";
import "./CampaignDetailPage.css";

export function CampaignDetailPage() {
  const navigate = useAppNavigate();
  const { selectedCampaign } = useDonationStore();
  const { theme, category, organizer } = useTheme();

  const { data: fetchedCampaign } = useQuery({
    queryKey: ["campaign", selectedCampaign?.id],
    queryFn: () => fetchCampaignById(selectedCampaign!.id),
    enabled: !!selectedCampaign,
    staleTime: 5 * 60 * 1000,
  });

  const campaign = fetchedCampaign ?? selectedCampaign;

  useEffect(() => {
    if (!selectedCampaign) navigate("/", { replace: true });
  }, [selectedCampaign, navigate]);

  const progress = useMemo(
    () =>
      campaign ? formatCampaignProgressAmounts(campaign) : null,
    [campaign],
  );

  if (!campaign || !progress) return null;

  const description =
    campaign.description?.trim() ||
    campaign.sections?.[0]?.desc?.trim();
  const programs = campaign.programs ?? [];
  // 마감일은 백엔드 미제공 → 데이터가 있을 때만 노출 (없으면 숨김)
  const deadline = (selectedCampaign as { deadline?: string }).deadline;

  return (
    <PageBody className="campaign-detail">
      <div className="cd-hero">
        <img
          className="cd-hero__img"
          src={campaign.imageUrl}
          alt=""
          decoding="async"
        />
        <div className="cd-hero__overlay" aria-hidden />

        <button
          type="button"
          className="cd-hero__cta"
          style={{ backgroundColor: theme.primary }}
          onClick={() => navigate("/amount")}
        >
          기부하기
        </button>
      </div>

      <div className="cd-header-overlay">
        <AppHeader title={category === "school" ? "학교" : "NGO"} light />
      </div>

      <div className="cd-body">
        <div className="cd-titlebar">
          <h2 className="cd-title">{campaign.title}</h2>
          {deadline && (
            <span className="cd-deadline" style={{ color: theme.primary }}>
              {deadline}
            </span>
          )}
        </div>

        {programs.length > 0 && (
          <div className="cd-programs">
            {programs.slice(0, 3).map((program, index) => (
              <div
                className="cd-prog"
                key={`${program.title}-${index}`}
                style={{ borderColor: theme.primary }}
              >
                <span
                  className="cd-prog__num"
                  style={{ backgroundColor: theme.primary }}
                >
                  {index + 1}
                </span>
                <span className="cd-prog__label" style={{ color: theme.primary }}>
                  {program.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {description && <p className="cd-desc">{description}</p>}

        <p className="cd-partner-line">
          <span>이 캠페인은</span>
          <img
            className="cd-partner-line__logo"
            src={organizer.logo}
            alt={organizer.label}
          />
          <span>와 함께합니다.</span>
        </p>

        <div className="cd-funding">
          <p className="cd-funding__label" style={{ color: theme.primary }}>
            모금 현황
          </p>
          <div className="cd-funding__bar">
            <div
              className="cd-funding__fill"
              style={{
                width: `${progress.percent}%`,
                backgroundColor: theme.primary,
              }}
            />
          </div>
          <p className="cd-funding__amount" style={{ color: theme.primary }}>
            {formatCurrency(progress.accumulated)} /{" "}
            {formatCurrency(progress.target)}원
          </p>
        </div>
      </div>

      <PartnerBar />
    </PageBody>
  );
}

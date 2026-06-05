import { useEffect } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { IconBack } from "../components/Icon";
import { formatCampaignProgressAmounts } from "../utils/campaignProgress";
import "./CampaignDetailPage.css";

export function CampaignDetailPage() {
  const navigate = useAppNavigate();
  const { selectedCampaign } = useDonationStore();
  const { theme } = useTheme();

  useEffect(() => {
    if (!selectedCampaign) navigate("/", { replace: true });
  }, [selectedCampaign, navigate]);

  if (!selectedCampaign) return null;

  const description = selectedCampaign.description?.trim();
  const progress = formatCampaignProgressAmounts(selectedCampaign);

  return (
    <PageBody
      className="campaign-detail"
      scroll={false}
      style={{ backgroundColor: theme.background }}
    >
      {/* Back Button - Top Left */}
      <button
        type="button"
        className="campaign-detail__back-btn-icon"
        onClick={() => navigate("/")}
        aria-label="캠페인 선택으로 돌아가기"
        style={{
          borderColor: theme.primary,
          backgroundColor: theme.primary,
          color: theme.text.onPrimary,
        }}
      >
        <IconBack size={72} strokeWidth={2.5} />
      </button>

      <main className="campaign-detail__main">
        {/* Hero Section */}
        <section className="campaign-detail__hero">
          <img
            className="campaign-detail__hero-img"
            src={selectedCampaign.imageUrl}
            alt={selectedCampaign.title}
            decoding="async"
          />
        </section>

        {/* Content Section */}
        <section
          className="campaign-detail__content"
          style={{ backgroundColor: theme.background }}
        >
          {/* All Content - Left Column */}
          <div className="campaign-detail__info">
            {/* Campaign Title */}
            <h2
              className="campaign-detail__title"
              style={{ color: theme.primary }}
            >
              {selectedCampaign.title}
            </h2>

            {/* Description */}
            {description && (
              <p
                className="campaign-detail__description"
                style={{ color: theme.text.primary }}
              >
                {description}
              </p>
            )}


            <div className="campaign-detail__progress">
              <div className="campaign-detail__progress-header">
                <span
                  className="campaign-detail__progress-amount"
                  style={{ color: theme.primary }}
                >
                  {progress.label}
                </span>
                <span
                  className="campaign-detail__progress-percent"
                  style={{ color: theme.primary }}
                >
                  {progress.percent}%
                </span>
              </div>
              <div
                className="campaign-detail__progress-bar"
                style={{
                  backgroundColor: theme.secondary + "40",
                }}
              >
                <div
                  className="campaign-detail__progress-fill"
                  style={{
                    width: `${progress.percent}%`,
                    backgroundColor: theme.primary,
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Donate Button - Bottom */}
      <button
        type="button"
        className="campaign-detail__donate-btn"
        onClick={() => navigate("/amount")}
        style={{
          backgroundColor: theme.primary,
          borderColor: theme.primary,
          color: theme.text.onPrimary,
        }}
      >
        기부하기
      </button>
    </PageBody>
  );
}

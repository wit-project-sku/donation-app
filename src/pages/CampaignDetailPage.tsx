import { useEffect, useMemo } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { formatCampaignProgressAmounts } from "../utils/campaignProgress";
import { formatCurrency } from "../utils/format";
import unicefLogo from "../assets/logo-unicef.png";
import "./CampaignDetailPage.css";

export function CampaignDetailPage() {
  const navigate = useAppNavigate();
  const { selectedCampaign } = useDonationStore();
  const { theme, category } = useTheme();

  useEffect(() => {
    if (!selectedCampaign) navigate("/", { replace: true });
  }, [selectedCampaign, navigate]);

  const progress = useMemo(
    () =>
      selectedCampaign ? formatCampaignProgressAmounts(selectedCampaign) : null,
    [selectedCampaign],
  );

  if (!selectedCampaign || !progress) return null;

  const description =
    selectedCampaign.description?.trim() ||
    selectedCampaign.sections?.[0]?.desc?.trim();
  const programs = selectedCampaign.programs ?? [];

  return (
    <PageBody className="campaign-detail">
      <div className="cd-hero">
        <img
          className="cd-hero__img"
          src={selectedCampaign.imageUrl}
          alt=""
          decoding="async"
        />
        <div className="cd-hero__overlay" aria-hidden />

        <div className="cd-progress">
          <img className="cd-progress__logo" src={unicefLogo} alt="" />
          <div className="cd-progress__bar">
            <div
              className="cd-progress__fill"
              style={{
                width: `${progress.percent}%`,
                backgroundColor: theme.primary,
              }}
            />
          </div>
          <p className="cd-progress__amount" style={{ color: theme.primary }}>
            누적 기부금액 : {formatCurrency(progress.accumulated)}원
          </p>
        </div>
      </div>

      <div className="cd-header-overlay">
        <AppHeader title={category === "school" ? "학교" : "NGO"} light />
      </div>

      <div className="cd-body">
        <div className="cd-titlebar">
          <h2 className="cd-title">{selectedCampaign.title}</h2>
          {progress.target > 0 && (
            <span className="cd-deadline" style={{ color: theme.primary }}>
              목표 {formatCurrency(progress.target)}원
            </span>
          )}
        </div>

        {description && <p className="cd-desc">{description}</p>}

        {programs.length > 0 && (
          <div className="cd-programs">
            {programs.map((program, index) => (
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
                <span
                  className="cd-prog__label"
                  style={{ color: theme.primary }}
                >
                  {program.title}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="cd-cta-wrap">
          <button
            type="button"
            className="cd-cta"
            onClick={() => navigate("/amount")}
          >
            이 마음으로 시작하기
          </button>
        </div>
      </div>
    </PageBody>
  );
}

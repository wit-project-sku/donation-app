import { useEffect } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { formatCampaignProgressAmounts } from "../utils/campaignProgress";
import "./DonationProgressPage.css";

export function DonationProgressPage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const { selectedCampaign } = useDonationStore();

  useEffect(() => {
    if (!selectedCampaign) navigate("/", { replace: true });
  }, [selectedCampaign, navigate]);

  if (!selectedCampaign) return null;

  const progress = formatCampaignProgressAmounts(selectedCampaign);

  return (
    <PageBody
      className="donation-progress-page"
      scroll={false}
      style={{ backgroundColor: theme.background }}
    >
      <div className="donation-progress__header">
        <div className="donation-progress__goal">
          <span className="donation-progress__heart" style={{ color: theme.primary }}>
            ❤️
          </span>
          <h1
            className="donation-progress__title"
            style={{ color: theme.primary }}
          >
            목표 모금액: {progress.target.toLocaleString("ko-KR")}원
          </h1>
        </div>
        <p
          className="donation-progress__subtitle"
          style={{ color: theme.text.secondary }}
        >
          누적 모금액이 목표액에 도달할 때까지 함께 해주세요
        </p>
      </div>

      <div className="donation-progress__circle-container">
        <svg
          className="donation-progress__circle-svg"
          viewBox="0 0 200 200"
        >
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={theme.secondary}
            strokeWidth="8"
            opacity="0.3"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={theme.primary}
            strokeWidth="8"
            strokeDasharray={`${(Math.PI * 180 * progress.percent) / 100} ${
              Math.PI * 180
            }`}
            strokeLinecap="round"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "100px 100px",
            }}
          />
        </svg>

        <div className="donation-progress__center-content">
          <p
            className="donation-progress__count"
            style={{ color: theme.primary }}
          >
            {progress.percent}%
          </p>
          <p
            className="donation-progress__label"
            style={{ color: theme.text.primary }}
          >
            {progress.accumulated.toLocaleString("ko-KR")}원 모금
          </p>
        </div>
      </div>

      <button
        type="button"
        className="donation-progress__button"
        onClick={() => navigate("/")}
        style={{
          backgroundColor: theme.primary,
          borderColor: theme.primary,
          color: theme.text.onPrimary,
        }}
        aria-label="캠페인 선택 페이지로 이동"
      >
        내도움하기
      </button>
    </PageBody>
  );
}

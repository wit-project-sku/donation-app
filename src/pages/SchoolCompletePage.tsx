import { useEffect } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { IconHeart, IconCheck } from "../components/Icon";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { finishDonationFlow } from "../config/navigation";
import { formatCurrency } from "../utils/format";
import { getCampaignProgressPercent } from "../utils/campaignProgress";
import "./SchoolCompletePage.css";

/**
 * 학교 결제 완료 화면 (Figma 5591:41267).
 * 결제 성공 후 진입 — 결제 완료 안내 + 기부 금액 + 기부증서 발급 / 종료 선택.
 */
export function SchoolCompletePage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const { selectedCampaign, amount, resetSession } = useDonationStore();

  useEffect(() => {
    if (!selectedCampaign || amount <= 0) {
      navigate("/", { replace: true });
    }
  }, [selectedCampaign, amount, navigate]);

  if (!selectedCampaign || amount <= 0) return null;

  return (
    <PageBody className="school-complete" scroll={false}>
      <AppHeader
        title="기부"
        subtitle="당신의 마음이 필요한 곳에 전해집니다"
        showBack
        onBack={() => finishDonationFlow(navigate, resetSession)}
      />

      <div className="sc-body">
        {/* 학교 배지 */}
        <div className="sc-badge" style={{ backgroundColor: theme.primary }}>
          <IconHeart size={68} aria-hidden />
          <span className="sc-badge__name">{selectedCampaign.title}</span>
        </div>

        {/* 결제 완료 — Figma 5591:41654 초록 체크 원 */}
        <div className="sc-check" style={{ backgroundColor: theme.primary }}>
          <IconCheck size={150} strokeWidth={2.5} aria-hidden />
        </div>
        <p className="sc-title">결제 완료</p>
        <p className="sc-subtitle">당신의 마음이 필요한 곳에 전해집니다</p>

        {/* 기부 금액 — Figma 5591:41649 (1299×445, padding 40.56 / gap 20.28) */}
        <div className="sc-amount">
          <p className="sc-amount__label">기부 금액</p>
          <div className="sc-amount__gap" aria-hidden />
          <p className="sc-amount__value">{formatCurrency(amount)}원</p>
        </div>

        {/* 액션 — Figma 5591:41270/41271 */}
        <div className="sc-actions">
          <button
            type="button"
            className="sc-action sc-action--secondary"
            onClick={() => finishDonationFlow(navigate, resetSession)}
          >
            아니요. 괜찮아요.
          </button>
          <button
            type="button"
            className="sc-action sc-action--primary"
            style={{ backgroundColor: theme.primary }}
            onClick={() => navigate("/school-register")}
          >
            기부증서 발급
          </button>
        </div>

        {/* 캠페인 안내 + 모금 현황 */}
        <p className="sc-partner">이 캠페인은 채널A와 함께합니다.</p>

        <div className="sc-funding">
          <p className="sc-funding__label" style={{ color: theme.primary }}>
            모금 현황
          </p>
          <div className="sc-funding__bar">
            <div
              className="sc-funding__fill"
              style={{
                width: `${getCampaignProgressPercent(selectedCampaign.accumulatedAmount, selectedCampaign.targetAmount)}%`,
                backgroundColor: theme.primary,
              }}
            />
          </div>
          <p className="sc-funding__amount" style={{ color: theme.primary }}>
            {formatCurrency(selectedCampaign.accumulatedAmount)} /{" "}
            {formatCurrency(selectedCampaign.targetAmount)}원
          </p>
        </div>
      </div>

      <AppFooter />
    </PageBody>
  );
}

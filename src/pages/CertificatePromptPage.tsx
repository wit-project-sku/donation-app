import { useEffect } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { AppHeader } from "../components/AppHeader";
import { PartnerBar } from "../components/PartnerBar";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { finishDonationFlow } from "../config/navigation";
import { formatCampaignProgressAmounts } from "../utils/campaignProgress";
import { formatCurrency } from "../utils/format";
import "./CertificatePromptPage.css";

/**
 * 결제 완료 후 기부증서 발급 여부를 묻는 화면 (Figma 5558:18712).
 * "기부증서 발급" → 이름/전화 입력(/message), "아니요. 괜찮아요." → 세션 종료(홈).
 */
export function CertificatePromptPage() {
  const navigate = useAppNavigate();
  const { theme, organizer } = useTheme();
  const { selectedCampaign, amount, resetSession } = useDonationStore();

  useEffect(() => {
    if (!selectedCampaign || amount <= 0) {
      navigate("/amount", { replace: true });
    }
  }, [selectedCampaign, amount, navigate]);

  if (!selectedCampaign) return null;

  const progress = formatCampaignProgressAmounts(selectedCampaign);

  return (
    <PageBody className="cert-prompt">
      <AppHeader
        showBack
        subtitle="당신의 마음이 필요한 곳에 전해집니다"
        onBack={() => finishDonationFlow(navigate, resetSession)}
      />

      <div className="cert-prompt__body">
        <div
          className="cert-prompt__chip"
          style={{ backgroundColor: theme.primary }}
        >
          <img src="/icons/heart.png" alt="" className="cert-prompt__heart" />
          <span>{selectedCampaign.title}</span>
        </div>

        <div className="cert-prompt__complete">
          {/* 완료 체크 — 조직 테마색 원 + 흰 체크 */}
          <svg
            className="cert-prompt__check"
            viewBox="0 0 301 301"
            fill="none"
            aria-hidden
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="150.5" cy="150.5" r="150.5" fill={theme.primary} />
            <path
              d="M88 154L131 197L214 106"
              stroke="#ffffff"
              strokeWidth="24"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2 className="cert-prompt__complete-title">결제 완료</h2>
          <p className="cert-prompt__complete-desc">
            당신의 마음이 필요한 곳에 전해집니다
          </p>
          <div className="cert-prompt__amount-card">
            <p className="cert-prompt__amount-label">기부 금액</p>
            <div className="cert-prompt__amount-spacer" aria-hidden />
            <p className="cert-prompt__amount-value">
              {formatCurrency(amount)}원
            </p>
          </div>
        </div>

        <div className="cert-prompt__actions">
          <button
            type="button"
            className="cert-prompt__decline"
            onClick={() => finishDonationFlow(navigate, resetSession)}
          >
            아니요. 괜찮아요.
          </button>
          <button
            type="button"
            className="cert-prompt__issue"
            style={{ backgroundColor: theme.primary }}
            onClick={() => navigate("/message")}
          >
            기부증서 발급
          </button>
        </div>

        <p className="cert-prompt__partner">
          <span>이 캠페인은</span>
          <img
            src={organizer.logo}
            alt={organizer.label}
            className="cert-prompt__partner-logo"
          />
          <span>와 함께합니다.</span>
        </p>

        <div className="cert-prompt__funding">
          <p className="cert-prompt__funding-label" style={{ color: theme.primary }}>
            모금 현황
          </p>
          <div className="cert-prompt__funding-bar">
            <div
              className="cert-prompt__funding-fill"
              style={{
                width: `${progress.percent}%`,
                backgroundColor: theme.primary,
              }}
            />
          </div>
          <p
            className="cert-prompt__funding-amount"
            style={{ color: theme.primary }}
          >
            {formatCurrency(progress.accumulated)} /{" "}
            {formatCurrency(progress.target)}원
          </p>
        </div>
      </div>

      <PartnerBar />
    </PageBody>
  );
}

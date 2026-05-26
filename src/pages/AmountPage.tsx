import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CampaignSummary } from "../components/CampaignSummary";
import { PageBody } from "../components/layout/PageBody";
import { PageFooter } from "../components/layout/PageFooter";
import { useDonationStore } from "../store/donationStore";
import { IconReset } from "../components/Icon";
import "./AmountPage.css";

export function AmountPage() {
  const navigate = useNavigate();
  const {
    selectedCampaign,
    amount,
    lastAddedPreset,
    addAmount,
    resetAmount,
  } = useDonationStore();

  useEffect(() => {
    if (!selectedCampaign) navigate("/", { replace: true });
  }, [selectedCampaign, navigate]);

  if (!selectedCampaign) return null;

  const presets = selectedCampaign.amountOptions ?? [];
  const canDonate = amount > 0;
  const hasAmount = amount > 0;

  return (
    <PageBody className="amount-page" scroll={false}>
      <CampaignSummary campaign={selectedCampaign} />

      <div className="amount-page__display">
        <span className={`amount-page__num${hasAmount ? " amount-page__num--active" : ""}`}>
          {amount === 0 ? "0" : amount.toLocaleString("ko-KR")}
        </span>
        <span className={`amount-page__won${hasAmount ? " amount-page__won--active" : ""}`}>
          원
        </span>
      </div>

      {presets.length > 0 ? (
        <div className="amount-page__grid">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`amount-page__preset${lastAddedPreset === preset ? " amount-page__preset--active" : ""}`}
              onClick={() => addAmount(preset)}
            >
              +{preset.toLocaleString("ko-KR")}
            </button>
          ))}
          <button
            type="button"
            className="amount-page__preset amount-page__preset--reset"
            onClick={resetAmount}
            aria-label="초기화"
          >
            <IconReset size={54} aria-hidden />
          </button>
        </div>
      ) : (
        <p className="amount-page__empty">
          이 캠페인에 설정된 금액 옵션이 없습니다
        </p>
      )}

      <PageFooter onBack={() => navigate("/")}>
        <button
          type="button"
          className={`amount-page__donate-btn${canDonate ? " amount-page__donate-btn--active" : ""}`}
          disabled={!canDonate}
          onClick={() => navigate("/payment")}
        >
          기부하기
        </button>
      </PageFooter>
    </PageBody>
  );
}

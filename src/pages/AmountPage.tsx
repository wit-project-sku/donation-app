import { useCallback, useEffect, useMemo, useState } from "react";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { IconHeart } from "../components/Icon";
import { formatCampaignProgressAmounts } from "../utils/campaignProgress";
import { formatCurrency } from "../utils/format";
import unicefLogo from "../assets/logo-unicef.png";
import "./AmountPage.css";

export function AmountPage() {
  const navigate = useAppNavigate();
  const { selectedCampaign, setAmount } = useDonationStore();
  const { theme } = useTheme();

  const amountOptions = useMemo(
    () => selectedCampaign?.amountOptions ?? [],
    [selectedCampaign?.amountOptions],
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedCampaign) navigate("/campaign", { replace: true });
  }, [selectedCampaign, navigate]);

  const progress = useMemo(
    () =>
      selectedCampaign ? formatCampaignProgressAmounts(selectedCampaign) : null,
    [selectedCampaign],
  );

  const handleDonate = useCallback(() => {
    if (selectedIndex == null) return;
    const option = amountOptions[selectedIndex];
    if (!option || option.amount <= 0) return;
    setAmount(option.amount);
    navigate("/payment");
  }, [selectedIndex, amountOptions, setAmount, navigate]);

  if (!selectedCampaign || !progress) return null;

  const hasSelection = selectedIndex != null;

  return (
    <PageBody className="amount-page">
      <AppHeader />

      <div className="amount-page__body">
        <button
          type="button"
          className="amount-chip"
          onClick={() => navigate("/campaign")}
          style={{ backgroundColor: theme.primary }}
        >
          <IconHeart size={44} aria-hidden />
          <span>{selectedCampaign.title}</span>
        </button>

        <div className="amount-progress">
          <img className="amount-progress__logo" src={unicefLogo} alt="" />
          <div className="amount-progress__bar">
            <div
              className="amount-progress__fill"
              style={{
                width: `${progress.percent}%`,
                backgroundColor: theme.primary,
              }}
            />
          </div>
          <p className="amount-progress__label" style={{ color: theme.primary }}>
            누적 기부금액 : {formatCurrency(progress.accumulated)}원
          </p>
        </div>

        <p className="amount-page__label">기부금을 선택해 주세요</p>

        {amountOptions.length === 0 ? (
          <p className="amount-empty">선택 가능한 기부 금액이 없습니다.</p>
        ) : (
          <div className="amount-grid">
            {amountOptions.map((option, index) => {
              const active = selectedIndex === index;
              return (
                <button
                  key={`${option.amount}-${index}`}
                  type="button"
                  className={`amount-opt${active ? " amount-opt--active" : ""}`}
                  onClick={() => setSelectedIndex(index)}
                  aria-pressed={active}
                  style={
                    active
                      ? { borderColor: theme.primary, color: theme.primary }
                      : undefined
                  }
                >
                  +{formatCurrency(option.amount)}원
                </button>
              );
            })}
          </div>
        )}

        <p className="amount-note">
          기부금 전액이 현장 지원에 사용되며, 법정 기부금으로서 세액공제 혜택이
          적용됩니다
        </p>
        <p className="amount-partner">
          이 캠페인은
          <img src={unicefLogo} alt="unicef" className="amount-partner__logo" />
          와 함께합니다.
        </p>

        <button
          type="button"
          className="amount-cta"
          onClick={handleDonate}
          disabled={!hasSelection}
          style={hasSelection ? { backgroundColor: theme.primary } : undefined}
        >
          기부하기
        </button>
      </div>

      <AppFooter note />
    </PageBody>
  );
}

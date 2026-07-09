import { useCallback, useEffect, useMemo, useState } from "react";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { PartnerBar } from "../components/PartnerBar";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { formatCampaignProgressAmounts } from "../utils/campaignProgress";
import { formatCurrency } from "../utils/format";
import "./AmountPage.css";

export function AmountPage() {
  const navigate = useAppNavigate();
  const { selectedCampaign, setAmount } = useDonationStore();
  const { theme, organizer } = useTheme();

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
          <img src="/icons/heart.png" alt="" className="amount-chip__heart" />
          <span>{selectedCampaign.title}</span>
        </button>

        <p className="amount-page__label">기부금을 선택해 주세요</p>

        {amountOptions.length === 0 ? (
          <p className="amount-empty">선택 가능한 기부 금액이 없습니다.</p>
        ) : (
          <div className="amount-grid">
            {amountOptions.slice(0, 4).map((option, index) => {
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

        <button
          type="button"
          className="amount-cta"
          onClick={handleDonate}
          disabled={!hasSelection}
          style={hasSelection ? { backgroundColor: theme.primary } : undefined}
        >
          기부하기
        </button>

        <p className="amount-partner">
          <span>이 캠페인은</span>
          <img
            src={organizer.logo}
            alt={organizer.label}
            className="amount-partner__logo"
          />
          <span>와 함께합니다.</span>
        </p>

        <div className="amount-funding">
          <p className="amount-funding__label" style={{ color: theme.primary }}>
            모금 현황
          </p>
          <div className="amount-funding__bar">
            <div
              className="amount-funding__fill"
              style={{
                width: `${progress.percent}%`,
                backgroundColor: theme.primary,
              }}
            />
          </div>
          <p className="amount-funding__amount" style={{ color: theme.primary }}>
            {formatCurrency(progress.accumulated)} /{" "}
            {formatCurrency(progress.target)}원
          </p>
        </div>
      </div>

      <PartnerBar />
    </PageBody>
  );
}

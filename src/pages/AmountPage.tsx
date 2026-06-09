import { useCallback, useEffect, useMemo, useState } from "react";
import { PageBody } from "../components/layout/PageBody";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { IconHeart } from "../components/Icon";
import "./AmountPage.css";

function formatKrwAmount(amount: number): string {
  return amount.toLocaleString("ko-KR");
}

export function AmountPage() {
  const navigate = useAppNavigate();
  const { selectedCampaign, setAmount } = useDonationStore();
  const { theme } = useTheme();

  const amountOptions = useMemo(
    () => selectedCampaign?.amountOptions ?? [],
    [selectedCampaign?.amountOptions],
  );

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedCampaign) {
      navigate("/campaign", { replace: true });
    }
  }, [selectedCampaign, navigate]);

  const handleSelectAmount = useCallback((amount: number, index: number) => {
    setSelectedAmount(amount);
    setSelectedIndex(index);
  }, []);

  const handleDonate = useCallback(() => {
    if (!selectedAmount || selectedAmount <= 0) return;
    setAmount(selectedAmount);
    navigate("/payment");
  }, [selectedAmount, setAmount, navigate]);

  if (!selectedCampaign) return null;

  const hasSelection = selectedAmount != null && selectedAmount > 0;
  const selectedOption =
    selectedIndex != null ? amountOptions[selectedIndex] : null;

  return (
    <PageBody className="amount-page" scroll={false}>
      <main className="amount-page__main">
        <header className="amount-page__header">
          <button
            type="button"
            className="amount-page__campaign-badge"
            onClick={() => navigate("/campaign")}
            style={{ backgroundColor: theme.primary }}
          >
            <IconHeart className="amount-page__campaign-badge-icon" aria-hidden />
            <span>{selectedCampaign.title}</span>
          </button>

          <h1 className="amount-page__title">
            {hasSelection && selectedOption ? (
              <>
                <span className="amount-page__title-row">
                  <span className="amount-page__title-amount">
                    {formatKrwAmount(selectedAmount)}원
                  </span>
                  <span className="amount-page__title-particle">으로</span>
                </span>
                <span className="amount-page__title-row amount-page__title-row--suffix">
                  {selectedOption.label}
                </span>
              </>
            ) : (
              <>
                <span className="amount-page__title-row">기부하실 금액을</span>
                <span className="amount-page__title-row">선택해 주세요</span>
              </>
            )}
          </h1>
        </header>

        <section className="amount-page__options" aria-label="기부 금액 선택">
          {amountOptions.length === 0 ? (
            <p className="amount-page__empty">선택 가능한 기부 금액이 없습니다.</p>
          ) : (
            amountOptions.map((option, index) => {
              const isActive = selectedIndex === index;

              return (
                <button
                  key={`${option.amount}-${index}`}
                  type="button"
                  className={`amount-page__option${
                    isActive ? " amount-page__option--active" : ""
                  }`}
                  onClick={() => handleSelectAmount(option.amount, index)}
                  aria-pressed={isActive}
                >
                  <span className="amount-page__option-label">{option.label}</span>
                  <span className="amount-page__option-amount">
                    +{formatKrwAmount(option.amount)}원
                  </span>
                </button>
              );
            })
          )}
        </section>
      </main>

      <div className="amount-page__donate-wrap">
        <button
          type="button"
          className="amount-page__donate-btn"
          onClick={handleDonate}
          disabled={!hasSelection}
          style={
            hasSelection ? { backgroundColor: theme.primary } : undefined
          }
        >
          기부하기
        </button>
      </div>
    </PageBody>
  );
}

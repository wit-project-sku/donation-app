import { useCallback, useEffect, useMemo, useState } from "react";
import { PageBody } from "../components/layout/PageBody";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { IconBack } from "../components/Icon";
import "./AmountPage.css";

const FALLBACK_AMOUNTS = [10000, 30000, 50000, 100000] as const;

/** Neutral border for unselected controls (not location primary) */
const DEFAULT_BORDER = "#D0D0D0";

function getDefaultAmount(options: number[]): number | null {
  if (options.length === 0) return null;
  return options[Math.floor((options.length - 1) / 2)];
}

function formatKrwAmount(amount: number): string {
  return amount.toLocaleString("ko-KR");
}

/** Compact label for preset buttons, e.g. 30000 → "3만원" */
function formatAmountLabel(amount: number): string {
  if (amount >= 10000 && amount % 10000 === 0) {
    return `${amount / 10000}만원`;
  }
  return `₩${formatKrwAmount(amount)}`;
}

export function AmountPage() {
  const navigate = useAppNavigate();
  const { selectedCampaign, setAmount } = useDonationStore();
  const { theme } = useTheme();

  const amountOptions = useMemo(() => {
    const options = selectedCampaign?.amountOptions ?? [];
    return options.length > 0 ? options : [...FALLBACK_AMOUNTS];
  }, [selectedCampaign?.amountOptions]);

  const defaultAmount = useMemo(
    () => getDefaultAmount(amountOptions),
    [amountOptions],
  );

  const [selectedAmount, setSelectedAmount] = useState<number | null>(defaultAmount);
  const [displayedAmount, setDisplayedAmount] = useState(defaultAmount ?? 0);

  useEffect(() => {
    if (!selectedCampaign) {
      navigate("/campaign", { replace: true });
    }
  }, [selectedCampaign, navigate]);

  useEffect(() => {
    setSelectedAmount(defaultAmount);
    setDisplayedAmount(defaultAmount ?? 0);
  }, [defaultAmount]);

  useEffect(() => {
    setDisplayedAmount(selectedAmount ?? 0);
  }, [selectedAmount]);

  const handleSelectAmount = useCallback((amount: number) => {
    setSelectedAmount(amount);
  }, []);

  const handleNext = useCallback(() => {
    if (!selectedAmount || selectedAmount <= 0) return;
    setAmount(selectedAmount);
    navigate("/payment");
  }, [selectedAmount, setAmount, navigate]);

  if (!selectedCampaign) return null;

  const hasSelection = selectedAmount != null && selectedAmount > 0;

  return (
    <PageBody
      className="amount-page"
      scroll={false}
      style={{ backgroundColor: theme.background }}
    >
      <button
        type="button"
        className="amount-page__back-btn"
        onClick={() => navigate("/campaign")}
        aria-label="캠페인으로 돌아가기"
        style={{
          borderColor: theme.primary,
          backgroundColor: theme.primary,
          color: theme.text.onPrimary,
        }}
      >
        <IconBack size={72} strokeWidth={2.5} />
      </button>

      <main className="amount-page__main">
        <header className="amount-page__header">
          <h1
            className="amount-page__title"
            style={{ color: theme.text.primary }}
          >
            얼마를 기부할까요?
          </h1>
        </header>

        <section
          className="amount-page__campaign-strip"
          style={{ backgroundColor: theme.card.background }}
        >
          <img
            className="amount-page__campaign-thumb"
            src={selectedCampaign.imageUrl}
            alt=""
            decoding="async"
          />
          <div className="amount-page__campaign-text">
            <p
              className="amount-page__campaign-name"
              style={{ color: theme.text.primary }}
            >
              {selectedCampaign.title}
            </p>
            {selectedCampaign.description?.trim() && (
              <p
                className="amount-page__campaign-desc"
                style={{ color: theme.text.secondary }}
              >
                {selectedCampaign.description}
              </p>
            )}
          </div>
        </section>

        <section
          className="amount-page__display"
          style={{
            borderColor: DEFAULT_BORDER,
            backgroundColor: theme.background,
          }}
        >
          <div className="amount-page__display-content">
            <p
              className="amount-page__display-label"
              style={{ color: theme.text.secondary }}
            >
              기부 금액
            </p>
            <div className="amount-page__display-amount">
              <span
                className="amount-page__amount-currency"
                style={{ color: theme.text.secondary }}
              >
                ₩
              </span>
              <span
                className="amount-page__amount-number"
                style={{ color: theme.primary }}
              >
                {formatKrwAmount(displayedAmount)}
              </span>
            </div>
          </div>
        </section>

        <section className="amount-page__grid" aria-label="기부 금액 선택">
          {amountOptions.map((amount) => {
            const isActive = selectedAmount === amount;
            return (
              <button
                key={amount}
                type="button"
                className={`amount-page__amount-btn ${
                  isActive ? "amount-page__amount-btn--active" : ""
                }`}
                onClick={() => handleSelectAmount(amount)}
                style={{
                  backgroundColor: theme.background,
                  borderColor: isActive ? theme.primary : DEFAULT_BORDER,
                  color: isActive ? theme.primary : theme.text.primary,
                }}
              >
                <span className="amount-page__amount-value">
                  {formatAmountLabel(amount)}
                </span>
              </button>
            );
          })}
        </section>
      </main>

      <button
        type="button"
        className="amount-page__next-btn"
        onClick={handleNext}
        disabled={!hasSelection}
        style={{
          backgroundColor: theme.primary,
          borderColor: theme.primary,
          color: theme.text.onPrimary,
        }}
      >
        다음
      </button>
    </PageBody>
  );
}

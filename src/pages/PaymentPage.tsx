import { useCallback, useEffect, useRef, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { ApiError } from "../api/client";
import {
  buildPaymentRequest,
  cancelPendingPayment,
  createMerchantUid,
  processPayment,
} from "../api/payments";
import { PaymentStatusOverlay } from "../components/PaymentStatusOverlay";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { IconHeart } from "../components/Icon";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { formatCampaignProgressAmounts } from "../utils/campaignProgress";
import { formatCurrency } from "../utils/format";
import cardIcon from "../assets/icon-card.png";
import unicefLogo from "../assets/logo-unicef.png";
import type { PaymentMethod } from "../types";
import "./PaymentPage.css";

export function PaymentPage() {
  const navigate = useAppNavigate();
  const { theme, category } = useTheme();
  const isSchool = category === "school";
  const { selectedCampaign, amount, setPaymentMethod, setMerchantUid } =
    useDonationStore();

  const [overlay, setOverlay] = useState<"card" | null>(null);
  const [cardSelected, setCardSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const merchantUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedCampaign || amount <= 0) {
      navigate("/amount", { replace: true });
    }
  }, [selectedCampaign, amount, navigate]);

  const runPayment = useCallback(
    async (method: PaymentMethod) => {
      if (!selectedCampaign || !method) {
        throw new Error("Missing campaign or payment method");
      }
      if (!merchantUidRef.current) {
        merchantUidRef.current = createMerchantUid();
        setMerchantUid(merchantUidRef.current);
      }
      await processPayment(
        buildPaymentRequest(
          merchantUidRef.current,
          selectedCampaign.id,
          amount,
          method,
        ),
      );
    },
    [selectedCampaign, amount, setMerchantUid],
  );

  const selectCard = () => {
    setError(null);
    setCardSelected(true);
    setPaymentMethod("card");
  };

  const startPayment = () => {
    if (!cardSelected) return;
    setError(null);
    merchantUidRef.current = createMerchantUid();
    setMerchantUid(merchantUidRef.current);
    setOverlay("card");
  };

  const handlePaymentError = (err: unknown) => {
    merchantUidRef.current = null;
    setMerchantUid(null);
    if (err instanceof ApiError) {
      const detail = err.errorCode ? ` (${err.errorCode})` : "";
      setError(`${err.message}${detail}`);
      return;
    }
    setError("결제 처리 중 오류가 발생했습니다");
  };

  const finishPayment = () => {
    setOverlay(null);
    navigate("/message");
  };

  const cancelPayment = async () => {
    const merchantUid = merchantUidRef.current;
    try {
      if (merchantUid) await cancelPendingPayment({ merchantUid });
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.errorCode ? ` (${err.errorCode})` : "";
        setError(`${err.message}${detail}`);
      } else {
        setError("결제 취소 요청 중 오류가 발생했습니다");
      }
    } finally {
      merchantUidRef.current = null;
      setMerchantUid(null);
      setOverlay(null);
    }
  };

  if (!selectedCampaign) return null;

  const progress = formatCampaignProgressAmounts(selectedCampaign);

  return (
    <PageBody className="payment-page">
      <AppHeader />

      <div className="payment-page__body">
        <button
          type="button"
          className="pay-chip"
          onClick={() => navigate("/amount")}
          style={{ backgroundColor: theme.primary }}
        >
          <IconHeart size={68} aria-hidden />
          <span>{selectedCampaign.title}</span>
        </button>

        <div className="pay-progress">
          {!isSchool && (
            <img className="pay-progress__logo" src={unicefLogo} alt="" />
          )}
          <div className="pay-progress__bar">
            <div
              className="pay-progress__fill"
              style={{
                width: `${progress.percent}%`,
                backgroundColor: theme.primary,
              }}
            />
          </div>
          <p className="pay-progress__label" style={{ color: theme.primary }}>
            누적 기부금액 : {formatCurrency(progress.accumulated)}원
          </p>
        </div>

        <div className="pay-divider" aria-hidden />

        <div className="pay-amount-card">
          <p className="pay-amount-card__label">기부 금액</p>
          <p className="pay-amount-card__value">{formatCurrency(amount)}원</p>
        </div>

        <h2 className="pay-method-title">카드</h2>
        <p className="pay-method-desc">
          카드를 투입구 끝까지 넣어주시고 결제 완료 후 카드를 빼주세요
        </p>
        <button
          type="button"
          className={`pay-card${cardSelected ? " pay-card--on" : ""}`}
          onClick={selectCard}
          aria-pressed={cardSelected}
          style={cardSelected ? { borderColor: theme.primary } : undefined}
        >
          <img className="pay-card__icon" src={cardIcon} alt="" />
          <span
            className="pay-card__label"
            style={cardSelected ? { color: theme.primary } : undefined}
          >
            신용/체크카드
          </span>
        </button>

        {!isSchool && (
          <p className="pay-partner">
            이 캠페인은
            <img src={unicefLogo} alt="unicef" className="pay-partner__logo" />
            와 함께합니다.
          </p>
        )}

        {error && (
          <p className="pay-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="pay-cta"
          onClick={startPayment}
          disabled={!cardSelected}
          style={cardSelected ? { backgroundColor: theme.primary } : undefined}
        >
          결제하기
        </button>
      </div>

      <AppFooter />

      {overlay === "card" && (
        <PaymentStatusOverlay
          amount={amount}
          onProcessPayment={() => runPayment("card")}
          onComplete={finishPayment}
          onCancel={cancelPayment}
          onPaymentFailed={handlePaymentError}
        />
      )}
    </PageBody>
  );
}

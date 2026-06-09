import { useCallback, useEffect, useRef, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { ApiError } from "../api/client";
import {
  buildPaymentRequest,
  cancelPendingPayment,
  createMerchantUid,
  processPayment,
} from "../api/payments";
import { CardPaymentOverlay } from "../components/CardPaymentOverlay";
import creditCardIcon from "../assets/credit-card.png";
import { IconHeart } from "../components/Icon";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import type { PaymentMethod } from "../types";
import { formatCurrency } from "../utils/format";
import "./PaymentPage.css";

const SUMMARY_NOTE =
  "기부금 전액이 현장 지원에 사용되며, 법정 기부금으로서 세액공제 혜택이 적용됩니다";

type PaymentOverlay = "card" | null;

export function PaymentPage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const {
    selectedCampaign,
    amount,
    setPaymentMethod,
    setMerchantUid,
  } = useDonationStore();

  const [overlay, setOverlay] = useState<PaymentOverlay>(null);
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
    setOverlay(null);

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
      if (merchantUid) {
        await cancelPendingPayment({ merchantUid });
      }
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

  return (
    <PageBody className="payment-page" scroll={false}>
      <main className="payment-page__main">
        <section className="payment-page__summary" aria-label="선택한 기부 정보">
          <div className="payment-page__summary-top">
            <img
              className="payment-page__summary-image"
              src={selectedCampaign.imageUrl}
              alt=""
              decoding="async"
            />
            <div className="payment-page__summary-info">
              <div
                className="payment-page__summary-badge"
                style={{ backgroundColor: theme.primary }}
              >
                <IconHeart className="payment-page__summary-badge-icon" aria-hidden />
                <span>{selectedCampaign.title}</span>
              </div>
              <p className="payment-page__summary-amount">
                <span className="payment-page__summary-amount-value">
                  {formatCurrency(amount)}
                </span>
                <span className="payment-page__summary-amount-currency">원</span>
              </p>
            </div>
          </div>
          <div className="payment-page__summary-divider" aria-hidden />
          <p className="payment-page__summary-note">{SUMMARY_NOTE}</p>
        </section>

        {!overlay && (
          <section className="payment-page__method" aria-label="결제 수단 선택">
            <h2 className="payment-page__method-title">카드</h2>
            <p className="payment-page__method-desc">
              카드를 투입구 끝까지 넣어주시고 결제 완료 후 카드를 뽑아주세요
            </p>
            <button
              type="button"
              className={`payment-page__card-btn${
                cardSelected ? " payment-page__card-btn--selected" : ""
              }`}
              onClick={selectCard}
              aria-pressed={cardSelected}
            >
              <img
                className="payment-page__card-btn-icon"
                src={creditCardIcon}
                alt=""
              />
              <span className="payment-page__card-btn-label">신용/체크카드</span>
            </button>
          </section>
        )}

        {overlay === "card" && (
          <CardPaymentOverlay
            inline
            amount={amount}
            onProcessPayment={() => runPayment("card")}
            onComplete={finishPayment}
            onCancel={cancelPayment}
            onPaymentFailed={handlePaymentError}
          />
        )}

        {error && (
          <p className="payment-page__error" role="alert">
            {error}
          </p>
        )}
      </main>

      {!overlay && (
        <div className="payment-page__pay-wrap">
          <button
            type="button"
            className="payment-page__pay-btn"
            onClick={startPayment}
            disabled={!cardSelected}
            style={cardSelected ? { backgroundColor: theme.primary } : undefined}
          >
            결제하기
          </button>
        </div>
      )}
    </PageBody>
  );
}

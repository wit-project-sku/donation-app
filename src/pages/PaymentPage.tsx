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
import { IconBack } from "../components/Icon";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import type { PaymentMethod } from "../types";
import { formatCurrency } from "../utils/format";
import "./PaymentPage.css";

type PaymentOverlay = "card" | null;

/** Neutral border for unselected controls (not location primary) */
const DEFAULT_BORDER = "#D0D0D0";

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

  const startPayment = (method: PaymentMethod) => {
    setError(null);
    setPaymentMethod(method);
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
    <PageBody
      className="payment-page"
      scroll={false}
      style={{ backgroundColor: theme.background }}
    >
      {!overlay && (
        <button
          type="button"
          className="payment-page__back-btn"
          onClick={() => navigate("/amount")}
          aria-label="금액 선택으로 돌아가기"
          style={{
            borderColor: theme.primary,
            backgroundColor: theme.primary,
            color: theme.text.onPrimary,
          }}
        >
          <IconBack size={72} strokeWidth={2.5} />
        </button>
      )}

      <main
        className={`payment-page__main ${overlay ? "payment-page__main--dimmed" : ""}`}
      >
        <header className="payment-page__header">
          <h1
            className="payment-page__title"
            style={{ color: theme.text.primary }}
          >
            결제 방법을 선택해주세요
          </h1>
        </header>

        <section
          className="payment-page__campaign-strip"
          style={{ backgroundColor: theme.card.background }}
        >
          <img
            className="payment-page__campaign-thumb"
            src={selectedCampaign.imageUrl}
            alt=""
            decoding="async"
          />
          <div className="payment-page__campaign-text">
            <p
              className="payment-page__campaign-name"
              style={{ color: theme.text.primary }}
            >
              {selectedCampaign.title}
            </p>
            {selectedCampaign.description?.trim() && (
              <p
                className="payment-page__campaign-desc"
                style={{ color: theme.text.secondary }}
              >
                {selectedCampaign.description}
              </p>
            )}
          </div>
        </section>

        <section
          className="payment-page__display"
          style={{
            borderColor: DEFAULT_BORDER,
            backgroundColor: theme.background,
          }}
        >
          <div className="payment-page__display-content">
            <p
              className="payment-page__display-label"
              style={{ color: theme.text.secondary }}
            >
              기부 금액
            </p>
            <div className="payment-page__display-amount">
              <span
                className="payment-page__amount-currency"
                style={{ color: theme.text.secondary }}
              >
                ₩
              </span>
              <span
                className="payment-page__amount-number"
                style={{ color: theme.primary }}
              >
                {formatCurrency(amount)}
              </span>
            </div>
          </div>
        </section>

        <p
          className="payment-page__helper"
          style={{ color: theme.text.secondary }}
        >
          카드를 투입구 끝까지 넣어주시고, 결제 완료 후 카드를 빼주세요
        </p>

        {error && (
          <p
            className="payment-page__error"
            role="alert"
            style={{
              backgroundColor: theme.card.background,
              borderColor: "#e8a0a0",
              color: "#b42318",
            }}
          >
            {error}
          </p>
        )}
      </main>

      {!overlay && (
        <button
          type="button"
          className="payment-page__pay-btn"
          onClick={() => startPayment("card")}
          aria-label="신용/체크카드로 결제"
          style={{
            backgroundColor: theme.primary,
            borderColor: theme.primary,
            color: theme.text.onPrimary,
          }}
        >
          <span className="payment-page__pay-icon-wrap" aria-hidden>
            <img
              className="payment-page__pay-icon"
              src={creditCardIcon}
              alt=""
            />
          </span>
          <span className="payment-page__pay-label">신용/체크카드</span>
        </button>
      )}

      {overlay === "card" && (
        <CardPaymentOverlay
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

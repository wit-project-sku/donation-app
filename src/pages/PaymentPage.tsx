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
import { FooterBanner } from "../components/FooterBanner";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { formatCampaignProgressAmounts } from "../utils/campaignProgress";
import { formatCurrency } from "../utils/format";
import type { PaymentMethod } from "../types";
import "./PaymentPage.css";

export function PaymentPage() {
  const navigate = useAppNavigate();
  const { theme, organizer } = useTheme();
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
          "NGO",
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
    navigate("/certificate-prompt");
  };

  const cancelPayment = () => {
    // 팝업은 즉시 닫고(네트워크 대기 없이), 취소 요청은 백그라운드로 보낸다.
    const merchantUid = merchantUidRef.current;
    merchantUidRef.current = null;
    setMerchantUid(null);
    setOverlay(null);
    if (merchantUid) {
      void cancelPendingPayment({ merchantUid }).catch(() => {
        /* 백그라운드 취소 — 실패해도 이미 닫힌 팝업엔 영향 없음 */
      });
    }
  };

  if (!selectedCampaign) return null;

  const progress = formatCampaignProgressAmounts(selectedCampaign);

  return (
    <PageBody className="payment-page">
      <AppHeader subtitle="결제 수단을 선택해주세요" />

      <div className="payment-page__body">
        <button
          type="button"
          className="pay-chip"
          onClick={() => navigate("/amount")}
          style={{ backgroundColor: theme.primary }}
        >
          <img src="/icons/heart.png" alt="" className="pay-chip__heart" />
          <span>{selectedCampaign.title}</span>
        </button>

        {/* 기부 금액 박스 — Figma 5535:18087: 회색 테두리(#e8e8e8), 강조색 아님 */}
        <div className="pay-amount-card">
          <p className="pay-amount-card__label">기부 금액</p>
          <p className="pay-amount-card__value">{formatCurrency(amount)}원</p>
        </div>

        <h2 className="pay-method-title">카드</h2>

        <button
          type="button"
          className={`pay-card${cardSelected ? " pay-card--on" : ""}`}
          onClick={selectCard}
          aria-pressed={cardSelected}
          style={cardSelected ? { borderColor: theme.primary } : undefined}
        >
          <img className="pay-card__icon" src="/icons/image 273.png" alt="" />
          <span
            className="pay-card__label"
            style={cardSelected ? { color: theme.primary } : undefined}
          >
            신용/체크카드
          </span>
        </button>

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

        <p className="pay-partner">
          <span>이 캠페인은</span>
          <img
            src={organizer.logo}
            alt={organizer.label}
            className="pay-partner__logo"
          />
          <span>와 함께합니다.</span>
        </p>

        <div className="pay-funding">
          <p className="pay-funding__label" style={{ color: theme.primary }}>
            모금 현황
          </p>
          <div className="pay-funding__bar">
            <div
              className="pay-funding__fill"
              style={{
                width: `${progress.percent}%`,
                backgroundColor: theme.primary,
              }}
            />
          </div>
          <p className="pay-funding__amount" style={{ color: theme.primary }}>
            {formatCurrency(progress.accumulated)} /{" "}
            {formatCurrency(progress.target)}원
          </p>
        </div>
      </div>

      <FooterBanner />

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

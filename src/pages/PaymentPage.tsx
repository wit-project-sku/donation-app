import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import {
  buildPaymentRequest,
  createMerchantUid,
  processPayment,
} from "../api/payments";
import { CardPaymentOverlay } from "../components/CardPaymentOverlay";
import { EasyPayOverlay } from "../components/EasyPayOverlay";
import { IconCreditCard } from "../components/Icon";
import { ReceiptCard } from "../components/ReceiptCard";
import { PageBody } from "../components/layout/PageBody";
import { PageFooter } from "../components/layout/PageFooter";
import { useDonationStore } from "../store/donationStore";
import type { PaymentMethod } from "../types";
import "./PaymentPage.css";

type PaymentOverlay = "card" | "kakao" | "naver" | null;

export function PaymentPage() {
  const navigate = useNavigate();
  const {
    selectedCampaign,
    amount,
    donationType,
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
    setOverlay(method === "card" ? "card" : method);
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
    navigate("/complete");
  };

  const cancelPayment = () => {
    merchantUidRef.current = null;
    setMerchantUid(null);
    setOverlay(null);
  };

  if (!selectedCampaign) return null;

  return (
    <PageBody className="payment-page" scroll={false}>
      <div
        className={`payment-page__content ${overlay ? "payment-page__content--dimmed" : ""}`}
      >
        <ReceiptCard
          amount={amount}
          donationType={donationType}
          campaign={selectedCampaign}
        />

        {error && (
          <p className="payment-page__error" role="alert">
            {error}
          </p>
        )}

        <section className="payment-page__section">
          <h2 className="payment-page__section-title">카드</h2>
          <p className="payment-page__section-desc">
            카드를 투입구 끝까지 넣어주시고 결제 완료 후 카드를 빼주세요
          </p>
          <button
            type="button"
            className="payment-page__card-btn"
            onClick={() => startPayment("card")}
            disabled={overlay != null}
          >
            <IconCreditCard size={96} strokeWidth={1.5} aria-hidden />
            <span>신용/체크카드</span>
          </button>
        </section>

        <section className="payment-page__section">
          <h2 className="payment-page__section-title">간편 결제</h2>
          <p className="payment-page__section-desc">
            QR 코드를 스캔한 후, 결제가 완료될 때까지 화면을 유지해주세요
          </p>
          <div className="payment-page__easy-pay">
            <button
              type="button"
              className="payment-page__easy-btn"
              onClick={() => startPayment("kakao")}
              disabled={overlay != null}
            >
              <span className="payment-page__kakao-logo">pay</span>
              <span>카카오 페이</span>
            </button>
            <button
              type="button"
              className="payment-page__easy-btn"
              onClick={() => startPayment("naver")}
              disabled={overlay != null}
            >
              <span className="payment-page__naver-logo">N pay</span>
              <span>네이버 페이</span>
            </button>
          </div>
        </section>
      </div>

      {overlay === "card" && (
        <CardPaymentOverlay
          amount={amount}
          onProcessPayment={() => runPayment("card")}
          onComplete={finishPayment}
          onCancel={cancelPayment}
          onPaymentFailed={handlePaymentError}
        />
      )}

      {overlay === "kakao" && (
        <EasyPayOverlay
          amount={amount}
          provider="kakao"
          onProcessPayment={() => runPayment("kakao")}
          onComplete={finishPayment}
          onCancel={cancelPayment}
          onPaymentFailed={handlePaymentError}
        />
      )}

      {overlay === "naver" && (
        <EasyPayOverlay
          amount={amount}
          provider="naver"
          onProcessPayment={() => runPayment("naver")}
          onComplete={finishPayment}
          onCancel={cancelPayment}
          onPaymentFailed={handlePaymentError}
        />
      )}

      {!overlay && <PageFooter onBack={() => navigate("/amount")} />}
    </PageBody>
  );
}

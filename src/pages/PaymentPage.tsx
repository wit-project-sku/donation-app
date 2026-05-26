import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import {
  buildPaymentRequest,
  cancelPendingPayment,
  createMerchantUid,
  processPayment,
} from "../api/payments";
import kakaoPayIcon from "../assets/kakao-pay.svg";
import naverPayIcon from "../assets/naver-pay.svg";
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
            className="payment-page__pay-tile payment-page__pay-tile--card"
            onClick={() => startPayment("card")}
            disabled={overlay != null}
          >
            <IconCreditCard size={118} strokeWidth={1.8} aria-hidden />
            <span>신용/체크카드</span>
          </button>
        </section>

        <section className="payment-page__section payment-page__section--easy">
          <h2 className="payment-page__section-title">간편 결제</h2>
          <p className="payment-page__section-desc">
            QR 코드를 스캔한 후, 결제가 완료될 때까지 화면을 유지해주세요
          </p>
          <div className="payment-page__easy-pay">
            <button
              type="button"
              className="payment-page__pay-tile"
              onClick={() => startPayment("kakao")}
              disabled={overlay != null}
            >
              <img
                className="payment-page__pay-logo payment-page__pay-logo--kakao"
                src={kakaoPayIcon}
                alt="카카오 페이"
              />
              <span>카카오 페이</span>
            </button>
            <button
              type="button"
              className="payment-page__pay-tile"
              onClick={() => startPayment("naver")}
              disabled={overlay != null}
            >
              <img
                className="payment-page__pay-logo payment-page__pay-logo--naver"
                src={naverPayIcon}
                alt="네이버 페이"
              />
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

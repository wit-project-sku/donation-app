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
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { IconHeart } from "../components/Icon";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { formatCampaignProgressAmounts } from "../utils/campaignProgress";
import { formatCurrency } from "../utils/format";
import type { PaymentMethod } from "../types";
import cardImg from "../assets/card-credit.png";
import "./SchoolPaymentPage.css";

/**
 * 학교 결제 화면 (Figma 5535:18132).
 * 기부금 선택 후 진입 — 학교 배지 + 기부 금액 + 카드 결제수단 + 결제하기.
 * 결제하기 시 실제 카드 단말기 결제(processPayment)를 진행하고, 완료 후
 * 학교 기부 완료(/school-complete)로 이동한다. (NGO 결제와 동일한 실결제 흐름)
 */
export function SchoolPaymentPage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const { selectedCampaign, amount, setPaymentMethod, setMerchantUid } =
    useDonationStore();
  const [overlay, setOverlay] = useState<"card" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const merchantUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedCampaign || amount <= 0) {
      navigate("/school-amount", { replace: true });
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
          "SCHOOL",
        ),
      );
    },
    [selectedCampaign, amount, setMerchantUid],
  );

  const pay = () => {
    setError(null);
    setPaymentMethod("card");
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
    navigate("/school-complete");
  };

  const cancelPayment = () => {
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

  if (!selectedCampaign || amount <= 0) return null;

  const progress = formatCampaignProgressAmounts(selectedCampaign);

  return (
    <PageBody className="school-payment" scroll={false}>
      <AppHeader title="기부" subtitle="기부금을 선택해주세요" backTo="/school-amount" />

      <div className="sp-body">
        {/* 학교 배지 — Figma 5535:18139 */}
        <div className="sp-badge" style={{ backgroundColor: theme.primary }}>
          <IconHeart size={68} aria-hidden />
          <span className="sp-badge__name">{selectedCampaign.title}</span>
        </div>

        {/* 기부 금액 — Figma 5591:41248 */}
        <div className="sp-amount">
          <p className="sp-amount__label">기부 금액</p>
          <div className="sp-amount__gap" aria-hidden />
          <p className="sp-amount__value">{formatCurrency(amount)}원</p>
        </div>

        {/* 결제수단 — Figma 5591:41242/41243 카드(신용/체크) 선택 */}
        <p className="sp-method-label">카드</p>
        <div className="sp-methods">
          <button
            type="button"
            className="sp-method is-selected"
            style={{ borderColor: theme.primary }}
          >
            <img className="sp-method__img" src={cardImg} alt="" />
            <span className="sp-method__name" style={{ color: theme.primary }}>
              신용/체크카드
            </span>
          </button>
        </div>

        {error && (
          <p
            className="sp-error"
            role="alert"
            style={{ color: "#b42318", fontSize: 34, textAlign: "center", margin: "20px 0 0" }}
          >
            {error}
          </p>
        )}

        {/* 결제하기 — Figma 5591:41244 초록 버튼 */}
        <button
          type="button"
          className="sp-pay"
          style={{ backgroundColor: theme.primary }}
          onClick={pay}
        >
          결제하기
        </button>

        {/* 캠페인 안내 — Figma 5591:41264 */}
        <p className="sp-partner">이 캠페인은 채널A와 함께합니다.</p>

        {/* 모금 현황 — Figma 5591:41256 (실 누적/목표액 기준) */}
        <div className="sp-funding">
          <p className="sp-funding__label" style={{ color: theme.primary }}>
            모금 현황
          </p>
          <div className="sp-funding__bar">
            <div
              className="sp-funding__fill"
              style={{
                width: `${progress.percent}%`,
                backgroundColor: theme.primary,
              }}
            />
          </div>
          <p className="sp-funding__amount" style={{ color: theme.primary }}>
            {formatCurrency(progress.accumulated)} /{" "}
            {formatCurrency(progress.target)}원
          </p>
        </div>
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

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconCheck } from "../components/Icon";
import { ReceiptCard } from "../components/ReceiptCard";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import "./CompletePage.css";

export function CompletePage() {
  const navigate = useNavigate();
  const { selectedCampaign, amount, donationType, paymentMethod } =
    useDonationStore();

  const [completed, setCompleted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const countdownRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!selectedCampaign || amount <= 0 || !paymentMethod) {
      navigate("/payment", { replace: true });
      return;
    }
    timerRef.current = setTimeout(() => {
      setCompleted(true);
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownRef.current);
            navigate("/message");
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, 3000);
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  if (!selectedCampaign) return null;

  const handleCancel = () => {
    clearTimeout(timerRef.current);
    clearInterval(countdownRef.current);
    navigate("/payment");
  };

  const handleNext = () => {
    clearTimeout(timerRef.current);
    clearInterval(countdownRef.current);
    navigate("/message");
  };

  return (
    <PageBody className="complete-page" scroll={false}>
      <div className="complete-page__bg">
        <ReceiptCard
          amount={amount}
          donationType={donationType}
          campaign={selectedCampaign}
        />
      </div>

      <div className="complete-page__overlay">
        {!completed ? (
          <>
            <p className="complete-page__overlay-desc">
              카드를 투입구 끝까지 넣어주시고 결제 완료 후 카드를 빼주세요.
            </p>
            <div className="complete-page__spinner" aria-hidden />
            <p className="complete-page__status">결제 승인 확인 중..</p>
            <button
              type="button"
              className="complete-page__cancel"
              onClick={handleCancel}
            >
              결제 취소
            </button>
          </>
        ) : (
          <>
            <div className="complete-page__check" aria-hidden>
              <IconCheck size={100} strokeWidth={2.5} />
            </div>
            <p className="complete-page__thanks-sub">감사합니다</p>
            <p className="complete-page__thanks-main">
              당신의 마음이 필요한 곳에 전해집니다
            </p>
            <button
              type="button"
              className="complete-page__next-btn"
              onClick={handleNext}
            >
              {countdown}초 후 다음 단계로 자동 전환됩니다
            </button>
          </>
        )}
      </div>
    </PageBody>
  );
}

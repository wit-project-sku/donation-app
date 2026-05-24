import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconCheck } from "../components/Icon";
import { ReceiptCard } from "../components/ReceiptCard";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import "./CompletePage.css";

export function CompletePage() {
  const navigate = useNavigate();
  const { selectedCampaign, amount, donationType, paymentMethod, resetSession } =
    useDonationStore();

  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!selectedCampaign || amount <= 0 || !paymentMethod) {
      navigate("/payment", { replace: true });
      return;
    }
    timerRef.current = setTimeout(() => setCompleted(true), 3000);
    return () => clearTimeout(timerRef.current);
  }, []);

  if (!selectedCampaign) return null;

  const goRegular = () => {
    resetSession();
    navigate("/");
  };

  const goWall = () => {
    navigate("/message");
  };

  const handleCancel = () => {
    clearTimeout(timerRef.current);
    navigate("/payment");
  };

  return (
    <PageBody className="complete-page">
      <ReceiptCard
        amount={amount}
        donationType={donationType}
        campaign={selectedCampaign}
      />

      <div className="complete-page__middle">
        {!completed ? (
          <>
            <div className="complete-page__spinner" aria-hidden />
            <p className="complete-page__status">결제 승인 확인 중..</p>
          </>
        ) : (
          <>
            <div className="complete-page__check" aria-hidden>
              <IconCheck size={130} strokeWidth={2.5} />
            </div>
            <p className="complete-page__thanks-sub">감사합니다</p>
            <p className="complete-page__thanks-main">
              당신의 마음이 필요한 곳에 전해집니다
            </p>
          </>
        )}
      </div>

      {!completed ? (
        <button
          type="button"
          className="complete-page__cancel"
          onClick={handleCancel}
        >
          결제 취소
        </button>
      ) : (
        <div className="complete-page__actions">
          <button
            type="button"
            className="complete-page__btn complete-page__btn--primary"
            onClick={goRegular}
          >
            정기 후원 하러가기
          </button>
          <button
            type="button"
            className="complete-page__btn complete-page__btn--outline"
            onClick={goWall}
          >
            기부의 벽에 기록하기
          </button>
        </div>
      )}
    </PageBody>
  );
}

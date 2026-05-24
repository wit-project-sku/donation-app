import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageBody } from "../components/layout/PageBody";
import { PageFooter } from "../components/layout/PageFooter";
import { useDonationStore } from "../store/donationStore";
import "./MessageReviewPage.css";

export function MessageReviewPage() {
  const navigate = useNavigate();
  const {
    selectedCampaign,
    amount,
    paymentMethod,
    message,
    donorName,
    setSkipPhoto,
    setCapturedPhotoUrl,
    setSelectedOutfit,
  } = useDonationStore();

  useEffect(() => {
    if (!selectedCampaign || amount <= 0) {
      navigate("/amount", { replace: true });
      return;
    }
    if (!paymentMethod) {
      navigate("/payment", { replace: true });
    }
  }, [selectedCampaign, amount, paymentMethod, navigate]);

  const displayMessage = message.trim() || "안녕하세요";
  const displayName = donorName.trim() ? donorName : "이름";

  const goNext = (skipPhoto: boolean) => {
    setSkipPhoto(skipPhoto);
    if (skipPhoto) {
      setSelectedOutfit(null);
      setCapturedPhotoUrl(null);
    }
    navigate(skipPhoto ? "/certificate" : "/outfit");
  };

  return (
    <PageBody className="message-review-page" scroll={false}>
      <p className="message-review-page__hint">★ 페이지 설명문</p>

      <div className="message-review-page__center">
        <div className="message-review-page__card">
          <p className="message-review-page__message">{displayMessage}</p>
          <p className="message-review-page__name">— {displayName}</p>
        </div>
      </div>

      <div className="message-review-page__footer">
        <PageFooter onBack={() => navigate("/message")}>
          <button
            type="button"
            className="message-review-page__skip-photo"
            onClick={() => goNext(true)}
          >
            촬영 안함
          </button>
          <button
            type="button"
            className="message-review-page__continue"
            onClick={() => goNext(false)}
          >
            CONTINUE
          </button>
        </PageFooter>
      </div>
    </PageBody>
  );
}

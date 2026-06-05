import { useCallback, useEffect } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { IconBack } from "../components/Icon";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import "./MessageReviewPage.css";

const DEFAULT_BORDER = "#D0D0D0";

export function MessageReviewPage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const {
    selectedCampaign,
    amount,
    paymentMethod,
    donorName,
    donorPhone,
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
      return;
    }
    if (!donorName.trim()) {
      navigate("/message", { replace: true });
    }
  }, [selectedCampaign, amount, paymentMethod, donorName, navigate]);

  const goNext = useCallback(
    (skipPhoto: boolean) => {
      setSkipPhoto(skipPhoto);
      if (skipPhoto) {
        setSelectedOutfit(null);
        setCapturedPhotoUrl(null);
      }
      navigate(skipPhoto ? "/certificate" : "/outfit");
    },
    [
      navigate,
      setCapturedPhotoUrl,
      setSelectedOutfit,
      setSkipPhoto,
    ],
  );

  if (!selectedCampaign) return null;

  const displayName = donorName.trim();
  const displayPhone = donorPhone.trim();

  return (
    <PageBody
      className="message-review-page"
      scroll={false}
      style={{ backgroundColor: theme.background }}
    >
      <button
        type="button"
        className="message-review-page__back-btn"
        onClick={() => navigate("/message")}
        aria-label="정보 입력으로 돌아가기"
        style={{
          borderColor: theme.primary,
          backgroundColor: theme.primary,
          color: theme.text.onPrimary,
        }}
      >
        <IconBack size={72} strokeWidth={2.5} />
      </button>

      <main className="message-review-page__main">
        <header className="message-review-page__header">
          <h1
            className="message-review-page__title"
            style={{ color: theme.text.primary }}
          >
            입력 정보를 확인해주세요
          </h1>
        </header>

        <section
          className="message-review-page__card"
          style={{ backgroundColor: theme.card.background }}
        >
          <div className="message-review-page__row">
            <span
              className="message-review-page__label"
              style={{ color: theme.text.secondary }}
            >
              이름/닉네임
            </span>
            <span
              className="message-review-page__value"
              style={{ color: theme.text.primary }}
            >
              {displayName}
            </span>
          </div>

          <div className="message-review-page__row">
            <span
              className="message-review-page__label"
              style={{ color: theme.text.secondary }}
            >
              전화번호
            </span>
            <span
              className="message-review-page__value"
              style={{
                color: displayPhone ? theme.text.primary : theme.text.secondary,
                fontWeight: displayPhone ? 800 : 500,
                opacity: displayPhone ? 1 : 0.55,
              }}
            >
              {displayPhone || "입력하지 않음"}
            </span>
          </div>
        </section>

        <p
          className="message-review-page__helper"
          style={{ color: theme.text.secondary }}
        >
          기부증서에 함께 남길 사진을 촬영할 수 있어요
        </p>
      </main>

      <div className="message-review-page__actions">
        <button
          type="button"
          className="message-review-page__skip-btn"
          onClick={() => goNext(true)}
          style={{
            backgroundColor: theme.button.background,
            borderColor: DEFAULT_BORDER,
            color: theme.text.primary,
          }}
        >
          촬영 안함
        </button>
        <button
          type="button"
          className="message-review-page__photo-btn"
          onClick={() => goNext(false)}
          style={{
            backgroundColor: theme.primary,
            borderColor: theme.primary,
            color: theme.text.onPrimary,
          }}
        >
          사진 촬영하기
        </button>
      </div>
    </PageBody>
  );
}

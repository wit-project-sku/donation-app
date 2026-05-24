import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { PageBody } from "../components/layout/PageBody";
import { PageFooter } from "../components/layout/PageFooter";
import { useDonationStore } from "../store/donationStore";
import "./MessagePage.css";

export function MessagePage() {
  const navigate = useNavigate();
  const {
    selectedCampaign,
    amount,
    donationType,
    paymentMethod,
    message,
    donorName,
    activeField,
    setMessage,
    setDonorName,
    setActiveField,
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

  if (!selectedCampaign) return null;

  const typeLabel = donationType === "one-time" ? "일시 후원" : "정기 후원";
  const formattedAmount = amount.toLocaleString("ko-KR");

  const handleKeyPress = (key: string) => {
    const field = activeField ?? "name";
    if (field === "message") {
      setMessage(message + key);
    } else {
      setDonorName(donorName + key);
    }
  };

  const handleBackspace = () => {
    const field = activeField ?? "name";
    if (field === "message") {
      setMessage(message.slice(0, -1));
    } else {
      setDonorName(donorName.slice(0, -1));
    }
  };

  const handleSpace = () => {
    const field = activeField ?? "name";
    if (field === "message") {
      setMessage(message + " ");
    } else {
      setDonorName(donorName + " ");
    }
  };

  return (
    <PageBody className="message-page" scroll={false}>
      {/* Compact campaign + amount summary */}
      <div className="message-page__summary">
        <div className="message-page__summary-img-wrap">
          {selectedCampaign.imageUrl ? (
            <img
              src={selectedCampaign.imageUrl}
              alt={selectedCampaign.title}
              className="message-page__summary-img"
            />
          ) : (
            <div className="message-page__summary-placeholder" />
          )}
        </div>
        <div className="message-page__summary-info">
          <span className="message-page__summary-title">
            {selectedCampaign.title}
          </span>
          <span className="message-page__summary-desc">
            {selectedCampaign.description}
          </span>
        </div>
        <div className="message-page__summary-amount">
          <span className="message-page__summary-type">{typeLabel}</span>
          <span className="message-page__summary-price">
            {formattedAmount} 원
          </span>
        </div>
      </div>

      <h2 className="message-page__title">메세지를 남겨주세요</h2>

      {/* Form card + keyboard overlay */}
      <div className="message-page__form-area">
        <div className="message-page__form-card">
          <div
            className={`message-page__field${activeField === "name" ? " message-page__field--active" : ""}`}
            onClick={() => setActiveField("name")}
          >
            <span className="message-page__field-label">이름 :</span>
            <span className="message-page__field-value">
              {donorName || <span className="message-page__field-placeholder">이름을 입력하세요</span>}
            </span>
          </div>
          <div className="message-page__field-divider" />
          <div
            className={`message-page__field${activeField === "message" ? " message-page__field--active" : ""}`}
            onClick={() => setActiveField("message")}
          >
            <span className="message-page__field-label">내용 :</span>
            <span className="message-page__field-value">
              {message || <span className="message-page__field-placeholder">내용을 입력하세요</span>}
            </span>
          </div>
        </div>

        <VirtualKeyboard
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onSpace={handleSpace}
        />
      </div>

      <PageFooter>
        <button
          type="button"
          className="message-page__skip"
          onClick={() => navigate("/outfit")}
        >
          건너뛰기
        </button>
        <button
          type="button"
          className="message-page__continue"
          onClick={() => navigate("/outfit")}
        >
          계속
        </button>
      </PageFooter>
    </PageBody>
  );
}

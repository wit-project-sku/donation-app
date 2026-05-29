import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { appendHangul, removeLastHangul } from "../utils/hangulInput";
import "./MessagePage.css";

export function MessagePage() {
  const navigate = useNavigate();
  const {
    selectedCampaign,
    amount,
    paymentMethod,
    donorName,
    donorPhone,
    activeField,
    setDonorName,
    setDonorPhone,
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

  const handleKeyPress = (key: string) => {
    const field = activeField ?? "name";
    if (field === "phone") {
      if (!/^\d$/.test(key)) return;
      setDonorPhone(donorPhone + key);
      return;
    }
    setDonorName(appendHangul(donorName, key));
  };

  const handleBackspace = () => {
    const field = activeField ?? "name";
    if (field === "phone") {
      setDonorPhone(donorPhone.slice(0, -1));
      return;
    }
    setDonorName(removeLastHangul(donorName));
  };

  const handleSpace = () => {
    const field = activeField ?? "name";
    if (field === "phone") {
      return;
    }
    setDonorName(donorName + " ");
  };

  return (
    <PageBody className="message-page" scroll={false}>
      <h2 className="message-page__title">후원자님의 이름을 남겨주세요.</h2>
      <p className="message-page__subtitle">*모바일로 기부증서를 보내드립니다.</p>

      <div className="message-page__form-card">
        <button
          type="button"
          className={`message-page__field${activeField === "name" || activeField === null ? " message-page__field--active" : ""}`}
          onClick={() => setActiveField("name")}
        >
          <span className="message-page__field-label">이름/닉네임 :</span>
          {donorName ? (
            <span className="message-page__field-value">{donorName}</span>
          ) : null}
        </button>

        <span className="message-page__divider" />

        <button
          type="button"
          className={`message-page__field${activeField === "phone" ? " message-page__field--active" : ""}`}
          onClick={() => setActiveField("phone")}
        >
          <span className="message-page__field-label">전화번호:</span>
          {donorPhone ? (
            <span className="message-page__field-value">{donorPhone}</span>
          ) : null}
        </button>
      </div>

      <VirtualKeyboard
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onSpace={handleSpace}
      />

      <button
        type="button"
        className="message-page__photo-btn"
        onClick={() => navigate("/outfit")}
      >
        사진 촬영하기
      </button>
    </PageBody>
  );
}

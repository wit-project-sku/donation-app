import { useCallback, useEffect } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { IconCamera } from "../components/Icon";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import {
  appendKeyboardInput,
  removeLastHangul,
} from "../utils/hangulInput";
import "./MessagePage.css";

const MAX_DONOR_NAME_LENGTH = 20;

export function MessagePage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
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

  useEffect(() => {
    if (activeField === null) {
      setActiveField("name");
    }
  }, [activeField, setActiveField]);

  const handleKeyPress = useCallback(
    (key: string) => {
      const field = activeField ?? "name";
      if (field === "phone") {
        if (!/^\d$/.test(key)) return;
        setDonorPhone(donorPhone + key);
        return;
      }
      if (key === "\n") return;
      const nextName = appendKeyboardInput(donorName, key);
      if (nextName.length > MAX_DONOR_NAME_LENGTH) return;
      setDonorName(nextName);
    },
    [activeField, donorName, donorPhone, setDonorName, setDonorPhone],
  );

  const handleBackspace = useCallback(() => {
    const field = activeField ?? "name";
    if (field === "phone") {
      setDonorPhone(donorPhone.slice(0, -1));
      return;
    }
    setDonorName(removeLastHangul(donorName));
  }, [activeField, donorName, donorPhone, setDonorName, setDonorPhone]);

  const handleSpace = useCallback(() => {
    const field = activeField ?? "name";
    if (field === "phone") return;
    if (donorName.length >= MAX_DONOR_NAME_LENGTH) return;
    setDonorName(donorName + " ");
  }, [activeField, donorName, setDonorName]);

  const goNext = useCallback(
    (skipPhoto: boolean) => {
      if (!donorName.trim()) return;
      setSkipPhoto(skipPhoto);
      if (skipPhoto) {
        setSelectedOutfit(null);
        setCapturedPhotoUrl(null);
        navigate("/certificate");
        return;
      }
      navigate("/outfit");
    },
    [
      donorName,
      navigate,
      setCapturedPhotoUrl,
      setSelectedOutfit,
      setSkipPhoto,
    ],
  );

  if (!selectedCampaign) return null;

  const isNameActive = activeField === "name" || activeField === null;
  const isPhoneActive = activeField === "phone";
  const canProceed = donorName.trim().length > 0;

  return (
    <PageBody className="message-page" scroll={false}>
      <main className="message-page__main">
        <div className="message-page__fields">
          <button
            type="button"
            className={`message-page__field${isNameActive ? " message-page__field--active" : ""}`}
            onClick={() => setActiveField("name")}
          >
            <span className="message-page__field-label">이름/닉네임 :</span>
            {donorName ? (
              <span className="message-page__field-value">{donorName}</span>
            ) : null}
          </button>

          <button
            type="button"
            className={`message-page__field${isPhoneActive ? " message-page__field--active" : ""}`}
            onClick={() => setActiveField("phone")}
          >
            <span className="message-page__field-label">전화번호 :</span>
            {donorPhone ? (
              <span className="message-page__field-value">{donorPhone}</span>
            ) : (
              <span className="message-page__field-hint">
                모바일 기부증서를 발송해드려요
              </span>
            )}
          </button>
        </div>

        <div className="message-page__actions">
          <button
            type="button"
            className="message-page__action-btn message-page__action-btn--secondary"
            onClick={() => goNext(true)}
            disabled={!canProceed}
          >
            기부증서 바로 발급
          </button>
          <button
            type="button"
            className="message-page__action-btn message-page__action-btn--primary"
            onClick={() => goNext(false)}
            disabled={!canProceed}
            style={{ backgroundColor: theme.primary }}
          >
            <IconCamera className="message-page__action-icon" aria-hidden />
            <span>사진 촬영</span>
          </button>
        </div>

        <div className="message-page__keyboard-wrap">
          <VirtualKeyboard
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onSpace={handleSpace}
          />
        </div>
      </main>
    </PageBody>
  );
}

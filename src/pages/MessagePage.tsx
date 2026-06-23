import { useCallback, useEffect } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { IconCamera } from "../components/Icon";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { appendKeyboardInput, removeLastHangul } from "../utils/hangulInput";
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
    if (activeField === null) setActiveField("name");
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
    [donorName, navigate, setCapturedPhotoUrl, setSelectedOutfit, setSkipPhoto],
  );

  if (!selectedCampaign) return null;

  const isNameActive = activeField === "name" || activeField === null;
  const isPhoneActive = activeField === "phone";
  const canProceed = donorName.trim().length > 0;

  return (
    <PageBody className="message-page" scroll={false}>
      <AppHeader />

      <div className="msg-body">
        <div className="msg-card" style={{ borderColor: theme.primary }}>
          <h2 className="msg-card__title" style={{ color: theme.primary }}>
            기부증서 발급
          </h2>

          <div className="msg-field-group">
            <span className="msg-field-label">이름/닉네임 :</span>
            <button
              type="button"
              className={`msg-field${isNameActive ? " msg-field--active" : ""}`}
              onClick={() => setActiveField("name")}
              style={isNameActive ? { borderColor: theme.primary } : undefined}
            >
              {donorName && (
                <span className="msg-field__value">{donorName}</span>
              )}
            </button>
          </div>

          <div className="msg-field-group">
            <span className="msg-field-label">전화번호 :</span>
            <button
              type="button"
              className={`msg-field${isPhoneActive ? " msg-field--active" : ""}`}
              onClick={() => setActiveField("phone")}
              style={isPhoneActive ? { borderColor: theme.primary } : undefined}
            >
              {donorPhone ? (
                <span className="msg-field__value">{donorPhone}</span>
              ) : (
                <span className="msg-field__hint">
                  모바일 기부증서를 발송해드려요
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="msg-actions">
          <button
            type="button"
            className="msg-action msg-action--secondary"
            onClick={() => goNext(true)}
            disabled={!canProceed}
          >
            기부증서 바로 발급
          </button>
          <button
            type="button"
            className="msg-action msg-action--primary"
            onClick={() => goNext(false)}
            disabled={!canProceed}
            style={canProceed ? { backgroundColor: theme.primary } : undefined}
          >
            <IconCamera size={72} aria-hidden />
            <span>사진 촬영</span>
          </button>
        </div>
      </div>

      <div className="msg-keyboard">
        <VirtualKeyboard
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onSpace={handleSpace}
        />
      </div>

      <AppFooter />
    </PageBody>
  );
}

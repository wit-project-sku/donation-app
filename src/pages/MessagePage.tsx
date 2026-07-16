import { useCallback, useEffect, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { AppHeader } from "../components/AppHeader";
import { FooterBanner } from "../components/FooterBanner";
import { IconCamera, IconCheck } from "../components/Icon";
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
    setDonorName,
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

  // 이 화면은 이름/닉네임만 입력받는다 (Figma 5535:18830).
  useEffect(() => {
    setActiveField("name");
  }, [setActiveField]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === "\n") return;
      const nextName = appendKeyboardInput(donorName, key);
      if (nextName.length > MAX_DONOR_NAME_LENGTH) return;
      setDonorName(nextName);
    },
    [donorName, setDonorName],
  );

  const handleBackspace = useCallback(() => {
    setDonorName(removeLastHangul(donorName));
  }, [donorName, setDonorName]);

  const handleSpace = useCallback(() => {
    if (donorName.length >= MAX_DONOR_NAME_LENGTH) return;
    setDonorName(donorName + " ");
  }, [donorName, setDonorName]);

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

  const [imageConsent, setImageConsent] = useState(false);

  if (!selectedCampaign) return null;

  const canProceed = donorName.trim().length > 0;
  const canCapture = canProceed && imageConsent;

  return (
    <PageBody className="message-page" scroll={false}>
      <AppHeader subtitle="당신의 마음이 필요한 곳에 전해집니다" />

      <div className="msg-body">
        <div className="msg-card" style={{ borderColor: theme.primary }}>
          <h2 className="msg-card__title" style={{ color: theme.primary }}>
            기부한컷 발급
          </h2>

          <div className="msg-field-group">
            <span className="msg-field-label">이름/닉네임 :</span>
            <button
              type="button"
              className="msg-field"
              onClick={() => setActiveField("name")}
            >
              {donorName && (
                <span className="msg-field__value">{donorName}</span>
              )}
            </button>
          </div>
        </div>

        <div className="msg-actions">
          {/* 사진 촬영(초상권) 동의 체크 + 안내문 */}
          <button
            type="button"
            className="msg-consent"
            onClick={() => setImageConsent((v) => !v)}
            aria-pressed={imageConsent}
          >
            <span className={`msg-check${imageConsent ? " msg-check--on" : ""}`}>
              <IconCheck size={48} />
            </span>
            <span className="msg-consent__text">
              서비스 제공을 위해 이용자의 합성된 이미지는 WITH 플랫폼에 저장됩니다.
            </span>
          </button>
          <div className="msg-buttons">
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
              disabled={!canCapture}
            >
              <IconCamera size={72} aria-hidden />
              <span>사진 촬영</span>
            </button>
          </div>
        </div>
      </div>

      <div className="msg-keyboard">
        <VirtualKeyboard
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onSpace={handleSpace}
        />
      </div>

      <FooterBanner />
    </PageBody>
  );
}

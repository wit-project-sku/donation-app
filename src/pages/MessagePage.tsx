import { useCallback, useEffect } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import {
  appendKeyboardInput,
  removeLastHangul,
} from "../utils/hangulInput";
import "./MessagePage.css";

/** Max characters for donor name / nickname */
const MAX_DONOR_NAME_LENGTH = 20;

export function MessagePage() {
  const navigate = useAppNavigate();
  const { theme, location } = useTheme();
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

  const handleNext = useCallback(() => {
    if (!donorName.trim()) return;
    navigate("/message-review");
  }, [donorName, navigate]);

  if (!selectedCampaign) return null;

  const isNameActive = activeField === "name" || activeField === null;
  const isPhoneActive = activeField === "phone";
  const canProceed = donorName.trim().length > 0;

  const messageKeyBackground =
    location.toLowerCase() === "insadong"
      ? `color-mix(in srgb, ${theme.secondary} 14%, #FFFFFF)`
      : theme.background.toUpperCase() === "#FFFFFF"
        ? theme.card.background
        : theme.background;

  return (
    <PageBody
      className="message-page"
      scroll={false}
      style={{
        backgroundColor: theme.background,
        ["--message-active-color" as string]: theme.primary,
        ["--message-active-bg" as string]: "#FFFFFF",
        ["--message-key-bg" as string]: messageKeyBackground,
      }}
    >
      <main className="message-page__main">
        <header className="message-page__header">
          <h1
            className="message-page__title"
            style={{ color: theme.text.primary }}
          >
            후원자 정보를 입력해주세요
          </h1>
          <p
            className="message-page__subtitle"
            style={{ color: theme.text.secondary }}
          >
            *모바일로 기부증서를 보내드립니다
          </p>
        </header>

        <div
          className="message-page__form-card"
          style={{ backgroundColor: theme.card.background }}
        >
          <button
            type="button"
            className={`message-page__field ${isNameActive ? "message-page__field--active" : ""}`}
            onClick={() => setActiveField("name")}
          >
            <span
              className="message-page__field-label"
              style={{ color: isNameActive ? theme.primary : theme.text.secondary }}
            >
              이름/닉네임
            </span>
            <span className="message-page__field-input">
              {donorName ? (
                <span
                  className="message-page__field-value"
                  style={{ color: theme.text.primary }}
                >
                  {donorName}
                </span>
              ) : (
                <span className="message-page__field-placeholder">
                  입력해주세요
                </span>
              )}
            </span>
          </button>

          <button
            type="button"
            className={`message-page__field ${isPhoneActive ? "message-page__field--active" : ""}`}
            onClick={() => setActiveField("phone")}
          >
            <span
              className="message-page__field-label"
              style={{ color: isPhoneActive ? theme.primary : theme.text.secondary }}
            >
              전화번호
            </span>
            <span className="message-page__field-input">
              {donorPhone ? (
                <span
                  className="message-page__field-value"
                  style={{ color: theme.text.primary }}
                >
                  {donorPhone}
                </span>
              ) : (
                <span className="message-page__field-placeholder">
                  입력해주세요
                </span>
              )}
            </span>
          </button>
        </div>

        <div
          className="message-page__keyboard-wrap"
          style={{ backgroundColor: theme.background }}
        >
          <VirtualKeyboard
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onSpace={handleSpace}
          />
        </div>
      </main>

      <button
        type="button"
        className="message-page__next-btn"
        onClick={handleNext}
        disabled={!canProceed}
        style={{
          backgroundColor: theme.primary,
          borderColor: theme.primary,
          color: theme.text.onPrimary,
        }}
      >
        다음
      </button>
    </PageBody>
  );
}

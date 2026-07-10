import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { QRCodeSVG } from "qrcode.react";
import { ApiError } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { PageBody } from "../components/layout/PageBody";
import { submitCurrentDonation } from "../utils/buildSubmitPayload";
import { buildMobileCertificateUrl } from "../utils/mobileCertificateUrl";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import heartIllustration from "../assets/donated.png";
import "./DonationCertificatePage.css";

function isAlreadySavedError(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  const message = error.message.toLowerCase();
  return (
    error.status === 409 ||
    error.code === 409 ||
    message.includes("already") ||
    message.includes("duplicate") ||
    message.includes("이미") ||
    message.includes("중복")
  );
}

/** 저장하기 옆 좌향 화살표 (Figma 5706:13081 Frame487) — 테마색 채색 */
function ArrowLeft({ color }: { color: string }) {
  return (
    <svg
      className="cert-arrow"
      viewBox="0 0 75 86"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M67 43H10M10 43L34 18M10 43L34 68"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DonationCertificatePage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const {
    selectedCampaign,
    paymentMethod,
    amount,
    donorName,
    donorPhone,
    capturedPhotoUrl,
    sharePhotoUrl,
    photoStatus,
    submittedRecordId,
    setSubmittedRecordId,
    setCapturedPhotoUrl,
  } = useDonationStore();

  const submitMutation = useMutation({
    mutationFn: () => {
      const state = useDonationStore.getState();
      return submitCurrentDonation(state);
    },
    onSuccess: (record) => {
      setSubmittedRecordId(-1);
      if (record.imageUrl) setCapturedPhotoUrl(record.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
    },
    onError: (error) => {
      if (isAlreadySavedError(error)) {
        setSubmittedRecordId(-1);
        queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
      }
    },
  });

  useEffect(() => {
    if (!selectedCampaign || !paymentMethod || amount <= 0) {
      navigate("/", { replace: true });
    }
  }, [selectedCampaign, paymentMethod, amount, navigate]);

  const [qrOpen, setQrOpen] = useState(false);
  const isSaved = submittedRecordId != null || submitMutation.isSuccess;

  const handleSave = () => {
    if (submitMutation.isPending) return;
    if (isSaved) {
      setQrOpen(true);
      return;
    }
    submitMutation.mutate(undefined, {
      onSuccess: () => setQrOpen(true),
      onError: (error) => {
        if (isAlreadySavedError(error)) setQrOpen(true);
      },
    });
  };

  const handleHistory = () => {
    if (isSaved) {
      navigate("/wall");
      return;
    }
    submitMutation.mutate(undefined, {
      onSuccess: () => navigate("/wall"),
      onError: (error) => {
        if (isAlreadySavedError(error)) navigate("/wall");
      },
    });
  };

  if (!selectedCampaign) return null;

  const displayName = donorName.trim() || "후원자";
  const hasPhoto = Boolean(capturedPhotoUrl);
  const photoSrc = capturedPhotoUrl || heartIllustration;
  // Monitor-2 AI still running: wait before letting the user save the certificate
  // so the generated photo is included instead of the placeholder illustration.
  const photoPending = photoStatus === "generating" && !capturedPhotoUrl;

  const today = new Date();
  const dateLabel = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
  const qrValue = buildMobileCertificateUrl({
    amount,
    date: dateLabel.replace(/\./g, "-"),
    name: displayName,
    phone: donorPhone,
    // Prefer the public share URL for the QR (a phone can't open the data: URL in
    // capturedPhotoUrl); after save, capturedPhotoUrl becomes the backend's public
    // imageUrl, so it's a valid fallback.
    photoUrl: sharePhotoUrl ?? capturedPhotoUrl,
  });

  return (
    <PageBody className="cert-page" scroll={false}>
      <AppHeader />

      <div className="cert-body">
        <p className="cert-caption">
          귀하의 따뜻한 마음과 의미 있는 기여에 깊은 감사를 전합니다
        </p>

        <div
          className={`cert-photo${hasPhoto ? "" : " cert-photo--illust"}${photoPending ? " cert-photo--loading" : ""}`}
        >
          {photoPending ? (
            <div className="cert-photo__pending">
              <span
                className="cert-photo__spinner"
                style={{ borderTopColor: theme.primary }}
                aria-hidden
              />
              <p>AI 이미지 생성 중입니다...</p>
            </div>
          ) : (
            <img src={photoSrc} alt="" loading="lazy" />
          )}
        </div>

        <div className="cert-sign">
          <span className="cert-sign__line" aria-hidden />
          <span className="cert-sign__date">{dateLabel}</span>
          <span className="cert-sign__name">{displayName}</span>
          <span className="cert-sign__line" aria-hidden />
        </div>

        {submitMutation.isError && !isSaved && (
          <p className="cert-error" role="alert">
            기부 내역을 저장하지 못했습니다. 다시 시도해 주세요.
          </p>
        )}

        <div className="cert-actions">
          <div className="cert-qr" aria-label="모바일 증서 QR">
            <QRCodeSVG
              value={qrValue}
              size={143}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="M"
              marginSize={0}
            />
          </div>

          <ArrowLeft color={theme.primary} />

          <button
            type="button"
            className="cert-btn cert-btn--save"
            onClick={handleSave}
            disabled={submitMutation.isPending || photoPending}
            style={{ backgroundColor: theme.primary }}
          >
            {submitMutation.isPending
              ? "저장 중..."
              : photoPending
                ? "생성 중..."
                : "저장하기"}
          </button>

          <button
            type="button"
            className="cert-btn cert-btn--history"
            onClick={handleHistory}
            disabled={submitMutation.isPending || photoPending}
          >
            기부내역보기
          </button>
        </div>
      </div>

      {qrOpen && (
        <div
          className="cert-qr-modal"
          role="dialog"
          aria-modal="true"
          aria-label="모바일 기부증서 QR"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="cert-qr-modal__card"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="cert-qr-modal__close"
              onClick={() => setQrOpen(false)}
              aria-label="닫기"
            >
              ✕
            </button>
            <h3 className="cert-qr-modal__title">모바일 기부증서</h3>
            <p className="cert-qr-modal__desc">
              휴대폰 카메라로 QR 코드를 스캔하면
              <br />
              기부증서를 저장할 수 있습니다
            </p>
            <div className="cert-qr-modal__qr">
              <QRCodeSVG
                value={qrValue}
                size={620}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
                marginSize={0}
              />
            </div>
          </div>
        </div>
      )}

      <AppFooter note />
    </PageBody>
  );
}

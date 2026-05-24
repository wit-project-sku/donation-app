import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { PageBody } from "../components/layout/PageBody";
import { submitCurrentDonation } from "../utils/buildSubmitPayload";
import { useDonationStore } from "../store/donationStore";
import { formatCurrency } from "../utils/format";
import "./DonationCertificatePage.css";

export function DonationCertificatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    selectedCampaign,
    paymentMethod,
    donationType,
    amount,
    message,
    donorName,
    selectedOutfit,
    capturedPhotoUrl,
    submittedRecordId,
    setSubmittedRecordId,
  } = useDonationStore();

  useEffect(() => {
    if (!selectedCampaign || !paymentMethod) {
      navigate("/complete", { replace: true });
    }
  }, [selectedCampaign, paymentMethod, navigate]);

  const submitMutation = useMutation({
    mutationFn: () => {
      const state = useDonationStore.getState();
      return submitCurrentDonation(state);
    },
    onSuccess: (record) => {
      setSubmittedRecordId(record.id);
      queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
      navigate("/wall");
    },
  });

  const handleContinue = () => {
    if (submittedRecordId != null) {
      navigate("/wall");
      return;
    }
    submitMutation.mutate();
  };

  if (!selectedCampaign) return null;

  const displayName = donorName.trim() || "";
  const displayMessage = message.trim() || "";
  const donationLabel =
    donationType === "regular" ? "정기 후원" : "일시 후원";
  const photoSrc =
    capturedPhotoUrl ?? selectedOutfit?.imageUrl ?? null;

  return (
    <PageBody className="cert-page">
      <article className="cert-page__card" aria-label="기부 증서">
        <h1 className="cert-page__title">기부 증서</h1>

        <div className="cert-page__body">
          <div className="cert-page__photo-wrap">
            {photoSrc ? (
              <img
                className="cert-page__photo"
                src={photoSrc}
                alt=""
                loading="lazy"
              />
            ) : (
              <div className="cert-page__photo cert-page__photo--placeholder" />
            )}
          </div>

          <div className="cert-page__fields">
            <div className="cert-page__field">
              <span className="cert-page__field-line" aria-hidden />
              <span
                className={`cert-page__field-value${!displayName ? " cert-page__field-value--placeholder" : ""}`}
              >
                {displayName || "이름"}
              </span>
            </div>
            <div className="cert-page__field">
              <span className="cert-page__field-line" aria-hidden />
              <span
                className={`cert-page__field-value${!displayMessage ? " cert-page__field-value--placeholder" : ""}`}
              >
                {displayMessage || "메세지"}
              </span>
            </div>
          </div>

          {photoSrc && (
            <div className="cert-page__qr" aria-label="QR code">
              <QRCodeSVG
                value={photoSrc}
                size={176}
                bgColor="#fff"
                fgColor="#1a1a1a"
              />
            </div>
          )}
        </div>

        <div className="cert-page__campaign">
          <img
            className="cert-page__campaign-thumb"
            src={selectedCampaign.imageUrl}
            alt=""
            loading="lazy"
          />
          <div className="cert-page__campaign-info">
            <h2 className="cert-page__campaign-title">
              {selectedCampaign.title}
            </h2>
            <p className="cert-page__campaign-desc">
              {selectedCampaign.description}
            </p>
          </div>
          <div className="cert-page__campaign-amount">
            <span className="cert-page__campaign-type">{donationLabel}</span>
            <span className="cert-page__campaign-value">
              {formatCurrency(amount)} 원
            </span>
          </div>
        </div>
      </article>

      {submitMutation.isError && (
        <p className="cert-page__error" role="alert">
          기부 내역을 저장하지 못했습니다. 다시 시도해 주세요.
        </p>
      )}

      <div className="cert-page__actions">
        <button
          type="button"
          className="cert-page__btn cert-page__btn--skip"
          onClick={() => navigate("/wall")}
          disabled={submitMutation.isPending}
        >
          건너뛰기
        </button>
        <button
          type="button"
          className="cert-page__btn cert-page__btn--continue"
          onClick={handleContinue}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? "저장 중..." : "계속"}
        </button>
      </div>
    </PageBody>
  );
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { PageBody } from "../components/layout/PageBody";
import { submitCurrentDonation } from "../utils/buildSubmitPayload";
import { useDonationStore } from "../store/donationStore";
import { formatCurrency } from "../utils/format";
import "./DonationCertificatePage.css";

function buildMobileCertificateUrl(params: {
  amount: number;
  date: string;
  message: string;
  name: string;
  photoUrl: string;
}) {
  const search = new URLSearchParams({
    amount: String(params.amount),
    date: params.date,
    message: params.message,
    name: params.name,
  });

  if (params.photoUrl) {
    search.set("photo", params.photoUrl);
  }

  return `${window.location.origin}/mobile-certificate?${search.toString()}`;
}

export function DonationCertificatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    selectedCampaign,
    paymentMethod,
    amount,
    donorName,
    message,
    selectedOutfit,
    capturedPhotoUrl,
    submittedRecordId,
    setSubmittedRecordId,
  } = useDonationStore();

  const submitMutation = useMutation({
    mutationFn: () => {
      const state = useDonationStore.getState();
      return submitCurrentDonation(state);
    },
    onSuccess: (record) => {
      setSubmittedRecordId(record.id);
      queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
    },
  });

  useEffect(() => {
    if (!selectedCampaign || !paymentMethod || amount <= 0) {
      navigate("/", { replace: true });
    }
  }, [selectedCampaign, paymentMethod, amount, navigate]);

  const handleNext = () => {
    if (submittedRecordId != null || submitMutation.isSuccess) {
      navigate("/wall");
      return;
    }

    submitMutation.mutate(undefined, {
      onSuccess: () => navigate("/wall"),
    });
  };

  if (!selectedCampaign) return null;

  const displayName = donorName.trim() || "후원자";
  const displayMessage =
    message.trim() || "귀하의 따뜻한 마음과 의미 있는 기여에 깊은 감사를 전합니다.";
  const photoSrc = capturedPhotoUrl ?? selectedOutfit?.imageUrl ?? null;
  const mobilePhotoUrl =
    photoSrc && !photoSrc.startsWith("data:") && photoSrc.length <= 1000
      ? photoSrc
      : selectedOutfit?.imageUrl ?? selectedCampaign.imageUrl;

  const today = new Date();
  const dateLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const qrValue = buildMobileCertificateUrl({
    amount,
    date: dateLabel,
    message: displayMessage,
    name: displayName,
    photoUrl: mobilePhotoUrl,
  });

  return (
    <PageBody className="cert-page" scroll={false}>
      <article className="cert-page__card" aria-label="기부 증서">
        <div className="cert-page__card-header">
          <h1 className="cert-page__title">기부증서</h1>
          <div className="cert-page__qr" aria-label="모바일 증서 QR 코드">
            <QRCodeSVG
              value={qrValue}
              size={86}
              bgColor="#fff"
              fgColor="#1a1a1a"
            />
          </div>
        </div>

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
          <span className="cert-page__photo-brand">unicef</span>
        </div>

        <div className="cert-page__info">
          <span className="cert-page__amount">
            {formatCurrency(amount)}원
          </span>
          <span className="cert-page__name">{displayName}</span>
          <p className="cert-page__thanks">{displayMessage}</p>
          <span className="cert-page__date">{dateLabel}</span>
        </div>
      </article>

      {submitMutation.isError && (
        <p className="cert-page__error" role="alert">
          기부 내역을 저장하지 못했습니다. 다시 시도해 주세요.
        </p>
      )}

      <button
        type="button"
        className="cert-page__next"
        onClick={handleNext}
        disabled={submitMutation.isPending}
      >
        {submitMutation.isPending ? "저장 중..." : "다음"}
      </button>
    </PageBody>
  );
}

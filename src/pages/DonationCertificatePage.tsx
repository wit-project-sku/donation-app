import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { QRCodeSVG } from "qrcode.react";
import { ApiError } from "../api/client";
import { PageBody } from "../components/layout/PageBody";
import { submitCurrentDonation } from "../utils/buildSubmitPayload";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { resolveDonationPhotoUrl } from "../utils/defaultDonationImage";
import { formatCurrency } from "../utils/format";
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

function buildMobileCertificateUrl(params: {
  amount: number;
  date: string;
  name: string;
  photoUrl: string;
}) {
  const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, "");
  const basePath =
    publicAppUrl ?? `${window.location.origin}${window.location.pathname}`;
  const search = new URLSearchParams({
    a: String(params.amount),
    d: params.date,
    n: params.name,
  });

  if (params.photoUrl) {
    search.set("p", params.photoUrl);
  }

  return `${basePath}#/mobile-certificate?${search.toString()}`;
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
    message,
    selectedOutfit,
    capturedPhotoUrl,
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
      if (record.imageUrl) {
        setCapturedPhotoUrl(record.imageUrl);
      }
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

  const handleNext = () => {
    if (submittedRecordId != null || submitMutation.isSuccess) {
      navigate("/wall");
      return;
    }

    submitMutation.mutate(undefined, {
      onSuccess: () => navigate("/wall"),
      onError: (error) => {
        if (isAlreadySavedError(error)) {
          navigate("/wall");
        }
      },
    });
  };

  if (!selectedCampaign) return null;

  const displayName = donorName.trim();
  const hasDonorInfo = Boolean(
    displayName || donorPhone.trim() || message.trim(),
  );
  const photoSrc = hasDonorInfo
    ? resolveDonationPhotoUrl(
        capturedPhotoUrl ?? selectedOutfit?.imageUrl,
        selectedCampaign.imageUrl,
      )
    : capturedPhotoUrl ?? selectedOutfit?.imageUrl ?? null;
  const canSharePhotoUrl =
    photoSrc &&
    !photoSrc.startsWith("data:") &&
    !photoSrc.startsWith("blob:") &&
    photoSrc.length <= 1000;
  const mobilePhotoUrl = canSharePhotoUrl
    ? photoSrc!
    : resolveDonationPhotoUrl(
        selectedOutfit?.imageUrl,
        selectedCampaign.imageUrl,
      );

  const today = new Date();
  const dateLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const qrValue = buildMobileCertificateUrl({
    amount,
    date: dateLabel,
    name: displayName,
    photoUrl: mobilePhotoUrl,
  });

  return (
    <PageBody
      className="cert-page"
      scroll={false}
      style={{
        backgroundColor: theme.background,
        ["--cert-primary" as string]: theme.primary,
        ["--cert-secondary" as string]: theme.secondary,
        ["--cert-on-primary" as string]: theme.text.onPrimary,
        ["--cert-text-primary" as string]: theme.text.primary,
        ["--cert-text-secondary" as string]: theme.text.secondary,
        ["--cert-card-bg" as string]: theme.card.background,
        ["--cert-page-bg" as string]: theme.background,
        ["--cert-photo-bg" as string]: theme.background,
        ["--cert-soft-border" as string]: `color-mix(in srgb, ${theme.secondary} 55%, ${theme.card.background})`,
        ["--cert-accent-border" as string]: `color-mix(in srgb, ${theme.primary} 65%, ${theme.card.background})`,
      }}
    >
      <article className="cert-page__card" aria-label="기부 증서">
        <div className="cert-page__notches" aria-hidden>
          <span className="cert-page__notch cert-page__notch--tl" />
          <span className="cert-page__notch cert-page__notch--tr" />
          <span className="cert-page__notch cert-page__notch--bl" />
          <span className="cert-page__notch cert-page__notch--br" />
        </div>

        <div className="cert-page__card-header">
          <h1 className="cert-page__title">기부증서</h1>
          <div className="cert-page__qr" aria-label="모바일 증서 QR 코드">
            <QRCodeSVG
              value={qrValue}
              size={168}
              bgColor={theme.card.background}
              fgColor={theme.text.primary}
              level="L"
              marginSize={1}
            />
          </div>
        </div>

        <div className="cert-page__photo-wrap">
          <img
            className="cert-page__photo"
            src={photoSrc ?? resolveDonationPhotoUrl(null, selectedCampaign.imageUrl)}
            alt=""
            loading="lazy"
          />
        </div>

        <div className="cert-page__info">
          <span className="cert-page__amount">
            {formatCurrency(amount)}원
          </span>
          {displayName ? (
            <span className="cert-page__name">{displayName}</span>
          ) : null}
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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { QRCodeSVG } from "qrcode.react";
import { ApiError } from "../api/client";
import { CertificateFrameBorder } from "../components/CertificateFrameBorder";
import { IconHeart } from "../components/Icon";
import { PageBody } from "../components/layout/PageBody";
import { submitCurrentDonation } from "../utils/buildSubmitPayload";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { resolveCertificatePhotoUrl } from "../utils/defaultDonationImage";
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

const QR_PHOTO_URL_MAX_LENGTH = 120;

function buildMobileCertificateUrl(params: {
  amount: number;
  date: string;
  name: string;
  photoUrl?: string | null;
}) {
  const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, "");
  const basePath =
    publicAppUrl ?? `${window.location.origin}${window.location.pathname}`;
  const search = new URLSearchParams({
    a: String(params.amount),
    d: params.date,
    n: params.name,
  });

  const photoUrl = params.photoUrl?.trim();
  if (
    photoUrl &&
    !photoUrl.startsWith("data:") &&
    !photoUrl.startsWith("blob:") &&
    photoUrl.length <= QR_PHOTO_URL_MAX_LENGTH
  ) {
    search.set("p", photoUrl);
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

  const campaignSubtitle = useMemo(() => {
    if (!selectedCampaign) return "· 소중한 나눔 ·";
    const label = selectedCampaign.title.trim() || "소중한 나눔";
    return `· ${label} ·`;
  }, [selectedCampaign]);

  if (!selectedCampaign) return null;

  const displayName = donorName.trim() || "후원자";
  const photoSrc = resolveCertificatePhotoUrl(capturedPhotoUrl);

  const today = new Date();
  const dateLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const qrDateLabel = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const qrValue = buildMobileCertificateUrl({
    amount,
    date: qrDateLabel,
    name: displayName,
    photoUrl: capturedPhotoUrl,
  });

  return (
    <PageBody className="cert-page" scroll>
      <p className="cert-page__thanks">
        감사합니다, <span className="cert-page__thanks-name">{displayName}</span>
        님
      </p>

      <div className="cert-page__frame">
        <article className="cert-page__card" aria-label="기부 증서">
          <header className="cert-page__card-header">
            <div className="cert-page__title-wrap">
              <h1 className="cert-page__title">기부증서</h1>
              <p className="cert-page__subtitle">{campaignSubtitle}</p>
            </div>
            <div className="cert-page__qr" aria-label="모바일 증서 QR 코드">
              <QRCodeSVG
                className="cert-page__qr-code"
                value={qrValue}
                size={99}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
                marginSize={2}
              />
            </div>
          </header>

          <div className="cert-page__photo-wrap">
            <img
              className={`cert-page__photo${capturedPhotoUrl ? "" : " cert-page__photo--default"}`}
              src={photoSrc}
              alt=""
              loading="lazy"
            />
          </div>

          <footer className="cert-page__info">
            <div className="cert-page__amount-row">
              <IconHeart className="cert-page__heart" aria-hidden />
              <span className="cert-page__amount">
                {formatCurrency(amount)}원
              </span>
            </div>

            <span className="cert-page__name">{displayName}</span>

            <div className="cert-page__divider" aria-hidden />

            <p className="cert-page__message">
              귀하의 따뜻한 마음과 의미 있는 기여에
              <br />
              깊은 감사를 전합니다
            </p>

            <span className="cert-page__date">{dateLabel}</span>
          </footer>
        </article>

        <CertificateFrameBorder className="cert-page__frame-border" />
      </div>

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
        style={{ backgroundColor: theme.primary }}
      >
        {submitMutation.isPending ? "저장 중..." : "다음"}
      </button>
    </PageBody>
  );
}

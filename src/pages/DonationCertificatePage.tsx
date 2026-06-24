import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { QRCodeSVG } from "qrcode.react";
import { ApiError } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { PageBody } from "../components/layout/PageBody";
import { submitCurrentDonation } from "../utils/buildSubmitPayload";
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

const QR_PHOTO_URL_MAX_LENGTH = 120;

function buildMobileCertificateUrl(params: {
  amount: number;
  date: string;
  name: string;
  phone?: string;
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

  const phoneDigits = params.phone?.replace(/\D/g, "") ?? "";
  if (phoneDigits) search.set("ph", phoneDigits);

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
  const { theme, category, organizer } = useTheme();
  const queryClient = useQueryClient();
  const {
    selectedCampaign,
    paymentMethod,
    amount,
    donorName,
    donorPhone,
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

  const handleNext = () => {
    if (submittedRecordId != null || submitMutation.isSuccess) {
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

  const campaignSubtitle = useMemo(() => {
    const fallback = category === "school" ? "아이들의 배움" : "소중한 나눔";
    const label = selectedCampaign?.title.trim() || fallback;
    return `- ${label} -`;
  }, [selectedCampaign, category]);

  if (!selectedCampaign) return null;

  const displayName = donorName.trim() || "후원자";
  const hasPhoto = Boolean(capturedPhotoUrl);
  const photoSrc = capturedPhotoUrl || heartIllustration;

  const today = new Date();
  const dateLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const qrDateLabel = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const qrValue = buildMobileCertificateUrl({
    amount,
    date: qrDateLabel,
    name: displayName,
    phone: donorPhone,
    photoUrl: capturedPhotoUrl,
  });

  return (
    <PageBody className="cert-page">
      <AppHeader />

      <div className="cert-body">
        <article className="cert-card">
          <div className="cert-card__head">
            <h2 className="cert-card__title">· 기부증서 ·</h2>
            <p className="cert-card__subtitle">{campaignSubtitle}</p>
          </div>

          <div
            className={`cert-card__photo${hasPhoto ? "" : " cert-card__photo--illust"}`}
          >
            <img src={photoSrc} alt="" loading="lazy" />
          </div>

          <div className="cert-card__sign">
            <span className="cert-card__name">{displayName}</span>
            <span className="cert-card__line" aria-hidden />
            <div className="cert-card__sign-row">
              <img
                className="cert-card__partner"
                src={organizer.logo}
                alt={organizer.label}
              />
              <div className="cert-card__qr" aria-label="모바일 증서 QR">
                <QRCodeSVG
                  value={qrValue}
                  size={140}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="M"
                  marginSize={1}
                />
              </div>
            </div>
          </div>

          <div className="cert-card__foot">
            <p className="cert-card__caption">
              귀하의 따뜻한 마음과 의미 있는 기여에
              <br />
              깊은 감사를 전합니다
            </p>
            <span className="cert-card__date">{dateLabel}</span>
          </div>
        </article>

        {submitMutation.isError && (
          <p className="cert-error" role="alert">
            기부 내역을 저장하지 못했습니다. 다시 시도해 주세요.
          </p>
        )}

        <button
          type="button"
          className="cert-cta"
          onClick={handleNext}
          disabled={submitMutation.isPending}
          style={{ backgroundColor: theme.primary }}
        >
          {submitMutation.isPending ? "저장 중..." : "기부내역 보기"}
        </button>
      </div>

      <AppFooter note />
    </PageBody>
  );
}

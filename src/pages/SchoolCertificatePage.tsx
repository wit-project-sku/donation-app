import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ApiError } from "../api/client";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { buildMobileCertificateUrl } from "../utils/mobileCertificateUrl";
import { submitCurrentDonation } from "../utils/buildSubmitPayload";
import certSample from "../assets/cert-sample.jpg";
import schoolEmblem from "../assets/school-emblem.png";
import "./SchoolCertificatePage.css";

/** YYYY.MM.DD */
function formatDot(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

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

/**
 * 학교 기부증서/기부한컷 결과 화면 (Figma 5659:96278).
 * 합성 사진 + 졸업연도/이름/날짜 + QR + 저장하기 / 기부내역보기.
 */
export function SchoolCertificatePage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const {
    selectedCampaign,
    amount,
    donorName,
    donorPhone,
    graduationYear,
    capturedPhotoUrl,
    photoStatus,
    submittedRecordId,
    setSubmittedRecordId,
    setCapturedPhotoUrl,
  } = useDonationStore();
  const [qrOpen, setQrOpen] = useState(false);

  const submitMutation = useMutation({
    mutationFn: () => {
      const state = useDonationStore.getState();
      return submitCurrentDonation(state);
    },
    onSuccess: (record) => {
      setSubmittedRecordId(-1);
      if (record.imageUrl) setCapturedPhotoUrl(record.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["schoolWallEntries"] });
    },
    onError: (error) => {
      if (isAlreadySavedError(error)) {
        setSubmittedRecordId(-1);
        queryClient.invalidateQueries({ queryKey: ["schoolWallEntries"] });
      }
    },
  });

  useEffect(() => {
    if (!selectedCampaign) navigate("/", { replace: true });
  }, [selectedCampaign, navigate]);

  if (!selectedCampaign) return null;

  const photo = capturedPhotoUrl || certSample;
  const gradText = graduationYear ? `${graduationYear} 졸업` : "졸업";
  const displayName = donorName || "기부자";
  const isSaved = submittedRecordId != null || submitMutation.isSuccess;
  const photoPending = photoStatus === "generating" && !capturedPhotoUrl;

  const handleSave = () => {
    if (submitMutation.isPending || photoPending) return;
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
      navigate("/school-wall");
      return;
    }
    submitMutation.mutate(undefined, {
      onSuccess: () => navigate("/school-wall"),
      onError: (error) => {
        if (isAlreadySavedError(error)) navigate("/school-wall");
      },
    });
  };

  // 합성 사진 + 기부 정보를 담은 모바일 증서 링크 → QR 로 발급 (기존 로직 재사용)
  const qrValue = buildMobileCertificateUrl({
    amount,
    date: formatDot(new Date()).replace(/\./g, "-"),
    name: displayName,
    phone: donorPhone,
    photoUrl: capturedPhotoUrl,
  });

  return (
    <PageBody className="school-certificate" scroll={false}>
      <AppHeader title="기부" backTo="/school-complete" />

      <div className="sc2-body">
        <p className="sc2-thanks">
          귀하의 따뜻한 마음과 의미 있는 기여에 깊은 감사를 전합니다
        </p>

        {/* 합성 사진 카드 — Figma 5535:19844 border5 #999, radius 38 */}
        <div className="sc2-photo">
          <img className="sc2-photo__img" src={photo} alt="기부한컷" />
          <img className="sc2-photo__emblem" src={schoolEmblem} alt="" />
          <span className="sc2-photo__grad">{gradText}</span>
        </div>

        {/* 날짜 · 이름 — Figma 5535:19843/19845 */}
        <div className="sc2-meta">
          <span className="sc2-meta__line" />
          <span className="sc2-meta__date">{formatDot(new Date())}</span>
          <span className="sc2-meta__name">{displayName}</span>
          <span className="sc2-meta__line" />
        </div>

        {/* QR + 액션 — Figma 5659:95750 */}
        <div className="sc2-actions">
          <button
            type="button"
            className="sc2-qr"
            style={{ borderColor: theme.primary }}
            onClick={() => setQrOpen(true)}
            aria-label="QR 크게 보기"
          >
            <QRCodeSVG
              value={qrValue}
              size={160}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="M"
              marginSize={0}
            />
          </button>
          <span className="sc2-arrow" style={{ color: theme.primary }} aria-hidden>
            ←
          </span>
          <button
            type="button"
            className="sc2-action sc2-action--save"
            style={{ backgroundColor: theme.primary }}
            onClick={handleSave}
            disabled={submitMutation.isPending || photoPending}
          >
            {submitMutation.isPending ? "저장 중..." : photoPending ? "생성 중..." : "저장하기"}
          </button>
          <button
            type="button"
            className="sc2-action sc2-action--history"
            onClick={handleHistory}
            disabled={submitMutation.isPending || photoPending}
          >
            기부내역보기
          </button>
        </div>
      </div>

      <AppFooter note />

      {/* QR 크게 보기 팝업 — 휴대폰으로 스캔해 사진 저장 */}
      {qrOpen && (
        <button
          type="button"
          className="sc2-qr-dim"
          aria-label="닫기"
          onClick={() => setQrOpen(false)}
        >
          <div className="sc2-qr-modal" onClick={(e) => e.stopPropagation()}>
            <p className="sc2-qr-modal__title">휴대폰으로 저장하기</p>
            <p className="sc2-qr-modal__desc">
              QR 코드를 스캔하면 기부한컷을 저장할 수 있습니다
            </p>
            <div className="sc2-qr-modal__code">
              <QRCodeSVG
                value={qrValue}
                size={760}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
                marginSize={0}
              />
            </div>
            <span
              className="sc2-qr-modal__close"
              style={{ backgroundColor: theme.primary }}
            >
              닫기
            </span>
          </div>
        </button>
      )}
    </PageBody>
  );
}

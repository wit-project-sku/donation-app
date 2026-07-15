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
    sharePhotoUrl,
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

  const hasPhoto = Boolean(capturedPhotoUrl);
  // 사진이 없으면 기본 이미지를 채우지 않는다 — 어두운 배경 + 학교 엠블럼만 노출.
  const schoolLogo = schoolEmblem;
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
    // Public share URL for the QR (the phone can't open the data: URL); after
    // save, capturedPhotoUrl becomes the backend's public imageUrl fallback.
    photoUrl: sharePhotoUrl ?? capturedPhotoUrl,
  });

  return (
    <PageBody className="school-certificate" scroll={false}>
      {/* 뒤로 버튼은 다른 화면처럼 보이되 클릭 불가(완료 화면).
          감사문은 Figma 5843:87975 기준 헤더 ★서브타이틀(#909090) 자리다. */}
      <AppHeader
        title="기부"
        backStatic
        subtitle="귀하의 따뜻한 마음에 깊은 감사를 전합니다"
      />

      <div className="sc2-body">

        {/* 합성 사진 카드 — Figma 5843:87972: 1074.5×1910.25, radius 38.
            사진 있음 → 사진으로 채움 / 없음 → 어두운 배경 + 학교 엠블럼 크게 중앙
            (Figma 5843:88007, 469×460). 하단 오버레이는 두 경우 모두 노출한다. */}
        <div className={`sc2-photo${hasPhoto ? "" : " sc2-photo--empty"}`}>
          {hasPhoto ? (
            <img
              className="sc2-photo__img"
              src={capturedPhotoUrl ?? ""}
              alt="기부한컷"
            />
          ) : (
            schoolLogo && (
              <img className="sc2-photo__emblem" src={schoolLogo} alt="" />
            )
          )}
          {/* 하단 오버레이 — Figma 5843:87973: rgba(0,0,0,.5) h161 */}
          <div className="sc2-photo__overlay">
            {/* Figma 5843:88006 "원화여고 25회 졸업" — 학교명 + 졸업연도.
                (Figma 의 "N회"(기수)는 수집 데이터에 없어 졸업연도로 표기) */}
            <span className="sc2-photo__caption">
              {selectedCampaign.title}
              {graduationYear ? ` ${graduationYear}년 졸업` : ""}
            </span>
          </div>
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

      {/* QR 크게 보기 팝업 — 흰 카드에 QR 만(문구 없음), 닫기는 카드 오른쪽 위 바깥 */}
      {qrOpen && (
        <div
          className="sc2-qr-dim"
          role="presentation"
          onClick={() => setQrOpen(false)}
        >
          <div className="sc2-qr-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sc2-qr-modal">
              <QRCodeSVG
                value={qrValue}
                size={620}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
                marginSize={0}
              />
            </div>
            <button
              type="button"
              className="sc2-qr-modal__close"
              style={{ backgroundColor: theme.primary }}
              aria-label="닫기"
              onClick={() => setQrOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </PageBody>
  );
}

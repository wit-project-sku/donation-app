import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { FooterBanner } from "../components/FooterBanner";
import { IconHeart, IconCheck } from "../components/Icon";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { finishDonationFlow } from "../config/navigation";
import { getKioskBridge } from "../utils/kioskBridge";
import { formatCurrency } from "../utils/format";
import { buildKioskPhotoSaveUrl } from "../utils/kioskPhotoSaveUrl";
import { getCampaignProgressPercent } from "../utils/campaignProgress";
import "./SchoolCompletePage.css";

/**
 * 학교 결제 완료 화면 (Figma 5591:41267).
 * 결제 성공 후 진입 — 결제 완료 안내 + 기부 금액 + 기부증서 발급 / 종료 선택.
 */
export function SchoolCompletePage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const {
    selectedCampaign,
    amount,
    resetSession,
    sharePhotoUrl,
    photoStatus,
  } = useDonationStore();
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!selectedCampaign || amount <= 0) {
      navigate("/", { replace: true });
    }
  }, [selectedCampaign, amount, navigate]);

  // 결제 완료 — 촬영 때 잠가 둔 AI 결과의 블러를 지금 푼다.
  // (학교 흐름은 결제 전에 촬영한다. 결제 전까지 Monitor 2 는 결과를 블러 + 안내
  //  문구로만 보여 주고, 결제까지 오지 않으면 끝내 선명해지지 않는다.)
  useEffect(() => {
    if (!selectedCampaign || amount <= 0) return;
    getKioskBridge()?.revealPhoto?.();
  }, [selectedCampaign, amount]);

  if (!selectedCampaign || amount <= 0) return null;

  // 이 화면의 QR 은 "AI 사진 받기" 전용 — 키오스크 저장 페이지로 보낸다.
  // (증서 QR 이 아니다: 이름은 다음 단계(/school-register)에서 받으므로 아직 비어 있고,
  //  증서는 저장까지 마친 /school-certificate 가 담당한다.)
  // 키오스크가 보내 준 공개 링크(shareUrl)가 있어야만 만들 수 있다 —
  // capturedPhotoUrl 은 data: 바이트라 휴대폰이 열 수 없다.
  const qrValue = buildKioskPhotoSaveUrl(sharePhotoUrl);
  const photoLinkReady = qrValue !== null;
  const photoGenerating = photoStatus === "generating" && !photoLinkReady;

  return (
    <PageBody className="school-complete" scroll={false}>
      <AppHeader
        title="기부"
        subtitle="당신의 마음이 필요한 곳에 전해집니다"
        showBack
        onBack={() => finishDonationFlow(navigate, resetSession)}
      />

      <div className="sc-body">
        {/* 학교 배지 */}
        <div className="sc-badge" style={{ backgroundColor: theme.primary }}>
          <IconHeart size={68} aria-hidden />
          <span className="sc-badge__name">{selectedCampaign.title}</span>
        </div>

        {/* 결제 완료 — Figma 5591:41654 초록 체크 원 */}
        <div className="sc-check" style={{ backgroundColor: theme.primary }}>
          <IconCheck size={150} strokeWidth={2.5} aria-hidden />
        </div>
        {/* Figma 5591:41646 — "당신의 마음이 필요한 곳에 전해집니다" 는 헤더
            서브타이틀(★ #8b7355)에만 있고 본문에는 반복하지 않는다. */}
        <p className="sc-title">결제 완료</p>

        {/* 기부 금액 — Figma 5591:41649 (1299×445, padding 40.56 / gap 20.28) */}
        <div className="sc-amount">
          <p className="sc-amount__label">기부 금액</p>
          <div className="sc-amount__gap" aria-hidden />
          <p className="sc-amount__value">{formatCurrency(amount)}원</p>
        </div>

        {/* QR + 액션 — Figma 5827:169786 (QR 214.5 ← 화살표 · 저장하기 #999 · 기부한컷 발급 초록) */}
        <div className="sc-actions">
          <button
            type="button"
            className="sc-qr"
            style={{ borderColor: theme.primary }}
            onClick={() => setQrOpen(true)}
            disabled={!photoLinkReady}
            aria-label="QR 크게 보기"
          >
            <QRCodeSVG
              value={qrValue ?? ""}
              size={160}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="M"
              marginSize={0}
            />
          </button>
          <span className="sc-arrow" style={{ color: theme.primary }} aria-hidden>
            ←
          </span>
          {/* 사진 공개 링크(키오스크 shareUrl)가 있어야 QR 로 받아 갈 수 있다.
              아직 생성 중이면 안내만 하고, 링크 없이 빈 증서로 가는 QR 은 막는다. */}
          <button
            type="button"
            className="sc-action sc-action--save"
            onClick={() => setQrOpen(true)}
            disabled={!photoLinkReady}
          >
            {photoGenerating ? "생성 중..." : "저장하기"}
          </button>
          <button
            type="button"
            className="sc-action sc-action--issue"
            style={{ backgroundColor: theme.primary }}
            onClick={() => navigate("/school-register")}
          >
            기부한컷 발급
          </button>
        </div>

        {/* 모금 현황 */}
        <div className="sc-funding">
          <p className="sc-funding__label" style={{ color: theme.primary }}>
            모금 현황
          </p>
          <div className="sc-funding__bar">
            <div
              className="sc-funding__fill"
              style={{
                width: `${getCampaignProgressPercent(selectedCampaign.accumulatedAmount, selectedCampaign.targetAmount)}%`,
                backgroundColor: theme.primary,
              }}
            />
          </div>
          <p className="sc-funding__amount" style={{ color: theme.primary }}>
            {formatCurrency(selectedCampaign.accumulatedAmount)} /{" "}
            {formatCurrency(selectedCampaign.targetAmount)}원
          </p>
        </div>

        {/* 참여자·수혜자 — 모금 현황 카드 바로 아래 (Regular 70 #636363, 중앙) */}
        <p className="sc-stats">
          기부 참여자 : {selectedCampaign.participantCount ?? 0}명 / 기부 수혜자
          : {selectedCampaign.studentCount ?? 0}명
        </p>
      </div>

      <FooterBanner />

      {/* QR 확대 — Figma 5843:87936: 딤(20% 검정) + 흰 카드에 QR 만. 문구 없음.
          닫기는 카드 우상단 모서리에 걸친 테마색 원형 ✕. */}
      {qrOpen && (
        <div
          className="sc-qr-dim"
          role="presentation"
          onClick={() => setQrOpen(false)}
        >
          <div className="sc-qr-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sc-qr-modal">
              <QRCodeSVG
                value={qrValue ?? ""}
                size={500}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
                marginSize={0}
              />
            </div>
            {/* 닫기는 QR 카드 바깥 오른쪽 위 — QR 을 가리지 않도록 */}
            <button
              type="button"
              className="sc-qr-modal__close"
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

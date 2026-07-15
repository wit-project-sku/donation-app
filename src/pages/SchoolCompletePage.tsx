import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { IconHeart, IconCheck } from "../components/Icon";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { finishDonationFlow } from "../config/navigation";
import { formatCurrency } from "../utils/format";
import { buildMobileCertificateUrl } from "../utils/mobileCertificateUrl";
import { getCampaignProgressPercent } from "../utils/campaignProgress";
import "./SchoolCompletePage.css";

/**
 * 학교 결제 완료 화면 (Figma 5591:41267).
 * 결제 성공 후 진입 — 결제 완료 안내 + 기부 금액 + 기부증서 발급 / 종료 선택.
 */
/** QR 링크용 날짜 (YYYY-MM-DD, 로컬 기준) */
function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function SchoolCompletePage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const {
    selectedCampaign,
    amount,
    resetSession,
    donorName,
    donorPhone,
    sharePhotoUrl,
    capturedPhotoUrl,
  } = useDonationStore();
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!selectedCampaign || amount <= 0) {
      navigate("/", { replace: true });
    }
  }, [selectedCampaign, amount, navigate]);

  if (!selectedCampaign || amount <= 0) return null;

  // 모바일 증서 링크 — 이름/사진은 이후 단계에서 채워지므로 있는 값만 담는다.
  const qrValue = buildMobileCertificateUrl({
    amount,
    date: isoDate(new Date()),
    name: donorName,
    phone: donorPhone,
    photoUrl: sharePhotoUrl ?? capturedPhotoUrl,
  });

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
          <span className="sc-arrow" style={{ color: theme.primary }} aria-hidden>
            ←
          </span>
          <button
            type="button"
            className="sc-action sc-action--save"
            onClick={() => setQrOpen(true)}
          >
            저장하기
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

      <AppFooter />

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
                value={qrValue}
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

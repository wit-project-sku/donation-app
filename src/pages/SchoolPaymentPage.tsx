import { useEffect, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { IconHeart } from "../components/Icon";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { formatCurrency } from "../utils/format";
import cardImg from "../assets/card-credit.png";
import cardReader from "../assets/school-card-reader.jpg";
import "./SchoolPaymentPage.css";

const FUNDING_PERCENT = 90;
/** 카드 인식 대기(모의) 시간 — 이후 결제 완료로 이동 */
const PROCESSING_MS = 3500;
const COUNTDOWN_START = 30;

/**
 * 학교 결제 화면 (Figma 5535:18132).
 * 기부금 선택 후 진입 — 학교 배지 + 기부 금액 + 카드 결제수단 + 결제하기.
 * 결제하기 시 결제수단(카드) 확정 후 기부증서로 이동한다.
 */
export function SchoolPaymentPage() {
  const navigate = useAppNavigate();
  const { theme, organizer } = useTheme();
  const { selectedCampaign, amount, setPaymentMethod } = useDonationStore();
  const [processing, setProcessing] = useState(false);
  const [seconds, setSeconds] = useState(COUNTDOWN_START);

  useEffect(() => {
    if (!selectedCampaign || amount <= 0) {
      navigate("/school-amount", { replace: true });
    }
  }, [selectedCampaign, amount, navigate]);

  // 결제 진행 모달 — 카운트다운 + 모의 카드 인식 후 결제 완료로 이동
  useEffect(() => {
    if (!processing) return;
    setSeconds(COUNTDOWN_START);
    const tick = setInterval(
      () => setSeconds((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    const done = setTimeout(() => navigate("/school-complete"), PROCESSING_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [processing, navigate]);

  if (!selectedCampaign || amount <= 0) return null;

  const pay = () => {
    setPaymentMethod("card");
    setProcessing(true);
  };

  return (
    <PageBody className="school-payment" scroll={false}>
      <AppHeader title="기부" backTo="/school-amount" />

      <div className="sp-body">
        {/* 학교 배지 — Figma 5535:18139 */}
        <div className="sp-badge" style={{ backgroundColor: theme.primary }}>
          <IconHeart size={68} aria-hidden />
          <span className="sp-badge__name">{selectedCampaign.title}</span>
        </div>

        {/* 기부 금액 — Figma 5591:41248 (1299×445, padding 40.56 / gap 20.28) */}
        <div className="sp-amount">
          <p className="sp-amount__label">기부 금액</p>
          <div className="sp-amount__gap" aria-hidden />
          <p className="sp-amount__value">{formatCurrency(amount)}원</p>
        </div>

        {/* 결제수단 — Figma 5591:41242/41243 카드(신용/체크) 선택 */}
        <p className="sp-method-label">카드</p>
        <div className="sp-methods">
          <button
            type="button"
            className="sp-method is-selected"
            style={{ borderColor: theme.primary }}
          >
            <img className="sp-method__img" src={cardImg} alt="" />
            <span className="sp-method__name" style={{ color: theme.primary }}>
              신용/체크카드
            </span>
          </button>
        </div>

        {/* 결제하기 — Figma 5591:41244 초록 버튼 */}
        <button
          type="button"
          className="sp-pay"
          style={{ backgroundColor: theme.primary }}
          onClick={pay}
        >
          결제하기
        </button>

        {/* 캠페인 안내 — Figma 5591:41264 */}
        <p className="sp-partner">이 캠페인은 {organizer.label}와 함께합니다.</p>

        {/* 모금 현황 — Figma 5591:41256 */}
        <div className="sp-funding">
          <p className="sp-funding__label" style={{ color: theme.primary }}>
            모금 현황
          </p>
          <div className="sp-funding__bar">
            <div
              className="sp-funding__fill"
              style={{
                width: `${FUNDING_PERCENT}%`,
                backgroundColor: theme.primary,
              }}
            />
          </div>
          <p className="sp-funding__amount" style={{ color: theme.primary }}>
            {formatCurrency(selectedCampaign.accumulatedAmount)} /{" "}
            {formatCurrency(selectedCampaign.targetAmount)}원
          </p>
        </div>
      </div>

      <AppFooter />

      {/* 결제 진행 모달 — Figma 5535:18230 카드 투입 안내 */}
      {processing && (
        <div className="sp-modal-dim" role="dialog" aria-modal="true">
          <div className="sp-modal">
            <span
              className="sp-modal__timer"
              style={{ backgroundColor: theme.primary }}
            >
              {seconds}초
            </span>
            <p className="sp-modal__title">카드를 넣어주세요</p>
            <p className="sp-modal__desc">
              기기 하단에 있는 리더기에 카드를 넣어주세요
            </p>
            <div className="sp-modal__amount">
              <p className="sp-modal__amount-label">기부 금액</p>
              <p className="sp-modal__amount-value">
                {formatCurrency(amount)}원
              </p>
            </div>
            <img className="sp-modal__reader" src={cardReader} alt="" />
            <div className="sp-modal__bar">
              <div
                className="sp-modal__fill"
                style={{ backgroundColor: theme.primary }}
              />
            </div>
            <button
              type="button"
              className="sp-modal__cancel"
              onClick={() => setProcessing(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </PageBody>
  );
}

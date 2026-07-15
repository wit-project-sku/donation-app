import { useEffect, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { IconHeart } from "../components/Icon";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { formatCurrency } from "../utils/format";
import { getCampaignProgressPercent } from "../utils/campaignProgress";
import "./SchoolAmountPage.css";

/** Figma 5591:41169~41172 기부금 프리셋 */
const PRESETS = [1000, 2000, 10000, 20000];

/**
 * 학교 기부금 선택 화면 (Figma 5535:18164 · 5591:41182).
 * 촬영 후(AI 생성 대기 중) 진입 — 학교 배지 + 기부금 프리셋 4종 + 기부하기 버튼
 * + 캠페인/모금 현황. 프리셋 선택 시 카드 테두리·기부하기 버튼이 테마 초록으로 활성화된다.
 */
export function SchoolAmountPage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const { selectedCampaign, setAmount } = useDonationStore();
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedCampaign) navigate("/", { replace: true });
  }, [selectedCampaign, navigate]);

  if (!selectedCampaign) return null;

  const donate = () => {
    if (selected == null) return;
    setAmount(selected);
    navigate("/school-payment");
  };

  return (
    <PageBody className="school-amount" scroll={false}>
      <AppHeader title="기부" subtitle="기부금을 선택해주세요" backTo="/outfit" />

      <div className="sa-body">
        {/* 학교 배지 — Figma 5535:18168 초록 pill + 하트 + 학교명 */}
        <div className="sa-badge" style={{ backgroundColor: theme.primary }}>
          <IconHeart size={68} aria-hidden />
          <span className="sa-badge__name">{selectedCampaign.title}</span>
        </div>

        {/* Figma 5591:41164 */}
        <p className="sa-label">기부금을 선택해 주세요</p>

        {/* 기부금 프리셋 — Figma 5591:41165~41172 (2×2) */}
        <div className="sa-amounts">
          {PRESETS.map((amount) => {
            const isSelected = selected === amount;
            return (
              <button
                key={amount}
                type="button"
                className={`sa-amount${isSelected ? " is-selected" : ""}`}
                style={isSelected ? { borderColor: theme.primary } : undefined}
                onClick={() => setSelected(amount)}
              >
                +{amount.toLocaleString()}원
              </button>
            );
          })}
        </div>

        {/* 기부하기 — 미선택 회색 / 선택 시 테마 초록 (Figma 5591:41162 → 41184) */}
        <button
          type="button"
          className="sa-donate"
          style={selected != null ? { backgroundColor: theme.primary } : undefined}
          onClick={donate}
          disabled={selected == null}
        >
          기부하기
        </button>

        {/* 모금 현황 — Figma 5591:41174~41180 */}
        <div className="sa-funding">
          <p className="sa-funding__label" style={{ color: theme.primary }}>
            모금 현황
          </p>
          <div className="sa-funding__bar">
            <div
              className="sa-funding__fill"
              style={{
                width: `${getCampaignProgressPercent(selectedCampaign.accumulatedAmount, selectedCampaign.targetAmount)}%`,
                backgroundColor: theme.primary,
              }}
            />
          </div>
          <p className="sa-funding__amount" style={{ color: theme.primary }}>
            {formatCurrency(selectedCampaign.accumulatedAmount)} /{" "}
            {formatCurrency(selectedCampaign.targetAmount)}원
          </p>
        </div>

        {/* 참여자·수혜자 — 모금 현황 카드 바로 아래 (Regular 70 #636363, 중앙) */}
        <p className="sa-stats">
          기부 참여자 : {selectedCampaign.participantCount ?? 0}명 / 기부 수혜자
          : {selectedCampaign.studentCount ?? 0}명
        </p>
      </div>

      <AppFooter />
    </PageBody>
  );
}

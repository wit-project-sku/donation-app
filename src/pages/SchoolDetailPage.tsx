import { useEffect, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { FooterBanner } from "../components/FooterBanner";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { formatCurrency } from "../utils/format";
import { getCampaignProgressPercent } from "../utils/campaignProgress";
import { fetchSchoolById, fetchSchoolsPage } from "../api/schools";
import { buildSchoolCampaignFromDto } from "../data/schoolCampaign";
import "./SchoolDetailPage.css";

/** 선택한 사용처에 따라 바뀌는 CTA 부제.
 *  Figma 5776:26007 "기부하기 - 후배들에게 교복을 사줍시다" — 마침표 없음. */
const PROGRAM_SUBTITLES: Record<string, string> = {
  "우수학생 장학금": "후배들의 배움을 응원합시다",
  "학교 시설 개선": "더 나은 배움터를 만듭시다",
  "교복 지원": "후배들에게 교복을 사줍시다",
};

/**
 * 학교 상세 화면 (Figma 5591:40524).
 * 학교 목록에서 학교를 고르면 진입한다. 히어로 + 초록 CTA 배너, 사용처 3종 카드
 * (선택 시 연초록), 소개문, 모금 현황(진행바/금액), 참여자·수혜자 지표로 구성된다.
 * 상단 크롬(AppHeader)·하단 배너(FooterBanner)는 공통 컴포넌트 재사용.
 */
export function SchoolDetailPage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const { selectedCampaign, setSelectedCampaign, setDonationCategory } =
    useDonationStore();
  // Figma 기본 선택: 교복 지원(3번째)
  const [selected, setSelected] = useState(2);

  const selectedCampaignId = selectedCampaign?.id;

  useEffect(() => {
    if (!selectedCampaign) navigate("/school", { replace: true });
  }, [selectedCampaign, navigate]);

  // 이 화면에 있다는 것은 학교 흐름이 확정됐다는 뜻이다. 카테고리가 비어 있으면
  // (직접 진입·유휴 리셋) 이후 /outfit 이 NGO 흐름으로 오인해 결제 페이지로
  // 리다이렉트되므로 여기서 보정한다.
  useEffect(() => {
    setDonationCategory("school");
  }, [setDonationCategory]);

  // List endpoint response has the same fields we need for this UI,
  // but we still refetch by id to align with `/api/donations/schools/{id}`.
  useEffect(() => {
    if (!selectedCampaignId) return;

    const match = selectedCampaignId.match(/\d+/);
    if (!match) return;

    const id = Number(match[0]);
    if (!Number.isFinite(id) || id <= 0) return;

    let cancelled = false;

    (async () => {
      try {
        const dto = await fetchSchoolById(id);
        if (cancelled) return;
        const next = buildSchoolCampaignFromDto(dto);

        // 모금등수(전국 순위)는 목록(sort=DONATION*) 응답에만 있고 상세
        // 엔드포인트(/schools/{id})는 내려주지 않는다. 따라서 상세 응답으로
        // 통째로 덮어쓰면 등수가 사라진다 → 기존 값을 유지하고, 그래도 없으면
        // 이름으로 랭킹을 조회해 보충한다.
        let rank =
          next.donationRank ??
          useDonationStore.getState().selectedCampaign?.donationRank;

        if (rank == null) {
          try {
            const ranked = await fetchSchoolsPage({
              keyword: dto.name,
              sort: "DONATION",
              pageSize: 20,
            });
            if (cancelled) return;
            rank = ranked.content.find((s) => s.id === dto.id)?.nationwideRank;
          } catch {
            // 랭킹 조회 실패 시 등수 없이 표시한다.
          }
        }

        setSelectedCampaign({ ...next, donationRank: rank });
      } catch {
        // Degraded mode: keep the list-derived campaign.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCampaignId, setSelectedCampaign]);

  if (!selectedCampaign) return null;

  const programs = selectedCampaign.programs.slice(0, 3);
  const subtitle = PROGRAM_SUBTITLES[programs[selected]?.title ?? ""] ?? "";

  return (
    <PageBody className="school-detail" scroll={false}>
      <div className="sd-hero">
        <img
          className="sd-hero__img"
          src={selectedCampaign.imageUrl}
          alt=""
          decoding="async"
        />
        <div className="sd-hero__overlay" aria-hidden />
      </div>

      <div className="sd-header-overlay">
        <AppHeader title="학교" light />
      </div>

      <div className="sd-body">
        {/* 학교명 + 모금등수 — Figma 5591:40540 Bold 80 / 5846:90687 Bold 50 테마색 */}
        <div className="sd-title-row">
          <h2 className="sd-title">{selectedCampaign.title}</h2>
          {selectedCampaign.donationRank != null && (
            <span className="sd-rank" style={{ color: theme.primary }}>
              모금등수 : {selectedCampaign.donationRank}등
            </span>
          )}
        </div>

        {/* 사용처 카드 3종 — Figma 5591:40607~40621 (선택: 연초록 #e5ffed) */}
        <div className="sd-programs">
          {programs.map((program, index) => (
            <button
              key={program.title}
              type="button"
              className={`sd-prog${index === selected ? " is-selected" : ""}`}
              onClick={() => setSelected(index)}
            >
              <span className="sd-prog__num">{index + 1}</span>
              <span className="sd-prog__label">{program.title}</span>
            </button>
          ))}
        </div>

        {/* 소개문 — Figma 5591:40690 Medium 55 #636363 */}
        <p className="sd-desc">{selectedCampaign.description}</p>

        {/* 모금 현황 — Figma 5591:40722 흰 박스 + 진행바 */}
        <div className="sd-funding">
          <p className="sd-funding__label" style={{ color: theme.primary }}>
            모금 현황
          </p>
          <div className="sd-funding__bar">
            <div
              className="sd-funding__fill"
              style={{
                width: `${getCampaignProgressPercent(selectedCampaign.accumulatedAmount, selectedCampaign.targetAmount)}%`,
                backgroundColor: theme.primary,
              }}
            />
          </div>
          <p className="sd-funding__amount" style={{ color: theme.primary }}>
            {formatCurrency(selectedCampaign.accumulatedAmount)} /{" "}
            {formatCurrency(selectedCampaign.targetAmount)}원
          </p>
        </div>

        {/* 참여자·수혜자 — Figma 5776:26038 Regular 55 #636363, 중앙 */}
        <p className="sd-stats">
          기부 참여자 : {selectedCampaign.participantCount ?? 0}명 / 기부 수혜자
          : {selectedCampaign.studentCount ?? 0}명
        </p>

        {/* 기부하기 — Figma 5776:26006: 하단 전체폭 버튼(초록, radius45) */}
        <button
          type="button"
          className="sd-cta"
          style={{ backgroundColor: theme.primary }}
          onClick={() => navigate("/outfit")}
        >
          기부하기{subtitle ? ` - ${subtitle}` : ""}
        </button>
      </div>

      <FooterBanner />
    </PageBody>
  );
}

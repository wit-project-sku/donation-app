import { useEffect, useMemo } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import type { CampaignSection, CampaignTitleRun } from "../types";
import { formatCampaignProgressAmounts } from "../utils/campaignProgress";
import { formatCurrency } from "../utils/format";
import "./CampaignDetailPage.css";

const HEADER_TITLE = "이 마음을 전해볼까요?";
const HEADER_DESC =
  "기부금 전액이 현장 지원에 사용되며, 법정 기부금으로서 세액공제 혜택이 적용됩니다";

const PROGRAMS_HEADING = "결연은 아이들의 삶을 변화시킵니다.";
const PROGRAMS_SUBHEADING =
  "당신의 선택이 한 아이의 하루를 바꾸고, 한 가족을 지켜낼 수 있습니다.";

function estimateParticipantCount(accumulatedAmount: number): number {
  if (!accumulatedAmount) return 1;
  return Math.max(1, Math.round(accumulatedAmount / 456_000));
}

function SectionTitle({
  title,
  titleRuns,
}: Pick<CampaignSection, "title" | "titleRuns">) {
  if (titleRuns?.length) {
    return (
      <h3 className="campaign-detail__section-title">
        {titleRuns.map((run: CampaignTitleRun, index) => (
          <span
            key={`${run.text}-${index}`}
            className={
              run.bold || run.color
                ? "campaign-detail__section-title-run--accent"
                : undefined
            }
            style={{
              fontWeight: run.bold ? 700 : 500,
              color: run.color || (run.bold ? "var(--main-01, #fe6c50)" : undefined),
            }}
          >
            {run.text}
          </span>
        ))}
      </h3>
    );
  }

  return <h3 className="campaign-detail__section-title">{title}</h3>;
}

export function CampaignDetailPage() {
  const navigate = useAppNavigate();
  const { selectedCampaign } = useDonationStore();
  const { theme } = useTheme();

  useEffect(() => {
    if (!selectedCampaign) navigate("/", { replace: true });
  }, [selectedCampaign, navigate]);

  const progress = useMemo(
    () =>
      selectedCampaign
        ? formatCampaignProgressAmounts(selectedCampaign)
        : null,
    [selectedCampaign],
  );

  if (!selectedCampaign || !progress) return null;

  const description = selectedCampaign.description?.trim();
  const participantCount = estimateParticipantCount(progress.accumulated);
  const sections = selectedCampaign.sections ?? [];
  const programs = selectedCampaign.programs ?? [];
  const sectionImages = sections
    .map((section) => section.img?.trim())
    .filter((img): img is string => Boolean(img));
  const [leadSection, ...tailSections] = sections;

  return (
    <PageBody className="campaign-detail" scroll={false}>
      <header className="campaign-detail__header">
        <p className="campaign-detail__page-desc">{HEADER_DESC}</p>
        <h1 className="campaign-detail__page-title">{HEADER_TITLE}</h1>
      </header>

      <div className="campaign-detail__scroll">
        <div className="campaign-detail__scroll-inner">
          <div className="campaign-detail__hero">
            <img
              className="campaign-detail__hero-img"
              src={selectedCampaign.imageUrl}
              alt={selectedCampaign.title}
              decoding="async"
            />
            <div className="campaign-detail__hero-overlay" aria-hidden />
          </div>

          <section className="campaign-detail__intro">
            <p className="campaign-detail__participant">
              {formatCurrency(participantCount)}명이 함께했어요
            </p>

            <h2 className="campaign-detail__title">{selectedCampaign.title}</h2>

            {description ? (
              <p className="campaign-detail__description">{description}</p>
            ) : null}

            <div className="campaign-detail__progress">
              <p className="campaign-detail__progress-label">
                누적 기부금액 : {formatCurrency(progress.accumulated)}원
              </p>
              <div className="campaign-detail__progress-bar">
                <div
                  className="campaign-detail__progress-fill"
                  style={{
                    width: `${progress.percent}%`,
                    backgroundColor: theme.primary,
                  }}
                />
              </div>
            </div>
          </section>

          {leadSection ? (
            <article className="campaign-detail__story-block">
              <SectionTitle
                title={leadSection.title}
                titleRuns={leadSection.titleRuns}
              />
              <p className="campaign-detail__section-desc">{leadSection.desc}</p>
            </article>
          ) : null}

          {sectionImages.length > 0 ? (
            <div className="campaign-detail__image-row">
              {sectionImages.map((img, index) => (
                <img
                  key={`${img}-${index}`}
                  className="campaign-detail__image-row-item"
                  src={img}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          ) : null}

          {tailSections.map((section, index) => (
            <article
              key={`${section.title}-${index}`}
              className="campaign-detail__story-block"
            >
              <SectionTitle
                title={section.title}
                titleRuns={section.titleRuns}
              />
              <p className="campaign-detail__section-desc">{section.desc}</p>
            </article>
          ))}

          {programs.length > 0 ? (
            <section className="campaign-detail__programs">
              <h3 className="campaign-detail__programs-heading">
                {PROGRAMS_HEADING}
              </h3>
              <p className="campaign-detail__programs-subheading">
                {PROGRAMS_SUBHEADING}
              </p>
              <div className="campaign-detail__programs-grid">
                {programs.map((program, index) => (
                  <article
                    key={`${program.title}-${index}`}
                    className="campaign-detail__program-card"
                  >
                    <span className="campaign-detail__program-number">
                      {index + 1}
                    </span>
                    <h4 className="campaign-detail__program-title">
                      {program.title}
                    </h4>
                    <p className="campaign-detail__program-desc">
                      {program.desc}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <div className="campaign-detail__cta-fade" aria-hidden />
      <div className="campaign-detail__cta-wrap">
        <button
          type="button"
          className="campaign-detail__cta"
          onClick={() => navigate("/amount")}
          style={{ backgroundColor: theme.primary }}
        >
          이 마음으로 시작하기
        </button>
      </div>
    </PageBody>
  );
}

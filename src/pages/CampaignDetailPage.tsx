import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageBody } from "../components/layout/PageBody";
import campaignCategoriesImg from "../assets/campaign-categories.png";
import { useDonationStore } from "../store/donationStore";
import "./CampaignDetailPage.css";

export function CampaignDetailPage() {
  const navigate = useNavigate();
  const { selectedCampaign } = useDonationStore();

  useEffect(() => {
    if (!selectedCampaign) navigate("/", { replace: true });
  }, [selectedCampaign, navigate]);

  if (!selectedCampaign) return null;

  const description = selectedCampaign.description?.trim();

  return (
    <PageBody className="campaign-detail" scroll={false}>
      <main className="campaign-detail__card">
        <section
          className="campaign-detail__hero"
          style={
            {
              "--campaign-hero-image": `url("${selectedCampaign.imageUrl}")`,
            } as React.CSSProperties
          }
          aria-label={selectedCampaign.title}
        >
          <img
            className="campaign-detail__hero-img"
            src={selectedCampaign.imageUrl}
            alt=""
          />
        </section>

        <section className="campaign-detail__content">
          <div className="campaign-detail__copy">
            <h2>{selectedCampaign.title}</h2>
            {description ? <p>{description}</p> : null}

            <img
              className="campaign-detail__categories-img"
              src={campaignCategoriesImg}
              alt="후원 분야: 교육, 영양, 예방접종, 말라리아, 건강, 깨끗한 식수, 이동수단과 보호시설"
            />
          </div>
        </section>
      </main>

      <div className="campaign-detail__actions">
        <button
          type="button"
          className="campaign-detail__back-btn"
          onClick={() => navigate("/")}
          aria-label="이전 화면으로 돌아가기"
        >
          다른 후원 선택
        </button>

        <button
          type="button"
          className="campaign-detail__donate-btn"
          onClick={() => navigate("/amount")}
        >
          기부하기
        </button>
      </div>
    </PageBody>
  );
}

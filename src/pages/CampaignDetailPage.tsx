import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Droplets,
  HeartHandshake,
  Shield,
  Stethoscope,
  TreePine,
  UsersRound,
} from "lucide-react";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import "./CampaignDetailPage.css";

const CATEGORY_ITEMS = [
  { label: "교육", icon: BookOpen, active: true },
  { label: "긴급\n구호", icon: HeartHandshake },
  { label: "식수위생", icon: Droplets },
  { label: "보호", icon: Shield },
  { label: "영양", icon: UsersRound },
  { label: "안전한\n환경", icon: Stethoscope },
  { label: "어린이가\n행복한 세상", icon: TreePine },
];

const DETAIL_PARAGRAPHS = [
  "당신의 도움이 필요한 곳에 전해집니다. 당신의 마음이 누군가의 내일이 됩니다. 인사동의 도움으로 전 세계 어린이들이 더 건강하고 안전한 환경에서 자랄 수 있도록 함께합니다.",
  "전 세계 어린이들은 여전히 교육의 기회, 깨끗한 물, 의료 지원과 같은 기본적인 권리를 필요로 합니다. 작은 나눔이 모이면 아이들의 일상을 바꾸는 큰 힘이 됩니다.",
];

export function CampaignDetailPage() {
  const navigate = useNavigate();
  const { selectedCampaign } = useDonationStore();

  useEffect(() => {
    if (!selectedCampaign) navigate("/", { replace: true });
  }, [selectedCampaign, navigate]);

  if (!selectedCampaign) return null;

  const description =
    selectedCampaign.description?.trim() || DETAIL_PARAGRAPHS[0];

  return (
    <PageBody className="campaign-detail" scroll={false}>
      <main className="campaign-detail__card">
        <section className="campaign-detail__hero">
          <img
            className="campaign-detail__hero-img"
            src={selectedCampaign.imageUrl}
            alt={selectedCampaign.title}
          />
          <div className="campaign-detail__hero-logo">유니세프</div>
        </section>

        <section className="campaign-detail__content">
          <div className="campaign-detail__copy">
            <h2>{selectedCampaign.title}</h2>
            <h3>후원부분 설명</h3>
            <p>{description}</p>
            <h3>후원부분 설명</h3>
            <p>{DETAIL_PARAGRAPHS[1]}</p>

            <div className="campaign-detail__categories">
              {CATEGORY_ITEMS.map((item) => {
                const CategoryIcon = item.icon;
                return (
                  <div
                    className={`campaign-detail__category${
                      item.active ? " campaign-detail__category--active" : ""
                    }`}
                    key={item.label}
                  >
                    <CategoryIcon size={28} aria-hidden />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="campaign-detail__stats">
            <div>
              <strong>이번 달 모금액</strong>
              <span>₩50,000,000</span>
            </div>
            <div>
              <strong>목표</strong>
              <span>₩50,000,000</span>
            </div>
            <div>
              <strong>오늘의 기부자들</strong>
              <span>₩50,000,000</span>
            </div>
          </aside>
        </section>

        <div className="campaign-detail__total">
          <strong>현재 누적 모금액 : 5,700,000</strong>
          <span />
        </div>
      </main>

      <button
        type="button"
        className="campaign-detail__donate-btn"
        onClick={() => navigate("/amount")}
      >
        기부하기
      </button>
    </PageBody>
  );
}

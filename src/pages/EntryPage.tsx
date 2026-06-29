import { useAppNavigate } from "../hooks/useAppNavigate";
import { useDonationStore } from "../store/donationStore";
import { exitDonationApp } from "../config/navigation";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { PlaceholderAsset } from "../components/PlaceholderAsset";
import type { DonationCategory } from "../types";
import ngoIcon from "../assets/entry-ngo.png";
import schoolIcon from "../assets/entry-school.png";
import "./EntryPage.css";

export function EntryPage() {
  const navigate = useAppNavigate();
  const setDonationCategory = useDonationStore(
    (state) => state.setDonationCategory,
  );

  const choose = (category: Exclude<DonationCategory, "none">) => {
    setDonationCategory(category);
    navigate("/campaigns");
  };

  return (
    <PageBody className="entry-page">
      <AppHeader showBack onBack={exitDonationApp} />

      <div className="entry-page__hero">
        <h2 className="entry-page__headline">
          당신의 따뜻한 마음이
          <br />
          누군가의 희망이 됩니다
        </h2>
        <p className="entry-page__sub">기부할 대상을 선택해주세요</p>
      </div>

      <div className="entry-page__cards">
        <button
          type="button"
          className="entry-card entry-card--ngo"
          onClick={() => choose("ngo")}
        >
          <span className="entry-card__icon">
            <img src={ngoIcon} alt="" className="entry-card__icon-img" />
          </span>
          <span className="entry-card__label">NGO</span>
          <span className="entry-card__desc">
            국내외 다양한 단체를 통해
            <br />
            도움이 필요한 곳에 기부합니다.
          </span>
        </button>

        <button
          type="button"
          className="entry-card entry-card--school"
          onClick={() => choose("school")}
        >
          <span className="entry-card__icon">
            <img
              src={schoolIcon}
              alt=""
              className="entry-card__icon-img entry-card__icon-img--school"
            />
          </span>
          <span className="entry-card__label">학교</span>
          <span className="entry-card__desc">
            학교를 통해 우리 주변의
            <br />
            이웃을 함께 돕습니다
          </span>
        </button>
      </div>

      <button
        type="button"
        className="entry-page__history"
        onClick={() => navigate("/wall")}
      >
        기부내역 보기
      </button>

      <div className="entry-page__featured">
        <PlaceholderAsset
          label="featured 배너 이미지"
          height="100%"
          radius={0}
          className="entry-page__featured-bg"
        />
        <div className="entry-page__featured-overlay">
          <p className="entry-page__featured-eyebrow">
            오늘도 도움이 필요한 아이들이 있습니다
          </p>
          <p className="entry-page__featured-title">
            매일 어린이 <em>1,200명</em>이
            <br />
            <em>말라리아</em>로 인해 사망합니다.
          </p>
          <span className="entry-page__featured-more">더 알아보기</span>
        </div>
        <div className="entry-page__featured-dots" aria-hidden>
          <span className="entry-page__featured-dot entry-page__featured-dot--active" />
          <span className="entry-page__featured-dot" />
          <span className="entry-page__featured-dot" />
          <span className="entry-page__featured-dot" />
        </div>
      </div>

      <p className="entry-page__note">
        기부금 전액이 현장 지원에 사용되며, 법정 기부금으로서 세액공제 혜택이 적용됩니다
      </p>
    </PageBody>
  );
}

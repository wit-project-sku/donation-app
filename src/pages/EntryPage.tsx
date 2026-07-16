import { useEffect, useRef, type ReactNode } from "react";
import type { Swiper as SwiperClass } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { useDonationStore } from "../store/donationStore";
import { exitDonationApp } from "../config/navigation";
import { getKioskBridge } from "../utils/kioskBridge";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import type { DonationCategory } from "../types";
import ngoIcon from "../assets/entry-ngo.png";
import schoolIcon from "../assets/entry-school.png";
import bannerArrow from "../assets/banner-arrow.svg";
import bannerUniformTryon from "../assets/banner-uniform-tryon.png";
import bannerSchoolRank from "../assets/banner-school-rank.png";
import "./EntryPage.css";

/** 하단 featured 캐러셀 슬라이드 (Figma 5896:103080 / 5896:103081)
 *  작은 글씨(eyebrow) 48 Regular #fff, 큰 글씨(title) 80 Bold #bef2ce. */
interface BannerSlide {
  id: string | number;
  eyebrow: ReactNode;
  title: ReactNode;
  image: string;
}

/** 배너 문구·이미지는 Figma 시안 고정값이다(캠페인 API 연동 아님). */
const BANNERS: BannerSlide[] = [
  {
    // Figma 5896:103080
    id: "uniform-tryon",
    eyebrow: "우리 학교 교복으로 특별한 순간을 만들어보세요",
    title: (
      <>
        우리 학교 교복 입어보고
        <br />
        기부한컷과 학교 순위를 확인해보세요
      </>
    ),
    image: bannerUniformTryon,
  },
  {
    // Figma 5896:103081
    id: "school-rank",
    eyebrow: "나의 참여가 후배들의 교복 지원으로 이어집니다",
    title: (
      <>
        후배들에게 전달된 나눔의 결과와
        <br />
        우리학교 순위를 확인해보세요
      </>
    ),
    image: bannerSchoolRank,
  },
];

export function EntryPage() {
  const navigate = useAppNavigate();
  const featuredSwiper = useRef<SwiperClass | null>(null);
  const setDonationCategory = useDonationStore(
    (state) => state.setDonationCategory,
  );

  // 기부 앱 홈으로 돌아온 시점(가드 리다이렉트·미지정 경로 등)에는 결제 완료 전
  // 상태이므로, 키오스크 Monitor 2 에 AI 결과가 남아 있으면 안 된다. 영상으로 되돌린다.
  useEffect(() => {
    getKioskBridge()?.showVideo?.();
  }, []);

  const choose = (category: Exclude<DonationCategory, "none">) => {
    setDonationCategory(category);
    navigate(category === "school" ? "/school" : "/campaigns");
  };

  return (
    <PageBody className="entry-page">
      <AppHeader
        subtitle="기부할 대상을 선택해주세요"
        showBack
        onBack={exitDonationApp}
      />

      <div className="entry-page__hero">
        <h2 className="entry-page__headline">
          당신의 따뜻한 마음이 누군가의 희망이 됩니다
        </h2>
      </div>

      <div className="entry-page__cards">
        <div className="entry-col">
          {/* NGO 흐름은 아직 준비중 — 카드/기부내역 모두 비활성(클릭 불가) */}
          <button
            type="button"
            className="entry-card entry-card--ngo entry-card--disabled"
            disabled
            aria-disabled="true"
          >
            <span className="entry-card__icon">
              <img src={ngoIcon} alt="" className="entry-card__icon-img" />
            </span>
            <span className="entry-card__label">NGO(준비중)</span>
            <span className="entry-card__desc">
              국내외 다양한 단체를 통해
              <br />
              도움이 필요한 곳에 기부합니다.
            </span>
          </button>
          <button
            type="button"
            className="entry-history entry-history--ngo entry-history--disabled"
            disabled
            aria-disabled="true"
          >
            기부내역 보기
          </button>
        </div>

        <div className="entry-col">
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
            <span className="entry-card__label">교복 주기</span>
            <span className="entry-card__desc">
              학교를 통해 우리 주변의
              <br />
              이웃을 함께 돕습니다
            </span>
          </button>
          <button
            type="button"
            className="entry-history entry-history--school"
            onClick={() => navigate("/school-wall")}
          >
            기부내역 보기
          </button>
        </div>
      </div>

      <div className="entry-page__featured">
        <Swiper
          className="entry-featured-swiper"
          modules={[Autoplay]}
          onSwiper={(swiper) => {
            featuredSwiper.current = swiper;
          }}
          slidesPerView={1}
          rewind
          speed={600}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
        >
          {BANNERS.map((banner) => (
            <SwiperSlide key={banner.id} className="entry-featured-slide">
              {/* 배너는 안내 문구 노출용 — 클릭 동작 없음(좌우 화살표만 넘김) */}
              <div className="entry-page__featured-hit">
                <img
                  src={banner.image}
                  alt=""
                  className="entry-page__featured-bg-img"
                />
                <div className="entry-page__featured-overlay">
                  <p className="entry-page__featured-eyebrow">
                    {banner.eyebrow}
                  </p>
                  <p className="entry-page__featured-title">{banner.title}</p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <button
          type="button"
          className="entry-page__featured-nav entry-page__featured-nav--prev"
          onClick={() => featuredSwiper.current?.slidePrev()}
          aria-label="이전 배너"
        >
          <img src={bannerArrow} alt="" className="entry-page__featured-nav-icon" />
        </button>
        <button
          type="button"
          className="entry-page__featured-nav entry-page__featured-nav--next"
          onClick={() => featuredSwiper.current?.slideNext()}
          aria-label="다음 배너"
        >
          <img src={bannerArrow} alt="" className="entry-page__featured-nav-icon" />
        </button>
      </div>

      <p className="entry-page__note">
        우리가 함께하지 않으면 아무것도 바뀌지 않습니다.
      </p>
    </PageBody>
  );
}

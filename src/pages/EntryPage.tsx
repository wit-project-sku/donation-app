import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Swiper as SwiperClass } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { fetchCampaignsPage } from "../api/campaigns";
import { useDonationStore } from "../store/donationStore";
import { exitDonationApp } from "../config/navigation";
import { getKioskBridge } from "../utils/kioskBridge";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import type { Campaign, DonationCategory } from "../types";
import ngoIcon from "../assets/entry-ngo.png";
import schoolIcon from "../assets/entry-school.png";
import bannerBg from "../assets/featured-banner.png";
import "./EntryPage.css";

/** 하단 featured 캐러셀 슬라이드 (Figma 5535:18557 배너 · 강조 텍스트 #fcd869)
 *  실데이터: 캠페인 API 의 bannerTitle(큰 글씨)/bannerSubtitle(작은 글씨). */
interface BannerSlide {
  id: string | number;
  eyebrow: ReactNode;
  title: ReactNode;
  image?: string;
  /** Source campaign (real data) — tapping the banner opens its detail page. */
  campaign?: Campaign;
}

/** 캠페인이 없을 때(로딩/오프라인) 보여줄 기본 배너. */
const FALLBACK_BANNERS: BannerSlide[] = [
  {
    id: 1,
    eyebrow: "오늘도 도움이 필요한 아이들이 있습니다",
    title: (
      <>
        매일 어린이 <em>1,200명</em>이
        <br />
        <em>말라리아</em>로 인해 사망합니다.
      </>
    ),
  },
  {
    id: 2,
    eyebrow: "당신의 작은 나눔이 큰 힘이 됩니다",
    title: (
      <>
        커피 한 잔 값 <em>5,000원</em>으로
        <br />
        한 아이의 <em>하루</em>를 지킬 수 있습니다.
      </>
    ),
  },
  {
    id: 3,
    eyebrow: "함께하면 더 멀리 갈 수 있습니다",
    title: (
      <>
        지금까지 <em>12,480명</em>이
        <br />
        나눔에 <em>동참</em>했습니다.
      </>
    ),
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

  // 하단 배너는 NGO 캠페인 API 로부터 받아온다(같은 fetchCampaignsPage).
  const { data: campaignsData } = useQuery({
    queryKey: ["campaigns", "home-banner"],
    queryFn: () => fetchCampaignsPage({ pageSize: 10 }),
    staleTime: 5 * 60 * 1000,
  });

  const bannerSlides = useMemo<BannerSlide[]>(() => {
    const campaigns = campaignsData?.content ?? [];
    if (campaigns.length === 0) return FALLBACK_BANNERS;
    return campaigns.map((campaign) => ({
      id: campaign.id,
      // 큰 글씨 = bannerTitle, 작은 글씨 = bannerSubtitle (미설정 시 캠페인명/단체명 폴백).
      title: campaign.bannerTitle?.trim() || campaign.title,
      eyebrow:
        campaign.bannerSubtitle?.trim() ||
        campaign.organization?.name ||
        "",
      image: campaign.imageUrl || undefined,
      campaign,
    }));
  }, [campaignsData]);

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
          modules={[Autoplay, Pagination]}
          onSwiper={(swiper) => {
            featuredSwiper.current = swiper;
          }}
          slidesPerView={1}
          rewind
          speed={600}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
        >
          {bannerSlides.map((banner) => (
            <SwiperSlide key={banner.id} className="entry-featured-slide">
              {/* NGO 캠페인 배너 — NGO(준비중)이므로 보여주기만 하고 클릭은 막는다
                  (누르면 NGO 상세로 들어가 버린다). 좌우 화살표/도트는 배너 넘김용이라 유지. */}
              <div className="entry-page__featured-hit">
                <img
                  src={banner.image ?? bannerBg}
                  alt=""
                  className="entry-page__featured-bg-img"
                />
                <div className="entry-page__featured-overlay">
                  <p className="entry-page__featured-eyebrow">
                    {banner.eyebrow}
                  </p>
                  <p className="entry-page__featured-title">{banner.title}</p>
                  <span className="entry-page__featured-more">
                    더 알아보기
                    <span
                      className="entry-page__featured-more-chevron"
                      aria-hidden
                    >
                      ›
                    </span>
                  </span>
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
          ‹
        </button>
        <button
          type="button"
          className="entry-page__featured-nav entry-page__featured-nav--next"
          onClick={() => featuredSwiper.current?.slideNext()}
          aria-label="다음 배너"
        >
          ›
        </button>
      </div>

      <p className="entry-page__note">
        우리가 함께하지 않으면 아무것도 바뀌지 않습니다.
      </p>
    </PageBody>
  );
}

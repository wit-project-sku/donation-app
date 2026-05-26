import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCampaigns } from "../api/campaigns";
import { CampaignCard } from "../components/CampaignCard";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import "./CampaignsPage.css";

const CARD_WIDTH = 1820;

export function CampaignsPage() {
  const navigate = useNavigate();
  const { setSelectedCampaign } = useDonationStore();
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { data: campaigns = [], isLoading, isError } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => fetchCampaigns(20),
  });

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const track = trackRef.current;
    if (!track) return;
    const slides = track.querySelectorAll<HTMLElement>(".campaigns-page__slide");
    const slide = slides[index];
    if (!slide) return;
    const offset = slide.offsetLeft - (track.offsetWidth - CARD_WIDTH) / 2;
    track.scrollTo({ left: Math.max(0, offset), behavior });
  }, []);

  useEffect(() => {
    if (campaigns.length === 0) return;
    const mid = Math.floor(campaigns.length / 2);
    setActiveIndex(mid);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => scrollToIndex(mid, "instant"))
    );
  }, [campaigns.length, scrollToIndex]);

  const handleScroll = useCallback(() => {
    clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const track = trackRef.current;
      if (!track) return;
      const slides = Array.from(track.querySelectorAll<HTMLElement>(".campaigns-page__slide"));
      const viewCenter = track.scrollLeft + track.offsetWidth / 2;
      let closest = 0;
      let minDist = Infinity;
      slides.forEach((slide, i) => {
        const dist = Math.abs(slide.offsetLeft + CARD_WIDTH / 2 - viewCenter);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      setActiveIndex(closest);
    }, 60);
  }, []);

  const handleSelect = (campaign: (typeof campaigns)[0], index: number) => {
    if (index !== activeIndex) {
      scrollToIndex(index);
      setActiveIndex(index);
      return;
    }
    setSelectedCampaign(campaign);
    navigate("/campaign");
  };

  const goPrev = () => {
    const next = Math.max(0, activeIndex - 1);
    setActiveIndex(next);
    scrollToIndex(next);
  };

  const goNext = () => {
    const next = Math.min(campaigns.length - 1, activeIndex + 1);
    setActiveIndex(next);
    scrollToIndex(next);
  };

  return (
    <PageBody className="campaigns-page" scroll={false}>
      <div className="campaigns-page__intro">
        <span className="campaigns-page__label">후원 분야 선택</span>
        <h2 className="campaigns-page__headline">
          당신의 도움이 필요한 곳에 전해집니다
        </h2>
        <p className="campaigns-page__desc">
          기부금 전액이 현장 지원에 사용됩니다.
          후원금은 법정 기부금으로서 세액공제 혜택이 적용됩니다.
        </p>
      </div>

      <div className="campaigns-page__swiper-wrap">
        <div
          className="campaigns-page__track"
          ref={trackRef}
          onScroll={handleScroll}
        >
          {isLoading && (
            <p className="campaigns-page__loading">불러오는 중...</p>
          )}
          {isError && (
            <p className="campaigns-page__loading campaigns-page__loading--error">
              캠페인을 불러오지 못했습니다
            </p>
          )}
          {!isLoading && !isError &&
            campaigns.map((campaign, index) => (
              <div
                key={campaign.id}
                className={`campaigns-page__slide ${index === activeIndex ? "campaigns-page__slide--active" : ""}`}
              >
                <CampaignCard
                  campaign={campaign}
                  isSelected={index === activeIndex}
                  onSelect={() => handleSelect(campaign, index)}
                />
              </div>
            ))
          }
        </div>
      </div>

      {/* Swiper navigation buttons — far left / far right below swiper */}
      {!isLoading && !isError && campaigns.length > 1 && (
        <div className="campaigns-page__nav">
          <button
            type="button"
            className="campaigns-page__nav-btn"
            onClick={goPrev}
            disabled={activeIndex === 0}
            aria-label="이전"
          >
            ‹
          </button>
          <button
            type="button"
            className="campaigns-page__nav-btn"
            onClick={goNext}
            disabled={activeIndex === campaigns.length - 1}
            aria-label="다음"
          >
            ›
          </button>
        </div>
      )}
    </PageBody>
  );
}

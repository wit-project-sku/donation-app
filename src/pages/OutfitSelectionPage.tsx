import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Swiper as SwiperClass } from "swiper";
import { FreeMode, Grid } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { fetchOutfitsPage, type Outfit } from "../api/outfits";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { IconCamera } from "../components/Icon";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import "swiper/css";
import "swiper/css/grid";
import "swiper/css/free-mode";
import "./OutfitSelectionPage.css";

const PAGE_SIZE = 12;

export function OutfitSelectionPage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const swiperRef = useRef<SwiperClass | null>(null);
  const {
    selectedCampaign,
    paymentMethod,
    donorName,
    skipPhoto,
    setSelectedOutfit,
    setSkipPhoto,
    setCapturedPhotoUrl,
  } = useDonationStore();

  const [selected, setSelected] = useState<Outfit | null>(null);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "outfits",
      { status: "ACTIVE", type: "PREMIUM", pageSize: PAGE_SIZE },
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchOutfitsPage({
        pageNum: pageParam,
        pageSize: PAGE_SIZE,
        status: "ACTIVE",
        type: "PREMIUM",
      }),
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.pageNum + 1,
  });

  const outfits = useMemo(
    () => data?.pages.flatMap((page) => page.content) ?? [],
    [data],
  );

  useEffect(() => {
    if (!selectedCampaign || !paymentMethod) {
      navigate("/payment", { replace: true });
      return;
    }
    if (skipPhoto) {
      navigate("/certificate", { replace: true });
      return;
    }
    if (!donorName.trim()) {
      navigate("/message", { replace: true });
    }
  }, [selectedCampaign, paymentMethod, skipPhoto, donorName, navigate]);

  useEffect(() => {
    swiperRef.current?.update();
  }, [outfits.length, isFetchingNextPage]);

  const loadMoreIfNeeded = useCallback(
    (swiper: SwiperClass) => {
      if (!hasNextPage || isFetchingNextPage) return;
      if (swiper.isEnd || swiper.progress > 0.82) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  const handlePhoto = useCallback(
    (withGreeting = false) => {
      if (!selected) return;
      setSelectedOutfit(selected);
      setSkipPhoto(false);
      setCapturedPhotoUrl(null);
      navigate(
        withGreeting ? "/camera?ai=true&mode=greeting" : "/camera?ai=false",
      );
    },
    [navigate, selected, setCapturedPhotoUrl, setSelectedOutfit, setSkipPhoto],
  );

  if (!selectedCampaign) return null;

  const canTakePhoto = Boolean(selected) && !isLoading && !isError;

  return (
    <PageBody className="outfit-page" scroll={false}>
      <AppHeader />

      <div className="outfit-body">
        <div className="outfit-intro">
          <h2 className="outfit-intro__title" style={{ color: theme.primary }}>
            기부 참여자에게만 제공되는 특별 의상을 착용해보세요!
          </h2>
          <p className="outfit-intro__desc">
            <span className="outfit-intro__star" aria-hidden>
              ★
            </span>
            <span>
              사진 촬영 버튼을 누르고 좌측 카메라에 얼굴을 바라봐주세요 10초후
              촬영이 시작됩니다.
            </span>
          </p>
        </div>

        {isLoading && <p className="outfit-status">의상 불러오는 중...</p>}
        {isError && (
          <p className="outfit-status outfit-status--error">
            의상 목록을 불러오지 못했습니다
          </p>
        )}

        {!isLoading && !isError && outfits.length > 0 && (
          <div className="outfit-swiper-wrap">
            <Swiper
              className="outfit-swiper"
              modules={[Grid, FreeMode]}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              onSlideChange={loadMoreIfNeeded}
              onReachEnd={loadMoreIfNeeded}
              onProgress={loadMoreIfNeeded}
              slidesPerView="auto"
              grid={{ rows: 2, fill: "row" }}
              spaceBetween={104}
              freeMode={{ enabled: true, momentum: true, momentumRatio: 0.85 }}
              simulateTouch
              allowTouchMove
              touchStartPreventDefault={false}
              resistance
              resistanceRatio={0.65}
              watchOverflow={false}
              role="list"
            >
              {outfits.map((outfit) => {
                const isSelected = selected?.id === outfit.id;
                return (
                  <SwiperSlide key={outfit.id} className="outfit-slide">
                    <button
                      type="button"
                      className={`outfit-card${isSelected ? " outfit-card--on" : ""}`}
                      role="listitem"
                      onClick={() => setSelected(isSelected ? null : outfit)}
                      aria-pressed={isSelected}
                      style={
                        isSelected ? { borderColor: theme.primary } : undefined
                      }
                    >
                      <img
                        className="outfit-card__img"
                        src={outfit.imageUrl}
                        alt={outfit.name}
                        loading="lazy"
                        draggable={false}
                      />
                    </button>
                  </SwiperSlide>
                );
              })}
              {isFetchingNextPage && (
                <SwiperSlide className="outfit-slide">
                  <div className="outfit-loading">더 불러오는 중...</div>
                </SwiperSlide>
              )}
            </Swiper>
          </div>
        )}

        {!isLoading && !isError && outfits.length === 0 && (
          <p className="outfit-empty">등록된 프리미엄 의상이 없습니다</p>
        )}
      </div>

      <div className="outfit-actions">
        <button
          type="button"
          className="outfit-action"
          onClick={() => handlePhoto(false)}
          disabled={!canTakePhoto}
          style={canTakePhoto ? { backgroundColor: theme.primary } : undefined}
        >
          <IconCamera size={68} aria-hidden />
          <span>혼자 찍기</span>
        </button>
        <button
          type="button"
          className="outfit-action"
          onClick={() => handlePhoto(true)}
          disabled={!canTakePhoto}
          style={canTakePhoto ? { backgroundColor: theme.primary } : undefined}
        >
          <IconCamera size={68} aria-hidden />
          <span>WITH &lsquo;인사&rsquo;</span>
        </button>
      </div>

      <AppFooter />
    </PageBody>
  );
}

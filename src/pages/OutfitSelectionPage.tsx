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
import { formatCurrency } from "../utils/format";
import { isEmbeddedInKiosk } from "../utils/kioskBridge";
import cameraGuideModal from "../assets/camera-guide-modal.png";
import "swiper/css";
import "swiper/css/grid";
import "swiper/css/free-mode";
import "./OutfitSelectionPage.css";

const PAGE_SIZE = 12;

/** Figma 5659:96268/96270 모금 현황 지표 (샘플) */
const PARTICIPANTS = 50;
const BENEFICIARIES = 77;
const FUNDING_PERCENT = 90;

export function OutfitSelectionPage() {
  const navigate = useAppNavigate();
  const { theme, organizer, category } = useTheme();
  const isSchool = category === "school";
  // NGO flow shows PREMIUM outfits; school flow shows SCHOOL_UNIFORM (교복).
  const outfitType = isSchool ? "SCHOOL_UNIFORM" : "PREMIUM";
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
  const [guideOpen, setGuideOpen] = useState(false);
  const [greetingMode, setGreetingMode] = useState(false);

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
      { status: "ACTIVE", type: outfitType, pageSize: PAGE_SIZE },
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchOutfitsPage({
        pageNum: pageParam,
        pageSize: PAGE_SIZE,
        status: "ACTIVE",
        type: outfitType,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.pageNum + 1,
  });

  const outfits = useMemo(
    () => data?.pages.flatMap((page) => page.content) ?? [],
    [data],
  );

  useEffect(() => {
    if (!selectedCampaign) {
      navigate("/", { replace: true });
      return;
    }
    // 학교 흐름은 촬영을 먼저 하고 결제/이름은 이후 단계에서 받으므로 사전 가드 생략
    if (isSchool) return;
    if (!paymentMethod) {
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
  }, [selectedCampaign, paymentMethod, skipPhoto, donorName, isSchool, navigate]);

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
      setSelectedOutfit(selected);
      setSkipPhoto(false);
      setCapturedPhotoUrl(null);
      setGreetingMode(withGreeting);
      // 촬영 안내 팝업을 띄운다 (Figma 5535:18720) → 탭하면 카메라로 진행
      setGuideOpen(true);
    },
    [selected, setCapturedPhotoUrl, setSelectedOutfit, setSkipPhoto],
  );

  const startCamera = useCallback(() => {
    setGuideOpen(false);
    navigate(greetingMode ? "/camera?mode=greeting" : "/camera");
  }, [greetingMode, navigate]);

  if (!selectedCampaign) return null;

  // 학교 흐름은 교복(실 촬영)으로 진행하므로 의상 미선택이어도 촬영 버튼 활성화
  const canTakePhoto = isSchool || (Boolean(selected) && !isLoading && !isError);

  return (
    <PageBody
      className={`outfit-page${isSchool ? " outfit-page--school" : ""}${guideOpen ? " outfit-page--modal" : ""}`}
      scroll={false}
    >
      <AppHeader backTo={isSchool ? "/school-detail" : undefined} />

      <div className="outfit-body">
        <div className="outfit-intro">
          <h2 className="outfit-intro__title" style={{ color: theme.primary }}>
            {isSchool
              ? "나의 고등학교 교복을 착용해보세요!"
              : "기부 참여자에게만 제공되는 특별 의상을 착용해보세요!"}
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
              grid={{ rows: isSchool ? 1 : 2, fill: "row" }}
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
        >
          <IconCamera size={68} aria-hidden />
          <span>혼자 찍기</span>
        </button>
        <button
          type="button"
          className="outfit-action"
          onClick={() => handlePhoto(true)}
          disabled={!canTakePhoto}
        >
          <IconCamera size={68} aria-hidden />
          <span>WITH &lsquo;인사&rsquo;</span>
        </button>
      </div>

      {/* 모금 현황 — Figma 5659:96261~96270 (학교 흐름: 촬영 대기 중 기부 정보 노출) */}
      {isSchool && (
        <div className="outfit-donation">
          <p className="outfit-donation__partner">
            이 캠페인은 {organizer.label}와 함께합니다.
          </p>

          <div className="outfit-funding">
            <p className="outfit-funding__label" style={{ color: theme.primary }}>
              모금 현황
            </p>
            <div className="outfit-funding__bar">
              <div
                className="outfit-funding__fill"
                style={{
                  width: `${FUNDING_PERCENT}%`,
                  backgroundColor: theme.primary,
                }}
              />
            </div>
            <p
              className="outfit-funding__amount"
              style={{ color: theme.primary }}
            >
              {formatCurrency(selectedCampaign.accumulatedAmount)} /{" "}
              {formatCurrency(selectedCampaign.targetAmount)}원
            </p>
          </div>

          <p className="outfit-donation__stats">
            기부 참여자 : {PARTICIPANTS}명 / 기부 수혜자 : {BENEFICIARIES}명
          </p>
        </div>
      )}

      <AppFooter />

      {guideOpen && (
        <div
          className="outfit-guide"
          role="dialog"
          aria-modal="true"
          onClick={isSchool || isEmbeddedInKiosk() ? startCamera : () => setGuideOpen(false)}
        >
          <img
            className="outfit-guide__img"
            src={cameraGuideModal}
            alt="왼쪽 화면을 먼저보시고 화면사이 카메라를 봐주세요."
          />
        </div>
      )}
    </PageBody>
  );
}

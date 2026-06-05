import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { fetchOutfitsPage, type Outfit } from "../api/outfits";
import { IconBack, IconCamera } from "../components/Icon";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import "./OutfitSelectionPage.css";

const PAGE_SIZE = 10;
const CAROUSEL_PAGE_SIZE = 6;
export function OutfitSelectionPage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const gridWrapRef = useRef<HTMLDivElement>(null);
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
  const [carouselPage, setCarouselPage] = useState(0);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["outfits", { status: "ACTIVE", type: "PREMIUM", pageSize: PAGE_SIZE }],
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
  const carouselPageCount = Math.max(
    1,
    Math.ceil(outfits.length / CAROUSEL_PAGE_SIZE),
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
      navigate("/message-review", { replace: true });
    }
  }, [selectedCampaign, paymentMethod, skipPhoto, donorName, navigate]);

  const handleGridScroll = () => {
    const element = gridWrapRef.current;
    if (!element) return;

    const pageWidth = Math.max(1, element.clientWidth);
    setCarouselPage(
      Math.min(carouselPageCount - 1, Math.round(element.scrollLeft / pageWidth)),
    );

    if (!hasNextPage || isFetchingNextPage) return;

    const distanceFromEnd =
      element.scrollWidth - element.scrollLeft - element.clientWidth;
    if (distanceFromEnd < 420) {
      fetchNextPage();
    }
  };

  const scrollOutfits = (direction: "prev" | "next") => {
    const element = gridWrapRef.current;
    if (!element) return;

    const nextPage =
      direction === "next"
        ? Math.min(carouselPage + 1, carouselPageCount - 1)
        : Math.max(carouselPage - 1, 0);

    element.scrollTo({
      left: nextPage * element.clientWidth,
      behavior: "smooth",
    });
    setCarouselPage(nextPage);

    if (
      direction === "next" &&
      nextPage >= carouselPageCount - 2 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  };

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
    [
      navigate,
      selected,
      setCapturedPhotoUrl,
      setSelectedOutfit,
      setSkipPhoto,
    ],
  );

  if (!selectedCampaign) return null;

  const canTakePhoto = Boolean(selected) && !isLoading && !isError;

  return (
    <PageBody
      className="outfit-page"
      scroll={false}
      style={{
        backgroundColor: theme.background,
        ["--outfit-primary" as string]: theme.primary,
      }}
    >
      <button
        type="button"
        className="outfit-page__back-btn"
        onClick={() => navigate("/message-review")}
        aria-label="정보 확인으로 돌아가기"
        style={{
          borderColor: theme.primary,
          backgroundColor: theme.primary,
          color: theme.text.onPrimary,
        }}
      >
        <IconBack size={72} strokeWidth={2.5} />
      </button>

      <main className="outfit-page__main">
        <header className="outfit-page__header">
          <h1
            className="outfit-page__title"
            style={{ color: theme.text.primary }}
          >
            의상을 선택해주세요
          </h1>
          <p
            className="outfit-page__subtitle"
            style={{ color: theme.text.secondary }}
          >
            기부 참여자만 이용할 수 있는 특별 의상이에요
          </p>
        </header>

        {isLoading && (
          <p
            className="outfit-page__status"
            style={{ color: theme.text.secondary }}
          >
            의상 불러오는 중...
          </p>
        )}
        {isError && (
          <p className="outfit-page__status outfit-page__status--error">
            의상 목록을 불러오지 못했습니다
          </p>
        )}

        {!isLoading && !isError && outfits.length > 0 && (
          <div className="outfit-page__carousel">
            <div
              className="outfit-page__grid-wrap"
              ref={gridWrapRef}
              onScroll={handleGridScroll}
            >
              <div className="outfit-page__grid">
                {outfits.map((outfit) => {
                  const isSelected = selected?.id === outfit.id;
                  return (
                    <button
                      key={outfit.id}
                      type="button"
                      className={`outfit-card ${isSelected ? "outfit-card--selected" : ""}`}
                      onClick={() => setSelected(isSelected ? null : outfit)}
                      style={{
                        backgroundColor: theme.card.background,
                      }}
                    >
                      <img
                        className="outfit-card__image"
                        src={outfit.imageUrl}
                        alt={outfit.name}
                        loading="lazy"
                      />
                    </button>
                  );
                })}
                {isFetchingNextPage && (
                  <div
                    className="outfit-page__loading-card"
                    style={{
                      backgroundColor: theme.card.background,
                      color: theme.text.secondary,
                    }}
                  >
                    더 불러오는 중...
                  </div>
                )}
              </div>
            </div>

            <div className="outfit-page__controls">
              <button
                type="button"
                className="outfit-page__nav-btn outfit-page__nav-btn--prev"
                onClick={() => scrollOutfits("prev")}
                disabled={carouselPage === 0}
                aria-label="이전 의상 보기"
                style={{
                  borderColor: theme.primary,
                  backgroundColor: theme.primary,
                  color: theme.text.onPrimary,
                }}
              >
                <span className="outfit-page__nav-icon" aria-hidden>
                  ‹
                </span>
              </button>

              <div
                className="outfit-page__pager"
                aria-label="의상 페이지"
                style={{ color: theme.text.secondary }}
              >
                {carouselPage + 1}/{carouselPageCount}
              </div>

              <button
                type="button"
                className="outfit-page__nav-btn outfit-page__nav-btn--next"
                onClick={() => scrollOutfits("next")}
                disabled={!hasNextPage && carouselPage >= carouselPageCount - 1}
                aria-label="다음 의상 보기"
                style={{
                  borderColor: theme.primary,
                  backgroundColor: theme.primary,
                  color: theme.text.onPrimary,
                }}
              >
                <span className="outfit-page__nav-icon" aria-hidden>
                  ›
                </span>
              </button>
            </div>
          </div>
        )}

        {!isLoading && !isError && outfits.length === 0 && (
          <p
            className="outfit-page__empty"
            style={{ color: theme.text.secondary }}
          >
            등록된 프리미엄 의상이 없습니다
          </p>
        )}

        <p
          className="outfit-page__helper"
          style={{ color: theme.text.secondary }}
        >
          의상을 선택한 뒤 사진 촬영을 시작해주세요
        </p>
      </main>

      <div className="outfit-page__photo-btns">
        <button
          type="button"
          className="outfit-page__photo-btn outfit-page__photo-btn--primary"
          onClick={() => handlePhoto(false)}
          disabled={!canTakePhoto}
          aria-label="사진 촬영 혼자 찍기"
          style={{
            backgroundColor: theme.primary,
            borderColor: theme.primary,
            color: theme.text.onPrimary,
          }}
        >
          <IconCamera size={80} strokeWidth={2.2} aria-hidden />
          <span>사진촬영 (혼자 찍기)</span>
        </button>
        <button
          type="button"
          className="outfit-page__photo-btn outfit-page__photo-btn--greeting"
          onClick={() => handlePhoto(true)}
          disabled={!canTakePhoto}
          aria-label="사진 촬영 인사 모드"
          style={{
            backgroundColor: theme.text.primary,
            borderColor: theme.text.primary,
            color: theme.text.onPrimary,
          }}
        >
          <IconCamera size={80} strokeWidth={2.2} aria-hidden />
          <span>사진촬영 (인사)</span>
        </button>
      </div>
    </PageBody>
  );
}

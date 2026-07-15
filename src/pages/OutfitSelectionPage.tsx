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
import { getCampaignProgressPercent } from "../utils/campaignProgress";
import { getKioskBridge } from "../utils/kioskBridge";
import "swiper/css";
import "swiper/css/grid";
import "swiper/css/free-mode";
import "./OutfitSelectionPage.css";

const PAGE_SIZE = 12;

export function OutfitSelectionPage() {
  const navigate = useAppNavigate();
  const { theme, category } = useTheme();
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
    setPhotoStatus,
  } = useDonationStore();

  const [selected, setSelected] = useState<Outfit | null>(null);
  // 촬영 모달: 버튼 탭 → 즉시 Monitor 2 촬영 트리거 + 안내 팝업. 카운트다운/타이머는
  // Monitor 2가 직접 보여주므로 이 팝업은 안내 이미지만 띄운다.
  const [captureOpen, setCaptureOpen] = useState(false);
  const [greetingMode, setGreetingMode] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  // 촬영 진행 중 표식 — 결과/타임아웃 시 한 번만 다음 화면으로 이동시킨다.
  const capturingRef = useRef(false);
  // NGO AI 생성 대기 상한 60초 타이머.
  const aiTimerRef = useRef<number | null>(null);

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

  // Swiper grid는 rows=2일 때 아이템이 rows 이하면 세로 1열로 접힌다.
  // 아이템이 2개 이하이면 1행(가로 나열)로 보여준다.
  const gridRows = isSchool || outfits.length <= 2 ? 1 : 2;
  const singleRow = gridRows === 1;

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

  // Fire the Monitor-2 capture immediately and open the guide popup. We do NOT
  // navigate here — Monitor 2 shows its own 10s timer; once the shot is taken and
  // handed to the AI ('generating' phase) the popup closes and Monitor 1 advances.
  // School → amount, NGO → certificate.
  const triggerCapture = useCallback(
    (mode: "solo" | "together") => {
      const bridge = getKioskBridge();
      if (!bridge?.takePhoto) {
        // 비임베드(개발/브라우저): 카메라가 없으므로 곧바로 다음 단계로 진행.
        navigate(isSchool ? "/school-amount" : "/certificate");
        return;
      }
      capturingRef.current = true;
      setCapturedPhotoUrl(null);
      setPhotoStatus("generating");
      bridge.takePhoto({ mode, clothingKey: selected?.outfitCode ?? "" });
    },
    [isSchool, navigate, selected, setCapturedPhotoUrl, setPhotoStatus],
  );

  const handlePhoto = useCallback(
    (withGreeting = false) => {
      setSelectedOutfit(selected);
      setSkipPhoto(false);
      setCapturedPhotoUrl(null);
      setGreetingMode(withGreeting);
      setCaptureError(null);
      setCaptureOpen(true);
      triggerCapture(withGreeting ? "together" : "solo");
    },
    [selected, setCapturedPhotoUrl, setSelectedOutfit, setSkipPhoto, triggerCapture],
  );

  const retryCapture = useCallback(() => {
    setCaptureError(null);
    triggerCapture(greetingMode ? "together" : "solo");
  }, [greetingMode, triggerCapture]);

  const cancelCapture = useCallback(() => {
    capturingRef.current = false;
    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    getKioskBridge()?.cancelPhoto?.();
    setCaptureOpen(false);
    setCaptureError(null);
    setPhotoStatus("idle");
  }, [setPhotoStatus]);

  // Subscribe to the kiosk photo lifecycle while embedded.
  //  - School: on 'generating' (shot taken) advance to amount; AI runs async.
  //  - NGO: keep the same guide popup showing (no extra spinner) until the AI
  //    result arrives, then go to the certificate. 60s is a safety cap.
  useEffect(() => {
    const bridge = getKioskBridge();
    if (!bridge?.on) return;
    const offProgress = bridge.on("photoProgress", (payload) => {
      const p = payload as { phase?: string };
      if (p.phase !== "generating" || !capturingRef.current) return;
      if (isSchool) {
        capturingRef.current = false;
        setCaptureOpen(false);
        navigate("/school-amount");
      } else {
        // NGO: leave the popup as-is; wait for the result (max 60s), then go.
        if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
        aiTimerRef.current = window.setTimeout(() => {
          capturingRef.current = false;
          setCaptureOpen(false);
          navigate("/certificate");
        }, 60000);
      }
    });
    const offResult = bridge.on("photoResult", () => {
      if (!capturingRef.current || isSchool) return;
      capturingRef.current = false;
      if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
      setCaptureOpen(false);
      navigate("/certificate");
    });
    const offError = bridge.on("photoError", (payload) => {
      if (!capturingRef.current) return;
      capturingRef.current = false;
      if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
      const message = (payload as { message?: string }).message;
      setCaptureError(message || "촬영에 실패했습니다. 다시 시도해 주세요.");
    });
    return () => {
      offProgress();
      offResult();
      offError();
      if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    };
  }, [isSchool, navigate]);

  if (!selectedCampaign) return null;

  // 촬영 버튼(혼자 찍기 / WITH '인사')은 의상을 골라야 활성화된다(학교·NGO 공통).
  const canTakePhoto = Boolean(selected) && !isLoading && !isError;

  return (
    <PageBody
      className={`outfit-page${isSchool ? " outfit-page--school" : ""}${singleRow && !isSchool ? " outfit-page--onerow" : ""}${captureOpen ? " outfit-page--modal" : ""}`}
      scroll={false}
    >
      {/* 학교: 안내문이 헤더 서브타이틀(★ 회색)로 올라간다 (Figma I5535:18443;1233:2178) */}
      <AppHeader
        subtitle={isSchool ? "나의 고등학교 교복을 착용해보세요" : undefined}
        backTo={isSchool ? "/school-detail" : undefined}
      />

      <div className="outfit-body">
        {isSchool ? (
          /* 촬영 안내 — Figma 5535:18468: 테마색 Bold 55, 2줄, 중앙 정렬.
             NOTE: `.outfit-guide` 는 촬영 팝업 딤 오버레이라 이름이 겹치면 안 된다. */
          <p className="outfit-shot-guide" style={{ color: theme.primary }}>
            사진 촬영 버튼을 누르고 좌측 카메라에 얼굴을 바라봐주세요
            <br />
            10초후 촬영이 시작됩니다.
          </p>
        ) : (
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
        )}

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
              grid={{ rows: gridRows, fill: "row" }}
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
                      style={isSelected ? { borderColor: theme.primary } : undefined}
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
          style={selected ? { backgroundColor: theme.primary } : undefined}
          onClick={() => handlePhoto(false)}
          disabled={!canTakePhoto}
        >
          <IconCamera size={68} aria-hidden />
          <span>혼자 찍기</span>
        </button>
        <button
          type="button"
          className="outfit-action"
          style={selected ? { backgroundColor: theme.primary } : undefined}
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
          <div className="outfit-funding">
            <p className="outfit-funding__label" style={{ color: theme.primary }}>
              모금 현황
            </p>
            <div className="outfit-funding__bar">
              <div
                className="outfit-funding__fill"
                style={{
                  width: `${getCampaignProgressPercent(selectedCampaign.accumulatedAmount, selectedCampaign.targetAmount)}%`,
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
            기부 참여자 : {selectedCampaign.participantCount ?? 0}명 / 기부 수혜자
            : {selectedCampaign.studentCount ?? 0}명
          </p>
        </div>
      )}

      <AppFooter />

      {captureOpen && (
        <div className="outfit-guide" role="dialog" aria-modal="true">
          <img
            className="outfit-guide__img"
            src="/icons/Group%201707482686.png"
            alt="왼쪽 화면을 먼저보시고 화면사이 카메라를 봐주세요."
          />

          {captureError && (
            <div className="outfit-capture__error">
              <p className="outfit-capture__error-text">{captureError}</p>
              <div className="outfit-capture__error-actions">
                <button
                  type="button"
                  className="outfit-capture__btn outfit-capture__btn--ghost"
                  onClick={cancelCapture}
                >
                  닫기
                </button>
                <button
                  type="button"
                  className="outfit-capture__btn"
                  style={{ backgroundColor: theme.primary }}
                  onClick={retryCapture}
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageBody>
  );
}

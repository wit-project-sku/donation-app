import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchOutfits, type Outfit } from "../api/outfits";
import { IconCamera, IconCheck, IconUsers } from "../components/Icon";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import "./OutfitSelectionPage.css";

export function OutfitSelectionPage() {
  const navigate = useNavigate();
  const {
    selectedCampaign,
    paymentMethod,
    setSelectedOutfit,
    setSkipPhoto,
    setCapturedPhotoUrl,
  } = useDonationStore();

  const [selected, setSelected] = useState<Outfit | null>(null);

  const { data: outfits = [], isLoading, isError } = useQuery({
    queryKey: ["outfits"],
    queryFn: () => fetchOutfits(50),
  });

  useEffect(() => {
    if (!selectedCampaign || !paymentMethod) {
      navigate("/", { replace: true });
    }
  }, [selectedCampaign, paymentMethod, navigate]);

  const handlePhoto = (withGreeting = false) => {
    setSelectedOutfit(selected);
    setSkipPhoto(false);
    setCapturedPhotoUrl(null);
    navigate(withGreeting ? "/camera?mode=greeting" : "/camera");
  };

  return (
    <PageBody className="outfit-page" scroll={false}>
      <div className="outfit-page__banner">
        <span className="outfit-page__banner-check">
          <IconCheck size={42} strokeWidth={3.2} aria-hidden />
        </span>
        <span className="outfit-page__banner-text">
          기부 참여자에게만 제공되는 특별 의상을 착용해보세요!
        </span>
      </div>

      <p className="outfit-page__instruction">
        * 원하시는 의상을 고르고 선택 완료 버튼을 누른 뒤 사진촬영 버튼을 눌러주세요
      </p>

      {isLoading && (
        <p className="outfit-page__status">의상 불러오는 중...</p>
      )}
      {isError && (
        <p className="outfit-page__status outfit-page__status--error">
          의상 목록을 불러오지 못했습니다
        </p>
      )}

      {!isLoading && !isError && outfits.length > 0 && (
        <div className="outfit-page__grid-wrap">
          <div className="outfit-page__grid">
            {outfits.map((outfit) => {
              const isSelected = selected?.id === outfit.id;
              return (
                <button
                  key={outfit.id}
                  type="button"
                  className={`outfit-card ${isSelected ? "outfit-card--selected" : ""}`}
                  onClick={() => setSelected(isSelected ? null : outfit)}
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
          </div>
        </div>
      )}

      {!isLoading && !isError && outfits.length === 0 && (
        <p className="outfit-page__empty">등록된 의상이 없습니다</p>
      )}

      <p className="outfit-page__camera-tip">
        * 사진 촬영 버튼을 누르고 좌측 카메라에 얼굴을 바라봐주세요.
        <br />
        10초후 촬영이 시작됩니다.
      </p>

      <div className="outfit-page__photo-btns">
        <button
          type="button"
          className="outfit-page__photo-btn outfit-page__photo-btn--primary"
          onClick={() => handlePhoto(false)}
          disabled={isLoading || isError}
        >
          <IconCamera size={42} aria-hidden />
          <span>사진촬영 (혼자 찍기)</span>
        </button>
        <button
          type="button"
          className="outfit-page__photo-btn outfit-page__photo-btn--dark"
          onClick={() => handlePhoto(true)}
          disabled={isLoading || isError}
        >
          <IconUsers size={42} aria-hidden />
          <span>사진촬영(with &apos;인사&apos;)</span>
        </button>
      </div>
    </PageBody>
  );
}

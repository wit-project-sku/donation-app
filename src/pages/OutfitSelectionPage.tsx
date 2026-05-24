import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchOutfits,
  getOutfitCategories,
  type Outfit,
} from "../api/outfits";
import { IconCamera, IconUsers } from "../components/Icon";
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

  const [activeCategory, setActiveCategory] = useState("");
  const [selected, setSelected] = useState<Outfit | null>(null);

  const { data: outfits = [], isLoading, isError } = useQuery({
    queryKey: ["outfits"],
    queryFn: () => fetchOutfits(50),
  });

  const categories = useMemo(() => getOutfitCategories(outfits), [outfits]);

  useEffect(() => {
    if (!selectedCampaign || !paymentMethod) {
      navigate("/complete", { replace: true });
    }
  }, [selectedCampaign, paymentMethod, navigate]);

  useEffect(() => {
    if (categories.length === 0) return;
    if (!activeCategory || !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const visible = outfits.filter((o) => o.category === activeCategory);

  const handlePhoto = () => {
    setSelectedOutfit(selected);
    setSkipPhoto(false);
    setCapturedPhotoUrl(null);
    navigate("/camera");
  };

  return (
    <PageBody className="outfit-page">
      <div className="outfit-page__section-header">
        <span className="outfit-page__step-badge">1</span>
        <div className="outfit-page__header-text">
          <h2 className="outfit-page__title">한복/의상 선택하기</h2>
          <p className="outfit-page__desc">
            * 원하시는 의상을 고르고 선택 완료 버튼을 눌러뒤 사진찰영 버튼을 눌러주세요
          </p>
        </div>
      </div>

      {isLoading && (
        <p className="outfit-page__status">의상 불러오는 중...</p>
      )}
      {isError && (
        <p className="outfit-page__status outfit-page__status--error">
          의상 목록을 불러오지 못했습니다
        </p>
      )}

      {!isLoading && !isError && categories.length > 0 && (
        <>
          <div className="outfit-page__tabs-wrap">
            <div className="outfit-page__tabs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`outfit-page__tab ${activeCategory === cat ? "outfit-page__tab--active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="outfit-page__grid">
            {visible.map((outfit) => {
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
            {visible.length === 0 && (
              <p className="outfit-page__empty">이 카테고리에 의상이 없습니다</p>
            )}
          </div>
        </>
      )}

      {!isLoading && !isError && outfits.length === 0 && (
        <p className="outfit-page__empty">등록된 의상이 없습니다</p>
      )}

      <div className="outfit-page__photo-btns">
        <button
          type="button"
          className="outfit-page__photo-btn outfit-page__photo-btn--primary"
          onClick={handlePhoto}
          disabled={isLoading || isError}
        >
          <IconCamera size={48} aria-hidden />
          <span>사진촬영 (혼자 찍기)</span>
        </button>
        <button
          type="button"
          className="outfit-page__photo-btn outfit-page__photo-btn--dark"
          onClick={handlePhoto}
          disabled={isLoading || isError}
        >
          <IconUsers size={48} aria-hidden />
          <span>사진촬영(with &apos;인사&apos;)</span>
        </button>
      </div>

      <div className="outfit-page__section2-card">
        <div className="outfit-page__section2-content">
          <span className="outfit-page__step-badge outfit-page__step-badge--plain">
            2
          </span>
          <div className="outfit-page__header-text">
            <h2 className="outfit-page__title">사진촬영</h2>
            <p className="outfit-page__desc">
              * 사진 촬영 버튼을 누르고 최측 카메라에 얼굴을 바라봐주세요.
              <br />
              10초후 촬영이 시작됩니다.
              <br />
              결과물은 QR을 통해 핸드폰에 저장하세요.
            </p>
            <p className="outfit-page__policy">[개인보호정책]</p>
          </div>
        </div>
        <div className="outfit-page__avatar-wrap" aria-hidden>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 91 155"
            fill="none"
            className="outfit-page__avatar-svg"
          >
            <g clipPath="url(#hanbok-clip)">
              <path
                d="M21.08 40.5181C21.08 40.5181 -1.57979 96.178 0.0855392 142.686C0.0855392 142.686 6.28282 143.726 7.57693 144.087L7.37585 147.69C7.37585 147.69 47.1117 164.478 82.8517 147.194L82.9239 144.087C82.9239 144.087 89.3171 143.276 90.7246 142.42C90.7246 142.42 90.7246 91.6043 69.4672 40.5231L60.6663 27.2374H28.6642L21.08 40.5231V40.5181Z"
                fill="#FFF0F0"
              />
            </g>
            <defs>
              <clipPath id="hanbok-clip">
                <rect width="91" height="155" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>
      </div>
    </PageBody>
  );
}

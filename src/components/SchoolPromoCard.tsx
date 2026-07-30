import "./SchoolPromoCard.css";

/** 교복 나눔 과정 스텝 (Figma 5951:75858) */
const STEPS = ["학교 선택", "교복 입어보기", "기부하기", "교복사진 저장", "교복 지원"];

/**
 * 후배에게 교복 사주기 안내 카드 (Figma 5951:76052 / 5930:46802).
 *
 * 학교 선택 화면 본문에 항상 노출되는 안내 카드. 초록 강조 타이틀 + 교복 나눔
 * 과정 일러스트(교복 착용 → 기부 → 전달) + 단계 뱃지 + 설명문으로 구성되며,
 * 2160px 키오스크 좌표계에 Figma 값 그대로 배치한다.
 */
export function SchoolPromoCard() {
  return (
    <div className="school-promo" data-node-id="5951:76052">
      {/* 타이틀 — Figma 5930:46789, 초록 Bold 80, line-height 110, 중앙 */}
      <p className="school-promo__title">
        선배의 추억이 후배의 새로운 시작이 될 수 있도록,
        <br />
        함께 교복 나눔에 참여해주세요.
      </p>

      {/* 과정 일러스트 — 교복 착용 → 기부 → 전달 (Figma 5951:75825/75836/75843) */}
      <img
        className="school-promo__img school-promo__img--wear"
        src="/icons/image 181.png"
        alt="교복 착용해보기"
      />
      <img
        className="school-promo__arrow school-promo__arrow--1"
        src="/icons/Polygon 13.png"
        alt=""
        aria-hidden
      />
      <img
        className="school-promo__img school-promo__img--donate"
        src="/icons/image 489.png"
        alt="기부하기"
      />
      <img
        className="school-promo__arrow school-promo__arrow--2"
        src="/icons/Polygon 13.png"
        alt=""
        aria-hidden
      />
      <img
        className="school-promo__img school-promo__img--give"
        src="/icons/image 185.png"
        alt="교복 전달"
      />

      {/* 단계 뱃지 — Figma 5951:75858, 연초록 배경 #e5ffed, Bold 48 검정 */}
      <div className="school-promo__steps">
        {STEPS.map((step, i) => (
          <span key={step} className="school-promo__step">
            {step}
            {i < STEPS.length - 1 && (
              <span className="school-promo__step-arrow" aria-hidden>
                →
              </span>
            )}
          </span>
        ))}
      </div>

      {/* 설명문 — Figma 5930:46791, Regular 40 #999, line-height 70 */}
      <p className="school-promo__body">
        매년 많은 교복이 성장과 졸업을 이유로 사용되지 못한 채 폐기되고 있습니다.
        하지만 누군가에게는 꼭 필요한 소중한 자원이 될 수 있습니다. 작은 나눔이
        모이면 후배들의 교육비 부담을 줄이고, 버려지는 교복을 다시 순환시키는 지속
        가능한 변화를 만들 수 있습니다.
      </p>
    </div>
  );
}

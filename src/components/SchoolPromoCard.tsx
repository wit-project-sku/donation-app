import { useTheme } from "../theme/ThemeContext";
import "./SchoolPromoCard.css";

/**
 * 교복주기 안내 카드 (Figma 5930:46802).
 *
 * 학교 선택 화면에서 (지역 미선택 + 검색어 없음) 진입 시, 전국 랭킹 표 자리에
 * 대신 노출하는 안내 카드. 코랄 헤더(테마색) + 회색 본문 + 교복 나눔 이미지로
 * 구성되며, 2160px 키오스크 좌표계에 Figma 값 그대로 배치한다.
 */
export function SchoolPromoCard() {
  const { theme } = useTheme();

  return (
    <div className="school-promo" data-node-id="5930:46802">
      {/* 코랄 헤더 배너 — Figma 5930:46801 (테마 main01), radius 45 */}
      <div className="school-promo__banner" style={{ background: theme.primary }}>
        <p className="school-promo__title">
          선배의 추억이 후배의 새로운 시작이 될 수 있도록,
          <br />
          함께 교복 나눔에 참여해주세요.
        </p>
      </div>

      {/* 본문 — Figma 5930:46791, Noto 50 #999, line-height 80 */}
      <p className="school-promo__body">
        매년 많은 교복이 성장과 졸업을 이유로 사용되지 못한 채 폐기되고 있습니다.
        하지만 누군가에게는 꼭 필요한 소중한 자원이 될 수 있습니다.
        <br />
        작은 나눔이 모이면 후배들의 교육비 부담을 줄이고, 버려지는 교복을 다시
        순환시키는 지속 가능한 변화를 만들 수 있습니다.
      </p>

      {/* 교복 나눔 이미지 — Figma 5930:46796, radius 45 */}
      <div className="school-promo__image">
        <img
          src="/icons/Gemini_Generated_Image_pzek2lpzek2lpzek 1.png"
          alt=""
          aria-hidden
        />
      </div>
    </div>
  );
}

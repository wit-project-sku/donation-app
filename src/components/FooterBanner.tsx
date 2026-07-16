import bannerBg from "../assets/school-banner-bg.png";
import bannerPhoto from "../assets/school-banner-photo.png";
import "./FooterBanner.css";

/**
 * 공통 하단 배너 (Figma 5890:102990): 2160×573 풀블리드.
 * 배경 사진(0.4 검정 딤) 위에 좌측 교복 사진(1184×572)을 얹고, 우측에 문구를 배치.
 * 기존 검정 파트너 바(AppFooter/PartnerBar)를 대체하며, 검정 바가 있던 모든 화면에서 쓴다.
 */
export function FooterBanner() {
  return (
    <div className="footer-banner">
      <div className="footer-banner__bg">
        <img src={bannerBg} alt="" className="footer-banner__bg-img" />
        <div className="footer-banner__dim" />
      </div>
      <div className="footer-banner__photo">
        <img src={bannerPhoto} alt="" className="footer-banner__photo-img" />
      </div>
      <p className="footer-banner__title">
        키오스크에서 교복 사진찍고
        <br />
        후배들에게 교복을 사주세요
      </p>
      <p className="footer-banner__eyebrow">
        기부도 하고 우리학교 교복도 입어보세요!
      </p>
    </div>
  );
}

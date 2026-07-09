import "./PartnerBar.css";

/** Figma 파트너 바 실 로고 (public/icons/) — 유니세프 / 세이브더칠드런 / 굿네이버스 */
const PARTNER_LOGOS = [
  { src: "/icons/image 365 (1).png", alt: "유니세프" },
  { src: "/icons/image 366.png", alt: "세이브더칠드런" },
  { src: "/icons/image 367.png", alt: "굿네이버스" },
];

/**
 * 하단 파트너 바 (Figma 5535:21528/5535:21541 등): 검정 배경 h572,
 * "위트글로벌은 국/내외 NGO와 기부 운동을 함께합니다." + 파트너 로고.
 * 캠페인 목록/상세 등 여러 화면에서 공통 사용.
 */
export function PartnerBar() {
  return (
    <div className="partner-bar">
      <p className="partner-bar__text">
        위트글로벌은 국/내외 NGO와 기부 운동을 함께합니다.
      </p>
      <div className="partner-bar__logos">
        {PARTNER_LOGOS.map((logo) => (
          <img key={logo.src} src={logo.src} alt={logo.alt} />
        ))}
      </div>
    </div>
  );
}

import unicefLogo from "../assets/logo-unicef.png";
import goodneighborsLogo from "../assets/logo-goodneighbors.png";
import savethechildrenLogo from "../assets/logo-savethechildren.png";
import "./AppFooter.css";

interface AppFooterProps {
  /** Show the grey tax-deduction note line above the black partner bar. */
  note?: boolean;
}

/** Shared kiosk footer: optional tax note + black partner bar (logos pending). */
export function AppFooter({ note = false }: AppFooterProps) {
  return (
    <footer className="app-footer">
      {note && (
        <p className="app-footer__note">
          기부금 전액이 현장 지원에 사용되며, 법정 기부금으로서 세액공제 혜택이 적용됩니다
        </p>
      )}
      <div className="app-footer__bar">
        <p className="app-footer__statement">
          위트글로벌은 국/내외 NGO와 기부 운동을 함께합니다.
        </p>
        <div className="app-footer__logos">
          <img
            src={savethechildrenLogo}
            alt="세이브더칠드런"
            className="app-footer__logo app-footer__logo--mark"
          />
          <img src={unicefLogo} alt="unicef" className="app-footer__logo" />
          <img
            src={goodneighborsLogo}
            alt="굿네이버스"
            className="app-footer__logo"
          />
        </div>
      </div>
    </footer>
  );
}

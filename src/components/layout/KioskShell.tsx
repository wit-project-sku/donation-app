import { useEffect, useRef, type CSSProperties } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { SideNav } from "../SideNav";
import "./KioskShell.css";

interface KioskShellProps {
  children: React.ReactNode;
}

const DESIGN_WIDTH = 2162.207;
const DESIGN_HEIGHT = 3840;

export function KioskShell({ children }: KioskShellProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const updateScale = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const scale = Math.min(
        window.innerWidth / DESIGN_WIDTH,
        window.innerHeight / DESIGN_HEIGHT,
      );
      stage.style.setProperty("--kiosk-scale", String(scale));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // Bridge the active theme (location + donation category) into CSS custom
  // properties so both inline `theme.primary` and CSS `var(--main-01)` / focus
  // rings recolor with the chosen NGO/학교 accent.
  const themeVars = {
    "--color-primary": theme.primary,
    "--main-01": theme.primary,
    "--color-primary-dark": theme.secondary,
    "--theme-primary": theme.primary,
    "--theme-secondary": theme.secondary,
    "--theme-on-primary": theme.text.onPrimary,
  } as CSSProperties;

  return (
    <div className="kiosk-viewport">
      <div className="kiosk-stage" ref={stageRef}>
        <div className="kiosk-content" style={themeVars}>
          {children}
          <SideNav />
        </div>
      </div>
    </div>
  );
}

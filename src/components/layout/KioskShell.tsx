import { useEffect, useRef } from "react";
import "./KioskShell.css";

interface KioskShellProps {
  children: React.ReactNode;
}

const DESIGN_WIDTH = 1820;
const DESIGN_HEIGHT = 2290;

export function KioskShell({ children }: KioskShellProps) {
  const stageRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="kiosk-viewport">
      <div className="kiosk-stage" ref={stageRef}>
        <div className="kiosk-content">{children}</div>
      </div>
    </div>
  );
}

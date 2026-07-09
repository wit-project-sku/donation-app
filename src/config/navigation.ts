import { getKioskBridge } from "../utils/kioskBridge";

/**
 * Call when the user taps the home icon / finishes the flow.
 * Embedded in the kiosk → reset and exit the webview back to the kiosk home.
 * Standalone browser → reset and return to the donation entry screen.
 */
export function finishDonationFlow(
  navigate: (path: string, options?: { replace?: boolean }) => void,
  resetSession: () => void,
) {
  resetSession();
  const bridge = getKioskBridge();
  if (bridge) {
    bridge.goKioskHome();
    return;
  }
  navigate("/", { replace: true });
}

export function resetAndGoHome(
  navigate: (path: string, options?: { replace?: boolean }) => void,
  resetSession: () => void,
) {
  resetSession();
  const bridge = getKioskBridge();
  if (bridge) {
    bridge.goKioskHome();
    return;
  }
  navigate("/", { replace: true });
}

/** 진입 라우트("/") — 기부 앱의 첫 화면. */
export const ENTRY_ROUTE = "/";

/**
 * 진입 화면에서 뒤로가기 = 기부 앱을 빠져나가 키오스크 메인 메뉴(WebView 를 띄운 이전 화면)로 복귀.
 * 앱 안에는 이전 단계가 없으므로 WebView 의 브라우저 히스토리를 한 단계 되돌린다.
 * (Unity 전용 '메뉴로 나가기' 브리지가 생기면 이 함수만 교체하면 된다.)
 */
export function exitDonationApp() {
  const bridge = getKioskBridge();
  if (bridge) {
    bridge.goKioskHome();
    return;
  }
  window.history.back();
}

/**
 * Explicit previous-step per route for the kiosk header back chevron.
 * HashRouter inside a WebView has no reliable browser history, so map it
 * explicitly. Pages may override by passing an explicit target to AppHeader.
 * Routes absent from this map (entry "/", "/certificate")
 * are forward-only / terminal and show no back chevron by default.
 */
const BACK_ROUTES: Record<string, string> = {
  "/school": "/",
  "/school-detail": "/school",
  "/school-amount": "/outfit",
  "/school-payment": "/school-amount",
  "/school-register": "/school-complete",
  "/school-certificate": "/school-register",
  "/school-wall": "/school-certificate",
  "/campaigns": "/",
  "/campaign": "/campaigns",
  "/amount": "/campaign",
  "/payment": "/amount",
  "/message": "/certificate-prompt",
  "/outfit": "/message",
  "/wall": "/certificate",
};

export function getBackRoute(pathname: string): string | null {
  return BACK_ROUTES[pathname] ?? null;
}

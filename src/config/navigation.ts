/** Call when the user finishes the kiosk flow — returns to entry screen */
export function finishDonationFlow(
  navigate: (path: string, options?: { replace?: boolean }) => void,
  resetSession: () => void,
) {
  resetSession();
  navigate("/", { replace: true });
}

/**
 * Explicit previous-step per route for the kiosk header back chevron.
 * HashRouter inside a WebView has no reliable browser history, so map it
 * explicitly. Pages may override by passing an explicit target to AppHeader.
 * Routes absent from this map (entry "/", "/message", "/certificate", "/wall")
 * are forward-only / terminal and show no back chevron by default.
 */
const BACK_ROUTES: Record<string, string> = {
  "/campaigns": "/",
  "/campaign": "/campaigns",
  "/amount": "/campaign",
  "/payment": "/amount",
  "/outfit": "/message",
  "/camera": "/outfit",
};

export function getBackRoute(pathname: string): string | null {
  return BACK_ROUTES[pathname] ?? null;
}

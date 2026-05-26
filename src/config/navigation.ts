/** Routes where the back button must not appear (forward-only or terminal steps) */
export const ROUTES_WITHOUT_BACK: ReadonlySet<string> = new Set([
  "/",
  "/message",
  "/wall",
]);

/** Explicit previous step for each route (do not rely on browser history in WebView) */
export const BACK_ROUTES: Record<string, string> = {
  "/amount": "/",
  "/payment": "/amount",
  "/message-review": "/message",
  "/outfit": "/message-review",
  "/certificate": "/outfit",
};

export function shouldShowBackButton(
  pathname: string,
  override?: boolean,
): boolean {
  if (override !== undefined) return override;
  return !ROUTES_WITHOUT_BACK.has(pathname);
}

export function getBackRoute(pathname: string): string | null {
  return BACK_ROUTES[pathname] ?? null;
}

/** Call when the user finishes the kiosk flow — returns to entry screen */
export function finishDonationFlow(
  navigate: (path: string, options?: { replace?: boolean }) => void,
  resetSession: () => void,
) {
  resetSession();
  navigate("/", { replace: true });
}

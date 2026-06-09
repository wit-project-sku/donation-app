/** Call when the user finishes the kiosk flow — returns to entry screen */
export function finishDonationFlow(
  navigate: (path: string, options?: { replace?: boolean }) => void,
  resetSession: () => void,
) {
  resetSession();
  navigate("/", { replace: true });
}

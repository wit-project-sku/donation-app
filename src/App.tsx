import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HashRouter, Route, Routes } from "react-router-dom";
import { LocationNavigate } from "./components/LocationNavigate";
import { AppLayout } from "./components/layout/AppLayout";
import { KioskShell } from "./components/layout/KioskShell";
import { AmountPage } from "./pages/AmountPage";
import { CampaignDetailPage } from "./pages/CampaignDetailPage";
import { CampaignsPage } from "./pages/CampaignsPage";
import { SchoolSelectPage } from "./pages/SchoolSelectPage";
import { SchoolDetailPage } from "./pages/SchoolDetailPage";
import { SchoolAmountPage } from "./pages/SchoolAmountPage";
import { SchoolPaymentPage } from "./pages/SchoolPaymentPage";
import { SchoolCompletePage } from "./pages/SchoolCompletePage";
import { SchoolRegisterPage } from "./pages/SchoolRegisterPage";
import { SchoolCertificatePage } from "./pages/SchoolCertificatePage";
import { SchoolWallPage } from "./pages/SchoolWallPage";
import { CertificatePromptPage } from "./pages/CertificatePromptPage";
import { EntryPage } from "./pages/EntryPage";
import { DonationCertificatePage } from "./pages/DonationCertificatePage";
import { MessagePage } from "./pages/MessagePage";
import { MobileCertificatePage } from "./pages/MobileCertificatePage";
import { OutfitSelectionPage } from "./pages/OutfitSelectionPage";
import { PaymentPage } from "./pages/PaymentPage";
import { WallPage } from "./pages/WallPage";
import { ThemeProvider } from "./theme/ThemeContext";
import { useKioskPhotoBridge } from "./hooks/useKioskPhotoBridge";
import { useDonationStore } from "./store/donationStore";

function LocationAwareApp() {
  const [searchParams] = useSearchParams();
  const location = searchParams.get("location") || "insadong";
  const navigate = useNavigate();
  const resetSession = useDonationStore((s) => s.resetSession);
  const idleTimerRef = useRef<number | null>(null);
  useKioskPhotoBridge();

  useEffect(() => {
    const resetToHome = () => {
      resetSession();
      navigate("/", { replace: true });
    };

    const clearIdleTimer = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
    };

    const startIdleTimer = () => {
      clearIdleTimer();
      idleTimerRef.current = window.setTimeout(resetToHome, 3 * 60 * 1000);
    };

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
      "click",
      "pointerdown",
    ] as const;

    startIdleTimer();

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, startIdleTimer, { passive: true });
    });

    window.addEventListener("focus", startIdleTimer);

    return () => {
      clearIdleTimer();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, startIdleTimer);
      });
      window.removeEventListener("focus", startIdleTimer);
    };
  }, [navigate, resetSession]);

  return (
    <ThemeProvider location={location}>
      <Routes>
        <Route path="/mobile-certificate" element={<MobileCertificatePage />} />
        <Route
          path="/*"
          element={
            <>
              <KioskShell>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<EntryPage />} />
                  <Route path="/school" element={<SchoolSelectPage />} />
                  <Route path="/school-detail" element={<SchoolDetailPage />} />
                  <Route path="/school-amount" element={<SchoolAmountPage />} />
                  <Route path="/school-payment" element={<SchoolPaymentPage />} />
                  <Route path="/school-complete" element={<SchoolCompletePage />} />
                  <Route path="/school-register" element={<SchoolRegisterPage />} />
                  <Route path="/school-certificate" element={<SchoolCertificatePage />} />
                  <Route path="/school-wall" element={<SchoolWallPage />} />
                  <Route path="/campaigns" element={<CampaignsPage />} />
                  <Route path="/campaign" element={<CampaignDetailPage />} />
                  <Route path="/amount" element={<AmountPage />} />
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route
                    path="/certificate-prompt"
                    element={<CertificatePromptPage />}
                  />
                  <Route path="/message" element={<MessagePage />} />
                  <Route path="/outfit" element={<OutfitSelectionPage />} />
                  <Route path="/certificate" element={<DonationCertificatePage />} />
                  <Route path="/wall" element={<WallPage />} />
                  <Route
                    path="/message-review"
                    element={<LocationNavigate to="/message" replace />}
                  />
                  <Route
                    path="/complete"
                    element={<LocationNavigate to="/message" replace />}
                  />
                  <Route
                    path="/thank-you"
                    element={<LocationNavigate to="/message" replace />}
                  />
                  <Route path="*" element={<LocationNavigate to="/" replace />} />
                </Route>
              </Routes>
              </KioskShell>
            </>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <LocationAwareApp />
    </HashRouter>
  );
}

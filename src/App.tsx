import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { KioskShell } from "./components/layout/KioskShell";
import { AmountPage } from "./pages/AmountPage";
import { CampaignDetailPage } from "./pages/CampaignDetailPage";
import { CampaignsPage } from "./pages/CampaignsPage";
import { CameraCapturePage } from "./pages/CameraCapturePage";
import { DonationCertificatePage } from "./pages/DonationCertificatePage";
import { MessagePage } from "./pages/MessagePage";
import { MessageReviewPage } from "./pages/MessageReviewPage";
import { MobileCertificatePage } from "./pages/MobileCertificatePage";
import { OutfitSelectionPage } from "./pages/OutfitSelectionPage";
import { PaymentPage } from "./pages/PaymentPage";
import { WallPage } from "./pages/WallPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/mobile-certificate" element={<MobileCertificatePage />} />
        <Route
          path="/*"
          element={
            <KioskShell>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<CampaignsPage />} />
                  <Route path="/campaigns" element={<Navigate to="/" replace />} />
                  <Route path="/campaign" element={<CampaignDetailPage />} />
                  <Route path="/amount" element={<AmountPage />} />
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/message" element={<MessagePage />} />
                  <Route path="/message-review" element={<MessageReviewPage />} />
                  <Route path="/outfit" element={<OutfitSelectionPage />} />
                  <Route path="/camera" element={<CameraCapturePage />} />
                  <Route path="/certificate" element={<DonationCertificatePage />} />
                  <Route path="/complete" element={<Navigate to="/message" replace />} />
                  <Route path="/wall" element={<WallPage />} />
                  <Route path="/thank-you" element={<Navigate to="/message" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </KioskShell>
          }
        />
      </Routes>
    </HashRouter>
  );
}

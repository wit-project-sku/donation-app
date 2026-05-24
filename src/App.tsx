import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { KioskShell } from "./components/layout/KioskShell";
import { AmountPage } from "./pages/AmountPage";
import { CampaignsPage } from "./pages/CampaignsPage";
import { CompletePage } from "./pages/CompletePage";
import { MessagePage } from "./pages/MessagePage";
import { MessageReviewPage } from "./pages/MessageReviewPage";
import { CameraCapturePage } from "./pages/CameraCapturePage";
import { DonationCertificatePage } from "./pages/DonationCertificatePage";
import { OutfitSelectionPage } from "./pages/OutfitSelectionPage";
import { PaymentPage } from "./pages/PaymentPage";
import { WallPage } from "./pages/WallPage";

export default function App() {
  return (
    <BrowserRouter>
      <KioskShell>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<CampaignsPage />} />
            <Route path="/campaigns" element={<Navigate to="/" replace />} />
            <Route path="/amount" element={<AmountPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/message" element={<MessagePage />} />
            <Route path="/message-review" element={<MessageReviewPage />} />
            <Route path="/outfit" element={<OutfitSelectionPage />} />
            <Route path="/camera" element={<CameraCapturePage />} />
            <Route path="/certificate" element={<DonationCertificatePage />} />
            <Route path="/complete" element={<CompletePage />} />
            <Route path="/wall" element={<WallPage />} />
            <Route path="/thank-you" element={<CompletePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </KioskShell>
    </BrowserRouter>
  );
}

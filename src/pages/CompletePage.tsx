import { useEffect } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { useDonationStore } from "../store/donationStore";

export function CompletePage() {
  const navigate = useAppNavigate();
  const { selectedCampaign, amount, paymentMethod } = useDonationStore();

  useEffect(() => {
    if (!selectedCampaign || amount <= 0 || !paymentMethod) {
      navigate("/payment", { replace: true });
      return;
    }
    navigate("/message", { replace: true });
  }, [selectedCampaign, amount, paymentMethod, navigate]);

  return null;
}

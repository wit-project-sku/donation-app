import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  buildWallColumns,
  fetchWallEntries,
  type WallEntry,
} from "../api/wall";
import { WallGiverCard } from "../components/WallGiverCard";
import { PageBody } from "../components/layout/PageBody";
import { finishDonationFlow } from "../config/navigation";
import { useDonationStore } from "../store/donationStore";
import "./WallPage.css";

const MARQUEE_TEXT = "THE WALL OF GIVERS";
const MARQUEE_REPEAT = 6;

function donationTypeLabel(
  entry: WallEntry,
  sessionType: "one-time" | "regular",
): string {
  if (entry.id === "current") {
    return sessionType === "regular" ? "정기 후원" : "일시 후원";
  }
  return entry.paymentMethod;
}

export function WallPage() {
  const navigate = useNavigate();
  const {
    message,
    donorName,
    amount,
    donationType,
    selectedCampaign,
    capturedPhotoUrl,
    selectedOutfit,
    submittedRecordId,
    resetSession,
  } = useDonationStore();

  const { data: entries = [], isLoading, isError } = useQuery({
    queryKey: ["wallEntries", { pageSize: 50 }],
    queryFn: () => fetchWallEntries({ pageSize: 50 }),
  });

  /** Local preview only until certificate POST succeeds */
  const userEntry: WallEntry | null =
    submittedRecordId == null
      ? {
          id: "current",
          message: message.trim(),
          donorName: donorName.trim(),
          amount: amount || 0,
          campaignName: selectedCampaign?.title ?? "",
          paymentMethod:
            donationType === "regular" ? "정기 후원" : "일시 후원",
          timeAgo: "NOW",
          photoUrl:
            capturedPhotoUrl ??
            selectedOutfit?.imageUrl ??
            selectedCampaign?.imageUrl,
          isNew: true,
        }
      : null;

  const allEntries = userEntry ? [userEntry, ...entries] : entries;
  const columns = buildWallColumns(allEntries, 5);

  return (
    <PageBody className="wall-page" scroll={false}>
      <header className="wall-page__header">
        <h1 className="wall-page__title">THE WALL OF GIVERS</h1>
        <div className="wall-page__marquee-wrap" aria-hidden>
          <div className="wall-page__marquee-track">
            {Array.from({ length: MARQUEE_REPEAT }, (_, i) => (
              <span key={i} className="wall-page__marquee-item">
                {MARQUEE_TEXT}
              </span>
            ))}
            {Array.from({ length: MARQUEE_REPEAT }, (_, i) => (
              <span key={`dup-${i}`} className="wall-page__marquee-item">
                {MARQUEE_TEXT}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="wall-page__swiper-panel" aria-label="Donor wall">
        {isLoading && <p className="wall-page__status">불러오는 중...</p>}
        {isError && (
          <p className="wall-page__status wall-page__status--error">
            기부 내역을 불러오지 못했습니다
          </p>
        )}
        {!isLoading && !isError && allEntries.length === 0 && (
          <p className="wall-page__status">표시할 기부 내역이 없습니다</p>
        )}
        {!isLoading && !isError && allEntries.length > 0 && (
          <div className="wall-page__swiper">
            <div className="wall-page__track">
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="wall-page__column">
                  {column.map((entry) => (
                    <WallGiverCard
                      key={entry.id}
                      donorName={entry.donorName}
                      message={entry.message}
                      amount={entry.amount}
                      campaignName={entry.campaignName}
                      campaignImageUrl={
                        entry.id === "current"
                          ? selectedCampaign?.imageUrl
                          : entry.photoUrl
                      }
                      donationType={donationTypeLabel(entry, donationType)}
                      photoUrl={entry.photoUrl}
                      isNew={entry.isNew}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <button
        type="button"
        className="wall-page__done"
        onClick={() => finishDonationFlow(navigate, resetSession)}
      >
        완료
      </button>
    </PageBody>
  );
}

import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { fetchWallEntries, type WallEntry } from "../api/wall";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { WallGiverCard } from "../components/WallGiverCard";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import { appendHangul, removeLastHangul } from "../utils/hangulInput";
import "./WallPage.css";

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
  const [search, setSearch] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const deferredSearch = useDeferredValue(search.trim());
  const searchRef = useRef<HTMLDivElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);

  const {
    donorName,
    amount,
    donationType,
    selectedCampaign,
    capturedPhotoUrl,
    selectedOutfit,
    submittedRecordId,
  } = useDonationStore();

  const { data: entries = [], isLoading, isError } = useQuery({
    queryKey: ["wallEntries", { pageSize: 50, keyword: deferredSearch }],
    queryFn: () => fetchWallEntries({ pageSize: 50, keyword: deferredSearch }),
  });

  useEffect(() => {
    if (!keyboardOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        searchRef.current?.contains(target) ||
        keyboardRef.current?.contains(target)
      ) {
        return;
      }
      setKeyboardOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [keyboardOpen]);

  const userEntry: WallEntry | null =
    submittedRecordId == null && selectedCampaign
      ? {
          id: "current",
          donorName: donorName.trim(),
          amount: amount || 0,
          campaignName: selectedCampaign.title,
          paymentMethod:
            donationType === "regular" ? "정기 후원" : "일시 후원",
          timeAgo: "NOW",
          photoUrl:
            capturedPhotoUrl ??
            selectedOutfit?.imageUrl ??
            selectedCampaign.imageUrl,
          isNew: true,
        }
      : null;

  const allEntries = userEntry ? [userEntry, ...entries] : entries;
  const visibleEntries = allEntries.slice(0, 3);
  const placeholderCount = Math.max(0, 6 - visibleEntries.length);

  const handleKeyPress = (key: string) => {
    if (key === "\n") {
      setKeyboardOpen(false);
      return;
    }
    setSearch((value) => appendHangul(value, key));
  };

  return (
    <PageBody className="wall-page" scroll={false}>
      <h1 className="wall-page__title">기억되는 나눔</h1>

      <div className="wall-page__search-wrap" ref={searchRef}>
        <input
          className="wall-page__search"
          type="text"
          placeholder="이름으로 검색해보세요!"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onFocus={() => setKeyboardOpen(true)}
          onClick={() => setKeyboardOpen(true)}
        />
        <Search className="wall-page__search-icon" size={74} strokeWidth={2.5} />
      </div>

      <p className="wall-page__subtitle">
        후원자님들의 따뜻한 마음에 감사드립니다.
      </p>

      <section className="wall-page__grid-panel" aria-label="기부자의 벽">
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
          <div className="wall-page__grid">
            {visibleEntries.map((entry) => (
              <WallGiverCard
                key={entry.id}
                donorName={entry.donorName}
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
            {Array.from({ length: placeholderCount }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="wall-page__placeholder-card"
              />
            ))}
          </div>
        )}
      </section>

      {keyboardOpen && (
        <div className="wall-page__keyboard" ref={keyboardRef}>
          <VirtualKeyboard
            onKeyPress={handleKeyPress}
            onBackspace={() => setSearch((value) => removeLastHangul(value))}
            onSpace={() => setSearch((value) => `${value} `)}
          />
        </div>
      )}
    </PageBody>
  );
}

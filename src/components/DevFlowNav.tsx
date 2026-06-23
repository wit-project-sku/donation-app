/**
 * 개발용 플로우 이동 바 — 디자인 확인용.
 *
 * ⚠️ 배포 전 제거: 이 파일과 App.tsx 의 <DevFlowNav /> 마운트 한 줄만 지우면 된다.
 *
 * 각 화면의 가드(조건 미충족 시 "/" 등으로 되돌리는 useEffect)를 건드리지 않고,
 * 이동 직전에 스토어의 빈 값만 채워(기존 입력은 보존) 가드를 통과시킨다.
 */
import { useLocation } from "react-router-dom";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { useDonationStore } from "../store/donationStore";
import type { Campaign } from "../types";
import type { Outfit } from "../api/outfits";
import "./DevFlowNav.css";

const FLOW: { path: string; label: string }[] = [
  { path: "/", label: "진입" },
  { path: "/campaigns", label: "캠페인" },
  { path: "/campaign", label: "상세" },
  { path: "/amount", label: "금액" },
  { path: "/payment", label: "결제" },
  { path: "/message", label: "증서발급" },
  { path: "/outfit", label: "의상" },
  { path: "/camera", label: "촬영" },
  { path: "/certificate", label: "증서" },
  { path: "/wall", label: "기부벽" },
];

/** 회색 1x1 placeholder (목업 이미지 깨짐 방지). */
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='8' height='8' fill='%23c8ccd2'/%3E%3C/svg%3E";

const MOCK_CAMPAIGN: Campaign = {
  id: "dev-preview",
  title: "[개발용] 미리보기 캠페인",
  description:
    "디자인 확인용 목업 캠페인입니다. 실제 데이터가 아닙니다. 케냐의 아미나(9)는 매일 4km를 걸어 학교에 갑니다.",
  imageUrl: PLACEHOLDER_IMG,
  amountOptions: [
    { label: "1만원", amount: 10000 },
    { label: "3만원", amount: 30000 },
    { label: "5만원", amount: 50000 },
    { label: "10만원", amount: 100000 },
  ],
  accumulatedAmount: 566600000,
  targetAmount: 1000000000,
  sections: [],
  programs: [
    { title: "교육 및 역량 개발", desc: "" },
    { title: "보건영양 활동 지원", desc: "" },
    { title: "사회정서 활동 지원", desc: "" },
  ],
};

const MOCK_OUTFIT: Outfit = {
  id: "dev-outfit",
  name: "[개발용] 의상",
  category: "PREMIUM",
  imageUrl: PLACEHOLDER_IMG,
  outfitCode: "DEV-0001",
  status: "ACTIVE",
  type: "PREMIUM",
};

const NO_SEED_PATHS = new Set(["/", "/campaigns", "/wall"]);

/** 빈 값만 채워 플로우 가드를 통과시킨다(기존 입력은 보존). 멱등. */
function ensureFlowState() {
  const store = useDonationStore.getState();
  if (!store.selectedCampaign) {
    if (store.donationCategory === "none") store.setDonationCategory("ngo");
    // setSelectedCampaign 은 세션을 초기화하므로 먼저 호출하고 이후 값을 채운다.
    store.setSelectedCampaign(MOCK_CAMPAIGN);
  }
  const s = useDonationStore.getState();
  if (s.amount <= 0) s.setAmount(10000);
  if (!s.paymentMethod) s.setPaymentMethod("card");
  if (!s.donorName.trim()) s.setDonorName("홍길동");
  if (!s.donorPhone.trim()) s.setDonorPhone("010-1234-5678");
  s.setSkipPhoto(false);
  if (!s.selectedOutfit) s.setSelectedOutfit(MOCK_OUTFIT);
}

export function DevFlowNav() {
  const navigate = useAppNavigate();
  const { pathname } = useLocation();

  const idx = FLOW.findIndex((f) => f.path === pathname);
  const current = idx >= 0 ? idx : 0;

  const go = (targetIdx: number) => {
    const clamped = Math.min(Math.max(0, targetIdx), FLOW.length - 1);
    const target = FLOW[clamped];
    if (!NO_SEED_PATHS.has(target.path)) ensureFlowState();
    navigate(target.path);
  };

  return (
    <div className="dev-flow-nav" role="navigation" aria-label="개발용 플로우 이동">
      <span className="dev-flow-nav__tag">DEV</span>
      <button
        type="button"
        className="dev-flow-nav__btn"
        onClick={() => go(current - 1)}
        disabled={current <= 0}
      >
        ◀
      </button>
      <span className="dev-flow-nav__label">
        {current + 1}/{FLOW.length} · {FLOW[current]?.label}
      </span>
      <button
        type="button"
        className="dev-flow-nav__btn"
        onClick={() => go(current + 1)}
        disabled={current >= FLOW.length - 1}
      >
        다음 ▶
      </button>
      <button
        type="button"
        className="dev-flow-nav__seed"
        onClick={() => ensureFlowState()}
        title="데모 데이터 채우기 (가드 통과용)"
      >
        🌱
      </button>
    </div>
  );
}

import type {
  Campaign,
  CampaignOrganizerCode,
  DonationCategory,
} from "../types";
import type { LocationTheme } from "./locations";
import savethechildrenLogo from "../assets/logo-savethechildren.png";
import unicefLogo from "../assets/logo-unicef.png";
import goodneighborsLogo from "../assets/logo-goodneighbors.png";
import schoolLogo from "../assets/logo-school.svg";

/**
 * 기부 캠페인을 주최하는 단체. 선택한 캠페인의 주최단체에 따라 강조색과 로고가
 * 바뀐다(레이아웃·기능은 동일). NGO 3종 + 학교.
 */
export type OrganizerId =
  | "savethechildren"
  | "unicef"
  | "goodneighbors"
  | "school";

const CODE_TO_ID: Record<CampaignOrganizerCode, OrganizerId> = {
  SAVE_THE_CHILDREN: "savethechildren",
  UNICEF: "unicef",
  GOOD_NEIGHBORS: "goodneighbors",
  SCHOOL: "school",
};

export interface Organizer {
  id: OrganizerId;
  /** 화면 문구·이미지 alt 에 쓰는 표시 이름 */
  label: string;
  /** 강조색(진행바·버튼·포커스링 등). Figma 지정 hex. */
  primary: string;
  /** 강조색의 밝은 변형(그라데이션·보조 요소) */
  secondary: string;
  /** 단체 로고(진행바·파트너 문구·기부증서) */
  logo: string;
  /** 캠페인 name/description 에서 주최단체를 추론하기 위한 키워드(소문자 비교) */
  keywords: string[];
}

export const ORGANIZERS: Record<OrganizerId, Organizer> = {
  savethechildren: {
    id: "savethechildren",
    label: "세이브더칠드런",
    primary: "#DA291C",
    secondary: "#E8584E",
    logo: savethechildrenLogo,
    keywords: [
      "세이브더칠드런",
      "세이브 더 칠드런",
      "save the children",
      "savethechildren",
    ],
  },
  unicef: {
    id: "unicef",
    label: "유니세프",
    primary: "#009FE3",
    secondary: "#33B4EC",
    logo: unicefLogo,
    keywords: ["유니세프", "unicef"],
  },
  goodneighbors: {
    id: "goodneighbors",
    label: "굿네이버스",
    primary: "#89A330",
    secondary: "#A6BD55",
    logo: goodneighborsLogo,
    keywords: ["굿네이버스", "good neighbors", "goodneighbors"],
  },
  school: {
    id: "school",
    // 학교 기부. 현재는 단일 초록 테마이지만, 추후 학교별 테마색으로 확장 가능.
    label: "학교",
    primary: "#30B95C",
    secondary: "#5ECA80",
    logo: schoolLogo, // image 448 자리표시(예시) — 실제 학교 엠블럼 제공 시 교체
    keywords: ["학교", "장학", "school"],
  },
};

/** NGO 캠페인의 주최단체를 못 찾았을 때 기본값(기존 동작과 동일하게 유니세프 파랑) */
const DEFAULT_NGO_ORGANIZER: OrganizerId = "unicef";

const NGO_ORGANIZERS: Organizer[] = [
  ORGANIZERS.savethechildren,
  ORGANIZERS.unicef,
  ORGANIZERS.goodneighbors,
];

function matchNgoOrganizerByText(text: string): OrganizerId | null {
  const haystack = text.toLowerCase();
  for (const org of NGO_ORGANIZERS) {
    if (org.keywords.some((kw) => haystack.includes(kw.toLowerCase()))) {
      return org.id;
    }
  }
  return null;
}

/**
 * 선택된 캠페인이 어느 주최단체의 것인지 판별한다.
 * 1순위: 캠페인의 organizer 필드(백엔드에서 운영자가 지정).
 * 2순위: 학교 기부 흐름(category === "school")은 학교 단체로 고정 — organizer 미지정이어도 초록 유지.
 * 3순위: organizer 미지정 NGO 캠페인은 이름/설명 키워드로 추론(전환기 안전망).
 * 최종 폴백: 유니세프(파랑) — 기존 동작과 동일.
 */
export function resolveOrganizer(
  campaign: Campaign | null,
  category: DonationCategory,
): Organizer {
  const code = campaign?.organizer;
  if (code && CODE_TO_ID[code]) return ORGANIZERS[CODE_TO_ID[code]];
  if (category === "school") return ORGANIZERS.school;
  if (campaign) {
    const matched = matchNgoOrganizerByText(
      `${campaign.title} ${campaign.description ?? ""}`,
    );
    if (matched) return ORGANIZERS[matched];
  }
  return ORGANIZERS[DEFAULT_NGO_ORGANIZER];
}

/**
 * 위치 테마의 강조색을 주최단체 색으로 덮어쓴다.
 * (기존 applyCategoryTheme 의 "단체별" 버전 — 색만 바뀌고 배경/텍스트는 위치 테마 유지)
 */
export function applyOrganizerTheme(
  base: LocationTheme,
  organizer: Organizer,
): LocationTheme {
  return {
    ...base,
    primary: organizer.primary,
    secondary: organizer.secondary,
    button: {
      ...base.button,
      border: organizer.primary,
      text: organizer.primary,
    },
    card: { ...base.card, border: organizer.primary },
  };
}

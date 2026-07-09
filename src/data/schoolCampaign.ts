import type { Campaign } from "../types";
import type { SchoolDto } from "../api/types";
import heroImg from "../assets/school-hero.jpg";

/** Figma 5591:40690 학교 소개문 (샘플) */
export const SCHOOL_DESCRIPTION =
  "대구원화여자고등학교는 1955년에 개교한 사립 여자고등학교로, 대구광역시 달서구에 위치하고 있습니다. 학생들의 창의성과 인성을 함께 키우는 교육을 목표로 하며, 다양한 진로·진학 프로그램을 운영하고 있습니다. 특히 자기주도 학습과 인문·예술 교육을 강화하여 학생들의 잠재력을 발휘할 수 있는 교육 환경을 제공하고 있습니다.";

/** Figma 5591:40610~40612 기부 사용처 3종 */
export const SCHOOL_PROGRAMS = [
  { title: "우수학생 장학금", desc: "" },
  { title: "학교 시설 개선", desc: "" },
  { title: "교복 지원", desc: "" },
];

/** "○○고" → "○○고등학교" 로 정규화 (Figma: 대구원화여자고 → 대구원화여자고등학교) */
function toSchoolFullName(name: string): string {
  return name.endsWith("고") ? `${name}등학교` : name;
}

export function buildSchoolCampaignFromDto(school: SchoolDto): Campaign {
  const title = toSchoolFullName(school.name);

  return {
    id: String(school.id),
    title,
    description: school.description?.trim()
      ? school.description
      : SCHOOL_DESCRIPTION,
    imageUrl: school.imageUrl?.trim() ? school.imageUrl : heroImg,
    organization: { id: school.id, type: "SCHOOL", name: title },
    amountOptions: [
      { label: "1만원", amount: 10000 },
      { label: "3만원", amount: 30000 },
      { label: "5만원", amount: 50000 },
      { label: "10만원", amount: 100000 },
    ],
    accumulatedAmount: school.accumulatedAmount ?? 0,
    // 백엔드 SchoolDto 에 목표액 필드가 없어 임시 목표액을 유지한다(모금 현황 바 계산용).
    targetAmount: 566600000,
    participantCount: school.participantCount ?? 0,
    studentCount: school.studentCount ?? 0,
    sections: [],
    programs: SCHOOL_PROGRAMS,
  };
}

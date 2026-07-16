import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchSchoolsPage } from "../api/schools";

/**
 * 학교 이름 → 로고(엠블럼) URL 조회.
 *
 * 왜 이런 우회가 필요한가:
 * 기부내역(기부한컷 벽)은 GET /api/donations/payment/history 를 쓰는데, 그 응답
 * (DonationKioskHistoryResponse)에는 학교 id 도 로고도 없고 학교 "이름"(targetName)만 있다.
 * 로고는 학교 API(DonationSchoolResponse.logoImageUrl)에만 있으므로, 학교 목록을 한 번
 * 받아 이름으로 맞춘다. 이름은 양쪽 다 같은 학교 레코드의 name 에서 오므로 정확히 일치한다.
 *
 * 백엔드가 기부내역 응답에 로고(또는 학교 id)를 넣어 주면 이 훅은 지우는 게 맞다.
 *
 * pageSize 200 — 현재 등록 학교는 2곳이라 한 번에 다 들어온다. 학교가 200곳을 넘으면
 * 못 찾은 학교는 기본 엠블럼으로 떨어질 뿐(화면이 깨지지는 않는다).
 */
export function useSchoolLogoByName(): (schoolName: string | undefined) => string | undefined {
  const { data } = useQuery({
    queryKey: ["schoolLogos"],
    queryFn: () => fetchSchoolsPage({ pageNum: 1, pageSize: 200 }),
    // 로고는 거의 안 바뀐다 — 벽을 넘길 때마다 다시 받지 않게 길게 잡는다.
    staleTime: 10 * 60_000,
  });

  const byName = useMemo(() => {
    const map = new Map<string, string>();
    for (const school of data?.content ?? []) {
      const logo = school.logoImageUrl?.trim();
      const name = school.name?.trim();
      if (logo && name) map.set(name, logo);
    }
    return map;
  }, [data]);

  return useMemo(
    () => (schoolName?: string) => {
      const key = schoolName?.trim();
      return key ? byName.get(key) : undefined;
    },
    [byName],
  );
}

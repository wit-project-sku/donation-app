/**
 * 학교 기부 랭킹의 "순위 변동" 배지(▲/▼) 데이터를 계산한다.
 *
 * 백엔드가 순위 변동을 내려주지 않으므로, 24시간마다 갱신되는 랭킹 스냅샷을
 * localStorage 에 저장해 "하루 전 순위"와 현재 순위를 비교한다.
 * - 반환값: schoolId → delta (양수=상승 ▲, 음수=하락 ▼, null=기준 없음/신규)
 * - 스냅샷은 없거나 24시간이 지났을 때만 현재 순위로 롤오버한다(=하루 1회 기준 갱신).
 * 필터(초성/검색)별로 순위 집합이 다르므로 viewKey 로 스냅샷을 분리한다.
 */
const SNAPSHOT_KEY = "school-rank-snapshots-v1";
export const RANK_SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface RankSnapshot {
  ts: number;
  ranks: Record<string, number>;
}

type SnapshotStore = Record<string, RankSnapshot>;

function readStore(): SnapshotStore {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as SnapshotStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: SnapshotStore): void {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(store));
  } catch {
    /* 저장 실패는 무시 (프라이빗 모드 등) */
  }
}

function currentRankMap(
  schools: Array<{ id: string | number }>,
): Record<string, number> {
  const ranks: Record<string, number> = {};
  schools.forEach((school, index) => {
    ranks[String(school.id)] = index + 1;
  });
  return ranks;
}

/**
 * 현재 랭킹을 하루 전 스냅샷과 비교해 순위 변동 맵을 만든다(읽기 전용, 순수 함수).
 * @param viewKey 필터 컨텍스트별 스냅샷 키 (예: `ㄱ:` / `all:역삼`)
 * @returns schoolId → delta (양수=상승 ▲, 음수=하락 ▼, null=기준 없음/신규)
 */
export function readRankChanges(
  viewKey: string,
  schools: Array<{ id: string | number }>,
): Record<string, number | null> {
  const currentRanks = currentRankMap(schools);
  const snapshot = readStore()[viewKey];

  const changes: Record<string, number | null> = {};
  for (const school of schools) {
    const key = String(school.id);
    const previousRank = snapshot?.ranks?.[key];
    // delta > 0 → 순위 상승(숫자 작아짐), delta < 0 → 하락
    changes[key] =
      previousRank != null ? previousRank - currentRanks[key] : null;
  }
  return changes;
}

/**
 * 기준 스냅샷이 없거나 24시간이 지났으면 현재 순위로 갱신한다(하루 1회 기준 롤오버).
 * 부수효과 전용 — 렌더 이후(useEffect)에서 호출한다.
 */
export function rollRankSnapshot(
  viewKey: string,
  schools: Array<{ id: string | number }>,
): void {
  const store = readStore();
  const snapshot = store[viewKey];
  const now = Date.now();
  if (snapshot && now - snapshot.ts < RANK_SNAPSHOT_TTL_MS) return;
  store[viewKey] = { ts: now, ranks: currentRankMap(schools) };
  writeStore(store);
}

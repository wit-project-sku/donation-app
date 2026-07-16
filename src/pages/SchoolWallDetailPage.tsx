import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { FooterBanner } from "../components/FooterBanner";
import type { WallEntry } from "../api/wall";
import { useSchoolLogoByName } from "../hooks/useSchoolLogo";
import schoolEmblem from "../assets/school-emblem.png";
import "./SchoolWallDetailPage.css";

/** "2026-05-22T…" → "2026.05.22" */
function formatDotDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}.${mm}.${dd}`;
}

/**
 * 기부한컷 크게 보기 (Figma 5843:90570).
 * 기부내역 벽(/school-wall)에서 카드를 누르면 해당 기부한컷을 큰 화면으로 본다.
 * 증서 화면과 같은 카드지만 QR·저장 액션은 없는 읽기 전용 화면이다.
 * 선택한 항목은 라우터 state 로 전달받는다(목록에서 이미 불러온 데이터 재사용).
 */
export function SchoolWallDetailPage() {
  const navigate = useAppNavigate();
  const { state } = useLocation();
  const entry = (state as { entry?: WallEntry } | null)?.entry ?? null;
  // 기부내역 응답에 로고가 없어 학교명으로 찾는다(훅 규칙상 early return 위에서 호출).
  const logoByName = useSchoolLogoByName();

  // 직접 진입(새로고침 등)으로 항목이 없으면 목록으로 되돌린다.
  useEffect(() => {
    if (!entry) navigate("/school-wall", { replace: true });
  }, [entry, navigate]);

  if (!entry) return null;

  const hasPhoto = Boolean(entry.photoUrl?.trim());
  // 못 찾으면(신규 학교·200곳 초과 등) 기본 엠블럼으로 폴백 — 기존 동작 유지.
  const schoolLogo = logoByName(entry.campaignName) ?? schoolEmblem;

  return (
    <PageBody className="school-wall-detail" scroll={false}>
      <AppHeader title="기부" backTo="/school-wall" />

      <div className="swd-body">
        {/* 기부한컷 카드 — Figma 5843:90593: 1078×1916, radius 38.
            사진 있음 → 사진 / 없음 → 어두운 배경 + 학교 엠블럼 중앙 (벽·증서와 동일 규칙) */}
        <div className={`swd-photo${hasPhoto ? "" : " swd-photo--empty"}`}>
          {hasPhoto ? (
            <img className="swd-photo__img" src={entry.photoUrl} alt="기부한컷" />
          ) : (
            <img className="swd-photo__emblem" src={schoolLogo} alt="" />
          )}

          {/* 하단 오버레이 — Figma 5843:90594: rgba(0,0,0,.5), h161 */}
          <div className="swd-photo__overlay">
            <img className="swd-photo__badge" src={schoolLogo} alt="" />
            <span className="swd-photo__caption">{entry.campaignName}</span>
          </div>
        </div>

        {/* 날짜 · 이름 — Figma 5843:90596~90600 */}
        <div className="swd-meta">
          <span className="swd-meta__line swd-meta__line--left" aria-hidden />
          <span className="swd-meta__date">{formatDotDate(entry.donatedAt)}</span>
          <span className="swd-meta__name">{entry.donorName}</span>
          <span className="swd-meta__line swd-meta__line--right" aria-hidden />
        </div>
      </div>

      <FooterBanner />
    </PageBody>
  );
}

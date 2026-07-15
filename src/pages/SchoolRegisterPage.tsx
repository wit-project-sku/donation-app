import { useMemo, useState } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { PageBody } from "../components/layout/PageBody";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { IconCheck } from "../components/Icon";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { appendKeyboardInput, removeLastHangul } from "../utils/hangulInput";
import "./SchoolRegisterPage.css";

const MAX_NAME_LENGTH = 20;
/** 졸업연도 드롭다운 시작 연도 (1980 ~ 현재) */
const START_YEAR = 1980;

/** 개인정보 처리방침 본문 — Figma 5827:170942 (문구 그대로). */
const PRIVACY_SECTIONS: { heading: string; lines: string[] }[] = [
  {
    heading: "1. 개인정보의 수집 항목 및 방법",
    lines: [
      "당사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다:",
      "필수항목: 사진 파일 및 관련 메타데이터",
      "수집 방법: 사용자가 키오스크에서 의상을 선택후 사진촬영을 통해 생성되는 합성 사진 정보",
    ],
  },
  {
    heading: "2. 개인정보의 수집 및 이용 목적",
    lines: [
      "당사는 수집한 개인정보를 다음과 같은 목적을 위해 이용합니다:",
      "서비스 제공: 사용자에게 사진 합성 사진 데이터 제공",
      "알림 및 마케팅: 이벤트, 프로모션, 광고 등 사용자 맞춤형 정보를 제공하기 위한 활용",
    ],
  },
  {
    heading: "3. 개인정보의 보유 및 이용 기간",
    lines: [
      "당사는 사용자의 개인정보를 수집한 목적을 달성할 때까지 보유하며, 이용 목적이 달성된 후에는 즉시 안전하게 파기합니다. 사용자가 탈퇴를 요청하거나 이용을 중단할 경우에도 개인정보는 관련 법령에 따라 일정 기간 보유한 후 파기됩니다.",
    ],
  },
  {
    heading: "4. 개인정보의 제3자 제공",
    lines: [
      "당사는 사용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만, 다음과 같은 경우에 한해 개인정보를 제공할 수 있습니다:",
      "법적 의무: 법령에 의한 요구나 법적 절차에 따르는 경우",
      "서비스 제공을 위한 제휴사: 기능 및 프로모션 제공을 위해 필요한 외부 업체와의 협력 시, 최소한의 개인정보를 공유할 수 있습니다.",
      "사용자의 사전 동의: 사용자가 동의한 경우에 한해 개인정보를 제공할 수 있습니다.",
    ],
  },
  {
    heading: "5. 개인정보의 안전성 확보 조치",
    lines: [
      "당사는 사용자의 개인정보를 보호하기 위해 다음과 같은 조치를 취하고 있습니다:",
      "데이터 암호화: 개인정보를 암호화하여 저장하고 전송합니다.",
      "접근 제한: 개인정보에 대한 접근을 필요한 직원 및 제휴사로 제한합니다.",
      "보안 업데이트: 정기적인 보안 점검 및 업데이트를 통해 시스템의 취약점을 방지합니다.",
    ],
  },
  {
    heading: "6. 개인정보 처리방침의 변경",
    lines: [
      "본 개인정보 처리방침은 법적 요구사항이나 서비스 변경에 따라 수정될 수 있습니다. 변경 사항이 있을 경우, 변경된 사항을 앱 내 또는 웹사이트를 통해 고지합니다.",
    ],
  },
  {
    heading: "7. 개인정보 보호 담당자",
    lines: ["담당자: 진현욱 & 김은희", "연락처: company @witworldwide.com"],
  },
];

/**
 * 학교 기부한컷 등록 화면 (Figma 5659:87121 열림 / 5597:41982 입력).
 * 졸업연도(1980~현재) + 이름/닉네임 + 동의 후 등록하기.
 */
export function SchoolRegisterPage() {
  const navigate = useAppNavigate();
  const { theme } = useTheme();
  const {
    selectedCampaign,
    donorName,
    setDonorName,
    graduationYear,
    setGraduationYear,
  } = useDonationStore();

  // 1980 ~ 현재 연도 (최신순: 현재 연도가 맨 위)
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    const count = current - START_YEAR + 1;
    return Array.from({ length: count }, (_, i) => current - i);
  }, []);

  const selectedYear = graduationYear ?? years[0];
  const [yearOpen, setYearOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  const canSubmit = donorName.trim().length > 0 && consent;

  const handleKeyPress = (key: string) => {
    if (key === "\n") return;
    const next = appendKeyboardInput(donorName, key);
    if (next.length > MAX_NAME_LENGTH) return;
    setDonorName(next);
  };

  const register = () => {
    if (!canSubmit) return;
    setGraduationYear(selectedYear);
    navigate("/school-certificate");
  };

  if (!selectedCampaign) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <PageBody className="school-register" scroll={false}>
      {/* Figma I5597:41985;1233:2178 — 서브타이틀 문구 + brown02(#8b7355) */}
      <AppHeader
        title="기부"
        backTo="/school-complete"
        subtitle="당신의 마음이 필요한 곳에 전해집니다"
      />

      <div className="sr-body">
        {/* 기부한컷 받기 카드 — Figma 5659:87140 초록 테두리 15px */}
        <div className="sr-card" style={{ borderColor: theme.primary }}>
          <h2 className="sr-card__title" style={{ color: theme.primary }}>
            기부한컷 받기
          </h2>

          <div className="sr-fields">
            {/* 졸업연도 드롭다운 */}
            <div className="sr-field sr-field--year">
              <span className="sr-field__label">졸업연도</span>
              <button
                type="button"
                className="sr-select"
                onClick={() => setYearOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={yearOpen}
              >
                <span className="sr-select__value">{selectedYear}</span>
                <span
                  className="sr-select__arrow"
                  style={{ color: theme.primary }}
                  aria-hidden
                >
                  ▼
                </span>
              </button>

              {yearOpen && (
                <ul className="sr-options" role="listbox">
                  {years.map((year) => (
                    <li key={year} role="option" aria-selected={year === selectedYear}>
                      <button
                        type="button"
                        className={`sr-option${year === selectedYear ? " is-selected" : ""}`}
                        style={
                          year === selectedYear
                            ? { color: theme.primary }
                            : undefined
                        }
                        onClick={() => {
                          setGraduationYear(year);
                          setYearOpen(false);
                        }}
                      >
                        {year}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 이름/닉네임 */}
            <div className="sr-field sr-field--name">
              <span className="sr-field__label">이름/닉네임 :</span>
              <div className="sr-input">
                <span className="sr-input__value">{donorName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 동의 — [개인보호정책] 은 별도 버튼(중첩 버튼 금지)이며 누르면 처리방침 팝업 */}
        <div className="sr-consent">
          <button
            type="button"
            className="sr-consent__toggle"
            onClick={() => setConsent((v) => !v)}
            aria-pressed={consent}
            aria-label="개인정보 수집 동의"
          >
            <span
              className={`sr-check${consent ? " is-on" : ""}`}
              style={consent ? { backgroundColor: theme.primary } : undefined}
            >
              <IconCheck size={48} strokeWidth={3} aria-hidden />
            </span>
          </button>
          <p className="sr-consent__text">
            <button
              type="button"
              className="sr-policy-link"
              onClick={() => setPolicyOpen(true)}
            >
              [개인보호정책]
            </button>{" "}
            서비스 제공을 위해 이용자의 정보 수집을 동의합니다.
          </p>
        </div>

        {/* 등록하기 — 미완성 회색 / 완성 시 테마 초록 */}
        <button
          type="button"
          className="sr-submit"
          style={canSubmit ? { backgroundColor: theme.primary } : undefined}
          onClick={register}
          disabled={!canSubmit}
        >
          등록하기
        </button>
      </div>

      <div className="sr-keyboard">
        <VirtualKeyboard
          onKeyPress={handleKeyPress}
          onBackspace={() => setDonorName(removeLastHangul(donorName))}
          onSpace={() =>
            donorName.length < MAX_NAME_LENGTH && setDonorName(`${donorName} `)
          }
        />
      </div>

      <AppFooter note />

      {/* 개인정보 처리방침 — Figma 5827:170940 (1820×2574, radius 53.625) */}
      {policyOpen && (
        <div
          className="sr-policy-dim"
          role="presentation"
          onClick={() => setPolicyOpen(false)}
        >
          <div className="sr-policy" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="sr-policy__close"
              aria-label="닫기"
              onClick={() => setPolicyOpen(false)}
            >
              ✕
            </button>
            <div className="sr-policy__body">
              <h2 className="sr-policy__title">개인정보 처리방침</h2>
              {PRIVACY_SECTIONS.map((section) => (
                <section key={section.heading} className="sr-policy__section">
                  <h3 className="sr-policy__heading">{section.heading}</h3>
                  {section.lines.map((line) => (
                    <p key={line} className="sr-policy__line">
                      {line}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageBody>
  );
}

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
      <AppHeader
        title="기부"
        backTo="/school-complete"
        subtitle="졸업연도와 이름을 입력해주세요"
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

        {/* 동의 — Figma 5597:42020 */}
        <button
          type="button"
          className="sr-consent"
          onClick={() => setConsent((v) => !v)}
          aria-pressed={consent}
        >
          <span
            className={`sr-check${consent ? " is-on" : ""}`}
            style={consent ? { backgroundColor: theme.primary } : undefined}
          >
            <IconCheck size={48} strokeWidth={3} aria-hidden />
          </span>
          <span className="sr-consent__text">
            서비스 제공을 위해 이용자의 합성된 이미지는 WITH 플랫폼에 저장됩니다.
          </span>
        </button>

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
    </PageBody>
  );
}

import { useState } from "react";
import { IconDelete, IconGlobe, IconShift } from "./Icon";
import "./VirtualKeyboard.css";

type KeyboardLayout = "korean" | "english";

const ROW1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const KO_ROW2 = ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"];
const KO_ROW3 = ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"];
const KO_ROW4 = ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ", "-"];
const EN_ROW2 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const EN_ROW3 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
const EN_ROW4 = ["z", "x", "c", "v", "b", "n", "m", ",", "."];

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
}

export function VirtualKeyboard({
  onKeyPress,
  onBackspace,
  onSpace,
}: VirtualKeyboardProps) {
  const [layout, setLayout] = useState<KeyboardLayout>("korean");
  const [shift, setShift] = useState(false);

  const toggleLayout = () => {
    setLayout((current) => (current === "korean" ? "english" : "korean"));
    setShift(false);
  };

  const formatKey = (key: string) => {
    if (layout === "english" && shift && /[a-z]/.test(key)) {
      return key.toUpperCase();
    }
    return key;
  };

  const handleKeyPress = (key: string) => {
    onKeyPress(formatKey(key));
    if (layout === "english" && shift) {
      setShift(false);
    }
  };

  const row2 = layout === "korean" ? KO_ROW2 : EN_ROW2;
  const row3 = layout === "korean" ? KO_ROW3 : EN_ROW3;
  const row4 = layout === "korean" ? KO_ROW4 : EN_ROW4;

  return (
    <div className="virtual-keyboard">
      <div className="virtual-keyboard__row">
        {ROW1.map((key) => (
          <button
            key={key}
            type="button"
            className="virtual-keyboard__key"
            onClick={() => handleKeyPress(key)}
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          className="virtual-keyboard__key virtual-keyboard__key--special"
          onClick={onBackspace}
          aria-label="삭제"
        >
          <IconDelete size={30} />
        </button>
      </div>

      <div className="virtual-keyboard__row virtual-keyboard__row--narrow">
        {row2.map((key) => (
          <button
            key={`${layout}-r2-${key}`}
            type="button"
            className="virtual-keyboard__key"
            onClick={() => handleKeyPress(key)}
          >
            {formatKey(key)}
          </button>
        ))}
      </div>

      <div className="virtual-keyboard__row virtual-keyboard__row--middle">
        {row3.map((key) => (
          <button
            key={`${layout}-r3-${key}`}
            type="button"
            className="virtual-keyboard__key"
            onClick={() => handleKeyPress(key)}
          >
            {formatKey(key)}
          </button>
        ))}
        <button
          type="button"
          className="virtual-keyboard__key virtual-keyboard__key--return"
          onClick={() => onKeyPress("\n")}
          aria-label="줄바꿈"
        >
          ↵
        </button>
      </div>

      <div className="virtual-keyboard__row virtual-keyboard__row--bottom">
        <button
          type="button"
          className={`virtual-keyboard__key virtual-keyboard__key--special${layout === "english" && shift ? " virtual-keyboard__key--active" : ""}`}
          onClick={() => layout === "english" && setShift((current) => !current)}
          aria-label={layout === "english" ? "대소문자 전환" : "자판 전환"}
          aria-pressed={layout === "english" ? shift : undefined}
        >
          <IconShift size={30} />
        </button>
        {row4.map((key) => (
          <button
            key={`${layout}-r4-${key}`}
            type="button"
            className="virtual-keyboard__key"
            onClick={() => handleKeyPress(key)}
          >
            {formatKey(key)}
          </button>
        ))}
      </div>

      <div className="virtual-keyboard__row virtual-keyboard__row--space">
        <button
          type="button"
          className={`virtual-keyboard__key virtual-keyboard__key--globe${layout === "english" ? " virtual-keyboard__key--active" : ""}`}
          onClick={toggleLayout}
          aria-label={layout === "korean" ? "영문 자판으로 전환" : "한글 자판으로 전환"}
          aria-pressed={layout === "english"}
        >
          <IconGlobe size={28} />
          <span className="virtual-keyboard__layout-label">
            {layout === "korean" ? "한" : "En"}
          </span>
        </button>
        <button
          type="button"
          className="virtual-keyboard__key virtual-keyboard__key--spacebar"
          onClick={onSpace}
        >
          Space
        </button>
      </div>
    </div>
  );
}

import { IconDelete, IconGlobe, IconShift } from "./Icon";
import "./VirtualKeyboard.css";

const ROW1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const ROW2 = ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"];
const ROW3 = ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"];
const ROW4 = ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ", "-"];

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
}

export function VirtualKeyboard({ onKeyPress, onBackspace, onSpace }: VirtualKeyboardProps) {
  return (
    <div className="virtual-keyboard">
      {/* Row 1 — numbers + backspace */}
      <div className="virtual-keyboard__row">
        {ROW1.map((k) => (
          <button key={k} type="button" className="virtual-keyboard__key" onClick={() => onKeyPress(k)}>
            {k}
          </button>
        ))}
        <button type="button" className="virtual-keyboard__key virtual-keyboard__key--special" onClick={onBackspace} aria-label="Delete">
          <IconDelete size={28} />
        </button>
      </div>

      {/* Row 2 — top consonants/vowels */}
      <div className="virtual-keyboard__row">
        {ROW2.map((k) => (
          <button key={k} type="button" className="virtual-keyboard__key" onClick={() => onKeyPress(k)}>
            {k}
          </button>
        ))}
      </div>

      {/* Row 3 — middle consonants/vowels + return */}
      <div className="virtual-keyboard__row">
        {ROW3.map((k) => (
          <button key={k} type="button" className="virtual-keyboard__key" onClick={() => onKeyPress(k)}>
            {k}
          </button>
        ))}
        <button type="button" className="virtual-keyboard__key virtual-keyboard__key--special" onClick={() => onKeyPress("\n")} aria-label="Return">
          ↵
        </button>
      </div>

      {/* Row 4 — shift + bottom consonants (no backspace on right) */}
      <div className="virtual-keyboard__row">
        <button type="button" className="virtual-keyboard__key virtual-keyboard__key--special" aria-label="Shift">
          <IconShift size={28} />
        </button>
        {ROW4.map((k) => (
          <button key={k} type="button" className="virtual-keyboard__key" onClick={() => onKeyPress(k)}>
            {k}
          </button>
        ))}
      </div>

      {/* Row 5 — globe + space */}
      <div className="virtual-keyboard__row">
        <button type="button" className="virtual-keyboard__key virtual-keyboard__key--special virtual-keyboard__key--globe" aria-label="Language">
          <IconGlobe size={28} />
        </button>
        <button type="button" className="virtual-keyboard__key virtual-keyboard__key--spacebar" onClick={onSpace}>
          Space
        </button>
      </div>
    </div>
  );
}

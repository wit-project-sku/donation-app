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

export function VirtualKeyboard({
  onKeyPress,
  onBackspace,
  onSpace,
}: VirtualKeyboardProps) {
  return (
    <div className="virtual-keyboard">
      <div className="virtual-keyboard__row">
        {ROW1.map((key) => (
          <button key={key} type="button" className="virtual-keyboard__key" onClick={() => onKeyPress(key)}>
            {key}
          </button>
        ))}
        <button type="button" className="virtual-keyboard__key virtual-keyboard__key--special" onClick={onBackspace} aria-label="삭제">
          <IconDelete size={30} />
        </button>
      </div>

      <div className="virtual-keyboard__row virtual-keyboard__row--narrow">
        {ROW2.map((key) => (
          <button key={key} type="button" className="virtual-keyboard__key" onClick={() => onKeyPress(key)}>
            {key}
          </button>
        ))}
      </div>

      <div className="virtual-keyboard__row virtual-keyboard__row--middle">
        {ROW3.map((key) => (
          <button key={key} type="button" className="virtual-keyboard__key" onClick={() => onKeyPress(key)}>
            {key}
          </button>
        ))}
        <button type="button" className="virtual-keyboard__key virtual-keyboard__key--return" onClick={() => onKeyPress("\n")} aria-label="줄바꿈">
          ↵
        </button>
      </div>

      <div className="virtual-keyboard__row virtual-keyboard__row--bottom">
        <button type="button" className="virtual-keyboard__key virtual-keyboard__key--special" aria-label="자판 전환">
          <IconShift size={30} />
        </button>
        {ROW4.map((key) => (
          <button key={key} type="button" className="virtual-keyboard__key" onClick={() => onKeyPress(key)}>
            {key}
          </button>
        ))}
      </div>

      <div className="virtual-keyboard__row virtual-keyboard__row--space">
        <button type="button" className="virtual-keyboard__key virtual-keyboard__key--globe" aria-label="언어">
          <IconGlobe size={28} />
        </button>
        <button type="button" className="virtual-keyboard__key virtual-keyboard__key--spacebar" onClick={onSpace}>
          Space
        </button>
      </div>
    </div>
  );
}

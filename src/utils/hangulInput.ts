const INITIALS = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const VOWELS = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ",
  "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
];

const FINALS = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ",
  "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const COMPOUND_VOWELS: Record<string, string> = {
  "ㅗㅏ": "ㅘ",
  "ㅗㅐ": "ㅙ",
  "ㅗㅣ": "ㅚ",
  "ㅜㅓ": "ㅝ",
  "ㅜㅔ": "ㅞ",
  "ㅜㅣ": "ㅟ",
  "ㅡㅣ": "ㅢ",
};

const COMPOUND_FINALS: Record<string, string> = {
  "ㄱㅅ": "ㄳ",
  "ㄴㅈ": "ㄵ",
  "ㄴㅎ": "ㄶ",
  "ㄹㄱ": "ㄺ",
  "ㄹㅁ": "ㄻ",
  "ㄹㅂ": "ㄼ",
  "ㄹㅅ": "ㄽ",
  "ㄹㅌ": "ㄾ",
  "ㄹㅍ": "ㄿ",
  "ㄹㅎ": "ㅀ",
  "ㅂㅅ": "ㅄ",
};

const SPLIT_FINALS: Record<string, [string, string]> = Object.fromEntries(
  Object.entries(COMPOUND_FINALS).map(([pair, combined]) => [
    combined,
    [pair[0], pair[1]],
  ]),
);

function isSyllable(char: string) {
  const code = char.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3;
}

function compose(initial: string, vowel: string, final = "") {
  const initialIndex = INITIALS.indexOf(initial);
  const vowelIndex = VOWELS.indexOf(vowel);
  const finalIndex = FINALS.indexOf(final);

  if (initialIndex < 0 || vowelIndex < 0 || finalIndex < 0) {
    return `${initial}${vowel}${final}`;
  }

  return String.fromCharCode(
    0xac00 + (initialIndex * 21 + vowelIndex) * 28 + finalIndex,
  );
}

function decompose(char: string) {
  const code = char.charCodeAt(0) - 0xac00;
  const initialIndex = Math.floor(code / 588);
  const vowelIndex = Math.floor((code % 588) / 28);
  const finalIndex = code % 28;

  return {
    initial: INITIALS[initialIndex],
    vowel: VOWELS[vowelIndex],
    final: FINALS[finalIndex],
  };
}

function replaceLast(value: string, replacement: string) {
  return `${value.slice(0, -1)}${replacement}`;
}

export function appendHangul(value: string, key: string) {
  if (key.length !== 1) return value + key;

  const isInitial = INITIALS.includes(key);
  const isVowel = VOWELS.includes(key);
  if (!isInitial && !isVowel) return value + key;
  if (!value) return value + key;

  const last = value.at(-1) ?? "";

  if (isVowel) {
    if (INITIALS.includes(last)) {
      return replaceLast(value, compose(last, key));
    }

    if (isSyllable(last)) {
      const parts = decompose(last);
      if (!parts.final) {
        const compound = COMPOUND_VOWELS[`${parts.vowel}${key}`];
        if (compound) {
          return replaceLast(value, compose(parts.initial, compound));
        }
      }

      if (parts.final) {
        const split = SPLIT_FINALS[parts.final];
        const previousFinal = split ? split[0] : "";
        const nextInitial = split ? split[1] : parts.final;
        return replaceLast(
          value,
          `${compose(parts.initial, parts.vowel, previousFinal)}${compose(nextInitial, key)}`,
        );
      }
    }

    return value + key;
  }

  if (isSyllable(last)) {
    const parts = decompose(last);
    if (!parts.final && FINALS.includes(key)) {
      return replaceLast(value, compose(parts.initial, parts.vowel, key));
    }

    const compound = COMPOUND_FINALS[`${parts.final}${key}`];
    if (compound) {
      return replaceLast(value, compose(parts.initial, parts.vowel, compound));
    }
  }

  return value + key;
}

export function removeLastHangul(value: string) {
  if (!value) return value;

  const last = value.at(-1) ?? "";
  if (!isSyllable(last)) return value.slice(0, -1);

  const parts = decompose(last);
  if (parts.final) {
    const split = SPLIT_FINALS[parts.final];
    const nextFinal = split ? split[0] : "";
    return replaceLast(value, compose(parts.initial, parts.vowel, nextFinal));
  }

  return replaceLast(value, parts.initial);
}

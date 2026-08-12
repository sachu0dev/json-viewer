const BRACKET_PAIRS: Record<string, string> = {
  "{": "}",
  "[": "]",
  "(": ")",
};

const REV_BRACKET_PAIRS: Record<string, string> = {
  "}": "{",
  "]": "[",
  ")": "(",
};

export function findMatchingBracket(text: string, pos: number): [number, number] | null {
  if (!text || pos < 0 || pos > text.length) return null;

  let charPos = -1;
  let char = "";

  if (pos > 0 && "{}[Custom]()".includes(text[pos - 1])) {
    charPos = pos - 1;
    char = text[pos - 1];
  } else if (pos < text.length && "{}[Custom]()".includes(text[pos])) {
    charPos = pos;
    char = text[pos];
  }

  if (charPos === -1) return null;

  if (char in BRACKET_PAIRS) {
    const open = char;
    const close = BRACKET_PAIRS[open];
    let depth = 1;
    let inString = false;
    let escape = false;

    for (let i = charPos + 1; i < text.length; i++) {
      const c = text[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (c === open) depth++;
      else if (c === close) {
        depth--;
        if (depth === 0) return [charPos, i];
      }
    }
  } else if (char in REV_BRACKET_PAIRS) {
    const close = char;
    const open = REV_BRACKET_PAIRS[close];
    let depth = 1;
    let inString = false;

    for (let i = charPos - 1; i >= 0; i--) {
      const c = text[i];
      if (c === '"') {
        let backslashes = 0;
        for (let j = i - 1; j >= 0 && text[j] === "\\"; j--) backslashes++;
        if (backslashes % 2 === 0) inString = !inString;
        continue;
      }
      if (inString) continue;

      if (c === close) depth++;
      else if (c === open) {
        depth--;
        if (depth === 0) return [i, charPos];
      }
    }
  }

  return null;
}

const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
/** Wrap semantic words, never arbitrary character slices; a long identifier stays intact. */
export function wrapResourceLabel(
  text: string,
  maxWidth: number,
  measure: (text: string) => number,
): string[] {
  return text.split(/\r?\n/u).flatMap((paragraph) => {
    const tokens: string[] = [];
    for (const part of segmenter.segment(paragraph)) {
      if (!part.isWordLike && !/^\s+$/u.test(part.segment) && tokens.length)
        tokens[tokens.length - 1] += part.segment;
      else tokens.push(part.segment);
    }
    const lines: string[] = [];
    let line = "";
    for (const token of tokens) {
      if (!line && /^\s+$/u.test(token)) continue;
      if (line.trim() && token.trim() && measure(line + token) > maxWidth) {
        lines.push(line.trimEnd());
        line = token.trimStart();
      } else line += token;
    }
    if (line || !lines.length) lines.push(line.trimEnd());
    return lines;
  });
}

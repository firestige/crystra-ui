import { observationLayoutTokens } from "../domain/observation-layout-tokens";
export function chartColumnLayout(
  width: number,
  tokens: Record<string, string> = observationLayoutTokens,
) {
  const value = (key: string) => parseFloat(tokens[`layout-comparison-${key}`]);
  const min = value("card-min"),
    max = value("card-max");
  const count =
    width >= value("break-2xl")
      ? 4
      : width >= value("break-xl")
        ? 3
        : width >= value("break-lg")
          ? 2
          : 1;
  const gap = Math.max(
    value("gap-min"),
    Math.min(
      value("gap-max"),
      width * value("gap-ratio"),
      (width - count * min) / (count + 2),
    ),
  );
  const cardWidth = Math.max(
    min,
    Math.min(max, (width - (count + 2) * gap) / count),
  );
  const margin = Math.max(
    0,
    (width - count * cardWidth - (count - 1) * gap) / 2,
  );
  return { count, cardWidth, gap, margin };
}

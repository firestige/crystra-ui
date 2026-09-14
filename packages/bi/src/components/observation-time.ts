export const observationToday = "2026-09-09";
export const iso = (date: Date) => date.toISOString().slice(0, 10);
export const observationTimeZone = "+08:00";
export const maxObservationRangeYears = 1;
export const normalized = (value: string) =>
  value.length === 16 ? value + ":00" : value;
export const timestamp = (value: string) =>
  Date.parse(normalized(value) + observationTimeZone);
export function observationRangeError([start, end]: [string, string]): string {
  if (
    !start ||
    !end ||
    !Number.isFinite(timestamp(start)) ||
    !Number.isFinite(timestamp(end))
  )
    return "请选择完整的起止时间";
  if (timestamp(end) < timestamp(start)) return "结束时间不能早于开始时间";
  const limit = new Date(normalized(start) + "Z");
  const month = limit.getUTCMonth();
  limit.setUTCFullYear(limit.getUTCFullYear() + maxObservationRangeYears);
  if (limit.getUTCMonth() !== month) limit.setUTCDate(0);
  if (normalized(end) > limit.toISOString().slice(0, 19))
    return "时间范围最多为一年";
  return "";
}
export function observationRange(
  period: string,
  today = observationToday,
): [string, string] {
  const custom =
    /^custom:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})$/.exec(
      period,
    );
  const legacy = /^custom:(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})$/.exec(
    period,
  );
  const range: [string, string] | undefined = custom
    ? [custom[1], custom[2]]
    : legacy
      ? [legacy[1] + "T00:00:00", legacy[2] + "T23:59:59"]
      : undefined;
  if (range && !observationRangeError(range)) return range;
  const start = new Date(today + "T00:00:00Z");
  start.setUTCDate(
    start.getUTCDate() -
      ((period === "30d" ? 30 : period === "3d" ? 3 : 7) - 1),
  );
  return [iso(start) + "T00:00:00", today + "T23:59:59"];
}
export const observationRangeLabel = (
  period: string,
  today = observationToday,
) =>
  period === "7d"
    ? "最近 7 天"
    : period === "30d"
      ? "最近 30 天"
      : observationRange(period, today)
          .map((d) => d.slice(5).replace("-", "/").replace("T", " "))
          .join(" — ");
export function inObservationRange(
  date: string,
  period: string,
  today = observationToday,
) {
  const [start, end] = observationRange(period, today);
  // Daily aggregate fixtures intersect the selected range; trace timestamps are exact.
  if (date.length === 10)
    return (
      timestamp(date + "T23:59:59") >= timestamp(start) &&
      timestamp(date + "T00:00:00") <= timestamp(end)
    );
  const value = Date.parse(date);
  return value >= timestamp(start) && value <= timestamp(end);
}

/** Shared Evidence acceptance-time bounds; execution event times are not selectors. */
export function validRecordedRange(value: {
  recorded_from?: unknown;
  recorded_to?: unknown;
}) {
  const utc = (v: unknown): v is string =>
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(Date.parse(v)).toISOString().slice(0, 19) === v.slice(0, 19);
  if (!utc(value.recorded_from) || !utc(value.recorded_to)) return false;
  const span = Date.parse(value.recorded_to) - Date.parse(value.recorded_from);
  return span >= 0 && span <= 366 * 86400000;
}

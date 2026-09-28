/** Metric releases are independent of the transport and Observation protocol. */
export function validMetricId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    !/[\s@]/.test(value)
  );
}
export function validMetricVersion(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 64 &&
    !/[\s@]/.test(value)
  );
}
export function validMetricCoordinate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parts = value.split("@");
  return (
    parts.length === 2 &&
    validMetricId(parts[0]) &&
    validMetricVersion(parts[1])
  );
}

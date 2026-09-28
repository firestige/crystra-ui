import { inObservationRange as inRange } from "../components/observation-time";
export const referenceDate = "2026-09-09";
export const inObservationRange = (date: string, period: string) =>
  inRange(date, period, referenceDate);

import type { ObservationSetting } from "./observation-settings";
import type { DashboardLayout } from "./layout/layout";
export interface AnalysisPreferences {
  settings: readonly ObservationSetting[];
  layout?: DashboardLayout;
}
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
/** Validate persistence shape, not the currently available metric catalog. */
function configuration(value: unknown): value is AnalysisPreferences {
  if (
    !object(value) ||
    !Array.isArray(value.settings) ||
    value.settings.length > 200
  )
    return false;
  if (
    !value.settings.every(
      (s) =>
        object(s) &&
        typeof s.id === "string" &&
        typeof s.name === "string" &&
        Array.isArray(s.charts) &&
        s.charts.every(
          (c) =>
            object(c) &&
            typeof c.id === "string" &&
            typeof c.title === "string" &&
            typeof c.primary === "string" &&
            typeof c.secondary === "string" &&
            Array.isArray(c.items) &&
            c.items.every(
              (i) =>
                object(i) &&
                ["id", "name", "metric", "operation"].every(
                  (k) => typeof i[k] === "string",
                ),
            ),
        ),
    )
  )
    return false;
  if (value.layout === undefined) return true;
  const l = value.layout;
  return (
    object(l) &&
    l.layout_version === 1 &&
    typeof l.name === "string" &&
    Array.isArray(l.panels) &&
    l.panels.length <= 200 &&
    l.panels.every(
      (p) =>
        object(p) &&
        ["panel_id", "metric_coordinate", "visualizer", "size"].every(
          (k) => typeof p[k] === "string",
        ) &&
        object(p.channels) &&
        Object.values(p.channels).every((v) => typeof v === "string") &&
        Array.isArray(p.transforms) &&
        p.transforms.every((v) => typeof v === "string") &&
        object(p.grid) &&
        ["x", "y", "w", "h"].every((k) =>
          Number.isSafeInteger((p.grid as Record<string, unknown>)[k]),
        ),
    )
  );
}

export function decodeAnalysisPreferences(
  value: unknown,
): AnalysisPreferences | undefined {
  return configuration(value) ? structuredClone(value) : undefined;
}

import type { TruthState } from "../domain/evolution/types";
export type MetricTruthLocale = "zh-CN" | "en";
export const metricTruthMessages: Record<
  MetricTruthLocale,
  Record<TruthState, { label: string; description: string }>
> = {
  "zh-CN": {
    AVAILABLE: { label: "可用", description: "当前结果可用。" },
    LOWER_BOUND: {
      label: "仅下界",
      description: "当前数值仅表示下界，不能当作完整结果。",
    },
    NOT_APPLICABLE: { label: "不适用", description: "当前范围不适用此指标。" },
    UNAVAILABLE: { label: "不可用", description: "当前无法提供该指标结果。" },
    EXPIRED: { label: "已过期", description: "当前结果已过期。" },
    INCOMPATIBLE: {
      label: "不兼容",
      description: "当前结果不满足兼容性要求。",
    },
  },
  en: {
    AVAILABLE: {
      label: "Available",
      description: "The current result is available.",
    },
    LOWER_BOUND: {
      label: "Lower bound",
      description: "The value is a lower bound, not a complete result.",
    },
    NOT_APPLICABLE: {
      label: "Not applicable",
      description: "The metric does not apply to the current scope.",
    },
    UNAVAILABLE: {
      label: "Unavailable",
      description: "The metric result is currently unavailable.",
    },
    EXPIRED: {
      label: "Expired",
      description: "The current result has expired.",
    },
    INCOMPATIBLE: {
      label: "Incompatible",
      description: "The result does not meet compatibility requirements.",
    },
  },
};

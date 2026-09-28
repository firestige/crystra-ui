import { previewAnalysisLayout } from "./analysis-layout-fixture";
import { useEffect, useState, type ComponentProps } from "react";
import type { AnalysisSurface } from "../components/analysis-observation-study";
import { initialObservationSettings } from "./observation-settings";
type Props = ComponentProps<typeof AnalysisSurface>;
/** Preview-only session state and synthetic refresh. Never a production data hook. */
export function useAnalysisPreviewState() {
  const [settings, setSettings] = useState(() =>
    structuredClone(initialObservationSettings),
  );
  const [layout, setLayout] = useState<Props["layout"]>(previewAnalysisLayout);
  const [cadence, setCadence] = useState("0");
  const [refreshCount, setRefreshCount] = useState(0);
  useEffect(() => {
    if (cadence === "0") return;
    const timer = setInterval(
      () => setRefreshCount((n) => n + 1),
      Number(cadence) * 1000,
    );
    return () => clearInterval(timer);
  }, [cadence]);
  return {
    settings,
    onSettingsChange: setSettings,
    layout,
    onLayoutChange: setLayout,
    refreshCount,
    onRefresh: () => setRefreshCount((n) => n + 1),
    refreshCadence: cadence,
    onRefreshCadenceChange: setCadence,
  };
}

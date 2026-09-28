import { createAnalysisLayout } from "../domain/analysis-default-layout";
import { analysisDataFixture } from "./analysis-data-fixture";
export function previewAnalysisLayout() {
  return createAnalysisLayout(
    analysisDataFixture.overview("7d", {
      group: "provider",
      workflow: "all",
      role: "all",
      tokens: "total",
    }),
  );
}

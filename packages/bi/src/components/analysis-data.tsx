import {
  unavailableOverview,
  unavailableQueries,
} from "../domain/analysis-unavailable";
import { useMemo, type ReactNode } from "react";
import type { AnalysisData } from "../domain/analysis-data";
import { AnalysisContext } from "./analysis-context";
export type { AnalysisData } from "../domain/analysis-data";
export function AnalysisDataProvider({
  value,
  children,
}: {
  value: Partial<AnalysisData>;
  children: ReactNode;
}) {
  // Presentation defaults only. No transport, loading hook or Evidence envelope.
  const resolved = useMemo<AnalysisData>(
    () => ({
      referenceDate: new Date().toISOString().slice(0, 10),
      tasks: [],
      roles: [],
      workflows: [],
      deliveries: [],
      searchFields: [],
      overview: unavailableOverview,
      queries: unavailableQueries,
      trace: () => null,
      matrix: (chart) => ({
        family: "matrix",
        title: chart.title,
        unit: "",
        dimensions: [],
        rows: [],
        domain: [0, 1],
        ordered: false,
      }),
      ...value,
    }),
    [value],
  );
  return (
    <AnalysisContext.Provider value={resolved}>
      {children}
    </AnalysisContext.Provider>
  );
}

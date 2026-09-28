import { createContext, useContext } from "react";
import type { AnalysisData } from "../domain/analysis-data";
export const AnalysisContext = createContext<AnalysisData | null>(null);
export function useAnalysisData() {
  const data = useContext(AnalysisContext);
  if (!data) throw Error("AnalysisDataProvider is required");
  return data;
}

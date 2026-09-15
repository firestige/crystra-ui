import "./crystra-components.css";
import "./crystra-theme.css";
import "./primitives.css";
import "./shared.css";

export {
  Button,
  ButtonGroup,
  Card,
  Chip,
  Divider,
  IconButton,
  StatusBadge,
  Surface,
  TextInput,
  Typography,
  type ButtonProps,
  type CardProps,
  type ChipProps,
  type ComponentSize,
  type DividerProps,
  type IconButtonProps,
  type SemanticTone,
  type SurfaceProps,
  type TypographyFamily,
  type TypographyTone,
  type TypographyVariant,
  type TypographyWeight,
} from "./components/design-system";
export {
  STUDIO_DESIGN_IR,
  type StudioDesignIR,
} from "./domain/studio-design-ir";

export {
  BiCard,
  BiSection,
  BiSurface,
  type BiSurfaceProps,
} from "./components/bi-surface";
export { CompareResultFrame } from "./components/compare-result";
export { DashboardGrid } from "./components/dashboard-grid";
export { MetricExplanationView, ReceiptView } from "./components/details";
export {
  EvidenceConsoleFoundation,
  type EvidenceConsoleRow,
  type EvidenceReferenceRow,
  type EvidenceScope,
} from "./components/evidence-console";
export {
  MetricNavigator,
  MetricResultFrame,
  type MetricNavigatorItem,
} from "./components/metric-result";
export {
  DEFAULT_MOTION_MODE,
  MotionControl,
  RecordedStructureFoundation,
  type MotionMode,
  type RecordedDetailState,
  type RecordedNodeView,
  type RecordedStructureViewModel,
} from "./components/recorded-structure";
export {
  DashboardMetricPanel,
  MetricPanel,
} from "./components/result-visualizer";
export {
  CoverageLabel,
  EvidenceLifecycleLabel,
  MetricTruthLabel,
  ScopedError,
} from "./components/status";
export {
  SpanPassport,
  TraceStatistics,
  TraceTree,
  TraceWaterfall,
} from "./components/trace-views";
export type * from "./domain/evidence/types";
export { CATALOG_COORDINATES } from "./domain/evolution/client";
export type * from "./domain/evolution/types";
export { isMetricResult } from "./domain/evolution/validation";
export {
  createBiTheme,
  type BiDataPalette,
  type BiPalette,
  type BiTheme,
  type BiTypographyScale,
} from "./domain/theme";
export {
  loadRecordedTrace,
  type TracePagePort,
} from "./domain/trace/load-recorded-trace";
export {
  projectRecordedStructure,
  type RecordedNode,
  type RecordedStructure,
  type UnresolvedEndpoint,
} from "./domain/trace/recorded-structure";
export {
  compileTraceView,
  type TraceView,
  type TraceViewLink,
  type TraceViewNode,
  type TraceViewParentEdge,
} from "./domain/trace/trace-view";
export { presentExactValue } from "./domain/visualization/presentation";
export {
  VISUALIZER_REGISTRY,
  compatibleVisualizerIds,
  selectDefaultVisualizer,
  type VisualizerId,
} from "./domain/visualization/registry";

export interface BiNavigationPort {
  navigate(destination: {
    kind: "receipt" | "fact" | "trace";
    id: string;
  }): void;
}

export interface BiHostErrorPort {
  report(error: unknown, context: string): void;
}

export { Icon, type IconName, type IconSize } from "./components/icon";

export { COMPONENT_DEFAULTS } from "./domain/component-recipes";

export {
  List,
  ListItem,
  Menu,
  Tabs,
  type ListItemProps,
  type ListProps,
  type MenuItem,
  type MenuProps,
  type TabItem,
  type TabsProps,
} from "./components/collection-components";
export {
  EmptyState,
  FullBenchViewer,
  Popover,
  ProgressNotice,
  SearchField,
  SelectField,
  SelectionControl,
  type FullBenchViewerProps,
  type PopoverProps,
  type ProgressNoticeProps,
  type SearchFieldProps,
  type SelectFieldProps,
  type SelectionControlProps,
} from "./components/state-components";

export {
  MonitoringWidget,
  type MonitoringWidgetProps,
} from "./components/monitoring-widget";
export { Widget, type WidgetProps, type WidgetSize } from "./components/widget";
export {
  WIDGET_CATALOG,
  type MonitoringWidgetSize,
  type WidgetCategory,
} from "./domain/widget-catalog";

import "./monitoring-widget-base.css";

export { MonitoringMetricPanel } from "./components/monitoring-metric";

export {
  MONITORING_RENDERERS,
  WIDGET_GAP,
  WIDGET_UNIT,
  monitoringSizes,
  widgetSpan,
} from "./domain/widget-catalog";

export {
  ExpandableSearchField,
  type ExpandableSearchFieldProps,
} from "./components/expandable-search-field";

export {
  ToggleSwitch,
  type ToggleSwitchProps,
} from "./components/toggle-switch";
export { WidgetTooltip } from "./components/widget-tooltip";

export { DeliveryDirectory } from "./components/delivery-directory";
export type {
  DeliverySearchRecord,
  DeliverySearchField,
  DeliverySearchCondition,
  DeliveryFilters,
} from "./domain/delivery-search";
export {
  CrystraShell,
  type CrystraShellProps,
  type CrystraPage,
  type CrystraNavigationRecord,
} from "./components/crystra-shell";
export { decodeEvidencePage } from "./domain/evidence/client";
export {
  CrystraAnalysisFrame,
  CrystraTraceContent,
  type CrystraAnalysisPage,
} from "./components/crystra-analysis";

export {
  AnalysisWorkspace,
  type AnalysisWorkspaceData,
  type AnalysisWorkspacePage,
  type AnalysisOverviewFilters,
} from "./components/analysis-workspace";
export {
  TaskWorkbench,
  type TaskWorkbenchPage,
} from "./components/task-workbench";

export {
  TaskRequirementsPanel,
  type TaskRequirementsProjection,
} from "./components/task-requirements-panel";

export {
  TaskDeliveryPanel,
  type TaskDeliveryProjection,
} from "./components/task-delivery-panel";

export {
  TaskGatePanel,
  type TaskGateProjection,
  type TaskGateQueueItem,
} from "./components/task-gate-panel";

export {
  TaskPlanPanel,
  type TaskPlanProjection,
} from "./components/task-plan-panel";
export {
  TaskExecutionPanel,
  type TaskExecutionProjection,
  type TaskWaveProjection,
  type TaskRunIdentity,
} from "./components/task-execution-panel";

export {
  TaskEvidenceContext,
  type TaskEvidenceContextProjection,
} from "./components/task-evidence-context";

export { TaskBrowser, type TaskBrowserProps } from "./components/task-browser";
export type { BrowserTaskRecord } from "./components/task-browser-model";

export {
  WorkflowExplorer,
  type WorkflowExplorerProps,
} from "./components/workflow-explorer";
export type { WorkflowDefinitionEntry } from "./components/workflow-explorer-model";
export {
  WorkflowWorkbench,
  type WorkflowWorkbenchPage,
} from "./components/workflow-workbench";
export {
  WorkflowMapViewer,
  type WorkflowMapViewerProps,
  type WorkflowLayoutResolver,
} from "./components/workflow-map-viewer";
export {
  WorkflowResourceViewer,
  type WorkflowResourceViewerProps,
  type ResourceWorkspaceSnapshot,
  type ResourceDraftSave,
  type WorkflowCatalogResource,
} from "./components/workflow-resource-viewer";

export {
  WorkflowCrystallizationView,
  type CrystallizationProjection,
} from "./components/workflow-crystallization-view";

export { TaskDiagram, TaskDiagramExplorer } from "./components/task-diagram";

export { isTaskDiagram, type TaskDiagramNode } from "./domain/task-diagram";
export { ResourceRelationGraph } from "./components/resource-relation-graph";
export type {
  Source as WorkflowResourceRelationSource,
  Node as WorkflowResourceRelationNode,
  Edge as WorkflowResourceRelationEdge,
} from "./components/resource-relations";

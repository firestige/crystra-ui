import "./shared.css";
import "./primitives.css";
import "./crystra-theme.css";
import "./crystra-components.css";

export {
  Button,
  ButtonGroup,
  Card,
  Chip,
  type ButtonProps,
  type IconButtonProps,
  type CardProps,
  type ChipProps,
  type DividerProps,
  type ComponentSize,
  type SemanticTone,
  type SurfaceProps,
  Divider,
  IconButton,
  StatusBadge,
  Surface,
  TextInput,
  Typography,
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
export {
  createBiTheme,
  type BiDataPalette,
  type BiPalette,
  type BiTheme,
  type BiTypographyScale,
} from "./domain/theme";
export { CompareResultFrame } from "./components/compare-result";
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
export { DashboardGrid } from "./components/dashboard-grid";
export {
  SpanPassport,
  TraceStatistics,
  TraceTree,
  TraceWaterfall,
} from "./components/trace-views";
export {
  CoverageLabel,
  EvidenceLifecycleLabel,
  MetricTruthLabel,
  ScopedError,
} from "./components/status";
export type * from "./domain/evidence/types";
export type * from "./domain/evolution/types";
export { CATALOG_COORDINATES } from "./domain/evolution/client";
export { isMetricResult } from "./domain/evolution/validation";
export {
  type TracePagePort,
  loadRecordedTrace,
} from "./domain/trace/load-recorded-trace";
export {
  type RecordedNode,
  type RecordedStructure,
  type UnresolvedEndpoint,
  projectRecordedStructure,
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
  Tabs,
  Menu,
  type ListProps,
  type ListItemProps,
  type TabsProps,
  type TabItem,
  type MenuProps,
  type MenuItem,
} from "./components/collection-components";
export {
  SearchField,
  SelectField,
  SelectionControl,
  Popover,
  EmptyState,
  FullBenchViewer,
  ProgressNotice,
  type SearchFieldProps,
  type SelectFieldProps,
  type SelectionControlProps,
  type PopoverProps,
  type FullBenchViewerProps,
  type ProgressNoticeProps,
} from "./components/state-components";

export { Widget, type WidgetProps, type WidgetSize } from "./components/widget";

import "./monitoring-widget-base.css";
export {
  MonitoringWidget,
  type MonitoringWidgetProps,
} from "./components/monitoring-widget";
export {
  WIDGET_CATALOG,
  type WidgetCategory,
  type MonitoringWidgetSize,
} from "./domain/widget-catalog";

export { MonitoringMetricPanel } from "./components/monitoring-metric";

export {
  WIDGET_UNIT,
  WIDGET_GAP,
  widgetSpan,
  MONITORING_RENDERERS,
  monitoringSizes,
} from "./domain/widget-catalog";

export { ExpandableSearchField, type ExpandableSearchFieldProps } from "./components/expandable-search-field";

export { ToggleSwitch, type ToggleSwitchProps } from "./components/toggle-switch";
export { WidgetTooltip } from "./components/widget-tooltip";

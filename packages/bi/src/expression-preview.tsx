import { createRoot } from "react-dom/client";
import { WidgetExpressionStudy } from "./components/widget-expression-study";
import "./shared.css";
import "./primitives.css";
import "./crystra-theme.css";
import "./crystra-components.css";
createRoot(document.getElementById("root")!).render(
  <div className="wsr-bi" data-crystra-theme="dark">
    <WidgetExpressionStudy />
  </div>,
);

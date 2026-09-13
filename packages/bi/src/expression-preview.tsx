import { createRoot } from "react-dom/client";
import { WidgetExpressionStudy } from "./components/widget-expression-study";
import "./crystra-components.css";
import "./crystra-theme.css";
import "./primitives.css";
import "./shared.css";
createRoot(document.getElementById("root")!).render(
  <div className="wsr-bi" data-crystra-theme="dark">
    <WidgetExpressionStudy />
  </div>,
);

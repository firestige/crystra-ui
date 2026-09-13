import { createRoot } from "react-dom/client";
import { LibraryPreview } from "./components/library-preview";
import "./styles.css";
import "./shared.css";
import "./primitives.css";
import "./crystra-theme.css";
import "./crystra-components.css";
import "./test-harness/test-harness.css";
import "./library-preview.css";
createRoot(document.getElementById("root")!).render(<LibraryPreview />);

import "./monitoring-widget.css";

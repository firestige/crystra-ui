import { createRoot } from "react-dom/client";
import { LibraryPreview } from "./components/library-preview";
import "./crystra-components.css";
import "./crystra-theme.css";
import "./library-preview.css";
import "./primitives.css";
import "./shared.css";
import "./styles.css";
import "./test-harness/test-harness.css";
createRoot(document.getElementById("root")!).render(<LibraryPreview />);

import "./monitoring-widget.css";

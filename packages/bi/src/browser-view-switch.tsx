import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { ResourceViewToggle } from "./components/resource-view-toggle";
import "./crystra-theme.css";
import "./select-dropdown.css";

const seat = document.getElementById("browser-view-toggle-seat");
export function BrowserViewSwitch() {
  const [checked, setChecked] = useState(seat?.dataset.view === "list");
  useEffect(() => {
    const update = (event: Event) =>
      setChecked((event as CustomEvent<string>).detail === "list");
    document.addEventListener("browser-view-changed", update);
    return () => document.removeEventListener("browser-view-changed", update);
  }, []);
  return (
    <ResourceViewToggle
      label={seat?.dataset.label || "资源视图"}
      value={checked ? "list" : "gallery"}
      onValueChange={(value) =>
        document.dispatchEvent(
          new CustomEvent("browser-view-request", {
            detail: value,
          }),
        )
      }
    />
  );
}
if (seat) createRoot(seat).render(<BrowserViewSwitch />);

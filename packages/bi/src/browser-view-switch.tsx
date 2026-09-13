import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Icon } from "./components/icon";
import { ToggleSwitch } from "./components/toggle-switch";
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
    <ToggleSwitch
      mode="choice"
      shape="square"
      size="regular"
      label={seat?.dataset.label || "资源视图"}
      labels={["Gallery", "List"]}
      icons={[<Icon name="table" />, <Icon name="clipboard-list" />]}
      iconPlacement="track"
      checked={checked}
      onCheckedChange={(value) =>
        document.dispatchEvent(
          new CustomEvent("browser-view-request", {
            detail: value ? "list" : "gallery",
          }),
        )
      }
    />
  );
}
if (seat) createRoot(seat).render(<BrowserViewSwitch />);

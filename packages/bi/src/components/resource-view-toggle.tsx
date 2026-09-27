import { ToggleSwitch } from "./toggle-switch";
import { Icon } from "./icon";
export interface ResourceViewToggleProps {
  value: "gallery" | "list";
  onValueChange: (value: "gallery" | "list") => void;
  disabled?: boolean;
  label?: string;
}
/** Shared browser view choice. Labels are accessible names/tooltips, never visible copy. */
export function ResourceViewToggle({
  value,
  onValueChange,
  disabled,
  label = "View",
}: ResourceViewToggleProps) {
  return (
    <ToggleSwitch
      mode="choice"
      shape="square"
      size="regular"
      label={label}
      labels={["Gallery", "List"]}
      icons={[<Icon name="layout-grid" />, <Icon name="list" />]}
      iconPlacement="track"
      checked={value === "list"}
      disabled={disabled}
      onCheckedChange={(checked) => onValueChange(checked ? "list" : "gallery")}
    />
  );
}

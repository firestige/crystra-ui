import type { ReactNode } from "react";
import "../toggle-switch.css";

/** Review candidate: one native button and one persistent sliding thumb. */
export interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  shape?: "round" | "square";
  size?: "compact" | "regular";
  disabled?: boolean;
  mode?: "switch" | "choice";
  labels?: readonly [string, string];
  icons?: readonly [ReactNode, ReactNode];
  iconPlacement?: "thumb" | "track";
}

export function ToggleSwitch({
  checked,
  onCheckedChange,
  label,
  shape = "round",
  size = "compact",
  disabled = false,
  mode = "switch",
  labels = ["关闭", "开启"],
  icons,
  iconPlacement = "thumb",
}: ToggleSwitchProps) {
  const name =
    mode === "choice"
      ? `${label}：${labels[checked ? 1 : 0]}，切换到 ${labels[checked ? 0 : 1]}`
      : label;
  return (
    <button
      type="button"
      className="wsr-toggle-switch"
      role={mode === "switch" ? "switch" : undefined}
      aria-checked={mode === "switch" ? checked : undefined}
      aria-label={name}
      title={mode === "choice" ? name : `${label}：${labels[checked ? 1 : 0]}`}
      data-checked={checked}
      data-shape={shape}
      data-size={size}
      data-mode={mode}
      data-icon-placement={icons ? iconPlacement : "none"}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className="wsr-switch-track" aria-hidden="true">
        <span className="wsr-switch-thumb">
          {icons && iconPlacement === "thumb" ? icons[checked ? 1 : 0] : null}
        </span>
        {icons && iconPlacement === "track" ? (
          <span className="wsr-switch-symbols">
            <span>{icons[0]}</span>
            <span>{icons[1]}</span>
          </span>
        ) : null}
      </span>
    </button>
  );
}

import type { SVGProps } from "react";
import icons from "../domain/crystra-icons.json";
import tokens from "../../../../design/crystra.tokens.json";
export type IconName = keyof typeof icons.icons;
export type IconSize =
  | "widget-signal"
  | "disclosure"
  | "inline-action"
  | "content-marker"
  | "navigation"
  | "primary-action"
  | "brand-slot"
  | "context-marker";
const sizes: Record<IconSize, number> = tokens.icon.roles;

export function Icon({
  name,
  size = "inline-action",
  "aria-label": label,
  ...props
}: Omit<SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> & {
  name: IconName;
  size?: IconSize;
}) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      width={sizes[size]}
      height={sizes[size]}
      data-icon-role={size}
      data-iconify={`tabler:${name}`}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      dangerouslySetInnerHTML={{ __html: icons.icons[name].body }}
    />
  );
}

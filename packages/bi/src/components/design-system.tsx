import type {
  ButtonHTMLAttributes,
  ElementType,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { COMPONENT_DEFAULTS } from "../domain/component-recipes";

export type TypographyVariant =
  | "page-title"
  | "section-title"
  | "card-title"
  | "item-title"
  | "body"
  | "body-compact"
  | "header-description"
  | "description"
  | "meta"
  | "label"
  | "control"
  | "metric"
  | "badge"
  | "code"
  | "h1"
  | "h2"
  | "subtitle1"
  | "body1"
  | "body2"
  | "caption"
  | "overline";
export type TypographyFamily = "sans" | "mono";
export type TypographyWeight = "regular" | "medium" | "semibold" | "bold";
export type TypographyTone =
  | "primary"
  | "secondary"
  | "muted"
  | "inverse"
  | "error"
  | "warning"
  | "success";
export type ButtonAppearance = "solid" | "outline" | "ghost" | "segment";
export type SemanticTone =
  "neutral" | "primary" | "success" | "warning" | "danger";
export type ButtonTone = SemanticTone;
export type ComponentSize = "compact" | "regular";
export type SurfaceLevel = "section" | "panel" | "inset" | "raised";
type Status = "available" | "selected" | "partial" | "unavailable" | "error";

export function Typography({
  as: Tag = "span",
  variant,
  family,
  weight,
  tone,
  italic = false,
  underline = false,
  truncate = false,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  variant: TypographyVariant;
  family?: TypographyFamily;
  weight?: TypographyWeight;
  tone?: TypographyTone;
  italic?: boolean;
  underline?: boolean;
  truncate?: boolean;
}) {
  return (
    <Tag
      className={["crystra-typography", className].filter(Boolean).join(" ")}
      data-family={family}
      data-italic={italic || undefined}
      data-tone={tone}
      data-truncate={truncate || undefined}
      data-underline={underline || undefined}
      data-variant={variant}
      data-weight={weight}
      {...props}
    />
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  appearance?: ButtonAppearance;
  tone?: SemanticTone;
  size?: ComponentSize;
  selected?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      appearance = COMPONENT_DEFAULTS.button.appearance,
      tone = COMPONENT_DEFAULTS.button.tone,
      size = COMPONENT_DEFAULTS.button.size,
      selected,
      startIcon,
      endIcon,
      children,
      className,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        aria-pressed={
          appearance === "segment" ? selected : props["aria-pressed"]
        }
        className={["crystra-button", className].filter(Boolean).join(" ")}
        data-appearance={appearance}
        data-size={size}
        data-tone={tone}
      >
        {startIcon && (
          <span className="crystra-button-icon" aria-hidden="true">
            {startIcon}
          </span>
        )}
        {children}
        {endIcon && (
          <span className="crystra-button-icon" aria-hidden="true">
            {endIcon}
          </span>
        )}
      </button>
    );
  },
);

export type IconButtonProps = Omit<ButtonProps, "startIcon" | "endIcon"> & {
  "aria-label": string;
};
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ "aria-label": label, title, children, ...props }, ref) {
    return (
      <Button
        {...props}
        ref={ref}
        aria-label={label}
        title={title ?? label}
        data-icon-button="true"
      >
        {children}
      </Button>
    );
  },
);

export function ButtonGroup({
  segmented = false,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { segmented?: boolean }) {
  return (
    <div
      className={["crystra-button-group", className].filter(Boolean).join(" ")}
      data-segmented={segmented || undefined}
      role={segmented ? "group" : props.role}
      {...props}
    />
  );
}

export function Surface({
  as: Tag = "section",
  level = "section",
  border = "solid",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  level?: SurfaceLevel;
  border?: "solid" | "dashed" | "none";
  children?: ReactNode;
}) {
  return (
    <Tag
      className={["crystra-surface", className].filter(Boolean).join(" ")}
      data-border={border}
      data-level={level}
      {...props}
    >
      {children}
    </Tag>
  );
}

export type DividerProps = HTMLAttributes<HTMLHRElement> & {
  orientation?: "horizontal" | "vertical";
};
export function Divider({
  orientation = "horizontal",
  className,
  ...props
}: DividerProps) {
  return (
    <hr
      {...props}
      className={["crystra-divider", className].filter(Boolean).join(" ")}
      aria-orientation={orientation}
      data-orientation={orientation}
    />
  );
}

export function TextInput({
  inputKind = "search",
  className,
  type,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { inputKind?: "search" }) {
  return (
    <input
      className={["crystra-input", className].filter(Boolean).join(" ")}
      data-input-kind={inputKind}
      type={type ?? inputKind}
      {...props}
    />
  );
}

const STATUS_TONES: Record<Status, SemanticTone> = {
  available: "primary",
  selected: "primary",
  partial: "warning",
  unavailable: "neutral",
  error: "danger",
};
export function StatusBadge({
  status,
  tone = STATUS_TONES[status],
  className,
  ...props
}: ChipProps & { status: Status }) {
  return (
    <Chip
      {...props}
      tone={tone}
      className={["crystra-status-badge", className].filter(Boolean).join(" ")}
      data-status={status}
    />
  );
}

export type SurfaceProps = ComponentPropsWithoutRef<typeof Surface>;
export type CardProps = SurfaceProps & {
  heading?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  tone?: SemanticTone;
  padding?: "none" | ComponentSize;
};

export function Card({
  heading,
  description,
  actions,
  footer,
  children,
  level = COMPONENT_DEFAULTS.card.level,
  border = COMPONENT_DEFAULTS.card.border,
  padding = COMPONENT_DEFAULTS.card.padding,
  tone = "neutral",
  className,
  ...props
}: CardProps) {
  return (
    <Surface
      {...props}
      level={level}
      border={border}
      className={["crystra-card", className].filter(Boolean).join(" ")}
      data-tone={tone}
      data-padding={padding}
    >
      {(heading || description || actions) && (
        <div className="crystra-card-header">
          <div className="crystra-card-copy">
            {heading && (
              <Typography as="h3" variant="card-title">
                {heading}
              </Typography>
            )}
            {description && (
              <Typography as="p" variant="description" tone="secondary">
                {description}
              </Typography>
            )}
          </div>
          {actions && <div className="crystra-card-actions">{actions}</div>}
        </div>
      )}
      <div className="crystra-card-content">{children}</div>
      {footer && <div className="crystra-card-footer">{footer}</div>}
    </Surface>
  );
}

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: SemanticTone;
  appearance?: "soft" | "outline" | "solid";
  size?: ComponentSize;
}
export function Chip({
  tone = "neutral",
  appearance = "soft",
  size = "compact",
  className,
  ...props
}: ChipProps) {
  return (
    <span
      {...props}
      className={["crystra-chip", className].filter(Boolean).join(" ")}
      data-tone={tone}
      data-appearance={appearance}
      data-size={size}
    />
  );
}

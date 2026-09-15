import { useEffect, useState } from "react";
import { ExpandableSearchField } from "../expandable-search-field";
import { Icon } from "../icon";
export interface SearchBinding {
  kind: string;
  control: HTMLElement;
  input: HTMLInputElement;
  action: HTMLButtonElement;
  close: HTMLButtonElement;
}
function dispatchNativeSearch(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Same adapter as the accepted search-bridge.tsx; the owning root supplies its scope. */
export function V8SearchAdapter({
  kind,
  control,
  input,
  action,
  close,
}: SearchBinding) {
  const [open, setOpen] = useState(control.dataset.open === "true");
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setOpen(control.dataset.open === "true"),
    );
    observer.observe(control, {
      attributes: true,
      attributeFilter: ["data-open"],
    });
    return () => observer.disconnect();
  }, [control]);
  return (
    <ExpandableSearchField
      label={action.getAttribute("aria-label") || input.placeholder}
      placeholder={input.placeholder}
      leading={<Icon name="search" />}
      cancelIcon={<Icon name="x" />}
      cancelLabel={close.getAttribute("aria-label") || "关闭搜索"}
      data-section-id={`${kind}-search-input`}
      triggerProps={{
        "data-section-id": `${kind}-search-action`,
        className: "rounded-md",
      }}
      cancelProps={{ "data-section-id": `${kind}-search-clear` }}
      expanded={open}
      onValueChange={(value) => {
        dispatchNativeSearch(input, value);
      }}
      onExpandedChange={(value) => {
        if (value !== (control.dataset.open === "true"))
          (value ? action : close).click();
        setOpen(value);
      }}
    />
  );
}

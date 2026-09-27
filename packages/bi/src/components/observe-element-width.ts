/** Shared content-width observation for adaptive controls; never searches host DOM. */
export function observeElementWidth(
  element: HTMLElement,
  onWidth: (width: number) => void,
) {
  if (element.clientWidth > 0) onWidth(element.clientWidth);
  if (typeof ResizeObserver === "undefined") return () => {};
  const observer = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width;
    if (width !== undefined) onWidth(width);
  });
  observer.observe(element);
  return () => observer.disconnect();
}

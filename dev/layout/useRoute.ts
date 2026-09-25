import { useSyncExternalStore } from "react";
import { resolveRoute } from "./routes";

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}
export function navigate(href: string) {
  if (window.location.pathname + window.location.search === href) return;
  window.history.pushState(null, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
export function useRoute() {
  return resolveRoute(
    useSyncExternalStore(
      subscribe,
      () => window.location.pathname + window.location.search,
    ),
  );
}

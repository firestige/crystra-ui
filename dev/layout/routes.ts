import { resolveRoute as resolveHostRoute } from "../../../wsr-dsh/src/client/navigation/routes.js";
export type { Route } from "../../../wsr-dsh/src/client/navigation/routes.js";
// The initial design fixture is a development-only landing page.
export function resolveRoute(location: string) {
  return resolveHostRoute(
    location === "/" ? "/tasks/task-market-release" : location,
  );
}

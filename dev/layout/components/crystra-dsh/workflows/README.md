# Local Workflow state

Owner: Crystra-dsh. The hook, owner RPC adapter, resource and connected views move
with the DSH sidebar. Crystra-ui supplies only display frames and primitives.

`useWorkflows` shares a host-owned resource across Sidebar, Explorer and Studio.
The resource uses the same generic action/mutation and revision transport mechanism
as Tasks, with independent data and state. `/crystra-workflows` reads explicitly bound
local authoring directories; it has no Evidence or remote execution-package fallback.
Unbound sources and parsing failures stay visible; failures retain previous items.

`version` is a display field. Navigation uses the stable definition identity and exact
`local:sha256:...` content revision. A source edit invalidates an old Studio URL; it
never updates that URL to latest automatically. Bench remains a placeholder.

Host binding and query behavior: `wsr-dsh/docs/local-workflow-catalogue.md`.

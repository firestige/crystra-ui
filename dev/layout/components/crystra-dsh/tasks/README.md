# Crystra-dsh Task data

Owner: Crystra-dsh. Move this directory with the Sidebar during host integration.

- `execution-tasks-api.ts`: Task-only RPC (`/crystra-tasks`, `list` / `changes`). Validates owner snapshots and subscribes to revision changes, with cancellation and reconnect.
- `tasks-resource.ts`: DSH native store mutations, shared asynchronous load/refresh actions, cancellation and stale-response isolation. Owner invalidations refresh the authoritative snapshot.
- `use-tasks.ts` / provider: React subscription to a host-owned resource. Sidebar, Browser and Detail share the initial read and subsequent changes.
- `task-views.tsx`: connected Task Browser and read feedback; display frames remain in Crystra-ui and Bench remains a placeholder.

The Execution query owns durable Task identity metadata and legacy Manifest compatibility. No Task lifecycle or creation timestamp is inferred from Delivery state. Task reads do not activate runtime. Analysis uses Evidence independently.

Create the store handle in DSH apply scope, receive its framework-owned instance, inject `ctx.connection.rpc`, and share one resource through the provider. Dispose it when the host scope ends; individual page unmounts do not dispose it. The dev shell stands in for that lifecycle; actual DSH 0.1.5 React mounting remains a separate integration step.

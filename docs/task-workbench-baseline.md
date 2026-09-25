# Task Workbench accepted baseline — 2026-09-25

The user accepted the Task Workbench implemented in the local Crystra host on
port 3085 and requested a committed baseline. This acceptance covers requirements,
plan, execution, review and delivery surfaces, the fixed base header, resizable
Chat/Workbench split, notification badges, shared summary cards and FullBenchViewer,
Workflow graph rendering, review resources and the complete scrollable live Brief.

Production components live in `packages/bi/src/task-workbench`, `task-layout`, and
shared components. `dev/layout` preserves the inspectable 3086 design preview;
its compatibility imports reuse production implementations. Preview fixtures are
not production Task data. Crystra-dsh owns Chat control, sources, notifications and
host integration. Execution owns Task identity and execution facts.

Design authority remains the supplied `Crystra-ui-design` directory recorded in
`dev/layout/README.md`. Further changes should build on this accepted baseline.
Acceptance of this UI does not claim completed implementation of the other product
pages or end-to-end live Workflow delivery qualification.

Freeze verification: 85 Vitest files / 435 tests and 34 Node tests pass. The 3085
host browser qualification confirms all 26 live Brief fields can scroll to the
bottom and empty workbench skeletons produce no notification badge. The installed
UI artifact matches all 136 current dist files; its SHA-256 and component commit
are pinned by the Crystra-dsh baseline.

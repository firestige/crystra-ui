# Task workbench integration

Owner: Crystra-dsh. The connected view resolves the exact Task from the existing
Execution resource. It does not read Evidence or infer Task status, Gate counts,
Plan revision or deliverability from Delivery IDs. The current list API does not
provide detailed workbench projections: the display explicitly remains unavailable.
Unknown is not an empty Gate queue or a successful Delivery verdict.

`createWorkbenchStore` is created by the host and passed through `WorkbenchContext`.
The page passes its Header navigation container to the connected view; this changes
only where navigation renders. Its synchronous mutations change only the viewed surface, keyed by exact Task ID.
The dev host creates an instance in `main.tsx`; formal DSH integration must create
and provide it in the host module lifecycle. There are no module-level store
instances, network calls in render, business mutations, or browser storage.
Selections survive route changes in the same host instance; persistence across
host restarts and full scroll/drill-down restoration are not implemented.

The display component lives in `../../crystra-ui/task-workbench`. Its five content
slots allow independently migrated projections without coupling the UI package to
Execution RPC. Supplying `systemFocus` requires an explicit owner fact; selected
surface and system activity must remain independent. Detailed Plan/DAG, Gate
Inspector and Wave Run reads and their exact identity contracts are subsequent
integration work, not fabricated fixtures in this task page.

## Navigation notifications

`WorkbenchAttentionBadge` composes the UI `Badge` primitive with Crystra-owned
visibility, count capping and a single 700ms arrival animation (disabled for
reduced motion). A dot means unseen content changes; the same shape carries the
unread count when positive. Both states remain independent. Clearing messages
leaves a dot if content remains unseen. Counts over 99 display 99+, with the exact
count in the accessible label. Badges float at the top-right of the tab label without contributing layout width.
System activity uses the navigation highlight in success color (text and underline),
without a visible status caption. The caption remains available to assistive technology.
A different selected tab keeps its primary highlight; when both states coincide,
success takes precedence.

The host store accepts per-Task/per-surface `receiveAttention` snapshots containing
a content revision and unique notification identities. `markViewed` takes the
exact displayed revision and message IDs; navigation never invokes it. A view must
call it only after successfully displaying and exposing those items to the user.
Late acknowledgements cannot clear newer notifications or roll back a fully read
current revision. `setSystemFocus` accepts only explicit owner activity.
These are client integration actions, not a published Execution notification API.
The detailed owner feed is not connected yet; no badges or active phase are
fabricated for real Tasks. Host restart persistence is not implemented.

Dev-only interactive example: `/attention-preview.html`. Its values never enter
the real Task resource or store.

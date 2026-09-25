# Crystra settings

Owner: Crystra-dsh. `SettingsDialog` is a modal shell; `useWorkflowSettings` owns the
source settings read/save lifecycle and receives the host RPC. It is opened from the
sidebar on any route, with native dialog focus management and Escape dismissal.

Workflow source settings use the same binding file and host gateway as the local
Workflow query. Saves carry a baseline revision, validate paths at the host boundary,
and trigger the shared Workflow resource to refresh. Invalid and conflicting saves
retain the form values and display the host error. No Workflow file is modified.

The shell follows DSH's settings layout: a left configuration index and a right
content panel. Only implemented sections appear in the index. `WorkflowSourceSettings`
is separate from the modal shell for later mounting in a DSH settings section.
The shell geometry follows `@deepseek-ai/dsh-client-ui-settings-general@0.1.5-rc.2`: an 800px panel with 32px corners, a 188px navigation column containing the title, and a 54px close-action header over the scrolling content. There is no cross-column header or pinned footer. Shell navigation and close controls follow the native DSH structure; configuration buttons, text inputs, select fields and typography reuse `crystra-ui-core`. Host DSH surface tokens are preferred with Crystra dark fallbacks. The dev Vite host enables the
same Tailwind CSS transform as the component library to compile its existing `@apply`
rules; it does not replace those styles with custom form controls.

Display settings own execution motion via the shared ToggleSwitch. The DSH
preference hook persists in same-origin browser storage and subscribes to both
local changes and storage events. ExecutionMap consumes it; bench surfaces have
no motion toggle or task-local preference. Disconnection and reduced-motion still
suppress motion independently. Storage write failure is visible in settings.

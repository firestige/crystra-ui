# Task Browser surface

Crystra-ui owns the shared display components. Crystra-dsh supplies Task facts,
URLs and callbacks through the shared Execution resource. This surface does not
access Execution, Evidence, filesystem or DSH APIs. Missing metadata stays unknown.

Design authority: `workflow-self-recursive/tmp/20260907/Crystra-ui-design/pages/task-browser.md`.
The calibrated UI is accepted in commit d5783e1 and integrated on port 3085.
Dev uses the same components and adapter.

The 88px LayoutHeader is shared with Workbench. Search and unified ButtonGroup
are 40px high; icon buttons remain at least square. Shared Divider separates
functions without subgroup borders. Expanded choices show icon and label;
compact triggers keep stable filter/sort/view icons. Collapse priority is sort
below 1200px, filter below 960px, then view below 760px of Header content width.
Resize preserves selection. New Task is a raised primary icon button; archive
uses the error tone. Both have tooltips.

Gallery uses ResourceGalleryCard with two metadata rows: title/status, then
subtitle/actions. List uses ResourceTableRow. Both share the ActionMenu and
owner callbacks for rename, thumbnail, Pin and archive/restore. Missing callbacks
remain disabled. Pinned tasks sort first within the chosen filter. Busy disables
item commands and selection. The host owns archived-view filtering, confirmation,
revision handling, success/error feedback and Undo. ResourceDialog provides
native modal focus containment and shared buttons; it contains no Task semantics.

# Direct shared-component migration — pending user visual review

Compare against `../task-browser-before-reuse/` at 1600 × 1000.

- Browser and Workbench now share LayoutHeader and its single 88px height token.
- ResourceBrowserHeader owns the Browser slot layout and responsive CSS.
- ResourceGalleryCard composes the shared Card content slot.
- ResourceTableRow owns resource identity/selection/metadata/actions table cells.
- ButtonGroup joined variant owns the connected group geometry and separators.

No independent visual redesign is applied after migration. Observed differences
include the thumbnail fallback icon rendering smaller under the host icon rules,
and slight search typography differences. These are explicitly left for user
review, not presented as pixel-equivalent. Port 3085 was not redeployed.

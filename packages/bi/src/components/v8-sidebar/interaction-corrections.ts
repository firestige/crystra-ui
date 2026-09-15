/** C095 manual acceptance correction: action hover must not also highlight its header.
 * Uses v8 semantic selectors and tokens; no geometry or palette snapshots.
 * The source's Task rule already has this exclusion; apply it consistently to Workflow.
 */
export const sidebarInteractionCorrections = `
@scope (.crystra-v8-shell) to ([data-section-id="product-page"]) {
 :scope[data-palette][data-crystra-theme] :is([data-section-id="task-section-header"], [data-section-id="workflow-section-header"]):has([data-section-id$="-search-control"]:hover, [data-section-id$="-section-actions"]:hover, [data-section-id$="-view-options-menu"]:hover) {
  background-color: transparent !important;
 }
}
`;

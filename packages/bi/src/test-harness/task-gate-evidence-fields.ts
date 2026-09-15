/** Static v8 design samples; no code from the source is executed.
 * Source SHA256: b5eefc9739ab1d995e4c10cbb0e90c8dcb2fa099cc4b707ec47a574a46b2af87
 */
export const taskGateEvidenceFields = [
  ["plan-title", "plan-copy", "plan-action", "gate-evidence-plan-context"],
  [
    "trigger-title",
    "trigger-copy",
    "trigger-action",
    "gate-evidence-trigger-record",
  ],
  [
    "change-title",
    "change-copy",
    "change-action",
    "gate-evidence-proposed-change",
  ],
  [
    "validation-title",
    "validation-copy",
    "validation-action",
    "gate-evidence-validation-result",
  ],
  [
    "decision-title",
    "decision-copy",
    "decision-action",
    "gate-evidence-governing-decision",
  ],
] as const;

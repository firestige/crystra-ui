export function ChatPlaceholder() {
  return (
    <section
      data-section-id="input-stream"
      data-host-owned="dsh-input"
      aria-label="Chat"
      className="layout-placeholder"
    >
      <span>Chat</span>
    </section>
  );
}
export function BenchPlaceholder() {
  return (
    <section
      data-section-id="control-workspace"
      aria-label="Bench"
      className="layout-placeholder"
    >
      <span>Bench</span>
    </section>
  );
}

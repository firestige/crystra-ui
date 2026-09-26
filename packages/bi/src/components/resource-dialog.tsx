import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./design-system";
import "./resource-dialog.css";
export function ResourceDialog({
  title,
  children,
  busy,
  onCancel,
  onSubmit,
  submitLabel = "保存",
}: {
  title: string;
  children: ReactNode;
  busy?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="crystra-bi crystra-resource-dialog"
      data-crystra-theme="dark"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) onSubmit();
        }}
      >
        <h2>{title}</h2>
        <div className="crystra-resource-dialog-body">{children}</div>
        <footer>
          <Button
            type="button"
            appearance="ghost"
            disabled={busy}
            onClick={onCancel}
          >
            取消
          </Button>
          <Button
            type="submit"
            appearance="solid"
            tone="primary"
            disabled={busy}
          >
            {busy ? "保存中…" : submitLabel}
          </Button>
        </footer>
      </form>
    </dialog>
  );
}

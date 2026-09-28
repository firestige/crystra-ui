import {
  forwardRef,
  useLayoutEffect,
  useRef,
  useImperativeHandle,
  type DialogHTMLAttributes,
  type ReactNode,
} from "react";
import { IconButton, Typography } from "./design-system";
import { Icon } from "./icon";
export function ModalCloseButton({
  onClose,
  label,
}: {
  onClose: () => void;
  label: string;
}) {
  return (
    <IconButton appearance="ghost" aria-label={label} onClick={onClose}>
      <Icon name="x" />
    </IconButton>
  );
}
/** Native modal lifecycle and optional chrome; content/layout remains a slot.
 * Controlled open and imperative native refs support both existing callers. */
export const ModalFrame = forwardRef<
  HTMLDialogElement,
  Omit<DialogHTMLAttributes<HTMLDialogElement>, "title"> & {
    heading?: string;
    description?: ReactNode;
    closeLabel?: string;
    onDismiss?: () => void;
    footer?: ReactNode;
  }
>(function ModalFrame(
  {
    open,
    heading,
    description,
    closeLabel,
    onDismiss,
    footer,
    children,
    onCancel,
    ...props
  },
  ref,
) {
  const dialog = useRef<HTMLDialogElement>(null);
  useImperativeHandle(ref, () => dialog.current!);
  useLayoutEffect(() => {
    const el = dialog.current;
    if (open === undefined || !el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
    return () => {
      if (el.open) el.close();
    };
  }, [open]);
  return (
    <dialog
      {...props}
      ref={dialog}
      onCancel={(event) => {
        onCancel?.(event);
        if (!event.defaultPrevented && onDismiss) {
          event.preventDefault();
          onDismiss();
        }
      }}
    >
      {heading && (
        <header>
          <div>
            <Typography as="h2" variant="section-title">
              {heading}
            </Typography>
            {description}
          </div>
          {onDismiss && (
            <ModalCloseButton
              label={closeLabel ?? `关闭${heading}`}
              onClose={onDismiss}
            />
          )}
        </header>
      )}
      {children}
      {footer && <footer>{footer}</footer>}
    </dialog>
  );
});

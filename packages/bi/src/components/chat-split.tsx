import type { HTMLAttributes } from "react";
import "../chat-split.css";
export function ChatSplitDivider(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={["crystra-chat-divider", props.className]
        .filter(Boolean)
        .join(" ")}
      role="separator"
      aria-label="调整对话栏宽度"
      aria-orientation="vertical"
      tabIndex={0}
    />
  );
}

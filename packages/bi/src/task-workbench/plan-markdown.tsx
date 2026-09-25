import { fromMarkdown } from "mdast-util-from-markdown";
import { createElement, type ReactNode } from "react";
import type { RootContent } from "mdast";
/** Basic CommonMark presentation. Raw HTML is text; unsafe links are inert. */
export function PlanMarkdown({ source }: { source: string }) {
  const render = (node: RootContent, key: number): ReactNode => {
    const children =
      "children" in node
        ? node.children.map((n, i) => render(n as RootContent, i))
        : undefined;
    switch (node.type) {
      case "text":
        return node.value;
      case "paragraph":
        return <p key={key}>{children}</p>;
      case "heading":
        return createElement(
          `h${Math.min(6, node.depth + 2)}`,
          { key },
          children,
        );
      case "strong":
        return <strong key={key}>{children}</strong>;
      case "emphasis":
        return <em key={key}>{children}</em>;
      case "inlineCode":
        return <code key={key}>{node.value}</code>;
      case "code":
        return (
          <pre key={key}>
            <code>{node.value}</code>
          </pre>
        );
      case "blockquote":
        return <blockquote key={key}>{children}</blockquote>;
      case "list":
        return node.ordered ? (
          <ol key={key} start={node.start ?? 1}>
            {children}
          </ol>
        ) : (
          <ul key={key}>{children}</ul>
        );
      case "listItem":
        return <li key={key}>{children}</li>;
      case "break":
        return <br key={key} />;
      case "thematicBreak":
        return <hr key={key} />;
      case "link":
        return /^(https?:\/\/|mailto:|#)/i.test(node.url) ? (
          <a key={key} href={node.url} rel="noreferrer" target="_blank">
            {children}
          </a>
        ) : (
          <span key={key}>{children}</span>
        );
      case "image":
        return <span key={key}>{node.alt}</span>;
      case "html":
        return <span key={key}>{node.value}</span>;
      default:
        return children;
    }
  };
  return (
    <div className="crystra-plan-markdown">
      {fromMarkdown(source).children.map(render)}
    </div>
  );
}

/** Preview host owns DSH integration; shared UI receives only a rendering capability. */
import { MarkdownText } from "@deepseek-ai/dsh-client-ui-primitives";
const labels = {
  code: { copyLabel: "复制", copiedLabel: "已复制" },
  footnotes: "脚注",
};
window.crystraRenderResourceMarkdown = (text) => (
  <MarkdownText text={text} labels={labels} />
);
await import("../src/workbench-preview");

import { createRoot } from "react-dom/client";
import { useState } from "react";
import {
  BiSurface,
  WorkflowWorkbench,
  WorkflowMapViewer,
  type WorkflowWorkbenchPage,
} from "../public";
import {
  workflowDesignDefinitions,
  resolveWorkflowDesignLayout,
} from "./workflow-map-design";
const identity = () => {};
export function Scenario() {
  const [page, setPage] = useState<WorkflowWorkbenchPage>("studio"),
    [header, setHeader] = useState<HTMLDivElement | null>(null),
    [draft, setDraft] = useState(""),
    [quote, setQuote] = useState("");
  return (
    <BiSurface
      theme="dark"
      data-crystra-theme="dark"
      className="map-viewer-harness"
    >
      <style>
        {
          "html,body,#root{margin:0;height:100%}.map-viewer-harness{height:100vh}.map-viewer-test-input{flex:1;display:flex;flex-direction:column;padding:16px;gap:12px}.map-viewer-test-input textarea{min-height:100px}.map-viewer-test-note{position:fixed;bottom:4px;right:4px;z-index:100;background:#17253a;padding:4px;font-size:11px}"
        }
      </style>
      <WorkflowWorkbench
        definitionId="design-exploration-only"
        revision="v8-source"
        title={workflowDesignDefinitions[0].title}
        description={workflowDesignDefinitions[0].description ?? ""}
        page={page}
        onPageChange={setPage}
        context={<div ref={setHeader} />}
        input={
          <div className="map-viewer-test-input">
            <div data-section-id="conversation-feed">原生内容保留检查</div>
            <textarea
              aria-label="隔离 Input 替身"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </div>
        }
        panels={{
          studio: (
            <WorkflowMapViewer
              initialIR={workflowDesignDefinitions[0]}
              resolveLayout={resolveWorkflowDesignLayout}
              headerContainer={page === "studio" ? header : null}
              mode="studio"
              onIdentity={identity}
              onQuote={(text, id) => {
                setDraft(text);
                setQuote(id ?? "");
              }}
            />
          ),
          resources: <p>资源配置接入中</p>,
          crystallization: <p>结晶投影接入中</p>,
        }}
      />
      <div role="note" className="map-viewer-test-note">
        草案探索 · 定稿布局样本，Input 为隔离替身
        {quote ? ` · 引用 ${quote}` : ""}
      </div>
    </BiSurface>
  );
}
createRoot(document.getElementById("root")!).render(<Scenario />);

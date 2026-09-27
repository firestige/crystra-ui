import { MarkdownText } from "@deepseek-ai/dsh-client-ui-primitives";
import { useState } from "react";
import { WorkflowStudioPage, Tabs, Button, Icon } from "crystra-ui-core";
import {
  WorkflowMapWorkbench,
  WorkflowResourceBrowser,
  WorkflowCrystallization,
} from "crystra-ui-core";
import {
  useWorkflowPreview,
  previewLayout,
  previewSamples,
} from "./workflow/use-workflow-preview";
import { DevWorkflowTools } from "./workflow/DevWorkflowTools";
import { crystallizationData } from "./workflow/crystallization-data";
import type { Route } from "../../../wsr-dsh/src/client/navigation/routes";
import { navigate } from "./useRoute";
import "./workflow-v8-assembly.css";
/** Dev host only: assemble the existing v8 tools with its exact layout/resource assets. */
export function WorkflowV8Assembly({
  route,
}: {
  route: Extract<Route, { page: "workflow" }>;
}) {
  const host = useWorkflowPreview();
  const [navigation, setNavigation] = useState<HTMLDivElement | null>(null);
  const [header, setHeader] = useState<HTMLElement | null>(null);
  const labels = {
    code: { copyLabel: "复制", copiedLabel: "已复制" },
    footnotes: "脚注",
  };
  const mode = route.view ?? "studio";
  const changeTab = (view: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    navigate(url.pathname + url.search);
  };
  return (
    <WorkflowStudioPage
      layout="actions"
      title={host.workflow.title}
      description={`v8 设计样本 · ${host.workflow.description}`}
      navigation={<div ref={setNavigation} />}
      context={<div ref={setHeader} style={{ width: "100%" }} />}
      chat={
        <section
          className="v8-assembly-chat"
          data-host-owned="dsh-input"
          aria-label="工作流对话（设计预览）"
        >
          <div className="v8-assembly-feed" data-section-id="conversation-feed">
            <div className="map-chat">
              <div className="map-chat-label">工作流对话 · 本地交互演示</div>
              {host.messages.map((m, i) => (
                <article key={i} className={"map-message " + m.role}>
                  {m.text}
                </article>
              ))}
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              host.submit();
            }}
            className="v8-assembly-composer"
          >
            <textarea
              aria-label="工作流对话草稿"
              value={host.draft}
              onChange={(e) => host.setDraft(e.target.value)}
              placeholder="选择图中的对象，或描述你想调整的内容…"
            />
            <div>
              <span>本地交互演示 · 未连接 Agent</span>
              <Button
                type="submit"
                data-section-id="composer-send"
                aria-label="发送预览消息"
              >
                <Icon name="arrow-up" />
              </Button>
            </div>
          </form>
        </section>
      }
      bench={
        <div
          className="crystra-bi v8-assembly-bench"
          data-crystra-theme="dark"
          data-section-id="workflow-workbench"
          data-reference="crystra-workflow-studio-v8.html"
        >
          <Tabs
            aria-label="工作流工作面"
            appearance="underline"
            value={mode}
            onValueChange={changeTab}
            navigationContainer={navigation}
            items={[
              { value: "studio", label: "流程设计", panel: null },
              { value: "resources", label: "资源配置", panel: null },
              { value: "crystallization", label: "结晶分析", panel: null },
            ]}
          />
          <section
            hidden={mode === "resources"}
            className="v8-assembly-map"
            data-section-id="control-bench"
          >
            <WorkflowMapWorkbench
              mode={mode}
              workflow={host.workflow}
              headerContainer={header}
              onQuote={host.quote}
              layoutResolver={previewLayout}
              actions={
                <DevWorkflowTools
                  ir={host.workflow}
                  samples={previewSamples}
                  previewLayout={previewLayout}
                  onChange={host.setWorkflow}
                />
              }
              crystallization={
                <WorkflowCrystallization
                  data={crystallizationData}
                  quote={host.quote}
                />
              }
            />
          </section>
          <section
            hidden={mode !== "resources"}
            className="v8-assembly-resources"
          >
            {host.workspace && (
              <WorkflowResourceBrowser
                key={host.workspace.root}
                initialPath="roles/implementer.role.md"
                workspace={host.workspace}
                onQuote={host.quote}
                onSave={host.save}
                onMutation={host.mutate}
                onDirtyChange={host.setDirty}
                renderMarkdown={(text) => (
                  <MarkdownText text={text} labels={labels} />
                )}
                sourceNotice="当前使用 v8 文件快照；编辑只更新本地页面样本，不写入磁盘，尚未连接 Agent。"
                saveNotice="已保存到页面样本 · 未写入磁盘"
                mutationNotice="资源样本已更新 · 未连接运行时"
              />
            )}
          </section>
        </div>
      }
    />
  );
}

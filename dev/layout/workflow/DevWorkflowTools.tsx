import { parseWorkflowMap } from "../../../packages/bi/src/domain/workflow-map-ir";
import { useRef, useState } from "react";
import { Button, IconButton, Icon, Typography } from "crystra-ui-core";
import type {
  WorkflowMapIR,
  MapIssue,
} from "../../../packages/bi/src/domain/workflow-map-ir";
import type { WorkflowLayoutResolver } from "../../../packages/bi/src/components/workflow-map-workbench";
const MapIconButton = IconButton;
export function DevWorkflowTools({
  ir,
  samples,
  previewLayout,
  onChange,
}: {
  ir: WorkflowMapIR;
  samples: WorkflowMapIR[];
  previewLayout: WorkflowLayoutResolver;
  onChange: (ir: WorkflowMapIR) => void;
}) {
  const lab = useRef<HTMLDialogElement>(null),
    publish = useRef<HTMLDialogElement>(null);
  const [json, setJson] = useState(""),
    [inputErrors, setInputErrors] = useState<MapIssue[]>([]),
    [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<WorkflowMapIR | null>(null);
  const candidate = null,
    candidatePreview = true,
    direction = "RIGHT";
  const parsed = parseWorkflowMap(ir);
  const issues = parsed.ok ? parsed.issues : parsed.errors;
  const load = onChange;
  const acceptInput = async () => {
    let value: unknown;
    try {
      value = JSON.parse(json);
    } catch {
      setInputErrors([
        {
          code: "JSON_SYNTAX",
          path: "$",
          message: "JSON 格式不完整，当前图保持不变。",
          severity: "blocking",
        },
      ]);
      return;
    }
    const result = parseWorkflowMap(value);
    if (!result.ok) {
      setInputErrors(result.errors);
      return;
    }
    try {
      await previewLayout(
        result.ir,
        new Set(
          result.ir.nodes.filter((n) => n.kind === "group").map((n) => n.id),
        ),
        direction,
      );
    } catch (e) {
      setInputErrors([
        {
          code: "LAYOUT_REJECTED",
          path: "$",
          message: "该定义暂时无法布局，当前图保持不变：" + String(e),
          severity: "blocking",
        },
      ]);
      return;
    }
    setInputErrors([]);
    load(result.ir);
    lab.current?.close();
  };
  return (
    <>
      <IconButton
        aria-label="保存草稿"
        onClick={() => {
          try {
            localStorage.setItem("crystra-map-draft", JSON.stringify(ir));
          } catch {
            setError("本地保存失败");
          }
        }}
      >
        <Icon name="check" />
      </IconButton>
      <Button onClick={() => publish.current?.showModal()}>发布版本</Button>
      <IconButton
        aria-label="打开设计验证台"
        onClick={() => {
          setJson(JSON.stringify(ir, null, 2));
          lab.current?.showModal();
        }}
      >
        <Icon name="help" />
      </IconButton>
      {error && <span role="alert">{error}</span>}
      {snapshot && <span>已创建只读演示版本</span>}
      <dialog ref={lab} className="map-dialog map-lab" aria-label="设计验证台">
        <div className="map-panel-head">
          <Typography variant="section-title">设计验证台</Typography>
          <MapIconButton
            appearance="ghost"
            aria-label="关闭验证台"
            onClick={() => lab.current?.close()}
          >
            <Icon name="x" />
          </MapIconButton>
        </div>
        <Typography variant="description" tone="secondary">
          {candidatePreview
            ? "当前优先候选：三套样本由同一布局链预生成。修改 JSON 后需重新生成候选数据；不复用旧坐标。"
            : "供本轮验证：同一引擎加载不同方案。Agent 只提供语义 JSON，不填写坐标；非法输入不会替换当前图。"}
        </Typography>
        <div className="map-example-buttons">
          {samples.map((sample, i) => (
            <Button
              key={sample.title}
              appearance="ghost"
              onClick={() => {
                load(structuredClone(sample));
                lab.current?.close();
              }}
            >
              {["开发流程", "系统设计", "科研管理"][i]}
            </Button>
          ))}
        </div>
        <label className="map-json-label">
          Agent 输出 JSONIR
          <textarea
            aria-label="Agent 输出 JSONIR"
            spellCheck={false}
            value={json}
            onChange={(e) => setJson(e.target.value)}
          />
        </label>
        {inputErrors.length > 0 && (
          <div className="map-input-errors" role="alert">
            {inputErrors.map((e, i) => (
              <p key={i}>
                {e.path}：{e.message}
              </p>
            ))}
          </div>
        )}
        <div className="map-dialog-actions">
          <Button
            appearance="ghost"
            onClick={() => {
              try {
                const raw = localStorage.getItem("crystra-map-draft");
                if (raw) setJson(raw);
                else setError("没有已保存的本地草稿。");
              } catch {
                setError("无法读取本地草稿。");
              }
            }}
          >
            读取保存的草稿
          </Button>
          <Button onClick={acceptInput}>校验并显示</Button>
        </div>
      </dialog>
      <dialog ref={publish} className="map-dialog" aria-label="发布检查">
        <div className="map-panel-head">
          <Typography variant="section-title">版本发布检查</Typography>
          <MapIconButton
            appearance="ghost"
            aria-label="关闭发布检查"
            onClick={() => publish.current?.close()}
          >
            <Icon name="x" />
          </MapIconButton>
        </div>
        <Typography variant="description">
          {issues.some((i) => i.severity === "blocking")
            ? "当前有阻塞问题，请先补齐。"
            : "本版结构检查通过。"}
        </Typography>
        <Typography variant="description" tone="secondary">
          这里只验证发布交互，不执行真实发布。生产版本还必须通过 Workflow owner
          的执行定义、资源与准入校验。
        </Typography>
        {issues.map((i, index) => (
          <Typography key={index} variant="description">
            {i.message}
          </Typography>
        ))}
        <Button
          disabled={
            issues.some((i) => i.severity === "blocking") || !!candidate
          }
          onClick={() => {
            const checked = parseWorkflowMap(ir);
            if (
              !checked.ok ||
              checked.issues.some((i) => i.severity === "blocking")
            )
              return;
            setSnapshot(structuredClone(ir));
            publish.current?.close();
          }}
        >
          创建只读演示版本
        </Button>
      </dialog>
    </>
  );
}

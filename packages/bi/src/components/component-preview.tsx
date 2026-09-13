import { useState } from "react";
import "../component-preview.css";
import "../crystra-components.css";
import "../crystra-theme.css";
import "../primitives.css";
import {
  Button,
  Card,
  Chip,
  Divider,
  Icon,
  IconButton,
  List,
  ListItem,
  Menu,
  Tabs,
  Typography,
  type ButtonProps,
  type ComponentSize,
  type SemanticTone,
} from "../public";
import "../shared.css";
import { DeliveryDirectoryPreview } from "./delivery-directory-preview";
import { ResultAnalysisPreview } from "./result-analysis-preview";
import { SearchPreview } from "./search-preview";
import { StatePreview } from "./state-preview";
import { ToggleSwitchPreview } from "./toggle-switch-preview";
export function ComponentPreview() {
  const [appearance, setAppearance] =
    useState<ButtonProps["appearance"]>("outline");
  const [tone, setTone] = useState<SemanticTone>("primary");
  const [size, setSize] = useState<ComponentSize>("compact");
  const [disabled, setDisabled] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [tab, setTab] = useState("plan");
  const [tabAppearance, setTabAppearance] = useState<"soft" | "underline">(
    "soft",
  );
  const [selected, setSelected] = useState("release");
  const [lastAction, setLastAction] = useState("尚未操作");
  return (
    <main className="crystra-bi component-preview" data-crystra-theme="dark">
      <Typography as="h1" variant="page-title">
        Crystra · 基础组件
      </Typography>
      <Typography as="p" variant="description" tone="secondary">
        以 Task v8 的现有结构为基线；这里只比较自有组件，整个 DSH Input
        保持宿主所有权。
      </Typography>
      <ResultAnalysisPreview />
      <DeliveryDirectoryPreview />
      <SearchPreview />
      <div className="preview-controls">
        <label>
          外观
          <select
            aria-label="外观"
            value={appearance}
            onChange={(e) =>
              setAppearance(e.target.value as ButtonProps["appearance"])
            }
          >
            {["outline", "solid", "ghost"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          语义色
          <select
            aria-label="语义色"
            value={tone}
            onChange={(e) => setTone(e.target.value as SemanticTone)}
          >
            {["neutral", "primary", "success", "warning", "danger"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          尺寸
          <select
            aria-label="尺寸"
            value={size}
            onChange={(e) => setSize(e.target.value as ComponentSize)}
          >
            {["compact", "regular"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
          />
          禁用
        </label>
      </div>
      <Card
        heading="Button / IconButton"
        description="外观、语义色与尺寸分别组合；点击区域不会跟随 hover 改变大小。"
      >
        <div className="preview-row">
          <Button
            appearance={appearance}
            tone={tone}
            size={size}
            disabled={disabled}
            onClick={() => setClicks((x) => x + 1)}
            startIcon={<Icon name="arrow-up-right" />}
          >
            查看影响
          </Button>
          <IconButton
            aria-label="复制"
            appearance={appearance}
            tone={tone}
            size={size}
            disabled={disabled}
            onClick={() => setClicks((x) => x + 1)}
          >
            <Icon name="copy" />
          </IconButton>
          <Typography variant="meta" tone="secondary">
            已点击 {clicks} 次
          </Typography>
        </div>
      </Card>
      <ToggleSwitchPreview size={size} disabled={disabled} />
      <div className="preview-grid">
        <Card
          heading="当前决策状态"
          description="Card header / actions / content"
          actions={
            <IconButton aria-label="展开当前决策">
              <Icon name="arrow-up-right" />
            </IconButton>
          }
        >
          <Card
            level="inset"
            padding="compact"
            heading="与本次问题相关的已确认决定"
          >
            <div className="preview-stack">
              <Typography variant="body-compact">
                <Icon name="check" /> 保持公开 API 兼容
              </Typography>
              <Typography variant="body-compact">
                <Icon name="check" /> 禁止自动公开发布
              </Typography>
            </div>
          </Card>
          <div className="preview-separated">
            <Card tone="primary" padding="compact" heading="AI 当前理解">
              <Typography variant="body">
                允许修改签名配置并重试，成功后返回审核。
              </Typography>
            </Card>
          </div>
        </Card>
        <Card
          tone="warning"
          heading="需要你审核"
          actions={<Chip tone="warning">1 项</Chip>}
          footer={
            <Button
              appearance="ghost"
              tone="warning"
              endIcon={<Icon name="arrow-right" />}
            >
              查看相关问题
            </Button>
          }
        >
          <Typography variant="body">
            保留 Task v8 的黄色提示与细边框，通过组合属性表达。
          </Typography>
        </Card>
      </div>
      <Card heading="Chip / 状态表达">
        <div className="preview-row">
          {(
            ["neutral", "primary", "success", "warning", "danger"] as const
          ).map((t) => (
            <Chip key={t} tone={t} appearance="soft">
              {t}
            </Chip>
          ))}
        </div>
        <div className="preview-row preview-separated">
          {(
            ["neutral", "primary", "success", "warning", "danger"] as const
          ).map((t) => (
            <Chip key={t} tone={t} appearance="outline">
              {t}
            </Chip>
          ))}
        </div>
      </Card>
      <Card heading="Surface / Divider">
        <div className="preview-row">
          <Typography variant="body">左侧区域</Typography>
          <Divider orientation="vertical" />
          <Typography variant="body">右侧区域</Typography>
        </div>
        <div className="preview-separated">
          <Divider />
        </div>
      </Card>
      <Card
        heading="List / ListItem · 资源条目"
        description="主入口和右侧操作区互不触发；共用上方尺寸选择器。"
      >
        <List aria-label="示例任务" size={size} divided>
          {[
            {
              id: "release",
              title: "发布插件市场方案",
              description: "验证发布路径，并将重复步骤抽象为 Workflow",
              status: "需要审核",
            },
            {
              id: "ui",
              title: "UI 工作台设计",
              description: "沿用已确认的字体、配色与图标资产",
              status: "运行中",
            },
          ].map((item) => (
            <ListItem
              key={item.id}
              primary={item.title}
              description={item.description}
              leading={<Icon name="arrow-up-right" size="navigation" />}
              metadata={
                <Chip tone={item.id === "release" ? "warning" : "primary"}>
                  {item.status}
                </Chip>
              }
              selected={selected === item.id}
              onActivate={() => {
                setSelected(item.id);
                setLastAction(`打开：${item.title}`);
              }}
              actions={
                <Menu
                  label={`${item.title}操作`}
                  size={size}
                  items={[
                    {
                      id: "view",
                      label: "查看详情",
                      onSelect: () => setLastAction(`查看详情：${item.title}`),
                    },
                    {
                      id: "copy",
                      label: "复制标识（演示）",
                      icon: <Icon name="copy" />,
                      onSelect: () => setLastAction(`复制标识：${item.id}`),
                    },
                    {
                      id: "pending",
                      label: "其他操作待定义",
                      disabled: true,
                      onSelect: () => {},
                    },
                  ]}
                />
              }
            />
          ))}
        </List>
        <Typography as="p" variant="meta" aria-live="polite">
          {lastAction}
        </Typography>
      </Card>
      <Card
        heading="Tabs · 工作台内容切换"
        description="方向键移动焦点，Enter / Space 激活；面板状态在切换时保留。"
      >
        <div className="preview-controls">
          <label>
            Tabs 外观
            <select
              aria-label="Tabs 外观"
              value={tabAppearance}
              onChange={(e) =>
                setTabAppearance(e.target.value as "soft" | "underline")
              }
            >
              <option value="soft">soft</option>
              <option value="underline">underline</option>
            </select>
          </label>
        </div>
        <Tabs
          aria-label="工作台样例"
          value={tab}
          onValueChange={setTab}
          size={size}
          appearance={tabAppearance}
          items={[
            {
              value: "plan",
              label: (
                <>
                  计划 <Chip>v4</Chip>
                </>
              ),
              panel: (
                <Typography variant="body">
                  当前计划的结构化展示区域。
                </Typography>
              ),
            },
            {
              value: "execution",
              label: "执行",
              panel: (
                <Typography variant="body">
                  当前执行的运行概况与证据索引。
                </Typography>
              ),
            },
            {
              value: "review",
              label: (
                <>
                  审核 <Chip tone="warning">1</Chip>
                </>
              ),
              panel: (
                <Card padding="compact" tone="warning" heading="等待用户决定">
                  <Typography variant="body">
                    本次问题的已确认决定、AI 当前理解与影响。
                  </Typography>
                </Card>
              ),
            },
            { value: "future", label: "禁用样例", disabled: true, panel: null },
          ]}
        />
      </Card>
      <StatePreview size={size} />
      <Card heading="Typography">
        <div className="preview-stack">
          {(
            [
              "page-title",
              "section-title",
              "card-title",
              "item-title",
              "body",
              "description",
              "meta",
            ] as const
          ).map((v) => (
            <Typography key={v} variant={v}>
              {v} · 统一的语义文字层级
            </Typography>
          ))}
        </div>
      </Card>
    </main>
  );
}

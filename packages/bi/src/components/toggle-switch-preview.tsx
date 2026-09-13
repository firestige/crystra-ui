import { useState } from "react";
import { Card, Icon, Typography } from "../public";
import { ToggleSwitch, type ToggleSwitchProps } from "./toggle-switch";

function Sample({
  initial = false,
  ...props
}: Omit<ToggleSwitchProps, "checked" | "onCheckedChange"> & {
  initial?: boolean;
}) {
  const [checked, setChecked] = useState(initial);
  return (
    <div className="switch-preview-sample">
      <ToggleSwitch {...props} checked={checked} onCheckedChange={setChecked} />
      <Typography variant="meta" tone="secondary">
        {(props.labels ?? ["关闭", "开启"])[checked ? 1 : 0]}
      </Typography>
    </div>
  );
}

export function ToggleSwitchPreview({
  size,
  disabled,
}: {
  size: "compact" | "regular";
  disabled: boolean;
}) {
  return (
    <Card
      heading="Toggle / Switch"
      description="一个控件、两个位置；点击或 Space / Enter 切换，滑块平滑移动。圆角与方角分别比较。"
    >
      <div className="switch-preview-grid">
        {(["round", "square"] as const).flatMap((shape) =>
          (["plain", "thumb", "views"] as const).map((kind) => {
            const title = `${shape === "round" ? "圆角" : "方角"} · ${kind === "plain" ? "纯滑块" : kind === "thumb" ? "滑块图标" : "双图标切换"}`;
            const props: Omit<
              ToggleSwitchProps,
              "checked" | "onCheckedChange"
            > = {
              shape,
              size,
              disabled,
              label: title,
              ...(kind === "thumb"
                ? { icons: [<Icon name="x" />, <Icon name="check" />] as const }
                : {}),
              ...(kind === "views"
                ? ({
                    mode: "choice",
                    iconPlacement: "track",
                    labels: ["Gallery", "List"],
                    icons: [
                      <Icon name="table" />,
                      <Icon name="clipboard-list" />,
                    ],
                  } as const)
                : {}),
            };
            return (
              <section
                key={`${shape}-${kind}`}
                className="switch-preview-example"
              >
                <Typography as="h3" variant="item-title">
                  {title}
                </Typography>
                <div className="switch-preview-pair">
                  <Sample {...props} label={`${title} A`} />
                  <Sample {...props} label={`${title} B`} initial />
                </div>
                <Typography variant="description" tone="secondary">
                  {kind === "views"
                    ? "两个图标留在轨道上，滑块标记当前视图。"
                    : kind === "thumb"
                      ? "图标随滑块移动，分别表示关与开。"
                      : "通过轨道颜色与滑块位置表示关与开。"}
                </Typography>
              </section>
            );
          }),
        )}
      </div>
      <Typography as="p" variant="description" tone="secondary">
        共用顶部尺寸与禁用选项；这组样式待确认。
      </Typography>
    </Card>
  );
}

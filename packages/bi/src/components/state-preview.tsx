import { useState } from "react";
import { List, ListItem } from "./collection-components";
import { Button, Card, Typography, type ComponentSize } from "./design-system";
import {
  EmptyState,
  FullBenchViewer,
  Popover,
  ProgressNotice,
  SearchField,
  SelectField,
  SelectionControl,
} from "./state-components";
export function StatePreview({ size }: { size: ComponentSize }) {
  const [query, setQuery] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);
  const [order, setOrder] = useState("asc");
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState<number | null>(null);
  const [selected, setSelected] = useState(false);
  const rows = Array.from(
    { length: 18 },
    (_, i) => `示例条目 ${String(i + 1).padStart(2, "0")}`,
  ).filter((x) => x.includes(query));
  if (order === "desc") rows.reverse();
  const visible = onlySelected ? rows.slice(0, 1) : rows;
  return (
    <>
      <Card
        heading="搜索、筛选与选择"
        description="自有资源控件；不影响 DSH Input。尺寸沿用顶部选择器。"
      >
        <div className="preview-row">
          <SearchField
            label="搜索条目"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            size={size}
          />
          <SelectField
            label="排列顺序"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            size={size}
            options={[
              { value: "asc", label: "示例顺序" },
              { value: "desc", label: "示例逆序" },
            ]}
          />
          <SelectField
            label="向上展开"
            menuPlacement="top"
            defaultValue="expected"
            size={size}
            options={[
              { value: "expected", label: "预期路径" },
              { value: "all", label: "全部路径" },
            ]}
          />
          <Popover label="筛选条件" size={size}>
            <SelectionControl
              label="仅显示首项（演示）"
              type="checkbox"
              checked={onlySelected}
              onChange={(e) => setOnlySelected(e.target.checked)}
            />
            <Typography variant="meta">筛选状态保留在外层。</Typography>
          </Popover>
          <SelectionControl
            label="选中示例资源"
            type="checkbox"
            checked={selected}
            onChange={(e) => setSelected(e.target.checked)}
          />
        </div>
      </Card>
      <Card
        heading="空卡与完整查看"
        description="静态骨架不表示加载。展开后占用本示例分配的全部 bench 高度。"
      >
        <div className="preview-bench">
          <FullBenchViewer
            title="条目列表"
            expanded={expanded}
            onExpandedChange={setExpanded}
            preview={
              visible.length ? (
                <>
                  <List size={size}>
                    {visible.slice(0, 3).map((x) => (
                      <ListItem key={x} primary={x} />
                    ))}
                  </List>
                  <Typography variant="meta">
                    共 {visible.length} 项，预览最多 3 项
                  </Typography>
                </>
              ) : (
                <EmptyState label="没有匹配的条目" />
              )
            }
          >
            {visible.length ? (
              <List size={size}>
                {visible.map((x) => (
                  <ListItem
                    key={x}
                    primary={x}
                    description="完整视图中的条目说明"
                  />
                ))}
              </List>
            ) : (
              <EmptyState label="没有匹配的条目" />
            )}
          </FullBenchViewer>
        </div>
        <EmptyState label="没有待裁决内容" />
      </Card>
      <Card
        heading="右下角进度通知"
        description="只用于实际耗时操作；此处由按钮推进演示进度，不模拟后台任务。"
      >
        <div className="preview-row">
          <Button onClick={() => setNotice(0)}>显示通知</Button>
          <Button
            disabled={notice === null || notice === 100}
            onClick={() => setNotice((x) => Math.min(100, (x ?? 0) + 25))}
          >
            推进 25%
          </Button>
        </div>
      </Card>
      {notice !== null && (
        <ProgressNotice
          label={notice === 100 ? "示例操作已完成" : "示例耗时操作"}
          value={notice}
          onDismiss={() => setNotice(null)}
        />
      )}
    </>
  );
}

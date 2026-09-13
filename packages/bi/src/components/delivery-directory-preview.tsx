import { useMemo, useState } from "react";
import type { DeliverySearchRecord } from "../domain/delivery-search";
import {
  deliveryDirectoryRecords,
  deliveryDirectorySearchFields,
} from "../test-harness/delivery-directory-fixture";
import { DeliveryDirectory } from "./delivery-directory";
import { Card, Typography } from "./design-system";
import { SelectField } from "./state-components";
export function DeliveryDirectoryPreview() {
  const [period, setPeriod] = useState("7d");
  const [selected, setSelected] = useState<DeliverySearchRecord | null>(null);
  const range = useMemo<readonly [string, string]>(
    () =>
      period === "empty"
        ? ["2026-09-10T00:00:00+08:00", "2026-09-10T23:59:59+08:00"]
        : [
            period === "7d"
              ? "2026-09-03T00:00:00+08:00"
              : "2026-08-11T00:00:00+08:00",
            "2026-09-09T23:59:59+08:00",
          ],
    [period],
  );
  return (
    <section id="delivery-directory-review">
      <Card
        heading="Delivery 检索目录 · 已确认"
        description="复用 SearchField 与 List；新增无描边选中态。每条结果是一条 Delivery，按开始时间倒序，不按 Task 或 Workflow 分组。"
      >
        <div className="delivery-directory-review">
          <DeliveryDirectory
            searchFields={deliveryDirectorySearchFields}
            records={deliveryDirectoryRecords}
            range={range}
            selectedId={selected?.deliveryId ?? null}
            onSelectionChange={setSelected}
          />
          <div className="preview-stack delivery-directory-review-output">
            <SelectField
              label="模拟页面 Header 时间范围"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              options={[
                { value: "7d", label: "最近 7 天" },
                { value: "30d", label: "最近 30 天" },
                { value: "empty", label: "无记录的时间范围" },
              ]}
            />
            <Typography variant="description">
              下方回显组件输出的选中身份；正式接入后由页面使用 traceId
              加载瀑布图／树图。
            </Typography>
            <output aria-label="目录选中结果">
              {selected ? (
                <>
                  {selected.deliveryId}
                  <br />
                  {selected.taskName}
                  <br />
                  Trace：{selected.traceId}
                </>
              ) : (
                "无选中 Delivery，右侧应为空态"
              )}
            </output>
            <Typography variant="description" tone="secondary">
              在搜索框前缀选择检索字段，输入后按 Enter 执行检索；清空输入后按
              Enter 恢复时间范围内的结果。下方 chip
              仅展示可独立关闭的结果筛选条件。
            </Typography>
            <Typography variant="description" tone="secondary">
              本样本声明 Task ID／名称、Workflow（名称或
              name@version）、Delivery ID
              为待接入索引字段，生产端须由查询能力清单确认。
            </Typography>
          </div>
        </div>
      </Card>
    </section>
  );
}

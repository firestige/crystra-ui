import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "../delivery-directory.css";
import {
  filterDeliveryResults,
  searchDeliveries,
  selectedDelivery,
  type DeliveryFilters,
  type DeliverySearchCondition,
  type DeliverySearchField,
  type DeliverySearchRecord,
} from "../domain/delivery-search";
import { List, ListItem } from "./collection-components";
import { Chip, IconButton, Typography } from "./design-system";
import { Icon } from "./icon";
import { SearchField, SelectField } from "./state-components";

function ConditionChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Chip appearance="soft" className="delivery-condition-chip">
      <span>{label}</span>
      <IconButton
        appearance="ghost"
        aria-label={`移除条件：${label}`}
        onClick={onRemove}
      >
        <Icon name="x" />
      </IconButton>
    </Chip>
  );
}
export function DeliveryDirectory({
  records,
  range,
  selectedId,
  onSelectionChange,
  searchFields,
  paging,
  onSearchChange,
}: {
  paging?: {
    total?: number;
    hasMore: boolean;
    loading: boolean;
    onLoadMore: () => void;
  };
  onSearchChange?: (conditions: DeliverySearchCondition[]) => void;
  records: readonly DeliverySearchRecord[];
  range: readonly [string, string];
  selectedId: string | null;
  onSelectionChange: (delivery: DeliverySearchRecord | null) => void;
  searchFields: readonly DeliverySearchField[];
}) {
  const [fieldKey, setFieldKey] = useState(searchFields[0]?.key ?? "taskName");
  const field =
    searchFields.find((item) => item.key === fieldKey) ?? searchFields[0];
  const [draft, setDraft] = useState("");
  const [conditions, setConditions] = useState<DeliverySearchCondition[]>([]);
  useEffect(() => {
    onSearchChange?.(conditions);
  }, [conditions, onSearchChange]);
  const [filters, setFilters] = useState<DeliveryFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [limit, setLimit] = useState(10);
  const [windowStart, setWindowStart] = useState(0);
  const [rowHeight, setRowHeight] = useState(0);
  const scroll = useRef<HTMLDivElement>(null),
    sentinel = useRef<HTMLDivElement>(null);
  const filterId = useId();
  const base = useMemo(
    () => searchDeliveries(records, conditions, range, searchFields),
    [records, conditions, range, searchFields],
  );
  const matches = useMemo(
    () => filterDeliveryResults(base, filters),
    [base, filters],
  );
  const tasks = [...new Map(base.map((row) => [row.taskId, row])).values()];
  const workflows = [
    ...new Map(base.map((row) => [row.workflowId, row])).values(),
  ];
  const versions = [...new Set(base.map((row) => row.workflowVersion))].sort();
  const taskLabel = (id: string) =>
    `${records.find((row) => row.taskId === id)?.taskName ?? "Task"} · ${id}`;
  const workflowLabel = (id: string) =>
    `${records.find((row) => row.workflowId === id)?.workflowName ?? "Workflow"} · ${id}`;
  const activeCount = Object.values(filters).filter(Boolean).length;
  const addCondition = () => {
    const value = draft.trim();
    if (!field) return;
    if (!value) {
      setConditions([]);
      return;
    }
    const id = `${field.key}:${field.match === "contains" || (field.match === "workflow" && !value.includes("@")) ? value.toLocaleLowerCase() : value}`;
    setConditions([{ id, field: field.key, value }]);
  };
  const removeFilter = (key: keyof DeliveryFilters) =>
    setFilters((current) => ({ ...current, [key]: undefined }));
  const selected = selectedDelivery(matches, selectedId);
  useLayoutEffect(() => {
    if ((selected?.deliveryId ?? null) !== selectedId)
      onSelectionChange(selected);
  }, [selected, selectedId, onSelectionChange]);
  const queryKey = JSON.stringify([conditions, range, filters]);
  const [previousQuery, setPreviousQuery] = useState(queryKey);
  if (previousQuery !== queryKey) {
    setPreviousQuery(queryKey);
    setLimit(10);
    setWindowStart(0);
  }
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = 0;
  }, [queryKey]);
  useEffect(() => {
    if (
      !sentinel.current ||
      (limit >= matches.length && (!paging?.hasMore || paging.loading))
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          if (limit < matches.length)
            setLimit((value) => Math.min(value + 10, matches.length));
          else if (paging?.hasMore && !paging.loading) paging.onLoadMore();
        }
      },
      { root: scroll.current, rootMargin: "0px 0px 100px 0px" },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [matches.length, limit, paging]);
  useLayoutEffect(() => {
    const first =
      scroll.current?.querySelector<HTMLElement>("[data-delivery-id]");
    const measured = first?.getBoundingClientRect().height ?? 0;
    if (measured > 0 && measured !== rowHeight) setRowHeight(measured);
  }, [matches.length, limit, rowHeight]);
  const visibleCount = Math.min(limit, matches.length);
  const start = Math.min(windowStart, Math.max(0, visibleCount - 1));
  const windowEnd = Math.min(visibleCount, start + 30);
  return (
    <section className="delivery-directory" aria-label="Delivery 检索目录">
      <div className="delivery-directory-header">
        <div className="delivery-directory-heading">
          <Typography as="h3" variant="section-title">
            调用记录
          </Typography>
        </div>
        <SearchField
          label="检索值"
          hideLabel
          size="compact"
          disabled={!field}
          leading={
            <SelectField
              className="delivery-directory-field-selector"
              label="检索字段"
              hideLabel
              appearance="embedded"
              size="compact"
              value={field?.key ?? ""}
              disabled={!field}
              onChange={(event) => {
                setFieldKey(event.target.value as DeliverySearchField["key"]);
                setDraft("");
              }}
              options={searchFields.map((item) => ({
                value: item.key,
                label: item.label,
              }))}
            />
          }
          placeholder={field?.placeholder ?? "无可检索字段"}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              addCondition();
            }
          }}
        />
        <div
          id={filterId}
          className="delivery-filter-disclosure"
          data-open={filterOpen}
          inert={!filterOpen}
          aria-hidden={!filterOpen}
        >
          <div>
            <div className="delivery-filter-form">
              <SelectField
                label="结果中的 Task"
                size="compact"
                value={filters.taskId ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    taskId: event.target.value,
                  }))
                }
                options={[
                  { value: "", label: "全部 Task" },
                  ...tasks.map((row) => ({
                    value: row.taskId,
                    label: taskLabel(row.taskId),
                  })),
                  ...(filters.taskId &&
                  !tasks.some((row) => row.taskId === filters.taskId)
                    ? [
                        {
                          value: filters.taskId,
                          label: taskLabel(filters.taskId) + "（无匹配）",
                        },
                      ]
                    : []),
                ]}
              />
              <SelectField
                label="结果中的 Workflow"
                size="compact"
                value={filters.workflowId ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    workflowId: event.target.value,
                  }))
                }
                options={[
                  { value: "", label: "全部 Workflow" },
                  ...workflows.map((row) => ({
                    value: row.workflowId,
                    label: workflowLabel(row.workflowId),
                  })),
                  ...(filters.workflowId &&
                  !workflows.some(
                    (row) => row.workflowId === filters.workflowId,
                  )
                    ? [
                        {
                          value: filters.workflowId,
                          label:
                            workflowLabel(filters.workflowId) + "（无匹配）",
                        },
                      ]
                    : []),
                ]}
              />
              <SelectField
                label="结果中的版本"
                size="compact"
                value={filters.workflowVersion ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    workflowVersion: event.target.value,
                  }))
                }
                options={[
                  { value: "", label: "全部版本" },
                  ...versions.map((version) => ({
                    value: version,
                    label: version,
                  })),
                  ...(filters.workflowVersion &&
                  !versions.includes(filters.workflowVersion)
                    ? [
                        {
                          value: filters.workflowVersion,
                          label: filters.workflowVersion + "（无匹配）",
                        },
                      ]
                    : []),
                ]}
              />
              <Typography variant="meta" tone="secondary">
                对本次检索的 {base.length} 条结果进行筛选
              </Typography>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="delivery-filter-toggle"
          aria-label="筛选当前结果"
          title={filterOpen ? "收起筛选" : "展开筛选"}
          aria-expanded={filterOpen}
          aria-controls={filterId}
          onClick={() => setFilterOpen((open) => !open)}
        >
          <Icon name="chevron-down" />
        </button>
        <div className="delivery-directory-result-summary">
          <div className="delivery-directory-chip-groups">
            {activeCount > 0 && (
              <div
                className="delivery-directory-conditions"
                aria-label="已应用结果筛选"
              >
                {filters.taskId && (
                  <ConditionChip
                    label={`Task：${taskLabel(filters.taskId)}`}
                    onRemove={() => removeFilter("taskId")}
                  />
                )}
                {filters.workflowId && (
                  <ConditionChip
                    label={`Workflow：${workflowLabel(filters.workflowId)}`}
                    onRemove={() => removeFilter("workflowId")}
                  />
                )}
                {filters.workflowVersion && (
                  <ConditionChip
                    label={`版本：${filters.workflowVersion}`}
                    onRemove={() => removeFilter("workflowVersion")}
                  />
                )}
              </div>
            )}
          </div>
          <Typography variant="meta" role="status">
            {paging?.total !== undefined
              ? `查询命中 ${paging.total} 条，已加载结果中 `
              : paging?.hasMore
                ? "已加载结果中 "
                : ""}
            {matches.length} 条命中
          </Typography>
        </div>
      </div>
      <div
        ref={scroll}
        onScroll={(event) => {
          const element = event.currentTarget;
          const first =
            element.querySelector<HTMLElement>("[data-delivery-id]");
          const measured = first?.getBoundingClientRect().height ?? 0;
          if (measured > 0) {
            setRowHeight(measured);
            setWindowStart(
              Math.max(
                0,
                Math.min(
                  visibleCount - 1,
                  Math.floor(element.scrollTop / measured) - 5,
                ),
              ),
            );
          }
        }}
        className="delivery-directory-results"
        data-testid="delivery-directory-scroll"
      >
        <List
          aria-label="Delivery 结果"
          selectionAppearance="surface"
          size="compact"
        >
          {start > 0 && (
            <li
              aria-hidden="true"
              style={{ height: start * rowHeight, flexShrink: 0 }}
            />
          )}
          {matches.slice(start, windowEnd).map((delivery, index) => (
            <ListItem
              key={delivery.deliveryId}
              aria-setsize={matches.length}
              aria-posinset={start + index + 1}
              data-delivery-id={delivery.deliveryId}
              data-trace-id={delivery.traceId}
              primary={delivery.deliveryId}
              selected={selected?.deliveryId === delivery.deliveryId}
              onActivate={() => onSelectionChange(delivery)}
              description={
                <>
                  <span>
                    {delivery.taskName} · {delivery.taskId}
                  </span>
                  <span>
                    {delivery.workflowName}@{delivery.workflowVersion} ·{" "}
                    {delivery.workflowId}
                  </span>
                  <time dateTime={delivery.startedAt}>
                    {delivery.startedAt
                      ? new Intl.DateTimeFormat("zh-CN", {
                          timeZone: "Asia/Shanghai",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }).format(new Date(delivery.startedAt)) + " UTC+08:00"
                      : "开始时间未提供"}
                  </time>
                </>
              }
            />
          ))}
          {windowEnd < visibleCount && (
            <li
              aria-hidden="true"
              style={{
                height: (visibleCount - windowEnd) * rowHeight,
                flexShrink: 0,
              }}
            />
          )}
        </List>
        {matches.length === 0 && !paging?.hasMore ? (
          <Typography as="p" variant="description" tone="secondary">
            没有匹配的 Delivery，请调整检索条件、结果筛选或时间范围。
          </Typography>
        ) : (
          <div
            ref={sentinel}
            className="delivery-directory-sentinel"
            aria-hidden="true"
          >
            {paging?.loading
              ? "正在加载…"
              : limit < matches.length || paging?.hasMore
                ? "继续向下滚动"
                : "已显示全部结果"}
          </div>
        )}
      </div>
    </section>
  );
}

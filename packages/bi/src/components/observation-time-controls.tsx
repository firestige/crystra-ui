import { useEffect, useRef, useState } from "react";
import { Button, ButtonGroup } from "./design-system";
import { Icon } from "./icon";
import {
  iso,
  normalized,
  observationRange,
  observationRangeError,
  observationRangeLabel,
} from "./observation-time";
export function ObservationTimeControls({
  period,
  onChange,
  refreshCount,
  onRefresh,
}: {
  period: string;
  onChange: (period: string) => void;
  refreshCount: number;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState<[string, string]>(observationRange(period));
  const [month, setMonth] = useState("2026-08-01"),
    [pickingEnd, setPickingEnd] = useState(false);
  const [cadence, setCadence] = useState("0");
  const root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (cadence === "0") return;
    const timer = setInterval(onRefresh, Number(cadence) * 1000);
    return () => clearInterval(timer);
  }, [cadence, onRefresh]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  const move = (n: number) => {
    const next = new Date(month);
    next.setUTCMonth(next.getUTCMonth() + n);
    setMonth(iso(next));
  };
  const pick = (date: string) => {
    if (!pickingEnd) {
      setDraft([date + "T00:00:00", date + "T23:59:59"]);
      setPickingEnd(true);
    } else {
      const first = draft[0].slice(0, 10);
      setDraft(
        date < first
          ? [date + "T00:00:00", first + "T23:59:59"]
          : [first + "T00:00:00", date + "T23:59:59"],
      );
      setPickingEnd(false);
    }
  };
  const error = observationRangeError(draft);
  const valid = !error;
  return (
    <div
      className="obs-time-controls"
      data-header-slot="time"
      data-refresh-sequence={refreshCount}
    >
      <div className="obs-calendar-anchor" ref={root}>
        <Button
          ref={trigger}
          appearance="outline"
          aria-label="选择日期范围"
          title={
            observationRange(period)
              .map((d) => d.replace("T", " "))
              .join(" — ") + " (UTC+08:00)"
          }
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setDraft(observationRange(period));
            setPickingEnd(false);
            setMonth(observationRange(period)[0].slice(0, 7) + "-01");
            setOpen(!open);
          }}
        >
          <Icon name="calendar" />
          {observationRangeLabel(period)}
          <Icon name="chevron-down" />
        </Button>
        {open && (
          <div className="obs-calendar" role="dialog" aria-label="选择时间范围">
            <div className="obs-calendar-inputs">
              <label>
                开始时间
                <input
                  type="datetime-local"
                  step="1"
                  aria-label="开始时间"
                  value={draft[0]}
                  onChange={(e) => setDraft([e.target.value, draft[1]])}
                />
              </label>
              <span>—</span>
              <label>
                结束时间
                <input
                  type="datetime-local"
                  step="1"
                  aria-label="结束时间"
                  value={draft[1]}
                  onChange={(e) => setDraft([draft[0], e.target.value])}
                />
              </label>
            </div>
            <div className="obs-calendar-months">
              {[0, 1].map((offset) => {
                const date = new Date(month);
                date.setUTCMonth(date.getUTCMonth() + offset);
                const year = date.getUTCFullYear(),
                  m = date.getUTCMonth();
                const leading = (date.getUTCDay() + 6) % 7,
                  count = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
                return (
                  <section key={offset}>
                    <header>
                      {offset === 0 ? (
                        <Button
                          appearance="ghost"
                          aria-label="上个月"
                          onClick={() => move(-1)}
                        >
                          <Icon name="arrow-left" />
                        </Button>
                      ) : (
                        <span />
                      )}
                      <strong>
                        {year} 年 {m + 1} 月
                      </strong>
                      {offset === 1 ? (
                        <Button
                          appearance="ghost"
                          aria-label="下个月"
                          onClick={() => move(1)}
                        >
                          <Icon name="arrow-right" />
                        </Button>
                      ) : (
                        <span />
                      )}
                    </header>
                    <div className="obs-calendar-grid">
                      {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
                        <span className="obs-weekday" key={day}>
                          {day}
                        </span>
                      ))}
                      {Array.from({ length: leading }, (_, i) => (
                        <span key={"blank" + i} />
                      ))}
                      {Array.from({ length: count }, (_, i) => {
                        const value = iso(new Date(Date.UTC(year, m, i + 1)));
                        return (
                          <button
                            key={value}
                            type="button"
                            aria-label={value}
                            aria-pressed={
                              value >= draft[0].slice(0, 10) &&
                              value <= draft[1].slice(0, 10)
                            }
                            data-endpoint={
                              value === draft[0].slice(0, 10) ||
                              value === draft[1].slice(0, 10)
                            }
                            onClick={() => pick(value)}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
            <div className="obs-calendar-presets">
              {" "}
              <ButtonGroup aria-label="快捷时间范围">
                {[
                  ["7d", "最近 7 天"],
                  ["30d", "最近 30 天"],
                ].map(([value, label]) => (
                  <Button
                    key={value}
                    appearance="segment"
                    selected={period === value}
                    onClick={() => {
                      onChange(value);
                      setOpen(false);
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </ButtonGroup>
              <span>UTC+08:00 · 最长一年</span>
            </div>
            <footer>
              <span>
                {!valid
                  ? error
                  : pickingEnd
                    ? "请选择结束时间"
                    : "起止时间精确到秒"}
              </span>
              <Button
                appearance="ghost"
                onClick={() => {
                  setOpen(false);
                  trigger.current?.focus();
                }}
              >
                取消
              </Button>
              <Button
                disabled={!valid}
                aria-label="应用日期范围"
                onClick={() => {
                  onChange(
                    `custom:${normalized(draft[0])}/${normalized(draft[1])}`,
                  );
                  setOpen(false);
                  trigger.current?.focus();
                }}
              >
                应用
              </Button>
            </footer>
          </div>
        )}
      </div>
      <div className="obs-refresh-controls">
        <Button
          appearance="ghost"
          aria-label="立即刷新"
          title="立即刷新示例数据"
          onClick={onRefresh}
        >
          <Icon name="refresh" />
        </Button>
        <label>
          <span>更新周期</span>
          <select
            aria-label="更新周期"
            value={cadence}
            onChange={(e) => setCadence(e.target.value)}
          >
            <option value="0">手动</option>
            <option value="15">15 秒</option>
            <option value="30">30 秒</option>
            <option value="60">1 分钟</option>
            <option value="300">5 分钟</option>
          </select>
          <Icon name="chevron-down" />
        </label>
      </div>
    </div>
  );
}

import fixture from "../../../../design/widget-monitoring-preview.json";
import {
  WIDGET_CATALOG,
  widgetSpan,
  type WidgetCategory,
  type MonitoringWidgetSize,
} from "../domain/widget-catalog";
import { MonitoringWidget } from "./monitoring-widget";
/** Only trusted, checked-in illustration fixtures use raw SVG/HTML. No remote content. */
export function WidgetMonitoringPreview() {
  return (
    <div className="wsr-monitoring">
      <main>
        <h1>Widget 监控语义</h1>
        <p>
          已接受的8类语义与尺寸配方。以下是示意数据；基座现由React模块渲染，专业图形仍为设计样本。
        </p>
        <table className="matrix">
          <thead>
            <tr>
              <th>类别</th>
              <th>适用尺寸（行×列）</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(WIDGET_CATALOG).map(([id, entry]) => (
              <tr key={id}>
                <td>
                  <a href={`#monitoring-${id}`}>{entry.label}</a>
                </td>
                <td>
                  {entry.sizes.map((x) => x.replace("x", "×")).join("、")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="note">
          Header / Content / Footer
          为可选组合；无内容的模块不占位。单格160px，跨格包含16px间距，3×3不用于单一数值或状态。
        </div>
        {fixture.groups.map((group) => (
          <section
            key={group.id}
            className="group"
            id={`monitoring-${group.id}`}
          >
            <div dangerouslySetInnerHTML={{ __html: group.description }} />
            <div className="examples">
              {group.cards.map((card, index) => (
                <div key={index}>
                  <div className="size">
                    宽 {widgetSpan(card.width / 160)} × 高{" "}
                    {widgetSpan(card.height / 160)}px
                  </div>
                  <MonitoringWidget
                    category={group.id as WidgetCategory}
                    size={
                      `${card.height / 160}x${card.width / 160}` as MonitoringWidgetSize
                    }
                    title={card.title}
                    status={
                      card.status ? (
                        <span
                          dangerouslySetInnerHTML={{ __html: card.status }}
                        />
                      ) : undefined
                    }
                    visualization={
                      <div
                        className="monitoring-fixture-content"
                        dangerouslySetInnerHTML={{ __html: card.body }}
                      />
                    }
                    footer={card.footer}
                    actions={
                      <span dangerouslySetInnerHTML={{ __html: card.action }} />
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

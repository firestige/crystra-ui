# Widget 监控语义与底座契约

本文记录已有 MonitoringWidget / 指标适配 API。当前视觉及后续组件化以 [表达设计](../../docs/design/crystra-ui/components/widget-expression-design.md)和 [Widget / 展示组件 / Dashboard 契约](../../docs/design/crystra-ui/components/widget-component-contract.md)为准。下文旧分类与样本不替代最新表达规则；稳定实例内部状态、公开消费定义和独立 Chart API 尚未实现。

状态：已接受，底座已落入 wsr-ui-core。监控语义是 Widget 的设计入口；旧文字基座不再作为设计方案。React + TypeScript 实现，沿用现有 Tailwind/CSS 资产管线，不引入 MUI 或 Vuetify 实现。

## 分类与容量

尺寸写作行×列。外边框到外边框：宽=列×160px+(列-1)×16px，高=行×160px+(行-1)×16px，包含 padding 与 border；跨格包含内部间距；不随根字号缩放。

| category   | 语义 / 内容                                           | 允许尺寸           |
| ---------- | ----------------------------------------------------- | ------------------ |
| status     | 状态信号：一个状态、等级或需关注数量                  | 1×1                |
| value      | 当前量值：单一数值与单位                              | 1×1                |
| progress   | 进度与容量：目标/分母明确的数字、线性条；2×2 可用环形 | 1×1、1×2、1×3、2×2 |
| comparison | 基准对比：当前值、明确基准和差值                      | 1×2、1×3           |
| trend      | 时间趋势：紧凑单序列；大尺寸完整坐标轴、图例          | 1×2、1×3、2×3、3×3 |
| breakdown  | 组成与分布：简要拆分；大尺寸多维分析                  | 2×2、2×3、3×3      |
| history    | 状态历史：时间轴、多条状态带及图例                    | 2×3、3×3           |
| records    | 记录明细：表格、事件/日志列表                         | 2×3、3×3           |

`WIDGET_CATALOG` 是代码侧闭合尺寸表，非法组合在渲染时拒绝。1×2 是 336×160px，1×3 是 512×160px，2×3 是 512×336px，3×3 是 512×512px。不能为了放大单个数字或填充文字选 3×3。图表复杂度增加时应重新选择语义类别与容量，不自动拉伸原配方。

## 模块和 API

`MonitoringWidget` 必填 `category`、`size`，内容均为 ReactNode：

| 模块           | 槽位                               | 职责                                   |
| -------------- | ---------------------------------- | -------------------------------------- |
| Header（可选） | leading、title、subtitle、status   | 对象、说明、图标或状态；不强制填满四角 |
| Content        | primary、visualization、supporting | 主要结论、图形及有限补充，按此顺序组合 |
| Footer（可选） | footer、actions                    | 来源/时间等标记和独立操作              |

无 Header/Footer 内容时整块不渲染，不预留空白高度。Content 保留剩余可用空间，允许空数据的中性占位。底座不推断业务状态、不生成假进度，也不自动把未知渲染为正常。状态必须有可读文字，不能只靠颜色。正式图标使用 Iconify。

原生 article 的 `id`、ARIA、data 属性、事件和 `className` 可传入；`title` 用作内容槽位。宽高由 size 管理，不开放 style 尺寸覆盖；自定义 class 不得改写固定尺寸契约。底座不会自动给整张卡添加点击行为，补充操作由 actions 中的语义按钮提供。

```tsx
import { MonitoringWidget, Button } from "wsr-ui-core";
import "wsr-ui-core/styles.css";

<MonitoringWidget
  category="value"
  size="1x1"
  aria-label="当前请求耗时"
  title="请求耗时"
  primary={<strong>42 ms</strong>}
  footer="本次采样"
  actions={
    <Button size="compact" onClick={openDetails}>
      详情
    </Button>
  }
/>;
```

底座的圆角 12px、内边距 12px、模块间距 12px、Header/Footer 内间距 8px 来自已接受的监控示意。组件内部间距不推导页面布局。基础样式独立于 `.wsr-monitoring` 展示容器，背景/文字/边框继承 Crystra 语义颜色，未设置主题时采用已接受的暗色回退值。可通过 `--crystra-widget-surface/text/border/secondary/muted` 局部调整对应颜色；这些是角色映射，不新增语义色系。所有样式排除宿主 `data-host-owned` 子树。

底座负责边界与模块排布，renderer 负责文字、图形、轴、图例和信息密度。默认不扩张外框；明细滚动必须在 visualization 自身的有界区域实现。用于 control-bench 时遵守页面的整卡高度上限，长内容使用既定全 bench 展开组件，不把卡片跨页拉长。

## 实现和迁移边界

- `src/components/monitoring-widget.tsx`：独立底座；`src/monitoring-widget-base.css`：正式基础样式。
- `src/domain/widget-catalog.ts`：8 类语义与合法尺寸；新增类别/尺寸需同步此契约与示例。
- `widget-monitoring-preview.tsx` 与 `design/widget-monitoring-preview.json`：10 个已接受的设计样本。内嵌 SVG/HTML 是受信的本地 fixture，不是业务数据渲染接口；样本 CSS 仅供展示，不进入正式包入口。
- 旧 `Widget` 保留兼容导出并标记 deprecated；新代码使用 `MonitoringWidget`，不继续演进文字槽位试排。
- numeric-card、badge、ratio-bar、table 已有新的监控投影，DashboardGrid 统一提供固定单格与间距；接入范围与旧 API 兼容关系见下节。

验证覆盖分类尺寸拒绝、空模块省略、10 个预览的准确外框尺寸，以及离开展示容器后的独立排版。

## 指标与页面接入（2026-09-08）

`MonitoringMetricPanel` 已导出：输入正式 `MetricResult`、可选 `visualizer`、`size`、`title`、`onEvidence`、`onExplain`。numeric-card 映射 value，badge 映射 status，ratio-bar 映射 progress，table/多切片映射 records。缺值保持事实状态，非法结果显示不兼容；只有范围在 [0,1] 且分母为正的比例才绘制进度条。

卡片显示主要信号与必要事实状态，操作入口按业务语义可选。当前预览为审阅完整数据而提供详情入口，不构成所有Widget的默认操作契约。完整精确值、覆盖率、兼容性、缺失输入及证据动作保留在原 MetricPanel 中，通过 OwnedInspector 打开，支持 Escape 和焦点返回。摘要截断不删除详情数据。布尔结果使用可读 True/False 及 Iconify 标记。

Library Preview 四个BI分页采用160px单格+16px固定间距，替代旧160px整数倍外框裁定。Dashboard中的Widget在编辑模式右键，通过上下文菜单按语义选档，禁用自由拖拽缩放；位置拖动、编辑、取消、删除和导入保留。尺寸变化会避让相邻卡片，宽高和位置以240ms动画过渡，遵守reduced-motion。DashboardGrid exactWidgets选择Widget尺寸契约；普通Card布局不受该契约覆盖。

`CompareResultFrame monitoring` 保留左右指标身份与回调，完整比较使用一个 comparison 1×3 Widget，基准、对照和差值为内部信息列；增加/减少不自动表达好坏。证据页采用同一主题、状态信号和 Iconify 标记，证据列表与 Inspector 保持完整内容，不强塞进单值 Widget。

旧 MetricPanel / DashboardMetricPanel 继续兼容，也作为详细数据视图；本次未增加趋势、环形或其他专业图 renderer。它们仍按前述分类逐项实现。

AVAILABLE 的摘要呈现：1×1 用绿色 Iconify `tabler:circle-check`，保留 Available 可访问名称与悬停提示；较大 Widget 与记录表状态单元格用绿色 soft Chip。其他事实状态不改为成功色。该规则随 MonitoringMetricPanel 在四个分页共用。

1×1 紧凑配方：48px对象图标居中，完整标题与坐标放入实际tooltip，不直接渲染标题。主内容保持数值或状态文字，True默认不显示重复对勾；非AVAILABLE状态仍显式显示。较大Widget保留统一字号文字标题。

Tooltip 实现已改为 WidgetTooltip 实际浮层，不依赖浏览器原生title。标题、布尔主图标、可用状态和详情入口在hover或键盘聚焦时显示说明；浮层通过portal脱离卡片overflow裁剪并避让视口边缘。Escape、失焦、点击操作或滚屏时关闭；点击详情先关闭提示，保留Inspector的Escape关闭语义。

已接受的48px对象图标以既有primary蓝强调图标，描边1.5px，1×1数值与状态文案使用常规字重；不把布尔True/False自动映射为成功/错误。为保持160×160px外框，紧凑模块间距为4px，详情入口和tooltip保留。

True 主内容默认只显示状态文字与tooltip，移除重复对勾；顶部对象图标保留。仅调用方明确提供自定义booleanIcons.true时才显示对应图标。

Widget标题统一使用同一语义字号：默认14px、行高20px、常规字重400。中文/英文、短标题/完整标题、有无图标均不改变字体级别；图标尺寸仅控制图标。长标题通过省略与tooltip处理，不缩小字号。

尺寸单一来源：WIDGET_CATALOG定义语义容量；MONITORING_RENDERERS声明类别与必要的渲染限制；monitoringSizes生成菜单。value/status只有1×1，线性progress为1×1/1×2/1×3，records为2×3/3×3。环形2×2属于进度语义但不属于线性条配方，不制造无对应表达的尺寸选项。

## 可选操作与上下文菜单

“查看卡片详情”不是标准答案，也不是底座必填项。单值/状态已经表达完整时不设置详情；存在更完整图表才提供“展开”，列表存在省略记录才提供“查看全部”，确有证据可追溯才提供“查看证据”。操作必须有真实目标与明确文案，不能为了填满角落而增加入口。actions保持可选，无操作时不占位；tooltip仅提供短说明，不代替完整内容视图。当前MonitoringMetricPanel预览适配器的详情入口用于审阅完整MetricPanel数据，不能据此推导正式业务Widget都必须有详情。

更改大小使用编辑模式下的右键上下文菜单，不使用卡片上的下拉单选。菜单仅列出monitoringSizes计算出的合法档位，并标记当前尺寸；选择后关闭菜单并执行原有240ms缩放与避让动画。支持Shift+F10/菜单键打开、方向键选择、Enter确认、Escape关闭；点击外部关闭。

拖拽反馈：隐藏编辑底图的网格线和卡片虚线框。真实卡片保持内容、跟随鼠标；同时在其下方渲染灰色空白ghost，不遮盖真实卡片且不接收指针事件。Ghost按此刻松手后的网格吸附、相邻卡避让与居中结果定位，不是原位置占位，也不追随鼠标自由移动。松手后真实卡片落到ghost位置，ghost消失；尺寸选择动画仍保留。

Widget与Card边界：m×n属于Widget的尺寸语义，不属于grid容器，也不由monitoring模式定义。被替代的是外框简单等于160px乘倍率的算法；Widget跨格外框必须包含内部间距。普通Card即使放在grid中也不套用Widget尺寸公式或分类档位，不自动收缩为Widget。尺寸档位由Widget语义类别及renderer决定，几何公式只计算对应外框。

对比Widget当前试稿：一个Widget表达一个独立比较概念；内部共享指标标题、两侧对象标签、基准值、对照值与差值，说明和证据按两侧保留回调。不得嵌套三个独立Widget。比例差用pp（百分点），不误写为相对增长率；蓝色强调不判定好坏。Library提供两个虚构样本，当前1×3排版待主观审阅。普通面板的旧CompareResultFrame路径保持兼容。

方向标记试稿：差值前使用本地Iconify实心上/下三角，暂按国内股市习惯红涨绿跌，持平用中性横线；颜色只编码数值方向，不代表成功/错误或业务好坏。保留有符号差值、单位和可访问名称，缺少差值时不显示方向。新增图表色不扩展页面主题色系。比例差以百分点pp展示，不能混同相对变化率。

参考：[Power BI条件格式](https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-conditional-table-formatting)支持按数值规则配置图标及颜色；[TradingView PnL显示](https://www.tradingview.com/support/solutions/43000761181-i-d-like-to-change-how-pnl-is-shown-on-the-chart/)区分绝对金额与相对百分比。此处借鉴表达方式，红涨绿跌是本地试稿选择，不声称是金融BI通用配色。

1×1主内容排版：主数值、单位、状态文案及缺值说明水平居中，与中央指标图标共用视觉中轴；该规则只应用于Content，不改变左下角辅助状态或右下角可选操作的位置，也不推广到较大尺寸。

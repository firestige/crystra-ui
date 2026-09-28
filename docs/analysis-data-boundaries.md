# Analysis 分包与数据分层约定

状态：2026-09-28 用户确认；替代将 Analysis 业务层、查询层整体划入 Crystra-dsh 的初版设计。
本约定记录目标架构，不表示下述迁移已经完成，也不改变 Evidence/Observation/Evaluation Contracts。

## 判定原则

**是否依赖 DSH 专有能力决定 package 归属；展示、业务、查询是职责层次，不直接对应 package。**
Crystra-ui 不仅提供显示组件，也可以提供领域 hook、查询 support、数据适配和工具。
不能因为代码调用查询或包含 Analysis 业务规则，就把它归入 Crystra-dsh。

| 能力 | 归属 |
| --- | --- |
| Panel/Chart、各图形 interface 与 type 联合、共享 UI 交互 | Crystra-ui 展示模块 |
| Analysis 业务 hook、跨查询组合、语义关联、聚合、格式转换、能力适配 | Crystra-ui Analysis 模块 |
| 通用请求资源、分页、缓存、去重、取消、错误机制及 React hook | Crystra-ui support/data 模块 |
| Evidence/Evaluation 响应校验、反序列化、类型/版本/分页适配 | Crystra-ui Contract adapter |
| DSH page/slot/路由装配、宿主加载策略、资源实例生命周期 | Crystra-dsh |
| DSH RPC、鉴权接入、访问地址配置、主机 gateway | Crystra-dsh host adapter，向共享模块注入 |

Crystra-ui 的上述模块不 import DSH SDK、不读取 DSH 全局配置、不硬编码部署地址。
业务 hook 接收客户端/transport 与配置。宿主变化可以替换 transport，而不重写业务
数据处理、缓存和分页机制。通用 HTTP adapter 可以复用；DSH RPC adapter 留在 DSH。
优先使用标准 JavaScript/Web API；查询核心不绑定 React，React hook 是薄封装。
不应无故限定为 Node-only；需要文件系统等运行时能力时通过适配接口隔离。

资源实现归属与实例生命周期归属分开：DSH 创建/共享/销毁资源实例，不能据此推导
资源实现必须在 DSH。相同查询机制跨宿主复用，宿主注入预算、刷新/加载策略和权限范围。

## 三层数据流

1. 查询层：调用注入 transport，调用反序列化/校验，管理分页、缓存和请求状态。
2. 业务层：选择/组合查询，以确切语义 ID 关联结果，过滤、聚合并生成对应 chart interface 的数据。
3. Panel/Chart：接收按 type 区分的图形数据与展示状态，负责绘制和展示交互。

业务规则可进入 Crystra-ui 的业务模块，但不进入 Panel/Chart 组件。
Contract adapter 知道服务协议，不知道 DSH；host adapter 知道 DSH，不实现指标公式。
TypeResolver 不直接生成图表；业务 projector 不执行网络请求。
共享支持工具不反向依赖 Analysis 指标、WidgetData 或 DSH。

## 保留的数据处理约束

- 前端统计只使用已取得的数据，不扩展样本范围；延时样本可求 P95/P99，P95 不能推出 P99。
- 小数据可完整有界加载后本地分页；大数据必须按服务能力分页，不能默认拉完。
- 本地展示变化尽量复用缓存；缺少范围/粒度才查询。不把当前页统计冒充整体统计。
- 转换输出无需附加计算/来源历史；导出原始数据表格与图表。必要源状态留在查询/业务层。
- Evidence 负责事实与元数据；Evaluation 负责权威指标；不因分包调整修改后端语义。

## 当前状态与待迁移项

2026-09-28 实施更新：通用资源/hook/测试位于 Crystra-ui `support/data`，DSH 原副本已删除。
时间范围 Evaluation、Delivery 元数据目录、选中 Trace 的独立查询与业务投影已接入；DSH 注入 RPC transport 并装配页面。
总览不再使用 Task compute，调用追踪不触发 Evaluation。分页游标支持无限滚动与最多 30 行 DOM 窗口，当前查询已加载页仍缓存。
DSH 使用 localStorage 保存已接受的布局/观察设置；UI 负责结构验证，不用指标可用性删除旧配置。
新 Delivery 的采集闭环仍待正式执行入口验收；跨查询历史缓存、部分指标适配和原始表格/图表导出不在本轮交付中。
当前绑定、接口候选与验证见 [接入记录](analysis-metric-bindings.md)。

详细候选与接口差距：
- [三层设计及 Chart envelope](../../wsr-dsh/src/client/analysis/data-design.md)
- [查询 hook 设计](../../wsr-dsh/src/client/analysis/query-design.md)

文档位置暂沿用既有分析草案所在仓库，不代表其中能力的代码归属。
实施验收应检查：共享模块无 DSH 依赖，替换 transport 后相同测试可复用，宿主页面
只协调装配，不复制分页/聚合/Contract 解析逻辑。

## Chart 类型约定 — 2026-09-28 用户确认

每种 chart 一个 interface，以唯一的 `type` 字面量组成 TypeScript 可辨识联合。
组件直接接受对应 interface；统一入口用 switch 收窄、never 检查穷尽，业务输出可用
satisfies 校验。必选/可选字段通过 TS 表达，不引入通用 ChartTable/ChartBinding
schema、配置类、动态解析器或必选字段规则引擎。该决定替代初版通用表格 envelope。
Panel 外壳负责标题/布局/状态；业务层负责转换成目标图形数据；已有 renderer 继续复用。
类型检查不替代外部数据的反序列化校验，数据入口仍负责验证服务响应。
NumberChartData 类型与投影函数保留；临时三卡组件已移除。其余 WidgetData/View 入口尚未整体迁移，不能以此次交互恢复宣称 per-chart 类型迁移完成。

## v8 交互纠正（2026-09-28）

总览是全系统时间范围，无 Task 选择器、来源下钻或三卡替代布局。
调用追踪按全局范围检索 Delivery，Task 仅为检索/上下文；对比分析在全局范围内选择 Delivery 子集。
共享分析页保留两个主题和 Widget 布局；未接入值为 null / 空数组，明确显示未接入，不能用零或 fixture 替代。
Widget 定义、默认布局、观察指标配置目录属于 UI 配置，不能视为生产 metric catalog 或服务能力声明。
刷新控件保留但在缺少时间范围查询时禁用并解释；不把 Task 全历史 compute 当作时间范围刷新。

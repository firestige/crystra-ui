# Analysis v8 数据接入：指标绑定与查询扩展

2026-09-28，新一轮接入。基线提交：UI `78f4198` / DSH `ac99306`。
这是 UI 侧映射与接口扩展候选，不修改已有 Contracts；当前工作区候选已接入本地 3085，未发布。

## 目录与刷新收敛（2026-09-28，覆盖下文早期目录限制）

- `useRecordedDeliveries` 仅请求 Evidence 的 Delivery 元数据目录；不为列出目录下载全部 Trace。
- `useDeliveryTrace` 在用户选中后请求该 Trace，携带相同落库时间范围；分页未完成时明确提示。调用追踪页禁用 Evaluation 请求。
- `/v1/evidence/deliveries` 是本地加法式查询候选：必填 recorded_from/to，支持 delivery_id、task_id、task_name、workflow_id、workflow_version、limit、cursor。精确 ID 过滤，task_name 为字面包含查询。响应为 contract{name,revision}、snapshot、total、items、next_cursor；每项包含 delivery_id、trace_id、task_id、task_name、workflow_id、workflow_version、started_at、recorded_at。未知元数据为 null。trace_id 不存在不妨碍目录展示；多 Trace 冲突由 Evidence 拒绝，不由 UI 猜测。
- 完整范围搜索在服务端执行；已加载数据的二次筛选留在前端。total 是完整服务端查询结果数，与本地筛选命中数分开展示。分页/游标与无限滚动兼容；目录最多挂载 30 行，已读取页仍由查询资源缓存。
- 相对日期范围在每次刷新重新解析；UI 日期统一转为 Evidence 落库时间区间。当前日期跨午夜变化不会继续复用昨天的查询键。
- 配置的结构类型/验证属于 UI；DSH 使用 localStorage 持久化布局与观察设置。校验不依赖可用指标清单，不存 Observation 或临时选中项。

## 指标扩展边界（2026-09-28，优先于下方指标差异清单）

指标可随产品版本增加、移除和升级。v8 某项指标暂缺不阻塞本轮集成；必须保证单项变更不使其他指标、查询 hook、页面协调或保存的布局失效。下方清单仅记录语义映射与来源限制，不是必须补齐的发布清单。

| 层          | 责任与扩展位置                                                                                                         | 不承担的责任                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Evaluation  | 计算器、发布目录、输入归一化；`calculators/bindings.py` 声明计算器与输入绑定，两个 compute 入口共用                    | 不把某个 UI 面板的布局写入 MetricResult                  |
| UI 查询层   | 校验 wire envelope、数据结构、唯一坐标、范围、receipt，提供缓存/分页/异常处理                                          | 不固定指标个数、目录摘要、目录版本或某份指标 ID 白名单   |
| UI 业务层   | `MetricAdapter<T>` 按明确的 metric ID + version 将结果绑定为类型化数据；Token 适配在 `analysis-metrics/token-usage.ts` | 不根据新版本 ID 猜旧公式，不将缺失值填零，不扩大查询总体 |
| panel/chart | 消费已有 TS chart interface；缺项只影响对应展示                                                                        | 不发请求、不解释 Evaluation 发布目录                     |
| DSH page    | 布局、宿主 transport/地址、生命周期协调                                                                                | 不注册计算公式或指标解析规则                             |

`bindMetric<T>` 区分 available / missing / incompatible；泛型 T 可以是 chart interface 或业务中间类型。它不是配置解析器。添加一种指标时增加独立适配器和对应面板绑定；已有 hook、分页缓存和通用 chart 不需要跟随修改。新增图表类型才新增对应的 TS interface/renderer。

同一 wire 协议内，合法的新指标/新指标版本被保留；业务只消费明确支持的版本。目录是发布元数据，不能把摘要变化等同于整个响应不兼容。API/Observation 协议版本、结构错误、重复坐标、错误查询范围仍严格校验。预置布局的指标列表只是该 UI 版本的默认内容，已从请求解析器移到 `domain/catalog/coordinates.ts`；旧导出保留兼容。

保存的布局和焦点路由按合法指标坐标解析，不用当前目录做存在性白名单。指标移除后保留配置并显示局部不可用，不静默删除，不替换成另一版本。

### 当前后端契约边界

现有 Evaluation Catalog 2.0 候选明确要求本发布返回完整目录。因此后端 `SideResult` 仍按本发布目录检查完整性；范围查询缺少完整 Task/template 总体时，注册项返回既有 MISSING_INPUT。这是当前发布的输出约定，不是 UI 对固定 12 项的依赖；不能在同一目录版本下偷偷删除结果。

下一次正式增减指标需要由 Evaluation/Contracts 所有者更新发布目录及其一致性测试。`MetricVersion` / `CatalogVersion` / `CatalogDigest` 的 Literal 发布声明已统一放入 `catalog.py`，API 模型引用这些类型，compute 通过常量生成 receipt。后续版本更新集中于目录与对应计算器/绑定，不要求修改通用 API 模型、两个 compute 入口或 UI 查询器。本轮维持原有发布声明值和校验语义，不宣称支持未经发布的动态热插拔。

### 回归标准

- 新增、删除、升级、空目录均可经过原查询对象；非法/重复坐标仍拒绝。
- 同名新版本不套用旧 Token 公式；无关指标变化不影响已有 Token 展示。
- 移除指标不清除保存的布局或路由；其他面板正常显示。
- Evaluation 计算器绑定增减不要求在两个 compute 入口分别增加分支；发布目录一致性仍在后端验证。

## 已固定的约束

- 总览使用全局时间范围，无 Task 选择器；调用追踪选择一个 Delivery；对比分析可以缩小为 Delivery 子集。
- 2026-09-28 用户明确：UI 时间范围统一按 Evidence 数据落库时间筛选。Evaluation 按同一范围取得 Observation 后计算 metric。此前提出的“调用发生时间 / Delivery 开始时间”二选一作废，不作为查询语义。
- 调用起止时间只用于既有指标的耗时计算、轨迹排序与展示，不决定 Observation 是否进入时间范围；不因选中 Delivery 就扩充到其范围外全历史。完整性由 Evidence/Evaluation 负责，UI 不补齐或推算。
- 既有 MetricResult / MetricSlice 是结果权威。不得重新命名其计算总体来适配不同含义的面板。
- 每种 chart 用自身的 TypeScript interface。多 series、维度分组、表格转换不要求新的服务 envelope。
- 查询缓存/分页/反序列化与业务组合属于 Crystra-ui；DSH 只提供宿主 transport、路由、配置。
- 本文“可绑定”均以范围选择能力接通为前提，不表示 Task 全历史结果可以绑定到时间范围面板。

## 逐项映射

| v8 展示项 / 配置 ID                                       | 已有供给                                                                   | 绑定结论                                                                                                                        |
| --------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 按量实际费用 `spend` / 对比费用 `cost`                    | operational-attributable-cost；trajectory-partial-cost                     | 有费用指标。必须保留 reported unit 与 kind/source/source_id 分组；当前不保证完整账单或按量/订阅分离，不能直接改名为全量按量账单 |
| 订阅用量等价估值 `equivalent`                             | 无等价估值 metric                                                          | 缺订阅分类、有效价格与估值口径；不是重建费用指标                                                                                |
| API 请求数 `calls`                                        | Trace model-call 节点；operational-latency-ms contributing_count           | Trace 可统计记录调用；contributing_count 只覆盖该指标的有效样本，不能代替全部请求数；网络重试总体需明确                         |
| Tokens `input` / 对比 input, output, tokens               | operational-token-usage，direction 切片及精确值                            | 输入/输出分别绑定；同范围、同兼容维度且两侧都有值时可组合总量；不能把缺失方向补零                                               |
| 每日费用 `costTrend`                                      | 同费用 metric，当前无日桶                                                  | 需时间分桶或可归属费用明细；不能把周期总费用按天摊平；订阅估值仍单独缺口                                                        |
| 每日 API 请求 `callTrend`                                 | model-call 身份；时间归属使用 Evidence 落库时间                            | 小范围可按实际样本的 Evidence 落库时间分桶，大范围需有界样本/计数查询；不是新建图表服务                                         |
| 每日 Token `tokenTrend`                                   | model-call 输入/输出 Token；时间归属使用 Evidence 落库时间                 | 小范围可按 Evidence 落库日分桶；有界读取与缺失状态必须明确，不能用周期汇总还原趋势                                              |
| Provider 缓存命中率 `cache0` / 对比 cache,cached,uncached | 现有 profile 的 input/output Token 不含缓存分类                            | 缺缓存 Token；operational-usage-availability 是用量可用率，不是缓存命中率                                                       |
| 订阅费与覆盖期 `subscription`                             | Manifest 是执行配置元数据，不是账单                                        | 缺订阅记录；不假造 Provider、币种、价格、周期                                                                                   |
| Role 平均执行时间 `roleDuration`                          | operational-latency-ms 是 model-call 时长；Trace invoke_agent 时间可能存在 | 不是同一计算单位。需确认 invoke_agent 与 Role execution 的精确对应及样本总体；不能直接替换                                      |
| Role × Model 单位执行费用 `roleCost`                      | role-template-trajectory-partial-cost；operational-attributable-cost       | 前者按模板暴露的 Delivery 轨迹，后者按调用；都不能直接代表一次 Role execution 费用，需执行单位/归属对应                         |
| Role × Model 返工率 `roleRework`                          | role-template-rework-rate                                                  | 指标已定义，但单位是暴露于精确模板的终止 Delivery，不是 Role execution × Model；保留 UI 需求差异，不新增同义指标                |
| 最长无介入运行 `autonomy`                                 | delivery-cycle-time-ms、Trace 时长、intervention Facts                     | 总周期不能推出连续自主区间；需运行/暂停/恢复/介入的精确边界                                                                     |
| 人工介入趋势与原因 `interventions`, `interventionKinds`   | intervention Fact，当前 USER_REDIRECT                                      | 记录可计数，但不能推成三类原因；按 Evidence 落库时间统计；无需为查询范围引入介入发生时刻                                        |
| 对比 TTFT `ttft`                                          | operational-latency-ms                                                     | 已有的是完整模型调用时长，不能作为首输出时延或其 P50/P95；真实耗时样本可计算耗时分位数，但不改变 TTFT 的含义                    |

已有而 v8 默认面板未直接使用的指标：delivery-terminal-outcome-rate、delivery-cycle-time-ms、delivery-stage-reach、task-cohort-comparison-eligibility、role-model-task-outcome-rate、operational-usage-availability。
不为“让页面有数字”擅自替换默认面板；未来可作为明确命名的可选观察指标。

## Evidence 元数据复用

- `/v1/evidence/tasks?task_id=…&as_of=…`：成员关系、Delivery ID、Manifest digest。
- `/v1/evidence/manifests?manifest_digest=…`：精确 Manifest 投影。
- `/v1/evidence/traces?delivery_id=…`：所选 Delivery 的实际 Trace。
- `/v1/evidence/facts?delivery_id=…`：对应事实。
- 旧版 Task selection receipt 携带对应 Task 人口、成员与 Workflow 解析信息；recorded-range receipt 仅记录实际区间、选择条件和 Evidence 读取绑定，不代表完整 Task/Workflow 元数据，目录另从 Evidence 读取。

本轮新增 `createDeliveryTraceQuery` 复用既有 Trace decoder 与分页资源，直接读取 Evidence，
不经过 compute、不遍历全部 Task。该适配保留 snapshot/trace summaries，切换范围由持有者销毁旧资源。
这不是全局 Delivery 目录，不把精确查询包装成全局时间检索。

`createTaskMembershipQuery` 复用既有 `/tasks` 成员查询，由 DSH 的
`tasks/membership` transport 转发。请求固定精确 Task、`as_of` 和分页大小，
保留 Delivery ID、Manifest digest、provenance 与 snapshot。
`as_of` 是成员查询的接收截止时间，单个上界不能代替总览所需的完整落库时间区间；该查询只供已有 Task 范围的元数据组合，
不能用于枚举全部 Task 后模拟时间目录。分页快照变化时保留已加载数据并报告错误。

## 最小时间查询扩展候选

优先延用 compute 的 SINGLE/COMPARE、MetricResult、MetricSlice、Delta 结构；扩展的是 selection 和 receipt。

已确认的查询语义及需要核对的接口支持：

| 信息         | 要求                                                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 时间区间     | 统一按 Evidence 落库时间；复用已有 recorded_from/recorded_to 及边界语义。UI 日历范围转换为 UTC 请求，不新增执行事件时间选择器                  |
| 数据总体     | 全局范围可以不带 Task ID；可选 Delivery 子集与时间集合取交集，空交集不能恢复全选                                                               |
| 时间匹配单位 | 范围内落库的 Observation 是查询及计算总体；Delivery 目录从该总体取得 Delivery 元数据，不以 Delivery 开始时间筛选，也不扩充为整条 Delivery 历史 |
| receipt      | 记录实际选择条件及解析后的集合；不得把时间范围伪装成 Task selection。metric_results 结构复用                                                   |
| 分页和预算   | 目录保留分页快照、稳定排序；结果总数/全选覆盖完整查询集合，不能只统计已加载页；compute 保持其现有预算与类型化错误                              |
| 刷新         | 同一范围一次查询供多个 panel；取消旧请求并隔离迟到响应。未接通前禁用，不用 Task 全历史查询兜底                                                 |

不预先在生产请求中增加未获服务接受的字段或猜测新 URL。时间条件与可选 Delivery selection 一并设计，避免总览接通后对比分析再次改协议。

## 当前实现与验证（2026-09-28）

1. **时间查询**：Facts 复用既有 `recorded_from/recorded_to`；Traces 已扩展为支持完整落库时间区间，可与精确身份求交。都使用数据库 `recorded_at`，包含上下界，最长 366 天，分页大小最多 200。全局 Trace summary 上限 500，超过返回查询边界错误，不静默截断。
2. **Evaluation**：现有 compute 增加 `selection_version: 2`（`recorded_from`、`recorded_to`、可选 `delivery_ids`）；不传子集表示全局，空数组表示空集。旧版 Task selection 保留。结果仍是原来的 12 项 MetricResult，receipt 用 `context_version: 2` 记录实际范围和 Evidence 遍历。
3. **已有计算器复用**：范围服务复用 8 项调用/Delivery/用量计算器。Task cohort、Role template 相关的 4 项由于未解析完整 Task/模板总体，明确返回 `MISSING_INPUT`；没有制造完整 Task 总体或改写 metric 含义。这部分仍需后续元数据组合。
4. **旧 Observation 兼容**：部分 profile 1 Fact 不包含 Delivery 字段。服务只在需要时调用 Evidence 的精确 Delivery + 同一落库区间查询补充归属；不得根据事件名称猜测，不读取范围外 Observation，不接受补充查询扩大初始记录集合。
5. **UI**：通用查询、业务组合、订阅 hook 在 Crystra-ui；DSH 只组装路由、transport、页面受控状态。总览、查询图表和对比图表已绑定 Token 指标，支持 provider/model/role 分组；尚无匹配数据的面板保留 unavailable。对比子集触发独立范围请求，空子集不回退全局。分页中“选中已加载项”和“恢复全局”是不同动作。
6. **Delivery/Trace**：目录直接从 Evidence 独立元数据查询取身份和元数据，不合并本机 Execution Task；加载更多沿用服务分页。执行开始时间用于显示，范围过滤使用落库时间。跨页记录尚未加载完时，页面说明还有后续记录；目录只显示已解析身份，不宣称已加载行数等于全局总数。
7. **真实环境**：3085 已接入本地候选。现有 2026-09 范围有 2 个 Delivery、6 条输入记录；Evaluation 已返回终止结果和平均周期，模型调用 Token 等数据仍缺失。未向真实 Evidence 写入测试 Observation，新增 Delivery 的采集闭环尚未验证通过，见文末验收边界。

### 验证边界与剩余工作

- PostgreSQL 时间/分页测试使用独立临时数据库；native Span 时间设为 1970 年仍能按 2026 年落库时间命中，范围外记录被排除。
- 浏览器实测：最近 30 天目录返回 2 个 Delivery，展开目录、选择轨迹及手动刷新均通过；无页面异常、无 Task 列表查询。
- 修复原有 Evidence 解码器漏收 C/I/S 字段 ID 的问题，保留语义排序与重复字段校验，不修改服务字段格式。
- UI 使用后端实际序列化的测试响应校验解码；`coverage: null` 保持为必需的 nullable 字段，不因 API 排除可选 null 字段而丢失。
- 非阻塞的指标差异：部分 v8 指标来源、日期/Workflow 版本切片、Task/Role-template 总体的范围适配尚未提供，可随后续指标版本演进，不是本轮必须补齐的目标。目录已改为独立元数据查询，支持只有 Fact 的 Delivery；不再以全体 Trace 加载替代目录。
- 当前为未发布的本地工作区候选；未修改 Contracts 仓库和 Observation 格式。服务请求扩展与 UI 适配应一起审阅，不能把新 selection 单独部署到旧 Evaluation。

正式连接与页面绑定已可读验证；新执行的端到端采集验证仍单独进行，不用模拟数据证明真实采集闭环。

## 依据

- `/Users/firestige/Projects/workflow-self-recursive/tmp/20260907/Crystra-ui-design/pages/analysis-audit.md`
- `/Users/firestige/Projects/workflow-self-recursive/docs/contracts/evaluation/metric-catalog-2-candidate.md`
- `/Users/firestige/Projects/workflow-self-recursive/docs/systems/evidence/delivery-manifest-projection.md`
- `/Users/firestige/Projects/wsr-evolution/src/crystra_evolution/api/models.py`
- `/Users/firestige/Projects/wsr-evolution/src/crystra_evolution/catalog.py`
- `/Users/firestige/Projects/wsr-contracts/observation/tools/validator.cjs`

## 本轮指标扩展边界验证

- UI：516 项 Vitest + 34 项脚本测试通过；typecheck、build、本轮修改文件 ESLint 通过。
- Evaluation：208 项测试通过；mypy、修改文件 Ruff 通过。既有目录和 wire 输出保持原发布语义。
- DSH：267 项测试、typecheck:workbench、build、boundaries:check 通过。
- 本地 3085 已安装本轮 UI 候选并重启 Evaluation 候选镜像；30 天范围、总览/对比切换、布局编辑取消、2 个 Delivery 的目录/轨迹选择和手动刷新通过，浏览器无 pageerror。1180px 宽下 header 无纵向滚动。
- 未执行新的 Execution 采集实验，当时尚未发布或提交；提交状态以 Git 历史为准。

## 本轮验证记录（2026-09-28）

- UI：524 Vitest + 34 script tests；窗口末端修正后对应 2 项测试及 typecheck/build 再通过。
- DSH：270 tests，通过 typecheck/build/boundaries；目录 Fetch 路由漏注册由浏览器 404 检出并已修复，新增正式路由回归用例。
- Evidence：161 unit + 18 integration tests，Ruff/mypy 通过。集成测试使用独立临时 PostgreSQL，已清理，未在实际数据仓库执行清库测试。
- 修复 RAW_DEBUG 过期误排除目录元数据的问题；新增先过期原始记录、再分页查询元数据的回归覆盖。Trace/Fact 的保留生命周期与原始报文独立。
- 3085 认证浏览器：布局写入 localStorage 后重载保留；现有两条 Delivery 能显示与选中；调用追踪期间无 Evaluation compute；手动刷新后图恢复；1180px header 的 clientHeight/scrollHeight 均为 87px，无页面横向溢出。
- **新 Delivery 采集闭环尚未验收**：在独立目录 analysis-loop-20260928 中建立正式 Workspace/Session 后，旧验收命令 `/crystra create hello-world-workflow@0.2.0` 被当前外部 Chat 当作普通文本处理，返回 Hello，未产生 Delivery。这只能验证 Chat 接入，不能证明 Execution → Evidence → Evaluation → UI 的新增数据闭环。后续必须通过当前 Task/Plan 的正式执行入口触发真实 Delivery，再核对落库、计算与 UI；不得据此将现有存量数据验证描述为新采集闭环通过。

本轮为未发布的本地集成候选；不包含新增指标或 Contracts/Observation 格式调整。

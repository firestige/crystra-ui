/** Static v8 design samples; no code from the source is executed.
 * Source SHA256: b5eefc9739ab1d995e4c10cbb0e90c8dcb2fa099cc4b707ec47a574a46b2af87
 */
export const taskGateProfiles = {
  g3: {
    id: "G-3",
    position: "1 / 3",
    impact: "阻塞主路径",
    subject: "签名配置重试",
    question: "是否允许 Wave 2 修改签名配置并重新执行？",
    trigger: "恢复策略已连续失败 3 次",
    location: "Plan Run 08 / Wave 2 / Gate G-3",
    status: "等待用户决定",
    decisions: [
      "保持公开 API 兼容",
      "禁止自动公开发布",
      "失败后必须回到人工关口",
    ],
    interpretation:
      "允许修改签名配置并重新执行 Wave 2；成功或失败后返回 Gate G-3，且不自动进入公开发布。",
    interpretationStatus: "等待明确确认",
    deltas: [
      {
        mark: "+",
        text: "新增 Wave 2 重试授权",
        tone: "blue",
      },
      {
        mark: "=",
        text: "发布权限没有变化",
        tone: "neutral",
      },
      {
        mark: "!",
        text: "修改签名配置可能触及既有“配置冻结”决定，确认前需要用户裁决。",
        tone: "warning",
        wide: true,
      },
    ],
    previewTitle: "确认后将执行",
    previewStatus: "尚未授权",
    steps: [
      ["恢复 Wave 2", "保持既有 Goal 与交付范围"],
      ["仅修改签名配置", "不改公开 API 与其他构建步骤"],
      ["重跑构建与签名验证", "保留仍有效的安全扫描证据"],
      ["返回 Gate G-3", "成功或失败均不自动发布"],
    ],
    preserved: "保持不变：发布权限、API 兼容要求、人工关口",
    evidence: [
      ["Wave 2 执行计划", "核对原定恢复边界", "打开 Plan 章节 →", "neutral"],
      ["第 3 次失败 Trace", "查看升级触发事实", "在分析中查看 →", "danger"],
      ["签名配置差异", "3 处准备修改", "查看差异 →", "neutral"],
      ["安全扫描结果", "既有证据仍有效", "打开证据 →", "success"],
      ["配置冻结决定", "可能与当前理解冲突", "定位原始决定 →", "warning"],
    ],
  },
  g5: {
    id: "G-5",
    position: "2 / 3",
    impact: "不阻塞主路径",
    subject: "发布说明覆盖率偏差",
    question: "是否接受发布说明覆盖率低于计划目标？",
    trigger: "2 项边缘场景缺少可验证示例",
    location: "Plan Run 08 / Wave 4 / Gate G-5",
    status: "等待用户决定",
    decisions: [
      "必须覆盖主要发布路径",
      "非关键缺口必须登记为残余风险",
      "公开发布仍需最终授权",
    ],
    interpretation:
      "保留当前发布说明，将 2 项边缘场景登记为残余风险并结束 Wave 4；不因此获得公开发布权限。",
    interpretationStatus: "等待明确确认",
    deltas: [
      {
        mark: "+",
        text: "接受 2 项边缘场景缺口",
        tone: "blue",
      },
      {
        mark: "=",
        text: "最终发布授权没有变化",
        tone: "neutral",
      },
      {
        mark: "!",
        text: "其中 1 项涉及 Node 22，可能提高后续兼容性支持成本。",
        tone: "warning",
        wide: true,
      },
    ],
    previewTitle: "确认后将执行",
    previewStatus: "尚未授权",
    steps: [
      ["冻结当前发布说明", "不再生成缺失的边缘示例"],
      ["登记 2 项残余风险", "保留缺口与影响范围"],
      ["将 Wave 4 标记为完成", "不改变其他 Wave 的状态"],
      ["等待最终发布关口", "不自动进入公开发布"],
    ],
    preserved: "保持不变：主要路径覆盖、最终发布权限、风险可追溯性",
    evidence: [
      ["Wave 4 文档计划", "核对原定覆盖范围", "打开 Plan 章节 →", "neutral"],
      ["覆盖率缺口报告", "查看 2 项缺失场景", "打开报告 →", "warning"],
      ["发布说明差异", "确认保留的当前版本", "查看差异 →", "neutral"],
      ["主路径验证结果", "必要路径均有证据", "打开证据 →", "success"],
      ["文档完成标准", "核对残余风险边界", "定位原始决定 →", "neutral"],
    ],
  },
  g6: {
    id: "G-6",
    position: "3 / 3",
    impact: "等待 G-3、G-5",
    subject: "最终发布授权",
    question: "是否允许候选包进入公开发布？",
    trigger: "最终发布属于预设人工权限边界",
    location: "Plan Run 08 / Final Gate G-6",
    status: "等待前置决定",
    decisions: [
      "禁止自动公开发布",
      "必要 Wave 必须形成退出证据",
      "残余风险必须显式呈现",
    ],
    interpretation:
      "尚无可执行决定。G-3 与 G-5 仍未解决；系统只保留候选包，不会请求或执行公开发布。",
    interpretationStatus: "等待前置决定",
    deltas: [
      {
        mark: "=",
        text: "没有新增发布授权",
        tone: "neutral",
      },
      {
        mark: "=",
        text: "候选包保持隔离",
        tone: "neutral",
      },
      {
        mark: "!",
        text: "G-3 与 G-5 尚未关闭，当前 Gate 不具备可决条件。",
        tone: "warning",
        wide: true,
      },
    ],
    previewTitle: "当前不会执行",
    previewStatus: "被依赖阻止",
    steps: [
      ["等待 G-3", "签名配置重试尚未裁决"],
      ["等待 G-5", "文档覆盖率偏差尚未裁决"],
      ["重新汇总最终证据", "前置决定可能改变证据有效性"],
      ["请求明确发布授权", "只有用户确认后才可迁移"],
    ],
    preserved: "保持不变：候选包隔离、公开发布权限、最终人工关口",
    evidence: [
      ["最终发布计划", "核对发布控制边界", "打开 Plan 章节 →", "neutral"],
      ["Gate 依赖关系", "G-3、G-5 尚未关闭", "查看依赖 →", "warning"],
      ["候选包清单", "当前产物保持隔离", "打开清单 →", "neutral"],
      ["最终验证摘要", "等待前置决定后刷新", "打开证据 →", "neutral"],
      ["发布权限决定", "必须由用户明确授权", "定位原始决定 →", "warning"],
    ],
  },
} as const;

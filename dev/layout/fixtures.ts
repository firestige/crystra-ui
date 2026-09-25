// Static analysis navigation only; Task and Workflow rows come from their owner queries.
export const sidebarFixtures = {
  analysis: [
    { id: "dashboard" as const, title: "总览", icon: "table" as const },
    {
      id: "traces" as const,
      title: "调用追踪",
      icon: "activity" as const,
      attention: 3,
    },
    {
      id: "reports" as const,
      title: "对比分析",
      icon: "arrows-exchange" as const,
    },
  ],
};
